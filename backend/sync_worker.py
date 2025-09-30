#!/usr/bin/env python3
"""
Background worker for syncing emails from Gmail API to local database
"""

import asyncio
import httpx
import base64
import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database.connection import SessionLocal
from models.user import User
from models.email import Email
from models.sync_state import SyncState
from services.email_service import EmailService
from services.token_service import TokenService
import os
from dotenv import load_dotenv

load_dotenv()

class GmailSyncWorker:
    def __init__(self):
        self.db: Session = SessionLocal()
        self.token_service = TokenService(self.db)

    async def sync_all_users(self):
        """Sync emails for all active users"""
        print("🔄 Starting email sync for all users...")

        users = self.db.query(User).filter(
            User.is_active == True,
            User.google_access_token.isnot(None)
        ).all()

        print(f"📧 Found {len(users)} users to sync")

        for user in users:
            try:
                await self.sync_user_emails(user)
            except Exception as e:
                print(f"❌ Error syncing user {user.email}: {str(e)}")
                await self.log_sync_error(user.id, str(e))

    async def sync_user_emails(self, user: User):
        """Sync emails for a specific user"""
        import time
        start_time = time.time()

        print(f"🚀 === STARTING EMAIL SYNC FOR {user.email} ===")

        # Get or create sync state
        sync_state = self.db.query(SyncState).filter(
            SyncState.user_id == user.id,
            SyncState.provider == "gmail"
        ).first()

        if not sync_state:
            print(f"🆕 Creating new sync state for {user.email}")
            sync_state = SyncState(
                user_id=user.id,
                provider="gmail",
                last_sync_token=None,
                total_emails_synced=0
            )
            self.db.add(sync_state)
            self.db.commit()
        else:
            print(f"📊 Existing sync state: {sync_state.total_emails_synced} emails synced previously")

        try:
            # Check if token is expired and refresh if needed
            if user.google_token_expires_at and user.google_token_expires_at < datetime.utcnow():
                print(f"🔄 Token expired, refreshing access token")
                await self.refresh_access_token(user)
            else:
                print(f"✅ Access token is valid")

            # Sync emails
            new_emails = await self.fetch_new_emails(user, sync_state)

            if new_emails:
                await self.store_emails(user.id, new_emails)
                sync_state.total_emails_synced += len(new_emails)
                print(f"✅ Successfully synced {len(new_emails)} new emails for {user.email}")
            else:
                print(f"📭 No new emails found for {user.email}")

            # Update sync state
            sync_state.last_sync_at = datetime.utcnow()
            sync_state.next_sync_at = datetime.utcnow() + timedelta(minutes=15)  # Sync every 15 minutes
            sync_state.last_email_count = len(new_emails) if new_emails else 0
            sync_state.last_error = None
            sync_state.error_count = 0

            self.db.commit()

            # Final summary
            end_time = time.time()
            duration = end_time - start_time
            print(f"🎉 === SYNC COMPLETED FOR {user.email} ===")
            print(f"   • Duration: {duration:.2f} seconds")
            print(f"   • New emails this sync: {len(new_emails) if new_emails else 0}")
            print(f"   • Total emails synced ever: {sync_state.total_emails_synced}")

        except Exception as e:
            end_time = time.time()
            duration = end_time - start_time
            print(f"💥 === SYNC FAILED FOR {user.email} ===")
            print(f"   • Duration: {duration:.2f} seconds")
            print(f"   • Error: {str(e)}")
            await self.log_sync_error(user.id, str(e))
            raise

    async def fetch_new_emails(self, user: User, sync_state: SyncState) -> list:
        """Fetch new emails from Gmail API with continuation support"""
        print(f"🔍 Starting email fetch for {user.email}")

        # Ensure we have a valid access token (auto-refresh if needed)
        try:
            access_token = self.token_service.ensure_valid_token(user.id)
        except Exception as e:
            print(f"❌ Failed to get valid token for {user.email}: {e}")
            raise

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        all_messages = []
        page_token = sync_state.last_sync_token
        page_num = 1

        # Continue fetching until no more pages
        while True:
            # Build query parameters
            params = {
                "maxResults": 500,  # Gmail's maximum per request
                "q": "in:inbox"  # Only inbox emails for now
            }

            if page_token:
                params["pageToken"] = page_token
                print(f"📄 Page {page_num}: Using pagination token")
            else:
                print(f"🆕 Page {page_num}: Starting initial sync (no pagination token)")

            print(f"🔧 Gmail API query params: {params}")

            async with httpx.AsyncClient() as client:
                # Get list of message IDs
                print(f"🌐 Calling Gmail API: GET /messages (Page {page_num})")
                response = await client.get(
                    "https://gmail.googleapis.com/gmail/v1/users/me/messages",
                    headers=headers,
                    params=params
                )

                if response.status_code != 200:
                    print(f"❌ Gmail API error {response.status_code}: {response.text}")
                    raise Exception(f"Failed to fetch message list: {response.text}")

                data = response.json()
                messages = data.get("messages", [])

                print(f"📧 Gmail API returned {len(messages)} message IDs on page {page_num}")

                if not messages:
                    print(f"✅ No messages found on page {page_num}")
                    break

                all_messages.extend(messages)

                # Check for next page
                if "nextPageToken" in data:
                    page_token = data["nextPageToken"]
                    page_num += 1
                    print(f"➡️  Found next page token, continuing to page {page_num}")
                else:
                    print(f"🏁 No more pages available after page {page_num}")
                    # Save the last token for incremental syncs
                    sync_state.last_sync_token = None  # Reset for next sync
                    break

        print(f"📊 Total messages collected across {page_num} pages: {len(all_messages)}")

        if not all_messages:
            return []

        # Fetch full message details
        full_messages = []
        duplicate_count = 0
        error_count = 0

        print(f"🔄 Processing {len(all_messages)} messages:")

        async with httpx.AsyncClient() as client:
            for i, message in enumerate(all_messages):
                message_id = message["id"]
                print(f"📨 [{i+1}/{len(all_messages)}] Processing message ID: {message_id}")

                # Check if we already have this email
                existing = self.db.query(Email).filter(
                    Email.gmail_id == message_id,
                    Email.user_id == user.id
                ).first()

                if existing:
                    print(f"   ⏩ Skipping - email already exists in database")
                    duplicate_count += 1
                    continue

                try:
                    # Fetch full message
                    print(f"   🌐 Fetching full message details from Gmail API")
                    msg_response = await client.get(
                        f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{message_id}",
                        headers=headers
                    )

                    if msg_response.status_code == 200:
                        full_msg = msg_response.json()

                        # Extract basic info for logging
                        payload = full_msg.get("payload", {})
                        headers_dict = {h["name"]: h["value"] for h in payload.get("headers", [])}
                        subject = headers_dict.get("Subject", "(No Subject)")[:50]
                        from_addr = headers_dict.get("From", "(Unknown Sender)")[:30]
                        date_str = headers_dict.get("Date", "(No Date)")

                        print(f"   ✅ New email: '{subject}' from '{from_addr}' ({date_str})")
                        full_messages.append(full_msg)
                    else:
                        print(f"   ❌ Failed to fetch message {message_id}: HTTP {msg_response.status_code}")
                        error_count += 1

                except Exception as e:
                    print(f"   ❌ Error fetching message {message_id}: {str(e)}")
                    error_count += 1

            print(f"📊 Final Fetch Summary:")
            print(f"   • Total pages processed: {page_num}")
            print(f"   • Total messages found: {len(all_messages)}")
            print(f"   • New messages to process: {len(full_messages)}")
            print(f"   • Duplicates skipped: {duplicate_count}")
            print(f"   • Fetch errors: {error_count}")

            return full_messages

    async def store_emails(self, user_id: int, gmail_messages: list):
        """Store Gmail messages in local database"""
        if not gmail_messages:
            print(f"📭 No emails to store")
            return

        print(f"💾 Storing {len(gmail_messages)} emails in database")

        stored_count = 0
        error_count = 0

        for i, msg in enumerate(gmail_messages):
            message_id = msg.get('id', 'unknown')
            try:
                print(f"   📝 [{i+1}/{len(gmail_messages)}] Parsing and storing message {message_id}")

                email_data = self.parse_gmail_message(msg)
                email_data["user_id"] = user_id

                email = Email(**email_data)
                self.db.add(email)
                stored_count += 1

                # Log key details about stored email
                subject = email_data.get("subject", "(No Subject)")[:50]
                from_addr = email_data.get("from_address", "(Unknown)")[:30]
                sent_at = email_data.get("sent_at", "Unknown Date")
                print(f"      ✅ Stored: '{subject}' from '{from_addr}' sent {sent_at}")

            except Exception as e:
                print(f"   ❌ Error parsing/storing message {message_id}: {str(e)}")
                error_count += 1

        try:
            self.db.commit()
            print(f"💾 Database commit successful")
        except Exception as e:
            print(f"❌ Database commit failed: {str(e)}")
            raise

        print(f"📊 Storage Summary:")
        print(f"   • Successfully stored: {stored_count} emails")
        print(f"   • Storage errors: {error_count} emails")

    def parse_gmail_message(self, gmail_msg: dict) -> dict:
        """Parse Gmail API message format into our Email model format"""
        payload = gmail_msg.get("payload", {})
        headers = {h["name"]: h["value"] for h in payload.get("headers", [])}

        # Extract basic info
        data = {
            "gmail_id": gmail_msg["id"],
            "thread_id": gmail_msg.get("threadId"),
            "subject": headers.get("Subject", ""),
            "from_address": headers.get("From", ""),
            "snippet": gmail_msg.get("snippet", ""),
            "labels": gmail_msg.get("labelIds", []),
        }

        # Parse To, Cc, Bcc addresses
        to_addresses = headers.get("To", "")
        if to_addresses:
            data["to_addresses"] = [addr.strip() for addr in to_addresses.split(",")]

        cc_addresses = headers.get("Cc", "")
        if cc_addresses:
            data["cc_addresses"] = [addr.strip() for addr in cc_addresses.split(",")]

        bcc_addresses = headers.get("Bcc", "")
        if bcc_addresses:
            data["bcc_addresses"] = [addr.strip() for addr in bcc_addresses.split(",")]

        # Parse email body
        body_text, body_html = self.extract_email_body(payload)
        data["body_text"] = body_text
        data["body_html"] = body_html

        # Parse dates
        date_str = headers.get("Date")
        if date_str:
            try:
                from email.utils import parsedate_to_datetime
                data["sent_at"] = parsedate_to_datetime(date_str)
            except:
                pass

        # Use Gmail's internalDate for when Gmail received the email
        internal_date = gmail_msg.get("internalDate")
        if internal_date:
            try:
                # internalDate is in milliseconds since epoch
                data["received_at"] = datetime.fromtimestamp(int(internal_date) / 1000)
            except:
                data["received_at"] = datetime.utcnow()
        else:
            data["received_at"] = datetime.utcnow()

        # Parse labels/flags
        labels = gmail_msg.get("labelIds", [])
        data["is_read"] = "UNREAD" not in labels
        data["is_important"] = "IMPORTANT" in labels
        data["is_starred"] = "STARRED" in labels
        data["is_draft"] = "DRAFT" in labels
        data["is_sent"] = "SENT" in labels
        data["is_trash"] = "TRASH" in labels

        return data

    def extract_email_body(self, payload: dict) -> tuple:
        """Extract text and HTML body from Gmail message payload"""
        body_text = ""
        body_html = ""

        def extract_parts(part):
            nonlocal body_text, body_html

            mime_type = part.get("mimeType", "")

            if mime_type == "text/plain":
                body_data = part.get("body", {}).get("data", "")
                if body_data:
                    body_text = base64.urlsafe_b64decode(body_data).decode("utf-8", errors="ignore")

            elif mime_type == "text/html":
                body_data = part.get("body", {}).get("data", "")
                if body_data:
                    body_html = base64.urlsafe_b64decode(body_data).decode("utf-8", errors="ignore")

            # Recursively process multipart messages
            if "parts" in part:
                for subpart in part["parts"]:
                    extract_parts(subpart)

        extract_parts(payload)
        return body_text, body_html

    async def refresh_access_token(self, user: User):
        """Refresh expired access token"""
        if not user.google_refresh_token:
            raise Exception("No refresh token available")

        token_url = "https://oauth2.googleapis.com/token"
        data = {
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "refresh_token": user.google_refresh_token,
            "grant_type": "refresh_token"
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(token_url, data=data)

        if response.status_code != 200:
            raise Exception(f"Failed to refresh token: {response.text}")

        tokens = response.json()
        user.google_access_token = tokens["access_token"]
        user.google_token_expires_at = datetime.utcnow() + timedelta(seconds=tokens.get("expires_in", 3600))

        self.db.commit()

    async def log_sync_error(self, user_id: int, error_message: str):
        """Log sync error to sync_state table"""
        sync_state = self.db.query(SyncState).filter(
            SyncState.user_id == user_id,
            SyncState.provider == "gmail"
        ).first()

        if sync_state:
            sync_state.last_error = error_message
            sync_state.last_error_at = datetime.utcnow()
            sync_state.error_count = (sync_state.error_count or 0) + 1
            self.db.commit()

    def close(self):
        """Clean up database connection"""
        self.db.close()

async def main():
    """Main function for running the sync worker"""
    worker = GmailSyncWorker()

    try:
        await worker.sync_all_users()
        print("✅ Email sync completed successfully")
    except Exception as e:
        print(f"❌ Email sync failed: {str(e)}")
    finally:
        worker.close()

if __name__ == "__main__":
    asyncio.run(main())
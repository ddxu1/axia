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
        print(f"📨 Syncing emails for {user.email}")

        # Get or create sync state
        sync_state = self.db.query(SyncState).filter(
            SyncState.user_id == user.id,
            SyncState.provider == "gmail"
        ).first()

        if not sync_state:
            sync_state = SyncState(
                user_id=user.id,
                provider="gmail",
                last_sync_token=None,
                total_emails_synced=0
            )
            self.db.add(sync_state)
            self.db.commit()

        try:
            # Check if token is expired and refresh if needed
            if user.google_token_expires_at and user.google_token_expires_at < datetime.utcnow():
                await self.refresh_access_token(user)

            # Sync emails
            new_emails = await self.fetch_new_emails(user, sync_state)

            if new_emails:
                await self.store_emails(user.id, new_emails)
                sync_state.total_emails_synced += len(new_emails)
                print(f"✅ Synced {len(new_emails)} new emails for {user.email}")

            # Update sync state
            sync_state.last_sync_at = datetime.utcnow()
            sync_state.next_sync_at = datetime.utcnow() + timedelta(minutes=15)  # Sync every 15 minutes
            sync_state.last_email_count = len(new_emails)
            sync_state.last_error = None
            sync_state.error_count = 0

            self.db.commit()

        except Exception as e:
            await self.log_sync_error(user.id, str(e))
            raise

    async def fetch_new_emails(self, user: User, sync_state: SyncState) -> list:
        """Fetch new emails from Gmail API"""
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

        # Build query parameters
        params = {
            "maxResults": 50,  # Limit for initial sync
            "q": "in:inbox"  # Only inbox emails for now
        }

        # If we have a sync token, use it for incremental sync
        if sync_state.last_sync_token:
            params["pageToken"] = sync_state.last_sync_token

        async with httpx.AsyncClient() as client:
            # Get list of message IDs
            response = await client.get(
                "https://gmail.googleapis.com/gmail/v1/users/me/messages",
                headers=headers,
                params=params
            )

            if response.status_code != 200:
                raise Exception(f"Failed to fetch message list: {response.text}")

            data = response.json()
            messages = data.get("messages", [])

            if not messages:
                return []

            # Update sync token for next time
            if "nextPageToken" in data:
                sync_state.last_sync_token = data["nextPageToken"]

            # Fetch full message details
            full_messages = []
            for message in messages:
                # Check if we already have this email
                existing = self.db.query(Email).filter(
                    Email.gmail_id == message["id"],
                    Email.user_id == user.id
                ).first()

                if existing:
                    continue  # Skip emails we already have

                # Fetch full message
                msg_response = await client.get(
                    f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{message['id']}",
                    headers=headers
                )

                if msg_response.status_code == 200:
                    full_messages.append(msg_response.json())

            return full_messages

    async def store_emails(self, user_id: int, gmail_messages: list):
        """Store Gmail messages in local database"""
        for msg in gmail_messages:
            try:
                email_data = self.parse_gmail_message(msg)
                email_data["user_id"] = user_id

                email = Email(**email_data)
                self.db.add(email)

            except Exception as e:
                print(f"⚠️ Error parsing message {msg.get('id', 'unknown')}: {str(e)}")

        self.db.commit()

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
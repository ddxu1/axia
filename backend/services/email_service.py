from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from models.email import Email
from models.user import User
from typing import List, Tuple, Optional
from datetime import datetime
import httpx
import base64
import json

class EmailService:
    def __init__(self, db: Session):
        self.db = db

    async def get_user_emails(
        self,
        user_id: int,
        page: int = 1,
        per_page: int = 50,
        search: Optional[str] = None,
        label: Optional[str] = None,
        is_read: Optional[bool] = None
    ) -> Tuple[List[Email], int]:
        """Get paginated emails for a user with filters"""

        query = self.db.query(Email).filter(Email.user_id == user_id)

        # Apply filters
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Email.subject.ilike(search_term),
                    Email.from_address.ilike(search_term),
                    Email.snippet.ilike(search_term),
                    Email.body_text.ilike(search_term)
                )
            )

        if label:
            query = query.filter(Email.labels.contains([label]))

        if is_read is not None:
            query = query.filter(Email.is_read == is_read)

        # Don't show trashed emails by default
        query = query.filter(Email.is_trash == False)

        # Get total count
        total = query.count()

        # Apply pagination and ordering
        emails = query.order_by(desc(Email.sent_at)).offset((page - 1) * per_page).limit(per_page).all()

        return emails, total

    async def get_user_email(self, email_id: int, user_id: int) -> Optional[Email]:
        """Get a specific email for a user"""
        return self.db.query(Email).filter(
            and_(Email.id == email_id, Email.user_id == user_id)
        ).first()

    async def mark_as_read(self, email_id: int, user_id: int) -> bool:
        """Mark an email as read"""
        email = await self.get_user_email(email_id, user_id)
        if not email:
            return False

        email.is_read = True
        self.db.commit()

        # TODO: Also mark as read in Gmail via API
        return True

    async def mark_as_unread(self, email_id: int, user_id: int) -> bool:
        """Mark an email as unread"""
        email = await self.get_user_email(email_id, user_id)
        if not email:
            return False

        email.is_read = False
        self.db.commit()

        # TODO: Also mark as unread in Gmail via API
        return True

    async def delete_email(self, email_id: int, user_id: int) -> bool:
        """Delete an email (move to trash)"""
        email = await self.get_user_email(email_id, user_id)
        if not email:
            return False

        email.is_trash = True
        self.db.commit()

        # TODO: Also delete in Gmail via API
        return True

    async def archive_email(self, email_id: int, user_id: int) -> bool:
        """Archive an email"""
        email = await self.get_user_email(email_id, user_id)
        if not email:
            return False

        # Remove INBOX label and add archive behavior
        if email.labels and "INBOX" in email.labels:
            email.labels = [label for label in email.labels if label != "INBOX"]

        self.db.commit()

        # TODO: Also archive in Gmail via API
        return True

    async def send_email(
        self,
        user_id: int,
        to_addresses: List[str],
        subject: str,
        cc_addresses: Optional[List[str]] = None,
        bcc_addresses: Optional[List[str]] = None,
        body_text: Optional[str] = None,
        body_html: Optional[str] = None
    ) -> str:
        """Send an email via Gmail API"""

        # Get user's access token
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user or not user.google_access_token:
            raise ValueError("User not found or no access token")

        # Construct email message
        message = self._create_email_message(
            to_addresses=to_addresses,
            subject=subject,
            cc_addresses=cc_addresses,
            bcc_addresses=bcc_addresses,
            body_text=body_text,
            body_html=body_html,
            from_address=user.email
        )

        # Send via Gmail API
        url = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"
        headers = {
            "Authorization": f"Bearer {user.google_access_token}",
            "Content-Type": "application/json"
        }

        payload = {
            "raw": base64.urlsafe_b64encode(message.encode()).decode()
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload)

        if response.status_code != 200:
            raise Exception(f"Failed to send email: {response.text}")

        result = response.json()
        message_id = result.get("id")

        # Store sent email in database
        sent_email = Email(
            gmail_id=message_id,
            user_id=user_id,
            subject=subject,
            from_address=user.email,
            to_addresses=to_addresses,
            cc_addresses=cc_addresses,
            bcc_addresses=bcc_addresses,
            body_text=body_text,
            body_html=body_html,
            is_sent=True,
            labels=["SENT"],
            sent_at=datetime.utcnow()
        )

        self.db.add(sent_email)
        self.db.commit()

        return message_id

    def _create_email_message(
        self,
        to_addresses: List[str],
        subject: str,
        from_address: str,
        cc_addresses: Optional[List[str]] = None,
        bcc_addresses: Optional[List[str]] = None,
        body_text: Optional[str] = None,
        body_html: Optional[str] = None
    ) -> str:
        """Create RFC 2822 email message"""

        lines = []
        lines.append(f"From: {from_address}")
        lines.append(f"To: {', '.join(to_addresses)}")

        if cc_addresses:
            lines.append(f"Cc: {', '.join(cc_addresses)}")

        if bcc_addresses:
            lines.append(f"Bcc: {', '.join(bcc_addresses)}")

        lines.append(f"Subject: {subject}")
        lines.append("MIME-Version: 1.0")

        if body_html and body_text:
            # Multipart message
            boundary = "boundary123456789"
            lines.append(f"Content-Type: multipart/alternative; boundary={boundary}")
            lines.append("")
            lines.append(f"--{boundary}")
            lines.append("Content-Type: text/plain; charset=utf-8")
            lines.append("")
            lines.append(body_text)
            lines.append("")
            lines.append(f"--{boundary}")
            lines.append("Content-Type: text/html; charset=utf-8")
            lines.append("")
            lines.append(body_html)
            lines.append("")
            lines.append(f"--{boundary}--")
        elif body_html:
            lines.append("Content-Type: text/html; charset=utf-8")
            lines.append("")
            lines.append(body_html)
        else:
            lines.append("Content-Type: text/plain; charset=utf-8")
            lines.append("")
            lines.append(body_text or "")

        return "\r\n".join(lines)
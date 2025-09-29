from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List, Any

class EmailBase(BaseModel):
    subject: Optional[str] = None
    from_address: EmailStr
    snippet: Optional[str] = None

class EmailResponse(EmailBase):
    id: int
    gmail_id: str
    thread_id: Optional[str] = None
    to_addresses: Optional[List[str]] = None
    cc_addresses: Optional[List[str]] = None
    body_text: Optional[str] = None
    body_html: Optional[str] = None
    labels: Optional[List[str]] = None
    is_read: bool = False
    is_important: bool = False
    is_starred: bool = False
    is_draft: bool = False
    is_sent: bool = False
    is_trash: bool = False
    sent_at: Optional[datetime] = None
    received_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class EmailList(BaseModel):
    emails: List[EmailResponse]
    total: int
    page: int
    per_page: int

class EmailSend(BaseModel):
    to: List[EmailStr]
    cc: Optional[List[EmailStr]] = None
    bcc: Optional[List[EmailStr]] = None
    subject: str
    body_text: Optional[str] = None
    body_html: Optional[str] = None
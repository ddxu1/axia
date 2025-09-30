from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database.connection import Base

class Email(Base):
    __tablename__ = "emails"

    id = Column(Integer, primary_key=True, index=True)
    gmail_id = Column(String, unique=True, index=True, nullable=False)  # Gmail message ID
    thread_id = Column(String, index=True, nullable=True)  # Gmail thread ID

    # Foreign key to user
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Email metadata
    subject = Column(String, nullable=True)
    from_address = Column(String, nullable=False, index=True)
    to_addresses = Column(JSON, nullable=True)  # Array of recipient emails
    cc_addresses = Column(JSON, nullable=True)  # Array of CC emails
    bcc_addresses = Column(JSON, nullable=True)  # Array of BCC emails

    # Email content
    snippet = Column(Text, nullable=True)  # Short preview
    body_text = Column(Text, nullable=True)  # Plain text body
    body_html = Column(Text, nullable=True)  # HTML body

    # Gmail labels and status
    labels = Column(JSON, nullable=True)  # Array of Gmail labels
    is_read = Column(Boolean, default=False, nullable=False)
    is_important = Column(Boolean, default=False, nullable=False)
    is_starred = Column(Boolean, default=False, nullable=False)
    is_draft = Column(Boolean, default=False, nullable=False)
    is_sent = Column(Boolean, default=False, nullable=False)
    is_trash = Column(Boolean, default=False, nullable=False)

    # Timestamps
    sent_at = Column(DateTime, nullable=True)  # When email was sent
    received_at = Column(DateTime, nullable=True)  # When we received/synced it
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship
    user = relationship("User", back_populates="emails")

    def __repr__(self):
        return f"<Email(id={self.id}, gmail_id='{self.gmail_id}', subject='{self.subject}')>"


# Add relationship to User model
from .user import User
User.emails = relationship("Email", back_populates="user")
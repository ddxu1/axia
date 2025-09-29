from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database.connection import Base

class SyncState(Base):
    __tablename__ = "sync_state"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign key to user
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Sync tracking
    provider = Column(String, nullable=False)  # "gmail", "outlook", etc.
    last_sync_token = Column(Text, nullable=True)  # Gmail history ID or similar
    last_sync_at = Column(DateTime, nullable=True)
    next_sync_at = Column(DateTime, nullable=True)

    # Sync statistics
    total_emails_synced = Column(Integer, default=0)
    last_email_count = Column(Integer, default=0)

    # Error tracking
    last_error = Column(Text, nullable=True)
    error_count = Column(Integer, default=0)
    last_error_at = Column(DateTime, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship
    user = relationship("User", back_populates="sync_states")

    def __repr__(self):
        return f"<SyncState(id={self.id}, user_id={self.user_id}, provider='{self.provider}')>"


# Add relationship to User model
from .user import User
User.sync_states = relationship("SyncState", back_populates="user")
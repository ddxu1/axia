#!/usr/bin/env python3
"""
Database cleanup script to remove all emails for a specific user while preserving
the user account and OAuth tokens. This enables a fresh email sync.
"""

import os
import sys
from sqlalchemy.orm import Session
from database.connection import SessionLocal
from models.user import User
from models.email import Email
from models.sync_state import SyncState

def cleanup_user_emails(email_address: str):
    """
    Remove all emails and reset sync state for a specific user

    Args:
        email_address: The user's email address to clean up
    """
    db = SessionLocal()

    try:
        print(f"🧹 Starting cleanup for user: {email_address}")
        print("-" * 50)

        # Find the user
        user = db.query(User).filter(User.email == email_address).first()

        if not user:
            print(f"❌ User not found: {email_address}")
            return False

        print(f"✅ Found user: {user.name} (ID: {user.id})")

        # Count current emails
        email_count = db.query(Email).filter(Email.user_id == user.id).count()
        print(f"📧 Current email count: {email_count}")

        if email_count == 0:
            print("ℹ️  No emails to delete")
        else:
            # Delete all emails for this user
            deleted_count = db.query(Email).filter(Email.user_id == user.id).delete()
            print(f"🗑️  Deleted {deleted_count} emails")

        # Find and reset sync state
        sync_state = db.query(SyncState).filter(SyncState.user_id == user.id).first()

        if sync_state:
            print(f"🔄 Found sync state (ID: {sync_state.id})")
            print(f"   - Previous total synced: {sync_state.total_emails_synced}")
            print(f"   - Previous last sync: {sync_state.last_sync_at}")

            # Reset sync state for fresh sync
            sync_state.last_sync_token = None
            sync_state.last_sync_at = None
            sync_state.next_sync_at = None
            sync_state.total_emails_synced = 0
            sync_state.last_email_count = 0
            sync_state.last_error = None
            sync_state.error_count = 0
            sync_state.last_error_at = None

            print("🔄 Reset sync state to initial values")
        else:
            print("ℹ️  No sync state found (will be created on next sync)")

        # Commit all changes
        db.commit()

        # Verify cleanup
        remaining_emails = db.query(Email).filter(Email.user_id == user.id).count()
        print(f"\n✅ Cleanup completed successfully!")
        print(f"📊 Summary:")
        print(f"   - User account: PRESERVED ({user.email})")
        print(f"   - OAuth tokens: PRESERVED")
        print(f"   - Emails deleted: {email_count}")
        print(f"   - Emails remaining: {remaining_emails}")
        print(f"   - Sync state: RESET")

        if remaining_emails == 0:
            print(f"\n🎉 {email_address} is ready for fresh email sync!")
        else:
            print(f"\n⚠️  Warning: {remaining_emails} emails still remain")

        return True

    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
        db.rollback()
        return False

    finally:
        db.close()

def main():
    """Main function"""
    if len(sys.argv) != 2:
        print("Usage: python cleanup_user_emails.py <email_address>")
        print("Example: python cleanup_user_emails.py realdannyxu@gmail.com")
        sys.exit(1)

    email_address = sys.argv[1]

    print(f"🚨 WARNING: This will DELETE ALL EMAILS for {email_address}")
    print("The user account and OAuth tokens will be preserved.")
    print("⚠️  Running in non-interactive mode - proceeding with cleanup...")

    success = cleanup_user_emails(email_address)

    if success:
        print("\n✅ Cleanup completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Cleanup failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
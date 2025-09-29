#!/usr/bin/env python3
"""
Simple setup - create user and get ready for sync
"""

from sqlalchemy.orm import Session
from database.connection import SessionLocal
from models.user import User
from models.sync_state import SyncState
from services.auth_service import AuthService
import sys

def setup_user(email="dannydxu1@gmail.com"):
    """Set up user for email sync"""
    print(f"🛠️  Setting up user: {email}")

    db = SessionLocal()

    try:
        # Check if user exists
        user = db.query(User).filter(User.email == email).first()

        if not user:
            # Create user
            user = User(
                email=email,
                name="Danny Xu",
                is_active=True,
                google_access_token="PLACEHOLDER_TOKEN",
                google_refresh_token=None
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"✅ Created user: {email} (ID: {user.id})")
        else:
            print(f"✅ User exists: {email} (ID: {user.id})")

        # Create sync state
        sync_state = db.query(SyncState).filter(
            SyncState.user_id == user.id,
            SyncState.provider == "gmail"
        ).first()

        if not sync_state:
            sync_state = SyncState(
                user_id=user.id,
                provider="gmail",
                total_emails_synced=0
            )
            db.add(sync_state)
            db.commit()
            print(f"✅ Created sync state for user {user.id}")
        else:
            print(f"✅ Sync state exists for user {user.id}")

        # Generate JWT token
        auth_service = AuthService(db)
        jwt_token = auth_service.create_access_token(user.id)

        with open("jwt_token.txt", "w") as f:
            f.write(jwt_token)

        print(f"✅ Generated JWT token (saved to jwt_token.txt)")
        print(f"🔑 JWT: {jwt_token[:50]}...")

        return user, jwt_token

    except Exception as e:
        print(f"❌ Error: {e}")
        return None, None
    finally:
        db.close()

def update_user_with_google_token(user_id, google_token):
    """Update user with Google access token"""
    db = SessionLocal()

    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.google_access_token = google_token
            db.commit()
            print(f"✅ Updated Google token for user {user.email}")
            return True
    except Exception as e:
        print(f"❌ Error updating token: {e}")
        return False
    finally:
        db.close()

    return False

def main():
    print("🔧 Simple Setup")
    print("=" * 20)

    # Set up user
    user, jwt_token = setup_user()

    if user and jwt_token:
        print(f"\n📋 Next Steps:")
        print(f"1. Get a fresh Google OAuth token from:")
        print(f"   https://developers.google.com/oauthplayground/")
        print(f"2. Select Gmail API v1 scopes")
        print(f"3. Get the access_token")
        print(f"4. Update the user token:")
        print(f"   - Run: venv/bin/python -c \"")
        print(f"from simple_setup import update_user_with_google_token;")
        print(f"update_user_with_google_token({user.id}, 'YOUR_GOOGLE_TOKEN')\"")
        print(f"5. Run sync: venv/bin/python sync_worker.py")
        print(f"\n🎯 User ID: {user.id}")
        print(f"📧 Email: {user.email}")

if __name__ == "__main__":
    main()
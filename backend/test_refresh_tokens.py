#!/usr/bin/env python3
"""
Test the refresh token system
"""

from database.connection import SessionLocal
from services.token_service import TokenService
from models.user import User
from datetime import datetime, timedelta

def test_refresh_system():
    print("🧪 Testing Refresh Token System")
    print("=" * 35)

    db = SessionLocal()
    token_service = TokenService(db)

    try:
        # Get user
        user = db.query(User).filter(User.id == 1).first()
        if not user:
            print("❌ User not found")
            return

        print(f"👤 Testing with user: {user.email}")
        print(f"🔑 Has refresh token: {'Yes' if user.google_refresh_token else 'No'}")

        if user.google_token_expires_at:
            print(f"⏰ Token expires: {user.google_token_expires_at}")
            time_left = user.google_token_expires_at - datetime.now()
            print(f"⏳ Time remaining: {time_left}")
        else:
            print("⚠️  No expiration time set")

        # Test 1: Check ensure_valid_token
        print("\n🔍 Test 1: Ensure Valid Token")
        try:
            access_token = token_service.ensure_valid_token(user.id)
            print(f"✅ Got valid token: {access_token[:50]}...")

            # Test the token with Google
            user_info = token_service.test_token(access_token)
            print(f"✅ Token works with Google - User: {user_info['email']}")

        except Exception as e:
            print(f"❌ Failed: {e}")

        # Test 2: Force token refresh (if we have refresh token)
        if user.google_refresh_token:
            print("\n🔄 Test 2: Force Token Refresh")
            try:
                new_token = token_service.refresh_google_token(user.id)
                print(f"✅ Refresh successful: {new_token[:50]}...")

                # Test new token
                user_info = token_service.test_token(new_token)
                print(f"✅ New token works - User: {user_info['email']}")

            except Exception as e:
                print(f"❌ Refresh failed: {e}")
        else:
            print("\n⚠️  Test 2: No refresh token - skipping refresh test")
            print("To get a refresh token:")
            print("1. Go to OAuth Playground")
            print("2. Make sure to use 'access_type=offline' in authorization")
            print("3. You'll get both access_token AND refresh_token")

        print("\n📊 Summary:")
        print(f"   User: {user.email}")
        print(f"   Has access token: {'Yes' if user.google_access_token else 'No'}")
        print(f"   Has refresh token: {'Yes' if user.google_refresh_token else 'No'}")
        if user.google_refresh_token:
            print("   ✅ Automatic refresh available")
        else:
            print("   ⚠️  Manual token updates still required")

    except Exception as e:
        print(f"❌ Test failed: {e}")
    finally:
        db.close()

def show_instructions():
    print("\n📋 Getting Refresh Tokens:")
    print("1. Go to: https://developers.google.com/oauthplayground/")
    print("2. Click ⚙️ (settings) in top right")
    print("3. Check 'Use your own OAuth credentials'")
    print("4. Enter your Client ID and Secret from .env file")
    print("5. In Step 1, select Gmail API v1 scopes")
    print("6. Before clicking 'Authorize APIs', add this to URL:")
    print("   &access_type=offline&prompt=consent")
    print("7. Complete the flow - you'll get BOTH tokens!")
    print("\nThen run:")
    print("   venv/bin/python update_token.py 'access_token' 'refresh_token'")

if __name__ == "__main__":
    test_refresh_system()
    show_instructions()
#!/usr/bin/env python3
"""
Test if the current Google access token works
"""

import requests
from database.connection import SessionLocal
from models.user import User

def test_current_token():
    print("🧪 Testing Current Google Access Token")
    print("=" * 40)

    db = SessionLocal()

    try:
        # Get user from database
        user = db.query(User).filter(User.id == 1).first()
        if not user:
            print("❌ User not found in database")
            return False

        if not user.google_access_token:
            print("❌ No access token found in database")
            return False

        print(f"👤 User: {user.email}")
        print(f"🔑 Token: {user.google_access_token[:50]}...")

        # Test 1: Google UserInfo API
        print("\n🔍 Test 1: Google UserInfo API")
        response = requests.get(
            f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={user.google_access_token}"
        )

        if response.status_code == 200:
            user_info = response.json()
            print(f"✅ UserInfo API works!")
            print(f"   Email: {user_info.get('email')}")
            print(f"   Name: {user_info.get('name')}")
        else:
            print(f"❌ UserInfo API failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False

        # Test 2: Gmail API - List Messages
        print("\n📧 Test 2: Gmail API - List Messages")
        headers = {"Authorization": f"Bearer {user.google_access_token}"}

        response = requests.get(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=1",
            headers=headers
        )

        if response.status_code == 200:
            gmail_data = response.json()
            message_count = len(gmail_data.get('messages', []))
            print(f"✅ Gmail API works!")
            print(f"   Can access messages: {message_count > 0}")
            if message_count > 0:
                print(f"   Sample message ID: {gmail_data['messages'][0]['id']}")
        else:
            print(f"❌ Gmail API failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False

        # Test 3: Token Expiration Check
        print("\n⏰ Test 3: Token Expiration")
        if user.google_token_expires_at:
            from datetime import datetime
            expires_at = user.google_token_expires_at
            now = datetime.now()
            time_left = expires_at - now

            print(f"   Expires at: {expires_at}")
            print(f"   Time left: {time_left}")

            if time_left.total_seconds() > 0:
                print("   ✅ Token not yet expired")
            else:
                print("   ⚠️  Token has expired")
        else:
            print("   ⚠️  No expiration time recorded")

        print(f"\n🎉 All tests passed! Your token is working correctly.")
        return True

    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        return False

    finally:
        db.close()

def show_token_info():
    """Show current token information from database"""
    db = SessionLocal()

    try:
        user = db.query(User).filter(User.id == 1).first()
        if user:
            print(f"\n📊 Current Token Status:")
            print(f"   User: {user.email}")
            print(f"   Has access token: {'Yes' if user.google_access_token else 'No'}")
            print(f"   Has refresh token: {'Yes' if user.google_refresh_token else 'No'}")

            if user.google_access_token:
                print(f"   Access token: {user.google_access_token[:50]}...")
            if user.google_refresh_token:
                print(f"   Refresh token: {user.google_refresh_token[:50]}...")
            if user.google_token_expires_at:
                print(f"   Expires: {user.google_token_expires_at}")

    finally:
        db.close()

if __name__ == "__main__":
    # Show current token info first
    show_token_info()

    # Run tests
    success = test_current_token()

    if not success:
        print(f"\n💡 If tests failed, get a fresh token from:")
        print(f"   https://developers.google.com/oauthplayground/")
        print(f"   Then run: venv/bin/python update_token.py 'fresh_token'")
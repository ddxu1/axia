#!/usr/bin/env python3
"""
Update user with Google OAuth tokens (access + refresh)
Enhanced version with refresh token support
"""

import sys
import json
from database.connection import SessionLocal
from services.token_service import TokenService

def main():
    if len(sys.argv) < 2:
        print("Enhanced Token Update Tool")
        print("=" * 30)
        print("Usage:")
        print("  python update_token.py 'ACCESS_TOKEN'")
        print("  python update_token.py 'ACCESS_TOKEN' 'REFRESH_TOKEN'")
        print("  python update_token.py --oauth-response '{\"access_token\":\"...\", \"refresh_token\":\"...\"}' ")
        print("\nExamples:")
        print("  python update_token.py 'ya29.a0AfB_byDLIi...'")
        print("  python update_token.py 'ya29.access...' '1//04refresh...'")
        return

    db = SessionLocal()
    token_service = TokenService(db)

    try:
        if sys.argv[1] == '--oauth-response':
            # Parse full OAuth response JSON
            oauth_data = json.loads(sys.argv[2])
            access_token = oauth_data['access_token']
            refresh_token = oauth_data.get('refresh_token')

            print(f"🔄 Updating user with OAuth response...")
            print(f"   Access token: {access_token[:50]}...")
            if refresh_token:
                print(f"   Refresh token: {refresh_token[:50]}...")

        elif len(sys.argv) == 3:
            # Access token + refresh token
            access_token = sys.argv[1]
            refresh_token = sys.argv[2]
            print(f"🔄 Updating user with both tokens...")
            print(f"   Access token: {access_token[:50]}...")
            print(f"   Refresh token: {refresh_token[:50]}...")

        else:
            # Just access token
            access_token = sys.argv[1]
            refresh_token = None
            print(f"🔄 Updating user with access token: {access_token[:50]}...")

        # Update tokens
        success = token_service.update_user_tokens(1, access_token, refresh_token)

        if success:
            print("✅ Tokens updated successfully!")

            # Test the token
            try:
                user_info = token_service.test_token(access_token)
                print(f"🧪 Token test passed - User: {user_info['email']}")
            except Exception as e:
                print(f"⚠️  Token updated but test failed: {e}")

            if refresh_token:
                print("🎉 Refresh token stored - no more manual updates needed!")
            print("🚀 Now you can run: venv/bin/python sync_worker.py")
        else:
            print("❌ Failed to update tokens")

    except json.JSONDecodeError:
        print("❌ Invalid JSON in OAuth response")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
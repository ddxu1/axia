#!/usr/bin/env python3
"""
Google OAuth Token Management Service
Handles automatic refresh of Google access tokens using refresh tokens
"""

import requests
import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models.user import User
from dotenv import load_dotenv

load_dotenv()

class TokenService:
    def __init__(self, db: Session):
        self.db = db
        self.client_id = os.getenv('GOOGLE_CLIENT_ID')
        self.client_secret = os.getenv('GOOGLE_CLIENT_SECRET')

    def refresh_google_token(self, user_id: int) -> str:
        """
        Refresh Google access token using refresh token
        Returns new access token or raises exception
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise Exception(f"User {user_id} not found")

        if not user.google_refresh_token:
            raise Exception(f"No refresh token available for user {user.email}")

        print(f"🔄 Refreshing Google token for {user.email}...")

        # Call Google's token refresh endpoint
        response = requests.post('https://oauth2.googleapis.com/token', data={
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'refresh_token': user.google_refresh_token,
            'grant_type': 'refresh_token'
        })

        if response.status_code != 200:
            raise Exception(f"Token refresh failed: {response.status_code} - {response.text}")

        token_data = response.json()
        new_access_token = token_data['access_token']
        expires_in = token_data.get('expires_in', 3600)  # Default 1 hour

        # Update user with new token
        user.google_access_token = new_access_token
        user.google_token_expires_at = datetime.now() + timedelta(seconds=expires_in)
        self.db.commit()

        print(f"✅ Token refreshed successfully for {user.email}")
        return new_access_token

    def ensure_valid_token(self, user_id: int) -> str:
        """
        Ensure user has a valid access token, refresh if needed
        Returns valid access token
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise Exception(f"User {user_id} not found")

        # Check if token is expired or will expire in next 5 minutes
        now = datetime.now()
        buffer_time = timedelta(minutes=5)

        if (not user.google_token_expires_at or
            user.google_token_expires_at <= (now + buffer_time)):

            print(f"⏰ Token expired or expiring soon for {user.email}")
            return self.refresh_google_token(user_id)
        else:
            print(f"✅ Token still valid for {user.email}")
            return user.google_access_token

    def update_user_tokens(self, user_id: int, access_token: str, refresh_token: str = None) -> bool:
        """
        Update user with new access token and optionally refresh token
        """
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                print(f"❌ User {user_id} not found")
                return False

            user.google_access_token = access_token
            user.google_token_expires_at = datetime.now() + timedelta(hours=1)

            if refresh_token:
                user.google_refresh_token = refresh_token
                print(f"✅ Updated both access and refresh tokens for {user.email}")
            else:
                print(f"✅ Updated access token for {user.email}")

            self.db.commit()
            return True

        except Exception as e:
            print(f"❌ Error updating tokens: {e}")
            return False

    def test_token(self, access_token: str) -> dict:
        """
        Test if a Google access token is valid
        Returns user info if valid, raises exception if invalid
        """
        response = requests.get(
            f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={access_token}"
        )

        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Token test failed: {response.status_code} - {response.text}")
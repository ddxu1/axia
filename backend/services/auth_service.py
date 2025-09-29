from sqlalchemy.orm import Session
from sqlalchemy import or_
from models.user import User
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database.connection import get_db
import os

security = HTTPBearer()

class AuthService:
    def __init__(self, db: Session):
        self.db = db

    async def create_or_update_user(
        self,
        email: str,
        name: str = None,
        picture: str = None,
        google_access_token: str = None,
        google_refresh_token: str = None,
        expires_in: int = None
    ) -> User:
        """Create or update user with OAuth tokens"""

        # Check if user exists
        user = self.db.query(User).filter(User.email == email).first()

        if user:
            # Update existing user
            user.name = name or user.name
            user.picture = picture or user.picture
            user.google_access_token = google_access_token
            if google_refresh_token:
                user.google_refresh_token = google_refresh_token
            if expires_in:
                user.google_token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
        else:
            # Create new user
            user = User(
                email=email,
                name=name,
                picture=picture,
                google_access_token=google_access_token,
                google_refresh_token=google_refresh_token,
                google_token_expires_at=datetime.utcnow() + timedelta(seconds=expires_in) if expires_in else None
            )
            self.db.add(user)

        self.db.commit()
        self.db.refresh(user)
        return user

    def create_access_token(self, user_id: int) -> str:
        """Create JWT access token"""
        secret_key = os.getenv("JWT_SECRET_KEY")
        if not secret_key:
            raise ValueError("JWT_SECRET_KEY not configured")

        expire = datetime.utcnow() + timedelta(hours=24)
        to_encode = {"user_id": user_id, "exp": expire}

        encoded_jwt = jwt.encode(to_encode, secret_key, algorithm="HS256")
        return encoded_jwt

    def verify_token(self, token: str) -> int:
        """Verify JWT token and return user_id"""
        secret_key = os.getenv("JWT_SECRET_KEY")
        if not secret_key:
            raise ValueError("JWT_SECRET_KEY not configured")

        try:
            payload = jwt.decode(token, secret_key, algorithms=["HS256"])
            user_id: int = payload.get("user_id")
            if user_id is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication credentials"
                )
            return user_id
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    auth_service = AuthService(db)
    user_id = auth_service.verify_token(credentials.credentials)

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    return user
"""
JWT Authentication Middleware for Multi-User Support
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os
from database.connection import SessionLocal
from models.user import User

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "axia-email-client-jwt-secret-key-2024-production-ready-secure")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24 * 30  # 30 days

security = HTTPBearer()

def get_database():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_access_token(user_id: int) -> str:
    """Create JWT token for user"""
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode = {"user_id": user_id, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> int:
    """Verify JWT token and return user_id"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user_id
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_database)
) -> User:
    """Get current authenticated user from JWT token"""

    # Verify token and get user_id
    user_id = verify_token(credentials.credentials)

    # Get user from database
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user",
        )

    return user

def get_user_from_google_token(google_token: str, db: Session, refresh_token: str = None) -> tuple[User, bool]:
    """
    Get or create user from Google access token
    Returns (user, is_new_user)
    """
    import requests

    # Get user info from Google
    try:
        response = requests.get(
            f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={google_token}"
        )
        response.raise_for_status()
        google_user = response.json()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}"
        )

    email = google_user.get('email')
    name = google_user.get('name')
    picture = google_user.get('picture')

    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google token does not contain email"
        )

    # Check if user exists
    user = db.query(User).filter(User.email == email).first()

    if user:
        # Update existing user with fresh token
        user.google_access_token = google_token
        user.name = name or user.name
        user.picture = picture or user.picture
        if refresh_token:
            user.google_refresh_token = refresh_token
        db.commit()
        return user, False
    else:
        # Create new user
        user = User(
            email=email,
            name=name,
            picture=picture,
            is_active=True,
            google_access_token=google_token,
            google_refresh_token=refresh_token
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user, True
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database.connection import get_db
from schemas.auth import GoogleAuthRequest, TokenResponse
from services.auth_service import AuthService
from services.auth_middleware import create_access_token, get_user_from_google_token, get_current_user
from models.user import User
from models.sync_state import SyncState
import httpx
import os

router = APIRouter(prefix="/auth", tags=["auth"])

# New Pydantic models for multi-user authentication
class GoogleTokenRequest(BaseModel):
    google_access_token: str
    google_refresh_token: str = None

class MultiUserAuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict
    is_new_user: bool

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    picture: str
    is_active: bool

@router.post("/google", response_model=TokenResponse)
async def google_auth(
    auth_request: GoogleAuthRequest,
    db: Session = Depends(get_db)
):
    """
    Exchange Google OAuth code for access token and create/update user
    """
    try:
        # Exchange authorization code for tokens
        google_client_id = os.getenv("GOOGLE_CLIENT_ID")
        google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET")

        if not google_client_id or not google_client_secret:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Google OAuth not configured"
            )

        # Exchange code for tokens
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "client_id": google_client_id,
            "client_secret": google_client_secret,
            "code": auth_request.code,
            "grant_type": "authorization_code",
            "redirect_uri": auth_request.redirect_uri or "http://localhost:3000/auth/callback",
        }

        async with httpx.AsyncClient() as client:
            token_response = await client.post(token_url, data=token_data)

        if token_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to exchange authorization code"
            )

        tokens = token_response.json()
        access_token = tokens.get("access_token")
        refresh_token = tokens.get("refresh_token")

        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No access token received"
            )

        # Get user info from Google
        user_info_url = f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={access_token}"

        async with httpx.AsyncClient() as client:
            user_response = await client.get(user_info_url)

        if user_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get user information"
            )

        user_info = user_response.json()

        # Create or update user in database
        auth_service = AuthService(db)
        user = await auth_service.create_or_update_user(
            email=user_info["email"],
            name=user_info.get("name"),
            picture=user_info.get("picture"),
            google_access_token=access_token,
            google_refresh_token=refresh_token,
            expires_in=tokens.get("expires_in")
        )

        # Generate JWT token for our API
        jwt_token = auth_service.create_access_token(user.id)

        return TokenResponse(
            access_token=jwt_token,
            expires_in=3600,  # 1 hour
            user={
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "picture": user.picture
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )

# Multi-user authentication endpoints
@router.post("/google-token", response_model=MultiUserAuthResponse)
async def google_token_auth(
    request: GoogleTokenRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Authenticate user with Google access token (for multi-user support)
    Creates new users automatically and triggers email sync
    """
    try:
        # Get or create user from Google token
        user, is_new_user = get_user_from_google_token(request.google_access_token, db, request.google_refresh_token)

        # Create JWT token for our backend
        access_token = create_access_token(user.id)

        # Create sync state for new users
        if is_new_user:
            sync_state = SyncState(
                user_id=user.id,
                provider="gmail",
                total_emails_synced=0
            )
            db.add(sync_state)
            db.commit()

            # Schedule background email sync for new user
            background_tasks.add_task(sync_user_emails_background, user.id, request.google_access_token)
            print(f"🔄 Scheduled background sync for new user: {user.email}")

        return MultiUserAuthResponse(
            access_token=access_token,
            token_type="bearer",
            user={
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "picture": user.picture
            },
            is_new_user=is_new_user
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user info"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name or "",
        picture=current_user.picture or "",
        is_active=current_user.is_active
    )

@router.get("/status")
async def auth_status(current_user: User = Depends(get_current_user)):
    """Check authentication status"""
    return {
        "authenticated": True,
        "user": {
            "email": current_user.email,
            "name": current_user.name
        }
    }

def sync_user_emails_background(user_id: int, google_token: str):
    """Background task to sync user emails"""
    try:
        print(f"🔄 Starting background email sync for user {user_id}")

        # Import here to avoid circular imports
        from database.connection import SessionLocal

        db = SessionLocal()
        try:
            # Update user's Google token
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.google_access_token = google_token
                db.commit()

                # Import sync worker
                from sync_worker import GmailSyncWorker
                import asyncio

                # Run sync worker for this user
                worker = GmailSyncWorker()
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                loop.run_until_complete(worker.sync_user_emails(user))

                print(f"✅ Background sync completed for user {user.email}")

        finally:
            db.close()

    except Exception as e:
        print(f"❌ Background sync failed for user {user_id}: {e}")
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.connection import get_db
from schemas.auth import GoogleAuthRequest, TokenResponse
from services.auth_service import AuthService
import httpx
import os

router = APIRouter(prefix="/auth", tags=["auth"])

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
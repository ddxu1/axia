from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.connection import get_db
from services.auth_service import AuthService
import httpx
import os
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["auth"])

class GoogleTokenRequest(BaseModel):
    access_token: str

@router.post("/google-token")
async def auth_with_google_token(
    token_request: GoogleTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Accept a Google access token directly and create/update user
    """
    try:
        access_token = token_request.access_token

        # Get user info from Google
        user_info_url = f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={access_token}"

        async with httpx.AsyncClient() as client:
            user_response = await client.get(user_info_url)

        if user_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Google access token"
            )

        user_info = user_response.json()

        # Create or update user in database
        auth_service = AuthService(db)
        user = await auth_service.create_or_update_user(
            email=user_info["email"],
            name=user_info.get("name"),
            picture=user_info.get("picture"),
            google_access_token=access_token,
            google_refresh_token=None,  # We don't have refresh token
            expires_in=3600
        )

        # Generate JWT token for our API
        jwt_token = auth_service.create_access_token(user.id)

        return {
            "access_token": jwt_token,
            "token_type": "bearer",
            "expires_in": 3600,
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "picture": user.picture
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )
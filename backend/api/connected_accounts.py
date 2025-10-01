from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from database.connection import get_db
from models.user import User
from models.connected_account import ConnectedAccount
from services.auth_middleware import get_current_user
import httpx

router = APIRouter(prefix="/connected-accounts", tags=["connected_accounts"])

class ConnectedAccountCreate(BaseModel):
    provider: str  # 'gmail' or 'outlook'
    access_token: str
    refresh_token: Optional[str] = None
    expires_in: Optional[int] = None

class ConnectedAccountResponse(BaseModel):
    id: int
    provider: str
    email: str
    display_name: Optional[str]
    is_active: bool
    is_primary: bool
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("", response_model=List[ConnectedAccountResponse])
async def get_connected_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all connected accounts for the current user"""
    accounts = db.query(ConnectedAccount).filter(
        ConnectedAccount.user_id == current_user.id,
        ConnectedAccount.is_active == True
    ).all()

    return accounts

@router.post("", response_model=ConnectedAccountResponse)
async def add_connected_account(
    account_data: ConnectedAccountCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a new connected account for the current user"""
    try:
        # Get account email from provider's API
        email = None
        display_name = None

        if account_data.provider in ['gmail', 'google']:
            # Get Google user info
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://www.googleapis.com/oauth2/v2/userinfo",
                    headers={"Authorization": f"Bearer {account_data.access_token}"}
                )
                if response.status_code == 200:
                    user_info = response.json()
                    email = user_info.get("email")
                    display_name = user_info.get("name")
                else:
                    raise HTTPException(status_code=400, detail="Invalid Google access token")

        elif account_data.provider in ['outlook', 'azure-ad']:
            # Get Microsoft user info
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://graph.microsoft.com/v1.0/me",
                    headers={"Authorization": f"Bearer {account_data.access_token}"}
                )
                if response.status_code == 200:
                    user_info = response.json()
                    email = user_info.get("mail") or user_info.get("userPrincipalName")
                    display_name = user_info.get("displayName")
                else:
                    raise HTTPException(status_code=400, detail="Invalid Microsoft access token")
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported provider: {account_data.provider}")

        if not email:
            raise HTTPException(status_code=400, detail="Could not retrieve email from provider")

        # Check if this account already exists for this user
        existing = db.query(ConnectedAccount).filter(
            ConnectedAccount.user_id == current_user.id,
            ConnectedAccount.provider == account_data.provider,
            ConnectedAccount.email == email
        ).first()

        if existing:
            # Update existing account tokens
            existing.access_token = account_data.access_token
            existing.refresh_token = account_data.refresh_token or existing.refresh_token
            existing.is_active = True
            if account_data.expires_in:
                existing.token_expires_at = datetime.utcnow() + timedelta(seconds=account_data.expires_in)
            db.commit()
            db.refresh(existing)
            return existing

        # Calculate token expiration
        token_expires_at = None
        if account_data.expires_in:
            token_expires_at = datetime.utcnow() + timedelta(seconds=account_data.expires_in)

        # Check if user has any accounts - if not, make this primary
        existing_accounts = db.query(ConnectedAccount).filter(
            ConnectedAccount.user_id == current_user.id
        ).count()
        is_primary = existing_accounts == 0

        # Create new connected account
        new_account = ConnectedAccount(
            user_id=current_user.id,
            provider=account_data.provider,
            email=email,
            display_name=display_name,
            access_token=account_data.access_token,
            refresh_token=account_data.refresh_token,
            token_expires_at=token_expires_at,
            is_active=True,
            is_primary=is_primary
        )

        db.add(new_account)
        db.commit()
        db.refresh(new_account)

        return new_account

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to add connected account: {str(e)}")

@router.delete("/{account_id}")
async def remove_connected_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a connected account"""
    account = db.query(ConnectedAccount).filter(
        ConnectedAccount.id == account_id,
        ConnectedAccount.user_id == current_user.id
    ).first()

    if not account:
        raise HTTPException(status_code=404, detail="Connected account not found")

    # Don't allow removing the last account
    remaining_accounts = db.query(ConnectedAccount).filter(
        ConnectedAccount.user_id == current_user.id,
        ConnectedAccount.id != account_id,
        ConnectedAccount.is_active == True
    ).count()

    if remaining_accounts == 0:
        raise HTTPException(status_code=400, detail="Cannot remove the last connected account")

    # Soft delete (mark as inactive)
    account.is_active = False
    db.commit()

    return {"success": True, "message": "Account disconnected successfully"}

@router.get("/{account_id}/token")
async def get_account_token(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get access token for a specific connected account"""
    account = db.query(ConnectedAccount).filter(
        ConnectedAccount.id == account_id,
        ConnectedAccount.user_id == current_user.id,
        ConnectedAccount.is_active == True
    ).first()

    if not account:
        raise HTTPException(status_code=404, detail="Connected account not found")

    # TODO: Check if token is expired and refresh if needed

    return {
        "access_token": account.access_token,
        "provider": account.provider,
        "email": account.email
    }

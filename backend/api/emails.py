from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from database.connection import get_db
from schemas.email import EmailResponse, EmailList, EmailSend
from services.email_service import EmailService
from services.auth_service import get_current_user
from models.user import User
from typing import Optional

router = APIRouter(prefix="/emails", tags=["emails"])

@router.get("/", response_model=EmailList)
async def get_emails(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    label: Optional[str] = None,
    is_read: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get paginated list of emails for the current user
    """
    email_service = EmailService(db)

    emails, total = await email_service.get_user_emails(
        user_id=current_user.id,
        page=page,
        per_page=per_page,
        search=search,
        label=label,
        is_read=is_read
    )

    return EmailList(
        emails=[EmailResponse.from_orm(email) for email in emails],
        total=total,
        page=page,
        per_page=per_page
    )

@router.get("/{email_id}", response_model=EmailResponse)
async def get_email(
    email_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific email by ID
    """
    email_service = EmailService(db)

    email = await email_service.get_user_email(
        email_id=email_id,
        user_id=current_user.id
    )

    if not email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found"
        )

    # Mark as read when viewed
    if not email.is_read:
        await email_service.mark_as_read(email_id, current_user.id)

    return EmailResponse.from_orm(email)

@router.post("/{email_id}/read")
async def mark_email_read(
    email_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark an email as read
    """
    email_service = EmailService(db)

    success = await email_service.mark_as_read(email_id, current_user.id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found"
        )

    return {"message": "Email marked as read"}

@router.delete("/{email_id}")
async def delete_email(
    email_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete an email (move to trash)
    """
    email_service = EmailService(db)

    success = await email_service.delete_email(email_id, current_user.id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found"
        )

    return {"message": "Email deleted"}

@router.post("/{email_id}/archive")
async def archive_email(
    email_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Archive an email
    """
    email_service = EmailService(db)

    success = await email_service.archive_email(email_id, current_user.id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found"
        )

    return {"message": "Email archived"}

@router.post("/send")
async def send_email(
    email_data: EmailSend,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send a new email
    """
    email_service = EmailService(db)

    try:
        message_id = await email_service.send_email(
            user_id=current_user.id,
            to_addresses=[str(email) for email in email_data.to],
            cc_addresses=[str(email) for email in email_data.cc] if email_data.cc else None,
            bcc_addresses=[str(email) for email in email_data.bcc] if email_data.bcc else None,
            subject=email_data.subject,
            body_text=email_data.body_text,
            body_html=email_data.body_html
        )

        return {"message": "Email sent successfully", "message_id": message_id}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email: {str(e)}"
        )
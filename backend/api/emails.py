from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from database.connection import get_db
from schemas.email import EmailResponse, EmailList, EmailSend
from services.email_service import EmailService
from services.auth_middleware import get_current_user
from models.user import User
from models.email import Email
from sync_worker import GmailSyncWorker
from typing import Optional
from pydantic import BaseModel
import asyncio

router = APIRouter(prefix="/emails", tags=["emails"])

class MarkReadRequest(BaseModel):
    is_read: bool = True

class StarRequest(BaseModel):
    is_starred: bool = True

@router.get("/", response_model=EmailList)
async def get_emails(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    label: Optional[str] = None,
    is_read: Optional[bool] = None,
    is_starred: Optional[bool] = None,
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
        is_read=is_read,
        is_starred=is_starred
    )

    return EmailList(
        emails=[EmailResponse.from_orm(email) for email in emails],
        total=total,
        page=page,
        per_page=per_page
    )

@router.get("/counts")
async def get_email_counts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get email counts by filter categories for the current user
    """
    try:
        from sqlalchemy import func, and_, String

        # Base query for user's non-trash emails
        base_query = db.query(Email).filter(
            Email.user_id == current_user.id,
            Email.is_trash == False
        )

        # All emails count
        all_count = base_query.count()

        # Unread emails count
        unread_count = base_query.filter(Email.is_read == False).count()

        # Count emails by label using text search on JSON string
        inbox_count = base_query.filter(func.cast(Email.labels, String).like('%"INBOX"%')).count()
        important_count = base_query.filter(func.cast(Email.labels, String).like('%"IMPORTANT"%')).count()
        # Use is_starred field instead of label search for better performance
        starred_count = base_query.filter(Email.is_starred == True).count()
        sent_count = base_query.filter(func.cast(Email.labels, String).like('%"SENT"%')).count()
        personal_count = base_query.filter(func.cast(Email.labels, String).like('%"CATEGORY_PERSONAL"%')).count()
        updates_count = base_query.filter(func.cast(Email.labels, String).like('%"CATEGORY_UPDATES"%')).count()
        promotions_count = base_query.filter(func.cast(Email.labels, String).like('%"CATEGORY_PROMOTIONS"%')).count()

        return {
            "all": all_count,
            "unread": unread_count,
            "inbox": inbox_count,
            "important": important_count,
            "starred": starred_count,
            "sent": sent_count,
            "personal": personal_count,
            "updates": updates_count,
            "promotions": promotions_count
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get email counts: {str(e)}"
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

@router.post("/{email_id}/mark-read")
async def mark_email_read(
    email_id: int,
    request: MarkReadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark an email as read/unread
    """
    email_service = EmailService(db)

    if request.is_read:
        success = await email_service.mark_as_read(email_id, current_user.id)
    else:
        success = await email_service.mark_as_unread(email_id, current_user.id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found"
        )

    return {"message": f"Email marked as {'read' if request.is_read else 'unread'}"}

@router.post("/{email_id}/star")
async def star_email(
    email_id: int,
    request: StarRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Star/unstar an email and sync with Gmail
    """
    email_service = EmailService(db)

    if request.is_starred:
        success = await email_service.star_email(email_id, current_user.id)
    else:
        success = await email_service.unstar_email(email_id, current_user.id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found"
        )

    return {"message": f"Email {'starred' if request.is_starred else 'unstarred'}"}

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

@router.post("/sync")
async def sync_emails(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Trigger a manual sync of emails from Gmail for the current user
    """
    try:
        # Add sync task to background tasks
        background_tasks.add_task(sync_user_emails_task, current_user.id, db)

        return {
            "message": "Email sync started",
            "user_email": current_user.email,
            "status": "syncing"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start sync: {str(e)}"
        )

@router.get("/debug/counts")
async def get_email_counts_debug(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Debug endpoint to show email counts for current user
    """
    try:
        from sqlalchemy import func

        # Total emails
        total_emails = db.query(Email).filter(Email.user_id == current_user.id).count()

        # Non-trash emails
        non_trash_emails = db.query(Email).filter(
            Email.user_id == current_user.id,
            Email.is_trash == False
        ).count()

        # Unread emails
        unread_emails = db.query(Email).filter(
            Email.user_id == current_user.id,
            Email.is_read == False
        ).count()

        # Recent emails (last 10)
        recent_emails = db.query(Email).filter(
            Email.user_id == current_user.id,
            Email.is_trash == False
        ).order_by(Email.sent_at.desc()).limit(10).all()

        recent_list = []
        for email in recent_emails:
            recent_list.append({
                "id": email.id,
                "subject": email.subject[:50] if email.subject else "(No Subject)",
                "from_address": email.from_address[:30] if email.from_address else "(Unknown)",
                "sent_at": email.sent_at.isoformat() if email.sent_at else None,
                "is_read": email.is_read
            })

        return {
            "user_email": current_user.email,
            "user_id": current_user.id,
            "counts": {
                "total_emails": total_emails,
                "non_trash_emails": non_trash_emails,
                "unread_emails": unread_emails
            },
            "recent_emails": recent_list
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get email counts: {str(e)}"
        )

def sync_user_emails_task(user_id: int, db: Session):
    """Background task to sync emails for a user"""
    try:
        print(f"🔄 Starting manual email sync for user {user_id}")

        # Get the user
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            print(f"❌ User {user_id} not found")
            return

        # Create sync worker and run sync
        sync_worker = GmailSyncWorker()

        # Run the async sync in a new event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(sync_worker.sync_user_emails(user))
        loop.close()

        print(f"✅ Manual email sync completed for {user.email}")

    except Exception as e:
        print(f"❌ Manual sync failed for user {user_id}: {str(e)}")
    finally:
        db.close()
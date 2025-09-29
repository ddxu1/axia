#!/usr/bin/env python3
"""
Check email content directly from database to verify HTML/text storage
"""

from database.connection import SessionLocal
from models.email import Email
from models.user import User

def check_emails():
    """Check emails in database for HTML/text content"""
    db = SessionLocal()

    try:
        print("🔍 Checking email content in database...")
        print("=" * 50)

        # Get total email count
        total_emails = db.query(Email).count()
        print(f"📧 Total emails in database: {total_emails}")

        if total_emails == 0:
            print("ℹ️  No emails found. Run email sync first.")
            return

        # Get a few sample emails
        emails = db.query(Email).limit(3).all()

        for i, email in enumerate(emails, 1):
            print(f"\n📧 Email {i}: {email.gmail_id}")
            print(f"   📝 Subject: {email.subject or 'No subject'}")
            print(f"   👤 From: {email.from_address}")

            # Check text content
            has_text = email.body_text and len(email.body_text.strip()) > 0
            print(f"   🔤 Has body_text: {'✅' if has_text else '❌'}")
            if has_text:
                preview = email.body_text[:100].replace('\n', ' ')
                print(f"      Preview: {preview}...")

            # Check HTML content
            has_html = email.body_html and len(email.body_html.strip()) > 0
            print(f"   🌐 Has body_html: {'✅' if has_html else '❌'}")
            if has_html:
                preview = email.body_html[:100].replace('\n', ' ')
                print(f"      Preview: {preview}...")

            # Check for images in HTML
            if has_html:
                image_count = email.body_html.lower().count('<img')
                if image_count > 0:
                    print(f"   🖼️  Contains {image_count} images")

            # Check labels
            if email.labels:
                print(f"   🏷️  Labels: {', '.join(email.labels)}")

        # Summary
        print(f"\n📊 Summary:")
        emails_with_text = db.query(Email).filter(Email.body_text.isnot(None), Email.body_text != '').count()
        emails_with_html = db.query(Email).filter(Email.body_html.isnot(None), Email.body_html != '').count()

        print(f"   📧 Total emails: {total_emails}")
        print(f"   🔤 Emails with text content: {emails_with_text}")
        print(f"   🌐 Emails with HTML content: {emails_with_html}")

        if emails_with_html > 0:
            print(f"\n✅ HTML email rendering is ready to test!")
            print(f"   🛡️  The EmailRenderer component will safely display HTML content")
            print(f"   🔒 Images will be blocked by default for privacy")
            print(f"   📱 Users can switch between HTML and text views")
        else:
            print(f"\n⚠️  No HTML emails found. The renderer will work but you may want to sync some HTML emails for testing.")

    except Exception as e:
        print(f"❌ Error: {e}")

    finally:
        db.close()

if __name__ == "__main__":
    check_emails()
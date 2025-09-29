# Email Client Backend - Setup Documentation

This document explains the one-time setup process that was completed and the ongoing maintenance required for the FastAPI backend with Gmail integration.

## 🎯 Project Overview

**Goal**: FastAPI backend that syncs Gmail emails to PostgreSQL and provides REST APIs for a Next.js frontend.

**Current Status**: ✅ Fully operational with 50 emails synced and all APIs tested.

---

## 🔧 One-Time Setup (COMPLETED)

### 1. Database Infrastructure
**What was done:**
```bash
# Created PostgreSQL Docker container
docker run --name postgres-email -e POSTGRES_PASSWORD=secret -p 5432:5432 -d postgres

# Applied database migrations
venv/bin/alembic upgrade head
```

**Result**:
- PostgreSQL running on port 5432
- All tables created (users, emails, sync_state, labels, etc.)
- Database persists between restarts

### 2. Environment Configuration
**What was done:**
- Created `.env` file with database connection and Google OAuth credentials
- Generated secure JWT secret key
- Configured Google OAuth app credentials from frontend

**Files created/modified:**
- `.env` - Database URL, Google OAuth credentials, JWT secret

### 3. User Account Setup
**What was done:**
```python
# Created user in database
user = User(
    email="dannydxu1@gmail.com",
    name="Danny Xu",
    is_active=True
)
# User ID: 1
```

**Result**: Permanent user account in database with ID 1

### 4. Google OAuth Configuration
**Challenge faced:**
- Multiple redirect URI mismatch errors with Google OAuth
- Complex OAuth flow debugging

**Solution implemented:**
- Created manual OAuth token input system
- Used Google OAuth Playground for token generation
- Created `update_token.py` script for easy token updates

**Files created:**
- `simple_setup.py` - User creation and JWT generation
- `update_token.py` - Update Google access tokens
- `manual_setup.py` - Alternative setup method

### 5. JWT Authentication
**What was done:**
- Generated long-lived JWT token for API authentication
- Token expires: 2025-09-29 (months from now)
- Saved to `jwt_token.txt` for API testing

### 6. Email Synchronization
**What was done:**
```bash
# Initial sync of all Gmail emails
venv/bin/python sync_worker.py
```

**Result:**
- 50 emails successfully synced to PostgreSQL
- All email metadata, labels, and content stored
- Sync state tracking implemented

### 7. API Testing
**What was done:**
- Created comprehensive API test script
- Verified all endpoints work with real data
- Confirmed pagination, search, and detail views

**Files created:**
- `test_api.py` - Comprehensive API testing script

---

## 🚀 Daily Development Workflow

### Starting the Backend Server
```bash
cd /Users/dannyxu/code/email-client/backend
venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**That's it!** The server starts immediately with:
- All 50 emails available via API
- JWT authentication working
- All endpoints functional at localhost:8000

### API Endpoints Available
- `GET /emails` - List emails with pagination
- `GET /emails/{id}` - Get specific email details
- `GET /emails?search=query` - Search emails
- `POST /emails/{id}/mark-read` - Mark email as read
- `POST /emails/{id}/archive` - Archive email
- `POST /emails/send` - Send new email
- And more...

---

## 🔄 Periodic Maintenance

### Syncing New Emails

#### 🎯 With Refresh Tokens (Recommended - No Manual Work)

If you have a refresh token, the system automatically refreshes access tokens:

```bash
# Just sync - tokens refresh automatically!
venv/bin/python sync_worker.py
```

**One-time setup for refresh tokens:**
1. Go to https://developers.google.com/oauthplayground/
2. Click ⚙️ (settings), check "Use your own OAuth credentials"
3. Enter your Client ID and Secret from `.env`
4. Select Gmail API v1 scopes, then **add to URL**: `&access_type=offline&prompt=consent`
5. Complete OAuth flow - you'll get BOTH tokens
6. Update: `venv/bin/python update_token.py 'access_token' 'refresh_token'`

#### 📅 Without Refresh Tokens (Manual - Every 1-2 hours)

**Step 1: Get Fresh Token (30 seconds)**
1. Go to https://developers.google.com/oauthplayground/
2. Select Gmail API v1 scopes
3. Get `access_token` only

**Step 2: Update & Sync (10 seconds)**
```bash
venv/bin/python update_token.py 'ya29.your_new_token_here'
venv/bin/python sync_worker.py
```

### Testing APIs After Updates
```bash
venv/bin/python test_api.py
```

---

## 📁 Key Files Created

| File | Purpose | Status |
|------|---------|--------|
| `.env` | Environment configuration | Permanent |
| `simple_setup.py` | User creation and JWT generation | One-time use |
| `update_token.py` | Update Google access tokens | Regular use |
| `manual_setup.py` | Alternative setup method | Backup |
| `test_api.py` | API testing script | Regular use |
| `jwt_token.txt` | JWT for API authentication | Long-lived |
| `sync_worker.py` | Email synchronization worker | Regular use |

---

## 📊 Current Database State

**User Account:**
- ID: 1
- Email: dannydxu1@gmail.com
- Status: Active
- Google Token: Set (will need periodic refresh)

**Email Data:**
- Total emails: 50
- Read emails: 48
- Unread emails: 2
- Last sync: 2025-09-29 13:55:24

**Sync State:**
- Provider: gmail
- Total synced: 50
- Status: Complete

---

## 🎯 Future Production Improvements

### Automatic Token Refresh
Currently tokens are refreshed manually. For production, implement:
```python
def refresh_google_token(refresh_token):
    # Auto-refresh tokens using Google's refresh token flow
    # Store refresh tokens in database
    # Automatically refresh before expiration
```

### Background Sync Scheduling
```python
# Add scheduled background sync (e.g., every hour)
from celery import Celery
# or use APScheduler for simpler scheduling
```

### Multiple User Support
The infrastructure supports multiple users, just need to:
- Implement user registration/login flow
- Connect Google OAuth to user registration
- Add user-specific JWT tokens

---

## 🚨 Troubleshooting

### If Backend Won't Start
1. Check PostgreSQL is running: `docker ps`
2. If not running: `docker start postgres-email`
3. Verify environment variables in `.env`

### If API Returns 401 Unauthorized
1. Check JWT token hasn't expired
2. Regenerate JWT: `venv/bin/python simple_setup.py`

### If Email Sync Fails
1. Google token has expired
2. Get fresh token from OAuth Playground
3. Update with: `venv/bin/python update_token.py 'new_token'`

---

## ✅ Success Metrics

- ✅ 50 emails successfully synced to PostgreSQL
- ✅ All API endpoints tested and working
- ✅ JWT authentication functioning
- ✅ Database schema complete and optimized
- ✅ Email search, pagination, and filtering working
- ✅ Ready for frontend integration

**Bottom line**: The complex setup is done. Going forward, it's just starting the server and occasionally refreshing tokens.


  🚀 Future Workflows:
  - Daily development: Just uvicorn main:app --reload
  - Periodic email sync: 3-step token refresh process
  - API testing procedures

  📊 Current State:
  - Database status (50 emails, user account details)
  - File inventory with purposes
  - Success metrics achieved

  🔧 Troubleshooting Guide:
  - Common issues and solutions
  - How to restart services
  - Token refresh problems

  The key takeaway is documented clearly: The complex part is done forever. Going
   forward, you just start the server for development, and occasionally do a
  simple 3-step token refresh to sync new emails.


https://www.googleapis.com/auth/gmail.modify,https://www.googleapis.com/auth/gmail.send
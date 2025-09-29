# Frontend-Backend Integration Setup

This guide helps you connect your Next.js frontend to pull emails from the FastAPI backend database instead of Gmail directly.

## 🔧 What Changed

The frontend now:
- ✅ Fetches emails from your PostgreSQL database via FastAPI backend
- ✅ Uses JWT authentication with your backend
- ✅ Supports all email operations (read, send, search) through backend
- ✅ No longer makes direct Gmail API calls

## 🚀 Setup Instructions

### 1. Configure Frontend Environment

Copy the example environment file:
```bash
cd frontend
cp .env.local.example .env.local
```

Update `.env.local` with your settings:
```bash
# Google OAuth (same as before)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key

# Backend Integration
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_JWT_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjE3NTkyNDA0MjZ9.1Rqmn3ZqEOpnPcmEKXOod4FZLFKv94ylSVv8FoaWeE4
```

### 2. Start Both Services

**Terminal 1 - Backend:**
```bash
cd backend
venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 3. Test the Integration

1. **Visit**: http://localhost:3000
2. **Sign in** with Google OAuth (same as before)
3. **Check emails**: Should now load from your PostgreSQL database
4. **Test features**:
   - Click emails to mark as read ✅
   - Use search functionality ✅
   - Send new emails ✅

## 📊 How It Works Now

### Before (Direct Gmail):
```
Frontend → Gmail API → Gmail Servers
```

### After (Database Integration):
```
Frontend → Next.js API → FastAPI Backend → PostgreSQL Database
```

## 🔍 Troubleshooting

### Frontend not loading emails?
1. Check backend is running on port 8000
2. Check JWT token in `.env.local` matches `backend/jwt_token.txt`
3. Verify CORS is working (check browser console)

### Backend errors?
1. Ensure PostgreSQL is running: `docker ps`
2. Check you have 50 emails synced: `venv/bin/python test_api.py`
3. Verify JWT token is valid: `venv/bin/python test_current_token.py`

### API calls failing?
Check the browser Network tab for:
- CORS errors → Backend CORS is configured for `http://localhost:3000`
- 401 errors → JWT token expired or invalid
- 500 errors → Backend database connection issues

## ✨ Benefits

- **Faster loading**: Emails load from local database instead of Gmail API
- **Offline capability**: Works without internet once emails are synced
- **Advanced queries**: Search and filter emails efficiently
- **No rate limits**: No Gmail API quotas to worry about
- **Data persistence**: Your email data is stored locally

## 🔄 Syncing New Emails

To get new emails from Gmail into your database:

```bash
cd backend
# Update Google token if needed
venv/bin/python update_token.py 'fresh_google_token'
# Sync new emails
venv/bin/python sync_worker.py
```

## 📈 Next Steps

- [ ] Set up automatic email sync (cron job)
- [ ] Implement user management for multiple accounts
- [ ] Add real-time email notifications
- [ ] Deploy to production with proper authentication

Your frontend is now successfully integrated with your FastAPI backend! 🎉
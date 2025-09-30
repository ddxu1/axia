# Email Client

A multi-user email client with Next.js frontend and FastAPI backend, using PostgreSQL for email storage and Gmail API integration.

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker (for PostgreSQL)
- Google OAuth credentials

### Backend Setup

```bash
cd backend

# Start PostgreSQL
docker-compose up -d

# Create virtual environment and install dependencies
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Google OAuth credentials

# Run database migrations
alembic upgrade head

# Start the server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

API documentation available at: `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with:
# - Google OAuth credentials
# - NEXTAUTH_SECRET
# - NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Start development server
npm run dev
```

App available at: `http://localhost:3000`

## Features

- **Multi-user authentication**: Sign in with any Google account
- **Email management**: Read, send, search, archive emails
- **Database caching**: Fast email access via PostgreSQL
- **Background sync**: Automatic email synchronization from Gmail
- **Secure**: User-isolated data with JWT authentication

## Architecture

```
Frontend (Next.js, Port 3000)
    ↓
Backend API (FastAPI, Port 8000)
    ↓
PostgreSQL Database (Docker, Port 5432)
    ↓
Gmail API (Google)
```

## Key Endpoints

### Authentication
- `POST /auth/google-token` - Exchange Google token for JWT
- `GET /auth/me` - Get current user info
- `GET /auth/status` - Check auth status

### Emails (requires authentication)
- `GET /emails` - List emails with pagination
- `GET /emails/{id}` - Get specific email
- `POST /emails/send` - Send email
- `POST /emails/{id}/read` - Mark as read
- `DELETE /emails/{id}` - Delete email

## Database

Tables:
- `users` - User accounts and OAuth tokens
- `emails` - Email content and metadata
- `sync_state` - Sync tracking per user
- `alembic_version` - Migration history

## Development

### Run Tests
```bash
cd backend
python test_api.py
```

### Sync Emails
```bash
cd backend
python sync_worker.py
```

### Database Migrations
```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## Production Deployment

1. Update environment variables for production
2. Set secure `NEXTAUTH_SECRET` and JWT secrets
3. Use production PostgreSQL instance
4. Set up proper CORS configuration
5. Enable HTTPS
6. Set up background job queue (Celery/Redis) for email sync

## Tech Stack

**Frontend:**
- Next.js 15
- React 18
- TypeScript
- NextAuth.js
- Tailwind CSS

**Backend:**
- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- Python-JOSE (JWT)
- Google Auth Library

**Infrastructure:**
- Docker & Docker Compose
- Uvicorn (ASGI server)
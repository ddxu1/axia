# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A modern email client web application built with Next.js 15, React 18, and TypeScript. Currently supports Gmail integration via OAuth 2.0 with Gmail API for reading, composing, and managing emails. Designed for future multi-provider support (Outlook, Yahoo).

## Development Commands

```bash
# Development
npm run dev          # Start dev server at http://localhost:3000

# Production
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
```

## Environment Setup

Required environment variables in `.env.local`:
- `GOOGLE_CLIENT_ID` - OAuth client ID from Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - OAuth client secret
- `NEXTAUTH_SECRET` - Generated via `openssl rand -base64 32`
- `NEXTAUTH_URL` - Base URL (http://localhost:3000 for dev)

Google Cloud Console requirements:
- Gmail API must be enabled
- OAuth redirect URI: `http://localhost:3000/api/auth/callback/google`

## Architecture

### Authentication Flow
- NextAuth.js handles OAuth with Google Provider (src/lib/auth.ts:4-38)
- Auth configuration exports `authOptions` used by API route handler
- JWT callback stores `accessToken` from OAuth for Gmail API calls
- Session callback exposes `accessToken` to client-side session object
- Required OAuth scopes: `gmail.modify` and `gmail.send`

### Gmail Service Layer
`src/lib/gmail.ts` - Core Gmail API wrapper class:
- `GmailService` class instantiated with user's `accessToken`
- All Gmail operations go through this service (fetch, send, delete, archive, mark read/unread, label management)
- Uses googleapis npm package, authenticates via OAuth2Client
- Email operations use Gmail API's `messages` and `labels` endpoints
- HTML emails sent as multipart/alternative with plain text fallback

### API Routes Structure
- `/api/auth/[...nextauth]/route.ts` - NextAuth handler (delegates to src/lib/auth.ts)
- `/api/emails/route.ts` - GET: fetch emails list
- `/api/emails/send/route.ts` - POST: send new email
- `/api/emails/[id]/delete/route.ts` - DELETE: move to trash
- `/api/emails/[id]/archive/route.ts` - POST: archive email
- `/api/emails/[id]/mark-read/route.ts` - PATCH: toggle read status
- `/api/emails/[id]/labels/route.ts` - POST: manage email labels
- `/api/labels/route.ts` - GET: fetch Gmail labels

All email API routes:
1. Check session via `getServerSession(authOptions)`
2. Extract `accessToken` from session
3. Instantiate `GmailService` with token
4. Call service method and return JSON response

### Frontend Components
- `src/app/page.tsx` - Main app container, manages state for selected email, email list, compose modal, and search
- `src/components/EmailList.tsx` - Left sidebar, displays email list with infinite scroll
- `src/components/EmailViewer.tsx` - Right panel, displays selected email content with action buttons
- `src/components/ComposeEmail.tsx` - Modal for composing/sending emails
- `src/components/RichTextEditor.tsx` - HTML email editor component
- `src/components/LabelManager.tsx` - Label management UI
- `src/components/AuthButton.tsx` - Sign in/out button
- `src/components/Footer.tsx` - Landing page footer

State management:
- Client-side React state in page.tsx coordinates email list and viewer
- Email updates propagate via callbacks: `handleEmailUpdate`, `handleEmailDelete`, `handleEmailArchive`
- Search filtering happens client-side on already-fetched emails

### Type Definitions
`src/types/email.ts`:
- `Email` interface - core email object structure
- `EmailProvider` interface - for future multi-provider support (currently only Gmail active)

`src/types/next-auth.d.ts`:
- Extends NextAuth types to include `accessToken` on session and JWT

### Styling
- Tailwind CSS with custom configuration (tailwind.config.js)
- Global styles in `src/app/globals.css`
- Glass morphism design pattern used throughout UI
- Custom CSS classes: `.glass`, `.glass-card`, `.glass-button`, `.hover-lift`

## Key Implementation Details

### Email Fetching
- Emails fetched from Gmail API in batches (default 10)
- Only inbox emails shown via query `q: 'in:inbox'`
- Email detail fetched separately for each message (includes full body)
- Email body prefers `text/plain` MIME part, falls back to raw body data

### Email Actions
- Delete moves to trash (not permanent delete) via `gmail.users.messages.trash`
- Archive removes INBOX label via `gmail.users.messages.modify`
- Read/unread toggles UNREAD label
- Label operations use `addLabelIds` and `removeLabelIds` arrays

### Session Management
- Client components wrapped in `SessionProvider` (src/app/providers.tsx)
- `useSession()` hook provides current session state
- Access token refresh handled automatically by NextAuth

## Future Architecture Notes

The codebase is structured for multi-provider support:
- `EmailProvider` type defined but not fully implemented
- Gmail-specific logic isolated in `src/lib/gmail.ts`
- API routes could be abstracted to support multiple providers via factory pattern
- Consider adding `src/lib/outlook.ts`, `src/lib/yahoo.ts` with common interface
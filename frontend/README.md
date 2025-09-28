# Unified Email Client

A modern email client website that supports Gmail integration with plans to support multiple email providers.

## Features

- Gmail OAuth authentication
- Email list view with sender, subject, and snippet
- Email detail view with full content
- Responsive design with Tailwind CSS
- Built with Next.js and TypeScript

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- A Google Cloud Platform account
- Gmail account for testing

### 2. Google Cloud Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Set application type to "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
   - Save the Client ID and Client Secret

### 3. Environment Configuration

1. Copy the `.env.local` file and update the values:
   ```bash
   cp .env.local .env.local.example
   ```

2. Edit `.env.local` with your credentials:
   ```
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   NEXTAUTH_SECRET=your_nextauth_secret_here
   NEXTAUTH_URL=http://localhost:3000
   ```

   Generate a secure `NEXTAUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

### 4. Installation and Running

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### 5. Usage

1. Click "Connect Gmail" to authenticate with your Google account
2. Grant permissions to read your Gmail
3. View your inbox emails in the left panel
4. Click on any email to view its content in the right panel

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts  # NextAuth configuration
│   │   └── emails/route.ts              # Email API endpoint
│   ├── globals.css                      # Global styles
│   ├── layout.tsx                       # Root layout
│   ├── page.tsx                         # Main page
│   └── providers.tsx                    # Session provider
├── components/
│   ├── AuthButton.tsx                   # Authentication button
│   ├── EmailList.tsx                    # Email list component
│   └── EmailViewer.tsx                  # Email detail viewer
├── lib/
│   └── gmail.ts                         # Gmail API service
└── types/
    ├── email.ts                         # Email type definitions
    └── next-auth.d.ts                   # NextAuth type extensions
```

## Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js with Google OAuth
- **Email API**: Google Gmail API
- **Development**: ESLint, PostCSS

## Future Enhancements

- Support for additional email providers (Outlook, Yahoo)
- Email composition and sending
- Email search and filtering
- Email organization (folders, labels)
- Dark mode support
- Mobile responsive improvements
- Email attachments support

## Troubleshooting

### Common Issues

1. **Authentication errors**: Verify your Google Client ID and Secret are correct
2. **API errors**: Ensure Gmail API is enabled in Google Cloud Console
3. **Redirect URI mismatch**: Check that the redirect URI in Google Cloud matches exactly

### Development Notes

- The Gmail API requires proper OAuth scopes for email access
- Rate limiting may apply to Gmail API calls
- Email content is fetched on-demand for performance
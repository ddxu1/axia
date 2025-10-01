import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { code, provider } = await request.json()

    if (!code || !provider) {
      return NextResponse.json({ error: 'Code and provider are required' }, { status: 400 })
    }

    if (provider === 'google') {
      // Exchange Google authorization code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: `${process.env.NEXTAUTH_URL}/auth/oauth-callback`,
          grant_type: 'authorization_code'
        })
      })

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text()
        console.error('Google token exchange failed:', error)
        return NextResponse.json({ error: 'Failed to exchange code for tokens' }, { status: 400 })
      }

      const tokens = await tokenResponse.json()
      return NextResponse.json({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in
      })
    } else if (provider === 'azure-ad') {
      // Exchange Azure AD authorization code for tokens
      const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code,
          client_id: process.env.AZURE_AD_CLIENT_ID!,
          client_secret: process.env.AZURE_AD_CLIENT_SECRET!,
          redirect_uri: `${process.env.NEXTAUTH_URL}/auth/oauth-callback`,
          grant_type: 'authorization_code'
        })
      })

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text()
        console.error('Azure AD token exchange failed:', error)
        return NextResponse.json({ error: 'Failed to exchange code for tokens' }, { status: 400 })
      }

      const tokens = await tokenResponse.json()
      return NextResponse.json({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in
      })
    } else {
      return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error exchanging code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

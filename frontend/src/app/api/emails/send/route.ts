import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { backendApi } from '@/lib/backend-api'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { to, subject, htmlBody, plainTextBody, cc, bcc } = await request.json()

    if (!to || !subject || (!htmlBody && !plainTextBody)) {
      return NextResponse.json({
        error: 'To, subject, and body are required'
      }, { status: 400 })
    }

    // Validate email format for 'to' addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const toArray = Array.isArray(to) ? to : [to]

    for (const email of toArray) {
      if (!emailRegex.test(email)) {
        return NextResponse.json({
          error: `Invalid email address format: ${email}`
        }, { status: 400 })
      }
    }

    // Use backend JWT from session (multi-user) or fallback to environment
    const backendJwt = session.backendToken || process.env.NEXT_PUBLIC_BACKEND_JWT_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjE3NTkyNDA0MjZ9.1Rqmn3ZqEOpnPcmEKXOod4FZLFKv94ylSVv8FoaWeE4'

    if (!backendJwt) {
      return NextResponse.json({ error: 'Backend authentication required' }, { status: 401 })
    }

    backendApi.setJwtToken(backendJwt)

    // Send email via backend API
    await backendApi.sendEmail({
      to: toArray,
      subject,
      body_html: htmlBody,
      body_text: plainTextBody,
      cc: cc || [],
      bcc: bcc || []
    })

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully'
    })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
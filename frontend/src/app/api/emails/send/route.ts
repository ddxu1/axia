import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GmailService } from '@/lib/gmail'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { to, subject, htmlBody, plainTextBody } = await request.json()

    if (!to || !subject || !htmlBody) {
      return NextResponse.json({
        error: 'To, subject, and body are required'
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json({
        error: 'Invalid email address format'
      }, { status: 400 })
    }

    const gmailService = new GmailService(session.accessToken as string)
    const success = await gmailService.sendEmail(to, subject, htmlBody, plainTextBody)

    if (!success) {
      return NextResponse.json({
        error: 'Failed to send email'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully'
    })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
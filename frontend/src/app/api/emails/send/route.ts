import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GmailService } from '@/lib/gmail'
import { OutlookService } from '@/lib/outlook'
import { backendApi } from '@/lib/backend-api'
import { getConnectedAccounts } from '@/lib/accountsStore'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let to: string
    let subject: string
    let htmlBody: string
    let plainTextBody: string
    let attachments: { filename: string; mimeType: string; content: string }[] = []

    // Check if the request is FormData (with attachments) or JSON
    const contentType = request.headers.get('content-type')

    if (contentType && contentType.includes('multipart/form-data')) {
      // Handle FormData with attachments
      const formData = await request.formData()

      to = formData.get('to') as string
      subject = formData.get('subject') as string
      htmlBody = formData.get('htmlBody') as string
      plainTextBody = formData.get('plainTextBody') as string

      // Process attachments
      const files = formData.getAll('attachments')
      for (const file of files) {
        if (file instanceof File) {
          const buffer = await file.arrayBuffer()
          const base64Content = Buffer.from(buffer).toString('base64')

          attachments.push({
            filename: file.name,
            mimeType: file.type || 'application/octet-stream',
            content: base64Content
          })
        }
      }
    } else {
      // Handle JSON request (no attachments)
      const data = await request.json()
      to = data.to
      subject = data.subject
      htmlBody = data.htmlBody
      plainTextBody = data.plainTextBody
    }

    if (!to || !subject || (!htmlBody && !plainTextBody)) {
      return NextResponse.json({
        error: 'To, subject, and body are required'
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json({
        error: `Invalid email address format: ${to}`
      }, { status: 400 })
    }

    // Get provider info from query params for multi-provider support
    const url = new URL(request.url)
    const providerId = url.searchParams.get('providerId')
    const providerType = url.searchParams.get('providerType') as 'gmail' | 'outlook' | null

    let success = false

    // Multi-provider approach: use providerId and providerType if available
    if (providerId && providerType) {
      const accounts = getConnectedAccounts(session.user.email)
      const account = accounts.find(acc => acc.id === providerId)

      if (!account || !account.accessToken) {
        return NextResponse.json({ error: 'Account not found or no access token' }, { status: 404 })
      }

      if (providerType === 'gmail') {
        const gmailService = new GmailService(account.accessToken)
        success = await gmailService.sendEmail(
          to,
          subject,
          htmlBody,
          plainTextBody,
          attachments.length > 0 ? attachments : undefined
        )
      } else if (providerType === 'outlook') {
        const outlookService = new OutlookService(account.accessToken)
        success = await outlookService.sendEmail(
          to,
          subject,
          htmlBody,
          plainTextBody,
          attachments.length > 0 ? attachments : undefined
        )
      }
    } else {
      // Legacy approach: use session access token (assumes Gmail)
      if (!session.accessToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const gmailService = new GmailService(session.accessToken)
      success = await gmailService.sendEmail(
        to,
        subject,
        htmlBody,
        plainTextBody,
        attachments.length > 0 ? attachments : undefined
      )
    }

    if (!success) {
      return NextResponse.json({
        error: 'Failed to send email'
      }, { status: 500 })
    }

    // Also save to backend if available
    try {
      const backendJwt = session.backendToken || process.env.NEXT_PUBLIC_BACKEND_JWT_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjE3NTkyNDA0MjZ9.1Rqmn3ZqEOpnPcmEKXOod4FZLFKv94ylSVv8FoaWeE4'

      if (backendJwt) {
        backendApi.setJwtToken(backendJwt)
        await backendApi.sendEmail({
          to: [to],
          subject,
          body_html: htmlBody,
          body_text: plainTextBody,
          cc: [],
          bcc: []
        })
      }
    } catch (backendError) {
      // Log but don't fail if backend save fails
      console.error('Error saving to backend:', backendError)
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
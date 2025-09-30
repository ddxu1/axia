import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { backendApi } from '@/lib/backend-api'
import { GmailService } from '@/lib/gmail'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: emailId, attachmentId } = await params
    if (!emailId || !attachmentId) {
      return NextResponse.json({ error: 'Email ID and Attachment ID are required' }, { status: 400 })
    }

    // Use backend JWT from session (multi-user) or fallback to environment
    const backendJwt = session.backendToken || process.env.NEXT_PUBLIC_BACKEND_JWT_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjE3NTkyNDA0MjZ9.1Rqmn3ZqEOpnPcmEKXOod4FZLFKv94ylSVv8FoaWeE4'

    if (!backendJwt) {
      return NextResponse.json({ error: 'Backend authentication required' }, { status: 401 })
    }

    backendApi.setJwtToken(backendJwt)

    // Convert string ID to number for backend API
    const numericEmailId = parseInt(emailId)
    if (isNaN(numericEmailId)) {
      return NextResponse.json({ error: 'Invalid email ID' }, { status: 400 })
    }

    // First, get the email details to retrieve the Gmail ID
    const emailDetails = await backendApi.getEmail(numericEmailId)

    // Fetch attachment from Gmail
    if (emailDetails.gmail_id) {
      const gmailService = new GmailService(session.accessToken)
      const attachment = await gmailService.getAttachment(emailDetails.gmail_id, attachmentId)

      if (attachment) {
        // Get filename from request query or default
        const filename = request.nextUrl.searchParams.get('filename') || 'attachment'
        const mimeType = request.nextUrl.searchParams.get('mimeType') || 'application/octet-stream'

        // Decode base64 data
        const buffer = Buffer.from(attachment.data, 'base64')

        // Return as downloadable file
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': mimeType,
            'Content-Disposition': `inline; filename="${filename}"`,
            'Content-Length': buffer.length.toString(),
          },
        })
      }
    }

    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
  } catch (error) {
    console.error('Error fetching attachment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
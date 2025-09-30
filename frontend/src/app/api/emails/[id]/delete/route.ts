import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { backendApi } from '@/lib/backend-api'
import { GmailService } from '@/lib/gmail'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: emailId } = await params
    if (!emailId) {
      return NextResponse.json({ error: 'Email ID is required' }, { status: 400 })
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

    // Delete from Gmail first
    if (emailDetails.gmail_id) {
      const gmailService = new GmailService(session.accessToken)
      const gmailDeleted = await gmailService.deleteEmail(emailDetails.gmail_id)

      if (!gmailDeleted) {
        console.warn(`Failed to delete email from Gmail: ${emailDetails.gmail_id}`)
        // Continue with backend deletion even if Gmail deletion fails
      }
    }

    // Delete email in backend database
    await backendApi.deleteEmail(numericEmailId)

    return NextResponse.json({ success: true, message: 'Email deleted successfully' })
  } catch (error) {
    console.error('Error deleting email:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
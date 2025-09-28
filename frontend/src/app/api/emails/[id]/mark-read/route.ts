import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GmailService } from '@/lib/gmail'

export async function POST(
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

    const { isRead } = await request.json()

    const gmailService = new GmailService(session.accessToken as string)
    const success = isRead
      ? await gmailService.markAsRead(emailId)
      : await gmailService.markAsUnread(emailId)

    if (!success) {
      return NextResponse.json({
        error: `Failed to mark email as ${isRead ? 'read' : 'unread'}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Email marked as ${isRead ? 'read' : 'unread'} successfully`
    })
  } catch (error) {
    console.error('Error updating email read status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
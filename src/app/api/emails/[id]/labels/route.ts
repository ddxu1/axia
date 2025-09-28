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

    const { action, labelIds } = await request.json()

    if (!action || !labelIds || !Array.isArray(labelIds)) {
      return NextResponse.json({
        error: 'Action and labelIds array are required'
      }, { status: 400 })
    }

    const gmailService = new GmailService(session.accessToken as string)
    let success = false

    if (action === 'add') {
      success = await gmailService.addLabelsToEmail(emailId, labelIds)
    } else if (action === 'remove') {
      success = await gmailService.removeLabelsFromEmail(emailId, labelIds)
    } else {
      return NextResponse.json({
        error: 'Invalid action. Use "add" or "remove"'
      }, { status: 400 })
    }

    if (!success) {
      return NextResponse.json({
        error: `Failed to ${action} labels`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Labels ${action === 'add' ? 'added to' : 'removed from'} email successfully`
    })
  } catch (error) {
    console.error('Error updating email labels:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GmailService } from '@/lib/gmail'
import { ConnectedAccountsAPI } from '@/lib/connected-accounts-api'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: emailId } = await params
    if (!emailId) {
      return NextResponse.json({ error: 'Email ID is required' }, { status: 400 })
    }

    const { isRead } = await request.json()

    // Get account ID from query params
    const url = new URL(request.url)
    const accountId = url.searchParams.get('accountId')

    // Get backend token
    const backendToken = session.backendToken || process.env.NEXT_PUBLIC_BACKEND_JWT_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjE3NTkyNDA0MjZ9.1Rqmn3ZqEOpnPcmEKXOod4FZLFKv94ylSVv8FoaWeE4'
    const accountsAPI = new ConnectedAccountsAPI(backendToken)

    let accessToken: string

    // If accountId is 'database', use first connected account
    if (!accountId || accountId === 'database') {
      const accounts = await accountsAPI.getConnectedAccounts()
      if (accounts.length === 0) {
        return NextResponse.json({ error: 'No connected accounts found' }, { status: 404 })
      }
      const tokenData = await accountsAPI.getAccountToken(accounts[0].id)
      accessToken = tokenData.access_token
    } else {
      const tokenData = await accountsAPI.getAccountToken(parseInt(accountId))
      accessToken = tokenData.access_token
    }

    // Update read status via Gmail API
    const gmailService = new GmailService(accessToken)
    const success = isRead
      ? await gmailService.markAsRead(emailId)
      : await gmailService.markAsUnread(emailId)

    if (!success) {
      return NextResponse.json({ error: 'Failed to update email read status' }, { status: 500 })
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

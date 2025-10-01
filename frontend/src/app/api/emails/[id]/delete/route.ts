import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GmailService } from '@/lib/gmail'
import { ConnectedAccountsAPI } from '@/lib/connected-accounts-api'

export async function DELETE(
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

    // Get account ID from query params
    const url = new URL(request.url)
    const accountId = url.searchParams.get('accountId')

    // Get backend token
    const backendToken = session.backendToken || process.env.NEXT_PUBLIC_BACKEND_JWT_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjE3NTkyNDA0MjZ9.1Rqmn3ZqEOpnPcmEKXOod4FZLFKv94ylSVv8FoaWeE4'
    const accountsAPI = new ConnectedAccountsAPI(backendToken)

    let accessToken: string

    // If accountId is 'database', we need to find which account owns this email
    // For now, just use the first connected account's token
    if (!accountId || accountId === 'database') {
      const accounts = await accountsAPI.getConnectedAccounts()
      if (accounts.length === 0) {
        return NextResponse.json({ error: 'No connected accounts found' }, { status: 404 })
      }
      // Use first account (TODO: track which account owns each email)
      const tokenData = await accountsAPI.getAccountToken(accounts[0].id)
      accessToken = tokenData.access_token
    } else {
      // Get access token for the specific account
      const tokenData = await accountsAPI.getAccountToken(parseInt(accountId))
      accessToken = tokenData.access_token
    }

    // Delete email via Gmail API
    const gmailService = new GmailService(accessToken)
    const success = await gmailService.deleteEmail(emailId)

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Email deleted successfully' })
  } catch (error) {
    console.error('Error deleting email:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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

    const backendToken = session.backendToken || process.env.NEXT_PUBLIC_BACKEND_JWT_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjE3NTkyNDA0MjZ9.1Rqmn3ZqEOpnPcmEKXOod4FZLFKv94ylSVv8FoaWeE4'
    if (!backendToken) {
      return NextResponse.json({ error: 'Backend token missing' }, { status: 401 })
    }

    const { id: accountId } = await params

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })
    }

    // Remove connected account from backend
    const api = new ConnectedAccountsAPI(backendToken)
    await api.removeConnectedAccount(parseInt(accountId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing connected account:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

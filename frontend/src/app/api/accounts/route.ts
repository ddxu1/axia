import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ConnectedAccountsAPI } from '@/lib/connected-accounts-api'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const backendToken = session.backendToken
    if (!backendToken) {
      return NextResponse.json({ error: 'Backend token missing' }, { status: 401 })
    }

    // Fetch connected accounts from backend
    const api = new ConnectedAccountsAPI(backendToken)
    const backendAccounts = await api.getConnectedAccounts()

    // Convert backend format to frontend format
    const accounts = backendAccounts.map(acc => ({
      id: String(acc.id),
      provider: acc.provider as 'gmail' | 'outlook',
      email: acc.email,
      isActive: acc.is_active,
      displayName: acc.display_name || acc.email
    }))

    return NextResponse.json(accounts)
  } catch (error) {
    console.error('Error fetching connected accounts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const backendToken = session.backendToken
    if (!backendToken) {
      return NextResponse.json({ error: 'Backend token missing' }, { status: 401 })
    }

    const { provider, accessToken, refreshToken, expiresIn } = await request.json()

    if (!provider || !accessToken) {
      return NextResponse.json({ error: 'Provider and access token are required' }, { status: 400 })
    }

    // Add connected account to backend
    const api = new ConnectedAccountsAPI(backendToken)
    const backendAccount = await api.addConnectedAccount({
      provider,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn
    })

    // Convert to frontend format
    const account = {
      id: String(backendAccount.id),
      provider: backendAccount.provider as 'gmail' | 'outlook',
      email: backendAccount.email,
      isActive: backendAccount.is_active,
      displayName: backendAccount.display_name || backendAccount.email
    }

    return NextResponse.json(account)
  } catch (error) {
    console.error('Error adding connected account:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const backendToken = session.backendToken
    if (!backendToken) {
      return NextResponse.json({ error: 'Backend token missing' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('id')

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
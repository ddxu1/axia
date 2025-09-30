import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { backendApi } from '@/lib/backend-api'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use backend JWT from session (multi-user) or fallback to environment
    const backendJwt = session.backendToken || process.env.NEXT_PUBLIC_BACKEND_JWT_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjE3NTkyNDA0MjZ9.1Rqmn3ZqEOpnPcmEKXOod4FZLFKv94ylSVv8FoaWeE4'

    if (!backendJwt) {
      return NextResponse.json({ error: 'Backend authentication required' }, { status: 401 })
    }

    backendApi.setJwtToken(backendJwt)

    // Call backend sync endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/emails/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${backendJwt}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Backend sync failed: ${response.status} ${errorText}`)
    }

    const data = await response.json()

    return NextResponse.json({
      message: data.message,
      status: data.status,
      user_email: data.user_email
    })
  } catch (error) {
    console.error('Error triggering sync:', error)
    return NextResponse.json({ error: 'Failed to trigger sync' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { backendApi } from '@/lib/backend-api'

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

    // Archive email in backend database
    await backendApi.archiveEmail(numericEmailId)

    return NextResponse.json({ success: true, message: 'Email archived successfully' })
  } catch (error) {
    console.error('Error archiving email:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
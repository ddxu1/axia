import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { backendApi, convertBackendEmailToFrontend } from '@/lib/backend-api'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    console.log('Session:', session)

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized - No access token' }, { status: 401 })
    }

    // Get search parameters
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const per_page = parseInt(url.searchParams.get('per_page') || '50')
    const search = url.searchParams.get('search') || undefined
    const is_read = url.searchParams.get('is_read') ? url.searchParams.get('is_read') === 'true' : undefined

    // Use backend JWT from session (multi-user) or fallback to environment
    const backendJwt = session.backendToken || process.env.NEXT_PUBLIC_BACKEND_JWT_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjE3NTkyNDA0MjZ9.1Rqmn3ZqEOpnPcmEKXOod4FZLFKv94ylSVv8FoaWeE4'

    if (!backendJwt) {
      return NextResponse.json({ error: 'Backend authentication required' }, { status: 401 })
    }

    backendApi.setJwtToken(backendJwt)

    // Fetch emails from backend database instead of Gmail
    const backendResponse = await backendApi.getEmails({
      page,
      per_page,
      search,
      is_read,
    })

    // Convert backend emails to frontend format
    const emails = backendResponse.emails.map(convertBackendEmailToFrontend)

    return NextResponse.json({
      emails,
      total: backendResponse.total,
      page: backendResponse.page,
      per_page: backendResponse.per_page
    })
  } catch (error) {
    console.error('Error fetching emails from backend:', error)
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 })
  }
}
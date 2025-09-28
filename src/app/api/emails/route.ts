import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GmailService } from '@/lib/gmail'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    console.log('Session:', session)

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized - No access token' }, { status: 401 })
    }

    const gmailService = new GmailService(session.accessToken as string)
    const emails = await gmailService.getEmails(20)

    return NextResponse.json({ emails })
  } catch (error) {
    console.error('Error fetching emails:', error)
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 })
  }
}
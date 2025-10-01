import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { backendApi, convertBackendEmailToFrontend } from '@/lib/backend-api'
import { GmailService } from '@/lib/gmail'
import { OutlookService } from '@/lib/outlook'
import { Email } from '@/types/email'
import { ConnectedAccountsAPI } from '@/lib/connected-accounts-api'

async function fetchEmailsFromProvider(
  accountId: number,
  provider: string,
  email: string,
  accessToken: string,
  params: {
    page: number
    per_page: number
    search?: string
    is_read?: boolean
    is_starred?: boolean
    label?: string
  }
): Promise<{ emails: Email[], total: number }> {
  const { page, per_page, search, is_read, is_starred, label } = params

  if (provider === 'gmail' || provider === 'google') {
    console.log(`Fetching Gmail emails for ${email} with token:`, accessToken ? 'present' : 'missing')
    const gmailService = new GmailService(accessToken)
    const emails = await gmailService.getEmails({
      maxResults: per_page,
      pageToken: page > 1 ? undefined : undefined,
      q: search,
      labelIds: label ? [label] : undefined
    })
    console.log(`GmailService returned ${emails.length} emails for ${email}`)

    let filteredEmails = emails
    if (is_read !== undefined) {
      filteredEmails = filteredEmails.filter(email => email.isRead === is_read)
    }
    if (is_starred !== undefined) {
      filteredEmails = filteredEmails.filter(email => email.isStarred === is_starred)
    }

    const emailsWithProvider = filteredEmails.map(emailItem => ({
      ...emailItem,
      providerId: String(accountId),
      providerType: 'gmail' as const,
      accountEmail: email
    }))

    return {
      emails: emailsWithProvider,
      total: emailsWithProvider.length
    }
  } else if (provider === 'outlook' || provider === 'azure-ad') {
    const outlookService = new OutlookService(accessToken)
    const emails = await outlookService.getEmails({
      top: per_page,
      skip: (page - 1) * per_page,
      search,
      filter: is_read !== undefined ? `isRead eq ${is_read}` : undefined
    })

    const emailsWithProvider = emails.map(emailItem => ({
      ...emailItem,
      providerId: String(accountId),
      providerType: 'outlook' as const,
      accountEmail: email
    }))

    return {
      emails: emailsWithProvider,
      total: emailsWithProvider.length
    }
  }

  return { emails: [], total: 0 }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    console.log('Session:', session)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get search parameters
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const per_page = parseInt(url.searchParams.get('per_page') || '50')
    const search = url.searchParams.get('search') || undefined
    const is_read = url.searchParams.get('is_read') ? url.searchParams.get('is_read') === 'true' : undefined
    const is_starred = url.searchParams.get('is_starred') ? url.searchParams.get('is_starred') === 'true' : undefined
    const label = url.searchParams.get('label') || undefined
    const accountId = url.searchParams.get('accountId') || 'all'
    const source = url.searchParams.get('source') || 'database' // 'database' (fast) or 'live' (slow)

    // Get backend token for database access
    const backendToken = session.backendToken || process.env.NEXT_PUBLIC_BACKEND_JWT_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjE3NTkyNDA0MjZ9.1Rqmn3ZqEOpnPcmEKXOod4FZLFKv94ylSVv8FoaWeE4'

    backendApi.setJwtToken(backendToken)

    // Default: fetch from database (fast)
    if (source === 'database') {
      console.log('Fetching emails from database (fast path)')

      const backendResponse = await backendApi.getEmails({
        page,
        per_page,
        search,
        is_read,
        is_starred,
        label,
      })

      const emails = backendResponse.emails.map(convertBackendEmailToFrontend)

      console.log(`Returning ${emails.length} emails from database`)

      return NextResponse.json({
        emails,
        total: backendResponse.total,
        page: backendResponse.page,
        per_page: backendResponse.per_page,
        source: 'database'
      })
    }

    // Live fetch from Gmail API (slow, for background sync)
    console.log('Fetching emails live from Gmail API')

    const accountsAPI = new ConnectedAccountsAPI(backendToken)
    const connectedAccounts = await accountsAPI.getConnectedAccounts()

    console.log('Connected accounts found:', connectedAccounts.length, connectedAccounts.map(a => ({ id: a.id, email: a.email, provider: a.provider })))

    if (connectedAccounts.length === 0) {
      return NextResponse.json({
        emails: [],
        total: 0,
        page,
        per_page,
        source: 'live'
      })
    }

    let allEmails: Email[] = []
    let totalCount = 0

    if (accountId === 'all') {
      // Fetch emails from all connected accounts
      for (const account of connectedAccounts) {
        try {
          console.log(`Fetching emails for account ${account.id} (${account.email}, ${account.provider})`)

          const tokenData = await accountsAPI.getAccountToken(account.id)
          console.log(`Got access token for account ${account.id}:`, tokenData.access_token ? 'present' : 'missing')

          const result = await fetchEmailsFromProvider(
            account.id,
            account.provider,
            account.email,
            tokenData.access_token,
            {
              page,
              per_page: Math.ceil(per_page / connectedAccounts.length),
              search,
              is_read,
              is_starred,
              label
            }
          )
          console.log(`Fetched ${result.emails.length} emails from ${account.email}`)
          allEmails.push(...result.emails)
          totalCount += result.total
        } catch (error) {
          console.error(`Error fetching emails from ${account.provider} (${account.email}):`, error)
        }
      }

      allEmails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      allEmails = allEmails.slice(0, per_page)

      console.log(`Total emails after merging and sorting: ${allEmails.length}`)
    } else {
      // Fetch emails from specific account
      const account = connectedAccounts.find(acc => String(acc.id) === accountId)
      if (!account) {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 })
      }

      try {
        const tokenData = await accountsAPI.getAccountToken(account.id)

        const result = await fetchEmailsFromProvider(
          account.id,
          account.provider,
          account.email,
          tokenData.access_token,
          {
            page,
            per_page,
            search,
            is_read,
            is_starred,
            label
          }
        )
        allEmails = result.emails
        totalCount = result.total
      } catch (error) {
        console.error(`Error fetching emails from ${account.provider}:`, error)
        return NextResponse.json({ error: `Failed to fetch emails from ${account.provider}` }, { status: 500 })
      }
    }

    console.log(`Returning ${allEmails.length} emails to frontend`)

    return NextResponse.json({
      emails: allEmails,
      total: totalCount,
      page,
      per_page,
      source: 'live'
    })
  } catch (error) {
    console.error('Error fetching emails:', error)
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 })
  }
}
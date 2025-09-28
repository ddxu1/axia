import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { Email } from '@/types/email'

export class GmailService {
  private oauth2Client: OAuth2Client

  constructor(accessToken: string) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL + '/api/auth/callback/google'
    )
    this.oauth2Client.setCredentials({ access_token: accessToken })
  }

  async getEmails(maxResults: number = 10): Promise<Email[]> {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })

    try {
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: 'in:inbox'
      })

      const messages = response.data.messages || []
      const emails: Email[] = []

      for (const message of messages) {
        if (message.id) {
          const emailDetail = await this.getEmailDetail(message.id)
          if (emailDetail) {
            emails.push(emailDetail)
          }
        }
      }

      return emails
    } catch (error) {
      console.error('Error fetching emails:', error)
      throw error
    }
  }

  private async getEmailDetail(messageId: string): Promise<Email | null> {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })

    try {
      const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      })

      const message = response.data
      const headers = message.payload?.headers || []

      const getHeader = (name: string) =>
        headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || ''

      const subject = getHeader('Subject')
      const from = getHeader('From')
      const to = getHeader('To').split(',').map(email => email.trim())
      const date = new Date(getHeader('Date'))

      let body = ''
      if (message.payload?.parts) {
        const textPart = message.payload.parts.find(part => part.mimeType === 'text/plain')
        if (textPart?.body?.data) {
          body = Buffer.from(textPart.body.data, 'base64').toString()
        }
      } else if (message.payload?.body?.data) {
        body = Buffer.from(message.payload.body.data, 'base64').toString()
      }

      return {
        id: messageId,
        threadId: message.threadId || '',
        subject,
        from,
        to,
        date,
        snippet: message.snippet || '',
        body,
        isRead: !(message.labelIds?.includes('UNREAD') || false),
        labels: message.labelIds || []
      }
    } catch (error) {
      console.error('Error fetching email detail:', error)
      return null
    }
  }
}
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

  async deleteEmail(messageId: string): Promise<boolean> {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })

    try {
      // Move to trash instead of permanent delete (more Gmail-like)
      await gmail.users.messages.trash({
        userId: 'me',
        id: messageId
      })
      return true
    } catch (error) {
      console.error('Error moving email to trash:', error)

      // Fallback: try permanent delete if trash fails
      try {
        await gmail.users.messages.delete({
          userId: 'me',
          id: messageId
        })
        return true
      } catch (deleteError) {
        console.error('Error permanently deleting email:', deleteError)
        return false
      }
    }
  }

  async markAsRead(messageId: string): Promise<boolean> {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })

    try {
      await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD']
        }
      })
      return true
    } catch (error) {
      console.error('Error marking email as read:', error)
      return false
    }
  }

  async markAsUnread(messageId: string): Promise<boolean> {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })

    try {
      await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: ['UNREAD']
        }
      })
      return true
    } catch (error) {
      console.error('Error marking email as unread:', error)
      return false
    }
  }

  async archiveEmail(messageId: string): Promise<boolean> {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })

    try {
      await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['INBOX']
        }
      })
      return true
    } catch (error) {
      console.error('Error archiving email:', error)
      return false
    }
  }

  async addLabelsToEmail(messageId: string, labelIds: string[]): Promise<boolean> {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })

    try {
      await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: labelIds
        }
      })
      return true
    } catch (error) {
      console.error('Error adding labels to email:', error)
      return false
    }
  }

  async removeLabelsFromEmail(messageId: string, labelIds: string[]): Promise<boolean> {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })

    try {
      await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: labelIds
        }
      })
      return true
    } catch (error) {
      console.error('Error removing labels from email:', error)
      return false
    }
  }

  async getLabels(): Promise<Array<{id: string, name: string, type: string}>> {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })

    try {
      const response = await gmail.users.labels.list({
        userId: 'me'
      })

      return (response.data.labels || []).map(label => ({
        id: label.id || '',
        name: label.name || '',
        type: label.type || ''
      })).filter(label =>
        // Filter out system labels and show user labels and important system ones
        label.type === 'user' ||
        ['IMPORTANT', 'STARRED', 'CATEGORY_PERSONAL', 'CATEGORY_SOCIAL', 'CATEGORY_PROMOTIONS', 'CATEGORY_UPDATES', 'CATEGORY_FORUMS'].includes(label.id)
      )
    } catch (error) {
      console.error('Error fetching labels:', error)
      return []
    }
  }

  async sendEmail(to: string, subject: string, htmlBody: string, plainTextBody?: string): Promise<boolean> {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })

    try {
      // Create the email message
      const emailLines = [
        `To: ${to}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        'Content-Type: multipart/alternative; boundary="boundary"',
        '',
        '--boundary',
        'Content-Type: text/plain; charset=UTF-8',
        '',
        plainTextBody || this.stripHtml(htmlBody),
        '',
        '--boundary',
        'Content-Type: text/html; charset=UTF-8',
        '',
        htmlBody,
        '',
        '--boundary--'
      ]

      const email = emailLines.join('\n')
      const encodedEmail = Buffer.from(email).toString('base64url')

      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail
        }
      })

      return true
    } catch (error) {
      console.error('Error sending email:', error)
      return false
    }
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
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
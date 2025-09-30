import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { Email, Attachment } from '@/types/email'

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

  async sendEmail(to: string, subject: string, htmlBody: string, plainTextBody?: string, attachments?: { filename: string; mimeType: string; content: string }[]): Promise<boolean> {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })

    try {
      let email: string

      if (attachments && attachments.length > 0) {
        // Create multipart/mixed message with attachments
        const boundary = `boundary_${Date.now()}`
        const messageBoundary = `message_${Date.now()}`

        const emailLines = [
          `To: ${to}`,
          `Subject: ${subject}`,
          'MIME-Version: 1.0',
          `Content-Type: multipart/mixed; boundary="${boundary}"`,
          '',
          `--${boundary}`,
          `Content-Type: multipart/alternative; boundary="${messageBoundary}"`,
          '',
          `--${messageBoundary}`,
          'Content-Type: text/plain; charset=UTF-8',
          '',
          plainTextBody || this.stripHtml(htmlBody),
          '',
          `--${messageBoundary}`,
          'Content-Type: text/html; charset=UTF-8',
          '',
          htmlBody,
          '',
          `--${messageBoundary}--`,
        ]

        // Add attachments
        for (const attachment of attachments) {
          emailLines.push(
            `--${boundary}`,
            `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"`,
            'Content-Transfer-Encoding: base64',
            `Content-Disposition: attachment; filename="${attachment.filename}"`,
            '',
            attachment.content,
            ''
          )
        }

        emailLines.push(`--${boundary}--`)
        email = emailLines.join('\n')
      } else {
        // No attachments, use simple multipart/alternative
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
        email = emailLines.join('\n')
      }

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

  private extractAttachments(payload: any): Attachment[] {
    const attachments: Attachment[] = []

    const processPartForAttachments = (part: any) => {
      // Check if this part is an attachment
      if (part.filename && part.body?.attachmentId) {
        attachments.push({
          id: part.body.attachmentId,
          filename: part.filename,
          mimeType: part.mimeType || 'application/octet-stream',
          size: part.body.size || 0,
          attachmentId: part.body.attachmentId
        })
      }

      // Recursively process nested parts
      if (part.parts) {
        part.parts.forEach((nestedPart: any) => {
          processPartForAttachments(nestedPart)
        })
      }
    }

    // Process all parts in the payload
    if (payload?.parts) {
      payload.parts.forEach((part: any) => {
        processPartForAttachments(part)
      })
    }

    return attachments
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
      let body_html = ''
      let body_text = ''

      // Extract body content from parts
      const extractBodyFromParts = (parts: any[]) => {
        for (const part of parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            body_text = Buffer.from(part.body.data, 'base64').toString()
            if (!body) body = body_text
          } else if (part.mimeType === 'text/html' && part.body?.data) {
            body_html = Buffer.from(part.body.data, 'base64').toString()
          } else if (part.parts) {
            extractBodyFromParts(part.parts)
          }
        }
      }

      if (message.payload?.parts) {
        extractBodyFromParts(message.payload.parts)
      } else if (message.payload?.body?.data) {
        body = Buffer.from(message.payload.body.data, 'base64').toString()
        body_text = body
      }

      // Extract attachments
      const attachments = this.extractAttachments(message.payload)

      return {
        id: messageId,
        threadId: message.threadId || '',
        subject,
        from,
        to,
        date,
        snippet: message.snippet || '',
        body,
        body_text,
        body_html,
        isRead: !(message.labelIds?.includes('UNREAD') || false),
        isStarred: message.labelIds?.includes('STARRED') || false,
        labels: message.labelIds || [],
        attachments
      }
    } catch (error) {
      console.error('Error fetching email detail:', error)
      return null
    }
  }

  async getAttachment(messageId: string, attachmentId: string): Promise<{ data: string; size: number } | null> {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })

    try {
      const response = await gmail.users.messages.attachments.get({
        userId: 'me',
        messageId,
        id: attachmentId
      })

      if (response.data.data) {
        return {
          data: response.data.data,
          size: response.data.size || 0
        }
      }
      return null
    } catch (error) {
      console.error('Error fetching attachment:', error)
      return null
    }
  }
}
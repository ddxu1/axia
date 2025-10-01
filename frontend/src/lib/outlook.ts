import { Client } from '@microsoft/microsoft-graph-client'
import { Email, Attachment } from '@/types/email'

export class OutlookService {
  private graphClient: Client

  constructor(accessToken: string) {
    this.graphClient = Client.init({
      authProvider: {
        getAccessToken: async () => {
          return accessToken
        }
      }
    })
  }

  async getEmails(params?: {
    maxResults?: number;
    top?: number;
    skip?: number;
    search?: string;
    filter?: string;
  }): Promise<Email[]> {
    try {
      const { maxResults = 10, top, skip = 0, search, filter } = params || {}
      const limit = top || maxResults

      let query = this.graphClient
        .api('/me/messages')
        .top(limit)
        .skip(skip)
        .select('id,subject,from,toRecipients,receivedDateTime,bodyPreview,body,isRead,flag,hasAttachments')
        .orderby('receivedDateTime desc')

      // Apply search if provided
      if (search) {
        query = query.search(`"${search}"`)
      }

      // Apply filter if provided, otherwise default to inbox
      if (filter) {
        query = query.filter(filter)
      } else {
        // Default to inbox messages only
        const inboxFolder = await this.graphClient
          .api('/me/mailFolders/inbox')
          .get()
        if (inboxFolder?.id) {
          query = query.filter(`parentFolderId eq '${inboxFolder.id}'`)
        }
      }

      const response = await query.get()
      const messages = response.value || []
      const emails: Email[] = []

      for (const message of messages) {
        const email = await this.convertMessageToEmail(message)
        if (email) {
          emails.push(email)
        }
      }

      return emails
    } catch (error) {
      console.error('Error fetching emails from Outlook:', error)
      throw error
    }
  }

  async deleteEmail(messageId: string): Promise<boolean> {
    try {
      await this.graphClient.api(`/me/messages/${messageId}`).delete()
      return true
    } catch (error) {
      console.error('Error deleting email in Outlook:', error)
      return false
    }
  }

  async markAsRead(messageId: string): Promise<boolean> {
    try {
      await this.graphClient.api(`/me/messages/${messageId}`).patch({
        isRead: true
      })
      return true
    } catch (error) {
      console.error('Error marking email as read in Outlook:', error)
      return false
    }
  }

  async markAsUnread(messageId: string): Promise<boolean> {
    try {
      await this.graphClient.api(`/me/messages/${messageId}`).patch({
        isRead: false
      })
      return true
    } catch (error) {
      console.error('Error marking email as unread in Outlook:', error)
      return false
    }
  }

  async archiveEmail(messageId: string): Promise<boolean> {
    try {
      // Move to Archive folder in Outlook
      const archiveFolders = await this.graphClient
        .api('/me/mailFolders')
        .filter("displayName eq 'Archive'")
        .get()

      let archiveFolderId = 'archive'
      if (archiveFolders.value && archiveFolders.value.length > 0) {
        archiveFolderId = archiveFolders.value[0].id
      }

      await this.graphClient.api(`/me/messages/${messageId}/move`).post({
        destinationId: archiveFolderId
      })
      return true
    } catch (error) {
      console.error('Error archiving email in Outlook:', error)
      return false
    }
  }

  async sendEmail(to: string, subject: string, htmlBody: string, plainTextBody?: string, attachments?: { filename: string; mimeType: string; content: string }[]): Promise<boolean> {
    try {
      const message: any = {
        subject,
        body: {
          contentType: htmlBody ? 'HTML' : 'Text',
          content: htmlBody || plainTextBody || ''
        },
        toRecipients: [
          {
            emailAddress: {
              address: to
            }
          }
        ]
      }

      // Add attachments if provided
      if (attachments && attachments.length > 0) {
        message.attachments = attachments.map(att => ({
          '@odata.type': '#microsoft.graph.fileAttachment',
          name: att.filename,
          contentType: att.mimeType,
          contentBytes: att.content
        }))
      }

      await this.graphClient.api('/me/sendMail').post({
        message
      })

      return true
    } catch (error) {
      console.error('Error sending email via Outlook:', error)
      return false
    }
  }

  async getLabels(): Promise<Array<{id: string, name: string, type: string}>> {
    try {
      const response = await this.graphClient
        .api('/me/mailFolders')
        .select('id,displayName,childFolderCount')
        .get()

      return (response.value || []).map((folder: any) => ({
        id: folder.id || '',
        name: folder.displayName || '',
        type: 'user'
      }))
    } catch (error) {
      console.error('Error fetching folders from Outlook:', error)
      return []
    }
  }

  async addLabelsToEmail(messageId: string, labelIds: string[]): Promise<boolean> {
    // Outlook uses folders instead of labels
    // This would require moving the email to a specific folder
    try {
      if (labelIds.length > 0) {
        await this.graphClient.api(`/me/messages/${messageId}/move`).post({
          destinationId: labelIds[0] // Move to first folder
        })
      }
      return true
    } catch (error) {
      console.error('Error moving email to folder in Outlook:', error)
      return false
    }
  }

  async removeLabelsFromEmail(messageId: string, labelIds: string[]): Promise<boolean> {
    // In Outlook, this would mean moving back to inbox or another folder
    try {
      // Move back to inbox
      await this.graphClient.api(`/me/messages/${messageId}/move`).post({
        destinationId: 'inbox'
      })
      return true
    } catch (error) {
      console.error('Error removing labels from email in Outlook:', error)
      return false
    }
  }

  async getAttachment(messageId: string, attachmentId: string): Promise<{ data: string; size: number } | null> {
    try {
      const attachment = await this.graphClient
        .api(`/me/messages/${messageId}/attachments/${attachmentId}`)
        .get()

      if (attachment.contentBytes) {
        return {
          data: attachment.contentBytes,
          size: attachment.size || 0
        }
      }
      return null
    } catch (error) {
      console.error('Error fetching attachment from Outlook:', error)
      return null
    }
  }

  private async convertMessageToEmail(message: any): Promise<Email | null> {
    try {
      // Extract attachments if present
      const attachments: Attachment[] = []
      if (message.hasAttachments) {
        try {
          const attachmentResponse = await this.graphClient
            .api(`/me/messages/${message.id}/attachments`)
            .get()

          if (attachmentResponse.value) {
            for (const att of attachmentResponse.value) {
              attachments.push({
                id: att.id,
                filename: att.name || 'Unknown',
                mimeType: att.contentType || 'application/octet-stream',
                size: att.size || 0,
                attachmentId: att.id
              })
            }
          }
        } catch (error) {
          console.error('Error fetching attachments for message:', message.id, error)
        }
      }

      return {
        id: message.id,
        threadId: message.conversationId || message.id,
        subject: message.subject || 'No Subject',
        from: message.from?.emailAddress?.address || 'Unknown',
        to: (message.toRecipients || []).map((recipient: any) => recipient.emailAddress?.address || 'Unknown'),
        date: new Date(message.receivedDateTime),
        snippet: message.bodyPreview || '',
        body: message.body?.content || message.bodyPreview || '',
        body_text: message.body?.contentType === 'Text' ? message.body.content : '',
        body_html: message.body?.contentType === 'HTML' ? message.body.content : '',
        isRead: message.isRead || false,
        isStarred: message.flag?.flagStatus === 'flagged' || false,
        labels: [], // Outlook uses folders instead of labels
        attachments
      }
    } catch (error) {
      console.error('Error converting Outlook message to Email:', error)
      return null
    }
  }
}
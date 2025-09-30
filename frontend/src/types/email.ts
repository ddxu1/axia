export interface Attachment {
  id: string
  filename: string
  mimeType: string
  size: number
  attachmentId?: string // Gmail attachment ID
}

export interface Email {
  id: string
  threadId: string
  subject: string
  from: string
  to: string[]
  date: Date
  snippet: string
  body: string // Legacy field - keep for backward compatibility
  body_text?: string
  body_html?: string
  isRead: boolean
  isStarred: boolean
  labels: string[]
  attachments?: Attachment[]
}

export interface EmailProvider {
  id: string
  name: string
  type: 'gmail' | 'outlook' | 'yahoo'
  isConnected: boolean
  email: string
}
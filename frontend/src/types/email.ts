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
  // Multi-provider fields
  providerId?: string // 'gmail' | 'outlook' | 'yahoo'
  providerType?: 'gmail' | 'outlook' | 'yahoo'
  accountEmail?: string // The email address of the account this email belongs to
}

export interface EmailProvider {
  id: string
  name: string
  type: 'gmail' | 'outlook' | 'yahoo'
  isConnected: boolean
  email: string
}

export interface ConnectedAccount {
  id: string
  provider: 'gmail' | 'outlook' | 'yahoo'
  email: string
  accessToken?: string
  refreshToken?: string
  isActive: boolean
  displayName?: string
}

export interface MultiInboxEmail extends Email {
  providerId: string
  providerType: 'gmail' | 'outlook' | 'yahoo'
  accountEmail: string
}
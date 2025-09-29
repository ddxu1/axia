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
  labels: string[]
}

export interface EmailProvider {
  id: string
  name: string
  type: 'gmail' | 'outlook' | 'yahoo'
  isConnected: boolean
  email: string
}
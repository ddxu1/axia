export interface Email {
  id: string
  threadId: string
  subject: string
  from: string
  to: string[]
  date: Date
  snippet: string
  body: string
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
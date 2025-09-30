/**
 * Backend API client for FastAPI email backend
 * Replaces direct Gmail API calls with backend database calls
 */

export interface BackendEmail {
  id: number
  gmail_id: string
  subject: string
  from_address: string
  to_addresses: string[]
  cc_addresses: string[]
  bcc_addresses: string[]
  body_text: string | null
  body_html: string | null
  snippet: string | null
  sent_at: string | null
  received_at: string | null
  created_at: string
  is_read: boolean
  is_important: boolean
  is_starred: boolean
  is_draft: boolean
  is_sent: boolean
  is_trash: boolean
  labels: string[]
  thread_id: string | null
}

export interface BackendEmailResponse {
  emails: BackendEmail[]
  total: number
  page: number
  per_page: number
}

export interface BackendEmailDetailResponse extends BackendEmail {
  // Full email details including body content
}

class BackendApiClient {
  private baseUrl: string
  private jwtToken: string | null = null

  constructor() {
    // Use localhost for development, can be configured for production
    this.baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

    // Set JWT token from environment if available (for development)
    const envToken = process.env.NEXT_PUBLIC_BACKEND_JWT_TOKEN
    if (envToken) {
      this.jwtToken = envToken
    }
  }

  setJwtToken(token: string) {
    this.jwtToken = token
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.jwtToken) {
      headers['Authorization'] = `Bearer ${this.jwtToken}`
    }

    return headers
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error ${response.status}: ${errorText}`)
    }

    return response.json()
  }

  /**
   * Get emails from backend database
   */
  async getEmails(params: {
    page?: number
    per_page?: number
    search?: string
    is_read?: boolean
    is_archived?: boolean
    is_starred?: boolean
    label?: string
  } = {}): Promise<BackendEmailResponse> {
    const queryParams = new URLSearchParams()

    if (params.page) queryParams.append('page', params.page.toString())
    if (params.per_page) queryParams.append('per_page', params.per_page.toString())
    if (params.search) queryParams.append('search', params.search)
    if (params.is_read !== undefined) queryParams.append('is_read', params.is_read.toString())
    if (params.is_archived !== undefined) queryParams.append('is_archived', params.is_archived.toString())
    if (params.is_starred !== undefined) queryParams.append('is_starred', params.is_starred.toString())
    if (params.label) queryParams.append('label', params.label)

    const query = queryParams.toString()
    const endpoint = `/emails${query ? `?${query}` : ''}`

    return this.request<BackendEmailResponse>(endpoint)
  }

  /**
   * Get single email details
   */
  async getEmail(emailId: number): Promise<BackendEmailDetailResponse> {
    return this.request<BackendEmailDetailResponse>(`/emails/${emailId}`)
  }

  /**
   * Mark email as read/unread
   */
  async markEmailAsRead(emailId: number, isRead: boolean = true): Promise<void> {
    await this.request(`/emails/${emailId}/mark-read`, {
      method: 'POST',
      body: JSON.stringify({ is_read: isRead }),
    })
  }

  /**
   * Archive/unarchive email
   */
  async archiveEmail(emailId: number, archived: boolean = true): Promise<void> {
    await this.request(`/emails/${emailId}/archive`, {
      method: 'POST',
      body: JSON.stringify({ archived }),
    })
  }

  /**
   * Star/unstar email
   */
  async starEmail(emailId: number, starred: boolean = true): Promise<void> {
    await this.request(`/emails/${emailId}/star`, {
      method: 'POST',
      body: JSON.stringify({ is_starred: starred }),
    })
  }

  /**
   * Delete email
   */
  async deleteEmail(emailId: number): Promise<void> {
    await this.request(`/emails/${emailId}`, {
      method: 'DELETE',
    })
  }

  /**
   * Update email labels
   */
  async updateEmailLabels(emailId: number, labels: string[]): Promise<void> {
    await this.request(`/emails/${emailId}/labels`, {
      method: 'PUT',
      body: JSON.stringify({ labels }),
    })
  }

  /**
   * Send new email
   */
  async sendEmail(emailData: {
    to: string[]
    subject: string
    body_text?: string
    body_html?: string
    cc?: string[]
    bcc?: string[]
  }): Promise<void> {
    await this.request('/emails/send', {
      method: 'POST',
      body: JSON.stringify(emailData),
    })
  }

  /**
   * Get email counts by filter categories
   */
  async getEmailCounts(): Promise<Record<string, number>> {
    return this.request<Record<string, number>>('/emails/email-counts')
  }

  /**
   * Get available labels
   */
  async getLabels(): Promise<{ labels: string[] }> {
    return this.request<{ labels: string[] }>('/labels')
  }

  /**
   * Search emails
   */
  async searchEmails(query: string, params: {
    page?: number
    per_page?: number
  } = {}): Promise<BackendEmailResponse> {
    return this.getEmails({ ...params, search: query })
  }

  /**
   * Get user authentication status from backend
   */
  async getAuthStatus(): Promise<{ authenticated: boolean, user?: { email: string, name: string } }> {
    try {
      return await this.request<{ authenticated: boolean, user?: { email: string, name: string } }>('/auth/status')
    } catch (error) {
      return { authenticated: false }
    }
  }
}

// Create singleton instance
export const backendApi = new BackendApiClient()

// Helper function to convert backend email to frontend email format
export function convertBackendEmailToFrontend(backendEmail: BackendEmail): any {
  return {
    id: backendEmail.id.toString(), // Convert to string to match frontend
    threadId: backendEmail.thread_id || backendEmail.gmail_id,
    subject: backendEmail.subject,
    from: backendEmail.from_address,
    to: backendEmail.to_addresses,
    date: new Date(backendEmail.sent_at || backendEmail.created_at), // Use sent_at for actual email date
    snippet: backendEmail.snippet || '',
    body: backendEmail.body_html || backendEmail.body_text || '',
    isRead: backendEmail.is_read,
    isStarred: backendEmail.is_starred,
    labels: backendEmail.labels,
    // Additional backend-specific fields
    isArchived: backendEmail.is_trash, // Use is_trash for archived status
    gmailId: backendEmail.gmail_id,
  }
}

export default backendApi
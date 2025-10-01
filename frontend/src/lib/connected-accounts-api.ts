// API client for backend connected accounts endpoints

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export interface BackendConnectedAccount {
  id: number
  provider: string
  email: string
  display_name: string | null
  is_active: boolean
  is_primary: boolean
  created_at: string
}

export interface AddAccountRequest {
  provider: string
  access_token: string
  refresh_token?: string
  expires_in?: number
}

export class ConnectedAccountsAPI {
  private backendToken: string

  constructor(backendToken: string) {
    this.backendToken = backendToken
  }

  async getConnectedAccounts(): Promise<BackendConnectedAccount[]> {
    const response = await fetch(`${BACKEND_URL}/connected-accounts`, {
      headers: {
        'Authorization': `Bearer ${this.backendToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch connected accounts')
    }

    return response.json()
  }

  async addConnectedAccount(data: AddAccountRequest): Promise<BackendConnectedAccount> {
    const response = await fetch(`${BACKEND_URL}/connected-accounts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.backendToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to add connected account')
    }

    return response.json()
  }

  async removeConnectedAccount(accountId: number): Promise<void> {
    const response = await fetch(`${BACKEND_URL}/connected-accounts/${accountId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.backendToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to remove connected account')
    }
  }

  async getAccountToken(accountId: number): Promise<{ access_token: string; provider: string; email: string }> {
    const response = await fetch(`${BACKEND_URL}/connected-accounts/${accountId}/token`, {
      headers: {
        'Authorization': `Bearer ${this.backendToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to get account token')
    }

    return response.json()
  }
}

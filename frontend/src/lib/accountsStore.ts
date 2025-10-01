import { ConnectedAccount } from '@/types/email'

// In a real app, this would be stored in a database
// For demo purposes, we'll use in-memory storage
export const connectedAccountsStore = new Map<string, ConnectedAccount[]>()

export function getConnectedAccounts(userEmail: string): ConnectedAccount[] {
  return connectedAccountsStore.get(userEmail) || []
}

export function setConnectedAccounts(userEmail: string, accounts: ConnectedAccount[]): void {
  connectedAccountsStore.set(userEmail, accounts)
}

export function addConnectedAccount(userEmail: string, account: ConnectedAccount): void {
  const accounts = getConnectedAccounts(userEmail)
  const existingIndex = accounts.findIndex(
    acc => acc.provider === account.provider && acc.email === account.email
  )

  if (existingIndex !== -1) {
    accounts[existingIndex] = account
  } else {
    accounts.push(account)
  }

  setConnectedAccounts(userEmail, accounts)
}

export function removeConnectedAccount(userEmail: string, accountId: string): void {
  const accounts = getConnectedAccounts(userEmail)
  const filteredAccounts = accounts.filter(acc => acc.id !== accountId)
  setConnectedAccounts(userEmail, filteredAccounts)
}
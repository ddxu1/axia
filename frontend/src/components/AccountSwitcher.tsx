'use client'

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { ConnectedAccount } from '@/types/email'

interface AccountSwitcherProps {
  currentAccount?: string
  onAccountChange: (accountId: string) => void
}

export interface AccountSwitcherRef {
  closeDropdown: () => void
}

const AccountSwitcher = forwardRef<AccountSwitcherRef, AccountSwitcherProps>(
  ({ currentAccount, onAccountChange }, ref) => {
    const [accounts, setAccounts] = useState<ConnectedAccount[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Expose close method to parent
    useImperativeHandle(ref, () => ({
      closeDropdown: () => setIsOpen(false)
    }))

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts')
      if (response.ok) {
        const accountsData = await response.json()
        setAccounts(accountsData)
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    }
  }

  const handleAccountSelect = (accountId: string) => {
    onAccountChange(accountId)
    setIsOpen(false)
  }

  const handleAddAccount = async (provider: 'google' | 'azure-ad') => {
    setLoading(true)
    try {
      // Use popup OAuth flow instead of signIn to avoid switching sessions
      const { openGoogleOAuthPopup, openAzureOAuthPopup } = await import('@/lib/oauth-popup')

      const tokens = provider === 'google'
        ? await openGoogleOAuthPopup()
        : await openAzureOAuthPopup()

      // Add the account to backend
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: tokens.provider,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresIn: tokens.expires_in
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add account')
      }

      // Refresh accounts list
      await fetchAccounts()

      console.log('✅ Account added successfully!')
      alert('Account added successfully!')
    } catch (error) {
      console.error('Error adding account:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert(`Failed to add account: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveAccount = async (accountId: string, event: React.MouseEvent) => {
    event.stopPropagation()

    if (!confirm('Are you sure you want to remove this account?')) {
      return
    }

    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to remove account')
      }

      // Refresh accounts list
      await fetchAccounts()

      // If the removed account was selected, switch to "All Accounts"
      if (currentAccount === accountId) {
        onAccountChange('all')
      }

      alert('Account removed successfully!')
    } catch (error) {
      console.error('Error removing account:', error)
      alert('Failed to remove account')
    }
  }

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'gmail':
      case 'google':
        return 'G'
      case 'outlook':
      case 'azure-ad':
      case 'microsoft-entra-id':
        return 'O'
      default:
        return '?'
    }
  }

  const currentAccountData = accounts.find(acc => acc.id === currentAccount) || accounts[0]

  return (
    <div className="relative">
      {/* Current Account Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 glass-button px-3 py-2 rounded-lg hover:bg-white/10 transition-all"
      >
        {currentAccountData ? (
          <>
            <span className="text-white text-sm font-medium truncate max-w-32">
              {currentAccountData.displayName || currentAccountData.email}
            </span>
          </>
        ) : (
          <span className="text-white/60 text-sm">Select Account</span>
        )}
        <svg
          className={`w-4 h-4 text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-black/90 backdrop-blur-xl rounded-xl p-3 z-50 border border-white/20 shadow-2xl">
          {/* All Accounts Option */}
          <button
            onClick={() => handleAccountSelect('all')}
            className={`w-full flex items-center p-3 rounded-lg text-left transition-all ${
              currentAccount === 'all'
                ? 'bg-white/20 text-white shadow-lg'
                : 'hover:bg-white/10 text-white/90'
            }`}
          >
            <div className="flex-1">
              <div className="font-semibold text-white">All Accounts</div>
              <div className="text-xs text-white/60 mt-0.5">Unified inbox</div>
            </div>
          </button>

          <div className="my-3 border-t border-white/10"></div>

          {/* Connected Accounts */}
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`w-full flex items-center gap-2 p-3 rounded-lg transition-all mb-1 ${
                currentAccount === account.id
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'hover:bg-white/10 text-white/90'
              }`}
            >
              {/* Account info - clickable to select */}
              <button
                onClick={() => handleAccountSelect(account.id)}
                className="flex-1 min-w-0 text-left"
              >
                <div className="font-medium text-white truncate">{account.email}</div>
                {account.displayName && account.displayName !== account.email && (
                  <div className="text-xs text-white/60 mt-0.5 truncate">{account.displayName}</div>
                )}
              </button>

              {/* Remove button */}
              <button
                onClick={(e) => handleRemoveAccount(account.id, e)}
                className="p-2 rounded-lg hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-colors"
                title="Remove account"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}

          <div className="my-3 border-t border-white/10"></div>

          {/* Add Account Options */}
          <div className="space-y-1.5">
            <div className="text-xs text-white/50 uppercase tracking-wider mb-2 px-3 font-medium">Add Account</div>

            <button
              onClick={() => handleAddAccount('google')}
              disabled={loading}
              className="w-full flex items-center justify-between p-3 rounded-lg text-left hover:bg-white/10 text-white/90 transition-all disabled:opacity-50"
            >
              <span className="font-medium">Connect Gmail</span>
              {loading && (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
})

AccountSwitcher.displayName = 'AccountSwitcher'

export default AccountSwitcher
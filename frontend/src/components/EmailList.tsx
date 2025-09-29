'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Email } from '@/types/email'

function formatEmailDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }

  const timeStr = date.toLocaleTimeString('en-US', timeOptions).toLowerCase()

  if (diffDays === 0) {
    return `Today, ${timeStr}`
  } else if (diffDays === 1) {
    return `Yesterday, ${timeStr}`
  } else if (diffDays < 7) {
    const dayOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long'
    }
    const dayStr = date.toLocaleDateString('en-US', dayOptions)
    return `${dayStr}, ${timeStr}`
  } else {
    // For older emails, use the original format
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

interface EmailListProps {
  onEmailSelect: (email: Email) => void
  emails?: Email[]
  onEmailsUpdate?: (emails: Email[]) => void
  searchQuery?: string
}

export default function EmailList({ onEmailSelect, emails: propEmails, onEmailsUpdate, searchQuery }: EmailListProps) {
  const { data: session } = useSession()
  const [emails, setEmails] = useState<Email[]>(propEmails || [])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalEmails, setTotalEmails] = useState(0)
  const [hasMoreEmails, setHasMoreEmails] = useState(true)
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string>('')
  const [searchLoading, setSearchLoading] = useState(false)

  useEffect(() => {
    if (session) {
      fetchEmails()
    }
  }, [session])

  useEffect(() => {
    if (propEmails) {
      setEmails(propEmails)
    }
  }, [propEmails])

  // Debounced search effect
  useEffect(() => {
    if (searchQuery !== currentSearchQuery) {
      const timeoutId = setTimeout(() => {
        if (session) {
          setCurrentSearchQuery(searchQuery || '')
          // Reset pagination and fetch new results
          setCurrentPage(1)
          setHasMoreEmails(true)
          fetchEmails(1, false, searchQuery || undefined)
        }
      }, 300) // 300ms debounce

      return () => clearTimeout(timeoutId)
    }
  }, [searchQuery, currentSearchQuery, session])

  const fetchEmails = async (page: number = 1, append: boolean = false, search?: string) => {
    try {
      if (!append) {
        if (search) setSearchLoading(true)
        else setLoading(true)
      } else {
        setLoadingMore(true)
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '50'
      })

      if (search) {
        params.append('search', search)
      }

      const response = await fetch(`/api/emails?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch emails')
      }
      const data = await response.json()

      if (append) {
        // Append new emails to existing list
        const newEmails = [...emails, ...data.emails]
        setEmails(newEmails)
        onEmailsUpdate?.(newEmails)
      } else {
        // Replace emails list
        setEmails(data.emails)
        onEmailsUpdate?.(data.emails)
        setCurrentPage(1)
      }

      setTotalEmails(data.total)
      setHasMoreEmails(data.emails.length === 50 && emails.length + data.emails.length < data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setSearchLoading(false)
    }
  }

  const loadMoreEmails = async () => {
    const nextPage = currentPage + 1
    await fetchEmails(nextPage, true, currentSearchQuery || undefined)
    setCurrentPage(nextPage)
  }

  const syncEmails = async () => {
    try {
      setSyncing(true)
      setError(null)

      // Trigger sync in backend
      const syncResponse = await fetch('/api/emails/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!syncResponse.ok) {
        throw new Error('Failed to start email sync')
      }

      // Wait a moment for sync to process, then fetch updated emails
      setTimeout(async () => {
        await fetchEmails(1, false) // Reset to first page after sync
        setSyncing(false)
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
      setSyncing(false)
    }
  }

  const handleEmailSelect = async (email: Email) => {
    setSelectedId(email.id)
    onEmailSelect(email)

    // Automatically mark as read when selected
    if (!email.isRead) {
      try {
        const response = await fetch(`/api/emails/${email.id}/mark-read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isRead: true })
        })

        if (response.ok) {
          // Update local state
          const updatedEmails = emails.map(e =>
            e.id === email.id ? { ...e, isRead: true } : e
          )
          setEmails(updatedEmails)
          onEmailsUpdate?.(updatedEmails)

          // Update the selected email
          onEmailSelect({ ...email, isRead: true })
        }
      } catch (error) {
        console.error('Error marking email as read:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center">
          <div className="loading-circle mx-auto mb-4"></div>
          <p className="text-glass">Loading your emails...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-8 text-center">
          <svg className="w-12 h-12 text-red-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-glass">Failed to load emails</p>
          <button
            onClick={fetchEmails}
            className="glass-button text-glass px-4 py-2 rounded-lg mt-4 text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-glass">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-glass">
              {currentSearchQuery ? 'Search Results' : 'Inbox'}
            </h2>
            {searchLoading && (
              <div className="w-4 h-4 border-2 border-glass border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-glass opacity-80">
              {emails.length} of {totalEmails} emails
              {currentSearchQuery && ` matching "${currentSearchQuery}"`}
            </span>
          </div>
        </div>
        <button
          onClick={syncEmails}
          disabled={syncing}
          className={`glass-button text-glass px-3 py-1 rounded-lg mt-3 text-sm flex items-center space-x-2 ${syncing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {syncing ? (
            <div className="w-4 h-4 border-2 border-glass border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          <span>{syncing ? 'Syncing...' : 'Sync'}</span>
        </button>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto">
        {emails.map((email, index) => (
          <div
            key={email.id}
            className={`
              relative p-4 border-b border-glass cursor-pointer transition-all duration-300
              hover:bg-white/10 hover:backdrop-blur-sm
              ${selectedId === email.id ? 'bg-white/15 backdrop-blur-sm' : ''}
            `}
            onClick={() => handleEmailSelect(email)}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Unread indicator */}
            {!email.isRead && (
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-400 rounded-full"></div>
            )}

            <div className="ml-4">
              <div className="flex justify-between items-start mb-2">
                <span className={`font-semibold text-glass truncate ${!email.isRead ? 'text-white' : 'opacity-90'}`}>
                  {email.from.replace(/<.*>/, '').trim() || email.from}
                </span>
                <span className="text-xs text-glass opacity-70 ml-2 flex-shrink-0">
                  {formatEmailDate(new Date(email.date))}
                </span>
              </div>

              <div className="mb-2">
                <span className={`text-sm text-glass ${!email.isRead ? 'font-semibold opacity-95' : 'opacity-80'}`}>
                  {email.subject || '(No Subject)'}
                </span>
              </div>

              <div className="text-sm text-glass opacity-70 truncate">
                {email.snippet}
              </div>

              {/* Labels */}
              {email.labels.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {email.labels.slice(0, 3).map((label) => (
                    <span
                      key={label}
                      className="px-2 py-1 text-xs glass rounded-full text-glass opacity-80"
                    >
                      {label.toLowerCase().replace('_', ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Load More Button */}
        {hasMoreEmails && !loading && (
          <div className="p-4 text-center border-b border-glass">
            <button
              onClick={loadMoreEmails}
              disabled={loadingMore}
              className={`glass-button text-glass px-6 py-3 rounded-lg flex items-center justify-center space-x-2 mx-auto ${loadingMore ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'}`}
            >
              {loadingMore ? (
                <>
                  <div className="w-4 h-4 border-2 border-glass border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading more...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <span>Load More Emails ({totalEmails - emails.length} remaining)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
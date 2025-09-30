'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Email } from '@/types/email'

function formatEmailDate(date: Date): string {
  const now = new Date()

  // Get the start of today in local timezone for accurate day comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const emailDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  // Calculate difference in days using date objects (not milliseconds)
  const diffMs = today.getTime() - emailDate.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone // Use user's local timezone
  }

  const timeStr = date.toLocaleTimeString('en-US', timeOptions).toLowerCase()

  if (diffDays === 0) {
    return `Today, ${timeStr}`
  } else if (diffDays === 1) {
    return `Yesterday, ${timeStr}`
  } else if (diffDays < 7) {
    const dayOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
    const dayStr = date.toLocaleDateString('en-US', dayOptions)
    return `${dayStr}, ${timeStr}`
  } else {
    // For older emails, use the original format
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    })
  }
}

interface EmailListProps {
  onEmailSelect: (email: Email) => void
  emails?: Email[]
  onEmailsUpdate?: (emails: Email[]) => void
  searchQuery?: string
  selectedFilter?: string
  selectedId?: string | null
  isUsingKeyboard?: boolean
}

export default function EmailList({ onEmailSelect, emails: propEmails, onEmailsUpdate, searchQuery, selectedFilter, selectedId: propSelectedId, isUsingKeyboard = false }: EmailListProps) {
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
  const [currentFilter, setCurrentFilter] = useState<string>('all')
  const [autoSyncing, setAutoSyncing] = useState(false)
  const [lastAutoSync, setLastAutoSync] = useState<number>(0)

  useEffect(() => {
    if (session) {
      fetchEmails(1, false, undefined, currentFilter).then(() => {
        // Auto-sync after initial load with rate limiting (max once per 5 minutes)
        const now = Date.now()
        if (now - lastAutoSync > 5 * 60 * 1000) { // 5 minutes in milliseconds
          triggerAutoSync()
        }
      })
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
          fetchEmails(1, false, searchQuery || undefined, currentFilter)
        }
      }, 300) // 300ms debounce

      return () => clearTimeout(timeoutId)
    }
  }, [searchQuery, currentSearchQuery, session, currentFilter])

  // Filter change effect
  useEffect(() => {
    if (selectedFilter !== currentFilter) {
      if (session) {
        setCurrentFilter(selectedFilter || 'all')
        // Reset pagination and fetch new results
        setCurrentPage(1)
        setHasMoreEmails(true)
        fetchEmails(1, false, currentSearchQuery || undefined, selectedFilter || 'all')
      }
    }
  }, [selectedFilter, currentFilter, session, currentSearchQuery])

  // Sync selected ID with prop (for keyboard navigation)
  useEffect(() => {
    if (propSelectedId !== selectedId) {
      setSelectedId(propSelectedId)
    }
  }, [propSelectedId])

  // Scroll selected item into view when selection changes via keyboard
  useEffect(() => {
    if (propSelectedId && emails.length > 0) {
      const emailElement = document.querySelector(`[data-email-id="${propSelectedId}"]`)
      if (emailElement) {
        emailElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }
    }
  }, [propSelectedId, emails])

  const mapFilterToLabel = (filter: string): string | undefined => {
    switch (filter) {
      case 'all':
        return undefined
      case 'inbox':
        return 'INBOX'
      case 'important':
        return 'IMPORTANT'
      case 'starred':
        return 'STARRED'
      case 'sent':
        return 'SENT'
      case 'personal':
        return 'CATEGORY_PERSONAL'
      case 'updates':
        return 'CATEGORY_UPDATES'
      case 'promotions':
        return 'CATEGORY_PROMOTIONS'
      default:
        return undefined
    }
  }

  const fetchEmails = async (page: number = 1, append: boolean = false, search?: string, filter?: string) => {
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

      const labelFilter = mapFilterToLabel(filter || currentFilter)
      if (labelFilter) {
        params.append('label', labelFilter)
      }

      // Special handling for unread filter
      if (filter === 'unread' || currentFilter === 'unread') {
        params.append('is_read', 'false')
      }

      // Special handling for starred filter
      if (filter === 'starred' || currentFilter === 'starred') {
        params.append('is_starred', 'true')
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
    await fetchEmails(nextPage, true, currentSearchQuery || undefined, currentFilter)
    setCurrentPage(nextPage)
  }

  const triggerAutoSync = async () => {
    try {
      setAutoSyncing(true)
      setLastAutoSync(Date.now())

      // Trigger sync in backend (silent background operation)
      const syncResponse = await fetch('/api/emails/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!syncResponse.ok) {
        console.warn('Auto-sync failed to start:', syncResponse.statusText)
        return
      }

      // Wait a moment for sync to process, then quietly refresh emails
      setTimeout(async () => {
        try {
          await fetchEmails(1, false, currentSearchQuery || undefined, currentFilter)
        } catch (error) {
          console.warn('Auto-sync email refresh failed:', error)
        } finally {
          setAutoSyncing(false)
        }
      }, 3000) // 3 seconds for auto-sync

    } catch (err) {
      console.warn('Auto-sync failed:', err)
      setAutoSyncing(false)
    }
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
        await fetchEmails(1, false, currentSearchQuery || undefined, currentFilter) // Reset to first page after sync
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

  const handleStarToggle = async (email: Email, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent email selection when clicking star

    const newStarredState = !email.isStarred

    // Optimistic update: immediately update UI
    const updatedEmails = emails.map(e =>
      e.id === email.id ? { ...e, isStarred: newStarredState } : e
    )
    setEmails(updatedEmails)
    onEmailsUpdate?.(updatedEmails)

    try {
      // Make API call in background
      const response = await fetch(`/api/emails/${email.id}/star`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred: newStarredState })
      })

      if (!response.ok) {
        throw new Error('Failed to update star status')
      }

      // After successful API call, refetch if in starred filter to handle visibility changes
      if (currentFilter === 'starred') {
        await fetchEmails(1, false, currentSearchQuery || undefined, currentFilter)
      }
    } catch (error) {
      console.error('Error toggling email star:', error)

      // Rollback optimistic update on failure
      const revertedEmails = emails.map(e =>
        e.id === email.id ? { ...e, isStarred: !newStarredState } : e
      )
      setEmails(revertedEmails)
      onEmailsUpdate?.(revertedEmails)

      // Show error message
      alert('Failed to update star status. Please try again.')
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
            onClick={() => fetchEmails(1, false, currentSearchQuery || undefined, currentFilter)}
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
              {currentSearchQuery ? 'Search Results' :
               currentFilter === 'all' ? 'All Mail' :
               currentFilter === 'inbox' ? 'Inbox' :
               currentFilter === 'starred' ? 'Starred' :
               currentFilter === 'sent' ? 'Sent' :
               currentFilter === 'unread' ? 'Unread' :
               currentFilter === 'personal' ? 'Personal' :
               currentFilter === 'updates' ? 'Updates' :
               currentFilter === 'promotions' ? 'Promotions' : 'Inbox'}
            </h2>
            {searchLoading && (
              <div className="w-4 h-4 border-2 border-glass border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${autoSyncing ? 'bg-blue-400 animate-pulse' : 'bg-green-400'} animate-pulse`}></div>
            <span className="text-sm text-glass opacity-80">
              {emails.length} of {totalEmails} emails
              {currentSearchQuery && ` matching "${currentSearchQuery}"`}
              {autoSyncing && <span className="text-blue-300 ml-1">(syncing)</span>}
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
            data-email-id={email.id}
            className={`
              relative p-4 border-b border-glass cursor-pointer
              ${!isUsingKeyboard ? 'hover:bg-white/10 hover:backdrop-blur-sm' : ''}
              ${selectedId === email.id ? 'bg-white/15 backdrop-blur-sm border-l-2 border-l-blue-400' : ''}
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
                <div className="flex items-center flex-1 min-w-0">
                  <span className={`font-semibold text-glass truncate ${!email.isRead ? 'text-white' : 'opacity-90'}`}>
                    {email.from.replace(/<.*>/, '').trim() || email.from}
                  </span>
                  {email.attachments && email.attachments.length > 0 && (
                    <span className="ml-2 text-xs glass px-2 py-0.5 rounded-full text-glass-dark flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      {email.attachments.length}
                    </span>
                  )}
                  <button
                    onClick={(e) => handleStarToggle(email, e)}
                    className={`ml-2 p-1 hover:bg-white/10 rounded transition-colors ${
                      email.isStarred ? 'text-yellow-400' : 'text-glass opacity-30 hover:opacity-70'
                    }`}
                  >
                    <svg className="w-4 h-4" fill={email.isStarred ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                </div>
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
'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Email } from '@/types/email'

interface EmailListProps {
  onEmailSelect: (email: Email) => void
  emails?: Email[]
  onEmailsUpdate?: (emails: Email[]) => void
  selectedId?: string | null
}

export default function EmailList({ onEmailSelect, emails: propEmails, onEmailsUpdate, selectedId: propSelectedId }: EmailListProps) {
  const { data: session } = useSession()
  const [emails, setEmails] = useState<Email[]>(propEmails || [])
  const [selectedId, setSelectedId] = useState<string | null>(propSelectedId || null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const emailRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

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

  // Update selectedId from props (for keyboard navigation)
  useEffect(() => {
    if (propSelectedId !== undefined) {
      setSelectedId(propSelectedId)
    }
  }, [propSelectedId])

  // Scroll selected email into view when selection changes
  useEffect(() => {
    if (selectedId && emailRefs.current[selectedId]) {
      emailRefs.current[selectedId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    }
  }, [selectedId])

  const fetchEmails = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/emails')
      if (!response.ok) {
        throw new Error('Failed to fetch emails')
      }
      const data = await response.json()
      setEmails(data.emails)
      onEmailsUpdate?.(data.emails)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
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
          <h2 className="text-xl font-semibold text-glass">Inbox</h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-glass opacity-80">{emails.length} emails</span>
          </div>
        </div>
        <button
          onClick={fetchEmails}
          className="glass-button text-glass px-3 py-1 rounded-lg mt-3 text-sm flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto">
        {emails.map((email, index) => (
          <div
            key={email.id}
            ref={(el) => { emailRefs.current[email.id] = el }}
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
                  {new Date(email.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
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
      </div>
    </div>
  )
}
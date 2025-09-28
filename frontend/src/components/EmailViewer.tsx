'use client'

import { useState } from 'react'
import { Email } from '@/types/email'
import LabelManager from './LabelManager'
import ComposeEmail from './ComposeEmail'

interface EmailViewerProps {
  email: Email | null
  onEmailUpdate?: (emailId: string, updates: Partial<Email>) => void
  onEmailDelete?: (emailId: string) => void
  onEmailArchive?: (emailId: string) => void
}

export default function EmailViewer({ email, onEmailUpdate, onEmailDelete, onEmailArchive }: EmailViewerProps) {
  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({})
  const [showLabelManager, setShowLabelManager] = useState(false)
  const [showCompose, setShowCompose] = useState(false)
  const [showForward, setShowForward] = useState(false)

  const handleMarkAsRead = async (markAsRead: boolean) => {
    if (!email) return

    setIsLoading(prev => ({ ...prev, read: true }))
    try {
      const response = await fetch(`/api/emails/${email.id}/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: markAsRead })
      })

      if (!response.ok) {
        throw new Error('Failed to update email status')
      }

      onEmailUpdate?.(email.id, { isRead: markAsRead })
    } catch (error) {
      console.error('Error updating email:', error)
      alert('Failed to update email status')
    } finally {
      setIsLoading(prev => ({ ...prev, read: false }))
    }
  }

  const handleDelete = async () => {
    if (!email) return

    if (!confirm('Are you sure you want to delete this email? This action cannot be undone.')) {
      return
    }

    setIsLoading(prev => ({ ...prev, delete: true }))
    try {
      const response = await fetch(`/api/emails/${email.id}/delete`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete email')
      }

      onEmailDelete?.(email.id)
    } catch (error) {
      console.error('Error deleting email:', error)
      alert('Failed to delete email')
    } finally {
      setIsLoading(prev => ({ ...prev, delete: false }))
    }
  }

  const handleArchive = async () => {
    if (!email) return

    setIsLoading(prev => ({ ...prev, archive: true }))
    try {
      const response = await fetch(`/api/emails/${email.id}/archive`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to archive email')
      }

      onEmailArchive?.(email.id)
    } catch (error) {
      console.error('Error archiving email:', error)
      alert('Failed to archive email')
    } finally {
      setIsLoading(prev => ({ ...prev, archive: false }))
    }
  }

  const handleLabelsUpdate = (emailId: string, labels: string[]) => {
    onEmailUpdate?.(emailId, { labels })
  }
  if (!email) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 glass rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg className="w-10 h-10 text-glass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-glass-dark text-lg">Select an email to view</p>
          <p className="text-glass-dark opacity-60 text-sm mt-2">Choose a message from your inbox</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Email Header */}
      <div className="border-b border-glass p-6">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-2xl font-bold text-glass leading-tight">
            {email.subject || '(No Subject)'}
          </h1>
          <div className="flex items-center space-x-2 ml-4">
            {!email.isRead && (
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            )}
            <span className="text-xs text-glass-dark glass px-2 py-1 rounded-full">
              {email.labels.length > 0 ? email.labels[0].toLowerCase().replace('_', ' ') : 'inbox'}
            </span>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center">
            <span className="font-semibold text-glass-dark min-w-[60px]">From:</span>
            <span className="text-glass ml-2">
              {email.from.replace(/<.*>/, '').trim() || email.from}
            </span>
          </div>
          <div className="flex items-center">
            <span className="font-semibold text-glass-dark min-w-[60px]">To:</span>
            <span className="text-glass ml-2">{email.to.join(', ')}</span>
          </div>
          <div className="flex items-center">
            <span className="font-semibold text-glass-dark min-w-[60px]">Date:</span>
            <span className="text-glass ml-2">
              {new Date(email.date).toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="glass rounded-xl p-6">
          <div className="whitespace-pre-wrap text-glass leading-relaxed">
            {email.body || email.snippet}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="border-t border-glass p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCompose(true)}
              className="glass-button text-glass px-4 py-2 rounded-lg text-sm flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span>Reply</span>
            </button>
            <button
              onClick={() => setShowForward(true)}
              className="glass-button text-glass px-4 py-2 rounded-lg text-sm flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              <span>Forward</span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowLabelManager(true)}
              className="glass-button text-glass px-4 py-2 rounded-lg text-sm flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span>Labels</span>
            </button>

            <button
              onClick={handleArchive}
              disabled={isLoading.archive}
              className="glass-button text-glass px-4 py-2 rounded-lg text-sm flex items-center space-x-2 disabled:opacity-50"
            >
              {isLoading.archive ? (
                <div className="w-4 h-4 border-2 border-glass border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6 6-6" />
                </svg>
              )}
              <span>Archive</span>
            </button>

            <button
              onClick={() => handleMarkAsRead(!email.isRead)}
              disabled={isLoading.read}
              className="glass-button text-glass px-4 py-2 rounded-lg text-sm flex items-center space-x-2 disabled:opacity-50"
            >
              {isLoading.read ? (
                <div className="w-4 h-4 border-2 border-glass border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={email.isRead ? "M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v18" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
                </svg>
              )}
              <span>{email.isRead ? 'Mark Unread' : 'Mark Read'}</span>
            </button>

            <button
              onClick={handleDelete}
              disabled={isLoading.delete}
              className="glass-button text-glass px-4 py-2 rounded-lg text-sm flex items-center space-x-2 disabled:opacity-50 hover:bg-red-500/20"
            >
              {isLoading.delete ? (
                <div className="w-4 h-4 border-2 border-glass border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* Label Manager Modal */}
      {showLabelManager && (
        <LabelManager
          emailId={email.id}
          currentLabels={email.labels}
          onLabelsUpdate={handleLabelsUpdate}
          onClose={() => setShowLabelManager(false)}
        />
      )}

      {/* Compose Reply Modal */}
      {showCompose && (
        <ComposeEmail
          replyTo={{
            email: email.from.replace(/.*<(.+)>.*/, '$1').trim() || email.from,
            subject: email.subject,
            body: email.body || email.snippet
          }}
          onClose={() => setShowCompose(false)}
        />
      )}

      {/* Compose Forward Modal */}
      {showForward && (
        <ComposeEmail
          replyTo={{
            email: '',
            subject: `Fwd: ${email.subject}`,
            body: `<br><br>---------- Forwarded message ----------<br>From: ${email.from}<br>Date: ${new Date(email.date).toLocaleString()}<br>Subject: ${email.subject}<br>To: ${email.to.join(', ')}<br><br>${email.body || email.snippet}`
          }}
          isForward={true}
          onClose={() => setShowForward(false)}
        />
      )}
    </div>
  )
}
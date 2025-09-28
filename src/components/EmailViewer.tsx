'use client'

import { Email } from '@/types/email'

interface EmailViewerProps {
  email: Email | null
}

export default function EmailViewer({ email }: EmailViewerProps) {
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
        <div className="flex items-center space-x-3">
          <button className="glass-button text-glass px-4 py-2 rounded-lg text-sm flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            <span>Reply</span>
          </button>
          <button className="glass-button text-glass px-4 py-2 rounded-lg text-sm flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            <span>Forward</span>
          </button>
          <button className="glass-button text-glass px-4 py-2 rounded-lg text-sm flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  )
}
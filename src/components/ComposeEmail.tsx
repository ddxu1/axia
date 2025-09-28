'use client'

import { useState } from 'react'
import RichTextEditor from './RichTextEditor'

interface ComposeEmailProps {
  onClose: () => void
  replyTo?: {
    email: string
    subject: string
    body?: string
  }
}

export default function ComposeEmail({ onClose, replyTo }: ComposeEmailProps) {
  const [to, setTo] = useState(replyTo?.email || '')
  const [subject, setSubject] = useState(replyTo?.subject ? `Re: ${replyTo.subject}` : '')
  const [body, setBody] = useState(replyTo?.body ? `<br><br><blockquote style="border-left: 3px solid #ccc; padding-left: 12px; margin: 0;">${replyTo.body}</blockquote>` : '')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async () => {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      setError('Please fill in all required fields')
      return
    }

    setSending(true)
    setError(null)

    try {
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: to.trim(),
          subject: subject.trim(),
          htmlBody: body,
          plainTextBody: body.replace(/<[^>]*>/g, '')
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send email')
      }

      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="glass-card rounded-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-glass">
          <h2 className="text-xl font-semibold text-glass">
            {replyTo ? 'Reply' : 'Compose Email'}
          </h2>
          <button
            onClick={onClose}
            className="glass-button text-glass p-2 rounded-full hover:scale-105 transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4" onKeyDown={handleKeyDown}>
          {/* To Field */}
          <div>
            <label className="block text-sm font-medium text-glass-dark mb-2">
              To <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full glass rounded-lg px-4 py-3 text-glass placeholder-glass/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="recipient@example.com"
              required
            />
          </div>

          {/* Subject Field */}
          <div>
            <label className="block text-sm font-medium text-glass-dark mb-2">
              Subject <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full glass rounded-lg px-4 py-3 text-glass placeholder-glass/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="Email subject"
              required
            />
          </div>

          {/* Body Field */}
          <div>
            <label className="block text-sm font-medium text-glass-dark mb-2">
              Message <span className="text-red-400">*</span>
            </label>
            <RichTextEditor
              value={body}
              onChange={setBody}
              placeholder="Type your message here... Use Ctrl+B for bold, Ctrl+I for italic, Ctrl+U for underline"
              className="min-h-[300px]"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="glass rounded-lg p-4 bg-red-500/20 border border-red-500/30">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-glass">
          <div className="text-sm text-glass-dark">
            <kbd className="px-2 py-1 glass rounded text-xs">Ctrl+Enter</kbd> to send •
            <kbd className="px-2 py-1 glass rounded text-xs ml-2">Esc</kbd> to close
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={sending}
              className="glass-button text-glass px-6 py-3 rounded-lg font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !to.trim() || !subject.trim() || !body.trim()}
              className="glass-button text-glass px-6 py-3 rounded-lg font-medium disabled:opacity-50 bg-blue-500/20 hover:bg-blue-500/30 transition-all"
            >
              {sending ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-glass border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>Send</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
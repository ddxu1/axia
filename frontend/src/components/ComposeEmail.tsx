'use client'

import { useState, useRef } from 'react'
import RichTextEditor from './RichTextEditor'

interface ComposeEmailProps {
  onClose: () => void
  replyTo?: {
    email: string
    subject: string
    body?: string
  }
  isForward?: boolean
  wasEmailSelected?: boolean
  onEscapeToBase?: () => void
  onEmailSent?: () => void
}

interface FileAttachment {
  file: File
  id: string
}

export default function ComposeEmail({ onClose, replyTo, isForward, wasEmailSelected, onEscapeToBase, onEmailSent }: ComposeEmailProps) {
  const [to, setTo] = useState(replyTo?.email || '')
  const [subject, setSubject] = useState(replyTo?.subject || '')
  const [body, setBody] = useState(replyTo?.body || '')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<FileAttachment[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const newAttachments: FileAttachment[] = []
    const maxSize = 25 * 1024 * 1024 // 25MB limit per file

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.size > maxSize) {
        setError(`File "${file.name}" exceeds 25MB limit`)
        continue
      }
      newAttachments.push({
        file,
        id: `${Date.now()}-${i}-${file.name}`
      })
    }

    setAttachments(prev => [...prev, ...newAttachments])
  }

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleSend = async () => {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      setError('Please fill in all required fields')
      return
    }

    setSending(true)
    setError(null)

    try {
      // If we have attachments, we need to use FormData
      if (attachments.length > 0) {
        const formData = new FormData()
        formData.append('to', to.trim())
        formData.append('subject', subject.trim())
        formData.append('htmlBody', body)
        formData.append('plainTextBody', body.replace(/<[^>]*>/g, ''))

        attachments.forEach(att => {
          formData.append('attachments', att.file)
        })

        const response = await fetch('/api/emails/send', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to send email')
        }
      } else {
        // No attachments, use JSON
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
      }

      // Notify parent of successful send
      onEmailSent?.()

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
      // If no email was selected when compose opened, clear selection
      if (!wasEmailSelected && onEscapeToBase) {
        onEscapeToBase()
      }
      // Always close the modal
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="glass-card rounded-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-glass">
          <h2 className="text-xl font-semibold text-glass">
            {isForward ? 'Forward Email' : replyTo ? 'Reply' : 'Compose Email'}
          </h2>
          <button
            onClick={onClose}
            className="glass-button text-glass p-2 rounded-full transition-all duration-300"
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

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-glass-dark mb-2">
              Attachments
            </label>

            {/* Drop Zone */}
            <div
              className={`glass rounded-lg border-2 border-dashed transition-all ${
                isDragging ? 'border-blue-400 bg-blue-500/10' : 'border-glass'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="p-6 text-center">
                <svg className="w-10 h-10 text-glass-dark mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v6" />
                </svg>
                <p className="text-sm text-glass mb-2">
                  Drag and drop files here or
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="glass-button text-glass px-4 py-2 rounded-lg text-sm"
                >
                  Browse Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
                <p className="text-xs text-glass-dark mt-3">
                  Maximum file size: 25MB per file
                </p>
              </div>
            </div>

            {/* Attached Files List */}
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map(att => (
                  <div key={att.id} className="glass rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-glass-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <div>
                        <p className="text-sm text-glass">{att.file.name}</p>
                        <p className="text-xs text-glass-dark">{formatFileSize(att.file.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="glass-button text-glass p-1.5 rounded hover:bg-red-500/20"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <p className="text-xs text-glass-dark">
                  Total: {attachments.length} file{attachments.length !== 1 && 's'} ({formatFileSize(attachments.reduce((sum, att) => sum + att.file.size, 0))})
                </p>
              </div>
            )}
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
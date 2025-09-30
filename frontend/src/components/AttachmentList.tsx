'use client'

import { useState } from 'react'
import { Attachment } from '@/types/email'

interface AttachmentListProps {
  attachments: Attachment[]
  emailId: string
  onPreviewPdf?: (attachment: Attachment) => void
}

export default function AttachmentList({ attachments, emailId, onPreviewPdf }: AttachmentListProps) {
  const [downloading, setDownloading] = useState<string | null>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string): JSX.Element => {
    if (mimeType.includes('pdf')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17h6M9 13h6M13 3v5a1 1 0 001 1h5" />
        </svg>
      )
    } else if (mimeType.includes('image')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    } else if (mimeType.includes('sheet') || mimeType.includes('excel')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    } else {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
      )
    }
  }

  const handleDownload = async (attachment: Attachment) => {
    setDownloading(attachment.id)
    try {
      const response = await fetch(
        `/api/emails/${emailId}/attachments/${attachment.attachmentId}?filename=${encodeURIComponent(attachment.filename)}&mimeType=${encodeURIComponent(attachment.mimeType)}`
      )

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = attachment.filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading attachment:', error)
      alert('Failed to download attachment')
    } finally {
      setDownloading(null)
    }
  }

  const handlePreview = (attachment: Attachment) => {
    if (attachment.mimeType.includes('pdf') && onPreviewPdf) {
      onPreviewPdf(attachment)
    } else {
      // For non-PDF files or when preview is not available, download instead
      handleDownload(attachment)
    }
  }

  if (!attachments || attachments.length === 0) {
    return null
  }

  return (
    <div className="border-t border-glass">
      <div className="p-4">
        <h3 className="text-sm font-semibold text-glass-dark mb-3">
          Attachments ({attachments.length})
        </h3>
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="glass rounded-lg p-3 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="text-glass-dark">
                  {getFileIcon(attachment.mimeType)}
                </div>
                <div>
                  <p className="text-sm font-medium text-glass">{attachment.filename}</p>
                  <p className="text-xs text-glass-dark">{formatFileSize(attachment.size)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {attachment.mimeType.includes('pdf') && onPreviewPdf && (
                  <button
                    onClick={() => handlePreview(attachment)}
                    className="glass-button text-glass px-3 py-1.5 rounded text-xs flex items-center space-x-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Preview</span>
                  </button>
                )}
                <button
                  onClick={() => handleDownload(attachment)}
                  disabled={downloading === attachment.id}
                  className="glass-button text-glass px-3 py-1.5 rounded text-xs flex items-center space-x-1 disabled:opacity-50"
                >
                  {downloading === attachment.id ? (
                    <div className="w-3.5 h-3.5 border-2 border-glass border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                  )}
                  <span>Download</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
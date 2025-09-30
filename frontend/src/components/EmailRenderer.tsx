'use client'

import { useState, useMemo } from 'react'
import DOMPurify from 'dompurify'

interface EmailRendererProps {
  bodyHtml?: string
  bodyText?: string
  className?: string
}

export default function EmailRenderer({ bodyHtml, bodyText, className = '' }: EmailRendererProps) {
  const [showImages, setShowImages] = useState(false)
  const [viewMode, setViewMode] = useState<'html' | 'text'>('html')

  // Determine which content to show
  const hasHtml = bodyHtml && bodyHtml.trim().length > 0
  const hasText = bodyText && bodyText.trim().length > 0

  // Auto-select view mode based on available content
  const effectiveViewMode = useMemo(() => {
    if (viewMode === 'html' && hasHtml) return 'html'
    if (viewMode === 'text' && hasText) return 'text'
    if (hasHtml) return 'html'
    if (hasText) return 'text'
    return 'html'
  }, [viewMode, hasHtml, hasText])

  // Sanitize and process HTML content
  const sanitizedHtml = useMemo(() => {
    if (!bodyHtml) return ''

    let html = bodyHtml

    // Replace external images with placeholders if images are not allowed
    if (!showImages) {
      html = html.replace(
        /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi,
        (match, beforeSrc, src, afterSrc) => {
          // Skip data URLs (inline images) and tracking pixels
          if (src.startsWith('data:')) return match

          const width = match.match(/width=["']?(\d+)["']?/i)?.[1]
          const height = match.match(/height=["']?(\d+)["']?/i)?.[1]

          // Likely tracking pixel (small or 1x1 image)
          if ((width && parseInt(width) <= 10) || (height && parseInt(height) <= 10)) {
            return '' // Remove tracking pixels entirely
          }

          return `<div class="blocked-image" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 16px; margin: 8px 0; text-align: center; color: rgba(255,255,255,0.7);">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-bottom: 8px;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <div>Image blocked for privacy</div>
            <div style="font-size: 12px; opacity: 0.8; margin-top: 4px;">Click "Load Images" to display</div>
          </div>`
        }
      )
    }

    // Sanitize the HTML
    const cleanHtml = DOMPurify.sanitize(html, {
      ADD_TAGS: ['style'],
      ADD_ATTR: ['style', 'class', 'colspan', 'rowspan', 'cellpadding', 'cellspacing', 'width', 'height', 'align', 'valign'],
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'applet', 'form', 'input', 'button', 'textarea', 'select'],
      FORBID_ATTR: [
        'onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout', 'onmousedown', 'onmouseup',
        'onkeydown', 'onkeyup', 'onkeypress', 'onfocus', 'onblur', 'onchange', 'onsubmit'
      ],
      ALLOW_DATA_ATTR: false,
      USE_PROFILES: { html: true }
    })

    return cleanHtml
  }, [bodyHtml, showImages])

  // Prepare iframe source document
  const iframeContent = useMemo(() => {
    if (effectiveViewMode === 'text' || !sanitizedHtml) {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              line-height: 1.6;
              color: rgba(255, 255, 255, 0.9);
              background: transparent;
              margin: 0;
              padding: 16px;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
          </style>
        </head>
        <body>${bodyText || 'No content available'}</body>
        </html>
      `
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            line-height: 1.6;
            color: rgba(255, 255, 255, 0.9);
            background: transparent;
            margin: 0;
            padding: 16px;
            word-wrap: break-word;
          }
          /* Override potentially problematic styles */
          * {
            max-width: 100% !important;
            position: relative !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse;
          }
          img {
            max-width: 100% !important;
            height: auto !important;
          }
          /* Style for blocked images */
          .blocked-image {
            background: rgba(255,255,255,0.1) !important;
            border: 1px solid rgba(255,255,255,0.2) !important;
            border-radius: 8px !important;
            padding: 16px !important;
            margin: 8px 0 !important;
            text-align: center !important;
            color: rgba(255,255,255,0.7) !important;
          }
        </style>
      </head>
      <body>${sanitizedHtml}</body>
      </html>
    `
  }, [effectiveViewMode, sanitizedHtml, bodyText])

  // Count blocked images
  const blockedImageCount = useMemo(() => {
    if (!bodyHtml || showImages) return 0
    const matches = bodyHtml.match(/<img[^>]*src=["'](?!data:)[^"']+["'][^>]*>/gi)
    if (!matches) return 0

    // Filter out tracking pixels
    return matches.filter(match => {
      const width = match.match(/width=["']?(\d+)["']?/i)?.[1]
      const height = match.match(/height=["']?(\d+)["']?/i)?.[1]
      return !(width && parseInt(width) <= 10) && !(height && parseInt(height) <= 10)
    }).length
  }, [bodyHtml, showImages])

  return (
    <div className={`email-renderer ${className}`}>
      {/* Controls */}
      <div className="flex items-center justify-between mb-4 p-3 glass rounded-lg">
        <div className="flex items-center space-x-3">
          {hasHtml && hasText && (
            <div className="flex rounded-md glass p-1">
              <button
                onClick={() => setViewMode('html')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  effectiveViewMode === 'html'
                    ? 'bg-white/20 text-white'
                    : 'text-glass hover:text-white'
                }`}
              >
                Rich View
              </button>
              <button
                onClick={() => setViewMode('text')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  effectiveViewMode === 'text'
                    ? 'bg-white/20 text-white'
                    : 'text-glass hover:text-white'
                }`}
              >
                Plain Text
              </button>
            </div>
          )}
        </div>

        {effectiveViewMode === 'html' && blockedImageCount > 0 && (
          <button
            onClick={() => setShowImages(!showImages)}
            className="flex items-center space-x-2 text-xs glass-button px-3 py-2 rounded-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={showImages
                  ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M14.12 14.12l1.415 1.415M14.12 14.12L9.878 9.878"
                  : "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z"
                }
              />
            </svg>
            <span>
              {showImages ? 'Hide Images' : `Load Images (${blockedImageCount})`}
            </span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="email-content">
        <iframe
          sandbox="allow-same-origin"
          style={{
            width: '100%',
            border: 'none',
            minHeight: '400px',
            borderRadius: '8px',
            background: 'transparent'
          }}
          srcDoc={iframeContent}
          title="Email content"
          onLoad={(e) => {
            // Auto-resize iframe based on content
            const iframe = e.target as HTMLIFrameElement
            try {
              const doc = iframe.contentDocument || iframe.contentWindow?.document
              if (doc) {
                const height = doc.body.scrollHeight + 40 // Add some padding
                iframe.style.height = `${Math.max(400, height)}px`
              }
            } catch (error) {
              // Cross-origin restrictions might prevent access
              console.log('Could not auto-resize iframe:', error)
            }
          }}
        />
      </div>

      {!hasHtml && !hasText && (
        <div className="text-center py-8 text-glass">
          <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>No email content available</p>
        </div>
      )}
    </div>
  )
}
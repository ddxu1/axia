'use client'

import { useState, useEffect } from 'react'
import { Attachment } from '@/types/email'
import dynamic from 'next/dynamic'
import { pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

// Lazy load the Document and Page components from react-pdf
const Document = dynamic(() => import('react-pdf').then(mod => mod.Document), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-glass border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
})

const Page = dynamic(() => import('react-pdf').then(mod => mod.Page), {
  ssr: false
})

interface PdfViewerProps {
  attachment: Attachment
  emailId: string
  onClose: () => void
}

export default function PdfViewer({ attachment, emailId, onClose }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch PDF data when component mounts
    const fetchPdf = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(
          `/api/emails/${emailId}/attachments/${attachment.attachmentId}?filename=${encodeURIComponent(attachment.filename)}&mimeType=${encodeURIComponent(attachment.mimeType)}`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch PDF')
        }

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        setPdfUrl(url)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load PDF')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPdf()

    // Cleanup URL when component unmounts
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [attachment, emailId])

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
  }

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset
      if (newPageNumber >= 1 && numPages && newPageNumber <= numPages) {
        return newPageNumber
      }
      return prevPageNumber
    })
  }

  const changeScale = (delta: number) => {
    setScale(prevScale => {
      const newScale = prevScale + delta
      return Math.min(Math.max(0.5, newScale), 3.0)
    })
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-8">
      <div className="glass rounded-2xl w-full max-w-6xl h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-glass p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-glass-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17h6M9 13h6M13 3v5a1 1 0 001 1h5" />
            </svg>
            <h2 className="text-lg font-semibold text-glass">{attachment.filename}</h2>
          </div>
          <button
            onClick={onClose}
            className="glass-button text-glass p-2 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Controls */}
        <div className="border-b border-glass p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => changePage(-1)}
              disabled={pageNumber <= 1}
              className="glass-button text-glass px-3 py-1.5 rounded text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-glass-dark px-3">
              Page {pageNumber} of {numPages || '-'}
            </span>
            <button
              onClick={() => changePage(1)}
              disabled={!numPages || pageNumber >= numPages}
              className="glass-button text-glass px-3 py-1.5 rounded text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => changeScale(-0.25)}
              disabled={scale <= 0.5}
              className="glass-button text-glass p-1.5 rounded disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-sm text-glass-dark min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => changeScale(0.25)}
              disabled={scale >= 3.0}
              className="glass-button text-glass p-1.5 rounded disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={() => setScale(1.0)}
              className="glass-button text-glass px-3 py-1.5 rounded text-sm"
            >
              Fit
            </button>
          </div>

          <a
            href={pdfUrl || '#'}
            download={attachment.filename}
            className="glass-button text-glass px-3 py-1.5 rounded text-sm flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            <span>Download</span>
          </a>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-glass border-t-transparent rounded-full animate-spin"></div>
              <p className="text-glass-dark">Loading PDF...</p>
            </div>
          ) : error ? (
            <div className="text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={onClose}
                className="glass-button text-glass px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          ) : pdfUrl ? (
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              className="flex justify-center"
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={false}
                className="shadow-2xl"
              />
            </Document>
          ) : null}
        </div>
      </div>
    </div>
  )
}
'use client'

import { Email } from '@/types/email'

interface EmailViewerProps {
  email: Email | null
}

export default function EmailViewer({ email }: EmailViewerProps) {
  if (!email) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Select an email to view
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {email.subject || '(No Subject)'}
        </h1>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-semibold">From: </span>
            <span>{email.from}</span>
          </div>
          <div>
            <span className="font-semibold">To: </span>
            <span>{email.to.join(', ')}</span>
          </div>
          <div>
            <span className="font-semibold">Date: </span>
            <span>{new Date(email.date).toLocaleString()}</span>
          </div>
        </div>
      </div>
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="whitespace-pre-wrap text-gray-800">
          {email.body || email.snippet}
        </div>
      </div>
    </div>
  )
}
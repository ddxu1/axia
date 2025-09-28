'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Email } from '@/types/email'

interface EmailListProps {
  onEmailSelect: (email: Email) => void
}

export default function EmailList({ onEmailSelect }: EmailListProps) {
  const { data: session } = useSession()
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session) {
      fetchEmails()
    }
  }, [session])

  const fetchEmails = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/emails')
      if (!response.ok) {
        throw new Error('Failed to fetch emails')
      }
      const data = await response.json()
      setEmails(data.emails)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-4">Loading emails...</div>
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>
  }

  return (
    <div className="h-full overflow-y-auto">
      {emails.map((email) => (
        <div
          key={email.id}
          className="border-b border-gray-200 p-4 hover:bg-gray-50 cursor-pointer"
          onClick={() => onEmailSelect(email)}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="font-semibold text-gray-900 truncate">
              {email.from}
            </span>
            <span className="text-sm text-gray-500">
              {new Date(email.date).toLocaleDateString()}
            </span>
          </div>
          <div className="mb-1">
            <span className={`text-sm ${!email.isRead ? 'font-semibold' : ''}`}>
              {email.subject || '(No Subject)'}
            </span>
          </div>
          <div className="text-sm text-gray-600 truncate">
            {email.snippet}
          </div>
        </div>
      ))}
    </div>
  )
}
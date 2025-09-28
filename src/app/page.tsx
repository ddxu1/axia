'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import AuthButton from '@/components/AuthButton'
import EmailList from '@/components/EmailList'
import EmailViewer from '@/components/EmailViewer'
import { Email } from '@/types/email'

export default function Home() {
  const { data: session } = useSession()
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Unified Email Client
          </h1>
          <AuthButton />
        </div>
      </div>

      {session ? (
        <div className="flex h-[calc(100vh-73px)]">
          <div className="w-1/3 bg-white border-r border-gray-200">
            <EmailList onEmailSelect={setSelectedEmail} />
          </div>
          <div className="flex-1 bg-white">
            <EmailViewer email={selectedEmail} />
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Your Email Client
            </h2>
            <p className="text-gray-600 mb-8">
              Connect your Gmail account to get started managing your emails.
            </p>
          </div>
        </div>
      )}
    </main>
  )
}
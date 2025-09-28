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
  const [emails, setEmails] = useState<Email[]>([])

  const handleEmailUpdate = (emailId: string, updates: Partial<Email>) => {
    setEmails(prevEmails =>
      prevEmails.map(email =>
        email.id === emailId ? { ...email, ...updates } : email
      )
    )

    // Update selected email if it's the one being updated
    if (selectedEmail?.id === emailId) {
      setSelectedEmail(prev => prev ? { ...prev, ...updates } : null)
    }
  }

  const handleEmailDelete = (emailId: string) => {
    setEmails(prevEmails => prevEmails.filter(email => email.id !== emailId))

    // Clear selected email if it's the one being deleted
    if (selectedEmail?.id === emailId) {
      setSelectedEmail(null)
    }
  }

  const handleEmailArchive = (emailId: string) => {
    setEmails(prevEmails => prevEmails.filter(email => email.id !== emailId))

    // Clear selected email if it's the one being archived
    if (selectedEmail?.id === emailId) {
      setSelectedEmail(null)
    }
  }

  return (
    <main className="min-h-screen relative overflow-hidden">

      {/* Header */}
      <div className="relative z-10 glass border-0 border-b border-glass">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            {session && (
              <span className="text-sm text-glass">
                {session.user?.email}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {session && (
              <button className="glass-button text-glass p-2 rounded-full hover:scale-105 transition-all duration-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
            <AuthButton />
          </div>
        </div>
      </div>

      {session ? (
        <div className="relative z-10 flex h-[calc(100vh-61px)] p-4 gap-4">
          {/* Email List Sidebar */}
          <div className="w-1/3 glass-card rounded-2xl overflow-hidden hover-lift">
            <EmailList
              onEmailSelect={setSelectedEmail}
              emails={emails}
              onEmailsUpdate={setEmails}
            />
          </div>

          {/* Email Viewer */}
          <div className="flex-1 glass-card rounded-2xl overflow-hidden hover-lift">
            <EmailViewer
              email={selectedEmail}
              onEmailUpdate={handleEmailUpdate}
              onEmailDelete={handleEmailDelete}
              onEmailArchive={handleEmailArchive}
            />
          </div>
        </div>
      ) : (
        <div className="relative z-10 container mx-auto px-4 py-24">
          <div className="text-center max-w-2xl mx-auto">
            <div className="glass-card rounded-3xl p-12 hover-lift">
              <div className="w-24 h-24 liquid-gradient rounded-full mx-auto mb-8 flex items-center justify-center">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-4xl font-bold text-glass mb-6 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                Welcome to the Future
              </h2>
              <p className="text-lg text-glass-dark mb-8 leading-relaxed">
                Experience email management like never before with our liquid glass interface.
                Connect your Gmail and dive into a world of seamless communication.
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2 text-glass-dark">
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Secure OAuth Authentication</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-glass-dark">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Real-time Email Sync</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-glass-dark">
                  <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Beautiful Liquid Glass UI</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
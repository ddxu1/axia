'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import AuthButton from '@/components/AuthButton'
import EmailList from '@/components/EmailList'
import EmailViewer from '@/components/EmailViewer'
import ComposeEmail from '@/components/ComposeEmail'
import FilterSidebar from '@/components/FilterSidebar'
import Footer from '@/components/Footer'
import { Email } from '@/types/email'

export default function Home() {
  const { data: session } = useSession()
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [emails, setEmails] = useState<Email[]>([])
  const [showCompose, setShowCompose] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [emailCounts, setEmailCounts] = useState<Record<string, number>>({})

  // Fetch email counts
  const fetchEmailCounts = async () => {
    if (session) {
      try {
        const response = await fetch('/api/emails/counts')
        if (response.ok) {
          const counts = await response.json()
          setEmailCounts(counts)
        }
      } catch (error) {
        console.error('Failed to fetch email counts:', error)
      }
    }
  }

  useEffect(() => {
    fetchEmailCounts()

    // Refresh counts every 30 seconds
    const interval = setInterval(fetchEmailCounts, 30000)
    return () => clearInterval(interval)
  }, [session])

  const handleRefresh = () => {
    fetchEmailCounts()
    // Force EmailList to refresh by clearing and refetching emails
    setEmails([])
  }

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
      <div className="relative z-20 glass border-0 border-b border-glass">
        <div className="px-4 py-3 grid grid-cols-3 items-center">
          {/* Left side - User email or logo */}
          <div className="flex items-center">
            {!session && (
              <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: 'Bitcount Grid Single Ink, monospace' }}>axia</h1>
            )}
            {session && (
              <span className="text-sm text-glass">
                {session.user?.email}
              </span>
            )}
          </div>

          {/* Center - Search Bar */}
          <div className="flex justify-center">
            {session && (
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  placeholder="Search all emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/20 text-white placeholder-gray-400 px-4 py-2 pr-20 rounded-lg border border-white/10 focus:border-white/20 focus:outline-none"
                />
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 hover:text-white transition-colors"
                    title="Clear search"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ) : (
                  <svg className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </div>
            )}
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center space-x-3 justify-end">
            {session && (
              <>
                <button
                  onClick={() => setShowCompose(true)}
                  className="glass-button text-glass px-4 py-2 rounded-full transition-all duration-300 flex items-center space-x-2"
                  title="Compose Email"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline">Compose</span>
                </button>
                <button className="glass-button text-glass p-2 rounded-full transition-all duration-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </>
            )}
            <AuthButton buttonText="Sign In" />
          </div>
        </div>
      </div>

      {session ? (
        <div className="relative z-10 flex h-[calc(100vh-61px)] p-4 gap-4">
          {/* Filter Sidebar */}
          <div className="w-64 flex-shrink-0">
            <FilterSidebar
              selectedFilter={selectedFilter}
              onFilterChange={setSelectedFilter}
              emailCounts={emailCounts}
              onRefresh={handleRefresh}
            />
          </div>

          {/* Email List Sidebar */}
          <div className="w-1/3 glass-card rounded-2xl overflow-hidden hover-lift">
            <EmailList
              onEmailSelect={setSelectedEmail}
              emails={emails}
              onEmailsUpdate={setEmails}
              searchQuery={searchQuery}
              selectedFilter={selectedFilter}
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
        <div className="relative z-10">
          {/* Hero Section */}
          <div className="flex flex-col items-center justify-center min-h-screen px-4 py-24">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-7xl md:text-8xl font-light text-white mb-6 tracking-tight">
                Email that
                <span className="block font-medium bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  just works
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
                A clean, fast email client built for productivity.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <AuthButton />
                <button type="button" className="text-gray-400 hover:text-white transition-colors text-lg font-medium">
                  Learn more →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto text-left">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-white font-medium">Secure</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">OAuth authentication keeps your account safe</p>
                </div>

                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-white font-medium">Fast</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">Real-time sync with your Gmail account</p>
                </div>

                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h3 className="text-white font-medium">Simple</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">Clean interface focused on what matters</p>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="py-24 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
                  Everything you need in an email client
                </h2>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                  Built with modern web technologies for a seamless experience across all your devices.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-medium text-white">Gmail Integration</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Seamlessly connect with your existing Gmail account. All your emails, labels, and settings sync instantly.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-medium text-white">Privacy Focused</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Your data stays secure with OAuth 2.0 authentication. We never store your passwords or personal information.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 border border-green-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-medium text-white">Lightning Fast</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Built with Next.js and optimized for performance. Experience instant loading and smooth interactions.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-medium text-white">Modern Interface</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Clean, intuitive design that gets out of your way. Focus on what matters most - your conversations.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="py-24 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
                Ready to transform your email experience?
              </h2>
              <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
                <button
                  onClick={() => signIn('google')}
                  className="text-white hover:text-gray-300 transition-colors underline underline-offset-4 decoration-2 hover:decoration-white/50"
                >
                  Join
                </button>{' '}
                thousands of users who have already made the switch to a better email client.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer for landing page */}
      {!session && <Footer />}

      {/* Compose Email Modal */}
      {showCompose && (
        <ComposeEmail onClose={() => setShowCompose(false)} />
      )}
    </main>
  )
}
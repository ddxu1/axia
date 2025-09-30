'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signIn } from 'next-auth/react'
import AuthButton from '@/components/AuthButton'
import EmailList from '@/components/EmailList'
import EmailViewer from '@/components/EmailViewer'
import ComposeEmail from '@/components/ComposeEmail'
import FilterSidebar from '@/components/FilterSidebar'
import Footer from '@/components/Footer'
import Toast from '@/components/Toast'
import KeyboardShortcutsHelp from '@/components/KeyboardShortcutsHelp'
import { Email } from '@/types/email'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

export default function Home() {
  const { data: session } = useSession()
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [emails, setEmails] = useState<Email[]>([])
  const [showCompose, setShowCompose] = useState(false)
  const [showReply, setShowReply] = useState(false)
  const [showForward, setShowForward] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [emailCounts, setEmailCounts] = useState<Record<string, number>>({})
  const emailViewerRef = useRef<{
    handleReply: () => void
    handleForward: () => void
    handleArchive: () => void
    handleToggleRead: () => void
    handleDelete: () => void
  } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
  }

  // Filter emails based on search query
  const filteredEmails = emails.filter(email => {
    if (!searchQuery.trim()) return true

    const query = searchQuery.toLowerCase()
    return (
      email.subject.toLowerCase().includes(query) ||
      email.from.toLowerCase().includes(query) ||
      email.snippet.toLowerCase().includes(query) ||
      email.body?.toLowerCase().includes(query)
    )
  })

  // Fetch email counts
  const fetchEmailCounts = async () => {
    if (session) {
      try {
        const response = await fetch('/api/emails/email-counts')
        if (response.ok) {
          const counts = await response.json()
          setEmailCounts(counts)
        }
      } catch (error) {
        console.error('Failed to fetch email counts:', error)
      }
    }
  }

  // Clear selected email if it's not in filtered results
  useEffect(() => {
    if (selectedEmail && !filteredEmails.find(email => email.id === selectedEmail.id)) {
      setSelectedEmail(null)
      setSelectedIndex(-1)
    }
  }, [selectedEmail, filteredEmails])

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

  // Update selected index when selected email changes
  useEffect(() => {
    if (selectedEmail) {
      const index = filteredEmails.findIndex(email => email.id === selectedEmail.id)
      setSelectedIndex(index)
    } else {
      setSelectedIndex(-1)
    }
  }, [selectedEmail, filteredEmails])

  // Navigation handlers
  const handleNavigateDown = () => {
    if (filteredEmails.length === 0) return

    // Stop at bottom instead of wrapping to top
    if (selectedIndex < filteredEmails.length - 1) {
      const nextIndex = selectedIndex + 1
      setSelectedIndex(nextIndex)
      setSelectedEmail(filteredEmails[nextIndex])
    }
  }

  const handleNavigateUp = () => {
    if (filteredEmails.length === 0) return

    // Stop at top instead of wrapping to bottom
    if (selectedIndex > 0) {
      const prevIndex = selectedIndex - 1
      setSelectedIndex(prevIndex)
      setSelectedEmail(filteredEmails[prevIndex])
    }
  }

  const handleEscape = () => {
    // Close keyboard help if open
    if (showKeyboardHelp) {
      setShowKeyboardHelp(false)
      return
    }
    // Close modals if any are open
    if (showCompose) {
      setShowCompose(false)
      return
    }
    if (showReply) {
      setShowReply(false)
      return
    }
    if (showForward) {
      setShowForward(false)
      return
    }
    // Deselect email if one is selected
    if (selectedEmail) {
      setSelectedEmail(null)
      setSelectedIndex(-1)
    }
  }

  // Keyboard shortcuts
  useKeyboardShortcuts({
    enabled: !!session,
    hasSelectedEmail: !!selectedEmail,
    isModalOpen: showCompose || showReply || showForward || showKeyboardHelp,
    onCompose: () => setShowCompose(true),
    onReply: () => emailViewerRef.current?.handleReply(),
    onForward: () => emailViewerRef.current?.handleForward(),
    onArchive: () => emailViewerRef.current?.handleArchive(),
    onToggleRead: () => emailViewerRef.current?.handleToggleRead(),
    onDelete: () => emailViewerRef.current?.handleDelete(),
    onNavigateUp: handleNavigateUp,
    onNavigateDown: handleNavigateDown,
    onEscape: handleEscape,
    onShowHelp: () => setShowKeyboardHelp(true),
  })

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

  // Helper function to calculate count decrements when an email is removed
  const calculateCountDecrements = (email: Email): Partial<Record<string, number>> => {
    const decrements: Partial<Record<string, number>> = {}

    // Always decrement 'all' count
    decrements.all = -1

    // Decrement 'unread' count if email is unread
    if (!email.isRead) {
      decrements.unread = -1
    }

    // Decrement 'starred' count if email is starred
    if (email.isStarred) {
      decrements.starred = -1
    }

    // Check labels to determine which category counts to decrement
    if (email.labels.includes('INBOX')) {
      decrements.inbox = -1
    }
    if (email.labels.includes('CATEGORY_PERSONAL')) {
      decrements.personal = -1
    }
    if (email.labels.includes('CATEGORY_UPDATES')) {
      decrements.updates = -1
    }
    if (email.labels.includes('CATEGORY_PROMOTIONS')) {
      decrements.promotions = -1
    }

    return decrements
  }

  // Helper function to update email counts
  const updateEmailCounts = (decrements: Partial<Record<string, number>>) => {
    setEmailCounts(prevCounts => {
      const newCounts = { ...prevCounts }
      Object.entries(decrements).forEach(([key, value]) => {
        if (value !== undefined) {
          newCounts[key] = Math.max(0, (newCounts[key] || 0) + value)
        }
      })
      return newCounts
    })
  }

  const handleEmailDelete = (emailId: string) => {
    // Find the current index of the email being deleted in filtered emails
    const currentIndex = filteredEmails.findIndex(email => email.id === emailId)

    // Find the email being deleted to calculate count changes
    const emailToDelete = filteredEmails.find(email => email.id === emailId)

    // Update email counts immediately
    if (emailToDelete) {
      const countDecrements = calculateCountDecrements(emailToDelete)
      updateEmailCounts(countDecrements)
    }

    // Update emails list by removing the deleted email
    setEmails(prevEmails => prevEmails.filter(email => email.id !== emailId))

    // Select next email if the deleted email was selected
    if (selectedEmail?.id === emailId) {
      // Calculate which email to select next
      const emailsAfterDeletion = filteredEmails.filter(email => email.id !== emailId)

      if (emailsAfterDeletion.length > 0) {
        // If there are emails after deletion, select the next one
        // If we deleted the last email, select the new last email
        const nextIndex = Math.min(currentIndex, emailsAfterDeletion.length - 1)
        const nextEmail = emailsAfterDeletion[nextIndex]
        setSelectedEmail(nextEmail)
        setSelectedIndex(nextIndex)
      } else {
        // No emails left, clear selection
        setSelectedEmail(null)
        setSelectedIndex(-1)
      }
    }

    // Show toast notification
    showToast('Email deleted successfully', 'success')
  }

  const handleEmailArchive = (emailId: string) => {
    // Find the current index of the email being archived in filtered emails
    const currentIndex = filteredEmails.findIndex(email => email.id === emailId)

    // Find the email being archived to calculate count changes
    const emailToArchive = filteredEmails.find(email => email.id === emailId)

    // Update email counts immediately (archiving removes from inbox but not from all)
    if (emailToArchive) {
      const countDecrements = calculateCountDecrements(emailToArchive)
      updateEmailCounts(countDecrements)
    }

    // Update emails list by removing the archived email
    setEmails(prevEmails => prevEmails.filter(email => email.id !== emailId))

    // Select next email if the archived email was selected
    if (selectedEmail?.id === emailId) {
      // Calculate which email to select next
      const emailsAfterArchive = filteredEmails.filter(email => email.id !== emailId)

      if (emailsAfterArchive.length > 0) {
        // If there are emails after archiving, select the next one
        // If we archived the last email, select the new last email
        const nextIndex = Math.min(currentIndex, emailsAfterArchive.length - 1)
        const nextEmail = emailsAfterArchive[nextIndex]
        setSelectedEmail(nextEmail)
        setSelectedIndex(nextIndex)
      } else {
        // No emails left, clear selection
        setSelectedEmail(null)
        setSelectedIndex(-1)
      }
    }

    // Show toast notification
    showToast('Email archived', 'success')
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
              selectedId={selectedEmail?.id || null}
              searchQuery={searchQuery}
              selectedFilter={selectedFilter}
            />
          </div>

          {/* Email Viewer */}
          <div className="flex-1 glass-card rounded-2xl overflow-hidden hover-lift">
            <EmailViewer
              ref={emailViewerRef}
              email={selectedEmail}
              onEmailUpdate={handleEmailUpdate}
              onEmailDelete={handleEmailDelete}
              onEmailArchive={handleEmailArchive}
              onReplyOpen={() => setShowReply(true)}
              onForwardOpen={() => setShowForward(true)}
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
        <ComposeEmail
          onClose={() => setShowCompose(false)}
          wasEmailSelected={!!selectedEmail}
          onEscapeToBase={() => setSelectedEmail(null)}
          onEmailSent={() => showToast('Email sent successfully', 'success')}
        />
      )}

      {/* Reply Modal */}
      {showReply && selectedEmail && (
        <ComposeEmail
          replyTo={{
            email: selectedEmail.from.replace(/.*<(.+)>.*/, '$1').trim() || selectedEmail.from,
            subject: selectedEmail.subject,
            body: selectedEmail.body || selectedEmail.snippet
          }}
          onClose={() => setShowReply(false)}
          wasEmailSelected={true}
          onEmailSent={() => showToast('Reply sent successfully', 'success')}
        />
      )}

      {/* Forward Modal */}
      {showForward && selectedEmail && (
        <ComposeEmail
          replyTo={{
            email: '',
            subject: `Fwd: ${selectedEmail.subject}`,
            body: `<br><br>---------- Forwarded message ----------<br>From: ${selectedEmail.from}<br>Date: ${new Date(selectedEmail.date).toLocaleString()}<br>Subject: ${selectedEmail.subject}<br>To: ${selectedEmail.to.join(', ')}<br><br>${selectedEmail.body || selectedEmail.snippet}`
          }}
          isForward={true}
          onClose={() => setShowForward(false)}
          wasEmailSelected={true}
          onEmailSent={() => showToast('Email forwarded successfully', 'success')}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Keyboard Shortcuts Help */}
      {showKeyboardHelp && (
        <KeyboardShortcutsHelp onClose={() => setShowKeyboardHelp(false)} />
      )}
    </main>
  )
}
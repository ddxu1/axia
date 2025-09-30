'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useAccountSwitcher } from '@/hooks/useAccountSwitcher'

interface AuthButtonProps {
  buttonText?: string
}

export default function AuthButton({ buttonText = "Get started" }: AuthButtonProps) {
  const { session, switchAccount, signOutCompletely, isSwitching } = useAccountSwitcher()
  const [showDropdown, setShowDropdown] = useState(false)

  const handleSwitchAccount = async () => {
    setShowDropdown(false)
    await switchAccount()
  }

  const handleSignOut = () => {
    setShowDropdown(false)
    signOutCompletely()
  }

  if (session) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors p-2 rounded-lg"
          title="Account options"
        >
          {session.user?.image ? (
            <img
              src={session.user.image}
              alt="Profile"
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center">
              <span className="text-xs text-white">
                {session.user?.name?.charAt(0) || session.user?.email?.charAt(0)}
              </span>
            </div>
          )}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDropdown && (
          <>
            {/* Backdrop to close dropdown */}
            <div
              className="fixed inset-0 z-50"
              onClick={() => setShowDropdown(false)}
            />

            {/* Dropdown menu */}
            <div className="absolute right-0 mt-2 w-64 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl z-50">
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt="Profile"
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                      <span className="text-sm text-white">
                        {session.user?.name?.charAt(0) || session.user?.email?.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {session.user?.name || 'User'}
                    </p>
                    <p className="text-gray-400 text-sm truncate">
                      {session.user?.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-2">
                <button
                  onClick={handleSwitchAccount}
                  disabled={isSwitching}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSwitching ? (
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  )}
                  <span>{isSwitching ? 'Switching...' : 'Switch Google Account'}</span>
                </button>

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  const handleSignIn = () => {
    signIn('google')
  }

  return (
    <button
      onClick={handleSignIn}
      className="bg-white text-black font-medium py-2 px-6 rounded-full hover:bg-gray-100 transition-colors flex items-center space-x-2 text-base"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      <span>{buttonText}</span>
    </button>
  )
}
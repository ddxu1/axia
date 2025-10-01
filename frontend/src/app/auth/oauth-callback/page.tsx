'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function OAuthCallbackContent() {
  const searchParams = useSearchParams()

  useEffect(() => {
    console.log('OAuth Callback - Search params:', Object.fromEntries(searchParams.entries()))
    console.log('OAuth Callback - Has opener:', !!window.opener)

    const code = searchParams.get('code')
    const error = searchParams.get('error')

    console.log('OAuth Callback - Code:', code)
    console.log('OAuth Callback - Error:', error)

    if (code && window.opener) {
      console.log('OAuth Callback - Sending success message to parent')
      // Send code back to parent window
      window.opener.postMessage({
        type: 'oauth-success',
        code: code
      }, window.location.origin)
    } else if (error && window.opener) {
      console.log('OAuth Callback - Sending error message to parent')
      // Send error back to parent window
      window.opener.postMessage({
        type: 'oauth-error',
        error: error
      }, window.location.origin)
    } else {
      console.log('OAuth Callback - Missing code or opener')
    }
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white/60">Completing authorization...</p>
      </div>
    </div>
  )
}

export default function OAuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  )
}

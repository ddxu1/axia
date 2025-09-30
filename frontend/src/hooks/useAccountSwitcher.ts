import { useSession, signIn, signOut } from 'next-auth/react'
import { useState } from 'react'

export function useAccountSwitcher() {
  const { data: session } = useSession()
  const [isSwitching, setIsSwitching] = useState(false)

  const switchAccount = async () => {
    try {
      setIsSwitching(true)

      // Sign out silently first
      await signOut({ redirect: false })

      // Small delay to ensure session is cleared
      await new Promise(resolve => setTimeout(resolve, 100))

      // Trigger account selection
      signIn('google', {
        callbackUrl: window.location.href
      }, {
        prompt: 'select_account'
      })
    } catch (error) {
      console.error('Account switching failed:', error)
      setIsSwitching(false)
    }
  }

  const signOutCompletely = () => {
    signOut({ callbackUrl: window.location.origin })
  }

  return {
    session,
    switchAccount,
    signOutCompletely,
    isSwitching
  }
}
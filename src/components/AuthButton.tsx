'use client'

import { useSession, signIn, signOut } from 'next-auth/react'

export default function AuthButton() {
  const { data: session } = useSession()

  if (session) {
    return (
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-600">
          Signed in as {session.user?.email}
        </span>
        <button
          onClick={() => signOut()}
          className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md"
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => signIn('google')}
      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
    >
      Connect Gmail
    </button>
  )
}
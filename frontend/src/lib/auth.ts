import GoogleProvider from 'next-auth/providers/google'
import { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send',
          prompt: 'consent',
          access_type: 'offline'
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string

      // Register user with backend and get backend JWT
      if (token.accessToken && !session.backendToken) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/auth/google-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              google_access_token: token.accessToken,
              google_refresh_token: token.refreshToken
            }),
          })

          if (response.ok) {
            const backendAuth = await response.json()
            session.backendToken = backendAuth.access_token
            session.user = {
              ...session.user,
              ...backendAuth.user
            }

            if (backendAuth.is_new_user) {
              console.log(`🆕 New user registered: ${backendAuth.user.email}`)
            }
          }
        } catch (error) {
          console.error('Failed to register with backend:', error)
        }
      }

      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  pages: {
    signIn: '/',
    error: '/'
  },
  debug: process.env.NODE_ENV === 'development'
}
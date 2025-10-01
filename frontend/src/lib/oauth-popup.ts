// OAuth popup flow for adding additional accounts without switching sessions

interface OAuthResult {
  access_token: string
  refresh_token?: string
  expires_in?: number
  provider: string
}

export async function openGoogleOAuthPopup(): Promise<OAuthResult> {
  return new Promise((resolve, reject) => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '759228532161-hiqg1qre561h43apfdafcurd8ab1tv0s.apps.googleusercontent.com'
    const redirectUri = `${window.location.origin}/auth/oauth-callback`
    const scope = 'openid email profile https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send'

    console.log('OAuth Popup - Client ID:', clientId)
    console.log('OAuth Popup - Redirect URI:', redirectUri)

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scope,
      access_type: 'offline',
      prompt: 'consent'
    })}`

    console.log('OAuth Popup - Full Auth URL:', authUrl)

    const width = 500
    const height = 600
    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2

    const popup = window.open(
      authUrl,
      'Google OAuth',
      `width=${width},height=${height},left=${left},top=${top}`
    )

    if (!popup) {
      reject(new Error('Failed to open popup window'))
      return
    }

    // Listen for messages from the popup
    const messageHandler = async (event: MessageEvent) => {
      console.log('OAuth Popup - Received message:', event.data, 'from origin:', event.origin)
      console.log('OAuth Popup - Expected origin:', window.location.origin)

      if (event.origin !== window.location.origin) {
        console.log('OAuth Popup - Origin mismatch, ignoring message')
        return
      }

      if (event.data.type === 'oauth-success') {
        window.removeEventListener('message', messageHandler)

        console.log('OAuth Popup - Received success message, exchanging code for tokens')

        try {
          // Exchange code for tokens
          const response = await fetch('/api/auth/exchange-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: event.data.code,
              provider: 'google'
            })
          })

          if (!response.ok) {
            const errorText = await response.text()
            console.error('Failed to exchange code:', errorText)
            throw new Error('Failed to exchange authorization code')
          }

          const tokens = await response.json()
          console.log('OAuth Popup - Tokens received successfully')

          // Try to close popup (may fail due to COOP, but that's ok)
          try {
            popup?.close()
          } catch (e) {
            console.log('Could not close popup (COOP policy), user will need to close manually')
          }

          resolve({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_in: tokens.expires_in,
            provider: 'google'
          })
        } catch (error) {
          reject(error)
        }
      } else if (event.data.type === 'oauth-error') {
        window.removeEventListener('message', messageHandler)
        try {
          popup?.close()
        } catch (e) {
          // Ignore COOP errors
        }
        reject(new Error(event.data.error))
      }
    }

    window.addEventListener('message', messageHandler)
  })
}

export async function openAzureOAuthPopup(): Promise<OAuthResult> {
  return new Promise((resolve, reject) => {
    const clientId = process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID || 'e0570d3c-b5ed-4ea4-baac-53a0baeba549'
    const redirectUri = `${window.location.origin}/auth/oauth-callback`
    const scope = 'openid email profile https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/Mail.ReadWrite offline_access'

    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scope,
      prompt: 'consent'
    })}`

    const width = 500
    const height = 600
    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2

    const popup = window.open(
      authUrl,
      'Microsoft OAuth',
      `width=${width},height=${height},left=${left},top=${top}`
    )

    if (!popup) {
      reject(new Error('Failed to open popup window'))
      return
    }

    const messageHandler = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      if (event.data.type === 'oauth-success') {
        window.removeEventListener('message', messageHandler)
        popup?.close()

        try {
          const response = await fetch('/api/auth/exchange-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: event.data.code,
              provider: 'azure-ad'
            })
          })

          if (!response.ok) {
            throw new Error('Failed to exchange authorization code')
          }

          const tokens = await response.json()
          resolve({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_in: tokens.expires_in,
            provider: 'azure-ad'
          })
        } catch (error) {
          reject(error)
        }
      } else if (event.data.type === 'oauth-error') {
        window.removeEventListener('message', messageHandler)
        popup?.close()
        reject(new Error(event.data.error))
      }
    }

    window.addEventListener('message', messageHandler)

    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed)
        window.removeEventListener('message', messageHandler)
        reject(new Error('OAuth popup was closed'))
      }
    }, 1000)
  })
}

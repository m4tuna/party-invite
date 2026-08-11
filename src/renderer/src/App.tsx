import { useEffect, useState } from 'react'
import { usePartyStore } from './store/partyStore'
import LoginView from './components/LoginView'
import HomeView from './components/HomeView'
import type { AuthState, Guest } from './types'

declare global {
  interface Window {
    api: {
      getAuth: () => Promise<AuthState>
      logout: () => Promise<void>
      login: () => void
      saveAuth: (auth: { idToken: string; accessToken: string; user: unknown }) => Promise<void>
      createParty: (data: { name: string; date?: string; location?: string; description?: string }) => Promise<import('./types').Party>
      listParties: () => Promise<import('./types').Party[]>
      getParty: (id: string) => Promise<{ party: import('./types').Party; guests: Guest[] }>
      setCurrentParty: (id: string) => Promise<void>
      addGuest: (data: { partyId: string; name: string; email?: string; phone?: string }) => Promise<Guest>
      removeGuest: (id: string) => Promise<void>
      importAppleContacts: () => Promise<import('./types').RawContact[]>
      importGmailContacts: (token: string) => Promise<import('./types').RawContact[]>
      sendInvites: (data: { guestIds: string[]; via: string[] }) => Promise<{ sent: string[]; failed: Array<{ id: string; error: string }> }>
      saveCredentials: (data: { resend?: { apiKey: string }; twilio?: { sid: string; token: string; from: string } }) => Promise<void>
      getCredentials: () => Promise<{ resend: { apiKey: string } | null; twilio: { sid: string; token: string; from: string } | null }>
      onGuestUpdated: (cb: (guest: Guest) => void) => () => void
      onAuth0Tokens: (cb: (data: { idToken: string; accessToken: string; user: unknown }) => void) => () => void
    }
  }
}

export default function App() {
  const { setAuth, upsertGuest } = usePartyStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.getAuth().then((a) => {
      setAuth(a?.user ? a : null)
      setLoading(false)
    })

    const cleanupGuest = window.api.onGuestUpdated((g) => upsertGuest(g))

    // Listen for Auth0 callback tokens pushed from main process
    const cleanupAuth = window.api.onAuth0Tokens(async (data) => {
      await window.api.saveAuth(data)
      const auth = await window.api.getAuth()
      setAuth(auth?.user ? auth : null)
    })

    return () => {
      cleanupGuest()
      cleanupAuth()
    }
  }, [])

  const auth = usePartyStore((s) => s.auth)

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>Loading…</div>
      </div>
    )
  }

  if (!auth?.user) return <LoginView />
  return <HomeView />
}

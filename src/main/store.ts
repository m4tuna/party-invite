import Store from 'electron-store'

interface Schema {
  auth: {
    idToken: string | null
    accessToken: string | null
    user: { email: string; name: string; picture: string } | null
  }
  currentPartyId: string | null
  twilio: { sid: string; token: string; from: string } | null
  resend: { apiKey: string } | null
}

export const store = new Store<Schema>({
  defaults: {
    auth: { idToken: null, accessToken: null, user: null },
    currentPartyId: null,
    twilio: null,
    resend: null,
  },
})

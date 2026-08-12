export interface Party {
  id: string
  name: string
  date: string | null
  location: string | null
  description: string | null
  emoji: string | null
  accent_color: string | null
  cover_image_url: string | null
  created_at: string
}

export interface Guest {
  id: string
  party_id: string
  name: string
  email: string | null
  phone: string | null
  guest_token: string
  rsvp_status: 'pending' | 'attending' | 'declined'
  rsvp_at: string | null
  invite_sent_at: string | null
}

export interface RawContact {
  name: string
  emails: string[]
  phones: string[]
}

export interface AuthState {
  idToken: string | null
  accessToken: string | null
  user: { email: string; name: string; picture: string } | null
}

import { create } from 'zustand'
import type { Party, Guest, AuthState } from '../types'

interface PartyStore {
  auth: AuthState | null
  parties: Party[]
  currentParty: Party | null
  guests: Guest[]
  setAuth: (auth: AuthState | null) => void
  setParties: (parties: Party[]) => void
  setCurrentParty: (party: Party | null) => void
  setGuests: (guests: Guest[]) => void
  upsertGuest: (guest: Guest) => void
  removeGuest: (id: string) => void
}

export const usePartyStore = create<PartyStore>((set) => ({
  auth: null,
  parties: [],
  currentParty: null,
  guests: [],
  setAuth: (auth) => set({ auth }),
  setParties: (parties) => set({ parties }),
  setCurrentParty: (party) => set({ currentParty: party }),
  setGuests: (guests) => set({ guests }),
  upsertGuest: (guest) =>
    set((s) => ({
      guests: s.guests.some((g) => g.id === guest.id)
        ? s.guests.map((g) => (g.id === guest.id ? guest : g))
        : [...s.guests, guest],
    })),
  removeGuest: (id) => set((s) => ({ guests: s.guests.filter((g) => g.id !== id) })),
}))

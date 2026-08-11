import { ipcMain, BrowserWindow } from 'electron'
import { supabase } from './supabase'
import { store } from './store'
import * as contacts from './contacts'
import * as invites from './invites'

export function registerIpcHandlers(win: BrowserWindow) {
  // Auth — just read/write store; actual login is done via shell.openExternal in auth0.ts
  ipcMain.handle('party:getAuth', () => store.get('auth'))
  ipcMain.handle('party:logout', () => {
    store.set('auth', { idToken: null, accessToken: null, user: null })
    store.set('currentPartyId', null)
  })

  // Parties
  ipcMain.handle('party:createParty', async (_, data: { name: string; date?: string; location?: string; description?: string }) => {
    const auth = store.get('auth')
    if (!auth?.user) throw new Error('Not authenticated')
    // Decode sub from idToken (JWT payload)
    const payload = JSON.parse(Buffer.from(auth.idToken!.split('.')[1], 'base64url').toString())
    const { data: row, error } = await supabase
      .from('party_invite_parties')
      .insert({ ...data, host_user_id: payload.sub })
      .select()
      .single()
    if (error) throw error
    return row
  })

  ipcMain.handle('party:listParties', async () => {
    const auth = store.get('auth')
    if (!auth?.user) return []
    const payload = JSON.parse(Buffer.from(auth.idToken!.split('.')[1], 'base64url').toString())
    const { data, error } = await supabase
      .from('party_invite_parties')
      .select('*')
      .eq('host_user_id', payload.sub)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  })

  ipcMain.handle('party:getParty', async (_, id: string) => {
    const [{ data: party }, { data: guests }] = await Promise.all([
      supabase.from('party_invite_parties').select('*').eq('id', id).single(),
      supabase.from('party_invite_guests').select('*').eq('party_id', id).order('created_at'),
    ])
    return { party, guests: guests || [] }
  })

  ipcMain.handle('party:setCurrentParty', (_, id: string) => {
    store.set('currentPartyId', id)
  })

  // Guests
  ipcMain.handle('party:addGuest', async (_, data: { partyId: string; name: string; email?: string; phone?: string }) => {
    const { data: row, error } = await supabase
      .from('party_invite_guests')
      .insert({ party_id: data.partyId, name: data.name, email: data.email || null, phone: data.phone || null })
      .select()
      .single()
    if (error) throw error
    return row
  })

  ipcMain.handle('party:removeGuest', async (_, id: string) => {
    const { error } = await supabase.from('party_invite_guests').delete().eq('id', id)
    if (error) throw error
  })

  // Contacts import
  ipcMain.handle('party:importAppleContacts', async () => {
    return contacts.importFromApple()
  })

  ipcMain.handle('party:importGmailContacts', async (_, accessToken: string) => {
    return contacts.importFromGmail(accessToken)
  })

  // Invites
  ipcMain.handle('party:sendInvites', async (_, { guestIds, via }: { guestIds: string[]; via: ('email' | 'sms')[] }) => {
    const resend = store.get('resend')
    const twilio = store.get('twilio')
    // Fetch guests and their party
    const { data: guestRows } = await supabase
      .from('party_invite_guests')
      .select('*')
      .in('id', guestIds)
    if (!guestRows?.length) return { sent: [], failed: [] }
    const partyId = guestRows[0].party_id
    const { data: party } = await supabase.from('party_invite_parties').select('*').eq('id', partyId).single()
    if (!party) throw new Error('Party not found')
    const result = await invites.sendBatch(guestRows, party, via, { resend, twilio })
    // Update invite_sent_at for sent guests
    if (result.sent.length) {
      await supabase
        .from('party_invite_guests')
        .update({ invite_sent_at: new Date().toISOString() })
        .in('id', result.sent)
    }
    return result
  })

  // Credentials
  ipcMain.handle('party:saveCredentials', (_, data: { resend?: { apiKey: string }; twilio?: { sid: string; token: string; from: string } }) => {
    if (data.resend) store.set('resend', data.resend)
    if (data.twilio) store.set('twilio', data.twilio)
  })

  ipcMain.handle('party:getCredentials', () => {
    const resend = store.get('resend')
    const twilio = store.get('twilio')
    return {
      resend: resend ? { apiKey: '•'.repeat(Math.max(0, resend.apiKey.length - 4)) + resend.apiKey.slice(-4) } : null,
      twilio: twilio ? { sid: twilio.sid, token: '•'.repeat(Math.max(0, twilio.token.length - 4)) + twilio.token.slice(-4), from: twilio.from } : null,
    }
  })
}

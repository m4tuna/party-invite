import { contextBridge, ipcRenderer } from 'electron'

const api = {
  getAuth: () => ipcRenderer.invoke('party:getAuth'),
  logout: () => ipcRenderer.invoke('party:logout'),
  login: () => ipcRenderer.send('party:login'),
  saveAuth: (auth: { idToken: string; accessToken: string; user: unknown }) =>
    ipcRenderer.invoke('party:saveAuth', auth),
  createParty: (data: { name: string; date?: string; location?: string; description?: string }) =>
    ipcRenderer.invoke('party:createParty', data),
  listParties: () => ipcRenderer.invoke('party:listParties'),
  getParty: (id: string) => ipcRenderer.invoke('party:getParty', id),
  setCurrentParty: (id: string) => ipcRenderer.invoke('party:setCurrentParty', id),
  addGuest: (data: { partyId: string; name: string; email?: string; phone?: string }) =>
    ipcRenderer.invoke('party:addGuest', data),
  removeGuest: (id: string) => ipcRenderer.invoke('party:removeGuest', id),
  importAppleContacts: () => ipcRenderer.invoke('party:importAppleContacts'),
  importGmailContacts: (token: string) => ipcRenderer.invoke('party:importGmailContacts', token),
  sendInvites: (data: { guestIds: string[]; via: string[] }) =>
    ipcRenderer.invoke('party:sendInvites', data),
  saveCredentials: (data: { resend?: { apiKey: string }; twilio?: { sid: string; token: string; from: string } }) =>
    ipcRenderer.invoke('party:saveCredentials', data),
  getCredentials: () => ipcRenderer.invoke('party:getCredentials'),
  onGuestUpdated: (cb: (guest: unknown) => void) => {
    const h = (_: unknown, g: unknown) => cb(g)
    ipcRenderer.on('party:guestUpdated', h)
    return () => ipcRenderer.off('party:guestUpdated', h)
  },
  onAuth0Tokens: (cb: (data: { idToken: string; accessToken: string; user: unknown }) => void) => {
    const h = (_: unknown, data: unknown) => cb(data as any)
    ipcRenderer.on('auth0:tokens', h)
    return () => ipcRenderer.off('auth0:tokens', h)
  },
}

contextBridge.exposeInMainWorld('api', api)

import { useState } from 'react'
import { usePartyStore } from '../store/partyStore'
import PartiesView from './PartiesView'
import GuestListView from './GuestListView'
import SendInvitesView from './SendInvitesView'
import DashboardView from './DashboardView'
import SettingsView from './SettingsView'

const TABS = [
  { id: 'parties', label: 'Parties', icon: '🎊' },
  { id: 'guests', label: 'Guests', icon: '👥' },
  { id: 'invites', label: 'Invites', icon: '📨' },
  { id: 'dashboard', label: 'RSVP', icon: '📊' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

export default function HomeView() {
  const [activeTab, setActiveTab] = useState('parties')
  const { currentParty, auth } = usePartyStore()

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'rgba(18,18,20,0.92)', backdropFilter: 'blur(28px) saturate(180%)' }}>
      {/* Drag region + header */}
      <div style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', WebkitAppRegion: 'drag' as any, borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <span style={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>
          {currentParty ? currentParty.name : 'Party Invite'}
        </span>
        {auth?.user && (
          <button
            onClick={() => window.api.logout().then(() => usePartyStore.getState().setAuth(null))}
            style={{ WebkitAppRegion: 'no-drag' as any, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '12px' }}
          >
            Sign out
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'parties' && <PartiesView onPartySelect={() => setActiveTab('guests')} />}
        {activeTab === 'guests' && <GuestListView />}
        {activeTab === 'invites' && <SendInvitesView />}
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'settings' && <SettingsView />}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, WebkitAppRegion: 'no-drag' as any }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              padding: '10px 4px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            <span style={{ fontSize: '18px' }}>{tab.icon}</span>
            <span style={{ fontSize: '9px', color: activeTab === tab.id ? '#ff6b35' : 'rgba(255,255,255,0.3)', fontWeight: activeTab === tab.id ? 600 : 400 }}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

import { useEffect } from 'react'
import { usePartyStore } from '../store/partyStore'
import type { Party } from '../types'

interface Props {
  onClose: () => void
  onSelect: (party: Party) => void
  onNewParty: () => void
}

export default function MyPartiesModal({ onClose, onSelect, onNewParty }: Props) {
  const { parties, currentParty, setParties, setCurrentParty, setGuests } = usePartyStore()

  useEffect(() => {
    window.api.listParties().then(setParties)
  }, [])

  async function handleSelect(party: Party) {
    setCurrentParty(party)
    await window.api.setCurrentParty(party.id)
    const { guests } = await window.api.getParty(party.id)
    setGuests(guests)
    onSelect(party)
    onClose()
  }

  function handleNewParty() {
    onNewParty()
    onClose()
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '20px 20px 0 0', padding: '24px', maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
        {/* Handle */}
        <div style={{ width: '36px', height: '4px', background: '#333', borderRadius: '2px', margin: '0 auto 20px', flexShrink: 0 }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexShrink: 0 }}>
          <h2 style={{ color: 'white', fontSize: '16px', fontWeight: 700, margin: 0 }}>My Parties</h2>
          <button onClick={onClose} style={{ background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#999', cursor: 'pointer', fontSize: '13px', padding: '4px 10px' }}>Done</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {parties.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px', color: '#555', fontSize: '13px' }}>No parties yet.</div>
          )}
          {parties.map(party => (
            <button
              key={party.id}
              onClick={() => handleSelect(party)}
              style={{
                background: currentParty?.id === party.id ? 'rgba(255,107,53,0.12)' : '#111',
                border: `1px solid ${currentParty?.id === party.id ? 'rgba(255,107,53,0.4)' : '#2a2a2a'}`,
                borderRadius: '12px',
                padding: '12px 16px',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span style={{ fontSize: '24px' }}>{party.emoji || '🎉'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'white', fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{party.name}</div>
                {party.date && (
                  <div style={{ color: '#666', fontSize: '11px', marginTop: '2px' }}>
                    {new Date(party.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                )}
              </div>
              {currentParty?.id === party.id && (
                <span style={{ fontSize: '11px', color: '#ff6b35', fontWeight: 600 }}>Active</span>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={handleNewParty}
          style={{ width: '100%', background: '#ff6b35', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
        >
          + New Party
        </button>
      </div>
    </div>
  )
}

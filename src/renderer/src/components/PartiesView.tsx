import { useState, useEffect } from 'react'
import { usePartyStore } from '../store/partyStore'
import type { Party } from '../types'

interface Props {
  onPartySelect: () => void
}

export default function PartiesView({ onPartySelect }: Props) {
  const { parties, currentParty, setParties, setCurrentParty, setGuests } = usePartyStore()
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', date: '', location: '', description: '' })

  useEffect(() => {
    window.api.listParties().then(setParties)
  }, [])

  async function handleSelectParty(party: Party) {
    setCurrentParty(party)
    await window.api.setCurrentParty(party.id)
    const { guests } = await window.api.getParty(party.id)
    setGuests(guests)
    onPartySelect()
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    try {
      const party = await window.api.createParty({
        name: form.name.trim(),
        date: form.date || undefined,
        location: form.location || undefined,
        description: form.description || undefined,
      })
      setParties([party, ...parties])
      setForm({ name: '', date: '', location: '', description: '' })
      setShowCreate(false)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '13px',
    padding: '8px 12px',
    outline: 'none',
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ color: 'white', fontSize: '16px', fontWeight: 600, margin: 0 }}>Your Parties</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          style={{ background: '#ff6b35', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
        >
          + New Party
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            placeholder="Party name *"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            style={inputStyle}
            required
          />
          <input
            type="datetime-local"
            placeholder="Date & time"
            value={form.date}
            onChange={e => setForm({ ...form, date: e.target.value })}
            style={inputStyle}
          />
          <input
            placeholder="Location"
            value={form.location}
            onChange={e => setForm({ ...form, location: e.target.value })}
            style={inputStyle}
          />
          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            rows={2}
            style={{ ...inputStyle, resize: 'none' }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" disabled={loading} style={{ flex: 1, background: '#ff6b35', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Creating…' : 'Create Party'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: 'none', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {parties.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.3)' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎊</div>
          <p style={{ fontSize: '14px' }}>No parties yet. Create your first!</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {parties.map(party => (
          <button
            key={party.id}
            onClick={() => handleSelectParty(party)}
            style={{
              width: '100%',
              background: currentParty?.id === party.id ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${currentParty?.id === party.id ? 'rgba(255,107,53,0.4)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '12px',
              padding: '14px 16px',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <span style={{ color: 'white', fontSize: '14px', fontWeight: 600 }}>{party.name}</span>
            {party.date && (
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                {new Date(party.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            )}
            {party.location && (
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>📍 {party.location}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

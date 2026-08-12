import { useState } from 'react'
import { usePartyStore } from '../store/partyStore'
import ContactsImportModal from './ContactsImportModal'

interface Props {
  onContinue: () => void
  onBack: () => void
  accent: string
}

const INPUT: React.CSSProperties = {
  background: '#111',
  border: '1px solid #333',
  borderRadius: '10px',
  color: 'white',
  fontSize: '13px',
  padding: '10px 14px',
  outline: 'none',
  flex: 1,
}

export default function GuestsStep({ onContinue, onBack, accent }: Props) {
  const { currentParty, guests, setGuests, removeGuest: removeFromStore } = usePartyStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [adding, setAdding] = useState(false)

  if (!currentParty) return null

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !currentParty) return
    setAdding(true)
    try {
      const guest = await window.api.addGuest({
        partyId: currentParty.id,
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
      })
      setGuests([...guests, guest])
      setForm({ name: '', email: '', phone: '' })
      setShowAddForm(false)
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(id: string) {
    await window.api.removeGuest(id)
    removeFromStore(id)
  }

  async function handleImported() {
    if (!currentParty) return
    const { guests: fresh } = await window.api.getParty(currentParty.id)
    setGuests(fresh)
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header row */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ color: '#999', fontSize: '13px' }}>
          <span style={{ color: 'white', fontWeight: 600 }}>{guests.length}</span> {guests.length === 1 ? 'guest' : 'guests'} added
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowImportModal(true)}
            style={{ background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#ccc', cursor: 'pointer', fontSize: '12px', padding: '6px 12px', fontWeight: 500 }}
          >
            Import Contacts
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{ background: accent, border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '12px', padding: '6px 12px', fontWeight: 600 }}
          >
            + Add Guest
          </button>
        </div>
      </div>

      {/* Inline add form */}
      {showAddForm && (
        <form
          onSubmit={handleAdd}
          style={{ padding: '12px 16px', background: '#111', borderBottom: '1px solid #1f1f1f', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}
        >
          <input
            placeholder="Name *"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            style={{ ...INPUT, flex: 'none', width: '100%', boxSizing: 'border-box' }}
            required
            autoFocus
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              style={INPUT}
            />
            <input
              placeholder="Phone"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              style={INPUT}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="submit"
              disabled={adding}
              style={{ flex: 1, background: accent, color: 'white', border: 'none', borderRadius: '10px', padding: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: adding ? 0.6 : 1 }}
            >
              {adding ? 'Adding…' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              style={{ background: '#222', color: '#999', border: '1px solid #333', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Guest list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {guests.length === 0 && !showAddForm && (
          <div style={{ textAlign: 'center', padding: '48px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '40px' }}>👥</span>
            <p style={{ color: '#555', fontSize: '13px', margin: 0 }}>No guests yet — add some!</p>
          </div>
        )}
        {guests.map(guest => (
          <div
            key={guest.id}
            style={{ padding: '12px 16px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'white', fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{guest.name}</div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                {guest.email && (
                  <span style={{ fontSize: '11px', background: '#1f1f1f', color: '#777', borderRadius: '6px', padding: '2px 8px', border: '1px solid #2a2a2a' }}>
                    {guest.email}
                  </span>
                )}
                {guest.phone && (
                  <span style={{ fontSize: '11px', background: '#1f1f1f', color: '#777', borderRadius: '6px', padding: '2px 8px', border: '1px solid #2a2a2a' }}>
                    {guest.phone}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => handleRemove(guest.id)}
              style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: '18px', padding: '2px 4px', lineHeight: 1, flexShrink: 0 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={e => (e.currentTarget.style.color = '#333')}
              title="Remove"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Bottom buttons */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #1f1f1f', display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={onBack}
          style={{ background: '#222', color: '#999', border: '1px solid #333', borderRadius: '10px', padding: '12px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
        >
          ← Back
        </button>
        <button
          onClick={onContinue}
          disabled={guests.length === 0}
          style={{ flex: 1, background: guests.length > 0 ? accent : '#222', color: guests.length > 0 ? 'white' : '#555', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: guests.length > 0 ? 'pointer' : 'not-allowed' }}
        >
          Continue →
        </button>
      </div>

      {showImportModal && (
        <ContactsImportModal
          partyId={currentParty.id}
          onClose={() => setShowImportModal(false)}
          onAdded={handleImported}
        />
      )}
    </div>
  )
}

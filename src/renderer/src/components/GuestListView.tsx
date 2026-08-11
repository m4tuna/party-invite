import { useState } from 'react'
import { usePartyStore } from '../store/partyStore'
import ContactsImportModal from './ContactsImportModal'

const RSVP_COLORS: Record<string, string> = {
  pending: 'rgba(255,255,255,0.3)',
  attending: '#22c55e',
  declined: '#ef4444',
}

const RSVP_LABELS: Record<string, string> = {
  pending: 'Pending',
  attending: 'Attending',
  declined: 'Declined',
}

export default function GuestListView() {
  const { currentParty, guests, setGuests, removeGuest: removeGuestFromStore } = usePartyStore()
  const [showImportModal, setShowImportModal] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [adding, setAdding] = useState(false)

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '13px',
    padding: '8px 12px',
    outline: 'none',
    flex: 1,
  }

  if (!currentParty) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '40px' }}>🎊</div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Select a party first</p>
      </div>
    )
  }

  async function handleAddGuest(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setAdding(true)
    try {
      const guest = await window.api.addGuest({
        partyId: currentParty.id,
        name: form.name.trim(),
        email: form.email || undefined,
        phone: form.phone || undefined,
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
    removeGuestFromStore(id)
  }

  async function handleImported() {
    const { guests: fresh } = await window.api.getParty(currentParty.id)
    setGuests(fresh)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{ flex: 1, background: '#ff6b35', color: 'white', border: 'none', borderRadius: '8px', padding: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
        >
          + Add Guest
        </button>
        <button
          onClick={() => setShowImportModal(true)}
          style={{ flex: 1, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '8px', padding: '8px', fontSize: '12px', cursor: 'pointer' }}
        >
          Import Contacts
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddGuest} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
          <input placeholder="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ ...inputStyle, flex: 'none', width: '100%' }} required />
          <div style={{ display: 'flex', gap: '8px' }}>
            <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} type="email" />
            <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" disabled={adding} style={{ flex: 1, background: '#ff6b35', color: 'white', border: 'none', borderRadius: '8px', padding: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              {adding ? 'Adding…' : 'Add'}
            </button>
            <button type="button" onClick={() => setShowAddForm(false)} style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Summary */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{guests.length} guests</span>
      </div>

      {/* Guest list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {guests.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>👥</div>
            <p style={{ fontSize: '13px' }}>No guests yet. Add some!</p>
          </div>
        )}
        {guests.map(guest => (
          <div key={guest.id} style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'white', fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{guest.name}</div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                {guest.email && (
                  <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', borderRadius: '4px', padding: '2px 6px' }}>
                    {guest.email}
                  </span>
                )}
                {guest.phone && (
                  <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', borderRadius: '4px', padding: '2px 6px' }}>
                    {guest.phone}
                  </span>
                )}
              </div>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 600, color: RSVP_COLORS[guest.rsvp_status] || 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '3px 8px' }}>
              {RSVP_LABELS[guest.rsvp_status] || guest.rsvp_status}
            </span>
            <button
              onClick={() => handleRemove(guest.id)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,100,100,0.5)', cursor: 'pointer', fontSize: '16px', padding: '2px 4px', lineHeight: 1 }}
              title="Remove guest"
            >
              ×
            </button>
          </div>
        ))}
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

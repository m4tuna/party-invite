import { useState, useEffect } from 'react'
import type { RawContact } from '../types'

interface Props {
  partyId: string
  onClose: () => void
  onAdded: () => void
}

export default function ContactsImportModal({ partyId, onClose, onAdded }: Props) {
  const [contacts, setContacts] = useState<RawContact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    window.api.importAppleContacts()
      .then(c => {
        setContacts(c.filter(ct => ct.name && (ct.emails.length > 0 || ct.phones.length > 0)))
        setLoading(false)
      })
      .catch(e => {
        setError(e.message || 'Failed to import contacts')
        setLoading(false)
      })
  }, [])

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.emails.some(e => e.toLowerCase().includes(search.toLowerCase()))
  )

  function toggleSelect(i: number) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((_, i) => i)))
    }
  }

  async function handleAdd() {
    setAdding(true)
    const toAdd = filtered.filter((_, i) => selected.has(i))
    for (const contact of toAdd) {
      await window.api.addGuest({
        partyId,
        name: contact.name,
        email: contact.emails[0] || undefined,
        phone: contact.phones[0] || undefined,
      })
    }
    setAdding(false)
    onAdded()
    onClose()
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: '380px', maxHeight: '520px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>Import Contacts</span>
          <button onClick={onClose} style={{ background: '#222', border: '1px solid #333', borderRadius: '6px', color: '#999', cursor: 'pointer', fontSize: '14px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {loading && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '14px' }}>
            Loading contacts…
          </div>
        )}

        {error && (
          <div style={{ flex: 1, padding: '24px', textAlign: 'center' }}>
            <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '8px' }}>{error}</div>
            <div style={{ color: '#555', fontSize: '12px' }}>Make sure Party Invite has Contacts permission in System Settings.</div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Search */}
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #222', flexShrink: 0 }}>
              <input
                placeholder="Search contacts…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: '8px', color: 'white', fontSize: '13px', padding: '8px 12px', outline: 'none', boxSizing: 'border-box' }}
                autoFocus
              />
            </div>

            {/* Select all row */}
            <div
              style={{ padding: '8px 14px', borderBottom: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flexShrink: 0 }}
              onClick={toggleAll}
            >
              <div style={{ width: '14px', height: '14px', borderRadius: '3px', border: '1.5px solid #444', background: selected.size === filtered.length && filtered.length > 0 ? '#ff6b35' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {selected.size === filtered.length && filtered.length > 0 && <span style={{ color: 'white', fontSize: '9px', fontWeight: 700 }}>✓</span>}
              </div>
              <span style={{ color: '#666', fontSize: '12px' }}>{filtered.length} contacts</span>
              {selected.size > 0 && (
                <span style={{ color: '#ff6b35', fontSize: '12px', fontWeight: 600 }}>{selected.size} selected</span>
              )}
            </div>

            {/* Contact list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filtered.map((contact, i) => (
                <div
                  key={i}
                  onClick={() => toggleSelect(i)}
                  style={{ padding: '9px 14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderBottom: '1px solid #1a1a1a', background: selected.has(i) ? 'rgba(255,107,53,0.06)' : 'transparent' }}
                >
                  <div style={{ width: '14px', height: '14px', borderRadius: '3px', border: `1.5px solid ${selected.has(i) ? '#ff6b35' : '#333'}`, background: selected.has(i) ? '#ff6b35' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {selected.has(i) && <span style={{ color: 'white', fontSize: '9px', fontWeight: 700 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'white', fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.name}</div>
                    <div style={{ color: '#555', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {contact.emails[0] || contact.phones[0] || ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add button */}
            <div style={{ padding: '12px', borderTop: '1px solid #2a2a2a', flexShrink: 0 }}>
              <button
                onClick={handleAdd}
                disabled={selected.size === 0 || adding}
                style={{ width: '100%', background: selected.size > 0 ? '#ff6b35' : '#222', color: selected.size > 0 ? 'white' : '#555', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 600, cursor: selected.size > 0 ? 'pointer' : 'not-allowed', opacity: adding ? 0.6 : 1 }}
              >
                {adding ? 'Adding…' : `Add ${selected.size > 0 ? selected.size + ' ' : ''}Selected`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

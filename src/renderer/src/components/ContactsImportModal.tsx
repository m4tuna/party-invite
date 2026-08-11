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
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div style={{
        width: '380px', maxHeight: '520px', background: 'rgba(24,24,28,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>Import Contacts</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '18px' }}>×</button>
        </div>

        {loading && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
            Importing from Contacts…
          </div>
        )}

        {error && (
          <div style={{ flex: 1, padding: '24px', textAlign: 'center', color: 'rgba(255,100,100,0.8)', fontSize: '13px' }}>
            {error}
            <br />
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>Make sure Party Invite has Contacts permission in System Settings.</span>
          </div>
        )}

        {!loading && !error && (
          <>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <input
                placeholder="Search contacts…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '13px', padding: '8px 12px', outline: 'none' }}
              />
            </div>

            <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{filtered.length} contacts</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filtered.map((contact, i) => (
                <div
                  key={i}
                  onClick={() => toggleSelect(i)}
                  style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', background: selected.has(i) ? 'rgba(255,107,53,0.1)' : 'transparent' }}
                >
                  <input type="checkbox" checked={selected.has(i)} onChange={() => toggleSelect(i)} onClick={e => e.stopPropagation()} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'white', fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {contact.emails[0] || contact.phones[0] || ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                onClick={handleAdd}
                disabled={selected.size === 0 || adding}
                style={{ width: '100%', background: selected.size > 0 ? '#ff6b35' : 'rgba(255,255,255,0.08)', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 600, cursor: selected.size > 0 ? 'pointer' : 'not-allowed', opacity: adding ? 0.6 : 1 }}
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

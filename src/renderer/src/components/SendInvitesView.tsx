import { useState, useEffect } from 'react'
import { usePartyStore } from '../store/partyStore'

type Via = 'email' | 'sms'

interface SendResult {
  sent: string[]
  failed: Array<{ id: string; error: string }>
}

export default function SendInvitesView() {
  const { currentParty, guests } = usePartyStore()
  const [creds, setCreds] = useState<{ resend: { apiKey: string } | null; twilio: any | null } | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [via, setVia] = useState<Set<Via>>(new Set(['email']))
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<SendResult | null>(null)

  useEffect(() => {
    window.api.getCredentials().then(setCreds)
  }, [])

  if (!currentParty) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '40px' }}>📨</div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Select a party first</p>
      </div>
    )
  }

  const missingCreds = !creds?.resend && !creds?.twilio

  function toggleGuest(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === guests.length) setSelected(new Set())
    else setSelected(new Set(guests.map(g => g.id)))
  }

  function toggleVia(v: Via) {
    setVia(prev => {
      const next = new Set(prev)
      if (next.has(v)) next.delete(v)
      else next.add(v)
      return next
    })
  }

  async function handleSend() {
    setSending(true)
    setResult(null)
    try {
      const r = await window.api.sendInvites({ guestIds: Array.from(selected), via: Array.from(via) })
      setResult(r)
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {missingCreds && (
        <div style={{ margin: '12px 16px', background: 'rgba(255,180,0,0.1)', border: '1px solid rgba(255,180,0,0.3)', borderRadius: '10px', padding: '12px', fontSize: '12px', color: 'rgba(255,200,0,0.8)' }}>
          Add Resend or Twilio credentials in Settings before sending invites.
        </div>
      )}

      {/* Via toggle */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ marginBottom: '8px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Send via</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['email', 'sms'] as Via[]).map(v => (
            <button
              key={v}
              onClick={() => toggleVia(v)}
              style={{ padding: '6px 16px', borderRadius: '20px', border: `1px solid ${via.has(v) ? '#ff6b35' : 'rgba(255,255,255,0.12)'}`, background: via.has(v) ? 'rgba(255,107,53,0.2)' : 'transparent', color: via.has(v) ? '#ff6b35' : 'rgba(255,255,255,0.5)', fontSize: '12px', cursor: 'pointer', fontWeight: via.has(v) ? 600 : 400 }}
            >
              {v === 'email' ? '📧 Email' : '📱 SMS'}
            </button>
          ))}
        </div>
      </div>

      {/* Select all */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <input type="checkbox" checked={selected.size === guests.length && guests.length > 0} onChange={toggleAll} />
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{selected.size} / {guests.length} selected</span>
      </div>

      {/* Guest list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {guests.map(guest => {
          const sentResult = result?.sent.includes(guest.id)
          const failResult = result?.failed.find(f => f.id === guest.id)
          return (
            <div key={guest.id} onClick={() => toggleGuest(guest.id)} style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: selected.has(guest.id) ? 'rgba(255,107,53,0.06)' : 'transparent' }}>
              <input type="checkbox" checked={selected.has(guest.id)} onChange={() => toggleGuest(guest.id)} onClick={e => e.stopPropagation()} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'white', fontSize: '13px', fontWeight: 500 }}>{guest.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
                  {[guest.email, guest.phone].filter(Boolean).join(' · ')}
                </div>
              </div>
              {sentResult && <span style={{ fontSize: '10px', color: '#22c55e', fontWeight: 600 }}>Sent ✓</span>}
              {failResult && <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 600 }}>Failed</span>}
              {guest.invite_sent_at && !sentResult && !failResult && (
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>Sent</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Send button */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <button
          onClick={handleSend}
          disabled={selected.size === 0 || via.size === 0 || sending || missingCreds}
          style={{ width: '100%', background: selected.size > 0 && !missingCreds ? '#ff6b35' : 'rgba(255,255,255,0.08)', color: 'white', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '14px', fontWeight: 600, cursor: selected.size > 0 && !missingCreds ? 'pointer' : 'not-allowed', opacity: sending ? 0.6 : 1 }}
        >
          {sending ? 'Sending…' : `Send Invites (${selected.size})`}
        </button>
        {result && (
          <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
            {result.sent.length} sent, {result.failed.length} failed
          </p>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { usePartyStore } from '../store/partyStore'

interface Props {
  onContinue: () => void
  onBack: () => void
  accent: string
  onOpenSettings: () => void
}

type Via = 'email' | 'sms'

interface SendResult {
  sent: string[]
  failed: Array<{ id: string; error: string }>
}

export default function SendStep({ onContinue, onBack, accent, onOpenSettings }: Props) {
  const { currentParty, guests } = usePartyStore()
  const [creds, setCreds] = useState<{ resend: { apiKey: string } | null; twilio: any | null } | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set(guests.map(g => g.id)))
  const [via, setVia] = useState<Via>('email')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<SendResult | null>(null)

  useEffect(() => {
    window.api.getCredentials().then(setCreds)
  }, [])

  if (!currentParty) return null

  const missingCreds = !creds?.resend && !creds?.twilio

  function toggleGuest(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() { setSelected(new Set(guests.map(g => g.id))) }
  function deselectAll() { setSelected(new Set()) }

  async function handleSend() {
    setSending(true)
    setResult(null)
    try {
      const r = await window.api.sendInvites({ guestIds: Array.from(selected), via: [via] })
      setResult(r)
    } finally {
      setSending(false)
    }
  }

  const party = currentParty
  const emoji = party.emoji || '🎉'
  const dateStr = party.date
    ? new Date(party.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : null

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Mini preview */}
        <div style={{ margin: '12px 16px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ background: `linear-gradient(135deg, ${accent}, ${accent}bb)`, padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>{emoji}</span>
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: '15px' }}>{party.name}</div>
              {dateStr && <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px' }}>{dateStr}</div>}
              {party.location && <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>📍 {party.location}</div>}
            </div>
          </div>
        </div>

        {/* Credentials warning */}
        {missingCreds && (
          <div style={{ margin: '0 16px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '16px' }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 600 }}>No sending credentials</div>
              <div style={{ color: '#a16207', fontSize: '11px', marginTop: '2px' }}>Add your Resend API key to send emails</div>
            </div>
            <button
              onClick={onOpenSettings}
              style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', color: '#f59e0b', cursor: 'pointer', fontSize: '12px', padding: '4px 10px', whiteSpace: 'nowrap' }}
            >
              ⚙️ Settings
            </button>
          </div>
        )}

        {/* Via toggle */}
        <div style={{ padding: '0 16px 12px' }}>
          <label style={{ display: 'block', color: '#666', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Send via</label>
          <div style={{ display: 'flex', background: '#111', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '3px', gap: '2px' }}>
            {(['email', 'sms'] as Via[]).map(v => (
              <button
                key={v}
                onClick={() => setVia(v)}
                style={{
                  flex: 1,
                  padding: '7px',
                  borderRadius: '8px',
                  border: 'none',
                  background: via === v ? accent : 'transparent',
                  color: via === v ? 'white' : '#666',
                  fontSize: '13px',
                  fontWeight: via === v ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.1s',
                }}
              >
                {v === 'email' ? 'Email' : 'SMS'}
              </button>
            ))}
          </div>
        </div>

        {/* Select all / deselect all */}
        <div style={{ padding: '0 16px 8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#666', fontSize: '12px' }}>{selected.size} of {guests.length} selected</span>
          <button onClick={selectAll} style={{ background: 'none', border: 'none', color: accent, cursor: 'pointer', fontSize: '12px', padding: 0, fontWeight: 500 }}>Select All</button>
          <button onClick={deselectAll} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '12px', padding: 0 }}>Deselect All</button>
        </div>

        {/* Guest checklist */}
        <div style={{ margin: '0 16px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', overflow: 'hidden' }}>
          {guests.map((guest, i) => {
            const sentResult = result?.sent.includes(guest.id)
            const failResult = result?.failed.find(f => f.id === guest.id)
            return (
              <div
                key={guest.id}
                onClick={() => toggleGuest(guest.id)}
                style={{
                  padding: '10px 14px',
                  borderBottom: i < guests.length - 1 ? '1px solid #222' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  background: selected.has(guest.id) ? 'rgba(255,107,53,0.04)' : 'transparent',
                }}
              >
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    border: `1.5px solid ${selected.has(guest.id) ? accent : '#444'}`,
                    background: selected.has(guest.id) ? accent : 'transparent',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selected.has(guest.id) && <span style={{ color: 'white', fontSize: '10px', fontWeight: 700 }}>✓</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'white', fontSize: '13px', fontWeight: 500 }}>{guest.name}</div>
                  <div style={{ color: '#555', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {[guest.email, guest.phone].filter(Boolean).join(' · ')}
                  </div>
                </div>
                {sentResult && <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: 600, flexShrink: 0 }}>✓ Sent</span>}
                {failResult && <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600, flexShrink: 0 }}>✗ Failed</span>}
                {guest.invite_sent_at && !sentResult && !failResult && (
                  <span style={{ fontSize: '11px', color: '#444', flexShrink: 0 }}>Sent</span>
                )}
              </div>
            )
          })}
        </div>

        {result && (
          <div style={{ margin: '12px 16px 0', textAlign: 'center' }}>
            <span style={{ fontSize: '13px', color: '#999' }}>
              {result.sent.length} sent{result.failed.length > 0 ? `, ${result.failed.length} failed` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Bottom buttons */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #1f1f1f', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={handleSend}
          disabled={selected.size === 0 || sending || missingCreds}
          style={{
            width: '100%',
            background: selected.size > 0 && !missingCreds ? accent : '#222',
            color: selected.size > 0 && !missingCreds ? 'white' : '#555',
            border: 'none',
            borderRadius: '10px',
            padding: '13px 24px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: selected.size > 0 && !missingCreds ? 'pointer' : 'not-allowed',
            opacity: sending ? 0.7 : 1,
          }}
        >
          {sending ? 'Sending…' : `Send to ${selected.size} guest${selected.size !== 1 ? 's' : ''}`}
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onBack}
            style={{ background: '#222', color: '#999', border: '1px solid #333', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            ← Back
          </button>
          <button
            onClick={onContinue}
            style={{ flex: 1, background: '#222', color: '#ccc', border: '1px solid #333', borderRadius: '10px', padding: '10px 24px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            View Dashboard →
          </button>
        </div>
      </div>
    </div>
  )
}

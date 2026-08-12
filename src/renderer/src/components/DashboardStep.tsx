import { usePartyStore } from '../store/partyStore'

interface Props {
  onNewParty: () => void
  accent: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function DashboardStep({ onNewParty, accent }: Props) {
  const { currentParty, guests } = usePartyStore()

  if (!currentParty) return null

  const attending = guests.filter(g => g.rsvp_status === 'attending')
  const declined = guests.filter(g => g.rsvp_status === 'declined')
  const pending = guests.filter(g => g.rsvp_status === 'pending')

  const sorted = [
    ...attending,
    ...pending,
    ...declined,
  ]

  async function copySummary() {
    const attendingNames = attending.map(g => g.name).join(', ')
    const declinedNames = declined.map(g => g.name).join(', ')
    const pendingNames = pending.map(g => g.name).join(', ')
    const lines = [
      `Party: ${currentParty!.name}`,
      `✅ Attending (${attending.length}): ${attendingNames || 'none'}`,
      `❌ Declined (${declined.length}): ${declinedNames || 'none'}`,
      `⏳ Pending (${pending.length}): ${pendingNames || 'none'}`,
    ]
    await navigator.clipboard.writeText(lines.join('\n'))
  }

  const RSVP_BADGE: Record<string, { bg: string; color: string; label: string }> = {
    attending: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e', label: '✓ Attending' },
    declined: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: '✗ Declined' },
    pending: { bg: '#1f1f1f', color: '#666', label: 'Pending' },
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Stats bar */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1f1f1f', display: 'flex', gap: '8px', flexShrink: 0 }}>
        {[
          { label: 'Attending', count: attending.length, bg: 'rgba(34,197,94,0.1)', color: '#22c55e', border: 'rgba(34,197,94,0.2)' },
          { label: 'Declined', count: declined.length, bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.2)' },
          { label: 'Pending', count: pending.length, bg: '#111', color: '#666', border: '#2a2a2a' },
        ].map(s => (
          <div
            key={s.label}
            style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: '10px', padding: '10px 8px', textAlign: 'center' }}
          >
            <div style={{ fontSize: '22px', fontWeight: 700, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: '10px', color: s.color, opacity: 0.8, marginTop: '1px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Copy summary */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #1f1f1f', flexShrink: 0 }}>
        <button
          onClick={copySummary}
          style={{ width: '100%', background: '#1a1a1a', color: '#999', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}
        >
          Copy Summary
        </button>
      </div>

      {/* Guest list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {guests.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#444', fontSize: '13px' }}>No guests yet.</div>
        )}
        {sorted.map(guest => {
          const badge = RSVP_BADGE[guest.rsvp_status] || RSVP_BADGE.pending
          return (
            <div
              key={guest.id}
              style={{ padding: '11px 16px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'white', fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{guest.name}</div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                  {guest.email && (
                    <span style={{ fontSize: '10px', background: '#1f1f1f', color: '#666', borderRadius: '5px', padding: '1px 6px' }}>{guest.email}</span>
                  )}
                  {guest.phone && (
                    <span style={{ fontSize: '10px', background: '#1f1f1f', color: '#666', borderRadius: '5px', padding: '1px 6px' }}>{guest.phone}</span>
                  )}
                  {guest.rsvp_at && (
                    <span style={{ fontSize: '10px', color: '#444' }}>{timeAgo(guest.rsvp_at)}</span>
                  )}
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: badge.color, background: badge.bg, borderRadius: '6px', padding: '3px 8px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {badge.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* New Party button */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #1f1f1f', flexShrink: 0 }}>
        <button
          onClick={onNewParty}
          style={{ width: '100%', background: accent, color: 'white', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
        >
          + New Party
        </button>
      </div>
    </div>
  )
}

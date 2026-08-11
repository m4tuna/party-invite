import { usePartyStore } from '../store/partyStore'

const RSVP_COLORS: Record<string, string> = {
  pending: 'rgba(255,255,255,0.4)',
  attending: '#22c55e',
  declined: '#ef4444',
}

export default function DashboardView() {
  const { currentParty, guests } = usePartyStore()

  if (!currentParty) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '40px' }}>📊</div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Select a party first</p>
      </div>
    )
  }

  const attending = guests.filter(g => g.rsvp_status === 'attending').length
  const declined = guests.filter(g => g.rsvp_status === 'declined').length
  const pending = guests.filter(g => g.rsvp_status === 'pending').length

  const sorted = [...guests].sort((a, b) => {
    const order = { attending: 0, declined: 1, pending: 2 }
    return (order[a.rsvp_status] ?? 2) - (order[b.rsvp_status] ?? 2)
  })

  async function copySummary() {
    const lines = [
      `${currentParty.name} — RSVP Summary`,
      `Attending: ${attending}  |  Declined: ${declined}  |  Pending: ${pending}`,
      '',
      ...sorted.map(g => `${g.name}: ${g.rsvp_status}`),
    ]
    await navigator.clipboard.writeText(lines.join('\n'))
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Stats */}
      <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          {[
            { label: 'Attending', count: attending, color: '#22c55e' },
            { label: 'Declined', count: declined, color: '#ef4444' },
            { label: 'Pending', count: pending, color: 'rgba(255,255,255,0.4)' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <button
          onClick={copySummary}
          style={{ width: '100%', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px', fontSize: '12px', cursor: 'pointer' }}
        >
          Copy Summary
        </button>
      </div>

      {/* Guest list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {guests.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
            No guests yet.
          </div>
        )}
        {sorted.map(guest => (
          <div key={guest.id} style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'white', fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{guest.name}</div>
              {guest.rsvp_at && (
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
                  Responded {new Date(guest.rsvp_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              )}
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: RSVP_COLORS[guest.rsvp_status] || 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '3px 8px', whiteSpace: 'nowrap' }}>
              {guest.rsvp_status === 'attending' ? '✓ Attending' : guest.rsvp_status === 'declined' ? '✗ Declined' : 'Pending'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

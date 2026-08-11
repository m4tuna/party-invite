import { notFound } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'

export default async function RsvpPage({
  params,
  searchParams,
}: {
  params: { partyId: string; token: string }
  searchParams: { r?: string }
}) {
  const { partyId, token } = params

  const { data: guest } = await supabase
    .from('party_invite_guests')
    .select('*, party_invite_parties(*)')
    .eq('party_id', partyId)
    .eq('guest_token', token)
    .single()

  if (!guest) notFound()

  const party = guest.party_invite_parties as any
  let rsvpStatus = guest.rsvp_status as string

  if (searchParams.r === 'attending' || searchParams.r === 'declined') {
    rsvpStatus = searchParams.r
    await supabase
      .from('party_invite_guests')
      .update({ rsvp_status: rsvpStatus, rsvp_at: new Date().toISOString() })
      .eq('id', guest.id)
  }

  const dateStr = party.date
    ? new Date(party.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : null

  const responded = rsvpStatus !== 'pending'
  const attending = rsvpStatus === 'attending'

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: '480px', width: '100%', background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 8px 48px rgba(0,0,0,0.12)' }}>
        <div style={{ background: 'linear-gradient(135deg,#ff6b35,#ff4757)', padding: '48px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px' }}>{responded ? (attending ? '🎉' : '😢') : '🎉'}</div>
          <h1 style={{ color: 'white', margin: '16px 0 0', fontSize: '28px', fontWeight: 700 }}>{party.name}</h1>
          {dateStr && <p style={{ color: 'rgba(255,255,255,0.85)', margin: '8px 0 0', fontSize: '16px' }}>{dateStr}</p>}
          {party.location && <p style={{ color: 'rgba(255,255,255,0.85)', margin: '4px 0 0', fontSize: '14px' }}>📍 {party.location}</p>}
        </div>
        <div style={{ padding: '40px' }}>
          {responded ? (
            <>
              <p style={{ textAlign: 'center', fontSize: '20px', fontWeight: 600, color: attending ? '#22c55e' : '#ef4444', margin: '0 0 8px' }}>
                {attending ? "✓ You're attending!" : "✗ You can't make it"}
              </p>
              <p style={{ textAlign: 'center', color: '#888', margin: '0 0 32px' }}>Hey {guest.name}, thanks for your response!</p>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#bbb', fontSize: '13px', margin: '0 0 8px' }}>Changed your mind?</p>
                <a href={attending ? '?r=declined' : '?r=attending'} style={{ color: '#ff6b35', fontSize: '14px', textDecoration: 'underline' }}>
                  {attending ? "Actually I can't make it" : 'I can attend after all'}
                </a>
              </div>
            </>
          ) : (
            <>
              <p style={{ fontSize: '17px', color: '#333', margin: '0 0 24px', lineHeight: 1.5 }}>
                Hey <strong>{guest.name}</strong>! Can you make it?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <a href="?r=attending" style={{ display: 'block', background: '#22c55e', color: 'white', textDecoration: 'none', padding: '18px', borderRadius: '14px', textAlign: 'center', fontSize: '18px', fontWeight: 600 }}>
                  ✓ I'm attending!
                </a>
                <a href="?r=declined" style={{ display: 'block', background: '#f5f5f5', color: '#555', textDecoration: 'none', padding: '18px', borderRadius: '14px', textAlign: 'center', fontSize: '18px', fontWeight: 600 }}>
                  ✗ Can't make it
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

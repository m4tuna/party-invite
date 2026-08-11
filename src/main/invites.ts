const RSVP_BASE = 'https://party.m42.app/rsvp'

interface Party { id: string; name: string; date: string | null; location: string | null }
interface Guest { id: string; name: string; email: string | null; phone: string | null; guest_token: string }
interface TwilioCreds { sid: string; token: string; from: string }

export function buildRsvpUrl(partyId: string, guestToken: string) {
  return `${RSVP_BASE}/${partyId}/${guestToken}`
}

function buildEmailHtml(guest: Guest, party: Party): string {
  const url = buildRsvpUrl(party.id, guest.guest_token)
  const dateStr = party.date
    ? new Date(party.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : ''
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:480px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#ff6b35,#ff4757);padding:48px 40px;text-align:center">
      <div style="font-size:64px">🎉</div>
      <h1 style="color:white;margin:16px 0 0;font-size:28px;font-weight:700">You're Invited!</h1>
    </div>
    <div style="padding:40px">
      <p style="font-size:18px;color:#1a1a1a;margin:0 0 8px">Hey ${guest.name},</p>
      <p style="font-size:16px;color:#555;margin:0 0 24px;line-height:1.5">You're invited to <strong style="color:#1a1a1a">${party.name}</strong>${dateStr ? ` on ${dateStr}` : ''}${party.location ? ` at ${party.location}` : ''}.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="${url}?r=attending" style="display:inline-block;background:#22c55e;color:white;text-decoration:none;padding:16px 40px;border-radius:50px;font-size:18px;font-weight:600;margin:0 8px 12px">✓ Attending</a>
        <a href="${url}?r=declined" style="display:inline-block;background:#f5f5f5;color:#555;text-decoration:none;padding:16px 40px;border-radius:50px;font-size:18px;font-weight:600;margin:0 8px 12px">✗ Can't make it</a>
      </div>
      <p style="font-size:13px;color:#aaa;text-align:center;margin:0">Or open: <a href="${url}" style="color:#ff6b35">${url}</a></p>
    </div>
  </div>
</body>
</html>`
}

export async function sendEmail(guest: Guest, party: Party, apiKey: string): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Party Invite <invites@m42.app>',
      to: guest.email!,
      subject: `You're invited to ${party.name}! 🎉`,
      html: buildEmailHtml(guest, party),
    }),
  })
  if (!res.ok) throw new Error(`Resend error: ${res.status} ${await res.text()}`)
}

export async function sendSms(guest: Guest, party: Party, twilio: TwilioCreds): Promise<void> {
  const url = buildRsvpUrl(party.id, guest.guest_token)
  const dateShort = party.date
    ? new Date(party.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : ''
  const body = `Hey ${guest.name}! You're invited to ${party.name}${dateShort ? ` on ${dateShort}` : ''}. RSVP: ${url}`
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${twilio.sid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${twilio.sid}:${twilio.token}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: guest.phone!, From: twilio.from, Body: body }).toString(),
    }
  )
  if (!res.ok) throw new Error(`Twilio error: ${res.status} ${await res.text()}`)
}

export async function sendBatch(
  guests: Guest[],
  party: Party,
  via: ('email' | 'sms')[],
  creds: { resend: { apiKey: string } | null; twilio: TwilioCreds | null }
): Promise<{ sent: string[]; failed: Array<{ id: string; error: string }> }> {
  const sent: string[] = []
  const failed: Array<{ id: string; error: string }> = []
  for (const guest of guests) {
    try {
      if (via.includes('email') && guest.email && creds.resend) {
        await sendEmail(guest, party, creds.resend.apiKey)
      }
      if (via.includes('sms') && guest.phone && creds.twilio) {
        await sendSms(guest, party, creds.twilio)
      }
      sent.push(guest.id)
    } catch (e: any) {
      failed.push({ id: guest.id, error: e.message })
    }
  }
  return { sent, failed }
}

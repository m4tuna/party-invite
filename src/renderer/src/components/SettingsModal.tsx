import { useState, useEffect } from 'react'

interface Props {
  onClose: () => void
}

const INPUT: React.CSSProperties = {
  width: '100%',
  background: '#111',
  border: '1px solid #333',
  borderRadius: '10px',
  color: 'white',
  fontSize: '13px',
  padding: '10px 14px',
  outline: 'none',
  boxSizing: 'border-box',
}

export default function SettingsModal({ onClose }: Props) {
  const [resendKey, setResendKey] = useState('')
  const [twilioSid, setTwilioSid] = useState('')
  const [twilioToken, setTwilioToken] = useState('')
  const [twilioFrom, setTwilioFrom] = useState('')
  const [savedResend, setSavedResend] = useState<{ apiKey: string } | null>(null)
  const [savedTwilio, setSavedTwilio] = useState<{ sid: string; token: string; from: string } | null>(null)
  const [savingResend, setSavingResend] = useState(false)
  const [savingTwilio, setSavingTwilio] = useState(false)
  const [resendSaved, setResendSaved] = useState(false)
  const [twilioSaved, setTwilioSaved] = useState(false)

  useEffect(() => {
    window.api.getCredentials().then(creds => {
      setSavedResend(creds.resend)
      setSavedTwilio(creds.twilio)
    })
  }, [])

  async function saveResend(e: React.FormEvent) {
    e.preventDefault()
    if (!resendKey.trim()) return
    setSavingResend(true)
    await window.api.saveCredentials({ resend: { apiKey: resendKey.trim() } })
    const creds = await window.api.getCredentials()
    setSavedResend(creds.resend)
    setResendKey('')
    setSavingResend(false)
    setResendSaved(true)
    setTimeout(() => setResendSaved(false), 2000)
  }

  async function saveTwilio(e: React.FormEvent) {
    e.preventDefault()
    if (!twilioSid.trim() || !twilioToken.trim() || !twilioFrom.trim()) return
    setSavingTwilio(true)
    await window.api.saveCredentials({ twilio: { sid: twilioSid.trim(), token: twilioToken.trim(), from: twilioFrom.trim() } })
    const creds = await window.api.getCredentials()
    setSavedTwilio(creds.twilio)
    setTwilioSid(''); setTwilioToken(''); setTwilioFrom('')
    setSavingTwilio(false)
    setTwilioSaved(true)
    setTimeout(() => setTwilioSaved(false), 2000)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '20px 20px 0 0', padding: '24px', maxHeight: '80vh', overflowY: 'auto' }}>
        {/* Handle */}
        <div style={{ width: '36px', height: '4px', background: '#333', borderRadius: '2px', margin: '0 auto 20px' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ color: 'white', fontSize: '16px', fontWeight: 700, margin: 0 }}>Settings</h2>
          <button onClick={onClose} style={{ background: '#222', border: '1px solid #333', borderRadius: '8px', color: '#999', cursor: 'pointer', fontSize: '13px', padding: '4px 10px' }}>Done</button>
        </div>

        {/* Resend section */}
        <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <div style={{ color: 'white', fontSize: '14px', fontWeight: 600 }}>Resend</div>
              <div style={{ color: '#666', fontSize: '11px', marginTop: '2px' }}>For sending invite emails</div>
            </div>
            {savedResend && (
              <span style={{ fontSize: '11px', color: '#22c55e', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '6px', padding: '3px 8px' }}>
                Connected
              </span>
            )}
          </div>
          {savedResend && (
            <div style={{ background: '#1a1a1a', borderRadius: '8px', padding: '8px 12px', marginBottom: '10px', fontSize: '12px', color: '#555' }}>
              API Key: {savedResend.apiKey}
            </div>
          )}
          <form onSubmit={saveResend} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="password"
              placeholder={savedResend ? 'New API key (to replace)' : 'Resend API key'}
              value={resendKey}
              onChange={e => setResendKey(e.target.value)}
              style={INPUT}
            />
            <button
              type="submit"
              disabled={!resendKey.trim() || savingResend}
              style={{ background: resendKey.trim() ? '#ff6b35' : '#222', color: resendKey.trim() ? 'white' : '#555', border: '1px solid #333', borderRadius: '10px', padding: '10px', fontSize: '13px', fontWeight: 600, cursor: resendKey.trim() ? 'pointer' : 'not-allowed' }}
            >
              {resendSaved ? 'Saved ✓' : savingResend ? 'Saving…' : 'Save Resend Key'}
            </button>
          </form>
        </div>

        {/* Twilio section */}
        <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <div style={{ color: 'white', fontSize: '14px', fontWeight: 600 }}>Twilio</div>
              <div style={{ color: '#666', fontSize: '11px', marginTop: '2px' }}>For sending invite SMS</div>
            </div>
            {savedTwilio && (
              <span style={{ fontSize: '11px', color: '#22c55e', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '6px', padding: '3px 8px' }}>
                Connected
              </span>
            )}
          </div>
          {savedTwilio && (
            <div style={{ background: '#1a1a1a', borderRadius: '8px', padding: '8px 12px', marginBottom: '10px', fontSize: '12px', color: '#555' }}>
              SID: {savedTwilio.sid} · From: {savedTwilio.from}
            </div>
          )}
          <form onSubmit={saveTwilio} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input placeholder="Account SID" value={twilioSid} onChange={e => setTwilioSid(e.target.value)} style={INPUT} />
            <input type="password" placeholder="Auth Token" value={twilioToken} onChange={e => setTwilioToken(e.target.value)} style={INPUT} />
            <input placeholder="From phone (+1234567890)" value={twilioFrom} onChange={e => setTwilioFrom(e.target.value)} style={INPUT} />
            <button
              type="submit"
              disabled={!twilioSid.trim() || !twilioToken.trim() || !twilioFrom.trim() || savingTwilio}
              style={{ background: (twilioSid.trim() && twilioToken.trim() && twilioFrom.trim()) ? '#ff6b35' : '#222', color: (twilioSid.trim() && twilioToken.trim() && twilioFrom.trim()) ? 'white' : '#555', border: '1px solid #333', borderRadius: '10px', padding: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              {twilioSaved ? 'Saved ✓' : savingTwilio ? 'Saving…' : 'Save Twilio Creds'}
            </button>
          </form>
        </div>

        <p style={{ color: '#444', fontSize: '11px', lineHeight: 1.5, margin: 0 }}>
          Credentials are stored locally on your Mac and never sent to any server other than Resend/Twilio directly.
        </p>
      </div>
    </div>
  )
}

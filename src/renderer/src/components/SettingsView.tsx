import { useState, useEffect } from 'react'

export default function SettingsView() {
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '13px',
    padding: '8px 12px',
    outline: 'none',
  }

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
    setTwilioSid('')
    setTwilioToken('')
    setTwilioFrom('')
    setSavingTwilio(false)
    setTwilioSaved(true)
    setTimeout(() => setTwilioSaved(false), 2000)
  }

  const sectionStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '16px' }}>
      <h2 style={{ color: 'white', fontSize: '16px', fontWeight: 600, marginBottom: '16px', margin: '0 0 16px' }}>Settings</h2>

      {/* Resend */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <div style={{ color: 'white', fontSize: '14px', fontWeight: 600 }}>📧 Resend</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '2px' }}>For sending invite emails</div>
          </div>
          {savedResend && (
            <span style={{ fontSize: '11px', color: '#22c55e', background: 'rgba(34,197,94,0.1)', borderRadius: '6px', padding: '3px 8px' }}>Connected</span>
          )}
        </div>
        {savedResend && (
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px 12px', marginBottom: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
            API Key: {savedResend.apiKey}
          </div>
        )}
        <form onSubmit={saveResend} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            type="password"
            placeholder={savedResend ? 'New API key (to replace)' : 'Resend API key'}
            value={resendKey}
            onChange={e => setResendKey(e.target.value)}
            style={inputStyle}
          />
          <button type="submit" disabled={!resendKey.trim() || savingResend} style={{ background: resendKey.trim() ? '#ff6b35' : 'rgba(255,255,255,0.08)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 600, cursor: resendKey.trim() ? 'pointer' : 'not-allowed' }}>
            {resendSaved ? 'Saved ✓' : savingResend ? 'Saving…' : 'Save Resend Key'}
          </button>
        </form>
      </div>

      {/* Twilio */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <div style={{ color: 'white', fontSize: '14px', fontWeight: 600 }}>📱 Twilio</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '2px' }}>For sending invite SMS</div>
          </div>
          {savedTwilio && (
            <span style={{ fontSize: '11px', color: '#22c55e', background: 'rgba(34,197,94,0.1)', borderRadius: '6px', padding: '3px 8px' }}>Connected</span>
          )}
        </div>
        {savedTwilio && (
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px 12px', marginBottom: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
            SID: {savedTwilio.sid} · From: {savedTwilio.from}
          </div>
        )}
        <form onSubmit={saveTwilio} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input placeholder="Account SID" value={twilioSid} onChange={e => setTwilioSid(e.target.value)} style={inputStyle} />
          <input type="password" placeholder="Auth Token" value={twilioToken} onChange={e => setTwilioToken(e.target.value)} style={inputStyle} />
          <input placeholder="From phone (+1234567890)" value={twilioFrom} onChange={e => setTwilioFrom(e.target.value)} style={inputStyle} />
          <button type="submit" disabled={!twilioSid.trim() || !twilioToken.trim() || !twilioFrom.trim() || savingTwilio} style={{ background: (twilioSid.trim() && twilioToken.trim() && twilioFrom.trim()) ? '#ff6b35' : 'rgba(255,255,255,0.08)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            {twilioSaved ? 'Saved ✓' : savingTwilio ? 'Saving…' : 'Save Twilio Creds'}
          </button>
        </form>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', lineHeight: 1.5 }}>
        Credentials are stored locally on your Mac. They are never sent to any server other than Resend/Twilio directly.
      </p>
    </div>
  )
}

export default function LoginView() {
  function handleLogin() {
    window.api.login()
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(18,18,20,0.95)',
      gap: '24px',
      WebkitAppRegion: 'drag' as any,
    }}>
      <div style={{ fontSize: '72px', lineHeight: 1 }}>🎉</div>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 700, margin: '0 0 8px' }}>Party Invite</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: 0 }}>Send invites, collect RSVPs</p>
      </div>
      <button
        onClick={handleLogin}
        style={{
          WebkitAppRegion: 'no-drag' as any,
          background: '#ff6b35',
          color: 'white',
          border: 'none',
          borderRadius: '50px',
          padding: '14px 32px',
          fontSize: '15px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Sign in with Google
      </button>
    </div>
  )
}

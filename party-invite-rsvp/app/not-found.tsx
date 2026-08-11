export default function NotFound() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px', textAlign: 'center' }}>
      <div>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
        <h1 style={{ fontSize: '24px', color: '#333', margin: '0 0 8px' }}>Invite not found</h1>
        <p style={{ color: '#888' }}>This link may be invalid or the event was cancelled.</p>
      </div>
    </div>
  )
}

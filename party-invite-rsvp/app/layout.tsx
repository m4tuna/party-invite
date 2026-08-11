export const metadata = { title: 'Party Invite', description: 'RSVP to your party invite' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#fafafa', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  )
}

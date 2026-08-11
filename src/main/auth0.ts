import { createHash, randomBytes } from 'crypto'
import http from 'http'
import { shell } from 'electron'
import type { BrowserWindow } from 'electron'

const DOMAIN = 'dev-2i4tejj40hsqtzi0.us.auth0.com'
const CLIENT_ID = 'bARwsSD5s2dckHhkzu9gu2orFX8cGJxM'

let _win: BrowserWindow | null = null
let _server: http.Server | null = null
let _timeout: NodeJS.Timeout | null = null

export function initAuth0(win: BrowserWindow) {
  _win = win
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function closeCallbackServer() {
  if (_timeout) { clearTimeout(_timeout); _timeout = null }
  if (_server) { _server.close(); _server = null }
}

const SUCCESS_HTML = `<!DOCTYPE html><html><head><style>
  body{background:#111;color:#fff;font-family:-apple-system,BlinkMacSystemFont,sans-serif;
  display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:10px}
  h2{font-size:22px;font-weight:600;margin:0}
  p{color:rgba(255,255,255,0.45);font-size:14px;margin:0}
</style></head><body><h2>You're signed in!</h2><p>Return to Party Invite to continue.</p></body></html>`

// PKCE login for Google or email (via Auth0 Universal Login)
export function startAuth0Login(connection: 'google-oauth2' | 'email', loginHint?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    closeCallbackServer()

    const verifier = b64url(randomBytes(32))
    const challenge = b64url(createHash('sha256').update(verifier).digest())
    const state = b64url(randomBytes(16))

    // Must be declared before the request handler closure captures it.
    // Set in the listen callback; browser URL is only opened after it's set,
    // so any incoming request will always see the correct value.
    let redirectUri = ''

    _server = http.createServer(async (req, res) => {
      const reqUrl = new URL(req.url!, `http://localhost`)
      if (reqUrl.pathname !== '/callback') { res.writeHead(404); res.end(); return }

      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(SUCCESS_HTML)
      closeCallbackServer()

      const code = reqUrl.searchParams.get('code')
      const err = reqUrl.searchParams.get('error')
      const errDesc = reqUrl.searchParams.get('error_description')
      if (err || !code || reqUrl.searchParams.get('state') !== state) {
        reject(new Error(errDesc || err || 'Auth cancelled'))
        return
      }

      try {
        const tokenRes = await fetch(`https://${DOMAIN}/oauth/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grant_type: 'authorization_code',
            client_id: CLIENT_ID,
            code_verifier: verifier,
            code,
            redirect_uri: redirectUri,
          }),
        })
        if (!tokenRes.ok) throw new Error(`Token exchange failed: ${tokenRes.status}`)
        const { id_token, access_token } = await tokenRes.json() as { id_token: string; access_token: string }

        const userRes = await fetch(`https://${DOMAIN}/userinfo`, {
          headers: { Authorization: `Bearer ${access_token}` },
        })
        const user = userRes.ok ? await userRes.json() : null

        if (_win && !_win.isDestroyed()) {
          _win.webContents.send('auth0:tokens', { idToken: id_token, accessToken: access_token, user })
        }
        resolve()
      } catch (e) {
        reject(e)
      }
    })

    // 5-minute timeout for standard login flows
    _timeout = setTimeout(closeCallbackServer, 5 * 60 * 1000)

    _server.listen(0, '127.0.0.1', () => {
      const port = (_server!.address() as { port: number }).port
      redirectUri = `http://localhost:${port}/callback`

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: CLIENT_ID,
        redirect_uri: redirectUri,
        scope: 'openid email profile',
        state,
        code_challenge: challenge,
        code_challenge_method: 'S256',
        connection,
        ...(loginHint ? { login_hint: loginHint } : {}),
      })

      shell.openExternal(`https://${DOMAIN}/authorize?${params}`)
    })
  })
}

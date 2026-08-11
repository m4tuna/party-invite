import { app, BrowserWindow, globalShortcut, shell, screen, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { createTray, getTrayBounds } from './tray'
import { registerIpcHandlers } from './ipc'
import { initAuth0, startAuth0Login } from './auth0'
import { store } from './store'
import { supabase } from './supabase'

let mainWindow: BrowserWindow | null = null
let isQuitting = false
let rendererReady = false
const panelWidth = 420
const panelHeight = 600

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}
app.on('second-instance', () => { if (mainWindow) showPanel() })

export function safeSend(channel: string, ...args: unknown[]) {
  if (!mainWindow || mainWindow.isDestroyed() || !rendererReady) return
  if (mainWindow.webContents.isLoading()) return
  try { mainWindow.webContents.send(channel, ...args) } catch {}
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: panelWidth,
    height: panelHeight,
    show: false,
    frame: false,
    transparent: true,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      backgroundThrottling: false,
    },
  })

  mainWindow.webContents.on('did-finish-load', () => { rendererReady = true })
  mainWindow.webContents.on('did-start-loading', () => { rendererReady = false })

  mainWindow.on('blur', () => { if (!isQuitting) mainWindow?.hide() })
  mainWindow.on('close', (e) => { if (!isQuitting) { e.preventDefault(); mainWindow!.hide() } })
  mainWindow.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' } })

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

export function showPanel() {
  if (!mainWindow) return
  const trayBounds = getTrayBounds()
  if (!trayBounds) { mainWindow.show(); mainWindow.focus(); return }

  const display = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y })
  const wa = display.workArea

  const x = Math.round(trayBounds.x + trayBounds.width / 2 - panelWidth / 2)
  const y = Math.round(trayBounds.y + trayBounds.height)

  const clampedX = Math.max(wa.x + 4, Math.min(x, wa.x + wa.width - panelWidth - 4))
  const maxH = Math.round(wa.y + wa.height - y - 8)
  const h = Math.min(panelHeight, maxH)

  mainWindow.setSize(panelWidth, h, false)
  mainWindow.setPosition(clampedX, y, false)
  mainWindow.show()
  mainWindow.focus()
}

function loadShortcut(appId: string, fallback: string): string {
  const configPath = is.dev
    ? path.join(process.cwd(), '..', 'shortcuts.json')
    : path.join(app.getPath('appData'), 'electron-vibes', 'shortcuts.json')
  try {
    const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    return cfg[appId] ?? fallback
  } catch {
    return fallback
  }
}

function setupRealtimeSubscription() {
  const auth = store.get('auth')
  if (!auth?.user) return

  supabase
    .channel('party_invite_guests_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'party_invite_guests' },
      (payload) => {
        safeSend('party:guestUpdated', payload.new)
      }
    )
    .subscribe()
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.m42.party-invite')
  app.on('browser-window-created', (_, w) => optimizer.watchWindowShortcuts(w))

  const win = createWindow()
  initAuth0(win)
  createTray(win, showPanel)
  registerIpcHandlers(win)

  // Handle Auth0 tokens pushed from auth0.ts
  win.webContents.on('did-finish-load', () => {
    // Listen for auth0:tokens from main process (emitted by auth0.ts callback)
  })

  ipcMain.on('party:login', async () => {
    try {
      await startAuth0Login('google-oauth2')
    } catch (e) {
      console.error('Login failed:', e)
    }
  })

  // When auth0:tokens arrives (pushed by auth0.ts to renderer), also save to store
  win.webContents.on('did-finish-load', () => {
    // auth0.ts pushes directly to renderer via win.webContents.send('auth0:tokens', ...)
    // The renderer listens to auth0:tokens and calls party:saveAuth
  })

  ipcMain.handle('party:saveAuth', (_, auth: { idToken: string; accessToken: string; user: unknown }) => {
    store.set('auth', auth as any)
    setupRealtimeSubscription()
  })

  // Setup realtime if already authenticated
  setupRealtimeSubscription()

  const shortcut = loadShortcut('party-invite', 'CommandOrControl+Shift+P')
  globalShortcut.register(shortcut, () => {
    if (mainWindow?.isVisible()) mainWindow.hide()
    else showPanel()
  })

  app.on('activate', () => showPanel())
})

app.on('before-quit', () => { isQuitting = true; globalShortcut.unregisterAll() })
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

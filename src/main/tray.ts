import { Tray, Menu, nativeImage, BrowserWindow, app, Rectangle } from 'electron'
import path from 'path'

let tray: Tray | null = null

function getIconPath() {
  return process.env.NODE_ENV === 'development'
    ? path.join(process.cwd(), 'resources', 'icon-tray.png')
    : path.join(process.resourcesPath, 'resources', 'icon-tray.png')
}

export function getTrayBounds(): Rectangle | null {
  return tray?.getBounds() ?? null
}

export function createTray(win: BrowserWindow, onShow: () => void) {
  if (tray) { tray.destroy(); tray = null }

  const iconPath = getIconPath()
  let icon = nativeImage.createFromPath(iconPath)
  if (icon.isEmpty()) icon = nativeImage.createEmpty()
  icon.setTemplateImage(true)

  tray = new Tray(icon)
  tray.setToolTip('Party Invite')

  tray.on('mouse-up', () => {
    if (win.isVisible() && win.isFocused()) {
      win.hide()
    } else {
      onShow()
    }
  })

  tray.on('right-click', () => {
    tray?.popUpContextMenu(
      Menu.buildFromTemplate([
        { label: 'Quit Party Invite', click: () => app.quit() },
      ])
    )
  })

  return tray
}

export function destroyTray() {
  tray?.destroy(); tray = null
}

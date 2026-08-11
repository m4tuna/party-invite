const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

exports.default = async function (context) {
  const { appOutDir } = context
  const app = fs.readdirSync(appOutDir).find(f => f.endsWith('.app'))
  if (!app) return
  const appPath = path.join(appOutDir, app)
  try {
    execSync(`codesign --deep --force --sign - "${appPath}"`)
    console.log('Ad-hoc signed:', appPath)
  } catch (e) {
    console.warn('Ad-hoc signing failed:', e.message)
  }
}

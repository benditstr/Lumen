// Renders the Lumen app icon to build/icon-1024.png.
// Launches scripts/icon-main.cjs (a 1024px transparent Electron window with
// the SVG artwork) via playwright-core and screenshots it with omitBackground,
// which reliably preserves the alpha channel. Run: node scripts/make-icon.mjs
import { _electron } from 'playwright-core'
import { mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const app = await _electron.launch({ args: [join(root, 'scripts/icon-main.cjs')], cwd: root })
const win = await app.firstWindow()
await win.waitForSelector('svg', { timeout: 10000 })
await win.waitForTimeout(300) // settle paint

mkdirSync(join(root, 'build'), { recursive: true })
await win.screenshot({ path: join(root, 'build', 'icon-1024.png'), omitBackground: true })
await app.close()
console.log('Wrote build/icon-1024.png')

// E2E: drive the built app against a temp vault, verify wikilink preview
// navigation and the graph view. Backs up and restores the real lumen.json.
import { _electron } from 'playwright-core'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir, homedir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const configPath = join(homedir(), 'Library/Application Support/lumen/lumen.json')
const backup = existsSync(configPath) ? readFileSync(configPath, 'utf8') : null

let failures = 0
const check = (label, cond) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`)
  if (!cond) failures++
}

const vault = mkdtempSync(join(tmpdir(), 'lumen-e2e-vault-'))
mkdirSync(join(vault, 'notes'), { recursive: true })
writeFileSync(join(vault, 'notes', 'Hub.md'), '# Hub\n\nSee [[Alpha]] and [[Beta]] and [[Missing Note]].\n')
writeFileSync(join(vault, 'notes', 'Alpha.md'), 'Alpha links back to [[Hub]] and to [[Beta|the beta note]].\n')
writeFileSync(join(vault, 'notes', 'Beta.md'), 'Beta has no outgoing links.\n')

let app
try {
  writeFileSync(configPath, JSON.stringify({ vaultPath: vault }))

  // Launch via the project dir (not the bundle file) so Electron picks up the
  // app name "lumen" from package.json — otherwise userData resolves to the
  // generic "Electron" folder and the stored vault path is not found.
  app = await _electron.launch({ args: ['.'], cwd: root })
  const win = await app.firstWindow()
  await win.waitForSelector('header', { timeout: 10000 })

  // --- Wikilink navigation in preview --- (sidebar titles have no .md suffix)
  await win.click('aside :text-is("Hub")')
  await win.keyboard.press('Meta+e') // edit -> split (editor + preview)
  await win.waitForSelector('.lumen-wikilink', { timeout: 5000 })
  const linkCount = await win.locator('.lumen-wikilink').count()
  check('preview renders 3 wikilinks in Hub', linkCount === 3)

  await win.click('.lumen-wikilink:has-text("Alpha")')
  await win.waitForTimeout(400)
  const alphaActive = await win.locator('aside :text-is("Alpha")').first().isVisible()
  const editorShowsAlpha = (await win.locator('.cm-content').textContent()) ?? ''
  check('clicking [[Alpha]] opens Alpha note', alphaActive && editorShowsAlpha.includes('Alpha links back'))

  // Clicking a ghost link creates the note.
  await win.click('aside :text-is("Hub")')
  await win.waitForSelector('.lumen-wikilink:has-text("Missing Note")', { timeout: 5000 })
  await win.click('.lumen-wikilink:has-text("Missing Note")')
  await win.waitForTimeout(600)
  check('clicking ghost link creates Missing Note.md', existsSync(join(vault, 'notes', 'Missing Note.md')))

  // --- Graph view ---
  await win.keyboard.press('Meta+g')
  await win.waitForSelector('canvas', { timeout: 5000 })
  await win.waitForTimeout(1500) // let the simulation settle
  check('graph canvas visible', await win.locator('canvas').isVisible())
  const hint = await win.locator('text=scroll to zoom').isVisible()
  check('graph hint overlay visible', hint)
  await win.screenshot({ path: '/tmp/lumen-graph-view.png' })

  // Toggle back to the editor with the titlebar button.
  await win.click('button[title*="graph view"]')
  await win.waitForTimeout(300)
  check('titlebar button toggles back to editor', (await win.locator('canvas').count()) === 0)
} catch (err) {
  failures++
  console.error('E2E error:', err)
} finally {
  await app?.close().catch(() => {})
  if (backup !== null) writeFileSync(configPath, backup)
  rmSync(vault, { recursive: true, force: true })
}

console.log(failures === 0 ? '\nAll E2E checks passed.' : `\n${failures} check(s) FAILED`)
process.exit(failures === 0 ? 0 : 1)

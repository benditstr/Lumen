// E2E: folder system (create folder, move note via context menu) and the
// graph view open NEXT TO the editor. Backs up/restores the real lumen.json.
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

const vault = mkdtempSync(join(tmpdir(), 'lumen-e2e-folders-'))
mkdirSync(join(vault, 'notes'), { recursive: true })
writeFileSync(join(vault, 'notes', 'Hub.md'), '# Hub\n\nSee [[Alpha]].\n')
writeFileSync(join(vault, 'notes', 'Alpha.md'), 'Alpha content here.\n')

let app
try {
  writeFileSync(configPath, JSON.stringify({ vaultPath: vault }))
  app = await _electron.launch({ args: ['.'], cwd: root })
  const win = await app.firstWindow()
  await win.waitForSelector('header', { timeout: 10000 })

  // --- create a folder via the sidebar button ---
  await win.click('button[title="New folder"]')
  await win.keyboard.type('Projekte')
  await win.keyboard.press('Enter')
  await win.waitForSelector('aside :text-is("Projekte")', { timeout: 5000 })
  check('folder "Projekte" appears in sidebar', existsSync(join(vault, 'notes', 'Projekte')))

  // --- move Alpha into the folder via context menu ---
  await win.click('aside :text-is("Alpha")', { button: 'right' })
  await win.click('text=Move to…')
  await win.click('button:text-is("Projekte") >> nth=-1')
  await win.waitForTimeout(600)
  check('Alpha.md moved to notes/Projekte/', existsSync(join(vault, 'notes', 'Projekte', 'Alpha.md')))

  // --- note inside folder opens ---
  await win.click('aside :text-is("Alpha")')
  await win.waitForTimeout(300)
  const content = (await win.locator('.cm-content').textContent()) ?? ''
  check('moved note opens in editor', content.includes('Alpha content'))

  // --- graph opens NEXT TO the editor ---
  await win.keyboard.press('Meta+g')
  await win.waitForSelector('canvas', { timeout: 5000 })
  await win.waitForTimeout(1200)
  const canvasVisible = await win.locator('canvas').isVisible()
  const editorVisible = await win.locator('.cm-content').isVisible()
  check('canvas AND editor visible simultaneously', canvasVisible && editorVisible)
  await win.screenshot({ path: '/tmp/lumen-folders-graph.png' })

  await win.keyboard.press('Meta+g')
  await win.waitForTimeout(300)
  check('Cmd+G closes the graph panel', (await win.locator('canvas').count()) === 0)
} catch (err) {
  failures++
  console.error('E2E error:', err)
} finally {
  await app?.close().catch(() => {})
  if (backup !== null) writeFileSync(configPath, backup)
  rmSync(vault, { recursive: true, force: true })
}

console.log(failures === 0 ? '\nAll folder/graph E2E checks passed.' : `\n${failures} check(s) FAILED`)
process.exit(failures === 0 ? 0 : 1)

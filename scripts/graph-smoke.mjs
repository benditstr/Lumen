// Headless smoke test for buildGraph/extractWikilinks (vault.ts).
// Bundles the main-process module with electron stubbed, then asserts
// graph extraction against a synthetic temp vault.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const bundle = join(tmpdir(), 'lumen-vault-bundle.cjs')

execFileSync(
  join(root, 'node_modules/.bin/esbuild'),
  [
    join(root, 'src/main/vault.ts'),
    '--bundle',
    '--platform=node',
    '--format=cjs',
    '--external:electron',
    `--outfile=${bundle}`
  ],
  { stdio: 'inherit' }
)

const require = createRequire(import.meta.url)
const Module = require('node:module')
const origLoad = Module._load
Module._load = (request, ...rest) =>
  request === 'electron' ? { shell: { trashItem: async () => {}, openPath: async () => {} } } : origLoad(request, ...rest)

const vault = require(bundle)

const dir = mkdtempSync(join(tmpdir(), 'lumen-graph-test-'))
mkdirSync(join(dir, 'notes'), { recursive: true })
writeFileSync(
  join(dir, 'notes', 'A.md'),
  'Links: [[B]] again as [[B|alias]] plus [[Ghost Note]] and [[A]] self and ![[pic.png]] embed.\n'
)
writeFileSync(join(dir, 'notes', 'B.md'), 'Case-insensitive back link: [[a]] and section link [[A#Heading]].\n')

let failures = 0
const check = (label, cond) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`)
  if (!cond) failures++
}

const g = await vault.buildGraph(dir)
const names = g.nodes.map((n) => n.name).sort()
const ghost = g.nodes.find((n) => !n.exists)
const a = g.nodes.find((n) => n.name === 'A')
const b = g.nodes.find((n) => n.name === 'B')

check('3 nodes (A, B, Ghost Note)', g.nodes.length === 3 && names.join() === 'A,B,Ghost Note')
check('ghost node is Ghost Note, exists=false', ghost?.name === 'Ghost Note')
check('3 edges (A->B dedup, A->ghost, B->A)', g.edges.length === 3)
check('embed ![[pic.png]] ignored', !g.nodes.some((n) => n.name.includes('pic')))
check('self-link [[A]] ignored', !g.edges.some((e) => e.source === e.target))
check('A linkCount 3', a?.linkCount === 3)
check('B linkCount 2 (A->B, B->A)', b?.linkCount === 2)
check(
  'B->A resolves case-insensitively + section stripped (one edge, dedup)',
  g.edges.filter((e) => e.source === b?.id && e.target === a?.id).length === 1
)

const links = vault.extractWikilinks('x [[One]] y ![[skip.png]] z [[Two|al]] [[Three#sec]]')
check('extractWikilinks finds One/Two/Three', links.join() === 'One,Two,Three')

rmSync(dir, { recursive: true, force: true })
console.log(failures === 0 ? '\nAll graph smoke checks passed.' : `\n${failures} check(s) FAILED`)
process.exit(failures === 0 ? 0 : 1)

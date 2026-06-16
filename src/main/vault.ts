import { promises as fs, Dirent } from 'fs'
import { join, resolve, basename, extname, dirname, sep } from 'path'
import { shell } from 'electron'
import Fuse from 'fuse.js'

export interface NoteMeta {
  name: string
  path: string
  mtime: number
  folder: string // relative to notes/, '' = root
}

export interface SearchResult {
  name: string
  path: string
  excerpt: string
}

export interface GraphNode {
  id: string // note path, or "ghost:<name>" for unresolved link targets
  name: string // display name without .md
  exists: boolean
  linkCount: number
}

export interface GraphEdge {
  source: string
  target: string
}

export interface VaultGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

const notesDir = (vault: string): string => join(vault, 'notes')
const attachmentsDir = (vault: string): string => join(vault, 'attachments')

/** Guard against path traversal: a target must resolve to inside the vault. */
function assertInside(vault: string, target: string): string {
  const root = resolve(vault)
  const r = resolve(target)
  if (r !== root && !r.startsWith(root + sep)) {
    throw new Error(`Path escapes vault: ${target}`)
  }
  return r
}

function sanitize(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, '-').trim()
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

export async function ensureStructure(vault: string): Promise<void> {
  await fs.mkdir(notesDir(vault), { recursive: true })
  await fs.mkdir(attachmentsDir(vault), { recursive: true })
  await fs.mkdir(join(vault, '.lumen'), { recursive: true })
}

async function walk(dir: string): Promise<string[]> {
  let entries: Dirent[]
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }
  const files: string[] = []
  for (const e of entries) {
    const full = join(dir, e.name)
    if (e.isDirectory()) {
      files.push(...(await walk(full)))
    } else if (e.isFile() && extname(e.name) === '.md') {
      files.push(full)
    }
  }
  return files
}

export async function listNotes(vault: string): Promise<NoteMeta[]> {
  const root = notesDir(vault)
  const files = await walk(root)
  const metas = await Promise.all(
    files.map(async (p) => {
      const st = await fs.stat(p)
      const dir = dirname(p)
      const folder = dir === root ? '' : dir.slice(root.length + 1)
      return { name: basename(p), path: p, mtime: st.mtimeMs, folder }
    })
  )
  return metas.sort((a, b) => b.mtime - a.mtime)
}

async function walkDirs(dir: string, base: string): Promise<string[]> {
  let entries: Dirent[]
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }
  const out: string[] = []
  for (const e of entries) {
    if (e.isDirectory()) {
      const rel = base ? `${base}/${e.name}` : e.name
      out.push(rel, ...(await walkDirs(join(dir, e.name), rel)))
    }
  }
  return out
}

export async function listFolders(vault: string): Promise<string[]> {
  return (await walkDirs(notesDir(vault), '')).sort()
}

export async function createFolder(vault: string, relPath: string): Promise<string> {
  const clean = relPath.split('/').map(sanitize).filter(Boolean).join('/')
  if (!clean) throw new Error('Invalid folder name')
  await fs.mkdir(assertInside(vault, join(notesDir(vault), clean)), { recursive: true })
  return clean
}

export async function renameFolder(vault: string, rel: string, newName: string): Promise<void> {
  const oldAbs = assertInside(vault, join(notesDir(vault), rel))
  const clean = sanitize(newName)
  if (!clean) throw new Error('Invalid folder name')
  await fs.rename(oldAbs, assertInside(vault, join(dirname(oldAbs), clean)))
}

export async function deleteFolder(vault: string, rel: string): Promise<void> {
  await shell.trashItem(assertInside(vault, join(notesDir(vault), rel)))
}

/** Move a note into a folder ('' = root), deduplicating the name if taken. */
export async function moveNote(vault: string, path: string, folderRel: string): Promise<string> {
  const p = assertInside(vault, path)
  const dir = assertInside(
    vault,
    folderRel ? join(notesDir(vault), folderRel) : notesDir(vault)
  )
  await fs.mkdir(dir, { recursive: true })
  const stem = basename(p, '.md')
  let target = join(dir, basename(p))
  let i = 1
  while (target !== p && (await exists(target))) {
    target = join(dir, `${stem} ${i}.md`)
    i++
  }
  if (target !== p) await fs.rename(p, target)
  return target
}

export async function readNote(vault: string, path: string): Promise<string> {
  return fs.readFile(assertInside(vault, path), 'utf8')
}

export async function writeNote(vault: string, path: string, content: string): Promise<void> {
  const p = assertInside(vault, path)
  await fs.mkdir(dirname(p), { recursive: true })
  await fs.writeFile(p, content, 'utf8')
}

export async function createNote(vault: string, name: string, folder = ''): Promise<NoteMeta> {
  const base = sanitize(name) || 'Untitled'
  const fileBase = extname(base) === '.md' ? base : `${base}.md`
  const stem = fileBase.replace(/\.md$/, '')
  const dir = assertInside(vault, folder ? join(notesDir(vault), folder) : notesDir(vault))
  await fs.mkdir(dir, { recursive: true })

  let target = join(dir, fileBase)
  let i = 1
  while (await exists(target)) {
    target = join(dir, `${stem} ${i}.md`)
    i++
  }
  await fs.writeFile(target, '', 'utf8')
  const st = await fs.stat(target)
  return { name: basename(target), path: target, mtime: st.mtimeMs, folder }
}

export async function renameNote(vault: string, oldPath: string, newPath: string): Promise<void> {
  const o = assertInside(vault, oldPath)
  const n = assertInside(vault, newPath)
  await fs.mkdir(dirname(n), { recursive: true })
  await fs.rename(o, n)
}

export async function deleteNote(vault: string, path: string): Promise<void> {
  await shell.trashItem(assertInside(vault, path))
}

export async function saveAttachment(
  vault: string,
  name: string,
  buffer: Uint8Array
): Promise<string> {
  await fs.mkdir(attachmentsDir(vault), { recursive: true })
  const clean = sanitize(name) || 'attachment'
  const ext = extname(clean)
  const stem = clean.slice(0, clean.length - ext.length)

  let target = join(attachmentsDir(vault), clean)
  let i = 1
  while (await exists(target)) {
    target = join(attachmentsDir(vault), `${stem}-${i}${ext}`)
    i++
  }
  await fs.writeFile(target, buffer)
  return basename(target)
}

export function openAttachment(vault: string, name: string): Promise<string> {
  return shell.openPath(assertInside(vault, join(attachmentsDir(vault), basename(name))))
}

function makeExcerpt(content: string, query: string): string {
  const idx = content.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return content.slice(0, 120).replace(/\s+/g, ' ').trim()
  const start = Math.max(0, idx - 40)
  const slice = content.slice(start, start + 120).replace(/\s+/g, ' ').trim()
  return (start > 0 ? '…' : '') + slice + (start + 120 < content.length ? '…' : '')
}

export async function search(vault: string, query: string): Promise<SearchResult[]> {
  if (!query.trim()) return []
  const files = await walk(notesDir(vault))
  const docs = await Promise.all(
    files.map(async (p) => ({
      name: basename(p),
      path: p,
      content: await fs.readFile(p, 'utf8').catch(() => '')
    }))
  )
  const fuse = new Fuse(docs, {
    keys: [
      { name: 'name', weight: 2 },
      { name: 'content', weight: 1 }
    ],
    threshold: 0.3,
    ignoreLocation: true,
    minMatchCharLength: 2
  })
  return fuse.search(query, { limit: 20 }).map((r) => ({
    name: r.item.name,
    path: r.item.path,
    excerpt: makeExcerpt(r.item.content, query)
  }))
}

// [[Target]], [[Target|Alias]], [[Target#Section]] — but not ![[embeds]].
const WIKILINK = /(?<!!)\[\[([^\]|#\n]+)(?:[|#][^\]]*)?\]\]/g

export function extractWikilinks(content: string): string[] {
  const targets: string[] = []
  for (const m of content.matchAll(WIKILINK)) {
    const t = m[1].trim()
    if (t) targets.push(t)
  }
  return targets
}

export async function buildGraph(vault: string): Promise<VaultGraph> {
  const files = await walk(notesDir(vault))
  const notes = await Promise.all(
    files.map(async (p) => ({
      path: p,
      stem: basename(p, '.md'),
      content: await fs.readFile(p, 'utf8').catch(() => '')
    }))
  )

  const byStem = new Map(notes.map((n) => [n.stem.toLowerCase(), n.path]))
  const nodes = new Map<string, GraphNode>(
    notes.map((n) => [n.path, { id: n.path, name: n.stem, exists: true, linkCount: 0 }])
  )
  const edges: GraphEdge[] = []
  const seen = new Set<string>()

  for (const note of notes) {
    for (const target of extractWikilinks(note.content)) {
      const stem = target.replace(/\.md$/i, '')
      const id = byStem.get(stem.toLowerCase()) ?? `ghost:${stem.toLowerCase()}`
      if (!nodes.has(id)) {
        nodes.set(id, { id, name: stem, exists: false, linkCount: 0 })
      }
      const key = `${note.path} ${id}`
      if (id === note.path || seen.has(key)) continue // skip self-links and duplicates
      seen.add(key)
      edges.push({ source: note.path, target: id })
      nodes.get(note.path)!.linkCount++
      nodes.get(id)!.linkCount++
    }
  }

  return { nodes: [...nodes.values()], edges }
}

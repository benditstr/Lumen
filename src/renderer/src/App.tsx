import { useCallback, useEffect, useState } from 'react'
import Onboarding from './components/Onboarding'
import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import MainPanel from './components/MainPanel'
import CommandPalette from './components/CommandPalette'
import GraphView from './components/GraphView'
import type { GraphNode, NoteMeta, ViewMode } from './types'

const VIEW_CYCLE: ViewMode[] = ['edit', 'split', 'preview']
const SEP = (p: string): string => (p.includes('\\') ? '\\' : '/')
const dirOf = (p: string): string => p.slice(0, p.lastIndexOf(SEP(p)) + 1)
const sanitize = (name: string): string => name.replace(/[/\\:*?"<>|]/g, '-').trim()

export default function App(): JSX.Element {
  // undefined = still loading stored path, null = no vault yet, string = ready
  const [vaultPath, setVaultPath] = useState<string | null | undefined>(undefined)
  const [notes, setNotes] = useState<NoteMeta[]>([])
  const [folders, setFolders] = useState<string[]>([])
  const [activePath, setActivePath] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [view, setView] = useState<ViewMode>('edit')
  const [renamingPath, setRenamingPath] = useState<string | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [graphOpen, setGraphOpen] = useState(false)

  const refresh = useCallback(async (): Promise<void> => {
    const [n, f] = await Promise.all([window.lumen.listNotes(), window.lumen.listFolders()])
    setNotes(n)
    setFolders(f)
  }, [])

  // Folder renames/deletes can invalidate the open note's path.
  useEffect(() => {
    if (activePath && !notes.some((n) => n.path === activePath)) setActivePath(null)
  }, [notes, activePath])

  useEffect(() => {
    window.lumen.getPath().then(setVaultPath)
  }, [])

  useEffect(() => {
    if (!vaultPath) return
    window.lumen.watchStart()
    refresh()
    return window.lumen.onVaultChanged(refresh)
  }, [vaultPath, refresh])

  const chooseVault = useCallback(async (): Promise<void> => {
    const p = await window.lumen.openFolderDialog()
    if (p) setVaultPath(p)
  }, [])

  const newNote = useCallback(
    async (folder = ''): Promise<void> => {
      const note = await window.lumen.createNote('Untitled', folder)
      await refresh()
      setActivePath(note.path)
      setRenamingPath(note.path) // let the user name it immediately
    },
    [refresh]
  )

  const moveNote = useCallback(
    async (path: string, folder: string): Promise<void> => {
      const target = await window.lumen.moveNote(path, folder)
      if (activePath === path) setActivePath(target)
      await refresh()
    },
    [activePath, refresh]
  )

  const createFolder = useCallback(
    async (rel: string): Promise<void> => {
      await window.lumen.createFolder(rel)
      await refresh()
    },
    [refresh]
  )

  const renameFolder = useCallback(
    async (rel: string, newName: string): Promise<void> => {
      await window.lumen.renameFolder(rel, newName)
      await refresh()
    },
    [refresh]
  )

  const deleteFolder = useCallback(
    async (rel: string): Promise<void> => {
      await window.lumen.deleteFolder(rel)
      await refresh()
    },
    [refresh]
  )

  const commitRename = useCallback(
    async (path: string, rawName: string): Promise<void> => {
      setRenamingPath(null)
      const name = sanitize(rawName)
      const current = path.slice(dirOf(path).length).replace(/\.md$/, '')
      if (!name || name === current) return
      const newPath = `${dirOf(path)}${name}.md`
      await window.lumen.renameNote(path, newPath)
      if (activePath === path) setActivePath(newPath)
      await refresh()
    },
    [activePath, refresh]
  )

  // Open a note by its [[wikilink]] name; create it if it doesn't exist yet.
  const openWikilink = useCallback(
    async (name: string): Promise<void> => {
      const lower = name.toLowerCase()
      const existing = notes.find((n) => n.name.replace(/\.md$/, '').toLowerCase() === lower)
      if (existing) {
        setActivePath(existing.path)
      } else {
        const note = await window.lumen.createNote(name)
        await refresh()
        setActivePath(note.path)
      }
    },
    [notes, refresh]
  )

  // Graph stays open: clicked notes open in the editor next to it.
  const openGraphNode = useCallback(
    (node: GraphNode): void => {
      if (node.exists) setActivePath(node.id)
      else openWikilink(node.name)
    },
    [openWikilink]
  )

  const deleteNote = useCallback(
    async (path: string): Promise<void> => {
      await window.lumen.deleteNote(path)
      if (activePath === path) setActivePath(null)
      await refresh()
    },
    [activePath, refresh]
  )

  // Global keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      } else if (mod && e.key === 'b') {
        e.preventDefault()
        setCollapsed((c) => !c)
      } else if (mod && e.key === 'n') {
        e.preventDefault()
        if (vaultPath) newNote()
      } else if (mod && e.key === 'g') {
        e.preventDefault()
        if (vaultPath) setGraphOpen((g) => !g)
      } else if (mod && e.key === 'e') {
        e.preventDefault()
        if (activePath) setView((v) => VIEW_CYCLE[(VIEW_CYCLE.indexOf(v) + 1) % VIEW_CYCLE.length])
      } else if (e.key === 'F2') {
        e.preventDefault()
        if (activePath) setRenamingPath(activePath)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [vaultPath, activePath, newNote])

  if (vaultPath === undefined) return <div className="h-screen w-screen bg-app" />
  if (vaultPath === null) return <Onboarding onChoose={chooseVault} />

  return (
    <div className="flex h-screen w-screen flex-col bg-app text-text-primary">
      <TitleBar
        onToggleSidebar={() => setCollapsed((c) => !c)}
        view={view}
        onCycleView={() =>
          setView((v) => VIEW_CYCLE[(VIEW_CYCLE.indexOf(v) + 1) % VIEW_CYCLE.length])
        }
        hasNote={!!activePath}
        graphOpen={graphOpen}
        onToggleGraph={() => setGraphOpen((g) => !g)}
      />
      <div className="flex min-h-0 flex-1">
        {!collapsed && (
          <Sidebar
            notes={notes}
            folders={folders}
            activePath={activePath}
            renamingPath={renamingPath}
            onSelect={setActivePath}
            onNewNote={newNote}
            onStartRename={setRenamingPath}
            onCommitRename={commitRename}
            onCancelRename={() => setRenamingPath(null)}
            onDelete={deleteNote}
            onMoveNote={moveNote}
            onCreateFolder={createFolder}
            onRenameFolder={renameFolder}
            onDeleteFolder={deleteFolder}
          />
        )}
        <MainPanel activePath={activePath} view={view} onWikilinkClick={openWikilink} />
        {graphOpen && (
          <div className="flex w-[42%] shrink-0 border-l border-border">
            <GraphView onOpenNode={openGraphNode} activePath={activePath} />
          </div>
        )}
      </div>
      <CommandPalette
        open={paletteOpen}
        notes={notes}
        onClose={() => setPaletteOpen(false)}
        onOpenNote={setActivePath}
        onShowGraph={() => setGraphOpen(true)}
      />
    </div>
  )
}

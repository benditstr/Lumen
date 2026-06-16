import { useEffect, useRef, useState } from 'react'
import type { NoteMeta } from '../types'

interface Props {
  notes: NoteMeta[]
  folders: string[]
  activePath: string | null
  renamingPath: string | null
  onSelect: (path: string) => void
  onNewNote: (folder: string) => void
  onStartRename: (path: string) => void
  onCommitRename: (path: string, newName: string) => void
  onCancelRename: () => void
  onDelete: (path: string) => void
  onMoveNote: (path: string, folder: string) => void
  onCreateFolder: (rel: string) => void
  onRenameFolder: (rel: string, newName: string) => void
  onDeleteFolder: (rel: string) => void
}

type Menu =
  | { kind: 'note'; path: string; folder: string; x: number; y: number; move: boolean }
  | { kind: 'folder'; rel: string; x: number; y: number }

interface FolderNode {
  rel: string
  name: string
  children: FolderNode[]
}

const titleOf = (name: string): string => name.replace(/\.md$/, '')
const DRAG_TYPE = 'text/lumen-note'

// folders arrive sorted, so parents always precede their children.
function buildTree(folders: string[]): FolderNode[] {
  const roots: FolderNode[] = []
  const byRel = new Map<string, FolderNode>()
  for (const rel of folders) {
    const node: FolderNode = { rel, name: rel.split('/').pop() ?? rel, children: [] }
    byRel.set(rel, node)
    const parent = rel.includes('/') ? byRel.get(rel.slice(0, rel.lastIndexOf('/'))) : undefined
    if (parent) parent.children.push(node)
    else roots.push(node)
  }
  return roots
}

function RenameInput({
  initial,
  onCommit,
  onCancel
}: {
  initial: string
  onCommit: (name: string) => void
  onCancel: () => void
}): JSX.Element {
  const ref = useRef<HTMLInputElement>(null)
  const [val, setVal] = useState(initial)
  const done = useRef(false)

  useEffect(() => {
    ref.current?.focus()
    ref.current?.select()
  }, [])

  const commit = (): void => {
    if (done.current) return
    done.current = true
    onCommit(val)
  }
  const cancel = (): void => {
    if (done.current) return
    done.current = true
    onCancel()
  }

  return (
    <input
      ref={ref}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Enter') {
          e.preventDefault()
          commit()
        } else if (e.key === 'Escape') {
          e.preventDefault()
          cancel()
        }
      }}
      className="w-full rounded bg-surface px-2 py-1.5 text-sm text-text-primary outline-none ring-1 ring-accent"
    />
  )
}

export default function Sidebar({
  notes,
  folders,
  activePath,
  renamingPath,
  onSelect,
  onNewNote,
  onStartRename,
  onCommitRename,
  onCancelRename,
  onDelete,
  onMoveNote,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder
}: Props): JSX.Element {
  const [menu, setMenu] = useState<Menu | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [dragOver, setDragOver] = useState<string | null>(null) // folder rel or '' = root
  const [newFolderParent, setNewFolderParent] = useState<string | null>(null)
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null)

  const tree = buildTree(folders)
  const notesIn = (folder: string): NoteMeta[] => notes.filter((n) => n.folder === folder)

  const toggleCollapse = (rel: string): void =>
    setCollapsed((c) => {
      const next = new Set(c)
      next.has(rel) ? next.delete(rel) : next.add(rel)
      return next
    })

  const acceptDrag = (e: React.DragEvent, target: string): void => {
    if (!Array.from(e.dataTransfer.types).includes(DRAG_TYPE)) return
    e.preventDefault()
    e.stopPropagation()
    if (dragOver !== target) setDragOver(target)
  }

  const dropNote = (e: React.DragEvent, target: string): void => {
    if (!Array.from(e.dataTransfer.types).includes(DRAG_TYPE)) return
    e.preventDefault()
    e.stopPropagation()
    setDragOver(null)
    const path = e.dataTransfer.getData(DRAG_TYPE)
    if (path) onMoveNote(path, target)
  }

  const newFolderInput = (parent: string, depth: number): JSX.Element => (
    <div style={{ paddingLeft: depth * 14 }}>
      <RenameInput
        initial=""
        onCommit={(name) => {
          setNewFolderParent(null)
          const clean = name.trim()
          if (clean) onCreateFolder(parent ? `${parent}/${clean}` : clean)
        }}
        onCancel={() => setNewFolderParent(null)}
      />
    </div>
  )

  const noteRow = (n: NoteMeta, depth: number): JSX.Element =>
    n.path === renamingPath ? (
      <RenameInput
        key={n.path}
        initial={titleOf(n.name)}
        onCommit={(name) => onCommitRename(n.path, name)}
        onCancel={onCancelRename}
      />
    ) : (
      <button
        key={n.path}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData(DRAG_TYPE, n.path)
          e.dataTransfer.effectAllowed = 'move'
        }}
        onClick={() => onSelect(n.path)}
        onDoubleClick={() => onStartRename(n.path)}
        onContextMenu={(e) => {
          e.preventDefault()
          setMenu({
            kind: 'note',
            path: n.path,
            folder: n.folder,
            x: e.clientX,
            y: e.clientY,
            move: false
          })
        }}
        style={{ paddingLeft: 8 + depth * 14 }}
        className={`block w-full overflow-hidden whitespace-nowrap text-ellipsis rounded py-1.5 pr-2 text-left text-sm ${
          n.path === activePath
            ? 'bg-surface text-text-primary'
            : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
        }`}
      >
        {titleOf(n.name)}
      </button>
    )

  const folderRows = (node: FolderNode, depth: number): JSX.Element => {
    const isCollapsed = collapsed.has(node.rel)
    return (
      <div key={node.rel}>
        {renamingFolder === node.rel ? (
          <RenameInput
            initial={node.name}
            onCommit={(name) => {
              setRenamingFolder(null)
              if (name.trim() && name.trim() !== node.name) onRenameFolder(node.rel, name.trim())
            }}
            onCancel={() => setRenamingFolder(null)}
          />
        ) : (
          <button
            onClick={() => toggleCollapse(node.rel)}
            onContextMenu={(e) => {
              e.preventDefault()
              setMenu({ kind: 'folder', rel: node.rel, x: e.clientX, y: e.clientY })
            }}
            onDragOver={(e) => acceptDrag(e, node.rel)}
            onDragLeave={() => setDragOver((d) => (d === node.rel ? null : d))}
            onDrop={(e) => dropNote(e, node.rel)}
            style={{ paddingLeft: 8 + depth * 14 }}
            className={`flex w-full items-center gap-1 overflow-hidden whitespace-nowrap rounded py-1.5 pr-2 text-left text-sm font-medium ${
              dragOver === node.rel
                ? 'bg-surface text-accent ring-1 ring-accent'
                : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
            }`}
          >
            <svg
              width="9"
              height="9"
              viewBox="0 0 10 10"
              className={`shrink-0 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
            >
              <path d="M3 1l4 4-4 4" stroke="currentColor" fill="none" strokeWidth="1.5" />
            </svg>
            <span className="overflow-hidden text-ellipsis">{node.name}</span>
          </button>
        )}
        {!isCollapsed && (
          <div>
            {newFolderParent === node.rel && newFolderInput(node.rel, depth + 1)}
            {node.children.map((c) => folderRows(c, depth + 1))}
            {notesIn(node.rel).map((n) => noteRow(n, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <aside className="relative flex w-[220px] shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-text-secondary">
          Notes
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setNewFolderParent('')}
            title="New folder"
            className="flex h-5 w-5 items-center justify-center rounded text-text-secondary hover:bg-surface-hover hover:text-text-primary"
          >
            <svg width="13" height="13" viewBox="0 0 15 15" fill="none">
              <path
                d="M1.5 3.5h4l1.5 2h6.5v6.5h-12v-8.5z"
                stroke="currentColor"
                strokeLinejoin="round"
              />
              <path d="M7.5 8v3M6 9.5h3" stroke="currentColor" />
            </svg>
          </button>
          <button
            onClick={() => onNewNote('')}
            title="New note (Cmd+N)"
            className="flex h-5 w-5 items-center justify-center rounded text-base text-text-secondary hover:bg-surface-hover hover:text-text-primary"
          >
            +
          </button>
        </div>
      </div>

      <div
        className={`min-h-0 flex-1 overflow-y-auto px-2 pb-2 ${
          dragOver === '' ? 'bg-surface/40' : ''
        }`}
        onDragOver={(e) => acceptDrag(e, '')}
        onDragLeave={() => setDragOver((d) => (d === '' ? null : d))}
        onDrop={(e) => dropNote(e, '')}
      >
        {newFolderParent === '' && newFolderInput('', 0)}
        {tree.map((node) => folderRows(node, 0))}
        {notesIn('').map((n) => noteRow(n, 0))}
        {notes.length === 0 && folders.length === 0 && newFolderParent === null && (
          <p className="px-2 py-4 text-sm leading-relaxed text-text-secondary">
            No notes yet. Press Cmd+N to create one.
          </p>
        )}
      </div>

      {menu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault()
              setMenu(null)
            }}
          />
          <div
            className="fixed z-50 min-w-[150px] overflow-hidden rounded-md border border-border bg-surface py-1 text-sm shadow-xl"
            style={{ left: menu.x, top: menu.y }}
          >
            {menu.kind === 'note' && !menu.move && (
              <>
                <button
                  className="block w-full px-3 py-1.5 text-left text-text-primary hover:bg-surface-hover"
                  onClick={() => {
                    onStartRename(menu.path)
                    setMenu(null)
                  }}
                >
                  Rename
                </button>
                <button
                  className="block w-full px-3 py-1.5 text-left text-text-primary hover:bg-surface-hover"
                  onClick={() => setMenu({ ...menu, move: true })}
                >
                  Move to…
                </button>
                <button
                  className="block w-full px-3 py-1.5 text-left text-red-400 hover:bg-surface-hover"
                  onClick={() => {
                    onDelete(menu.path)
                    setMenu(null)
                  }}
                >
                  Delete
                </button>
              </>
            )}
            {menu.kind === 'note' && menu.move && (
              <div className="max-h-[40vh] overflow-y-auto">
                {['', ...folders]
                  .filter((f) => f !== menu.folder)
                  .map((f) => (
                    <button
                      key={f || '(root)'}
                      className="block w-full overflow-hidden whitespace-nowrap text-ellipsis px-3 py-1.5 text-left text-text-primary hover:bg-surface-hover"
                      onClick={() => {
                        onMoveNote(menu.path, f)
                        setMenu(null)
                      }}
                    >
                      {f === '' ? 'Notes (root)' : f}
                    </button>
                  ))}
              </div>
            )}
            {menu.kind === 'folder' && (
              <>
                <button
                  className="block w-full px-3 py-1.5 text-left text-text-primary hover:bg-surface-hover"
                  onClick={() => {
                    onNewNote(menu.rel)
                    setMenu(null)
                  }}
                >
                  New note
                </button>
                <button
                  className="block w-full px-3 py-1.5 text-left text-text-primary hover:bg-surface-hover"
                  onClick={() => {
                    setNewFolderParent(menu.rel)
                    setCollapsed((c) => {
                      const next = new Set(c)
                      next.delete(menu.rel)
                      return next
                    })
                    setMenu(null)
                  }}
                >
                  New folder
                </button>
                <button
                  className="block w-full px-3 py-1.5 text-left text-text-primary hover:bg-surface-hover"
                  onClick={() => {
                    setRenamingFolder(menu.rel)
                    setMenu(null)
                  }}
                >
                  Rename
                </button>
                <button
                  className="block w-full px-3 py-1.5 text-left text-red-400 hover:bg-surface-hover"
                  onClick={() => {
                    onDeleteFolder(menu.rel)
                    setMenu(null)
                  }}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </>
      )}
    </aside>
  )
}

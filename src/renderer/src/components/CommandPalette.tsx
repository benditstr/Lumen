import { useEffect, useRef, useState } from 'react'
import type { NoteMeta, SearchResult } from '../types'

interface Props {
  open: boolean
  notes: NoteMeta[]
  onClose: () => void
  onOpenNote: (path: string) => void
  onShowGraph: () => void
}

interface Item {
  name: string
  path: string
  excerpt?: string
}

const titleOf = (name: string): string => name.replace(/\.md$/, '')

export default function CommandPalette({
  open,
  notes,
  onClose,
  onOpenNote,
  onShowGraph
}: Props): JSX.Element | null {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selected, setSelected] = useState(0)

  // Recent notes (newest first) shown when the query is empty.
  const recent: Item[] = notes.slice(0, 5).map((n) => ({ name: n.name, path: n.path }))
  const items: Item[] = query.trim() ? results : recent

  // Reset and focus when opened.
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setSelected(0)
      // focus after paint
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  // Debounced fuzzy search.
  useEffect(() => {
    if (!open) return
    const q = query.trim()
    if (!q) {
      setResults([])
      return
    }
    const h = setTimeout(() => {
      window.lumen.search(q).then((r) => {
        setResults(r)
        setSelected(0)
      })
    }, 120)
    return () => clearTimeout(h)
  }, [query, open])

  useEffect(() => {
    setSelected(0)
  }, [items.length])

  if (!open) return null

  const choose = (item: Item | undefined): void => {
    if (!item) return
    onOpenNote(item.path)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 pt-[18vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[560px] overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes…"
          className="w-full bg-transparent px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary outline-none"
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setSelected((s) => Math.min(s + 1, items.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setSelected((s) => Math.max(s - 1, 0))
            } else if (e.key === 'Enter') {
              e.preventDefault()
              choose(items[selected])
            } else if (e.key === 'Escape') {
              e.preventDefault()
              onClose()
            }
          }}
        />
        <div className="max-h-[320px] overflow-y-auto border-t border-border">
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-text-secondary">
              {query.trim() ? 'No matches' : 'No notes yet'}
            </p>
          ) : (
            <>
              {!query.trim() && (
                <>
                  <button
                    onClick={() => {
                      onShowGraph()
                      onClose()
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-hover"
                  >
                    ◉ Graph view
                    <span className="float-right text-xs text-text-secondary">Cmd+G</span>
                  </button>
                  <p className="border-t border-border px-4 pt-3 pb-1 text-xs uppercase tracking-wide text-text-secondary">
                    Recent
                  </p>
                </>
              )}
              {items.map((item, i) => (
                <button
                  key={item.path}
                  onMouseEnter={() => setSelected(i)}
                  onClick={() => choose(item)}
                  className={`block w-full px-4 py-2 text-left ${
                    i === selected ? 'bg-surface-hover' : ''
                  }`}
                >
                  <div className="overflow-hidden whitespace-nowrap text-ellipsis text-sm text-text-primary">
                    {titleOf(item.name)}
                  </div>
                  {item.excerpt ? (
                    <div className="overflow-hidden whitespace-nowrap text-ellipsis text-xs text-text-secondary">
                      {item.excerpt}
                    </div>
                  ) : null}
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

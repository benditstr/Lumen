import type { ViewMode } from '../types'

interface Props {
  onToggleSidebar: () => void
  view: ViewMode
  onCycleView: () => void
  hasNote: boolean
  graphOpen: boolean
  onToggleGraph: () => void
}

const viewLabel: Record<ViewMode, string> = {
  edit: 'Edit',
  split: 'Split',
  preview: 'Preview'
}

export default function TitleBar({
  onToggleSidebar,
  view,
  onCycleView,
  hasNote,
  graphOpen,
  onToggleGraph
}: Props): JSX.Element {
  return (
    <header className="drag-region flex h-10 shrink-0 items-center gap-2 border-b border-border bg-sidebar px-3">
      <div className="w-14" />
      <button
        onClick={onToggleSidebar}
        title="Toggle sidebar (Cmd+B)"
        className="no-drag flex h-6 w-6 items-center justify-center rounded text-text-secondary hover:bg-surface-hover hover:text-text-primary"
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <rect x="1.5" y="2.5" width="12" height="10" rx="1.5" stroke="currentColor" />
          <line x1="5.5" y1="2.5" x2="5.5" y2="12.5" stroke="currentColor" />
        </svg>
      </button>
      <div className="flex-1 text-center text-xs font-medium tracking-wide text-text-secondary">
        Lumen
      </div>
      <button
        onClick={onToggleGraph}
        title="Toggle graph view (Cmd+G)"
        className={`no-drag flex h-6 w-6 items-center justify-center rounded hover:bg-surface-hover hover:text-text-primary ${
          graphOpen ? 'text-accent' : 'text-text-secondary'
        }`}
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <circle cx="3.5" cy="11.5" r="1.8" stroke="currentColor" />
          <circle cx="7.5" cy="3.5" r="1.8" stroke="currentColor" />
          <circle cx="11.5" cy="11.5" r="1.8" stroke="currentColor" />
          <line x1="4.4" y1="9.9" x2="6.7" y2="5.2" stroke="currentColor" />
          <line x1="10.6" y1="9.9" x2="8.3" y2="5.2" stroke="currentColor" />
        </svg>
      </button>
      {hasNote ? (
        <button
          onClick={onCycleView}
          title="Cycle edit / split / preview (Cmd+E)"
          className="no-drag rounded px-2 py-1 text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary"
        >
          {viewLabel[view]}
        </button>
      ) : (
        <div className="w-14" />
      )}
    </header>
  )
}

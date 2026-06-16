import Editor from './Editor'
import type { ViewMode } from '../types'

interface Props {
  activePath: string | null
  view: ViewMode
  onWikilinkClick: (name: string) => void
}

export default function MainPanel({ activePath, view, onWikilinkClick }: Props): JSX.Element {
  return (
    <main className="min-w-0 flex-1 bg-editor">
      {activePath ? (
        <Editor path={activePath} view={view} onWikilinkClick={onWikilinkClick} />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-text-secondary">
          Select a note, or press Cmd+N to create one
        </div>
      )}
    </main>
  )
}

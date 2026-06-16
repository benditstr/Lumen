import { useEffect, useRef, useState } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, drawSelection, highlightActiveLine } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { lumenEditorTheme } from '../lib/editorTheme'
import { renderMarkdown } from '../lib/markdown'
import { debounce } from '../lib/debounce'
import type { ViewMode } from '../types'

interface Props {
  path: string
  view: ViewMode
  onWikilinkClick: (name: string) => void
}

const ATTACHMENT_EXT = /\.(png|jpe?g|gif|webp|svg|bmp|avif|pdf)$/i

export default function Editor({ path, view, onWikilinkClick }: Props): JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const docPathRef = useRef<string>(path) // which note the current doc belongs to
  const loadingRef = useRef(false) // true while programmatically loading a file
  const dirtyRef = useRef(false) // true when the doc has unsaved user edits
  const saveRef = useRef<ReturnType<typeof debounce<[string, string]>> | null>(null)
  const [previewHtml, setPreviewHtml] = useState('')

  // One debounced saver for the editor's lifetime.
  useEffect(() => {
    saveRef.current = debounce((p: string, content: string) => {
      window.lumen.writeNote(p, content)
      dirtyRef.current = false
    }, 500)
    return () => saveRef.current?.cancel()
  }, [])

  // Create the CodeMirror instance once.
  useEffect(() => {
    if (!hostRef.current) return
    const updateListener = EditorView.updateListener.of((u) => {
      if (!u.docChanged) return
      const content = u.state.doc.toString()
      setPreviewHtml(renderMarkdown(content))
      if (loadingRef.current) return
      dirtyRef.current = true
      saveRef.current?.(docPathRef.current, content)
    })

    const state = EditorState.create({
      doc: '',
      extensions: [
        history(),
        drawSelection(),
        highlightActiveLine(),
        EditorView.lineWrapping,
        markdown(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        lumenEditorTheme,
        updateListener
      ]
    })
    const cm = new EditorView({ state, parent: hostRef.current })
    viewRef.current = cm

    return () => {
      if (dirtyRef.current) window.lumen.writeNote(docPathRef.current, cm.state.doc.toString())
      cm.destroy()
      viewRef.current = null
    }
  }, [])

  // Load note content whenever the active path changes.
  useEffect(() => {
    const cm = viewRef.current
    if (!cm) return
    let cancelled = false

    if (docPathRef.current && docPathRef.current !== path && dirtyRef.current) {
      saveRef.current?.cancel()
      window.lumen.writeNote(docPathRef.current, cm.state.doc.toString())
      dirtyRef.current = false
    }

    window.lumen.readNote(path).then((content) => {
      if (cancelled || !viewRef.current) return
      const v = viewRef.current
      docPathRef.current = path
      loadingRef.current = true
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: content } })
      loadingRef.current = false
      dirtyRef.current = false
      setPreviewHtml(renderMarkdown(content))
    })

    return () => {
      cancelled = true
    }
  }, [path])

  // Focus on edit-capable view, but never steal focus from another input.
  useEffect(() => {
    if (view === 'preview') return
    const active = document.activeElement
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return
    viewRef.current?.focus()
  }, [view, path])

  // Drag & drop: copy PDF/image into the vault and insert ![[name]] at the drop.
  const onDrop = async (e: React.DragEvent): Promise<void> => {
    const files = Array.from(e.dataTransfer.files).filter((f) => ATTACHMENT_EXT.test(f.name))
    if (files.length === 0) return
    e.preventDefault()
    const cm = viewRef.current
    if (!cm) return
    const pos = cm.posAtCoords({ x: e.clientX, y: e.clientY }) ?? cm.state.selection.main.head
    let insert = ''
    for (const file of files) {
      const buf = new Uint8Array(await file.arrayBuffer())
      const saved = await window.lumen.saveAttachment(file.name, buf)
      insert += `![[${saved}]]\n`
    }
    if (insert) {
      cm.dispatch({ changes: { from: pos, insert }, selection: { anchor: pos + insert.length } })
      cm.focus()
    }
  }

  const onDragOver = (e: React.DragEvent): void => {
    if (Array.from(e.dataTransfer.types).includes('Files')) e.preventDefault()
  }

  // Delegated preview clicks: PDF cards open in the system viewer,
  // [[wikilinks]] navigate to (or create) the linked note.
  const onPreviewClick = (e: React.MouseEvent): void => {
    const target = e.target as HTMLElement
    const attachment = target.closest('[data-attachment]')
    if (attachment) {
      e.preventDefault()
      const name = attachment.getAttribute('data-attachment')
      if (name) window.lumen.openAttachment(name)
      return
    }
    const wikilink = target.closest('[data-wikilink]')
    if (wikilink) {
      e.preventDefault()
      const name = wikilink.getAttribute('data-wikilink')
      if (name) onWikilinkClick(name)
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full">
      <div
        ref={hostRef}
        onDrop={onDrop}
        onDragOver={onDragOver}
        className={`h-full min-w-0 overflow-hidden ${
          view === 'preview' ? 'hidden' : view === 'split' ? 'w-1/2 border-r border-border' : 'w-full'
        }`}
      />
      {view !== 'edit' && (
        <div
          onClick={onPreviewClick}
          className={`h-full min-w-0 overflow-auto bg-editor px-10 py-6 ${
            view === 'split' ? 'w-1/2' : 'w-full'
          }`}
        >
          <article
            className="prose prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      )}
    </div>
  )
}

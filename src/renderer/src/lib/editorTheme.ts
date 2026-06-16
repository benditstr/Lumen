import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'

const base = EditorView.theme(
  {
    '&': { color: '#e8e8e6', backgroundColor: '#1a1a1a', height: '100%' },
    '&.cm-focused': { outline: 'none' },
    '.cm-scroller': {
      fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
      fontSize: '14px',
      lineHeight: '1.7',
      overflow: 'auto'
    },
    '.cm-content': { caretColor: '#a78bfa', padding: '24px 0' },
    '.cm-line': { padding: '0 32px' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#a78bfa' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      backgroundColor: '#2e2e2e'
    },
    '.cm-content ::selection': { backgroundColor: '#2e2e2e' },
    '.cm-gutters': { display: 'none' },
    '.cm-activeLine': { backgroundColor: 'transparent' }
  },
  { dark: true }
)

const highlight = HighlightStyle.define([
  { tag: t.heading1, fontSize: '1.5em', fontWeight: '700', color: '#e8e8e6' },
  { tag: t.heading2, fontSize: '1.3em', fontWeight: '700', color: '#e8e8e6' },
  { tag: [t.heading3, t.heading4, t.heading5, t.heading6], fontWeight: '700', color: '#e8e8e6' },
  { tag: t.strong, fontWeight: '700', color: '#e8e8e6' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through', color: '#888884' },
  { tag: [t.link, t.url], color: '#a78bfa', textDecoration: 'underline' },
  { tag: t.monospace, color: '#a78bfa' },
  { tag: t.quote, color: '#888884', fontStyle: 'italic' },
  { tag: [t.list, t.meta, t.processingInstruction], color: '#888884' }
])

export const lumenEditorTheme = [base, syntaxHighlighting(highlight)]

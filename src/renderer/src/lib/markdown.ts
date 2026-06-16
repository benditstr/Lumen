import { marked } from 'marked'

marked.setOptions({ gfm: true, breaks: true })

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i

const escapeAttr = (s: string): string => s.replace(/"/g, '&quot;')
const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Expand Obsidian-style ![[embeds]] before handing off to marked.
// Images become <img> served by the lumen-attachment:// scheme; everything
// else (PDFs, etc.) becomes a clickable card opened via a delegated handler.
function expandEmbeds(md: string): string {
  return md.replace(/!\[\[([^\]]+)\]\]/g, (_match, raw: string) => {
    const name = raw.trim()
    const url = `lumen-attachment://${encodeURIComponent(name)}`
    if (IMAGE_EXT.test(name)) {
      return `<img src="${url}" alt="${escapeAttr(name)}" class="lumen-embed-img" />`
    }
    return `<a href="#" data-attachment="${escapeAttr(name)}" class="lumen-pdf-card">📄 ${escapeHtml(name)}</a>`
  })
}

// [[Note]] / [[Note|Alias]] / [[Note#Section]] become in-app navigation links,
// resolved by name in the preview's delegated click handler.
function expandWikilinks(md: string): string {
  return md.replace(
    /(?<!!)\[\[([^\]|#\n]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g,
    (_match, target: string, alias?: string) => {
      const name = target.trim().replace(/\.md$/i, '')
      const label = (alias ?? name).trim()
      return `<a href="#" data-wikilink="${escapeAttr(name)}" class="lumen-wikilink">${escapeHtml(label)}</a>`
    }
  )
}

export function renderMarkdown(md: string): string {
  return marked.parse(expandWikilinks(expandEmbeds(md)), { async: false }) as string
}

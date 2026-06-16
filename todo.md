# Lumen — MVP Todo

## Phase 1: Project Setup
- [ ] Initialize Electron + Vite + React project
- [ ] Configure Tailwind CSS
- [ ] Set up TypeScript strict mode
- [ ] Configure electron-builder for Mac + Windows

## Phase 2: Core Layout
- [ ] App shell (sidebar + main panel)
- [ ] Sidebar: file tree of vault
- [ ] Main panel: placeholder editor area
- [ ] Title bar (frameless window, custom drag region)

## Phase 3: Note Editor (Feature 1)
- [ ] Integrate CodeMirror 6
- [ ] Markdown syntax highlighting
- [ ] Live preview toggle (split / preview / edit)
- [ ] Auto-save on change (debounced, 500ms)
- [ ] New note, rename note, delete note

## Phase 4: Quick Retrieval (Feature 2)
- [ ] Command Palette (Cmd+K)
- [ ] Fuzzy search over all note titles + content (Fuse.js)
- [ ] Keyboard navigation (arrow keys + Enter)
- [ ] Recent files list when palette opens empty

## Phase 5: Media Attachments (Feature 3)
- [ ] Drag & drop PDF/image into editor
- [ ] Save attachment to /attachments subfolder in vault
- [ ] Insert markdown reference (![[filename]])
- [ ] Inline image preview in editor
- [ ] PDF viewer (inline embed or click-to-open)

## Phase 6: Vault Setup
- [ ] First-launch onboarding: choose vault folder
- [ ] Remember vault path (electron-store)
- [ ] Watch vault folder for external changes (chokidar)
- [ ] iCloud/Dropbox compatible (no lock files, plain .md)

## Backlog (v2)
- [ ] Claude integration (session summarizer, context loader, auto-tagger)
- [ ] SQLite index for faster search
- [ ] Knowledge graph view
- [ ] Mobile (React Native)
- [ ] Tags + frontmatter support

# Lumen — Phase Tracker

## Phase 1 — Project Setup  DONE
- [x] electron-vite + React 18 + TS strict + Tailwind, frameless #0f0f0f window
- [x] Verified: install / typecheck / build / clean boot

## Phase 2 — Core Layout  DONE
- [x] TitleBar + Sidebar (220px, Cmd+B) + MainPanel; onboarding folder picker
- [x] Verified: clean boot + visual layout

## Vault foundation (Phase 6 core)  DONE
- [x] electron-store path; vault.ts FS ops + traversal guard + Fuse + chokidar
- [x] Typed IPC surface (vault:*) via contextBridge
- [x] Verified: 17/17 headless FS smoke checks

## Phase 3 — Note Editor  DONE
- [x] CodeMirror 6 + md highlighting; split/preview (Cmd+E); 500ms autosave
- [x] New (Cmd+N) / rename (F2) / delete (right-click)
- [x] Verified: 7/7 Playwright E2E on built app

## Phase 4 — Command Palette  DONE
- [x] Cmd+K overlay (560px), Esc close, Recent on empty
- [x] Fuse fuzzy over titles+content; arrow nav + Enter
- [x] Verified: Cmd+K/Recent/typing-updates-query/Enter-opens/Escape; search logic headless-proven

## Phase 5 — Media Attachments  DONE
- [x] lumen-attachment:// privileged protocol; CSP img-src widened
- [x] ![[embed]] -> inline <img> / clickable PDF card (system viewer)
- [x] Drag & drop -> attachments/ + ![[name]] insert at cursor
- [x] Verified: image loads via protocol, pdf card, saveAttachment, drag-drop (E2E)

## Phase 6 — Wikilinks + Graph View  DONE
- [x] [[Wikilink]] parsing in main (buildGraph: nodes/edges, ghost nodes)
- [x] vault:graph IPC + preload getGraph()
- [x] Clickable [[links]] in preview (delegated handler, create-on-click)
- [x] GraphView.tsx: d3-force + canvas, pan/zoom/drag/hover, click opens note
- [x] Toggle: TitleBar button + Cmd+G + palette entry
- [x] Verified: 9/9 headless (scripts/graph-smoke.mjs) + 6/6 E2E
      (scripts/e2e-graph.mjs) incl. ghost-link create + graph screenshot

## Phase 7 — App Icon + Packaging  DONE
- [x] Icon pipeline: scripts/icon-main.cjs + make-icon.mjs (playwright
      screenshot, omitBackground) + png-to-icns.sh; npm run icon
- [x] electron-builder.yml + npm run dist (dmg + dir, arm64, unsigned)
- [x] Verified: dist/mac-arm64/Lumen.app launches via `open`, correct
      userData dir, quits cleanly; Lumen-0.1.0-arm64.dmg built

## Phase 8 — Claude Session Hook  DONE (format customization open)
- [x] ~/.claude/hooks/lumen-save-session.mjs (SessionEnd -> note in vault,
      vault path read from lumen.json electron-store file — NOT config.json)
- [x] Registered SessionEnd in ~/.claude/settings.json (additive, jq-validated)
- [x] Verified: synthetic transcript pipe-test -> note created with [[Lumen]]
      wikilink, noise filtered; test note removed afterwards
- [ ] formatSessionNote() customization by Ben (learning-mode contribution)
- [ ] Real session check: note appears after this session ends

## Phase 9 — Folders + Side-by-Side Graph + Limit-Safe Hook  DONE
- [x] Hook saves on every Stop (async) + SessionEnd; one note per session via
      session-id map in ~/.claude/hooks/.lumen-session-notes.json
- [x] Folder ops in vault.ts (listFolders/createFolder/renameFolder/
      deleteFolder/moveNote) + IPC/preload; NoteMeta.folder
- [x] Sidebar tree: collapsible folders, new-folder button, note/folder
      context menus (Move to…, New note/folder, Rename, Delete), drag & drop
- [x] Graph as right-side panel (Cmd+G), editor stays open; active note ring
- [x] Verified: hook double-pipe -> one updated note; 5/5 E2E
      (scripts/e2e-folders.mjs) incl. screenshot; npm run dist rebuilt
- [ ] Manual check by Ben: drag & drop note onto folder (Playwright can't
      simulate HTML5 DnD reliably)

## Backlog (v2)
- [ ] Built-in Claude chat panel (Agent SDK in main process, notes as context,
      sessions saved to vault) — replaces/extends the Phase 8 hook
- [ ] Editor autocomplete for [[wikilinks]]
- [ ] SQLite index, tags/frontmatter

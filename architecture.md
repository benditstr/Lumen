# Lumen — Architecture

## Overview
Always-on desktop knowledge app. Obsidian-inspired, Claude-connected (v2).
Vault = plain folder of .md files. Fully compatible with iCloud/Dropbox sync.

## Stack
- Electron + Vite (desktop shell)
- React + Tailwind (UI)
- CodeMirror 6 (editor)
- Fuse.js (fuzzy search)
- electron-store (settings persistence)
- chokidar (file watcher)
- better-sqlite3 (index, v2)

## Folder Structure (Runtime)
```
~/Lumen Vault/
  ├── notes/
  ├── attachments/
  └── .lumen/
      └── snapshots/     ← Claude memory (v2)
```

## Key Principles
- No backend, no account, no cloud dependency
- All data = plain files (portable, readable without app)
- iCloud sync = point vault at iCloud folder
- Claude integration non-destructive (snapshots are additive)

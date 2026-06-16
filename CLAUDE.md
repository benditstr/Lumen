# Lumen — Claude Code Config

## Project
Lumen is an always-on desktop knowledge app (Electron + React + TypeScript).
Obsidian-inspired. Vault = plain .md files. Claude integration in v2.

## Workflow Rules
1. Plan mode for any non-trivial task → write plan to tasks/todo.md
2. Use subagents to keep context clean
3. After corrections → update tasks/lessons.md
4. Never mark done without proving it works
5. Pause and ask "is there a more elegant way?" for non-trivial changes
6. Bug reports → fix autonomously, no hand-holding

## Code Style
- TypeScript strict mode
- Functional React components, hooks only
- Tailwind for all styling (no CSS modules, no inline styles)
- No unnecessary abstractions — simplicity first
- Minimal impact changes

## Stack
- Electron + Vite + React 18 + Tailwind CSS
- CodeMirror 6 (editor)
- Fuse.js (search)
- electron-store (persistence)
- chokidar (file watcher)

## Current Phase
Phases 1–8 implemented & verified: editor, command palette, attachments,
[[wikilinks]] + graph view (d3-force/canvas, Cmd+G), packaged Lumen.app with
icon (npm run dist), Claude SessionEnd hook -> vault notes. See tasks/todo.md
for status, tasks/lessons.md for environment notes. Next: v2 (in-app Claude
chat via Agent SDK).

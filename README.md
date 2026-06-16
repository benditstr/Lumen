# Lumen

**Lumen** ist eine always-on Desktop-Wissens-App im Stil von Obsidian. Dein Wissen lebt als ganz normale `.md`-Dateien in einem lokalen Ordner („Vault") — kein Lock-in, keine Cloud-Pflicht, volle Kontrolle über deine Daten.

Gebaut mit Electron, React und TypeScript.

---

## Features

- 📝 **Markdown-Editor** auf Basis von CodeMirror 6 — schnell, mit Syntax-Highlighting und Live-Vorschau
- 🗂️ **Vault = einfache `.md`-Dateien** in einem Ordner deiner Wahl; Lumen besitzt deine Daten nicht
- 🔗 **`[[Wikilinks]]`** zur Verknüpfung von Notizen
- 🕸️ **Graph-Ansicht** (`Cmd+G`) — visualisiert die Verbindungen zwischen deinen Notizen mit d3-force auf Canvas
- ⌘ **Command Palette** für schnelle Navigation und Aktionen
- 🔍 **Volltextsuche** über alle Notizen (Fuse.js)
- 📎 **Attachments** — Bilder und Dateien in Notizen einbetten
- 👀 **Live File-Watcher** (chokidar) — externe Änderungen am Vault werden sofort übernommen
- 💾 **Persistenz** der Einstellungen über electron-store

---

## Stack

| Bereich      | Technologie                          |
|--------------|--------------------------------------|
| Runtime      | Electron 33                          |
| Build-Tool   | electron-vite + Vite 5               |
| UI           | React 18 + TypeScript (strict)       |
| Styling      | Tailwind CSS 3                       |
| Editor       | CodeMirror 6                         |
| Suche        | Fuse.js                              |
| Graph        | d3-force (Canvas-Rendering)          |
| Speicher     | electron-store                       |
| File-Watcher | chokidar                             |

---

## Projektstruktur

```
src/
├── main/         # Electron Main-Prozess (Vault, IPC, Protokoll, Store)
│   ├── index.ts
│   ├── vault.ts
│   ├── ipc.ts
│   ├── protocol.ts
│   └── store.ts
├── preload/      # Preload-Bridge (sicherer Renderer-Zugriff)
└── renderer/     # React-Frontend
    └── src/
        ├── App.tsx
        └── components/
            ├── Editor.tsx        # Markdown-Editor (CodeMirror)
            ├── GraphView.tsx     # Graph-Ansicht
            ├── Sidebar.tsx       # Datei-/Ordnerbaum
            ├── MainPanel.tsx
            ├── CommandPalette.tsx
            ├── TitleBar.tsx
            └── Onboarding.tsx
```

---

## Setup

Voraussetzung: **Node.js** (getestet mit v24) und **npm**.

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsmodus (Hot Reload)
npm run dev
```

### Build & Packaging

```bash
# Production-Build
npm run build

# Build lokal als App ansehen
npm run preview

# macOS .app paketieren (mit Icon)
npm run dist
```

### Weitere Scripts

| Script               | Zweck                                      |
|----------------------|--------------------------------------------|
| `npm run typecheck`  | TypeScript-Prüfung (Node- + Web-Targets)   |
| `npm run icon`       | App-Icon generieren (`.png` → `.icns`)     |

---

## Status

Phasen 1–8 sind implementiert und verifiziert: Editor, Command Palette, Attachments,
`[[Wikilinks]]` + Graph-Ansicht, paketierte `Lumen.app` mit Icon sowie ein Claude
`SessionEnd`-Hook, der Notizen in den Vault schreibt.

**Geplant (v2):** In-App-Claude-Chat über das Agent SDK.

---

## Lizenz

Privates Projekt.

// Minimal Electron main that displays the Lumen icon artwork in a
// transparent 1024x1024 window. Driven by scripts/make-icon.mjs, which
// screenshots it with a transparent background.
const { app, BrowserWindow } = require('electron')

// macOS icon grid: 824px squircle centered on a 1024px transparent canvas.
const svg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#232323"/>
      <stop offset="1" stop-color="#0d0d0f"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#a78bfa" stop-opacity="0.85"/>
      <stop offset="0.45" stop-color="#a78bfa" stop-opacity="0.25"/>
      <stop offset="1" stop-color="#a78bfa" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="core" cx="0.5" cy="0.42" r="0.6">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="0.55" stop-color="#e6dcfe"/>
      <stop offset="1" stop-color="#a78bfa"/>
    </radialGradient>
  </defs>

  <rect x="100" y="100" width="824" height="824" rx="186" fill="url(#bg)"/>
  <rect x="103" y="103" width="818" height="818" rx="183" fill="none"
        stroke="#3a3a3e" stroke-width="3"/>

  <!-- faint constellation: linked notes -->
  <g stroke="#5b5470" stroke-width="5" opacity="0.55">
    <line x1="512" y1="512" x2="294" y2="354"/>
    <line x1="512" y1="512" x2="722" y2="338"/>
    <line x1="512" y1="512" x2="668" y2="712"/>
    <line x1="512" y1="512" x2="330" y2="680"/>
    <line x1="722" y1="338" x2="668" y2="712" opacity="0.5"/>
  </g>
  <g fill="#8d83a8">
    <circle cx="294" cy="354" r="26"/>
    <circle cx="722" cy="338" r="30"/>
    <circle cx="668" cy="712" r="24"/>
    <circle cx="330" cy="680" r="20"/>
  </g>

  <!-- the lumen: glowing center node -->
  <circle cx="512" cy="512" r="340" fill="url(#glow)"/>
  <circle cx="512" cy="512" r="108" fill="url(#core)"/>
</svg>`

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1024,
    height: 1024,
    useContentSize: true,
    frame: false,
    transparent: true,
    resizable: false
  })
  const html = `<html><body style="margin:0;background:transparent">${svg}</body></html>`
  win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))
})

import { protocol, net } from 'electron'
import { join, basename } from 'path'
import { pathToFileURL } from 'url'
import { getVaultPath } from './store'

export const ATTACHMENT_SCHEME = 'lumen-attachment'

// Must run before app 'ready' so the scheme is treated as secure/standard.
export function registerAttachmentSchemePrivileged(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: ATTACHMENT_SCHEME,
      privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true }
    }
  ])
}

// Serve vault/attachments/<name> for lumen-attachment://<name> requests.
export function handleAttachmentProtocol(): void {
  protocol.handle(ATTACHMENT_SCHEME, (request) => {
    const vault = getVaultPath()
    if (!vault) return new Response('No vault', { status: 404 })
    const url = new URL(request.url)
    const raw = decodeURIComponent(url.hostname || url.pathname.replace(/^\/+/, ''))
    const safe = basename(raw) // strip any path -> stay inside attachments/
    if (!safe) return new Response('Bad request', { status: 400 })
    const filePath = join(vault, 'attachments', safe)
    return net.fetch(pathToFileURL(filePath).toString())
  })
}

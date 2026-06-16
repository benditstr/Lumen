import { ipcMain, dialog, shell, BrowserWindow, IpcMainInvokeEvent } from 'electron'
import chokidar, { FSWatcher } from 'chokidar'
import { join } from 'path'
import * as vault from './vault'
import { getVaultPath, setVaultPath } from './store'

let watcher: FSWatcher | null = null

function requireVault(): string {
  const p = getVaultPath()
  if (!p) throw new Error('No vault selected')
  return p
}

export function registerIpc(): void {
  ipcMain.handle('vault:open-folder-dialog', async () => {
    const res = await dialog.showOpenDialog({
      title: 'Choose your Lumen vault',
      buttonLabel: 'Open Vault',
      properties: ['openDirectory', 'createDirectory']
    })
    if (res.canceled || res.filePaths.length === 0) return null
    const chosen = res.filePaths[0]
    await vault.ensureStructure(chosen)
    setVaultPath(chosen)
    return chosen
  })

  ipcMain.handle('vault:get-path', () => getVaultPath() ?? null)

  ipcMain.handle('vault:list-notes', () => vault.listNotes(requireVault()))

  ipcMain.handle('vault:read-note', (_e: IpcMainInvokeEvent, path: string) =>
    vault.readNote(requireVault(), path)
  )

  ipcMain.handle('vault:write-note', (_e: IpcMainInvokeEvent, path: string, content: string) =>
    vault.writeNote(requireVault(), path, content)
  )

  ipcMain.handle('vault:create-note', (_e: IpcMainInvokeEvent, name: string, folder?: string) =>
    vault.createNote(requireVault(), name, folder)
  )

  ipcMain.handle('vault:list-folders', () => vault.listFolders(requireVault()))

  ipcMain.handle('vault:create-folder', (_e: IpcMainInvokeEvent, rel: string) =>
    vault.createFolder(requireVault(), rel)
  )

  ipcMain.handle('vault:rename-folder', (_e: IpcMainInvokeEvent, rel: string, newName: string) =>
    vault.renameFolder(requireVault(), rel, newName)
  )

  ipcMain.handle('vault:delete-folder', (_e: IpcMainInvokeEvent, rel: string) =>
    vault.deleteFolder(requireVault(), rel)
  )

  ipcMain.handle('vault:move-note', (_e: IpcMainInvokeEvent, path: string, folderRel: string) =>
    vault.moveNote(requireVault(), path, folderRel)
  )

  ipcMain.handle('vault:rename-note', (_e: IpcMainInvokeEvent, oldPath: string, newPath: string) =>
    vault.renameNote(requireVault(), oldPath, newPath)
  )

  ipcMain.handle('vault:delete-note', (_e: IpcMainInvokeEvent, path: string) =>
    vault.deleteNote(requireVault(), path)
  )

  ipcMain.handle(
    'vault:save-attachment',
    (_e: IpcMainInvokeEvent, name: string, buffer: Uint8Array) =>
      vault.saveAttachment(requireVault(), name, buffer)
  )

  ipcMain.handle('vault:open-attachment', (_e: IpcMainInvokeEvent, name: string) =>
    vault.openAttachment(requireVault(), name)
  )

  ipcMain.handle('vault:search', (_e: IpcMainInvokeEvent, query: string) =>
    vault.search(requireVault(), query)
  )

  ipcMain.handle('vault:graph', () => vault.buildGraph(requireVault()))

  ipcMain.handle('vault:watch-start', (e: IpcMainInvokeEvent) => {
    if (watcher) return
    const v = requireVault()
    watcher = chokidar.watch([join(v, 'notes'), join(v, 'attachments')], {
      ignoreInitial: true,
      depth: 99
    })
    const notify = (): void => {
      BrowserWindow.fromWebContents(e.sender)?.webContents.send('vault:changed')
    }
    watcher
      .on('add', notify)
      .on('change', notify)
      .on('unlink', notify)
      .on('addDir', notify)
      .on('unlinkDir', notify)
  })

  // Open external http(s) links in the user's real browser, never in-app.
  ipcMain.handle('shell:open-external', (_e: IpcMainInvokeEvent, url: string) => {
    if (/^https?:\/\//.test(url)) return shell.openExternal(url)
    return Promise.resolve()
  })
}

export function stopWatcher(): void {
  watcher?.close()
  watcher = null
}

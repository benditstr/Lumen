import { contextBridge, ipcRenderer } from 'electron'

export interface NoteMeta {
  name: string
  path: string
  mtime: number
  folder: string
}

export interface SearchResult {
  name: string
  path: string
  excerpt: string
}

export interface GraphNode {
  id: string
  name: string
  exists: boolean
  linkCount: number
}

export interface VaultGraph {
  nodes: GraphNode[]
  edges: { source: string; target: string }[]
}

const api = {
  openFolderDialog: (): Promise<string | null> => ipcRenderer.invoke('vault:open-folder-dialog'),
  getPath: (): Promise<string | null> => ipcRenderer.invoke('vault:get-path'),
  listNotes: (): Promise<NoteMeta[]> => ipcRenderer.invoke('vault:list-notes'),
  readNote: (path: string): Promise<string> => ipcRenderer.invoke('vault:read-note', path),
  writeNote: (path: string, content: string): Promise<void> =>
    ipcRenderer.invoke('vault:write-note', path, content),
  createNote: (name: string, folder?: string): Promise<NoteMeta> =>
    ipcRenderer.invoke('vault:create-note', name, folder),
  listFolders: (): Promise<string[]> => ipcRenderer.invoke('vault:list-folders'),
  createFolder: (rel: string): Promise<string> => ipcRenderer.invoke('vault:create-folder', rel),
  renameFolder: (rel: string, newName: string): Promise<void> =>
    ipcRenderer.invoke('vault:rename-folder', rel, newName),
  deleteFolder: (rel: string): Promise<void> => ipcRenderer.invoke('vault:delete-folder', rel),
  moveNote: (path: string, folderRel: string): Promise<string> =>
    ipcRenderer.invoke('vault:move-note', path, folderRel),
  renameNote: (oldPath: string, newPath: string): Promise<void> =>
    ipcRenderer.invoke('vault:rename-note', oldPath, newPath),
  deleteNote: (path: string): Promise<void> => ipcRenderer.invoke('vault:delete-note', path),
  saveAttachment: (name: string, buffer: Uint8Array): Promise<string> =>
    ipcRenderer.invoke('vault:save-attachment', name, buffer),
  openAttachment: (name: string): Promise<string> =>
    ipcRenderer.invoke('vault:open-attachment', name),
  search: (query: string): Promise<SearchResult[]> => ipcRenderer.invoke('vault:search', query),
  getGraph: (): Promise<VaultGraph> => ipcRenderer.invoke('vault:graph'),
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke('shell:open-external', url),
  watchStart: (): Promise<void> => ipcRenderer.invoke('vault:watch-start'),
  onVaultChanged: (cb: () => void): (() => void) => {
    const listener = (): void => cb()
    ipcRenderer.on('vault:changed', listener)
    return () => ipcRenderer.removeListener('vault:changed', listener)
  }
}

contextBridge.exposeInMainWorld('lumen', api)

export type LumenAPI = typeof api

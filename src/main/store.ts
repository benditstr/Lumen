import Store from 'electron-store'

interface Schema {
  vaultPath?: string
}

const store = new Store<Schema>({ name: 'lumen' })

export function getVaultPath(): string | undefined {
  return store.get('vaultPath')
}

export function setVaultPath(path: string): void {
  store.set('vaultPath', path)
}

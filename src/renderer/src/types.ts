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

export type ViewMode = 'edit' | 'split' | 'preview'

export interface GraphNode {
  id: string
  name: string
  exists: boolean
  linkCount: number
}

export interface GraphEdge {
  source: string
  target: string
}

export interface VaultGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

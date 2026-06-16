import type { LumenAPI } from './index'

export type { NoteMeta, SearchResult, LumenAPI } from './index'

declare global {
  interface Window {
    lumen: LumenAPI
  }
}

import { MediaStorage } from "../mediaStorage"
import { UploadEngineManager } from "./exported-definitions"

export interface UploadEngineContext {
  storage: MediaStorage
  manager: UploadEngineManager
  /**
   * Can be an empty string
   */
  baseUrl: string
}
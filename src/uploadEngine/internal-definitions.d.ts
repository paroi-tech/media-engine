import { MediaStorage } from "../mediaStorage"
import { UploadEngineManager } from "./exported-definitions"
import { Request, Response } from "express"

export interface UploadEngineContext {
  storage: MediaStorage
  manager: UploadEngineManager
  /**
   * Can be an empty string
   */
  baseUrl: string
}

/**
 * @returns the `UploadEngineContext` or `undefined` if there isn't. This function must write a server response if it returns `undefined`.
 */
export type GetCx = (req: Request, res: Response) => Promise<UploadEngineContext | undefined>
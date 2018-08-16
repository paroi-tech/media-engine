import { ExternalRef, MulterFile, MediaRef, Media, Variant, MediaStorage } from "../mediaStorage"

export interface UploadEngineConfiguration {
  manager: UploadEngineManager
  /**
   * The base URL (optional).
   *
   * Must start with a leading `/` and not have a trailing `/`. Example: `/medias`.
   */
  baseUrl?: string
  storage: MediaStorage
}

export interface DeclareRoutesOptions {
  /**
   * Override the option `baseUrl` from `UploadEngineConfiguration` (optional).
   *
   * Must start with a leading `/` and not have a trailing `/`. Or can be an empty string.
   * Example: `/medias`.
   */
  baseUrl?: string
}

export interface DeclareRoutesMultiEngineOptions {
  /**
   * Override the option `baseUrl` from `UploadEngineConfiguration` (optional).
   *
   * Must start with a leading `/` and not have a trailing `/`. Or can be an empty string.
   * Example: `/medias`.
   */
  baseUrl: string
}

export interface UploadEngine {
  readonly storage: MediaStorage
  declareRoutes(router: import("express").Router, options?: DeclareRoutesOptions): void
  getFileUrl(media: Media, variant: Variant): string
}

export interface CanUpload {
  canUpload: boolean
  /**
   * A valid HTTP code
   */
  errorCode?: number
  errorMsg?: string
  ownerId?: string
}

export interface UploadEngineManager {
  canUpload(req: import("express").Request, externalRef: ExternalRef, overwrite: boolean, file: MulterFile): Promise<CanUpload> | CanUpload
  makeJsonResponseForUpload(req: import("express").Request, mediaId: string, overwritten: boolean): Promise<object> | object

  canRead(req: import("express").Request, mediaRef: MediaRef): Promise<boolean> | boolean

  canDelete(req: import("express").Request, mediaRef: MediaRef): Promise<boolean> | boolean
  makeJsonResponseForDelete(req: import("express").Request, deletedMedia: Media): Promise<object> | object
}

/**
 * @returns the `UploadEngine` or `undefined` if there isn't. This function must write a server response if it returns `undefined`.
 */
export type GetUploadEngine = (req: import("express").Request, res: import("express").Response) => Promise<UploadEngine | undefined>
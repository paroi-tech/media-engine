export type DbEngine = "sqlite"

export interface MediaStorageOptions {
  execInitScript?: DbEngine
  cn: import("@ladc/sql-bricks-modifier").SBMainConnection
  imagesConf?: ImageVariantsConfiguration
  logWarning?: (message: string) => void
}

export interface MediaStorage {
  storeMedia(params: StoreMediaParameters): Promise<NewMedia>
  removeMedia(id: MediaOrVariantId): Promise<boolean>
  /**
   * @returns The deleted media identifiers (async)
   */
  removeMedias(filter: MediaFilter): Promise<string[]>
  getFileData(variantId: string): Promise<VariantData | undefined>
  findMedias(query: MediaQuery): Promise<Media[]>
  findMedia(query: MediaQuery): Promise<Media | undefined>
  findMediaRef(id: MediaOrVariantId): Promise<MediaRef | undefined>
}

interface MediaDef {
  id: string
  ts: string
  baseName?: string
  originalName?: string
  ownerId?: string
  externalRef?: ExternalRef
}

interface VariantDef {
  id: string
  media: MediaDef
  code: string
  mediaType: string
  weightB: number
  img?: ImageMeta
  binData: Buffer
}

export interface ImageMeta {
  width: number
  height: number
  dpi?: number
}

export type MulterFile = Express.Multer.File

export interface ExternalRef {
  type: string
  id: string
}

export type MediaOrVariantId = { mediaId: string } | { variantId: string }

export interface ImageVariantConfiguration {
  /**
   * The variant code.
   */
  code: string
  /**
   * Optional, but if `height` is undefined, then `width` is required.
   */
  width?: number
  /**
   * Optional, but if `width` is undefined, then `height` is required.
   */
  height?: number
  dpi?: number
  /**
   * Preserving aspect ratio, resize the image to the maximum `width` or `height` specified.
   *
   * The default value is `false` (crop).
   */
  embed?: boolean
  mediaType?: string
}

export interface ImageVariantsConfiguration {
  [externalType: string]: ImageVariantConfiguration[]
}

export interface StoreMediaParameters {
  file: MulterFile
  ownerId?: string
  externalRef?: ExternalRef
  /**
   * If this parameter is `true` and a media with the same value of `externalRef` already exists, then the previous media is replaced. Otherwise, a new media is added.
   *
   * Default value is: `false`.
   */
  overwrite?: boolean
}

export interface NewMedia {
  mediaId: string
  overwritten: boolean
}

export interface MediaFilter {
  externalRef?: ExternalRef
}

// --
// -- Fetch variant data
// --

export type VDMedia = Pick<MediaDef, "id" | "ts">

export type VariantData = Pick<VariantDef, "id" | "binData" | "weightB" | "mediaType"> & {
  media: VDMedia
  fileName: string
}

// --
// -- Find Media & Variant
// --

export type Media = Pick<MediaDef, "id" | "ts" | "baseName" | "originalName" | "ownerId" | "externalRef"> & {
  variants: Variants
}

export interface Variants {
  [code: string]: Variant
}

export type Variant = Pick<VariantDef, "id" | "code" | "mediaType" | "weightB" | "img"> & {
  fileName: string
}

export type MediaQuery = {
  externalRef: ExternalRef
} | MediaOrVariantId

// --
// -- Find MediaRef
// --

export interface MediaRef {
  externalRef?: ExternalRef
  ownerId?: string
}

import { execDdl } from "./execDdl"
import { MediaFilter, MediaOrVariantId, MediaQuery, MediaStorage, MediaStorageOptions, StoreMediaParameters } from "./exported-definitions"
import { findMediaRef } from "./findMediaRef"
import { findMedia, findMedias } from "./findMedias"
import { getFileData } from "./getFileData"
import { MediaStorageContext } from "./internal-definitions"
import { removeMedia, removeMedias } from "./removeMedias"
import { storeMedia } from "./storeMedia"

export async function createMediaStorage(options: MediaStorageOptions): Promise<MediaStorage> {
  if (options.execInitScript)
    await execDdl(options.execInitScript, options.cn)
  let cx: MediaStorageContext = {
    // tslint:disable-next-line:no-console
    logWarning: options.logWarning || (message => console.warn(message)),
    cn: options.cn,
    mainCn: options.cn,
    imagesConf: options.imagesConf || {}
  }
  return {
    storeMedia: (params: StoreMediaParameters) => storeMedia(cx, params),
    removeMedia: (id: MediaOrVariantId) => removeMedia(cx, id),
    removeMedias: (filter: MediaFilter) => removeMedias(cx, filter),
    getFileData: (variantId: string) => getFileData(cx, variantId),
    findMedias: (query: MediaQuery) => findMedias(cx, query),
    findMedia: (query: MediaQuery) => findMedia(cx, query),
    findMediaRef: (id: MediaOrVariantId) => findMediaRef(cx, id)
  }
}

export * from "./exported-utils"
export type { DbEngine, ExternalRef, ImageMeta, ImageVariantConfiguration, ImageVariantsConfiguration, Media, MediaDef, MediaFilter, MediaOrVariantId, MediaQuery, MediaRef, MediaStorage, MediaStorageOptions, MulterFile, NewMedia, StoreMediaParameters, VDMedia, Variant, VariantData, VariantDef, Variants } from "./exported-definitions"
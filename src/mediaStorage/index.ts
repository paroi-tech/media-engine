import { execDdl } from "./execDdl"
import { MediaFilter, MediaOrVariantId, MediaQuery, StoreMediaParameters, MediaStorageOptions, MediaStorage } from "./exported-definitions"
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
export * from "./exported-definitions"
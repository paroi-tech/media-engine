import { Router } from "express"
import { declareRoutes } from "./declareRoutes"
import { UploadEngineContext } from "./internal-definitions"
import { UploadEngineConfiguration, UploadEngine } from "./exported-definitions"
import { Media, Variant } from "../mediaStorage"

export function createUploadEngine(conf: UploadEngineConfiguration): UploadEngine {
  let cx: UploadEngineContext = {
    manager: conf.manager,
    storage: conf.storage,
    baseUrl: conf.baseUrl || ""
  }
  return {
    get storage() {
      return conf.storage
    },
    declareRoutes: (router: Router, options = {}) => declareRoutes(cx, router, options),
    getFileUrl: (media: Media, variant: Variant) => {
      let year = new Date(media.ts).getFullYear()
      return `${cx.baseUrl}/${year}/${variant.id}/${encodeURIComponent(variant.fileName)}`
    }
  }
}

export * from "./exported-definitions"
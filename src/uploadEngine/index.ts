import { declareRoutes } from "./declareRoutes"
import { UploadEngineContext } from "./internal-definitions"
import { UploadEngineConfiguration, UploadEngine, DeclareRoutesMultiEngineOptions, GetUploadEngine } from "./exported-definitions"
import { Media, Variant } from "../mediaStorage"

let contexts = new WeakMap<UploadEngine, UploadEngineContext>()

export function createUploadEngine(conf: UploadEngineConfiguration): UploadEngine {
  let cx: UploadEngineContext = Object.freeze({
    manager: conf.manager,
    storage: conf.storage,
    baseUrl: conf.baseUrl || ""
  })
  let eng: UploadEngine = {
    get storage() {
      return conf.storage
    },
    declareRoutes: (router, options = {}) => {
      let opt = {
        ...options,
        baseUrl: options.baseUrl === undefined ? cx.baseUrl : options.baseUrl
      }
      declareRoutes(router, opt, async () => cx)
    },
    getFileUrl: (media: Media, variant: Variant) => {
      let year = new Date(media.ts).getFullYear()
      return `${cx.baseUrl}/${year}/${variant.id}/${encodeURIComponent(variant.fileName)}`
    }
  }
  contexts.set(eng, cx)
  return eng
}

export function declareRoutesMultiEngine(router: import("express").Router, options: DeclareRoutesMultiEngineOptions, getUploadEngine: GetUploadEngine) {
  declareRoutes(router, options, async (req, res) => {
    let eng = await getUploadEngine(req, res)
    return eng ? contexts.get(eng) : undefined
  })
}

export * from "./exported-definitions"
const multer = require("multer")
import { Request, Response, Router } from "express"
import { writeServerError, writeJsonResponse, writeError, getMulterParameterAsJson, getUploadMetaValue, getRouteParameter, waitForRequestBodyAsJson } from "./utils"
import { UploadEngineContext } from "./internal-definitions"
import { ExternalRef } from "../mediaStorage"
import { DeclareRoutesOptions } from "./exported-definitions"

export function declareRoutes(cx: UploadEngineContext, router: Router, options: DeclareRoutesOptions) {
  let upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 1024 * 1024 * 20 // 20 MB
    }
  })
  let baseUrl = options.baseUrl === undefined ? cx.baseUrl : options.baseUrl
  router.post(`${baseUrl}/upload`, upload.single("f"), makeUploadRouteHandler(cx))
  router.post(`${baseUrl}/delete`, makeDeleteRouteHandler(cx))
  router.get(`${baseUrl}/:year/:variantId/:fileName`, makeGetRouteHandler(cx))
}

function makeUploadRouteHandler(cx: UploadEngineContext) {
  return async function (req: Request, res: Response) {
    try {
      // Check the parameters
      if (!req.file)
        return writeError(res, 400, "Missing file")
      let externalRef: ExternalRef
      let overwrite: boolean
      try {
        let meta = getMulterParameterAsJson(req, "meta")
        externalRef = {
          type: getUploadMetaValue(meta, ["ref", "type"], "string"),
          id: getUploadMetaValue(meta, ["ref", "id"], "string")
        }
        overwrite = !!getUploadMetaValue(meta, ["overwrite"], "boolean", true)
      } catch (err) {
        return writeError(res, 400, err.message)
      }
      // Validate the access
      let { canUpload, ownerId, errorCode, errorMsg } = await cx.manager.canUpload(req, externalRef, overwrite, req.file)
      if (!canUpload)
        return writeError(res, errorCode || 403, errorMsg)
      // Store the media
      let { mediaId, overwritten } = await cx.storage.storeMedia({
        file: req.file,
        externalRef,
        ownerId: ownerId,
        overwrite
      })
      writeJsonResponse(res, 200, await cx.manager.makeJsonResponseForUpload(req, mediaId, overwritten))
    } catch (err) {
      writeServerError(res, err)
    }
  }
}

function makeGetRouteHandler(cx: UploadEngineContext) {
  return async function (req: Request, res: Response) {
    try {
      // Check the parameters
      let variantId: string
      try {
        variantId = getRouteParameter(req, "variantId")
      } catch (err) {
        return writeError(res, 400, err.message)
      }
      // Validate the access
      let mediaRef = await cx.storage.findMediaRef({ variantId })
      if (!mediaRef || !await cx.manager.canRead(req, mediaRef))
        return writeError(res, 404)
      // Serve the file
      returnFile(cx, variantId, res, !!req.query.download)
    } catch (err) {
      writeServerError(res, err)
    }
  }
}

async function returnFile(cx: UploadEngineContext, variantId: string, res: Response, asDownload = false) {
  let fileData = await cx.storage.getFileData(variantId)
  if (fileData) {
    res.type(fileData.imType)
    res.set("Content-Length", fileData.weightB.toString())
    if (asDownload)
      res.set("Content-Disposition", `attachment;filename=${fileData.fileName}`)
    res.write(fileData.binData)
  } else {
    res.status(404)
    res.send("404 Not Found")
  }
  res.end()
}

function makeDeleteRouteHandler(cx: UploadEngineContext) {
  return async function (req: Request, res: Response) {
    try {

      // Check the parameters
      let mediaId: string
      try {
        let options = await waitForRequestBodyAsJson(req)
        mediaId = getUploadMetaValue(options, ["mediaId"], "string")
      } catch (err) {
        return writeError(res, 400, err.message)
      }
      // Validate the access
      let media = await cx.storage.findMedia({ mediaId })
      if (!media || !await cx.manager.canDelete(req, { externalRef: media.externalRef, ownerId: media.ownerId }))
        return writeError(res, 404)
      // Delete the file
      await cx.storage.removeMedia({ mediaId })
      writeJsonResponse(res, 200, await cx.manager.makeJsonResponseForDelete(req, media))
    } catch (err) {
      writeServerError(res, err)
    }
  }
}

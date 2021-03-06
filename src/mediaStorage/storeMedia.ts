import { deleteFrom, insertInto, update } from "sql-bricks"
const sharp = require("sharp")
import { fileBaseName, findMediaByExternalRef } from "./common"
import { ImageMeta, ImageVariantConfiguration, MediaDef, MulterFile, NewMedia, StoreMediaParameters, VariantDef } from "./exported-definitions"
import { isSupportedImage } from "./exported-utils"
import { MediaStorageContext, Sharp, SharpOutputInfo } from "./internal-definitions"

const SHARP_OUTPUT_TYPES = ["image/png", "image/jpeg", "image/webp"]

export async function storeMedia(cx: MediaStorageContext, params: StoreMediaParameters): Promise<NewMedia> {
  let transCn = await cx.mainCn.beginTransaction()
  cx = {
    ...cx,
    cn: transCn
  }

  try {
    let mediaId: string | undefined
    if (params.overwrite && params.externalRef) {
      let found = await findMediaByExternalRef(cx, params.externalRef)
      if (found.length >= 1)
        mediaId = found[0]
    }

    let overwritten = mediaId !== undefined

    if (mediaId === undefined) {
      mediaId = await insertMedia(cx, {
        baseName: fileBaseName(params.file.originalname),
        originalName: params.file.originalname,
        ownerId: params.ownerId,
        externalRef: params.externalRef
      })
    } else {
      await clearMediaVariants(cx, mediaId)
      await updateMedia(cx, {
        baseName: fileBaseName(params.file.originalname),
        originalName: params.file.originalname,
        ownerId: params.ownerId
      }, mediaId)
    }

    let imgMeta = await getImageMeta(cx, params.file)

    await insertVariant(cx, {
      mediaId,
      code: "orig",
      weightB: params.file.size,
      mediaType: params.file.mimetype,
      img: imgMeta,
      binData: params.file.buffer
    })

    if (imgMeta && params.externalRef && cx.imagesConf[params.externalRef.type]) {
      for (let variantConf of cx.imagesConf[params.externalRef.type])
        await resizeAndInsertVariant(cx, mediaId, variantConf, params.file, imgMeta)
    }

    await transCn.commit()
    return { mediaId, overwritten }
  } finally {
    if (transCn.inTransaction)
      await transCn.rollback()
  }
}

type InsertMedia = Pick<MediaDef, "baseName" | "originalName" | "ownerId" | "externalRef">

async function insertMedia(cx: MediaStorageContext, media: InsertMedia): Promise<string> {
  let mediaId = (await cx.cn.exec(
    insertInto("media").values({
      "base_name": media.baseName,
      "orig_name": media.originalName,
      "owner_id": media.ownerId
    })
  )).getInsertedIdAsString()
  if (media.externalRef) {
    await cx.cn.exec(
      insertInto("media_ref").values({
        "media_id": mediaId,
        "external_type": media.externalRef.type,
        "external_id": media.externalRef.id
      })
    )
  }
  return mediaId
}

async function clearMediaVariants(cx: MediaStorageContext, mediaId: string) {
  await cx.cn.exec(
    deleteFrom("variant").where("media_id", mediaId)
  )
}

type UpdateMedia = Pick<MediaDef, "baseName" | "originalName" | "ownerId">

async function updateMedia(cx: MediaStorageContext, media: UpdateMedia, mediaId: string) {
  await cx.cn.exec(
    update("media")
      .set({
        "base_name": media.baseName,
        "orig_name": media.originalName,
        "owner_id": media.ownerId
      })
      .where("media_id", mediaId)
  )
}

type InsertVariant = Pick<VariantDef, "code" | "mediaType" | "weightB" | "img" | "binData"> & {
  "mediaId": string
}

async function insertVariant(cx: MediaStorageContext, variant: InsertVariant): Promise<string> {
  let variantId = (await cx.cn.exec(
    insertInto("variant").values({
      "media_id": variant.mediaId,
      "weight_b": variant.weightB,
      "media_type": variant.mediaType,
      "code": variant.code,
      "bin_data": variant.binData
    })
  )).getInsertedIdAsString()
  if (variant.img) {
    await cx.cn.exec(
      insertInto("variant_img").values({
        "variant_id": variantId,
        "width": variant.img.width,
        "height": variant.img.height,
        "dpi": variant.img.dpi
      })
    )
  }
  return variantId
}

async function getImageMeta(cx: MediaStorageContext, f: MulterFile): Promise<ImageMeta | undefined> {
  if (!isSupportedImage(f.mimetype))
    return
  try {
    let metadata = await sharp(f.buffer).metadata()
    if (metadata.width && metadata.height) {
      return {
        width: metadata.width,
        height: metadata.height,
        dpi: metadata.density
      }
    }
  } catch (err) {
    cx.logWarning(`Cannot read the image meta (type ${f.mimetype}): ${err.message}`)
  }
}

async function resizeAndInsertVariant(cx: MediaStorageContext, mediaId: string, targetConf: ImageVariantConfiguration, f: MulterFile, fImgMeta: ImageMeta) {
  let sharpInst: Sharp | undefined
  let sharpResult: {
    data: Buffer
    info: SharpOutputInfo
  }
  let mediaType = outputImageMimeType(f.mimetype, targetConf.mediaType)
  try {
    if (targetConf.embed || targetConf.width === undefined || targetConf.height === undefined)
      sharpInst = await resizeEmbedImage(targetConf, f, fImgMeta)
    else
      sharpInst = await resizeCropImage(targetConf as CropImageSize, f, fImgMeta)
    if (!sharpInst)
      return
    sharpResult = await ((sharpInst
      .toFormat(toOutputSharpFormat(mediaType)) as any)
      .toBuffer({
        resolveWithObject: true
      }))
  } catch (err) {
    cx.logWarning(`[WARN] Cannot resize (${targetConf.embed ? "embed" : "crop"}) the image (type "${f.mimetype}"): ${err.message}`)
    return
  }

  await insertVariant(cx, {
    mediaId,
    code: targetConf.code,
    weightB: sharpResult.info.size,
    mediaType,
    img: {
      width: sharpResult.info.width,
      height: sharpResult.info.height,
    },
    binData: sharpResult.data
  })
}

interface CropImageSize {
  width: number
  height: number
}

function resizeCropImage(targetConf: CropImageSize, f: MulterFile, fImgMeta: ImageMeta): Sharp | undefined {
  let targetW = targetConf.width
  let targetH = targetConf.height
  let sourceW = fImgMeta.width
  let sourceH = fImgMeta.height
  if (targetW > sourceW || targetH > sourceH || (targetW === sourceW && targetH === sourceH))
    return
  return sharp(f.buffer).resize(targetW, targetH)
}

function resizeEmbedImage(targetConf: ImageVariantConfiguration, f: MulterFile, fImgMeta: ImageMeta): Sharp | undefined {
  let targetW = targetConf.width
  let targetH = targetConf.height
  let sourceW = fImgMeta.width
  let sourceH = fImgMeta.height
  if (targetW !== undefined && targetH !== undefined) {
    if (targetW < sourceW) {
      if (targetH >= sourceH)
        return sharp(f.buffer).resize(targetW)
      let targetRatio = targetW / targetH
      let sourceRatio = sourceW / sourceH
      if (targetRatio === sourceRatio)
        return sharp(f.buffer).resize(targetW, targetH)
      if (targetRatio < sourceRatio)
        return sharp(f.buffer).resize(undefined, targetH)
      return sharp(f.buffer).resize(targetW)
    }
    if (targetH < sourceH)
      return sharp(f.buffer).resize(undefined, targetH)
  }

  if (targetW !== undefined && targetW < sourceW)
    return sharp(f.buffer).resize(targetW)

  if (targetH !== undefined && targetH < sourceH)
    return sharp(f.buffer).resize(undefined, targetH)
}

function toOutputSharpFormat(mediaType: string): string {
  switch (mediaType) {
    case "image/png":
      return "png"
    case "image/jpeg":
      return "jpeg"
    case "image/webp":
      return "webp"
    default:
      throw new Error(`Invalid output image format: ${mediaType}`)
  }
}

function outputImageMimeType(origMimeType: string | undefined, queriedMediaType?: string) {
  if (queriedMediaType && SHARP_OUTPUT_TYPES.includes(queriedMediaType))
    return queriedMediaType
  if (origMimeType && SHARP_OUTPUT_TYPES.includes(origMimeType))
    return origMimeType
  return "image/webp"
}
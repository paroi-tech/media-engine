import { select } from "sql-bricks"
import { getFileName } from "./common"
import { Media, MediaQuery, Variant, Variants } from "./exported-definitions"
import { MediaStorageContext } from "./internal-definitions"
import { strVal } from "./utils"

export async function findMedias(cx: MediaStorageContext, query: MediaQuery): Promise<Media[]> {
  let sb = sqlSelectMedia()
  if ("mediaId" in query)
    sb = sb.where("m.media_id", query.mediaId)
  else if ("variantId" in query) {
    sb = sb.innerJoin("variant v").using("media_id")
      .where("v.variant_id", query.variantId)
  } else if ("externalRef" in query) {
    sb = sb.where({
      "r.external_type": query.externalRef.type,
      "r.external_id": query.externalRef.id
    })
  } else
    return []
  let rows = await cx.cn.all(sb)
  let result: Media[] = []
  for (let row of rows) {
    let id = strVal(row["media_id"])
    let externalRef = !row["external_type"] || !row["external_id"] ? undefined : {
      type: row["external_type"] as string,
      id: strVal(row["external_id"])
    }
    result.push({
      id,
      ts: row["ts"] as string,
      baseName: row["base_name"] as string,
      originalName: row["orig_name"] as string,
      ownerId: strVal(row["owner_id"]),
      externalRef,
      variants: await fetchVariantsOf(cx, id, row["base_name"] as string, row["orig_name"] as string)
    })
  }
  return result
}

export async function findMedia(cx: MediaStorageContext, query: MediaQuery): Promise<Media | undefined> {
  let medias = await findMedias(cx, query)
  return medias.length === 1 ? medias[0] : undefined
}

function sqlSelectMedia() {
  return select("m.media_id, m.ts, m.base_name, m.orig_name, m.owner_id, r.external_type, r.external_id")
    .from("media m")
    .innerJoin("media_ref r").using("media_id")
}

async function fetchVariantsOf(cx: MediaStorageContext, mediaId: string, baseName?: string, originalName?: string): Promise<Variants> {
  let rows = await cx.cn.all(
    sqlSelectVariant()
      .where("v.media_id", mediaId)
  )
  if (rows.length === 0)
    throw new Error(`Missing variants for media ${mediaId}`)
  let result: Variants = {}
  for (let row of rows) {
    let code = row["code"] as string
    result[code] = toVariant(row, baseName, originalName)
  }
  return result
}

function sqlSelectVariant() {
  return select("v.variant_id, v.weight_b, v.media_type, v.code, i.width, i.height, i.dpi")
    .from("variant v")
    .leftJoin("variant_img i").using("variant_id")
}

function toVariant(row: object, baseName?: string, originalName?: string): Variant {
  let id = row["variant_id"].toString()
  let fileName = getFileName({
    mediaType: row["media_type"],
    code: row["code"],
    originalName,
    baseName
  })
  let img = !row["width"] || !row["height"] ? undefined : {
    width: row["width"],
    height: row["height"],
    dpi: row["dpi"]
  }
  return {
    id,
    weightB: row["weight_b"],
    mediaType: row["media_type"],
    code: row["code"],
    fileName,
    img
  }
}

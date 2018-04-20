import { select } from "sql-bricks"
import { MediaStorageContext } from "./internal-definitions"
import { MediaQuery, Media, Variants, Variant } from "./exported-definitions"
import { getFileName } from "./common"

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
  let rows = await cx.cn.allSqlBricks(sb)
  let result: Media[] = []
  for (let row of rows) {
    let id = row["media_id"].toString()
    let externalRef = !row["external_type"] || !row["external_id"] ? undefined : {
      type: row["external_type"],
      id: row["external_id"]
    }
    result.push({
      id,
      ts: row["ts"],
      baseName: row["base_name"],
      originalName: row["orig_name"],
      ownerId: row["owner_id"],
      externalRef,
      variants: await fetchVariantsOf(cx, id, row["base_name"], row["orig_name"])
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
  let rows = await cx.cn.allSqlBricks(
    sqlSelectVariant()
      .where("v.media_id", mediaId)
  )
  let result: Variants = {}
  for (let row of rows) {
    let code = row["code"]
    result[code] = toVariant(row, baseName, originalName)
  }
  return result
}

function sqlSelectVariant() {
  return select("v.variant_id, v.weight_b, v.im_type, v.code, i.width, i.height, i.dpi")
    .from("variant v")
    .leftJoin("variant_img i").using("variant_id")
}

function toVariant(row: any[], baseName?: string, originalName?: string): Variant {
  let id = row["variant_id"].toString()
  let fileName = getFileName({
    imType: row["im_type"],
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
    imType: row["im_type"],
    code: row["code"],
    fileName,
    img
  }
}

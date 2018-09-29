import { deleteFrom, select } from "sql-bricks"
import { findMediaByExternalRef } from "./common"
import { MediaFilter, MediaOrVariantId } from "./exported-definitions"
import { MediaStorageContext } from "./internal-definitions"
import { strVal } from "./utils"

export async function removeMedia(cx: MediaStorageContext, id: MediaOrVariantId): Promise<boolean> {
  let mediaId: string
  if ("mediaId" in id)
    mediaId = id.mediaId
  else {
    let foundMediaId = await cx.cn.singleValue(
      select("media_id")
        .from("variant")
        .where("variant_id", id.variantId)
    )
    if (foundMediaId === undefined)
      return false
    mediaId = strVal(foundMediaId)
  }

  await cx.cn.exec(
    deleteFrom("variant").where("media_id", mediaId)
  )
  let result = await cx.cn.exec(
    deleteFrom("media").where("media_id", mediaId)
  )
  return result.affectedRows === 1
}

/**
 * @returns The deleted media identifiers (async)
 */
export async function removeMedias(cx: MediaStorageContext, filter: MediaFilter): Promise<string[]> {
  if (!filter.externalRef)
    return []
  let found = await findMediaByExternalRef(cx, filter.externalRef)
  for (let mediaId of found)
    await removeMedia(cx, { mediaId })
  return found
}

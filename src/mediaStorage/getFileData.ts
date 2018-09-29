import { select } from "sql-bricks"
import { getFileName } from "./common"
import { VariantData } from "./exported-definitions"
import { MediaStorageContext } from "./internal-definitions"
import { strVal } from "./utils"

export async function getFileData(cx: MediaStorageContext, variantId: string): Promise<VariantData | undefined> {
  let row = await cx.cn.singleRow(
    select("v.bin_data, v.weight_b, v.im_type, v.code, m.media_id, m.ts, m.orig_name, m.base_name")
      .from("variant v")
      .innerJoin("media m").using("media_id")
      .where("v.variant_id", variantId)
  )
  if (!row)
    return
  let fileName = getFileName({
    imType: row["im_type"] as string,
    code: row["code"] as string,
    originalName: row["orig_name"] as string,
    baseName: row["base_name"] as string
  })
  return {
    id: variantId,
    weightB: row["weight_b"] as number,
    imType: row["im_type"] as string,
    media: {
      id: strVal(row["media_id"]),
      ts: row["ts"] as string
    },
    fileName,
    binData: row["bin_data"] as Buffer
  }
}

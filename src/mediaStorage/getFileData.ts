import { select } from "sql-bricks"
import { MediaStorageContext } from "./internal-definitions"
import { getFileName } from "./common"
import { VariantData } from "./exported-definitions"

export async function getFileData(cx: MediaStorageContext, variantId: string): Promise<VariantData | undefined> {
  let row = await cx.cn.singleRowSqlBricks(
    select("v.bin_data, v.weight_b, v.im_type, v.code, m.media_id, m.ts, m.orig_name, m.base_name")
      .from("variant v")
      .innerJoin("media m").using("media_id")
      .where("v.variant_id", variantId)
  )
  if (!row)
    return
  let fileName = getFileName({
    imType: row["im_type"],
    code: row["code"],
    originalName: row["orig_name"],
    baseName: row["base_name"]
  })
  return {
    id: variantId,
    weightB: row["weight_b"],
    imType: row["im_type"],
    media: {
      id: row["media_id"],
      ts: row["ts"]
    },
    fileName,
    binData: row["bin_data"]
  }
}

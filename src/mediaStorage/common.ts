import { basename } from "path"
import { select } from "sql-bricks"
import { MediaStorageContext } from "./internal-definitions"
import { ExternalRef } from "./exported-definitions"

/**
 * @returns the file base name without the extension
 */
export function fileBaseName(path: string): string {
  let base = basename(path)
  let dotIndex = base.lastIndexOf(".")
  return dotIndex === -1 ? base : base.substring(0, dotIndex)
}

/**
 * @returns the list of media identifiers attached to the `externalRef`. Can be empty.
 */
export async function findMediaByExternalRef(cx: MediaStorageContext, externalRef: ExternalRef): Promise<string[]> {
  let rows = await cx.cn.allSqlBricks(
    select("media_id")
      .from("media_ref")
      .where({
        "external_type": externalRef.type,
        "external_id": externalRef.id
      })
  )
  return rows.map(row => row.media_id)
}

export interface FileNameOptions {
  imType: string
  code?: string
  baseName?: string
  originalName?: string
}

export function getFileName(options: FileNameOptions) {
  let fileExt = toFileExtension(options.imType, options.originalName) || ""
  let n = [options.baseName, options.code].filter(tok => tok !== undefined).join("-")
  if (!n)
    n = options.originalName || "unamed"
  // console.log(".................. >>> getFileName", `${n}${fileExt}`, options)
  return `${n}${fileExt}`
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types
 */
function toFileExtension(imType: string, originalName?: string): string | undefined {
  let [type, subType] = imType.split("/")
  if (subType.length >= 2 && subType.length <= 4)
    return `.${subType}`
  if (imType === "text/plain")
    return ".txt"
  if (imType === "text/javascript")
    return ".js"
  if (originalName) {
    let dotIndex = originalName.lastIndexOf(".")
    if (dotIndex !== -1)
      return originalName.substr(dotIndex)
  }
}

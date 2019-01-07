import { basename } from "path"
import { select } from "sql-bricks"
import { ExternalRef } from "./exported-definitions"
import { MediaStorageContext } from "./internal-definitions"
import { strVal } from "./utils"

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
  let rows = await cx.cn.all(
    select("media_id")
      .from("media_ref")
      .where({
        "external_type": externalRef.type,
        "external_id": externalRef.id
      })
  )
  return rows.map(row => strVal(row.media_id))
}

export interface FileNameOptions {
  mediaType: string
  code?: string
  baseName?: string
  originalName?: string
}

export function getFileName(options: FileNameOptions) {
  let fileExt = toFileExtension(options.mediaType, options.originalName) || ""
  let n = [options.baseName, options.code].filter(tok => tok !== undefined).join("-")
  if (!n)
    n = options.originalName || "unamed"
  return `${n}${fileExt}`
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types
 */
function toFileExtension(mediaType: string, originalName?: string): string | undefined {
  let [type, subType] = mediaType.split("/")
  if (subType.length >= 2 && subType.length <= 4)
    return `.${subType}`
  if (mediaType === "text/plain")
    return ".txt"
  if (mediaType === "text/javascript")
    return ".js"
  if (originalName) {
    let dotIndex = originalName.lastIndexOf(".")
    if (dotIndex !== -1)
      return originalName.substr(dotIndex)
  }
}

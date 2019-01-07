import { IMG_TYPES } from "./utils"

export function isSupportedImage(mediaType: string) {
  return IMG_TYPES.includes(mediaType)
}
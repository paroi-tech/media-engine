import { IMG_TYPES } from "./utils"

export function isSupportedImage(imType: string) {
  return IMG_TYPES.includes(imType)
}
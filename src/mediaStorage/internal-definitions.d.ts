import { ImageVariantsConfiguration, MediaStorageOptions } from "./exported-definitions"

export { Sharp, OutputInfo as SharpOutputInfo } from "sharp"

export interface MediaStorageContext {
  logWarning: (message: string) => void
  cn: import("@ladc/sql-bricks-modifier").SBConnection
  mainCn: import("@ladc/sql-bricks-modifier").SBMainConnection
  imagesConf: ImageVariantsConfiguration
}

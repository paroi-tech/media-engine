import { ImageVariantsConfiguration, MediaStorageOptions } from "./exported-definitions"

export { SharpInstance, OutputInfo as SharpOutputInfo } from "sharp"

export interface MediaStorageContext {
  logWarning: (message: string) => void
  cn: import("@ladc/sql-bricks-modifier").QueryRunnerWithSqlBricks
  mainCn: import("@ladc/sql-bricks-modifier").DatabaseConnectionWithSqlBricks
  imagesConf: ImageVariantsConfiguration
}

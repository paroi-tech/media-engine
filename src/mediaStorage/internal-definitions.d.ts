import { ImageVariantsConfiguration, MediaStorageOptions } from "./exported-definitions"

export { SharpInstance, OutputInfo as SharpOutputInfo } from "sharp"

export interface MediaStorageContext {
  logWarning: (message: string) => void
  cn: import("mycn-with-sql-bricks").QueryRunnerWithSqlBricks
  mainCn: import("mycn-with-sql-bricks").DatabaseConnectionWithSqlBricks
  imagesConf: ImageVariantsConfiguration
}

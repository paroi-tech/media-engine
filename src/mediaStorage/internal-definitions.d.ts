import { ImageVariantsConfiguration } from "./exported-definitions"

export { SharpInstance, OutputInfo as SharpOutputInfo } from "sharp"

export interface MediaStorageContext {
  cn: import("mycn-with-sql-bricks").QueryRunnerWithSqlBricks
  mainCn: import("mycn-with-sql-bricks").DatabaseConnectionWithSqlBricks
  imagesConf: ImageVariantsConfiguration
}

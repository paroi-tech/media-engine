import { DatabaseConnectionWithSqlBricks } from "mycn-with-sql-bricks"
import { ImageVariantsConfiguration } from "./exported-definitions"

export { SharpInstance, OutputInfo as SharpOutputInfo } from "sharp"

export interface MediaStorageContext {
  cn: DatabaseConnectionWithSqlBricks
  imagesConf: ImageVariantsConfiguration
}

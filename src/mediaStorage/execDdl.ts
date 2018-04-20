import * as path from "path"
import * as fs from "fs"
import { promisify } from "util"
import { DbEngine } from "./exported-definitions"
import { DatabaseConnectionWithSqlBricks } from "mycn-with-sql-bricks"
const readFile = promisify(fs.readFile)

export async function execDdl(dbEngine: DbEngine, cn: DatabaseConnectionWithSqlBricks) {
  await cn.execScript(await readFile(path.join(__dirname, "sql-scripts", `ddl-${dbEngine}.sql`), "utf8"))
}
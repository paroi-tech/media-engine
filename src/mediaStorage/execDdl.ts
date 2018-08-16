import * as path from "path"
import * as fs from "fs"
import { promisify } from "util"
import { DbEngine } from "./exported-definitions"
const readFile = promisify(fs.readFile)

export async function execDdl(dbEngine: DbEngine, cn: import("mycn-with-sql-bricks").DatabaseConnectionWithSqlBricks) {
  await cn.execScript(await readFile(path.join(__dirname, "sql-scripts", `ddl-${dbEngine}.sql`), "utf8"))
}
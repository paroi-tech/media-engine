import * as fs from "fs"
import * as path from "path"
import { promisify } from "util"
import { DbEngine } from "./exported-definitions"
const readFile = promisify(fs.readFile)

export async function execDdl(dbEngine: DbEngine, cn: import("@ladc/sql-bricks-qb").DatabaseConnectionWithSqlBricks) {
  await cn.script(await readFile(path.join(__dirname, "sql-scripts", `ddl-${dbEngine}.sql`), "utf8"))
}
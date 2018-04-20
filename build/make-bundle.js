const { promisify } = require("util")
const fs = require("fs")
const path = require("path")
const rollup = require("rollup")
const uglifyEs = require("uglify-es")

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

function fileExists(path) {
  return new Promise(resolve => {
    fs.access(path, fs.constants.F_OK, err => {
      resolve(!err)
    });
  })
}

const bundleName1 = "storage"
const bundleName2 = "upload"
const srcPath = path.join(__dirname, "..", "src")
const compiledPath = path.join(__dirname, "compiled")
const distNpmPath = path.join(__dirname, "..")

async function build() {
  await buildJs(path.join(compiledPath, "mediaStorage", "index.js"), `${bundleName1}.js`)
  await buildJs(path.join(compiledPath, "uploadEngine", "index.js"), `${bundleName2}.js`)

  await writeFile(path.join(distNpmPath, `${bundleName1}.d.ts`), await makeDefinitionsCode("mediaStorage", bundleName1))
  await writeFile(path.join(distNpmPath, `${bundleName2}.d.ts`), await makeDefinitionsCode("uploadEngine", bundleName2))
}

async function buildJs(srcDir, outputFile) {
  let bundle = await rollup.rollup({
    input: srcDir
  })
  let { code } = await bundle.generate({
    format: "cjs",
    sourcemap: false
  })
  let minified = uglifyEs.minify(code)
  if (minified.error)
    throw minified.error
  await writeFile(path.join(distNpmPath, outputFile), minified.code)
}

async function makeDefinitionsCode(subDirName, moduleName) {
  let defs = [
    //`declare module "./${moduleName}" {`,
    "// -- Usage definitions --",
    removeLocalImportsExports((await readFile(path.join(srcPath, subDirName, "exported-definitions.d.ts"), "utf-8")).trim()),
    "// -- Entry point definition --",
    removeSemicolons(
      removeLocalImportsExports((await readFile(path.join(compiledPath, subDirName, "index.d.ts"), "utf-8")).trim())
    ),
    //"}"
  ]
  let utilsFile = path.join(compiledPath, subDirName, "exported-utils.d.ts")
  if (await fileExists(utilsFile)) {
    defs.push("// -- Utilities --")
    defs.push(removeSemicolons(removeLocalImportsExports((await readFile(utilsFile, "utf-8")).trim())))
  }
  return defs.join("\n\n")
}

function removeLocalImportsExports(code) {
  let localImportExport = /^\s*(import|export) .* from "\.\/.*"\s*;?\s*$/
  let result = code.split("\n").filter(line => {
    return !localImportExport.test(line)
  }).join("\n").trim()
  result = result.replace("../mediaStorage", "./storage")
  return result
}

function removeSemicolons(code) {
  return code.replace(/;/g, "")
}

build().then(() => {
  console.log("done")
}, err => console.log(err.message, err.stack))

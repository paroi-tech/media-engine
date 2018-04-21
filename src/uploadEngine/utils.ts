import { Request, Response } from "express"

export function writeJsonResponse(res: Response, httpCode: number, data) {
  res.setHeader("Content-Type", "application/json")
  res.status(httpCode)
  res.send(JSON.stringify(data))
  res.end()
}

export function writeServerError(res: Response, err: Error, reqBody?: string) {
  console.log("[ERR]", err, err.stack, reqBody)
  writeError(res, 500, `Error: ${err.message}\nRequest: ${reqBody}`)
}

export function writeError(res: Response, httpCode: number, message?: string) {
  res.status(httpCode)
  res.send(message || httpErrorMessage(httpCode))
  res.end()
}

export function httpErrorMessage(httpCode: number) {
  switch (httpCode) {
    case 400:
      return "400 Bad Request"
    case 403:
      return "403 Forbidden"
    case 404:
      return "404 Not Found"
    case 500:
      return "500 Internal Server Error"
    default:
      return `Error ${httpCode}`
  }
}

export function getRouteParameter(req: Request, paramName: string, allowEmpty = false): string {
  let val = req.params[paramName]
  if (val === undefined)
    throw new Error(`Missing HTTP parameter: ${paramName}`)
  if (!allowEmpty && val === "")
    throw new Error(`Empty HTTP parameter: ${paramName}`)
  return val
}

export function getUploadMetaValue<T = any>(meta, keys: string[], checkType: string, optional = false): T {
  let cur = meta
  for (let key of keys) {
    if (!cur)
      throw new Error(`Missing meta value for "${keys.join(".")}" in: ${JSON.stringify(meta)}`)
    cur = cur[key]
  }
  if (cur === undefined) {
    if (!optional)
      throw new Error(`Missing meta value for "${keys.join(".")}" in: ${JSON.stringify(meta)}`)
  } else if (typeof cur !== checkType)
    throw new Error(`Invalid ${checkType} meta value for "${keys.join(".")}": ${typeof cur}`)
  return cur
}

export function getMulterParameterAsJson(req: Request, paramName: string): any {
  let param = req.body[paramName]
  if (param === undefined)
    throw new Error(`Missing form parameter: ${paramName}`)
  try {
    return JSON.parse(param)
  } catch (err) {
    throw new Error(`Invalid JSON for form parameter: ${paramName}: ${err.message}`)
  }
}

export async function waitForRequestBodyAsJson(req: Request): Promise<any> {
  let result = await new Promise<string>((resolve, reject) => {
    let body: string[] = []
    req.on("data", chunk => body.push(typeof chunk === "string" ? chunk : chunk.toString()))
    req.on("error", err => {
      reject(err)
    })
    req.on("end", () => {
      resolve(body.join(""))
    })
  })
  return JSON.parse(result)
}

/**
 * @param str
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent#Examples
 */
export function encodeRFC5987ValueChars(str: string): string {
  return encodeURIComponent(str).
    // Note that although RFC3986 reserves "!", RFC5987 does not,
    // so we do not need to escape it
    replace(/['()*]/g, c => "%" + c.charCodeAt(0).toString(16)). // i.e., %27 %28 %29 %2A
    // The following are not required for percent-encoding per RFC5987,
    // so we can allow for a little better readability over the wire: |`^
    replace(/%(7C|60|5E)/g, (str, hex) => String.fromCharCode(parseInt(hex, 16)))
}
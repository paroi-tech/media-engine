export const IMG_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"]

export function intVal(val: unknown): number {
  let type = typeof val
  switch (type) {
    case "number":
      return val as number
    case "string":
      return parseInt(val as string, 10)
    default:
      throw new Error(`Unexpected type for number: ${type}`)
  }
}

export function strVal(val: unknown): string {
  let type = typeof val
  switch (type) {
    case "string":
      return val as string
    case "number":
      return (val as number).toString()
    default:
      throw new Error(`Unexpected type for string: ${type}`)
  }
}
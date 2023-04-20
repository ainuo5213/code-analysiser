export function mergeMap(...maps: Array<Map<any, any>>) {
  const map = new Map()

  for (const m of maps) {
    for (const item of m) {
      map.set(...item)
    }
  }

  return map
}

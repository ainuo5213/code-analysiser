import { globSync } from 'glob'
import { join } from 'path'
import { readFileSync } from 'fs-extra'

export default function scan(scanPath: string, postfix = ['ts', 'tsx']) {
  const currentPath = process.cwd()
  const files: string[] = []
  postfix.forEach((r) => {
    files.push(...globSync(join(currentPath, `${scanPath}/**/*.${r}`).replace(/\\/g, '/')))
  })
  return files
}

export function getCode(filename: string) {
  return readFileSync(filename, 'utf-8')
}

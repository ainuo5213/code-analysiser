import { globSync } from 'glob'
import { join } from 'path'
import fse from 'fs-extra'

export default function scan(scanPath, postfix = ['ts', 'tsx']) {
  const currentPath = process.cwd()
  const files = []
  postfix.forEach((r) => {
    files.push(...globSync(join(currentPath, `${scanPath}/**/*.${r}`).replace(/\\/g, '/')))
  })
  return files
}

export function getCode(filename) {
  return readFileSync(filename, 'utf-8')
}

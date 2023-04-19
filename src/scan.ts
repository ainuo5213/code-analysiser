import { globSync } from 'glob'
import { join } from 'path'

export default function scan(scanPath: string) {
  const currentPath = process.cwd()
  const tsFiles = globSync(join(currentPath, `${scanPath}/**/*.ts`))
  const tsxFiles = globSync(join(currentPath, `${scanPath}/**/*.tsx`))
  return tsFiles.concat(tsxFiles)
}

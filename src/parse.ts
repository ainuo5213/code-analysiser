import tsCompiler from 'typescript'
import { getCode } from './scan'
import { BaseElementNode, TextNode, parse } from '@vue/compiler-dom'
import { writeFileSync, ensureDir } from 'fs-extra'
import { join } from 'path'
import { VUE_TEMP_TS_DIR } from './constant'
import md5 from 'md5'

export function parseTs(filename: string) {
  const program = tsCompiler.createProgram({
    rootNames: [filename],
    options: {},
  })
  const ast = program.getSourceFile(filename)
  const checker = program.getTypeChecker()
  return {
    ast,
    checker,
  }
}

export function parseVue(filename: string) {
  const vueCode = getCode(filename)
  const result = parse(vueCode)
  const scriptItems = result.children.filter((r) => (r as BaseElementNode).tag === 'script')
  if (!scriptItems.length) {
    return []
  }
  return scriptItems.map((scriptItem) => {
    const baseLine = scriptItem.loc.start.line - 1
    const tsCode = ((scriptItem as BaseElementNode).children[0] as TextNode).content
    const tsHashName = md5(filename)
    writeTsFile(tsCode, `${VUE_TEMP_TS_DIR}/${tsHashName}`)
    const vueTempTsFilename = join(process.cwd(), `${VUE_TEMP_TS_DIR}/${tsHashName}.ts`)
    return { ...parseTs(vueTempTsFilename), baseLine }
  })
}

function writeTsFile(content: string, filename: string) {
  writeFileSync(join(process.cwd(), `${filename}.ts`), content, 'utf-8')
}

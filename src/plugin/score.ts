import { CodeAnalysiserInstance, RecordDeclaration } from '../types'

export default function (context: CodeAnalysiserInstance) {
  const { importApiPlugins, browserApiPlugins, parseErrorInfo, importDeclarationMap } = context
  const mapNames = importApiPlugins
    .map((r) => r.mapName)
    .concat(browserApiPlugins.map((r) => r.mapName))
  let score = 100
  let messages: string[] = []
  if (mapNames.length > 0) {
    mapNames.forEach((item) => {
      Object.keys(context.analysisResult[item]).forEach((sitem) => {
        if (context[item][sitem].isBlack) {
          score -= 5
          messages.push(sitem + ' 属于黑名单api，请勿使用')
        }
      })
    })
  }
  Object.values(importDeclarationMap).forEach((r: RecordDeclaration[]) => {
    r.forEach((r) => {
      if (r.origin === '*') {
        score = score - 2
        messages.push('import * as ' + r.name + ' 属于非建议导入方式，建议修改')
      }
    })
  })
  if (mapNames.includes('browserMap')) {
    Object.keys(context['browserMap']).forEach((item) => {
      let keyName = ''
      if (item.split('.').length > 0) {
        keyName = item.split('.')[0]
      } else {
        keyName = item
      }
      if (keyName === 'window') {
        messages.push(item + ' 属于全局类型api，建议请评估影响慎重使用')
      }
      if (keyName === 'document') {
        messages.push(item + ' 属于Dom类型操作api，建议评估影响慎重使用')
      }
      if (keyName === 'history') {
        score = score - 2
        messages.push(item + ' 属于路由类操作，请使用框架提供的Router API代替')
      }
      if (keyName === 'location') {
        score = score - 2
        messages.push(item + ' 属于路由类操作，请使用框架提供的Router API代替')
      }
    })
  }

  if (parseErrorInfo.length > 0) {
    score = score - 3 * parseErrorInfo.length
    let tempMessage = ''
    tempMessage = parseErrorInfo.length + ' 个文件解析&分析AST时发生错误，请修复'
    messages.push(tempMessage)
  }

  if (score < 0) {
    score = 0
  }

  return {
    score,
    messages,
  }
}

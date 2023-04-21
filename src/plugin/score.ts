import { CodeAnalysiserInstance } from '../types'

export default function (context: CodeAnalysiserInstance) {
  const { importApiPlugins, browserApiPlugins, parseErrorInfo, importDeclarationMap } = context
  let totalScore = 100
  let totalMessages: string[] = []
  for (const r of importDeclarationMap.values()) {
    r.forEach((p) => {
      if (p.origin === '*') {
        totalScore = totalScore - 2
        totalMessages.push('import * as ' + p.name + ' 属于非建议导入方式，建议修改')
      }
    })
  }

  if (parseErrorInfo.length > 0) {
    totalScore = totalScore - 3 * parseErrorInfo.length
    let tempMessage = ''
    tempMessage = parseErrorInfo.length + ' 个文件解析&分析AST时发生错误，请修复'
    totalMessages.push(tempMessage)
  }

  importApiPlugins.concat(browserApiPlugins).forEach((r) => {
    const { messages, score } = r.score()
    totalScore -= score
    totalMessages.push(...messages)
  })

  if (totalScore < 0) {
    totalScore = 0
  }

  return {
    score: totalScore,
    messages: totalMessages,
  }
}

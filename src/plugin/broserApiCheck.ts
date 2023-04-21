import ts, { Node } from 'typescript'
import { CodeAnalysiserInstance, DiagnosisInfo, Plugin, RecordDeclaration } from '../types'

export default function (context: CodeAnalysiserInstance) {
  const mapName = 'browserMap'
  context[mapName] = {}
  function isBrowserCheck(
    tsCompiler: typeof ts,
    node: Node,
    depth: number,
    apiName: string,
    matchImportDeclaration: RecordDeclaration,
    filePath: string,
    projectName: string,
    repositoryUrl: string,
    line: number
  ): boolean {
    try {
      if (!context[mapName][apiName]) {
        context[mapName][apiName] = {}
        context[mapName][apiName].callNum = 1
        context[mapName][apiName].callOrigin = null
        context[mapName][apiName].callFiles = {}
        context[mapName][apiName].callFiles[filePath] = {}
        context[mapName][apiName].callFiles[filePath].projectName = projectName
        context[mapName][apiName].callFiles[filePath].repositoryUrl = repositoryUrl
        context[mapName][apiName].callFiles[filePath].lines = []
        context[mapName][apiName].callFiles[filePath].lines.push(line)
      } else {
        context[mapName][apiName].callNum++
        if (!Object.keys(context[mapName][apiName].callFiles).includes(filePath)) {
          context[mapName][apiName].callFiles[filePath] = {}
          context[mapName][apiName].callFiles[filePath].projectName = projectName
          context[mapName][apiName].callFiles[filePath].repositoryUrl = repositoryUrl
          context[mapName][apiName].callFiles[filePath].lines = []
          context[mapName][apiName].callFiles[filePath].lines.push(line)
        } else {
          context[mapName][apiName].callFiles[filePath].lines.push(line)
        }
      }
      return true
    } catch (e: unknown) {
      const error = e as Error
      const info = {
        projectName: projectName,
        apiName: apiName,
        repositoryUrl: repositoryUrl + filePath.split('&')[1] + '#L' + line,
        file: filePath.split('&')[1],
        line: line,
        stack: error.stack,
      }
      context.addDiagnosisInfo(info)
      return false
    }
  }
  function browserApiScore() {
    const messages: string[] = []
    let score = 0
    Object.keys(context.analysisResult[mapName]).forEach((item) => {
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

    return {
      score,
      messages,
    }
  }
  return {
    mapName: mapName,
    check: isBrowserCheck,
    score: browserApiScore,
    afterHook: null,
  } as Plugin
}

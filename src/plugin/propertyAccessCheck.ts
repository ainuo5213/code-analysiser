import ts, { Node } from 'typescript'
import { CodeAnalysiserInstance, DiagnosisInfo, Plugin, RecordDeclaration } from '../types'

export default function (context: CodeAnalysiserInstance) {
  const mapName = 'propertyAccessMap'
  context[mapName] = {}
  function isPropertyAccessCheck(
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
        context[mapName][apiName].callOrigin = matchImportDeclaration.origin
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
      return true // true: 命中规则, 终止执行后序插件
    } catch (e: unknown) {
      const error = e as Error
      const info = {
        projectName: projectName,
        matchImportDeclaration: matchImportDeclaration,
        apiName: apiName,
        repositoryUrl: (repositoryUrl || '') + filePath.split('&')[1] + '#L' + line,
        file: filePath.split('&')[1],
        line: line,
        stack: error.stack,
      } as DiagnosisInfo
      context.addDiagnosisInfo(info)
      return false
    }
  }
  function propertyAccessScore() {
    let score = 0
    let messages: string[] = []

    Object.keys(context.analysisResult[mapName]).forEach((sitem) => {
      if (context.analysisResult[mapName][sitem].isBlack) {
        score -= 5
        messages.push(sitem + ' 属于黑名单api，请勿使用')
      }
    })
    return {
      score,
      messages,
    }
  }
  return {
    mapName: mapName,
    check: isPropertyAccessCheck,
    score: propertyAccessScore,
    afterHook: null,
  } as Plugin
}

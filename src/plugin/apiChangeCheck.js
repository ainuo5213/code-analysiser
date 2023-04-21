export default function (context) {
  const mapName = 'apiChangeMap'
  context[mapName] = {}
  function isApiChangedCheck(
    tsCompiler,
    node,
    depth,
    apiName,
    matchImportDeclaration,
    filePath,
    projectName,
    repositoryUrl,
    line
  ) {
    try {
      let parentNode = node.parent
      let hasChanged = false
      while (parentNode.pos !== parentNode.parent.pos && parentNode.end !== parentNode.parent.end) {
        if (tsCompiler.isPropertyAccessExpression(parentNode)) {
          parentNode = parentNode.parent
        } else if (tsCompiler.isBinaryExpression(parentNode)) {
          if (parentNode.operatorToken.getText() === '=') {
            hasChanged = true
          }
          break
        }
      }
      if (hasChanged) {
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
    } catch (e) {
      const error = e
      const info = {
        projectName: projectName,
        matchImportDeclaration: matchImportDeclaration,
        apiName: apiName,
        repositoryUrl: (repositoryUrl || '') + filePath.split('&')[1] + '#L' + line,
        file: filePath.split('&')[1],
        line: line,
        stack: error.stack,
      }
      context.addDiagnosisInfo(info)
      return false
    }
  }
  function apiChangeScore() {
    let score = 0
    let messages = []

    Object.keys(context.analysisResult[mapName]).forEach((sitem) => {
      score -= 5
      messages.push(sitem + ' 被修改，请谨慎对待')
    })
    return {
      score,
      messages,
    }
  }
  return {
    mapName: mapName,
    check: isApiChangedCheck,
    score: apiChangeScore,
    afterHook: null,
  }
}

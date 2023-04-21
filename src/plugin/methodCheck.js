export default function (context) {
  const mapName = 'methodMap'
  context[mapName] = {}
  function isMethodCheck(
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
      if (node.parent && tsCompiler.isCallExpression(node.parent)) {
        // 存在于函数调用表达式中
        if (node.parent.expression.pos == node.pos && node.parent.expression.end == node.end) {
          // 命中函数名method检测
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
        }
      }
      return false
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
  function methodCallScore() {
    let score = 0
    let messages = []

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
    check: isMethodCheck,
    score: methodCallScore,
    afterHook: null,
  }
}

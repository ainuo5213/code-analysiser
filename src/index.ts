// Import here Polyfills if needed. Recommended core-js (npm i -D core-js)
// import "core-js/fn/array.find"
import ts, {
  Identifier,
  isIdentifier,
  isPropertyAccessExpression,
  Node,
  PropertyAccessExpression,
  SourceFile,
  TypeChecker,
} from 'typescript'
import getImportDeclarations from './import'
import parse from './parse'
import scan from './scan'
import traverse from './traverse'
import {
  AccessPropertyResult,
  RecordDeclaration,
  SourceConfig,
  Plugin,
  ScanResult,
  CodeAnalysiserInstance,
  DiagnosisInfo,
} from './types'
import methodPlugin from './plugin/methodCheck'

export default class CodeAnalysiser implements CodeAnalysiserInstance {
  public plugins: Plugin[] = []
  constructor() {
    // TODO: 配置和插件应从构造器的参数传入

    // 安装插件
    this._installPlugins([])

    // 扫描代码
    this._scanCode([
      {
        path: ['src/__test__'],
        name: 'test',
        libs: ['framework'],
      },
    ])
  }

  addDiagnosisInfo(diagnosisInfo: DiagnosisInfo) {
    // TODO: addDiagnosisInfo
    console.log(diagnosisInfo)
  }

  _runPlugins(
    tsCompiler: typeof ts,
    baseNode: Node,
    depth: number,
    apiName: string,
    matchImportDeclaration: RecordDeclaration,
    filePath: string,
    projectName: string,
    repositoryUrl: string,
    line: number
  ) {
    if (this.plugins.length > 0) {
      for (let i = 0; i < this.plugins.length; i++) {
        const checkFun = this.plugins[i].check
        if (
          checkFun(
            tsCompiler,
            baseNode,
            depth,
            apiName,
            matchImportDeclaration,
            filePath,
            projectName,
            repositoryUrl,
            line
          )
        ) {
          break
        }
      }
    }
  }

  _runPluginsHook(
    importDeclarations: Map<string, RecordDeclaration>,
    ast: SourceFile,
    checker: TypeChecker,
    filePath: string,
    projectName: string,
    reponsitoryUrl: string,
    baseLine: number
  ) {
    if (this.plugins.length > 0) {
      for (let i = 0; i < this.plugins.length; i++) {
        const afterHook = this.plugins[i].afterHook
        if (afterHook && typeof afterHook === 'function') {
          afterHook(
            this,
            this.plugins[i].mapName,
            importDeclarations,
            ast,
            checker,
            filePath,
            projectName,
            reponsitoryUrl,
            baseLine
          )
        }
      }
    }
  }

  private _installPlugins(plugins: Plugin[]) {
    if (plugins.length > 0) {
      plugins.forEach((r) => {
        this.plugins.push(r)
      })
    }
    this.plugins.push(methodPlugin(this))
  }

  private _scanFiles(source: SourceConfig[]) {
    const entries: ScanResult[] = []
    source.forEach((r) => {
      const entry: ScanResult = {
        name: r.name,
        reponsitoryUrl: r.reponsitoryUrl,
        parse: [],
        libs: r.libs,
      }
      const parsed: string[] = []
      r.path.forEach((p) => {
        let _entry = scan(p)
        parsed.push(..._entry)
      })
      entry.parse = parsed
      entries.push(entry)
    })
    return entries
  }

  private _scanCode(source: SourceConfig[]) {
    // 根据提供的path扫描出文件列表
    const entryFiles = this._scanFiles(source)

    entryFiles.forEach((r) => {
      const entryFile = r
      const parsedFiles = entryFile.parse

      if (parsedFiles.length === 0) {
        return
      }
      parsedFiles.forEach((filename) => {
        // 解析文件内容得到ast和类型检查器checker
        const { ast, checker } = parse(filename)
        if (!ast) {
          return
        }

        // step1. 找到符合lib下的导入声明
        const importDeclarations = this._findImportDeclarations(ast, filename, entryFile)

        // step2. 找到调用的位置并记录
        this._findCallInfo(importDeclarations, ast, checker, entryFile, filename)
      })
    })
  }

  private _findImportDeclarations(
    ast: SourceFile,
    filePath: string,
    entry: ScanResult,
    baseLine = 0
  ) {
    const importDeclartions = new Map<string, RecordDeclaration>()
    function _writeImportDeclaration(importDeclation: RecordDeclaration) {
      importDeclartions.set(importDeclation.name, {
        ...importDeclation,
      })
    }
    traverse(ast, (node) => {
      const line = ast.getLineAndCharacterOfPosition(node.getStart()).line + baseLine + 1
      getImportDeclarations(node, _writeImportDeclaration, line, entry.libs)
    })

    return importDeclartions
  }

  private _findCallInfo(
    importDeclarationMap: Map<string, RecordDeclaration>,
    ast: SourceFile,
    checker: TypeChecker,
    entryFile: ScanResult,
    filename: string,
    baseLine = 0
  ) {
    const importDeclarationKeys = Array.from(importDeclarationMap.keys())

    if (importDeclarationKeys.length === 0) {
      return
    }

    traverse(ast, (node) => {
      const line = ast.getLineAndCharacterOfPosition(node.getStart()).line + baseLine + 1
      this._getCallInfo(node, importDeclarationMap, checker, filename, entryFile, line)
    })
    this._runPluginsHook(
      importDeclarationMap,
      ast,
      checker,
      filename,
      entryFile.name,
      entryFile.reponsitoryUrl || '',
      baseLine
    )
  }

  private _getCallInfo(
    node: Node,
    declarationMap: Map<string, RecordDeclaration>,
    checker: TypeChecker,
    filePath: string,
    entryFile: ScanResult,
    line: number
  ) {
    const declarationKeys = Array.from(declarationMap.keys())
    if (isIdentifier(node) && node.escapedText && declarationKeys.includes(node.escapedText)) {
      const currentApiDeclarataion = declarationMap.get(node.escapedText)!
      // 排除import节点的干扰
      if (
        node.pos !== currentApiDeclarataion.identitiferPos &&
        node.end !== currentApiDeclarataion.identitiferEnd
      ) {
        const symbol = checker.getSymbolAtLocation(node)
        if (symbol?.declarations?.length) {
          const nodeSymbol = symbol.declarations[0]
          // 如果其依赖的声明位置和采集到的声明位置一样，则表明引用的该导入的方法
          if (
            nodeSymbol.pos === currentApiDeclarataion.symbolPos &&
            nodeSymbol.end === currentApiDeclarataion.symbolEnd
          ) {
            // 有parent的情况下需要记录的api调用
            if (node.parent) {
              const { baseNode, depth, apiName } = this._getAccessProperty(node)
              // 调用分析的插件
              this._runPlugins(
                ts,
                baseNode,
                depth,
                apiName,
                currentApiDeclarataion,
                filePath,
                entryFile.name,
                entryFile.reponsitoryUrl || '',
                line
              )
            } else {
              //节点如果没有parent属性，说明AST节点语义异常，不存在分析意义
            }
          } else {
            // 如果依赖的位置和采集的声明位置不一样，则代表是引用的其他的变量
          }
        } else {
          // 没有declaration关联，则代表是同名的变量，不予采集
        }
      }
    }
  }

  private _getAccessProperty(
    node: Identifier | PropertyAccessExpression,
    index = 0,
    apiName = ''
  ): AccessPropertyResult {
    if (index > 0) {
      // 如果是xx.xx.xx这种情况，要一直持续到他不是一个propertyAccessExpression为止，这样需要拼接apiName
      apiName = apiName + '.' + (node as PropertyAccessExpression).name.escapedText
    } else {
      apiName = apiName + (node as Identifier).escapedText
    }
    // 如果是链式访问调用的话，则需要查找到其调用链顶
    if (isPropertyAccessExpression(node.parent)) {
      index++
      return this._getAccessProperty(node.parent, index, apiName)
    } else {
      return {
        baseNode: node,
        depth: index,
        apiName: apiName,
      }
    }
  }
}

const codeAnalysiser = new CodeAnalysiser() as any
console.log(codeAnalysiser.methodMap)

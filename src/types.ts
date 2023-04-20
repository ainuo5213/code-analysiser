import ts, { Node, SourceFile, TypeChecker } from 'typescript'
import CodeAnalysiser from '.'

export type RecordDeclaration = {
  name: string
  origin: string | null
  symbolPos: number
  symbolEnd: number
  identitiferPos: number
  identitiferEnd: number
  line: number
}

export type AccessPropertyResult = {
  baseNode: Node
  depth: number
  apiName: string
}

export type NodeCheckResultFile = {
  projectName: string
  repositoryUrl?: string
  lines: number[]
}

export type NodeCheckResult = {
  callNum: number
  callOrigin: string
  callFiles: Record<string, NodeCheckResultFile>
}

export type SourceConfig = {
  name: string
  path: string[]
  package?: string
  reponsitoryUrl?: string
  libs: string[]
}
export type ScanResult = {
  name: string
  parse: string[]
  reponsitoryUrl: string
  libs: string[]
}
export type Plugin = {
  check: (
    tsCompiler: typeof ts,
    baseNode: Node,
    depth: number,
    apiName: string,
    matchImportDeclaration: RecordDeclaration | null,
    filePath: string,
    projectName: string,
    repositoryUrl: string,
    line: number
  ) => boolean
  mapName: string
  afterHook:
    | ((
        instance: CodeAnalysiser,
        mapName: string,
        importDeclarations: Map<string, RecordDeclaration>,
        ast: SourceFile,
        checker: TypeChecker,
        filePath: string,
        projectName: string,
        reponsitoryUrl: string,
        baseLine: number
      ) => void)
    | null
}

export type DiagnosisInfo = {
  projectName: string
  matchImportDeclaration?: RecordDeclaration
  apiName: string
  repositoryUrl: string
  file: string
  line: number
  stack?: string
}

export interface CodeAnalysiserInstance {
  [K: string]: any
  importApiPlugins: Plugin[]
  browserApiPlugins: Plugin[]
  browserApis: string[]
  addDiagnosisInfo: (diagnosisInfo: DiagnosisInfo) => void
}

export type ScanFileType = 'vue' | 'ts' | 'tsx'

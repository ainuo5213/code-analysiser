import tsCompiler from 'typescript'

export default function parse(filename: string) {
  const program = tsCompiler.createProgram({
    rootNames: [filename],
    options: {}
  })
  const ast = program.getSourceFile(filename)
  const checker = program.getTypeChecker()
  return {
    ast,
    checker
  }
}

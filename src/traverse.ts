import tsCompiler from 'typescript'

export default function traverse(node: tsCompiler.Node, callback: (node: tsCompiler.Node) => void) {
  tsCompiler.forEachChild(node, node => {
    traverse(node, callback)
  })

  callback(node)
}

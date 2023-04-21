import tsCompiler from 'typescript'

export default function traverse(node, callback) {
  tsCompiler.forEachChild(node, (node) => {
    traverse(node, callback)
  })

  callback(node)
}

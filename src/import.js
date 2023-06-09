import tsCompiler from 'typescript'

export default function getImportDeclarations(node, write, line, libs, filePath) {
  if (tsCompiler.isImportDeclaration(node)) {
    if (!libs.map((r) => '' + r + '').includes(node.moduleSpecifier.getText().slice(1, -1))) {
      return
    }
    if (!node.importClause) {
      return
    }
    // import xxx from 'yyy'
    if (node.importClause.name) {
      write({
        name: node.importClause.name.escapedText.toString(),
        fromLib: node.moduleSpecifier.text,
        origin: null,
        symbolPos: node.importClause.pos,
        symbolEnd: node.importClause.end,
        identitiferPos: node.importClause.name.pos,
        identitiferEnd: node.importClause.name.end,
        line,
        filePath,
      })
    }
    // import * as XXX from 'yyy' or import { xxx as XXX } from 'yyy' or import { xxx } from 'yyy'
    if (node.importClause.namedBindings) {
      // import { xxx as XXX } from 'yyy' and import { xxx } from 'yyy'
      if (
        tsCompiler.isNamedImports(node.importClause.namedBindings) &&
        node.importClause.namedBindings.elements.length > 0
      ) {
        const importElements = node.importClause.namedBindings.elements
        importElements.forEach((r) => {
          if (tsCompiler.isImportSpecifier(r)) {
            write({
              name: r.name.escapedText.toString(),
              origin: r.propertyName ? r.propertyName.escapedText.toString() : null,
              symbolPos: r.pos,
              symbolEnd: r.end,
              identitiferPos: r.name.pos,
              identitiferEnd: r.end,
              fromLib: node.moduleSpecifier.text,
              line,
              filePath,
            })
          }
        })
      }

      // import * as XXX from 'yyy'
      if (
        tsCompiler.isNamespaceImport(node.importClause.namedBindings) &&
        node.importClause.namedBindings.name
      ) {
        write({
          name: node.importClause.namedBindings.name.escapedText.toString(),
          origin: '*',
          symbolPos: node.importClause.namedBindings.pos,
          symbolEnd: node.importClause.namedBindings.end,
          identitiferPos: node.importClause.namedBindings.name.pos,
          identitiferEnd: node.importClause.namedBindings.end,
          fromLib: node.moduleSpecifier.text,
          line,
          filePath,
        })
      }
    }
  }
}

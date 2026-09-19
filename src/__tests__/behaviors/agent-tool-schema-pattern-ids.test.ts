import fs from 'node:fs';
import path from 'node:path';

import ts from 'typescript';

const PATTERN_ID = /\b(?:PAT-[A-Z0-9-]+|pattern_[a-z0-9_]+)\b/g;

function sourceFiles(root: string): string[] {
  const files: string[] = [];

  function walk(directory: string): void {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.name === '__tests__') continue;
      const candidate = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(candidate);
      else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) files.push(candidate);
    }
  }

  walk(root);
  return files;
}

function staticString(node: ts.Expression): string | null {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const left = staticString(node.left);
    const right = staticString(node.right);
    return left === null || right === null ? null : left + right;
  }
  return null;
}

describe('agent tool schema descriptions', () => {
  it('do not embed corpus pattern identifiers in model-facing prose', () => {
    const violations: string[] = [];

    for (const file of sourceFiles(path.join(process.cwd(), 'src/lib/agent/tools'))) {
      const source = fs.readFileSync(file, 'utf8');
      const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);

      function visit(node: ts.Node): void {
        if (
          ts.isPropertyAssignment(node) &&
          ((ts.isIdentifier(node.name) && node.name.text === 'description') ||
            (ts.isStringLiteral(node.name) && node.name.text === 'description'))
        ) {
          const value = staticString(node.initializer);
          const identifiers = value?.match(PATTERN_ID) ?? [];
          if (identifiers.length > 0) {
            const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
            violations.push(
              `${path.relative(process.cwd(), file)}:${line + 1} -> ${identifiers.join(', ')}`,
            );
          }
        }
        ts.forEachChild(node, visit);
      }

      visit(sourceFile);
    }

    expect(violations).toEqual([]);
  });
});

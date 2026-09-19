import fs from 'node:fs';
import path from 'node:path';

import ts from 'typescript';

const TEST_FILE_PATTERN = /(?:test|spec)\.tsx?$/;

function collectTestFiles(root: string): string[] {
  const files: string[] = [];

  function walk(directory: string): void {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const candidate = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(candidate);
      } else if (TEST_FILE_PATTERN.test(entry.name)) {
        files.push(candidate);
      }
    }
  }

  walk(root);
  return files;
}

function positiveSuccessSubjects(
  expression: ts.Expression,
  sourceFile: ts.SourceFile,
): string[] {
  const subjects = new Set<string>();

  function visit(node: ts.Node): void {
    if (
      ts.isPropertyAccessExpression(node) &&
      node.name.text === 'success' &&
      ts.isIdentifier(node.expression)
    ) {
      const expressionText = expression.getText(sourceFile);
      if (!expressionText.includes(`!${node.expression.text}.success`)) {
        subjects.add(node.expression.text);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(expression);
  return [...subjects];
}

describe('test success guards', () => {
  it('asserts successful tool results before using success as a type-narrowing guard', () => {
    const violations: string[] = [];

    for (const file of collectTestFiles(path.join(process.cwd(), 'src'))) {
      const source = fs.readFileSync(file, 'utf8');
      const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);

      function visit(node: ts.Node): void {
        if (ts.isIfStatement(node) && ts.isBlock(node.parent)) {
          const subjects = positiveSuccessSubjects(node.expression, sourceFile);
          if (subjects.length > 0) {
            const index = node.parent.statements.indexOf(node);
            const priorText = node.parent.statements
              .slice(0, index)
              .map((statement) => statement.getText(sourceFile))
              .join('\n');

            for (const subject of subjects) {
              const asserted = new RegExp(
                `expect\\s*\\(\\s*${subject}\\.success\\s*\\)`,
              ).test(priorText);
              if (!asserted) {
                const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
                violations.push(`${path.relative(process.cwd(), file)}:${line + 1}`);
              }
            }
          }
        }
        ts.forEachChild(node, visit);
      }

      visit(sourceFile);
    }

    expect(violations).toEqual([]);
  });
});

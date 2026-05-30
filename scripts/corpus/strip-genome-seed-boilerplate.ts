#!/usr/bin/env tsx
/**
 * strip-genome-seed-boilerplate.ts
 *
 * Converts genome seed files from the old Supabase-boilerplate format to the
 * canonical data-only format expected by the durable loader.
 *
 * STRIPS:
 *   - import statements (path, pathToFileURL, deterministicUuid, createSeedClient, etc.)
 *   - graphEdgesFor() function
 *   - upsertRows() function
 *   - main() function
 *   - isDirect / if (isDirect) runner block
 *
 * KEEPS:
 *   - Leading comment header (// lines at top of file)
 *   - type alias declarations  (e.g. type OfficeCategory = ...)
 *   - interface declarations   (e.g. interface AirlineRevenuePatternSeed { ... })
 *   - Variable statements whose declared name ends in PATTERNS (e.g. const FOO_PATTERNS = [...])
 *
 * Usage:
 *   npx tsx scripts/corpus/strip-genome-seed-boilerplate.ts <file...>
 *
 *   # All genome seed files at once:
 *   find src/scripts/seed -maxdepth 1 -name 'seed-airline-dom*.ts' -o -name 'seed-healthcare-dom*.ts' \
 *     -o -name 'seed-medtech-dom*.ts' -o -name 'seed-banking-dom*.ts' -o -name 'seed-cross-industry-dom*.ts' \
 *     | sort | xargs npx tsx scripts/corpus/strip-genome-seed-boilerplate.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

function stripFile(filePath: string): { changed: boolean; linesBefore: number; linesAfter: number } {
  const original = fs.readFileSync(filePath, 'utf8');
  const lines = original.split('\n');
  const source = ts.createSourceFile(filePath, original, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);

  // --- Collect header comment lines (contiguous // comments + blank lines at top) ---
  const headerLines: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('//')) {
      headerLines.push(line);
    } else {
      break;
    }
  }
  // Trim trailing blank lines from header block
  while (headerLines.length > 0 && headerLines.at(-1)!.trim() === '') {
    headerLines.pop();
  }

  // --- Collect AST nodes to keep ---
  const keepSections: string[] = [];

  if (headerLines.length > 0) {
    keepSections.push(headerLines.join('\n'));
  }

  ts.forEachChild(source, (node) => {
    if (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) {
      const startLine = source.getLineAndCharacterOfPosition(node.getStart(source)).line;
      const endLine = source.getLineAndCharacterOfPosition(node.getEnd()).line;
      const text = lines.slice(startLine, endLine + 1).join('\n').trim();
      if (text) keepSections.push(text);
      return;
    }

    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && /PATTERNS$/.test(decl.name.text)) {
          const startLine = source.getLineAndCharacterOfPosition(node.getStart(source)).line;
          const endLine = source.getLineAndCharacterOfPosition(node.getEnd()).line;
          let text = lines.slice(startLine, endLine + 1).join('\n').trim();
          // Ensure the array is exported so the file is an ES module (prevents
          // TS2300 duplicate-identifier errors when multiple seed files declare
          // `type OfficeCategory` at global scope) and satisfies the ESLint
          // no-unused-vars rule.
          if (!text.startsWith('export ')) {
            text = 'export ' + text;
          }
          if (text) keepSections.push(text);
          break;
        }
      }
    }
  });

  if (keepSections.length === 0) {
    throw new Error(`${filePath}: no *PATTERNS array found — refusing to strip`);
  }

  const output = keepSections.join('\n\n') + '\n';

  if (output === original) {
    return { changed: false, linesBefore: lines.length, linesAfter: output.split('\n').length };
  }

  fs.writeFileSync(filePath, output, 'utf8');
  return { changed: true, linesBefore: lines.length, linesAfter: output.split('\n').length };
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error(
    'Usage: npx tsx scripts/corpus/strip-genome-seed-boilerplate.ts <file...>\n' +
    '\n' +
    '  # All genome seed files:\n' +
    "  find src/scripts/seed -maxdepth 1 -type f \\( -name 'seed-airline-dom*.ts' -o -name 'seed-healthcare-dom*.ts' \\) \\\n" +
    '    | sort | xargs npx tsx scripts/corpus/strip-genome-seed-boilerplate.ts',
  );
  process.exit(1);
}

let stripped = 0;
let alreadyClean = 0;
let errors = 0;

for (const file of files) {
  const abs = path.resolve(file);
  try {
    const result = stripFile(abs);
    if (result.changed) {
      console.log(`✓ stripped  ${file}  (${result.linesBefore} → ${result.linesAfter} lines)`);
      stripped++;
    } else {
      console.log(`  clean     ${file}`);
      alreadyClean++;
    }
  } catch (err) {
    console.error(`✗ error     ${file}: ${(err as Error).message}`);
    errors++;
  }
}

console.log(`\nDone: ${stripped} stripped, ${alreadyClean} already clean, ${errors} errors`);
if (errors > 0) process.exit(1);

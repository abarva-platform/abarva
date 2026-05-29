#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';

const ROOT = process.cwd();
const RUNTIME_DIRS = ['src/app', 'src/lib'];
const EXCLUDE_PARTS = new Set(['__mocks__', '__tests__']);
const OUTPUT_DIR = path.join(ROOT, 'verification/packet-30-phase-2c');
const OUTPUT_JSON = path.join(OUTPUT_DIR, 'CODEMOD_INVENTORY.json');
const OUTPUT_MD = path.join(OUTPUT_DIR, 'CODEMOD_INVENTORY.md');

const IMPORT_RE = /@supabase|supabase-server|createServerSupabase|createServiceRoleClient|createRouteHandlerClient|getServerSupabase/g;
const BROAD_RE = /@supabase|supabase-js|supabase-server|createServerSupabase|createServiceRoleClient|createRouteHandlerClient|getServerSupabase|\.from\s*\(/g;

const HELPER_NAMES = new Set([
  'createRouteHandlerClient',
  'createServerSupabase',
  'createServerSupabaseClient',
  'createServiceRoleClient',
  'getServerSupabase',
]);

const READ_METHODS = new Set([
  'contains',
  'eq',
  'gt',
  'gte',
  'head',
  'ilike',
  'in',
  'is',
  'like',
  'limit',
  'lt',
  'lte',
  'maybeSingle',
  'neq',
  'not',
  'order',
  'range',
  'select',
  'single',
]);

const WRITE_METHODS = new Set([
  'delete',
  'insert',
  'remove',
  'update',
  'upsert',
]);

const STORAGE_READ_METHODS = new Set(['createSignedUrl', 'download', 'getPublicUrl', 'list']);
const STORAGE_WRITE_METHODS = new Set(['copy', 'move', 'remove', 'upload']);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full);
    if (entry.isDirectory()) {
      if (EXCLUDE_PARTS.has(entry.name)) continue;
      out.push(...walk(full));
      continue;
    }
    if (!/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) continue;
    if (/\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) continue;
    out.push(rel);
  }
  return out;
}

function countMatches(text, pattern) {
  pattern.lastIndex = 0;
  return Array.from(text.matchAll(pattern)).length;
}

function sourceKind(file) {
  if (/\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/.test(file) || file.includes('/__tests__/')) {
    return 'test';
  }
  return 'runtime';
}

function groupFor(file) {
  if (file.startsWith('src/app/api/')) return 'api_routes';
  if (file.startsWith('src/app/')) return 'app_routes';
  if (file.startsWith('src/lib/source/')) return 'source';
  if (file.startsWith('src/lib/tower/')) return 'tower';
  if (file.startsWith('src/lib/programs/')) return 'programs';
  if (file.startsWith('src/lib/intelligence/')) return 'intelligence';
  if (file.startsWith('src/lib/knowledge/')) return 'knowledge';
  if (file.startsWith('src/lib/admin/')) return 'admin';
  if (file.startsWith('src/lib/db/')) return 'db';
  return 'other_lib';
}

function nodeText(node, sourceFile) {
  return node.getText(sourceFile);
}

function analyzeAst(file, text) {
  const sourceFile = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') || file.endsWith('.jsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const imports = [];
  const helperRefs = new Set();
  const tableNames = new Set();
  const methodNames = new Set();
  const readMethods = new Set();
  const writeMethods = new Set();
  const storageReadMethods = new Set();
  const storageWriteMethods = new Set();
  let supabaseFromCalls = 0;
  let arrayFromCalls = 0;
  let storageAccesses = 0;
  let rpcCalls = 0;

  function visit(node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const specifier = node.moduleSpecifier.text;
      if (specifier.includes('@supabase') || specifier.includes('supabase-server')) {
        imports.push(specifier);
      }
    }

    if (ts.isIdentifier(node) && HELPER_NAMES.has(node.text)) {
      helperRefs.add(node.text);
    }

    if (ts.isPropertyAccessExpression(node) && node.name.text === 'storage') {
      storageAccesses += 1;
    }

    if (ts.isCallExpression(node)) {
      const expression = node.expression;
      if (ts.isIdentifier(expression) && HELPER_NAMES.has(expression.text)) {
        helperRefs.add(expression.text);
      }
      if (ts.isPropertyAccessExpression(expression)) {
        const name = expression.name.text;
        methodNames.add(name);
        if (READ_METHODS.has(name)) readMethods.add(name);
        if (WRITE_METHODS.has(name)) writeMethods.add(name);
        if (STORAGE_READ_METHODS.has(name)) storageReadMethods.add(name);
        if (STORAGE_WRITE_METHODS.has(name)) storageWriteMethods.add(name);
        if (name === 'rpc') rpcCalls += 1;

        if (name === 'from') {
          const receiver = nodeText(expression.expression, sourceFile);
          if (receiver === 'Array') {
            arrayFromCalls += 1;
          } else {
            supabaseFromCalls += 1;
            const firstArg = node.arguments[0];
            if (firstArg && ts.isStringLiteralLike(firstArg)) {
              tableNames.add(firstArg.text);
            }
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return {
    imports: [...imports].sort(),
    helperRefs: [...helperRefs].sort(),
    tableNames: [...tableNames].sort(),
    methodNames: [...methodNames].sort(),
    readMethods: [...readMethods].sort(),
    writeMethods: [...writeMethods].sort(),
    storageReadMethods: [...storageReadMethods].sort(),
    storageWriteMethods: [...storageWriteMethods].sort(),
    supabaseFromCalls,
    arrayFromCalls,
    storageAccesses,
    rpcCalls,
  };
}

function classify(file, counts, ast) {
  const kind = sourceKind(file);
  const hasSupabaseSignal =
    counts.importMatches > 0 ||
    ast.imports.length > 0 ||
    ast.helperRefs.length > 0 ||
    ast.supabaseFromCalls > 0;
  const hasReadSignal = ast.readMethods.length > 0 || ast.supabaseFromCalls > 0 || ast.storageReadMethods.length > 0;
  const hasWriteSignal = ast.writeMethods.length > 0 || ast.storageWriteMethods.length > 0;
  const hasStorageSignal = ast.storageAccesses > 0 || ast.storageReadMethods.length > 0 || ast.storageWriteMethods.length > 0;

  const notes = [];
  if (counts.broadMatches > 0 && !hasSupabaseSignal) {
    notes.push('broad-only match; usually Array.from or unrelated .from usage');
  }
  if (ast.rpcCalls > 0) notes.push('rpc call requires manual review');
  if (ast.tableNames.length === 0 && hasSupabaseSignal) notes.push('no static table names detected');
  if (ast.writeMethods.includes('delete')) notes.push('delete method present; may be Array.delete or Supabase delete');

  if (kind === 'test') {
    return { classification: 'TEST_ONLY', notes };
  }
  if (!hasSupabaseSignal) {
    return { classification: 'DEFER_MANUAL', notes };
  }
  if (hasWriteSignal && (hasReadSignal || hasStorageSignal)) {
    return { classification: 'MIXED_READ_WRITE', notes };
  }
  if (hasWriteSignal) {
    return { classification: 'MUTATION_WRITE', notes };
  }
  if (hasStorageSignal) {
    return { classification: 'READ_WITH_STORAGE', notes };
  }
  if (hasSupabaseSignal && hasReadSignal) {
    return { classification: 'READ_ONLY_SELECT', notes };
  }
  return { classification: 'DEFER_MANUAL', notes };
}

function frequency(rows, key) {
  return rows.reduce((acc, row) => {
    const value = row[key];
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function markdownTable(rows) {
  const lines = [
    '| File | Classification | Group | Import Matches | Broad Matches | Tables | Notes |',
    '|---|---:|---:|---:|---:|---|---|',
  ];
  for (const row of rows) {
    lines.push([
      row.file,
      row.classification,
      row.group,
      String(row.importMatches),
      String(row.broadMatches),
      row.tableNames.join(', ') || '-',
      row.notes.join('; ') || '-',
    ].map((cell) => ` ${String(cell).replaceAll('|', '\\|')} `).join('|').replace(/^/, '|').replace(/$/, '|'));
  }
  return lines.join('\n');
}

const files = RUNTIME_DIRS.flatMap((dir) => walk(path.join(ROOT, dir)));
const rows = files
  .map((file) => {
    const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const counts = {
      importMatches: countMatches(text, IMPORT_RE),
      broadMatches: countMatches(text, BROAD_RE),
    };
    if (counts.importMatches === 0 && counts.broadMatches === 0) return null;
    const ast = analyzeAst(file, text);
    const classified = classify(file, counts, ast);
    return {
      file,
      group: groupFor(file),
      sourceKind: sourceKind(file),
      classification: classified.classification,
      importMatches: counts.importMatches,
      broadMatches: counts.broadMatches,
      ...ast,
      notes: classified.notes,
    };
  })
  .filter(Boolean)
  .sort((a, b) =>
    a.classification.localeCompare(b.classification) ||
    a.group.localeCompare(b.group) ||
    b.importMatches - a.importMatches ||
    b.broadMatches - a.broadMatches ||
    a.file.localeCompare(b.file),
  );

const summary = {
  generatedAt: new Date().toISOString(),
  scannedDirs: RUNTIME_DIRS,
  totalFiles: rows.length,
  filesWithImportMatches: rows.filter((row) => row.importMatches > 0).length,
  importMatches: rows.reduce((sum, row) => sum + row.importMatches, 0),
  filesWithBroadMatches: rows.filter((row) => row.broadMatches > 0).length,
  broadMatches: rows.reduce((sum, row) => sum + row.broadMatches, 0),
  classificationCounts: frequency(rows, 'classification'),
  groupCounts: frequency(rows, 'group'),
};

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(OUTPUT_JSON, JSON.stringify({ summary, rows }, null, 2) + '\n');

const md = [
  '# Packet 30 Phase 2C Codemod Inventory',
  '',
  'Read-only inventory. No runtime code was modified by this artifact.',
  '',
  '## Summary',
  '',
  `- Generated at: \`${summary.generatedAt}\``,
  `- Total files in inventory: \`${summary.totalFiles}\``,
  `- Files with import-helper matches: \`${summary.filesWithImportMatches}\``,
  `- Import-helper matches: \`${summary.importMatches}\``,
  `- Files with broad matches: \`${summary.filesWithBroadMatches}\``,
  `- Broad matches: \`${summary.broadMatches}\``,
  '',
  '## Classification Counts',
  '',
  ...Object.entries(summary.classificationCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `- \`${key}\`: ${value}`),
  '',
  '## Group Counts',
  '',
  ...Object.entries(summary.groupCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `- \`${key}\`: ${value}`),
  '',
  '## 2C Execution Guidance',
  '',
  '- `READ_ONLY_SELECT`: candidate for 2C.1 pure read migration.',
  '- `MIXED_READ_WRITE`: candidate for 2C.2 read/write split; do not codemod writes.',
  '- `READ_WITH_STORAGE`: candidate for 2C.3 storage adapter or explicit exception.',
  '- `MUTATION_WRITE`: leave out of read migration unless a read helper is extracted manually.',
  '- `DEFER_MANUAL`: broad-only or ambiguous match; review before touching.',
  '- `TEST_ONLY`: test/reference files only.',
  '',
  '## Inventory',
  '',
  markdownTable(rows),
  '',
].join('\n');

fs.writeFileSync(OUTPUT_MD, md);
console.log(JSON.stringify(summary, null, 2));

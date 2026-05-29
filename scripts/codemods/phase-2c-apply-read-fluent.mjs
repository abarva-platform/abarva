#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';

const ROOT = process.cwd();
const INVENTORY = path.join(ROOT, 'verification/packet-30-phase-2c/CODEMOD_INVENTORY.json');
const LEGACY_MODULE = '@/lib/supabase-server';
const NEW_MODULE = '@/lib/data-plane/postgresCompat';
const LEGACY_HELPER = 'getServerSupabase';
const NEW_HELPER = 'getAzureReadFluentClient';
const WRITE_METHODS = new Set(['delete', 'insert', 'update', 'upsert']);

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=');
    return [key, rest.join('=') || 'true'];
  }),
);

const groups = new Set((args.get('groups') ?? '').split(',').map((item) => item.trim()).filter(Boolean));
const filesArg = new Set((args.get('files') ?? '').split(',').map((item) => item.trim()).filter(Boolean));
const maxFiles = Number(args.get('max-files') ?? '100');
const dryRun = args.has('dry-run');
const output = args.get('output')
  ? path.join(ROOT, args.get('output'))
  : path.join(ROOT, 'verification/packet-30-phase-2c/2c-read-fluent-codemod-report.json');

function sourceKind(file) {
  return file.endsWith('.tsx') || file.endsWith('.jsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
}

function createSource(file, text) {
  return ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, sourceKind(file));
}

function nodeText(node, sourceFile) {
  return node.getText(sourceFile);
}

function collectLegacyClientVariables(sourceFile) {
  const names = new Set();
  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      ts.isIdentifier(node.initializer.expression) &&
      node.initializer.expression.text === LEGACY_HELPER
    ) {
      names.add(node.name.text);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return names;
}

function expressionStartsWithLegacyClient(expression, sourceFile, clientNames) {
  const text = nodeText(expression, sourceFile);
  if (text.startsWith(`${LEGACY_HELPER}()`)) return true;
  return [...clientNames].some((name) => text === name || text.startsWith(`${name}.`));
}

function hasLegacyWriteChain(sourceFile) {
  const clientNames = collectLegacyClientVariables(sourceFile);
  let found = false;
  function visit(node) {
    if (found) return;
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const method = node.expression.name.text;
      if (
        WRITE_METHODS.has(method) &&
        expressionStartsWithLegacyClient(node.expression.expression, sourceFile, clientNames)
      ) {
        found = true;
        return;
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return found;
}

function findLegacyImport(sourceFile) {
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    if (statement.moduleSpecifier.text !== LEGACY_MODULE) continue;
    const bindings = statement.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    const hasHelper = bindings.elements.some((element) => element.name.text === LEGACY_HELPER);
    if (hasHelper) return { statement, elements: bindings.elements };
  }
  return null;
}

function collectIdentifierReplacements(sourceFile) {
  const replacements = [];
  function visit(node) {
    if (
      ts.isIdentifier(node) &&
      node.text === LEGACY_HELPER &&
      !ts.findAncestor(node, ts.isImportDeclaration)
    ) {
      replacements.push({ start: node.getStart(sourceFile), end: node.getEnd(), text: NEW_HELPER });
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return replacements;
}

function applyReplacements(text, replacements) {
  return replacements
    .sort((a, b) => b.start - a.start)
    .reduce((acc, replacement) => (
      acc.slice(0, replacement.start) + replacement.text + acc.slice(replacement.end)
    ), text);
}

function removeLegacyImport(sourceFile, legacyImport) {
  const otherElements = legacyImport.elements.filter((element) => element.name.text !== LEGACY_HELPER);
  if (otherElements.length === 0) {
    return [{
      start: legacyImport.statement.getFullStart(),
      end: legacyImport.statement.getEnd(),
      text: '',
    }];
  }

  const first = legacyImport.elements[0];
  const last = legacyImport.elements[legacyImport.elements.length - 1];
  const replacement = otherElements.map((element) => nodeText(element, sourceFile)).join(', ');
  return [{
    start: first.getStart(sourceFile),
    end: last.getEnd(),
    text: replacement,
  }];
}

function firstNonCommentImportOffset(text) {
  const match = text.match(/^(?:\s|\/\/.*\n|\/\*[\s\S]*?\*\/)*/);
  return match?.[0].length ?? 0;
}

function transform(file) {
  const abs = path.join(ROOT, file);
  const text = fs.readFileSync(abs, 'utf8');
  const sourceFile = createSource(file, text);
  const legacyImport = findLegacyImport(sourceFile);
  if (!legacyImport) return { file, status: 'skipped', reason: 'no legacy helper import' };
  if (hasLegacyWriteChain(sourceFile)) return { file, status: 'skipped', reason: 'legacy helper write chain present' };

  const replacements = [
    ...collectIdentifierReplacements(sourceFile),
    ...removeLegacyImport(sourceFile, legacyImport),
  ];
  let next = applyReplacements(text, replacements);
  const offset = firstNonCommentImportOffset(next);
  next = `${next.slice(0, offset)}import { ${NEW_HELPER} } from '${NEW_MODULE}';\n${next.slice(offset)}`;
  next = next.replace(/\n{3,}/g, '\n\n');

  if (!dryRun) fs.writeFileSync(abs, next);
  return { file, status: dryRun ? 'would_apply' : 'applied' };
}

const inventory = JSON.parse(fs.readFileSync(INVENTORY, 'utf8'));
let candidates = inventory.rows.filter((row) => (
  row.classification === 'READ_ONLY_SELECT' &&
  row.importMatches > 0 &&
  (groups.size === 0 || groups.has(row.group)) &&
  (filesArg.size === 0 || filesArg.has(row.file))
));

candidates = candidates.slice(0, maxFiles);

const results = candidates.map((row) => transform(row.file));
const report = {
  dryRun,
  groups: [...groups].sort(),
  files: [...filesArg].sort(),
  maxFiles,
  candidateCount: candidates.length,
  appliedCount: results.filter((row) => row.status === 'applied' || row.status === 'would_apply').length,
  skippedCount: results.filter((row) => row.status === 'skipped').length,
  results,
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

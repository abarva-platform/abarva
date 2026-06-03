#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const checks = [];

function read(path) {
  const fullPath = join(root, path);
  const exists = existsSync(fullPath);
  checks.push({ name: `file.${path}`, status: exists ? 'pass' : 'fail' });
  return exists ? readFileSync(fullPath, 'utf8') : '';
}

function requireSnippet(path, body, snippet) {
  checks.push({
    name: `snippet.${path}.${snippet}`,
    status: body.includes(snippet) ? 'pass' : 'fail',
  });
}

function requireReference(path) {
  checks.push({
    name: `reference.${path}`,
    status: existsSync(join(root, path)) ? 'pass' : 'fail',
  });
}

function requireNoSnippet(path, body, snippet) {
  checks.push({
    name: `no-snippet.${path}.${snippet}`,
    status: body.includes(snippet) ? 'fail' : 'pass',
  });
}

const packagePath = 'package.json';
const adrPath = 'docs/architecture/adr/ADR-0011-pdf-parser-routing-and-claude-fallback.md';
const adrIndexPath = 'docs/architecture/adr/README.md';
const releasePath = 'docs/releases/records/2026-06-03-claude-pdf-fallback-policy.md';

const pkg = read(packagePath);
const adr = read(adrPath);
const adrIndex = read(adrIndexPath);
const release = read(releasePath);
const evidenceIngestion = read('src/lib/programs/evidence-ingestion.ts');
const docParser = read('src/lib/programs/doc-parser.ts');
const anthropicDirect = read('src/lib/integrations/ai-egress/anthropic-direct.ts');

[
  '"architecture:claude-pdf-fallback:verify"',
  'scripts/architecture/verify-claude-pdf-fallback-policy.mjs',
].forEach((snippet) => requireSnippet(packagePath, pkg, snippet));

[
  '# ADR-0011 - PDF Parser Routing and Claude Fallback',
  'Accepted',
  '2026-06-03',
  'Backlog row T188',
  'Production PDF ingestion must not send full uploaded PDFs to Claude as the',
  'primary parser.',
  'Claude native PDF only as an explicit last-resort fallback',
  'one client',
  'one processing run',
  'T184, T185, T186, and T199 remain separate backlog items',
  'not completed by this ADR',
].forEach((snippet) => requireSnippet(adrPath, adr, snippet));

[
  'ADR-0011-pdf-parser-routing-and-claude-fallback.md',
  'PDF Parser Routing and Claude Fallback',
].forEach((snippet) => requireSnippet(adrIndexPath, adrIndex, snippet));

[
  '2026-06-03-claude-pdf-fallback-policy',
  'T188',
  'internal-admin',
  'Pass: `npm run architecture:claude-pdf-fallback:verify`',
  'does not implement Azure Document Intelligence',
].forEach((snippet) => requireSnippet(releasePath, release, snippet));

[
  'docs/architecture/adr/ADR-0008-context-ingestion-guardrails.md',
  'docs/runbooks/azure-blob-upload-pattern.md',
  'src/lib/programs/evidence-ingestion.ts',
  'src/lib/programs/doc-parser.ts',
  'src/lib/integrations/ai-egress/anthropic-direct.ts',
  'src/lib/context-ingestion/template-registry.ts',
  'src/lib/context-ingestion/file-classifier.ts',
  'src/lib/context-ingestion/validation-engine.ts',
  'package.json',
].forEach(requireReference);

requireSnippet('src/lib/programs/evidence-ingestion.ts', evidenceIngestion, "method: 'pdf-parse'");
requireSnippet('src/lib/programs/doc-parser.ts', docParser, 'PDF via');
requireSnippet('src/lib/integrations/ai-egress/anthropic-direct.ts', anthropicDirect, 'preflightModelEgress');
requireNoSnippet('src/lib/integrations/ai-egress/anthropic-direct.ts', anthropicDirect, 'application/pdf');

const failed = checks.filter((check) => check.status === 'fail');
console.log(
  JSON.stringify(
    {
      audit: 'claude-pdf-fallback-policy',
      status: failed.length === 0 ? 'pass' : 'fail',
      summary: {
        pass: checks.length - failed.length,
        fail: failed.length,
      },
      checks,
    },
    null,
    2,
  ),
);

if (failed.length > 0) {
  process.exitCode = 1;
}

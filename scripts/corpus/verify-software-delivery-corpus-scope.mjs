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

const packagePath = 'package.json';
const scopePath = 'docs/knowledge-corpus/SOFTWARE_DELIVERY_AI_LED_DEV_CORPUS_SCOPE_2026-06-03.md';
const releasePath = 'docs/releases/records/2026-06-03-software-delivery-corpus-scope.md';

const pkg = read(packagePath);
const scope = read(scopePath);
const release = read(releasePath);

[
  '"corpus:software-delivery-scope:verify"',
  'scripts/corpus/verify-software-delivery-corpus-scope.mjs',
].forEach((snippet) => requireSnippet(packagePath, pkg, snippet));

[
  'Backlog row: T282',
  'Status: scoped for execution',
  'This is a shared industry corpus wave. It is not a client private data load.',
  'docs/source-material/intelligence-pack/02-ai-led-pdlc.md',
  'ai_delivery_operating_model',
  'agentic_pdlc',
  'validation_and_quality_engineering',
  'context_as_code',
  'Do not jump directly to a 10,000-pattern load.',
  'All retrieval must go through the AgentContextBroker boundary.',
  'T282 is complete when this scope document, verifier, package script, and release',
].forEach((snippet) => requireSnippet(scopePath, scope, snippet));

[
  '2026-06-03-software-delivery-corpus-scope',
  'T282',
  'internal-admin',
  'Pass: `npm run corpus:software-delivery-scope:verify`',
  'does not author patterns',
].forEach((snippet) => requireSnippet(releasePath, release, snippet));

[
  'docs/architecture/adr/ADR-0010-software-delivery-ai-led-dev-corpus-wave.md',
  'docs/source-material/intelligence-pack/02-ai-led-pdlc.md',
  'docs/architecture/adr/ADR-0002-agent-context-broker-boundary.md',
  'docs/architecture/adr/ADR-0006-ai-as-advisor.md',
  'docs/agent-training/EXPERT_TRAINING_SYSTEM.md',
  'docs/knowledge-corpus/PROVENANCE_AND_VERSIONING.md',
  'docs/knowledge-corpus/CURATION_PIPELINE.md',
  'docs/knowledge-corpus/KNOWLEDGE_CORPUS_SCHEMA.md',
  'scripts/corpus/release-manifest.mjs',
].forEach(requireReference);

const failed = checks.filter((check) => check.status === 'fail');
console.log(
  JSON.stringify(
    {
      audit: 'software-delivery-corpus-scope',
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

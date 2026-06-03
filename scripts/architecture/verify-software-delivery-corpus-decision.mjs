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
const adrPath = 'docs/architecture/adr/ADR-0010-software-delivery-ai-led-dev-corpus-wave.md';
const adrIndexPath = 'docs/architecture/adr/README.md';
const releasePath = 'docs/releases/records/2026-06-03-software-delivery-corpus-decision.md';

const pkg = read(packagePath);
const adr = read(adrPath);
const adrIndex = read(adrIndexPath);
const release = read(releasePath);

[
  '"architecture:software-delivery-corpus-decision:verify"',
  'scripts/architecture/verify-software-delivery-corpus-decision.mjs',
].forEach((snippet) => requireSnippet(packagePath, pkg, snippet));

[
  '# ADR-0010 - Software Delivery and AI-Led Dev Corpus Wave',
  'Accepted',
  '2026-06-03',
  'Backlog row T281',
  'AbarVa will build a governed Software Delivery / AI-Led Dev corpus wave.',
  'must not be treated as client private data',
  'The T281 completion boundary is the decision itself.',
  'hallucination controls',
  'broker boundary',
].forEach((snippet) => requireSnippet(adrPath, adr, snippet));

[
  'ADR-0010-software-delivery-ai-led-dev-corpus-wave.md',
  'Software Delivery and AI-Led Dev Corpus Wave',
].forEach((snippet) => requireSnippet(adrIndexPath, adrIndex, snippet));

[
  '2026-06-03-software-delivery-corpus-decision',
  'T281',
  'internal-admin',
  'Pass: `npm run architecture:software-delivery-corpus-decision:verify`',
  'does not build the corpus wave',
].forEach((snippet) => requireSnippet(releasePath, release, snippet));

[
  'docs/architecture/adr/0001-canonical-pattern-storage.md',
  'docs/knowledge-corpus/releases/README.md',
  'scripts/corpus/release-manifest.mjs',
  'docs/source-material/intelligence-pack/02-ai-led-pdlc.md',
  'docs/agent-training/EXPERT_TRAINING_SYSTEM.md',
  'docs/architecture/adr/ADR-0002-agent-context-broker-boundary.md',
  'docs/architecture/adr/ADR-0006-ai-as-advisor.md',
].forEach(requireReference);

const failed = checks.filter((check) => check.status === 'fail');
console.log(
  JSON.stringify(
    {
      audit: 'software-delivery-corpus-decision',
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

// Exports the code-derived golden suites to a JSON artifact for the
// verification bundle. Run: npx tsx scripts/agent-golden/export-suites.ts

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { buildGoldenSuites } from '@/lib/agent-golden';

const suites = buildGoldenSuites();
const out = {
  generated: '2026-06-09',
  source: 'CANONICAL_TENANT_KEYS (code-derived, not hand-typed)',
  tenantCount: suites.length,
  questionCount: suites.reduce((n, s) => n + s.questions.length, 0),
  suites,
};

const dir = path.join('docs', 'build', 'agent-context-bundle-verification-2026-06-09');
mkdirSync(dir, { recursive: true });
const file = path.join(dir, 'golden-question-bank.json');
writeFileSync(file, JSON.stringify(out, null, 2) + '\n', 'utf8');
console.info(`wrote ${file}: ${out.tenantCount} tenants, ${out.questionCount} questions`);

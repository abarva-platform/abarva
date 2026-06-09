// Exports the domain/subdomain expert matrix (full question bank) plus the
// results/failures CSV templates the PR-5 live run populates.
// Run: npx tsx scripts/agent-domain-matrix/export.ts

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { buildExpertMatrix, CONSULTANT_DIMENSIONS } from '@/lib/agent-domain-matrix';

const matrix = buildExpertMatrix();

const byTenant = new Map<string, number>();
for (const q of matrix) byTenant.set(q.tenantKey, (byTenant.get(q.tenantKey) ?? 0) + 1);

const dir = path.join('docs', 'build', 'agent-context-bundle-verification-2026-06-09');
mkdirSync(dir, { recursive: true });

const bank = {
  generated: '2026-06-09',
  source: 'CANONICAL_TENANT_KEYS (code-derived)',
  tenantCount: byTenant.size,
  questionCount: matrix.length,
  perTenant: Object.fromEntries(byTenant),
  consultantDimensions: CONSULTANT_DIMENSIONS,
  note: 'Expected answers are NOT included. Answerability is a hypothesis; the PR-5 Azure run derives ground truth and writes results.csv / failures.csv.',
  questions: matrix,
};
// Minified — the bank is a large generated artifact (thousands of questions);
// minifying keeps the committed file lean. Regenerate any time via this script.
writeFileSync(
  path.join(dir, 'domain-subdomain-question-bank.json'),
  JSON.stringify(bank) + '\n',
  'utf8',
);

// Header-only CSV templates — rows are produced by the live ACA run, never faked.
const resultsHeader =
  'question_id,tenant_key,domain,subdomain,archetype,expected_answerability,observed_answerability,tenant_resolved_ok,tenant_isolation_ok,retrieved_tenant_context,retrieved_pattern,citations_emitted,consultant_score,production_ready\n';
const failuresHeader =
  'question_id,tenant_key,domain,subdomain,archetype,failure_reason,remediation_lane\n';
writeFileSync(path.join(dir, 'domain-subdomain-results.csv'), resultsHeader, 'utf8');
writeFileSync(path.join(dir, 'domain-subdomain-failures.csv'), failuresHeader, 'utf8');

console.info(
  `wrote domain-subdomain matrix: ${bank.tenantCount} tenants, ${bank.questionCount} questions; CSV templates emitted (rows populated by PR-5 live run).`,
);

// Verification run harness (PR-5).
//
//   LAB mode (default, no live Azure): writes a structural verification summary
//   — framework inventory + counts. It does NOT generate live agent answers and
//   does NOT fabricate pass/fail. Use this to prove the framework is wired.
//
//   LIVE mode (Azure Container Apps, real DATABASE_URL + ANTHROPIC_API_KEY):
//   set AGENT_VERIFY_LIVE=1 and provide an HTTP driver that calls the real
//   Nexus/Sentinel endpoints; the runner then drives golden + matrix questions
//   and writes the full summary + report. The private DB is reachable only from
//   inside Azure, so the live run must execute on ACA.
//
// Run (lab): npx tsx scripts/agent-verification/run.ts

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { buildGoldenSuites } from '@/lib/agent-golden';
import { buildExpertMatrix } from '@/lib/agent-domain-matrix';
import { CANONICAL_TENANT_KEYS } from '@/config/tenants/CANONICAL_TENANTS';

const golden = buildGoldenSuites();
const matrix = buildExpertMatrix();

const live = process.env.AGENT_VERIFY_LIVE === '1';

const inventory = {
  generated: '2026-06-09',
  mode: live ? 'live_azure' : 'lab_structural',
  modulesPresent: [
    'agent-trace',
    'agent-eval',
    'agent-golden',
    'agent-claims',
    'agent-domain-matrix',
    'agent-verification',
  ],
  tenants: CANONICAL_TENANT_KEYS,
  goldenQuestionCount: golden.reduce((n, s) => n + s.questions.length, 0),
  matrixQuestionCount: matrix.length,
  note: live
    ? 'LIVE run: drive golden + matrix questions through the real agent and write the full summary.'
    : 'LAB structural run: framework inventory only. No live agent answers were generated; no pass/fail was fabricated. Run on Azure Container Apps with AGENT_VERIFY_LIVE=1 for live verification.',
};

const dir = path.join('docs', 'build', 'agent-context-bundle-verification-2026-06-09');
mkdirSync(dir, { recursive: true });
writeFileSync(
  path.join(dir, 'verification-summary.json'),
  JSON.stringify(inventory, null, 2) + '\n',
  'utf8',
);

if (live) {
  // On ACA: import an HTTP agent driver, then:
  //   const results = await Promise.all(questions.map(q => evaluateQuestion(driver, q, goldenById[q.id])));
  //   const summary = summarizeVerification(results, 'live_azure');
  //   writeFileSync(report.md, renderReportMarkdown(summary)); writeFileSync(results.csv, ...)
  // Intentionally not executed here — no live Azure DB is reachable from this
  // environment, and we do not fabricate results.
  console.info('LIVE mode requested — wire the HTTP driver on Azure Container Apps to generate live results.');
} else {
  console.info(
    `lab structural run: ${inventory.tenants.length} tenants, ${inventory.goldenQuestionCount} golden + ${inventory.matrixQuestionCount} matrix questions; wrote verification-summary.json (no live answers, no fabricated pass/fail).`,
  );
}

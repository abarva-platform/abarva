import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { runArtifactConsistencyGuard } from '../../src/lib/artifacts/consistency-guard';
import { artifactTriggerForMoveInsert, artifactTriggerForWatchlistEntry } from '../../src/lib/artifacts/auto-trigger';
import { renderBoardPack } from '../../src/lib/artifacts/render-engine';
import type { TenantAiPolicy } from '../../src/lib/integrations/ai-egress';

const migration = fs.readFileSync(
  path.join(process.cwd(), 'supabase/migrations/20260524162000_generated_artifacts_v1.sql'),
  'utf8',
);

assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.generated_artifacts/);
assert.match(migration, /evidence_ledger_ids UUID\[\] NOT NULL/);
assert.match(migration, /REFERENCES public\.ai_egress_audit\(id\)/);
assert.match(migration, /ALTER TABLE public\.generated_artifacts ENABLE ROW LEVEL SECURITY/);

const apexPolicy: TenantAiPolicy = {
  allowExternalAI: true,
  kernelOnlyMode: false,
  allowClaude: true,
  allowGamma: true,
  maxDataClass: 'confidential',
  requireRedaction: false,
  requireHumanApprovalForExports: true,
  promptResponseRetentionDays: 30,
};

const meridianPolicy: TenantAiPolicy = {
  ...apexPolicy,
  allowGamma: false,
};

const facts = [
  {
    id: 'baseline-spend',
    label: 'Baseline exposure',
    value: '$2.4M',
    evidenceLedgerId: '00000000-0000-4000-8000-000000000001',
  },
  {
    id: 'risk-avoided',
    label: 'Risk avoided',
    value: '$1.1M',
    evidenceLedgerId: '00000000-0000-4000-8000-000000000002',
  },
];

const sections = [
  {
    id: 'executive-summary',
    title: 'Executive summary',
    claims: [`Baseline exposure is $2.4M [${facts[0].evidenceLedgerId}]`],
  },
  {
    id: 'recommendation',
    title: 'Recommendation',
    claims: [`Risk avoided is $1.1M [${facts[1].evidenceLedgerId}]`],
  },
  {
    id: 'sources-cited',
    title: 'Sources cited',
    claims: facts.map((fact) => `Evidence ${fact.evidenceLedgerId}`),
  },
];

async function main() {
  const rendered = await renderBoardPack({
    clientId: 'apexretail',
    sourceArtifactRef: 'move-123',
    artifactType: 'move_board_pack',
    renderEngine: 'gamma_with_internal_fallback',
    outputFormat: 'html',
    renderedBy: 'p20-smoke',
    title: 'Apex Move Board Pack',
    facts,
    sections,
    tenantPolicy: apexPolicy,
  });

  assert.equal(rendered.quarantined, false);
  assert.equal(rendered.outputFormat, 'html');
  assert.equal(rendered.evidenceLedgerIds.length, 2);
  assert.equal(rendered.qualityScore >= 8, true);
  assert.match(rendered.html, /\$2\.4M/);
  assert.match(rendered.html, new RegExp(facts[0].evidenceLedgerId));
  assert.equal(rendered.aiResult?.ok, false);
  assert.match(rendered.aiResult?.ok === false ? rendered.aiResult.reason : '', /Gamma is blocked for confidential/);

  const meridianRendered = await renderBoardPack({
    clientId: 'meridian',
    sourceArtifactRef: 'source-event-123',
    artifactType: 'source_board_pack',
    renderEngine: 'gamma',
    renderedBy: 'p20-smoke',
    title: 'Meridian Source Board Pack',
    facts,
    sections,
    tenantPolicy: meridianPolicy,
  });

  assert.equal(meridianRendered.renderEngine, 'gamma');
  assert.equal(meridianRendered.aiResult?.ok, false);
  assert.match(meridianRendered.aiResult?.ok === false ? meridianRendered.aiResult.reason : '', /Gamma is disabled/);

  const mismatch = runArtifactConsistencyGuard({
    renderedText: 'This output changed the value to $9.9M and cites no ids.',
    facts,
    evidenceLedgerIds: facts.map((fact) => fact.evidenceLedgerId),
  });
  assert.equal(mismatch.ok, false);
  assert.equal(mismatch.findings.some((finding) => finding.includes('$2.4M')), true);

  assert.deepEqual(artifactTriggerForMoveInsert({ clientId: 'apexretail', moveId: 'move-1' }).artifactType, 'move_board_pack');
  assert.equal(artifactTriggerForWatchlistEntry({ clientId: 'apexretail', watchlistEntryId: 'watch-1', killFitness: 80 }), null);
  assert.equal(
    artifactTriggerForWatchlistEntry({ clientId: 'apexretail', watchlistEntryId: 'watch-1', killFitness: 81 })?.artifactType,
    'watchlist_review_pack',
  );

  console.log('P20 smoke passed: schema, render engine, Gamma policy refusal, consistency guard, and triggers are deterministic.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

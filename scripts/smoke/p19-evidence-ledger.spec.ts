import fs from 'fs';
import path from 'path';
import assert from 'node:assert/strict';
import {
  makeNoEvidenceInput,
  normalizeRecordEvidenceInput,
  summarizeProofPoints,
} from '../../src/lib/evidence/ledger';
import { resolveCitationRow } from '../../src/lib/evidence/citations';

const migration = fs.readFileSync(
  path.join(process.cwd(), 'supabase/migrations/20260524080000_evidence_ledger_v1.sql'),
  'utf8',
);

assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.evidence_ledger/);
assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
assert.match(migration, /REFERENCES public\.ai_egress_audit\(id\)/);
assert.match(migration, /BEFORE UPDATE ON public\.evidence_ledger/);
assert.match(migration, /BEFORE DELETE ON public\.evidence_ledger/);
assert.match(migration, /REVOKE UPDATE, DELETE ON public\.evidence_ledger/);

const row = normalizeRecordEvidenceInput({
  clientId: 'apexretail',
  surface: 'source',
  artifactType: 'claim',
  artifactRef: 'event-925b',
  claimText: 'Pricing is not comparable.',
  sourceType: 'tenant_record',
  sourceRef: {
    table: 'intake',
    row_id: 'scope',
    field: 'line_items[3]',
    value: 'AI module pricing blank',
  },
  freshnessAt: '2026-05-24T00:00:00Z',
  confidence: 0.91,
  confidenceBasis: 'tenant intake field',
  ownerRole: 'VP Procurement',
  createdBy: 'p19-smoke',
});

const citation = resolveCitationRow({ ...row, created_at: '2026-05-24T00:00:00Z' });
assert.equal(citation.confidenceLabel, 'high');
assert.match(citation.humanText, /intake\[scope\]\.line_items\[3\]/);

const noEvidence = makeNoEvidenceInput({
  clientId: 'apexretail',
  surface: 'watchlist',
  artifactType: 'kill_signal',
  artifactRef: 'watchlist-1',
  claimText: 'The kill signal is inferred.',
  freshnessAt: '2026-05-24T00:00:00Z',
  createdBy: 'p19-smoke',
  reason: 'No current sponsor-pulse row exists.',
});
assert.equal(noEvidence.sourceType, 'no_evidence');
assert.equal(noEvidence.notEnoughData, true);

const counts = summarizeProofPoints([
  { source_type: 'tenant_record', not_enough_data_flag: false },
  { source_type: 'corpus_pattern', not_enough_data_flag: false },
  { source_type: 'no_evidence', not_enough_data_flag: true },
]);
assert.equal(counts.total, 3);
assert.equal(counts.notEnoughData, 1);

console.log('P19 smoke passed: evidence ledger contract, citations, proof counts, and no-evidence behavior are deterministic.');

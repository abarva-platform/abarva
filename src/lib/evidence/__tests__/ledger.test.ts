jest.mock('server-only', () => ({}));

import fs from 'fs';
import path from 'path';
import {
  makeNoEvidenceInput,
  normalizeRecordEvidenceInput,
  summarizeProofPoints,
} from '../ledger';
import { confidenceLabel, resolveCitationRow } from '../citations';

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260524080000_evidence_ledger_v1.sql',
);

describe('Evidence Ledger v1', () => {
  it('normalizes record input and clamps confidence', () => {
    const row = normalizeRecordEvidenceInput({
      clientId: ' apexretail ',
      surface: 'source',
      artifactType: 'claim',
      artifactRef: ' event-1 ',
      claimText: ' Scope is incomplete ',
      sourceType: 'tenant_record',
      sourceRef: { table: 'source_events', row_id: 'event-1', field: 'scope' },
      freshnessAt: new Date('2026-05-24T12:00:00Z'),
      confidence: 2,
      confidenceBasis: ' tenant record ',
      createdBy: 'test',
    });

    expect(row.client_id).toBe('apexretail');
    expect(row.artifact_ref).toBe('event-1');
    expect(row.claim_text).toBe('Scope is incomplete');
    expect(row.confidence).toBe(1);
    expect(row.not_enough_data_flag).toBe(false);
  });

  it('builds the honest no-evidence row shape', () => {
    const input = makeNoEvidenceInput({
      clientId: 'apexretail',
      surface: 'intelligence',
      artifactType: 'claim',
      artifactRef: 'session-1',
      claimText: 'This is inferred.',
      freshnessAt: '2026-05-24T00:00:00Z',
      createdBy: 'sentinel',
      reason: 'No tenant telemetry loaded for this metric.',
    });

    expect(input.sourceType).toBe('no_evidence');
    expect(input.notEnoughData).toBe(true);
    expect(input.confidence).toBe(0);
    expect(input.notEnoughDataReason).toContain('No tenant telemetry');
  });

  it('summarizes proof points for footer rendering', () => {
    const summary = summarizeProofPoints([
      { source_type: 'tenant_record', not_enough_data_flag: false },
      { source_type: 'document_extract', not_enough_data_flag: false },
      { source_type: 'corpus_pattern', not_enough_data_flag: false },
      { source_type: 'no_evidence', not_enough_data_flag: true },
    ]);

    expect(summary).toMatchObject({
      total: 4,
      tenantRecords: 1,
      documentExtracts: 1,
      corpusPatterns: 1,
      noEvidence: 1,
      notEnoughData: 1,
    });
  });

  it('resolves exact tenant-record citations', () => {
    const citation = resolveCitationRow({
      id: 'ledger-1',
      client_id: 'apexretail',
      surface: 'source',
      artifact_type: 'claim',
      artifact_ref: 'event-1',
      claim_text: 'BlueYonder pricing is incomplete.',
      source_type: 'tenant_record',
      source_ref: {
        table: 'intake',
        row_id: 'scope',
        field: 'line_items[3]',
        value: 'AI module pricing blank',
      },
      source_quote: null,
      freshness_at: '2026-05-22T00:00:00Z',
      confidence: 0.93,
      confidence_basis: "tenant intake field captured during sourcing scope",
      owner_role: 'VP Procurement',
      not_enough_data_flag: false,
      not_enough_data_reason: null,
      egress_audit_id: null,
      created_at: '2026-05-24T00:00:00Z',
      created_by: 'test',
      supersedes_id: null,
    });

    expect(citation.humanText).toContain('intake[scope].line_items[3]');
    expect(citation.humanText).toContain('AI module pricing blank');
    expect(citation.confidenceLabel).toBe('high');
  });

  it('labels no-evidence rows as insufficient', () => {
    expect(confidenceLabel({ confidence: 0.99, not_enough_data_flag: true })).toBe('insufficient');
  });

  it('migration is append-only, tenant-scoped, and linked to egress audit', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.evidence_ledger');
    expect(sql).toContain('egress_audit_id UUID REFERENCES public.ai_egress_audit(id)');
    expect(sql).toContain('ALTER TABLE public.evidence_ledger ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('can_read_tenant_by_key(client_id)');
    expect(sql).toContain('can_write_tenant_by_key(client_id)');
    expect(sql).toContain('BEFORE UPDATE ON public.evidence_ledger');
    expect(sql).toContain('BEFORE DELETE ON public.evidence_ledger');
    expect(sql).toContain('REVOKE UPDATE, DELETE ON public.evidence_ledger');
  });
});

import type { SourceArtifactRegistryRecord } from '../types';

const insertCaptures: Array<{ table: string; payload: unknown }> = [];
const updateSourceArtifactProcessingState = jest.fn(async (input) => ({
  ...baseArtifact,
  parseStatus: input.parseStatus ?? baseArtifact.parseStatus,
  classificationStatus: input.classificationStatus ?? baseArtifact.classificationStatus,
  evidenceState: input.evidenceState ?? baseArtifact.evidenceState,
}));

const fakeClient = {
  from: jest.fn((table: string) => ({
    insert: jest.fn(async (payload: unknown) => {
      insertCaptures.push({ table, payload });
      return { data: null, error: null };
    }),
  })),
};

jest.mock('@/lib/supabase-server', () => ({
  getServerSupabase: () => fakeClient,
}));

jest.mock('../index', () => ({
  updateSourceArtifactProcessingState: (input: unknown) => updateSourceArtifactProcessingState(input),
}));

import {
  isSynchronouslyParseableSourceFormat,
  parseSourceTextArtifact,
} from '../text-parser';

const baseArtifact: SourceArtifactRegistryRecord = {
  id: 'artifact-123',
  tenantKey: 'apex-retail',
  sourceEventId: 'event-123',
  sourceEventRowId: 'event-123',
  stageKey: 'scope',
  artifactFamily: 'meeting_notes',
  artifactKind: 'scope_workshop_notes',
  sourceOrigin: 'uploaded',
  sourceFormat: 'markdown',
  originalName: 'scope-workshop-notes.md',
  blobUri: 'apex-retail/event-123/artifact-123/scope-workshop-notes.md',
  uploaderUserId: 'user-123',
  mimeType: 'text/markdown',
  sizeBytes: 1024,
  sha256: 'a'.repeat(64),
  parseStatus: 'pending',
  embeddingStatus: 'pending',
  graphStatus: 'pending',
  classificationStatus: 'pending',
  dataClassification: 'Confidential',
  evidenceState: 'unparsed',
  approvalState: 'draft',
  version: 1,
  supersedesArtifactVersionId: null,
  createdBy: 'user-123',
  validatedBy: null,
  createdAt: '2026-05-02T00:00:00Z',
  updatedAt: '2026-05-02T00:00:00Z',
  deletedAt: null,
};

beforeEach(() => {
  insertCaptures.length = 0;
  fakeClient.from.mockClear();
  updateSourceArtifactProcessingState.mockClear();
});

describe('Source text artifact parser', () => {
  it('only opts text-like artifact formats into synchronous parsing', () => {
    expect(isSynchronouslyParseableSourceFormat('markdown')).toBe(true);
    expect(isSynchronouslyParseableSourceFormat('txt')).toBe(true);
    expect(isSynchronouslyParseableSourceFormat('csv')).toBe(true);
    expect(isSynchronouslyParseableSourceFormat('pdf')).toBe(false);
    expect(isSynchronouslyParseableSourceFormat('docx')).toBe(false);
  });

  it('writes chunks, facts, requirements, and meeting outcomes for workshop notes', async () => {
    await parseSourceTextArtifact({
      artifact: baseArtifact,
      text: `# Scope workshop\n\nDecision: Data analytics tower is in scope.\nAction: Cathy Waters to confirm legal review owner=Legal due=2026-05-12\nRequirement: Vendors must support SOC 2 Type II evidence.\nRisk: Current app inventory is incomplete.`,
    });

    expect(insertCaptures.map((c) => c.table)).toEqual([
      'source_artifact_chunks',
      'source_artifact_facts',
      'source_requirements',
      'source_meeting_outcomes',
    ]);
    expect(updateSourceArtifactProcessingState).toHaveBeenCalledWith({
      artifactId: 'artifact-123',
      parseStatus: 'parsed',
      classificationStatus: 'classified',
      evidenceState: 'parsed_uncited',
    });

    const requirements = insertCaptures.find((c) => c.table === 'source_requirements')?.payload as Array<Record<string, unknown>>;
    expect(requirements).toHaveLength(1);
    expect(requirements[0]).toMatchObject({
      tenant_key: 'apex-retail',
      source_event_id: 'event-123',
      requirement_text: 'Vendors must support SOC 2 Type II evidence.',
    });

    const outcomes = insertCaptures.find((c) => c.table === 'source_meeting_outcomes')?.payload as Array<Record<string, unknown>>;
    expect(outcomes).toEqual(expect.arrayContaining([
      expect.objectContaining({ outcome_type: 'decision', status: 'closed' }),
      expect.objectContaining({ outcome_type: 'action_item', owner: 'Legal', due_date: '2026-05-12' }),
      expect.objectContaining({ outcome_type: 'risk_or_gap' }),
    ]));
  });

  it('extracts vendor commitments and pricing components from proposal text', async () => {
    await parseSourceTextArtifact({
      artifact: {
        ...baseArtifact,
        stageKey: 'vendor_responses',
        artifactFamily: 'proposal',
        artifactKind: 'vendor_response',
        originalName: 'northstar-response.md',
      },
      text: `Commitment: 99.9% availability for critical data platforms.\nSLA: P1 response within 30 minutes.\nPricing: fixed transition fee $1.2M in year 1 and offshore run rate $85/hour.`,
    });

    expect(insertCaptures.map((c) => c.table)).toEqual([
      'source_artifact_chunks',
      'source_artifact_facts',
      'source_vendor_commitments',
      'source_pricing_components',
    ]);
    const commitments = insertCaptures.find((c) => c.table === 'source_vendor_commitments')?.payload as Array<Record<string, unknown>>;
    expect(commitments).toHaveLength(2);
    const pricing = insertCaptures.find((c) => c.table === 'source_pricing_components')?.payload as Array<Record<string, unknown>>;
    expect(pricing.map((row) => row.amount_usd).sort((a, b) => Number(a) - Number(b))).toEqual([85, 1_200_000]);
    expect(pricing).toEqual(expect.arrayContaining([
      expect.objectContaining({ component_key: 'PRICE-001', amount_usd: 1_200_000 }),
      expect.objectContaining({ amount_usd: 85, unit: 'hour' }),
    ]));
  });

  it('does not mistake headings or year indexes for pricing components', async () => {
    await parseSourceTextArtifact({
      artifact: {
        ...baseArtifact,
        stageKey: 'pricing',
        artifactFamily: 'pricing_workbook',
        artifactKind: 'pricing_upload',
        originalName: 'pricing-normalization-workbook.md',
      },
      text: `# E2E Pricing Upload

Pricing: Fixed monthly fee $250,000 per month for base AMS run.
Pricing: Variable usage fee $95 per ticket above baseline.
Cost: Transition credit $1.2m applied in year 1.
Savings: Productivity glidepath target $4.5m annual run-rate by year 3.
Rate: Offshore blended labor rate $42 per hour; onshore blended labor rate $135 per hour.`,
    });

    const pricing = insertCaptures.find((c) => c.table === 'source_pricing_components')?.payload as Array<Record<string, unknown>>;
    expect(pricing.map((row) => row.amount_usd).sort((a, b) => Number(a) - Number(b))).toEqual([
      42,
      95,
      135,
      250_000,
      1_200_000,
      4_500_000,
    ]);
  });

  it('marks empty text uploads as failed rather than inventing evidence', async () => {
    await parseSourceTextArtifact({ artifact: baseArtifact, text: '   \n\n' });

    expect(insertCaptures).toHaveLength(0);
    expect(updateSourceArtifactProcessingState).toHaveBeenCalledWith({
      artifactId: 'artifact-123',
      parseStatus: 'failed',
      classificationStatus: 'rejected',
      evidenceState: 'unparsed',
    });
  });
});

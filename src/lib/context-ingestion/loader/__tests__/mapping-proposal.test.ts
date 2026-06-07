import {
  proposeMapping,
  type MappingModel,
  type ParsedContent,
} from '@/lib/context-ingestion/loader/mapping-proposal';
import type { PreservedSourceFile } from '@/lib/context-ingestion/loader/contract';

function makeSource(overrides: Partial<PreservedSourceFile> = {}): PreservedSourceFile {
  return {
    tenantKey: 'apex-retail',
    filename: 'org-chart.csv',
    container: 'landing',
    objectKey: 'landing/apex-retail/inbox/abc-org-chart.csv',
    blobUrl: 'https://blob.example/landing/apex-retail/inbox/abc-org-chart.csv',
    fileHash: 'a'.repeat(64),
    bytes: 1234,
    contentType: 'text/csv',
    uploadedBy: 'admin@apex-retail',
    ingestedAt: '2026-06-07T00:00:00.000Z',
    ...overrides,
  };
}

/** A model stub that returns whatever canned string it is given. */
function cannedModel(output: string): MappingModel {
  return { propose: jest.fn(async () => output) };
}

describe('proposeMapping', () => {
  it('parses a valid JSON model response into a MappingProposal', async () => {
    const parsed: ParsedContent = {
      kind: 'tabular',
      columns: ['Name', 'Title', 'Reports To'],
      sampleRows: [{ Name: 'Jane Doe', Title: 'CIO', 'Reports To': 'CEO' }],
    };
    const model = cannedModel(
      JSON.stringify({
        dimension: 'leadership_org',
        dimensionConfidence: 0.92,
        fieldMappings: [
          { sourceColumn: 'Name', canonicalField: 'person.name', confidence: 0.95, citation: 'column:Name' },
          { sourceColumn: 'Title', canonicalField: 'person.title', confidence: 0.9, citation: 'column:Title' },
          { sourceColumn: 'Reports To', canonicalField: 'person.reports_to', confidence: 0.85, citation: 'column:Reports To' },
        ],
      }),
    );

    const proposal = await proposeMapping({
      parsed,
      source: makeSource(),
      tenantKey: 'apex-retail',
      model,
    });

    expect(proposal.dimension).toBe('leadership_org');
    expect(proposal.dimensionConfidence).toBeCloseTo(0.92);
    expect(proposal.fieldMappings).toHaveLength(3);
    expect(proposal.fieldMappings[0]).toEqual({
      sourceColumn: 'Name',
      canonicalField: 'person.name',
      confidence: 0.95,
      citation: 'column:Name',
    });
    // Tabular content auto-commits eligible (not review-gated by kind).
    expect(proposal.reviewRequired).toBe(false);
    // sampleRows passed through.
    expect(proposal.sampleRows).toEqual(parsed.sampleRows);
    // source preserved.
    expect(proposal.source.objectKey).toBe('landing/apex-retail/inbox/abc-org-chart.csv');
  });

  it('parses JSON even when the model wraps it in code fences / prose', async () => {
    const model = cannedModel(
      'Here is the mapping:\n```json\n' +
        JSON.stringify({
          dimension: 'kpis',
          dimensionConfidence: 0.7,
          fieldMappings: [{ sourceColumn: 'Metric', canonicalField: 'kpi.name', confidence: 0.8 }],
        }) +
        '\n```\nDone.',
    );

    const proposal = await proposeMapping({
      parsed: { kind: 'tabular', columns: ['Metric'] },
      source: makeSource({ filename: 'kpis.csv' }),
      tenantKey: 'apex-retail',
      model,
    });

    expect(proposal.dimension).toBe('kpis');
    expect(proposal.fieldMappings).toHaveLength(1);
    expect(proposal.fieldMappings[0].canonicalField).toBe('kpi.name');
  });

  it('forces reviewRequired=true for document-derived content', async () => {
    const parsed: ParsedContent = {
      kind: 'document',
      text: 'Vendor contract: Acme Corp, annual spend $1.2M, renews 2027-01-01.',
    };
    const model = cannedModel(
      JSON.stringify({
        dimension: 'vendors_contracts',
        dimensionConfidence: 0.8,
        fieldMappings: [
          { sourceColumn: 'page:1', canonicalField: 'vendor.name', confidence: 0.7, citation: 'page:1' },
        ],
      }),
    );

    const proposal = await proposeMapping({
      parsed,
      source: makeSource({ filename: 'contract.pdf', contentType: 'application/pdf' }),
      tenantKey: 'apex-retail',
      model,
    });

    expect(proposal.dimension).toBe('vendors_contracts');
    // Document-derived facts never auto-commit.
    expect(proposal.reviewRequired).toBe(true);
  });

  it('falls back to deterministic header matching on unparseable model output', async () => {
    const parsed: ParsedContent = {
      kind: 'tabular',
      columns: ['Full Name', 'Role', 'Email'],
    };
    const model = cannedModel('I could not produce JSON, sorry.');

    const proposal = await proposeMapping({
      parsed,
      source: makeSource(),
      tenantKey: 'apex-retail',
      model,
    });

    // Deterministic fallback chose a dimension by header votes.
    expect(proposal.dimension).toBe('leadership_org');
    // Low-confidence proposal — never the model's high numbers.
    expect(proposal.dimensionConfidence).toBeLessThanOrEqual(0.3);
    expect(proposal.fieldMappings.length).toBeGreaterThan(0);
    for (const m of proposal.fieldMappings) {
      expect(m.confidence).toBeLessThanOrEqual(0.3);
      expect(m.citation).toMatch(/^column:/);
    }
  });

  it('does not throw and returns a low-confidence unknown when the model itself rejects', async () => {
    const model: MappingModel = {
      propose: jest.fn(async () => {
        throw new Error('model unavailable');
      }),
    };

    const proposal = await proposeMapping({
      parsed: { kind: 'document', text: 'freeform notes with no structure' },
      source: makeSource({ filename: 'notes.txt' }),
      tenantKey: 'apex-retail',
      model,
    });

    // Document fallback yields no field mappings and unknown dimension.
    expect(proposal.dimension).toBe('unknown');
    expect(proposal.fieldMappings).toHaveLength(0);
    expect(proposal.dimensionConfidence).toBeLessThanOrEqual(0.3);
    // Still review-gated because it's a document.
    expect(proposal.reviewRequired).toBe(true);
  });

  it('respects targetDimension hint in the deterministic fallback for unrecognized columns', async () => {
    const proposal = await proposeMapping({
      parsed: { kind: 'tabular', columns: ['col_a', 'col_b'] },
      source: makeSource(),
      tenantKey: 'apex-retail',
      targetDimension: 'financial_baseline',
      model: cannedModel('not json'),
    });

    expect(proposal.dimension).toBe('financial_baseline');
    expect(proposal.dimensionConfidence).toBeLessThanOrEqual(0.3);
  });
});

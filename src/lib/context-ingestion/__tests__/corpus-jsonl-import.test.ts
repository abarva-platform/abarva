import {
  loadCorpusJsonlImport,
  prepareCorpusJsonlImport,
} from '../corpus-jsonl-import';
import { PILOT_UPLOAD_ATTESTATION_VERSION } from '../upload-attestation';

const richPattern = {
  code: 'MOD-HC-ARCH-001',
  name: 'EHR adjacency modernization pressure',
  description: 'Clinical-adjacent modernization stalls when integration seams are treated as generic platform work.',
  vertical: 'healthcare_provider',
  domain: 'application_modernization',
  category: 'architecture',
  tags: ['ehr', 'integration'],
  vocabulary: ['Epic', 'FHIR'],
  doctrine: 'Treat clinical context and identity boundaries as first-order modernization constraints.',
  triggers: ['EHR upgrade', 'fragmented integration estate'],
  applies_when: 'The estate has clinical workflow dependencies.',
  does_not_apply_when: 'The workload is back-office only.',
  decision_owner: 'CIO',
  supporting_evidence: [{ source: 'modernization brief', date: '2026-06-03' }],
  anti_patterns: ['lift and shift the dependency graph'],
  failure_modes: ['clinical workflow regression'],
  decision_artifacts: ['dependency map'],
  graph_relationships: [{ relation: 'depends_on', target: 'MOD-HC-ARCH-002', weight: 0.9 }],
  personas: ['CIO', 'CDAO'],
  specificity: 'healthcare-specific',
  confidence: 'high',
};

function fakeDb(calls: Array<{ table: string; operation: string; payload: unknown }>): never {
  return {
    from(table: string) {
      return {
        upsert(payload: unknown) {
          calls.push({ table, operation: 'upsert', payload });
          return {
            select() {
              const rows = Array.isArray(payload) ? payload : [payload];
              return Promise.resolve({ data: rows, error: null, count: rows.length });
            },
          };
        },
        insert(payload: unknown) {
          calls.push({ table, operation: 'insert', payload });
          return {
            select() {
              const rows = Array.isArray(payload) ? payload : [payload];
              return Promise.resolve({ data: rows.map((_, index) => ({ id: `run-${index}` })), error: null, count: rows.length });
            },
          };
        },
      };
    },
  } as never;
}

describe('corpus JSONL governed import', () => {
  it('validates rich healthcare modernization JSONL and preserves doctrine_context fields', () => {
    const prepared = prepareCorpusJsonlImport({
      clientId: 'client-meridian',
      tenantKey: 'meridian-health',
      uploadedBy: 'user-1',
      fileName: 'healthcare-modernization.jsonl',
      jsonlText: `${JSON.stringify(richPattern)}\n`,
      uploadedAt: '2026-06-04T19:00:00.000Z',
    });

    expect(prepared.errors).toEqual([]);
    expect(prepared.rowsParsed).toBe(1);
    expect(prepared.patternsPrepared).toBe(1);
    expect(prepared.edgesPrepared).toBe(1);
    expect(prepared.patternRows[0]).toMatchObject({
      code: 'MOD-HC-ARCH-001',
      vertical: 'healthcare_provider',
      confidence: 90,
      doctrine_context: {
        doctrine: richPattern.doctrine,
        triggers: richPattern.triggers,
        applies_when: richPattern.applies_when,
        does_not_apply_when: richPattern.does_not_apply_when,
        decision_owner: richPattern.decision_owner,
        supporting_evidence: richPattern.supporting_evidence,
        anti_patterns: richPattern.anti_patterns,
        failure_modes: richPattern.failure_modes,
        decision_artifacts: richPattern.decision_artifacts,
        graph_relationships: richPattern.graph_relationships,
        personas: richPattern.personas,
        specificity: richPattern.specificity,
        confidence: richPattern.confidence,
      },
    });
  });

  it('defaults to validation-only and does not touch the database', async () => {
    const calls: Array<{ table: string; operation: string; payload: unknown }> = [];
    const result = await loadCorpusJsonlImport({
      clientId: 'client-meridian',
      tenantKey: 'meridian-health',
      uploadedBy: 'user-1',
      fileName: 'healthcare-modernization.jsonl',
      jsonlText: `${JSON.stringify(richPattern)}\n`,
      db: fakeDb(calls),
    });

    expect(result.ok).toBe(true);
    expect(result.mode).toBe('validate_only');
    expect(result.persistence.status).toBe('validation_only');
    expect(calls).toEqual([]);
  });

  it('commits valid rows through genome_patterns, graph edges, and data_ingestion_runs', async () => {
    const calls: Array<{ table: string; operation: string; payload: unknown }> = [];
    const result = await loadCorpusJsonlImport({
      clientId: 'client-meridian',
      tenantKey: 'meridian-health',
      uploadedBy: 'user-1',
      fileName: 'healthcare-modernization.jsonl',
      jsonlText: `${JSON.stringify(richPattern)}\n`,
      commitMode: 'commit',
      uploadedAt: '2026-06-04T19:00:00.000Z',
      attestation: {
        version: PILOT_UPLOAD_ATTESTATION_VERSION,
        accepted: true,
        authorityConfirmed: true,
        dataUseConfirmed: true,
        sensitiveDataConfirmed: true,
        note: null,
        acceptedAt: '2026-06-04T19:00:00.000Z',
      },
      db: fakeDb(calls),
    });

    expect(result.persistence).toMatchObject({
      status: 'inserted',
      patternsUpserted: 1,
      edgesUpserted: 1,
      ingestionRunRecorded: true,
    });
    expect(calls.map((call) => `${call.operation}:${call.table}`)).toEqual([
      'upsert:genome_patterns',
      'upsert:intelligence_graph_edges',
      'insert:data_ingestion_runs',
    ]);
    expect(calls.find((call) => call.table === 'data_ingestion_runs')?.payload).toMatchObject({
      source_root: 'admin/context-layer/corpus-import',
      summary: expect.objectContaining({
        loader: 'c6-governed-corpus-jsonl-import',
        target_table: 'genome_patterns',
        upload_attestation: expect.objectContaining({
          version: PILOT_UPLOAD_ATTESTATION_VERSION,
        }),
      }),
    });
  });
});

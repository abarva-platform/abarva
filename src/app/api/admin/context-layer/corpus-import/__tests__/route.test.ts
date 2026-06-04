import { NextRequest } from 'next/server';

import { PILOT_UPLOAD_ATTESTATION_VERSION } from '@/lib/context-ingestion/upload-attestation';

import { POST } from '../route';

const mockRequireTenancy = jest.fn();
const mockSensitiveUploadResponse = jest.fn();
const mockDbCalls: Array<{
  table: string;
  operation: string;
  payload: unknown;
}> = [];

jest.mock('@/lib/auth/tenancy', () => ({
  requireTenancy: (...args: unknown[]) => mockRequireTenancy(...args),
  tenancyErrorResponse: () =>
    new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 }),
}));

jest.mock('@/lib/security/sensitive-upload-guard', () => ({
  evaluateSensitiveUpload: jest.fn(() => ({
    decision: 'allow',
    matchedRules: [],
  })),
  sensitiveUploadRejectedResponse: (...args: unknown[]) =>
    mockSensitiveUploadResponse(...args),
}));

jest.mock('@/lib/data-plane/postgresCompat', () => ({
  getAzureWriteFluentClient: () => ({
    from(table: string) {
      return {
        upsert(payload: unknown) {
          mockDbCalls.push({ table, operation: 'upsert', payload });
          return {
            select() {
              const rows = Array.isArray(payload) ? payload : [payload];
              return Promise.resolve({ data: rows, error: null, count: rows.length });
            },
          };
        },
        insert(payload: unknown) {
          mockDbCalls.push({ table, operation: 'insert', payload });
          return {
            select() {
              const rows = Array.isArray(payload) ? payload : [payload];
              return Promise.resolve({
                data: rows.map((_, index) => ({ id: `run-${index}` })),
                error: null,
                count: rows.length,
              });
            },
          };
        },
      };
    },
  }),
}));

function corpusRequest(formData: FormData) {
  return new NextRequest(
    'http://localhost/api/admin/context-layer/corpus-import',
    {
      method: 'POST',
      body: formData,
    },
  );
}

function addUploadAttestation(formData: FormData) {
  formData.set('operatorAttestationVersion', PILOT_UPLOAD_ATTESTATION_VERSION);
  formData.set('operatorAttestationAccepted', 'true');
  formData.set('operatorDataAuthorityConfirmed', 'true');
  formData.set('operatorDataUseConfirmed', 'true');
  formData.set('operatorSensitiveDataConfirmed', 'true');
}

function patternJsonl() {
  return `${JSON.stringify({
    code: 'MOD-HC-RFP-001',
    name: 'Modernization RFP scoring clarity',
    description: 'RFPs underweight migration-risk evidence when modernization is scored as a generic technology refresh.',
    vertical: 'healthcare_provider',
    doctrine: 'Score implementation evidence and transition risk alongside software capability.',
    supporting_evidence: [{ source: 'modernization brief', date: '2026-06-03' }],
    graph_relationships: [{ relation: 'supports', target: 'MOD-HC-RFP-002' }],
    confidence: 'high',
  })}\n`;
}

describe('/api/admin/context-layer/corpus-import', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    mockDbCalls.length = 0;
    process.env.DATABASE_URL = 'postgres://unit-test';
    mockRequireTenancy.mockResolvedValue({
      clientId: 'client-meridian',
      clientKey: 'meridian-health',
      userId: 'user-1',
    });
  });

  afterEach(() => {
    mockRequireTenancy.mockReset();
    mockSensitiveUploadResponse.mockReset();
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it('rejects cross-tenant corpus imports before parsing or persistence', async () => {
    const formData = new FormData();
    formData.set('clientId', 'client-apex');
    addUploadAttestation(formData);
    formData.set(
      'file',
      new File([patternJsonl()], 'healthcare-modernization.jsonl', {
        type: 'application/x-ndjson',
      }),
    );

    const response = await POST(corpusRequest(formData));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'forbidden_cross_tenant' });
    expect(mockDbCalls).toHaveLength(0);
  });

  it('validates JSONL by default without writing genome tables', async () => {
    const formData = new FormData();
    formData.set('clientId', 'client-meridian');
    formData.set('defaultVertical', 'healthcare_provider');
    addUploadAttestation(formData);
    formData.set(
      'file',
      new File([patternJsonl()], 'healthcare-modernization.jsonl', {
        type: 'application/x-ndjson',
      }),
    );

    const response = await POST(corpusRequest(formData));
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body).toMatchObject({
      ok: true,
      mode: 'validate_only',
      rowsParsed: 1,
      patternsPrepared: 1,
      persistence: {
        status: 'validation_only',
        patternsUpserted: 0,
      },
    });
    expect(mockDbCalls).toHaveLength(0);
  });

  it('commits valid JSONL through the governed loader when requested', async () => {
    const formData = new FormData();
    formData.set('clientId', 'client-meridian');
    formData.set('commitMode', 'commit');
    addUploadAttestation(formData);
    formData.set('operatorAttestationNote', 'Approved by corpus steward');
    formData.set(
      'file',
      new File([patternJsonl()], 'healthcare-modernization.jsonl', {
        type: 'application/x-ndjson',
      }),
    );

    const response = await POST(corpusRequest(formData));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      mode: 'commit',
      persistence: {
        status: 'inserted',
        patternsUpserted: 1,
        edgesUpserted: 1,
        ingestionRunRecorded: true,
      },
      attestation: {
        note: 'Approved by corpus steward',
      },
    });
    expect(mockDbCalls.map((call) => `${call.operation}:${call.table}`)).toEqual([
      'upsert:genome_patterns',
      'upsert:intelligence_graph_edges',
      'insert:data_ingestion_runs',
    ]);
  });
});

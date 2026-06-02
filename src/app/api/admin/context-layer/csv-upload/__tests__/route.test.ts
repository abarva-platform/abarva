import { NextRequest } from 'next/server';

import { PILOT_UPLOAD_ATTESTATION_VERSION } from '@/lib/context-ingestion/upload-attestation';

import { POST } from '../route';

const mockRequireTenancy = jest.fn();
const mockSensitiveUploadResponse = jest.fn();
const mockDbCalls: Array<{ table: string; operation: string; payload: unknown }> = [];

jest.mock('@/lib/auth/tenancy', () => ({
  requireTenancy: (...args: unknown[]) => mockRequireTenancy(...args),
  tenancyErrorResponse: () => new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 }),
}));

jest.mock('@/lib/security/sensitive-upload-guard', () => ({
  evaluateSensitiveUpload: jest.fn(() => ({ decision: 'allow', matchedRules: [] })),
  sensitiveUploadRejectedResponse: (...args: unknown[]) => mockSensitiveUploadResponse(...args),
}));

jest.mock('@/lib/data-plane/postgresCompat', () => ({
  getAzureWriteFluentClient: () => ({
    from(table: string) {
      return {
        insert(payload: unknown) {
          mockDbCalls.push({ table, operation: 'insert', payload });
          return {
            select() {
              const rows = Array.isArray(payload) ? payload : [payload];
              return Promise.resolve({
                data: rows.map((_, index) => ({ id: `id-${index}`, chunk_id: `chunk-${index}` })),
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

function csvRequest(formData: FormData) {
  return new NextRequest('http://localhost/api/admin/context-layer/csv-upload', {
    method: 'POST',
    body: formData,
  });
}

function addUploadAttestation(formData: FormData) {
  formData.set('operatorAttestationVersion', PILOT_UPLOAD_ATTESTATION_VERSION);
  formData.set('operatorAttestationAccepted', 'true');
  formData.set('operatorDataAuthorityConfirmed', 'true');
  formData.set('operatorDataUseConfirmed', 'true');
  formData.set('operatorSensitiveDataConfirmed', 'true');
}

describe('/api/admin/context-layer/csv-upload', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    mockDbCalls.length = 0;
    process.env.DATABASE_URL = 'postgres://unit-test';
    mockRequireTenancy.mockResolvedValue({
      clientId: 'client-apex',
      clientKey: 'apexretail',
      userId: 'user-1',
    });
  });

  afterEach(() => {
    mockRequireTenancy.mockReset();
    mockSensitiveUploadResponse.mockReset();
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it('rejects cross-tenant client ids before parsing or persistence', async () => {
    const formData = new FormData();
    formData.set('clientId', 'client-other');
    formData.set('file', new File(['app_id,name\napp-1,Claims'], 'apps.csv', { type: 'text/csv' }));
    addUploadAttestation(formData);

    const response = await POST(csvRequest(formData));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'forbidden_cross_tenant' });
    expect(mockDbCalls).toHaveLength(0);
  });

  it('rejects uploads before processing when operator attestation is missing', async () => {
    const formData = new FormData();
    formData.set('clientId', 'client-apex');
    formData.set('templateId', 'application-portfolio');
    formData.set('textColumns', JSON.stringify(['app_id', 'name']));
    formData.set('file', new File(['app_id,name\napp-1,Claims'], 'application-portfolio.csv', { type: 'text/csv' }));

    const response = await POST(csvRequest(formData));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: 'upload_attestation_required',
      detail: expect.stringContaining('tenant admin must attest'),
      missing: [
        'operatorAttestationVersion',
        'operatorAttestationAccepted',
        'operatorDataAuthorityConfirmed',
        'operatorDataUseConfirmed',
        'operatorSensitiveDataConfirmed',
      ],
    });
    expect(mockDbCalls).toHaveLength(0);
  });

  it('loads CSV rows as tenant-scoped pending context chunks', async () => {
    const formData = new FormData();
    formData.set('clientId', 'client-apex');
    formData.set('templateId', 'application-portfolio');
    formData.set('sourceRecordIdColumn', 'app_id');
    formData.set('titleColumn', 'name');
    formData.set('textColumns', JSON.stringify(['app_id', 'name', 'criticality', 'owner_role', 'system_of_record']));
    addUploadAttestation(formData);
    formData.set('operatorAttestationNote', 'CAB approval CAB-42');
    formData.set('file', new File([
      [
        'app_id,name,criticality,owner_role,system_of_record',
        'app-1,Claims Core,Tier 1,VP Architecture,true',
      ].join('\n'),
    ], 'application-portfolio.csv', { type: 'text/csv' }));

    const response = await POST(csvRequest(formData));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      rowsParsed: 1,
      chunksQueued: 1,
      persistence: {
        status: 'inserted',
        chunkRowsInserted: 1,
      },
      attestation: {
        version: PILOT_UPLOAD_ATTESTATION_VERSION,
        accepted: true,
        authorityConfirmed: true,
        dataUseConfirmed: true,
        sensitiveDataConfirmed: true,
        note: 'CAB approval CAB-42',
      },
      embeddingHandoff: {
        command: 'npm run embed:pending-chunks -- --tenant apex-retail',
      },
    });
    const chunkInsert = mockDbCalls.find((call) => call.table === 'enterprise_context_chunks');
    expect(chunkInsert?.payload).toEqual([
      expect.objectContaining({
        client_id: 'client-apex',
        tenant_key: 'apex-retail',
        source_record_id: 'app-1',
        embedding_status: 'pending',
        provenance: expect.objectContaining({
          upload_attestation: expect.objectContaining({
            version: PILOT_UPLOAD_ATTESTATION_VERSION,
            accepted: true,
            note: 'CAB approval CAB-42',
          }),
        }),
      }),
    ]);
    const runInsert = mockDbCalls.find((call) => call.table === 'data_ingestion_runs');
    expect(runInsert?.payload).toEqual(expect.objectContaining({
      summary: expect.objectContaining({
        upload_attestation: expect.objectContaining({
          version: PILOT_UPLOAD_ATTESTATION_VERSION,
          accepted: true,
        }),
      }),
    }));
    expect(mockDbCalls.some((call) => call.operation === 'delete')).toBe(false);
  });
});

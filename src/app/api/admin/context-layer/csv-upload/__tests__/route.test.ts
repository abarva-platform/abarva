import { NextRequest } from 'next/server';

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

    const response = await POST(csvRequest(formData));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'forbidden_cross_tenant' });
    expect(mockDbCalls).toHaveLength(0);
  });

  it('loads CSV rows as tenant-scoped pending context chunks', async () => {
    const formData = new FormData();
    formData.set('clientId', 'client-apex');
    formData.set('templateId', 'application-portfolio');
    formData.set('sourceRecordIdColumn', 'app_id');
    formData.set('titleColumn', 'name');
    formData.set('textColumns', JSON.stringify(['app_id', 'name', 'criticality', 'owner_role', 'system_of_record']));
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
      }),
    ]);
    expect(mockDbCalls.some((call) => call.operation === 'delete')).toBe(false);
  });
});

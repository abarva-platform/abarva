// Download route proof: 404 when not owned by tenant; streams blob bytes with a
// download disposition + correct content-type when found.
const tenancy = { clientId: 'c1', clientKey: 'skyharbor-air', userId: 'u1' };
let artifact: Record<string, unknown> | null = null;
let registryArtifact: Record<string, unknown> | null = null;
let artifactStateBody: string | null = null;

jest.mock('@/lib/auth/tenancy', () => ({
  requireTenancy: jest.fn(async () => tenancy),
  tenancyErrorResponse: jest.fn(() => { throw new Error('not tenancy'); }),
}));
jest.mock('@/lib/source/file-cabinet/repository', () => ({
  getSourceArtifact: jest.fn(async (id: string, clientId: string) => (artifact && clientId === 'c1' ? { ...artifact, id } : null)),
}));
jest.mock('@/lib/source/file-cabinet/blob-store', () => ({
  downloadArtifactBytes: jest.fn(async () => Buffer.from('PK docx bytes')),
}));
jest.mock('@/lib/active-client', () => ({
  getActiveClientRow: jest.fn(async () => ({ key: 'skyharbor' })),
}));
jest.mock('@/lib/agent/tools/intelligence/_shared', () => ({
  clientKeyToInventorySubstrateKey: jest.fn((key: string) => (key === 'skyharbor' ? 'skyharbor-air' : key)),
}));
jest.mock('@/lib/source/artifact-registry', () => ({
  getSourceArtifactRegistryRecord: jest.fn(async (id: string) => (
    registryArtifact ? { ...registryArtifact, id } : null
  )),
}));
jest.mock('@/lib/data-plane/objectStorage', () => ({
  getObjectStorageAdapter: jest.fn(() => ({
    download: jest.fn(async () => Buffer.from('app_id,app_name\nAPP-001,Reservations Core\n')),
  })),
}));
jest.mock('@/lib/data-plane/postgresCompat', () => ({
  getAzureWriteFluentClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn(async () => ({
              data: { body: artifactStateBody, body_format: 'markdown' },
              error: null,
            })),
          })),
        })),
      })),
    })),
  })),
}));

import { GET } from '../route';

function params(artifactId: string) { return { params: Promise.resolve({ artifactId }) }; }

beforeEach(() => {
  artifact = null;
  registryArtifact = null;
  artifactStateBody = null;
});

describe('GET /api/v1/source/artifacts/[artifactId]/download', () => {
  it('404 when the artifact is not owned by this tenant', async () => {
    const res = await GET({} as never, params('missing'));
    expect(res.status).toBe(404);
  });
  it('streams bytes with download disposition + docx content-type', async () => {
    artifact = { blobContainer: 'source-events', blobPath: 'p', fileName: 'AMS RFP.docx', fileFormat: 'docx', version: 2 };
    const res = await GET({} as never, params('a1'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/wordprocessingml/);
    expect(res.headers.get('content-disposition')).toContain('attachment; filename="AMS RFP.docx"');
    expect(res.headers.get('x-source-artifact-version')).toBe('2');
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.subarray(0, 2).toString('latin1')).toBe('PK');
  });

  it('falls back to source_artifacts registry uploads and streams original bytes', async () => {
    registryArtifact = {
      tenantKey: 'skyharbor-air',
      deletedAt: null,
      blobUri: 'skyharbor-air/event/a1/portfolio.csv',
      mimeType: 'text/csv',
      originalName: '01_Application_Portfolio.csv',
      version: 1,
    };

    const res = await GET({} as never, params('a1'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/csv');
    expect(res.headers.get('content-disposition')).toContain('attachment; filename="01_Application_Portfolio.csv"');
    expect(res.headers.get('x-source-artifact-registry')).toBe('source_artifacts');
    await expect(res.text()).resolves.toContain('Reservations Core');
  });

  it('streams inline generated registry artifacts from the artifact-state body instead of Blob', async () => {
    artifactStateBody = '# Sourcing Strategy Memo\n\nGenerated draft body.';
    registryArtifact = {
      tenantKey: 'skyharbor-air',
      sourceEventId: 'event-1',
      artifactKind: 'd01_strategy_memo',
      deletedAt: null,
      blobUri: 'inline://source-event-artifact-state/event-1/d01_strategy_memo/a1/d01_strategy_memo.md',
      mimeType: 'text/markdown; charset=utf-8',
      originalName: 'd01_strategy_memo-a1.md',
      version: 1,
    };

    const res = await GET({} as never, params('a1'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/markdown');
    expect(res.headers.get('content-disposition')).toContain('inline; filename="d01_strategy_memo-a1.md"');
    expect(res.headers.get('x-source-artifact-inline')).toBe('true');
    await expect(res.text()).resolves.toContain('Generated draft body');
  });
});

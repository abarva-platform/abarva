// Download route proof: 404 when not owned by tenant; streams blob bytes with a
// download disposition + correct content-type when found.
const tenancy = { clientId: 'c1', clientKey: 'skyharbor-air', userId: 'u1' };
let artifact: Record<string, unknown> | null = null;

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

import { GET } from '../route';

function params(artifactId: string) { return { params: Promise.resolve({ artifactId }) }; }

beforeEach(() => { artifact = null; });

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
});

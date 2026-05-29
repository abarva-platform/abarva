const requireTenancy = jest.fn();
const tenancyErrorResponse = jest.fn();
const mockAzureRead = {
  query: jest.fn(),
  select: jest.fn(),
  maybeSingle: jest.fn(),
  count: jest.fn(),
  withSession: jest.fn(),
};

jest.mock('@/app/api/v1/programs/_auth', () => ({
  requireTenancy,
  tenancyErrorResponse,
}));

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: mockAzureRead,
}));

function contentExportRequest(format = 'html'): Request {
  return new Request(`http://localhost/api/programs/program_1/deliverables/deliv_1/content-export?format=${format}`);
}

describe('GET /api/programs/[id]/deliverables/[deliverableId]/content-export read plane', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireTenancy.mockResolvedValue({ clientId: 'client_1', clientKey: 'apex-retail', userId: 'user_1' });
    tenancyErrorResponse.mockImplementation((err: unknown) => {
      throw err;
    });
    mockAzureRead.maybeSingle.mockImplementation(async (request) => {
      if (request.table === 'deliverables_v2') {
        return {
          id: 'deliv_1',
          engagement_id: 'program_1',
          deliverable_type_key: 'p2_package',
          title: 'Phase 2 Package',
        };
      }
      if (request.table === 'deliverable_versions') {
        return {
          content: '# Executive Summary\n\n- Margin recovery plan',
          version: 4,
          generated_at: '2026-05-29T00:00:00Z',
        };
      }
      return null;
    });
  });

  it('exports latest deliverable content through azureRead', async () => {
    const { GET } = await import('@/app/api/programs/[id]/deliverables/[deliverableId]/content-export/route');
    const res = await GET(contentExportRequest(), {
      params: Promise.resolve({ id: 'program_1', deliverableId: 'deliv_1' }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/html');
    expect(res.headers.get('Content-Disposition')).toContain('phase-2-package.html');
    await expect(res.text()).resolves.toContain('<li>Margin recovery plan</li>');
    expect(mockAzureRead.maybeSingle).toHaveBeenCalledWith(expect.objectContaining({
      table: 'deliverables_v2',
      where: { id: 'deliv_1', engagement_id: 'program_1' },
    }));
    expect(mockAzureRead.maybeSingle).toHaveBeenCalledWith(expect.objectContaining({
      table: 'deliverable_versions',
      where: { deliverable_id: 'deliv_1' },
      orderBy: { column: 'version', direction: 'desc' },
    }));
  });

  it('keeps no-content response when latest version is empty', async () => {
    mockAzureRead.maybeSingle.mockImplementation(async (request) => {
      if (request.table === 'deliverables_v2') {
        return {
          id: 'deliv_1',
          engagement_id: 'program_1',
          deliverable_type_key: 'p2_package',
          title: 'Phase 2 Package',
        };
      }
      if (request.table === 'deliverable_versions') {
        return { content: '   ', version: 5, generated_at: '2026-05-29T00:00:00Z' };
      }
      return null;
    });

    const { GET } = await import('@/app/api/programs/[id]/deliverables/[deliverableId]/content-export/route');
    const res = await GET(contentExportRequest(), {
      params: Promise.resolve({ id: 'program_1', deliverableId: 'deliv_1' }),
    });

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toMatchObject({ error: 'no_content' });
  });
});

export {};

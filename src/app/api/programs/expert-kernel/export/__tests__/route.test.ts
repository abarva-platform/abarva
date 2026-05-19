// Tests for the stable API alias used by the Expert Review Console download
// links. The page-adjacent route is still covered in its own suite; this test
// guards the production-safe /api path that avoids route-tree collisions.

const getCurrentUserMock = jest.fn();

jest.mock('@/lib/auth/current-user', () => ({
  __esModule: true,
  getCurrentUser: (...args: unknown[]) => getCurrentUserMock(...args),
}));

import { GET } from '../route';

const SIGNED_IN = {
  personId: null,
  clerkUserId: 'user_demo',
  primaryRole: 'client_viewer',
};

function req(query: string): Request {
  return new Request(`http://localhost/api/programs/expert-kernel/export${query}`);
}

describe('GET /api/programs/expert-kernel/export', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCurrentUserMock.mockResolvedValue(SIGNED_IN);
  });

  it('streams a kernel DOCX from the production-safe API path', async () => {
    const res = await GET(
      req('?case=apexretail&artifact=business_case_pack&format=docx') as never,
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    expect(res.headers.get('content-disposition')).toMatch(
      /attachment; filename=".*\.docx"/,
    );

    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(bytes.byteLength).toBeGreaterThan(4000);
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
  });
});


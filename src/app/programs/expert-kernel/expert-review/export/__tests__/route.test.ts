// Tests for GET /programs/expert-kernel/expert-review/export.
//
// Covers param validation (400 on bad input), the auth gate (401 without a
// session), correct content types and Content-Disposition, and that all three
// tenant cases resolve and stream a non-empty file in every advertised format.

const getCurrentUserMock = jest.fn();

jest.mock('@/lib/auth/current-user', () => ({
  __esModule: true,
  getCurrentUser: (...args: unknown[]) => getCurrentUserMock(...args),
}));

import { GET } from '../route';

function req(query: string): Request {
  return new Request(
    `http://localhost/programs/expert-kernel/expert-review/export${query}`,
  );
}

const SIGNED_IN = {
  personId: null,
  clerkUserId: 'user_demo',
  primaryRole: 'client_viewer',
};

describe('export route — auth', () => {
  beforeEach(() => jest.clearAllMocks());

  it('401s without a signed-in session', async () => {
    getCurrentUserMock.mockResolvedValue(null);
    const res = await GET(
      req('?case=apexretail&artifact=cfo_pack&format=pdf') as never,
    );
    expect(res.status).toBe(401);
  });
});

describe('export route — param validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCurrentUserMock.mockResolvedValue(SIGNED_IN);
  });

  it('400s on a missing case', async () => {
    const res = await GET(req('?artifact=cfo_pack&format=pdf') as never);
    expect(res.status).toBe(400);
  });

  it('400s on an unknown case', async () => {
    const res = await GET(
      req('?case=nope&artifact=cfo_pack&format=pdf') as never,
    );
    expect(res.status).toBe(400);
  });

  it('400s on an unknown artifact', async () => {
    const res = await GET(
      req('?case=apexretail&artifact=nope&format=pdf') as never,
    );
    expect(res.status).toBe(400);
  });

  it('400s on an unknown format', async () => {
    const res = await GET(
      req('?case=apexretail&artifact=cfo_pack&format=csv') as never,
    );
    expect(res.status).toBe(400);
  });

  it('400s when the artifact does not support the format', async () => {
    // financial_model is xlsx-only.
    const res = await GET(
      req('?case=apexretail&artifact=financial_model&format=docx') as never,
    );
    expect(res.status).toBe(400);
  });
});

describe('export route — successful downloads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCurrentUserMock.mockResolvedValue(SIGNED_IN);
  });

  const cases = ['apexretail', 'meridian', 'arcturus'] as const;

  for (const caseId of cases) {
    it(`streams a CFO pack PDF for ${caseId}`, async () => {
      const res = await GET(
        req(`?case=${caseId}&artifact=cfo_pack&format=pdf`) as never,
      );
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toBe('application/pdf');
      expect(res.headers.get('content-disposition')).toMatch(
        /attachment; filename=".*\.pdf"/,
      );
      const bytes = new Uint8Array(await res.arrayBuffer());
      expect(bytes.byteLength).toBeGreaterThan(2000);
      expect(Buffer.from(bytes.subarray(0, 5)).toString('latin1')).toBe(
        '%PDF-',
      );
    });

    it(`streams a financial-model XLSX for ${caseId}`, async () => {
      const res = await GET(
        req(`?case=${caseId}&artifact=financial_model&format=xlsx`) as never,
      );
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      const bytes = new Uint8Array(await res.arrayBuffer());
      expect(bytes.byteLength).toBeGreaterThan(2000);
      // ZIP magic — xlsx is a zip container.
      expect(bytes[0]).toBe(0x50);
      expect(bytes[1]).toBe(0x4b);
    });

    it(`streams a business-case-pack DOCX for ${caseId}`, async () => {
      const res = await GET(
        req(
          `?case=${caseId}&artifact=business_case_pack&format=docx`,
        ) as never,
      );
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
      const bytes = new Uint8Array(await res.arrayBuffer());
      expect(bytes.byteLength).toBeGreaterThan(4000);
      expect(bytes[0]).toBe(0x50);
      expect(bytes[1]).toBe(0x4b);
    });
  }

  it('sets the kernel tracing headers', async () => {
    const res = await GET(
      req('?case=meridian&artifact=mobilize_pack&format=docx') as never,
    );
    expect(res.headers.get('x-kernel-case')).toBe('meridian');
    expect(res.headers.get('x-kernel-artifact')).toBe('mobilize_pack');
    expect(res.headers.get('x-kernel-format')).toBe('docx');
  });
});

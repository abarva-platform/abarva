const deliverQuarterlyBoardPacksMock = jest.fn();
const resolveQuarterlyDeliveryConfigMock = jest.fn();

jest.mock('@/lib/programs/expert-kernel/exports/board-pack/quarterly-delivery', () => ({
  deliverQuarterlyBoardPacks: (...args: unknown[]) => deliverQuarterlyBoardPacksMock(...args),
  resolveQuarterlyDeliveryConfig: (...args: unknown[]) =>
    resolveQuarterlyDeliveryConfigMock(...args),
}));

import { NextRequest } from 'next/server';

function makeReq(auth?: string | null): NextRequest {
  const headers: Record<string, string> = {};
  if (auth) headers.authorization = auth;
  return new NextRequest(
    new Request('http://localhost/api/cron/board-pack', { method: 'GET', headers }),
  );
}

describe('GET /api/cron/board-pack', () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CRON_SECRET = 'cron-secret';
    resolveQuarterlyDeliveryConfigMock.mockReturnValue({
      clients: [
        {
          clientKey: 'apexretail',
          clientLabel: 'Apex Retail',
          recipients: ['cfo@example.com'],
        },
      ],
      quarter: 'Q2 2026',
      generatedOn: '2026-06-01',
    });
    deliverQuarterlyBoardPacksMock.mockResolvedValue({
      ok: true,
      generated: 1,
      attempted: 1,
      sent: 1,
      failed: 0,
      skipped: 0,
      durationMs: 12,
      sends: [
        {
          clientKey: 'apexretail',
          recipient: 'cfo@example.com',
          ok: true,
          providerMessageId: 'resend-1',
        },
      ],
    });
  });

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalSecret;
  });

  it('returns 401 when CRON_SECRET is unset', async () => {
    delete process.env.CRON_SECRET;
    const { GET } = await import('../route');
    const res = await GET(makeReq('Bearer anything'));
    expect(res.status).toBe(401);
    expect(deliverQuarterlyBoardPacksMock).not.toHaveBeenCalled();
  });

  it('returns 401 when authorization is missing or wrong', async () => {
    const { GET } = await import('../route');
    expect((await GET(makeReq())).status).toBe(401);
    expect((await GET(makeReq('Bearer wrong'))).status).toBe(401);
    expect(deliverQuarterlyBoardPacksMock).not.toHaveBeenCalled();
  });

  it('generates and sends board packs with valid bearer auth', async () => {
    const { GET } = await import('../route');
    const res = await GET(makeReq('Bearer cron-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sent).toBe(1);
    expect(resolveQuarterlyDeliveryConfigMock).toHaveBeenCalledTimes(1);
    expect(deliverQuarterlyBoardPacksMock).toHaveBeenCalledWith({
      clients: [
        {
          clientKey: 'apexretail',
          clientLabel: 'Apex Retail',
          recipients: ['cfo@example.com'],
        },
      ],
      quarter: 'Q2 2026',
      generatedOn: '2026-06-01',
    });
  });

  it('returns 207 when at least one send fails', async () => {
    deliverQuarterlyBoardPacksMock.mockResolvedValueOnce({
      ok: false,
      generated: 1,
      attempted: 1,
      sent: 0,
      failed: 1,
      skipped: 0,
      durationMs: 12,
      sends: [{ clientKey: 'apexretail', recipient: 'bad', ok: false, reason: 'invalid_recipient' }],
    });
    const { GET } = await import('../route');
    const res = await GET(makeReq('Bearer cron-secret'));
    expect(res.status).toBe(207);
  });
});

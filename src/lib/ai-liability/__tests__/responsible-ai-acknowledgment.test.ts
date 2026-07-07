import {
  RESPONSIBLE_AI_ACKNOWLEDGMENT_TEXT,
  RESPONSIBLE_AI_ACKNOWLEDGMENT_VERSION,
  RESPONSIBLE_AI_REACKNOWLEDGMENT_INTERVAL_DAYS,
  getResponsibleAiAcknowledgmentCycle,
  getResponsibleAiAcknowledgmentExpiresAt,
  getResponsibleAiAcknowledgmentStatus,
  isResponsibleAiAcknowledgmentExpired,
  recordResponsibleAiAcknowledgment,
  type ResponsibleAiAcknowledgmentAcceptance,
  type ResponsibleAiAcknowledgmentStore,
  type ResponsibleAiAcknowledgmentSubject,
} from '@/lib/ai-liability/responsible-ai-acknowledgment';

const subject: ResponsibleAiAcknowledgmentSubject = {
  userId: 'user_123',
  userEmail: 'cfo@example.com',
  clientId: '00000000-0000-4000-8000-000000000001',
  clientKey: 'apexretail',
};

function fakeStore(args: {
  acceptedAt?: string | null;
  failRead?: boolean;
  writes?: ResponsibleAiAcknowledgmentAcceptance[];
} = {}): ResponsibleAiAcknowledgmentStore {
  return {
    async getAcceptedRecord() {
      if (args.failRead) throw new Error('table missing');
      if (!args.acceptedAt) return null;
      return {
        id: 'ack-1',
        client_id: subject.clientId,
        user_id: subject.userId,
        text_version: RESPONSIBLE_AI_ACKNOWLEDGMENT_VERSION,
        acknowledgment_cycle: 'annual-2026',
        accepted_at: args.acceptedAt,
      };
    },
    async insertAcceptedRecord(input) {
      args.writes?.push(input);
      return { ok: true };
    },
  };
}

describe('responsible AI acknowledgment', () => {
  it('requires the current text version when no per-user tenant row exists', async () => {
    const status = await getResponsibleAiAcknowledgmentStatus(subject, fakeStore());

    expect(status.required).toBe(true);
    expect(status.reason).toBe('missing');
    expect(status.textVersion).toBe(RESPONSIBLE_AI_ACKNOWLEDGMENT_VERSION);
    expect(status.consentText).toBe(RESPONSIBLE_AI_ACKNOWLEDGMENT_TEXT);
  });

  it('does not require acknowledgment when the current version is already accepted', async () => {
    const status = await getResponsibleAiAcknowledgmentStatus(
      subject,
      fakeStore({ acceptedAt: '2026-06-02T16:00:00.000Z' }),
    );

    expect(status.required).toBe(false);
    expect(status.reason).toBe('accepted');
    expect(status.acceptedAt).toBe('2026-06-02T16:00:00.000Z');
    expect(status.expiresAt).toBe('2027-06-02T16:00:00.000Z');
    expect(status.reacknowledgmentIntervalDays).toBe(
      RESPONSIBLE_AI_REACKNOWLEDGMENT_INTERVAL_DAYS,
    );
  });

  it('requires annual re-acknowledgment when the latest accepted row is expired', async () => {
    const status = await getResponsibleAiAcknowledgmentStatus(
      subject,
      fakeStore({ acceptedAt: '2024-01-01T00:00:00.000Z' }),
    );

    expect(status.required).toBe(true);
    expect(status.reason).toBe('expired');
    expect(status.acceptedAt).toBe('2024-01-01T00:00:00.000Z');
    expect(status.expiresAt).toBe('2024-12-31T00:00:00.000Z');
  });

  it('fails closed when the acknowledgment ledger is unavailable', async () => {
    const status = await getResponsibleAiAcknowledgmentStatus(
      subject,
      fakeStore({ failRead: true }),
    );

    expect(status.required).toBe(true);
    expect(status.storageAvailable).toBe(false);
    expect(status.reason).toBe('storage_unavailable');
  });

  it('records a click-wrap acceptance with tenant, user, ip, user agent, and source', async () => {
    const writes: ResponsibleAiAcknowledgmentAcceptance[] = [];

    const result = await recordResponsibleAiAcknowledgment(
      {
        subject,
        ipAddress: '203.0.113.10',
        userAgent: 'UnitTest/1.0',
        source: 'first_login_clickwrap',
      },
      fakeStore({ writes }),
    );

    expect(result.ok).toBe(true);
    expect(writes).toEqual([
      {
        subject,
        ipAddress: '203.0.113.10',
        userAgent: 'UnitTest/1.0',
        source: 'first_login_clickwrap',
      },
    ]);
  });

  it('uses UTC annual cycle keys for renewal rows', () => {
    expect(
      getResponsibleAiAcknowledgmentCycle(new Date('2027-06-02T12:30:00.000Z')),
    ).toBe('annual-2027');
  });

  it('calculates acknowledgment expiration at the annual interval', () => {
    const acceptedAt = '2026-06-02T16:00:00.000Z';

    expect(getResponsibleAiAcknowledgmentExpiresAt(acceptedAt)).toBe(
      '2027-06-02T16:00:00.000Z',
    );
    expect(
      isResponsibleAiAcknowledgmentExpired(
        acceptedAt,
        new Date('2027-06-02T15:59:59.999Z'),
      ),
    ).toBe(false);
    expect(
      isResponsibleAiAcknowledgmentExpired(
        acceptedAt,
        new Date('2027-06-02T16:00:00.000Z'),
      ),
    ).toBe(true);
  });
});

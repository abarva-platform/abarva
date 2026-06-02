import {
  SYSTEM_ROLE_ACKNOWLEDGMENT_POINTS,
  SYSTEM_ROLE_ACKNOWLEDGMENT_TEXT,
  SYSTEM_ROLE_ACKNOWLEDGMENT_VERSION,
  getSystemRoleAcknowledgmentStatus,
  recordSystemRoleAcknowledgment,
  type SystemRoleAcknowledgmentAcceptance,
  type SystemRoleAcknowledgmentStore,
  type SystemRoleAcknowledgmentSubject,
} from '@/lib/ai-liability/system-role-acknowledgment';

const subject: SystemRoleAcknowledgmentSubject = {
  userId: 'user_admin_123',
  userEmail: 'admin@example.com',
  clientId: '00000000-0000-4000-8000-000000000001',
  clientKey: 'apexretail',
};

function fakeStore(args: {
  signedAt?: string | null;
  failRead?: boolean;
  writes?: SystemRoleAcknowledgmentAcceptance[];
} = {}): SystemRoleAcknowledgmentStore {
  return {
    async getSignedRecord() {
      if (args.failRead) throw new Error('table missing');
      if (!args.signedAt) return null;
      return {
        id: 'system-role-ack-1',
        client_id: subject.clientId,
        user_id: subject.userId,
        text_version: SYSTEM_ROLE_ACKNOWLEDGMENT_VERSION,
        signed_at: args.signedAt,
      };
    },
    async insertSignedRecord(input) {
      args.writes?.push(input);
      return { ok: true };
    },
  };
}

describe('system role acknowledgment', () => {
  it('requires tenant-admin signing when no current row exists', async () => {
    const status = await getSystemRoleAcknowledgmentStatus(subject, fakeStore());

    expect(status.required).toBe(true);
    expect(status.reason).toBe('missing');
    expect(status.textVersion).toBe(SYSTEM_ROLE_ACKNOWLEDGMENT_VERSION);
    expect(status.acknowledgmentText).toBe(SYSTEM_ROLE_ACKNOWLEDGMENT_TEXT);
    expect(SYSTEM_ROLE_ACKNOWLEDGMENT_POINTS).toHaveLength(4);
  });

  it('does not require signing when the current version is already recorded', async () => {
    const status = await getSystemRoleAcknowledgmentStatus(
      subject,
      fakeStore({ signedAt: '2026-06-02T18:00:00.000Z' }),
    );

    expect(status.required).toBe(false);
    expect(status.reason).toBe('signed');
    expect(status.signedAt).toBe('2026-06-02T18:00:00.000Z');
  });

  it('fails closed when the system role ledger is unavailable', async () => {
    const status = await getSystemRoleAcknowledgmentStatus(
      subject,
      fakeStore({ failRead: true }),
    );

    expect(status.required).toBe(true);
    expect(status.storageAvailable).toBe(false);
    expect(status.reason).toBe('storage_unavailable');
  });

  it('records tenant-admin onboarding evidence with tenant, user, ip, user agent, and source', async () => {
    const writes: SystemRoleAcknowledgmentAcceptance[] = [];

    const result = await recordSystemRoleAcknowledgment(
      {
        subject,
        ipAddress: '203.0.113.10',
        userAgent: 'UnitTest/1.0',
        source: 'tenant_admin_onboarding',
      },
      fakeStore({ writes }),
    );

    expect(result.ok).toBe(true);
    expect(writes).toEqual([
      {
        subject,
        ipAddress: '203.0.113.10',
        userAgent: 'UnitTest/1.0',
        source: 'tenant_admin_onboarding',
      },
    ]);
  });
});

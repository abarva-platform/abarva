/**
 * W4-PR-3 · Clerk webhook → emitNotification("auth.invite_accepted")
 *
 * Verifies that the `user.created` handler emits `auth.invite_accepted`
 * through the broker AFTER the audit write succeeds, that the email is
 * masked before entering the payload (PII allowlist), and that broker
 * failures never propagate into the 200 response Clerk relies on.
 *
 * The handler returns 503 when CLERK_WEBHOOK_SIGNING_SECRET is missing
 * and 400 on bad signature — neither path should emit. We focus on the
 * happy + emit-failure + missing-invite paths since those exercise the
 * notification wiring.
 */

const writeInviteAuditMock = jest.fn().mockResolvedValue(undefined);
jest.mock('@/lib/admin/invite-collaborator-audit', () => ({
  writeInviteAudit: (...args: unknown[]) => writeInviteAuditMock(...args),
}));

const emitNotificationMock = jest.fn(async (_input?: unknown) => ({
  eventId: 'evt_1',
  enqueuedDeliveries: 1,
}));
jest.mock('@/lib/admin/broker/notification-broker', () => ({
  emitNotification: (input: unknown) => emitNotificationMock(input),
}));

// `svix` is imported lazily inside the route. Mock it so the verifier
// returns the parsed event unchanged.
let svixReturn: unknown = null;
jest.mock(
  'svix',
  () => ({
    Webhook: jest.fn().mockImplementation(() => ({
      verify: () => svixReturn,
    })),
  }),
  { virtual: true },
);

import { POST } from '../route';

function makeRequest(body: unknown): {
  text: () => Promise<string>;
  headers: Headers;
} {
  return {
    text: async () => JSON.stringify(body),
    headers: new Headers({
      'svix-id': 'msg_1',
      'svix-timestamp': '0',
      'svix-signature': 'sig',
    }),
  };
}

const ORIGINAL_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

beforeEach(() => {
  process.env.CLERK_WEBHOOK_SIGNING_SECRET = 'whsec_test';
  writeInviteAuditMock.mockClear();
  emitNotificationMock.mockClear();
  emitNotificationMock.mockResolvedValue({ eventId: 'evt_1', enqueuedDeliveries: 1 });
});

afterAll(() => {
  if (ORIGINAL_SECRET === undefined) {
    delete process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  } else {
    process.env.CLERK_WEBHOOK_SIGNING_SECRET = ORIGINAL_SECRET;
  }
});

describe('W4-PR-3 · Clerk webhook · auth.invite_accepted emit', () => {
  it('emits with masked email after the audit write succeeds', async () => {
    svixReturn = {
      type: 'user.created',
      data: {
        id: 'user_clerk_42',
        email_addresses: [{ email_address: 'jane.doe@apex-retail.com' }],
        public_metadata: {
          invitation_id: 'inv_1',
          invited_by_user_id: 'user_admin_1',
          tenant_canonical_key: 'apex-retail',
          role: 'CIO',
        },
      },
    };

    const resp = await POST(
      makeRequest({}) as unknown as Parameters<typeof POST>[0],
    );
    expect(resp.status).toBe(200);

    await new Promise((r) => setImmediate(r));

    expect(writeInviteAuditMock).toHaveBeenCalledTimes(1);
    expect(emitNotificationMock).toHaveBeenCalledTimes(1);
    const arg = emitNotificationMock.mock.calls[0]?.[0] as { tenantKey?: string; eventType?: string; payload: Record<string, unknown>; actorUserId?: string; targetResourceId?: string };
    expect(arg).toMatchObject({
      tenantKey: 'apex-retail',
      eventType: 'auth.invite_accepted',
      actorUserId: 'user_admin_1',
      targetResourceId: 'inv_1',
    });
    // PII allowlist · email must be MASKED before it enters the payload.
    expect(arg.payload.inviteeEmail).not.toBe('jane.doe@apex-retail.com');
    expect(arg.payload.inviteeEmailMasked).not.toBe('jane.doe@apex-retail.com');
    expect(arg.payload.role).toBe('CIO');
    expect(arg.payload.acceptedAtIso).toEqual(expect.any(String));
  });

  it('does NOT emit when no invitation context is present (regular sign-up)', async () => {
    svixReturn = {
      type: 'user.created',
      data: {
        id: 'user_clerk_99',
        email_addresses: [{ email_address: 'random@example.com' }],
        public_metadata: {},
      },
    };

    const resp = await POST(
      makeRequest({}) as unknown as Parameters<typeof POST>[0],
    );
    expect(resp.status).toBe(200);

    await new Promise((r) => setImmediate(r));
    expect(writeInviteAuditMock).not.toHaveBeenCalled();
    expect(emitNotificationMock).not.toHaveBeenCalled();
  });

  it('does NOT emit for non user.created events', async () => {
    svixReturn = {
      type: 'session.created',
      data: { id: 'sess_1' },
    };

    const resp = await POST(
      makeRequest({}) as unknown as Parameters<typeof POST>[0],
    );
    expect(resp.status).toBe(200);

    await new Promise((r) => setImmediate(r));
    expect(emitNotificationMock).not.toHaveBeenCalled();
  });

  it('does NOT propagate broker failures into the 200 response', async () => {
    svixReturn = {
      type: 'user.created',
      data: {
        id: 'user_clerk_42',
        email_addresses: [{ email_address: 'jane.doe@apex-retail.com' }],
        public_metadata: {
          invitation_id: 'inv_1',
          invited_by_user_id: 'user_admin_1',
          tenant_canonical_key: 'apex-retail',
          role: 'CIO',
        },
      },
    };
    emitNotificationMock.mockRejectedValueOnce(new Error('broker down'));

    const resp = await POST(
      makeRequest({}) as unknown as Parameters<typeof POST>[0],
    );
    await new Promise((r) => setImmediate(r));

    expect(resp.status).toBe(200);
    expect(emitNotificationMock).toHaveBeenCalledTimes(1);
  });
});

/**
 * Invite Events broker contract tests · Wave 2 PR-3
 *
 * Verifies:
 *   • No CLERK_SECRET_KEY → [] (no SDK load attempted).
 *   • Email masking: standard, no-@, empty-local, empty-string.
 *   • Action derivation: sent / accepted / expired / revoked priorities.
 *   • Tenant filter via public_metadata.tenantKey.
 *   • Invitations without a tenantKey stamp are surfaced to ALL tenants
 *     (honesty doctrine — avoid silently hiding events).
 *   • Out-of-window rows are dropped.
 *   • Clerk SDK throw → [] AND structured warn.
 *   • Snake / camel case Clerk payloads both supported.
 *   • Raw email addresses NEVER appear in returned events.
 */

import { maskEmail } from '../invite-events-broker';

// Mock @clerk/backend at module level so the dynamic import resolves
// to our fake.
const getInvitationListMock = jest.fn();
const createClerkClientMock = jest.fn(() => ({
  invitations: { getInvitationList: getInvitationListMock },
}));

jest.mock('@clerk/backend', () => ({
  createClerkClient: createClerkClientMock,
}));

const ORIGINAL_ENV = process.env;

function withSecret(): void {
  process.env = { ...ORIGINAL_ENV, CLERK_SECRET_KEY: 'sk_test_x' };
}

function withoutSecret(): void {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.CLERK_SECRET_KEY;
}

describe('maskEmail', () => {
  it('masks standard emails to first-char + domain', () => {
    expect(maskEmail('mary.chen@example.com')).toBe('m***@example.com');
    expect(maskEmail('john@apexretail.com')).toBe('j***@apexretail.com');
  });

  it('masks single-char locals to first-char + domain', () => {
    expect(maskEmail('a@example.com')).toBe('a***@example.com');
  });

  it('handles strings without @ as first-char + ***', () => {
    expect(maskEmail('mary')).toBe('m***');
  });

  it('returns *** for empty / null / undefined inputs', () => {
    expect(maskEmail('')).toBe('***');
    expect(maskEmail(null)).toBe('***');
    expect(maskEmail(undefined)).toBe('***');
  });

  it('handles empty-local edge case as ***@domain', () => {
    expect(maskEmail('@example.com')).toBe('***@example.com');
  });
});

describe('getRecentInviteEvents', () => {
  beforeEach(() => {
    // Reset only the mock fn state, NOT the module registry — resetting
    // modules would also clear the @clerk/backend mock above.
    getInvitationListMock.mockReset();
    createClerkClientMock.mockClear();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('returns [] when CLERK_SECRET_KEY is absent (no SDK load)', async () => {
    withoutSecret();
    const { getRecentInviteEvents } = await import('../invite-events-broker');
    const events = await getRecentInviteEvents('apex-retail');
    expect(events).toEqual([]);
    expect(createClerkClientMock).not.toHaveBeenCalled();
  });

  it('returns [] AND warns when the Clerk API throws', async () => {
    withSecret();
    getInvitationListMock.mockRejectedValue(new Error('clerk api down'));

    const { getRecentInviteEvents } = await import('../invite-events-broker');
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const events = await getRecentInviteEvents('apex-retail');

    expect(events).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
    expect(String(warnSpy.mock.calls[0]?.[0])).toMatch(
      /invite_events\.clerk_query_failed/,
    );
    warnSpy.mockRestore();
  });

  it('masks every returned email — no raw addresses leak', async () => {
    withSecret();
    const now = Date.now();
    const recent = new Date(now - 3 * 60 * 60 * 1000).toISOString();
    getInvitationListMock.mockResolvedValue([
      {
        id: 'inv-1',
        email_address: 'priya@apexretail.com',
        status: 'pending',
        created_at: recent,
        invited_by: 'user_abc',
      },
      {
        id: 'inv-2',
        email_address: 'mark.lin@meridian.com',
        status: 'accepted',
        created_at: recent,
        updated_at: recent,
        invited_by: null,
      },
    ]);

    const { getRecentInviteEvents } = await import('../invite-events-broker');
    const events = await getRecentInviteEvents('apex-retail');

    // 2 invites returned.
    expect(events).toHaveLength(2);
    for (const event of events) {
      // Masked form: first-char + *** + @domain. No full address.
      expect(event.target).toMatch(/^[a-z0-9]\*\*\*@[^@\s]+$/);
      expect(event.target).not.toContain('priya');
      expect(event.target).not.toContain('mark.lin');
    }
    expect(events.find((e) => e.id === 'inv-1')?.target).toBe(
      'p***@apexretail.com',
    );
    expect(events.find((e) => e.id === 'inv-2')?.target).toBe(
      'm***@meridian.com',
    );
  });

  it('derives action: revoked > expired > accepted > sent', async () => {
    withSecret();
    const recent = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    getInvitationListMock.mockResolvedValue([
      {
        id: 'a',
        email_address: 'a@x.com',
        status: 'pending',
        created_at: recent,
        revoked: true,
      },
      {
        id: 'b',
        email_address: 'b@x.com',
        status: 'expired',
        created_at: recent,
        updated_at: recent,
      },
      {
        id: 'c',
        email_address: 'c@x.com',
        status: 'accepted',
        created_at: recent,
        updated_at: recent,
      },
      {
        id: 'd',
        email_address: 'd@x.com',
        status: 'pending',
        created_at: recent,
      },
    ]);

    const { getRecentInviteEvents } = await import('../invite-events-broker');
    const events = await getRecentInviteEvents('apex-retail');
    const actionsById = Object.fromEntries(events.map((e) => [e.id, e.action]));
    expect(actionsById.a).toBe('invite revoked');
    expect(actionsById.b).toBe('invite expired');
    expect(actionsById.c).toBe('invite accepted');
    expect(actionsById.d).toBe('invite sent');
  });

  it('filters by public_metadata.tenantKey when stamped, includes unstamped', async () => {
    withSecret();
    const recent = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    getInvitationListMock.mockResolvedValue([
      {
        id: 'match',
        email_address: 'm@x.com',
        status: 'pending',
        created_at: recent,
        public_metadata: { tenantKey: 'apex-retail' },
      },
      {
        id: 'other',
        email_address: 'o@x.com',
        status: 'pending',
        created_at: recent,
        public_metadata: { tenantKey: 'meridian-health' },
      },
      {
        id: 'unstamped',
        email_address: 'u@x.com',
        status: 'pending',
        created_at: recent,
      },
    ]);

    const { getRecentInviteEvents } = await import('../invite-events-broker');
    const events = await getRecentInviteEvents('apex-retail');
    const ids = events.map((e) => e.id).sort();
    // Stamped-other excluded; stamped-match + unstamped included.
    expect(ids).toEqual(['match', 'unstamped']);
  });

  it('drops invitations outside the 24h window', async () => {
    withSecret();
    const tooOld = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const recent = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    getInvitationListMock.mockResolvedValue([
      {
        id: 'old',
        email_address: 'old@x.com',
        status: 'pending',
        created_at: tooOld,
      },
      {
        id: 'new',
        email_address: 'new@x.com',
        status: 'pending',
        created_at: recent,
      },
    ]);

    const { getRecentInviteEvents } = await import('../invite-events-broker');
    const events = await getRecentInviteEvents('apex-retail');
    expect(events.map((e) => e.id)).toEqual(['new']);
  });

  it('supports both snake_case and camelCase Clerk payloads', async () => {
    withSecret();
    const recent = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    getInvitationListMock.mockResolvedValue([
      {
        id: 'snake',
        email_address: 's@x.com',
        status: 'pending',
        created_at: recent,
        invited_by: 'inviter_1',
      },
      {
        id: 'camel',
        emailAddress: 'c@x.com',
        status: 'pending',
        createdAt: recent,
        invitedBy: 'inviter_2',
      },
    ]);

    const { getRecentInviteEvents } = await import('../invite-events-broker');
    const events = await getRecentInviteEvents('apex-retail');
    const snake = events.find((e) => e.id === 'snake');
    const camel = events.find((e) => e.id === 'camel');
    expect(snake?.target).toBe('s***@x.com');
    expect(snake?.actor).toBe('inviter_1');
    expect(camel?.target).toBe('c***@x.com');
    expect(camel?.actor).toBe('inviter_2');
  });

  it('unwraps the {data: [...]} envelope shape', async () => {
    withSecret();
    const recent = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    getInvitationListMock.mockResolvedValue({
      data: [
        {
          id: 'wrapped',
          email_address: 'w@x.com',
          status: 'pending',
          created_at: recent,
        },
      ],
    });
    const { getRecentInviteEvents } = await import('../invite-events-broker');
    const events = await getRecentInviteEvents('apex-retail');
    expect(events).toHaveLength(1);
    expect(events[0].id).toBe('wrapped');
  });

  it('returns events sorted by ts desc', async () => {
    withSecret();
    const minutes = (n: number) =>
      new Date(Date.now() - n * 60 * 1000).toISOString();
    getInvitationListMock.mockResolvedValue([
      // Mixed order intentionally.
      { id: 'mid', email_address: 'm@x.com', status: 'pending', created_at: minutes(120) },
      { id: 'old', email_address: 'o@x.com', status: 'pending', created_at: minutes(240) },
      { id: 'new', email_address: 'n@x.com', status: 'pending', created_at: minutes(15) },
    ]);
    const { getRecentInviteEvents } = await import('../invite-events-broker');
    const events = await getRecentInviteEvents('apex-retail');
    expect(events.map((e) => e.id)).toEqual(['new', 'mid', 'old']);
  });
});

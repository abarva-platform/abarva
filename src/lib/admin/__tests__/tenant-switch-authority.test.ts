/**
 * tenant-switch-authority · founder-allowlist coverage.
 *
 * Motivation (P1 silent-fail post-mortem · 2026-05-30): the
 * TenantSwitcher chip rendered for the founder on prod but the API
 * silently 403'd. Root-cause investigation surfaced two hardening
 * gaps in `canSwitchActiveTenant`:
 *   1. Comparison was only against `primaryEmailAddress`. If the
 *      allowlisted address is configured as a verified *secondary*
 *      address on the Clerk session, the gate would fail even though
 *      the user demonstrably owns the address.
 *   2. Implicit reliance on Clerk normalizing email case — Clerk does
 *      not in fact normalize. The lowercase-both-sides comparison is
 *      now explicit + tested.
 *
 * These tests pin both behaviors.
 */

// Force module-scope (not script-scope) to avoid global-scope name
// collisions with other *.test.ts files.
export {};

const mockCurrentUser = jest.fn();

jest.mock('@clerk/nextjs/server', () => ({
  currentUser: () => mockCurrentUser(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.ABARVA_ENABLE_TENANT_SWITCHER;
});

async function callCanSwitch(): Promise<boolean> {
  const mod = await import('../tenant-switch-authority');
  return mod.canSwitchActiveTenant();
}

describe('canSwitchActiveTenant', () => {
  it('returns false by default even for founder/admin candidates', async () => {
    mockCurrentUser.mockResolvedValue({
      publicMetadata: { role: 'admin' },
      primaryEmailAddress: {
        emailAddress: 'anand.sundaram@thesundaram.com',
      },
      emailAddresses: [],
    });
    await expect(callCanSwitch()).resolves.toBe(false);
  });

  it('returns false when there is no Clerk user', async () => {
    process.env.ABARVA_ENABLE_TENANT_SWITCHER = '1';
    mockCurrentUser.mockResolvedValue(null);
    await expect(callCanSwitch()).resolves.toBe(false);
  });

  it('returns true for publicMetadata.role === admin', async () => {
    process.env.ABARVA_ENABLE_TENANT_SWITCHER = '1';
    mockCurrentUser.mockResolvedValue({
      publicMetadata: { role: 'admin' },
      primaryEmailAddress: { emailAddress: 'random@example.com' },
      emailAddresses: [],
    });
    await expect(callCanSwitch()).resolves.toBe(true);
  });

  it('returns true for the founder via primary email (exact case)', async () => {
    process.env.ABARVA_ENABLE_TENANT_SWITCHER = '1';
    mockCurrentUser.mockResolvedValue({
      publicMetadata: {},
      primaryEmailAddress: {
        emailAddress: 'anand.sundaram@thesundaram.com',
      },
      emailAddresses: [],
    });
    await expect(callCanSwitch()).resolves.toBe(true);
  });

  it('returns true for the founder via primary email (mixed case)', async () => {
    process.env.ABARVA_ENABLE_TENANT_SWITCHER = '1';
    // Clerk does NOT normalize email case on the session object.
    mockCurrentUser.mockResolvedValue({
      publicMetadata: {},
      primaryEmailAddress: {
        emailAddress: 'Anand.Sundaram@TheSundaram.com',
      },
      emailAddresses: [],
    });
    await expect(callCanSwitch()).resolves.toBe(true);
  });

  it('returns true when the founder address is a verified secondary email', async () => {
    process.env.ABARVA_ENABLE_TENANT_SWITCHER = '1';
    mockCurrentUser.mockResolvedValue({
      publicMetadata: {},
      primaryEmailAddress: { emailAddress: 'corp@example.com' },
      emailAddresses: [
        {
          emailAddress: 'corp@example.com',
          verification: { status: 'verified' },
        },
        {
          emailAddress: 'Anand.Sundaram@thesundaram.com',
          verification: { status: 'verified' },
        },
      ],
    });
    await expect(callCanSwitch()).resolves.toBe(true);
  });

  it('returns false when the founder address is an UNVERIFIED secondary', async () => {
    process.env.ABARVA_ENABLE_TENANT_SWITCHER = '1';
    // Critical: unverified secondaries are attacker-controlled and
    // must never gate authority.
    mockCurrentUser.mockResolvedValue({
      publicMetadata: {},
      primaryEmailAddress: { emailAddress: 'attacker@example.com' },
      emailAddresses: [
        {
          emailAddress: 'attacker@example.com',
          verification: { status: 'verified' },
        },
        {
          emailAddress: 'anand.sundaram@thesundaram.com',
          verification: { status: 'unverified' },
        },
      ],
    });
    await expect(callCanSwitch()).resolves.toBe(false);
  });

  it('returns false for a non-founder, non-admin user', async () => {
    process.env.ABARVA_ENABLE_TENANT_SWITCHER = '1';
    mockCurrentUser.mockResolvedValue({
      publicMetadata: { role: 'editor' },
      primaryEmailAddress: { emailAddress: 'cio@apex-retail.demo' },
      emailAddresses: [],
    });
    await expect(callCanSwitch()).resolves.toBe(false);
  });

  it('returns false when currentUser throws', async () => {
    process.env.ABARVA_ENABLE_TENANT_SWITCHER = '1';
    mockCurrentUser.mockRejectedValue(new Error('clerk timeout'));
    await expect(callCanSwitch()).resolves.toBe(false);
  });
});

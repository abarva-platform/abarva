import { renderToStaticMarkup } from 'react-dom/server';

const mockAuth = jest.fn();
const mockCurrentUser = jest.fn();
const mockRedirect = jest.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});

jest.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
  currentUser: mockCurrentUser,
}));

jest.mock('next/navigation', () => ({
  redirect: mockRedirect,
}));

type ClerkUserFixture = {
  publicMetadata?: Record<string, unknown>;
  unsafeMetadata?: Record<string, unknown>;
  primaryEmailAddress?: { emailAddress: string | null } | null;
};

const CLIENT_KEYS = ['apex-retail', 'meridian-health', 'skyharbor-air'];

async function renderObservabilityPage() {
  const { default: OperationalObservabilityPage } = await import(
    '@/app/(maestro)/engineering/observability/page'
  );
  return renderToStaticMarkup(await OperationalObservabilityPage());
}

function signedInAs(user: ClerkUserFixture) {
  mockAuth.mockResolvedValue({ userId: 'user_123' });
  mockCurrentUser.mockResolvedValue(user);
}

describe('/engineering/observability access control', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: null });
    mockCurrentUser.mockResolvedValue(null);
  });

  it('redirects unauthenticated users to sign in', async () => {
    await expect(renderObservabilityPage()).rejects.toThrow(
      'NEXT_REDIRECT:/sign-in?redirect=/engineering/observability',
    );

    expect(mockRedirect).toHaveBeenCalledWith(
      '/sign-in?redirect=/engineering/observability',
    );
  });

  it('blocks client personas from cross-client telemetry rows', async () => {
    signedInAs({
      publicMetadata: { role: 'client', clientId: 'apexretail' },
      unsafeMetadata: {},
      primaryEmailAddress: { emailAddress: 'cio@apex-retail.example.com' },
    });

    const html = await renderObservabilityPage();

    expect(html).toContain('Admin access only');
    expect(html).toContain('restricted to AbarVa platform administrators');
    for (const clientKey of CLIENT_KEYS) {
      expect(html).not.toContain(clientKey);
    }
    expect(html).not.toContain('Live mode');
  });

  it('blocks tenant admin roles from cross-client telemetry rows', async () => {
    signedInAs({
      publicMetadata: { role: 'admin', clientId: 'skyharbor' },
      unsafeMetadata: {},
      primaryEmailAddress: { emailAddress: 'admin@skyharbor-air.example.com' },
    });

    const html = await renderObservabilityPage();

    expect(html).toContain('Admin access only');
    for (const clientKey of CLIENT_KEYS) {
      expect(html).not.toContain(clientKey);
    }
    expect(html).not.toContain('Live mode');
  });

  it('shows telemetry rows to explicit platform admin roles', async () => {
    signedInAs({
      publicMetadata: { role: 'platform_admin' },
      unsafeMetadata: {},
      primaryEmailAddress: { emailAddress: 'operator@example.com' },
    });

    const html = await renderObservabilityPage();

    expect(html).toContain('Live mode');
    for (const clientKey of CLIENT_KEYS) {
      expect(html).toContain(clientKey);
    }
  });

  it('shows telemetry rows to allowlisted platform operator email', async () => {
    signedInAs({
      publicMetadata: { role: 'client' },
      unsafeMetadata: {},
      primaryEmailAddress: { emailAddress: 'anand.sundaram@thesundaram.com' },
    });

    const html = await renderObservabilityPage();

    expect(html).toContain('Telemetry rows');
    for (const clientKey of CLIENT_KEYS) {
      expect(html).toContain(clientKey);
    }
  });
});

import { existsSync } from "node:fs";

const mockRedirect = jest.fn((href: string) => {
  throw new Error(`NEXT_REDIRECT:${href}`);
});

jest.mock("next/navigation", () => ({
  redirect: mockRedirect,
  usePathname: () => "/source/value",
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    isLoaded: true,
    user: {
      primaryEmailAddress: {
        emailAddress: "maya.chen@skyharbor-air.example.com",
      },
      publicMetadata: { moduleAccess: ["source", "tower"] },
      firstName: "Maya",
      lastName: "Chen",
    },
  }),
  useClerk: () => ({ signOut: jest.fn() }),
}));

describe("Delta demo P0 graceful degradation", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('retires the old Tower portfolio route in favor of the AI Control Tower entry point', () => {
    expect(() => require.resolve('@/app/(maestro)/tower/portfolio/page')).toThrow();
    expect(() => require.resolve('@/app/(maestro)/tower/page')).not.toThrow();
  });

  it("renders Source value as a degraded empty ledger when ledger data cannot load", async () => {
    jest.doMock("@/lib/source/queries", () => ({
      getSourceValueLedger: jest.fn(async () => {
        throw new Error("Connection closed.");
      }),
    }));
    jest.doMock("@/lib/active-client", () => ({
      getActiveClientRow: jest.fn(async () => {
        throw new Error("Connection closed.");
      }),
    }));
    jest.doMock("@/lib/auth/tenancy", () => ({
      requireTenancy: jest.fn(async () => {
        throw new Error("Connection closed.");
      }),
    }));
    jest.doMock("@/lib/auth/source-access-policy", () => ({
      loadUserSourceAccessPolicy: jest.fn(),
    }));

    const { default: SourceValuePage } =
      await import("@/app/(maestro)/source/value/page");
    const { renderToStaticMarkup } = await import("react-dom/server");

    const html = renderToStaticMarkup(await SourceValuePage());

    expect(html).toContain("degraded empty ledger rather than inventing value");
    expect(html).toContain(
      "No value ledger rows are available for this tenant right now.",
    );
    expect(html).not.toContain("Connection closed");
  });
});

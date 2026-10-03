/**
 * Tenant scope on the Tower routes, asserted by calling the routes.
 *
 * Until T-799 this suite matched literals over the routes' source bytes, and a
 * formatter reflow of one expression turned it red without any change in
 * behaviour. Every case below instead invokes the route with its collaborators
 * mocked and observes which client key reaches the active-client resolver and
 * the Tower read, so it fails when the scoping changes and not when the
 * whitespace does.
 */

const mockAssertTenantAccess = jest.fn();
const mockGetActiveClientRow = jest.fn();
const mockReadTowerCommandCenter = jest.fn();
const mockBuildTowerCommandCenterView = jest.fn();
const mockNotFound = jest.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
const mockRedirect = jest.fn();

jest.mock("next/navigation", () => ({
  notFound: () => mockNotFound(),
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));
jest.mock("@/lib/auth/tenant-access", () => ({
  assertTenantAccess: (slug: string) => mockAssertTenantAccess(slug),
}));
jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: (key: string | null) => mockGetActiveClientRow(key),
}));
jest.mock("@/lib/tower/readTowerCommandCenter", () => ({
  readTowerCommandCenter: (input: unknown) => mockReadTowerCommandCenter(input),
}));
jest.mock("@/lib/tower/command-center/view-model", () => ({
  buildTowerCommandCenterView: (mart: unknown, options: unknown) =>
    mockBuildTowerCommandCenterView(mart, options),
}));
jest.mock("@/lib/tower/eclProjectionPreview", () => ({
  readTowerEclProjectionPreview: jest.fn(async () => null),
}));
jest.mock("@/lib/ecl/product-provider", () => ({
  isEclProductProvider: () => false,
  resolveEclProductProvider: () => null,
}));
jest.mock("@/lib/client-config", () => ({
  canonicalClientDisplayName: ({ name }: { name?: string | null }) => name ?? null,
}));
jest.mock("@/lib/tenant/aliases", () => ({
  canonicalTenantKey: (key: string | null) => key,
}));
jest.mock("@/lib/integrity/route-catalog", () => ({
  isTowerSubsurfaceSlug: (slug: string) =>
    ["vendors", "regulatory", "council", "models", "shadow-ai"].includes(slug),
}));
jest.mock("@/components/shell/AppShell", () => ({ AppShell: () => null }));
jest.mock("@/components/tower/command-center/TowerCommandCenterAvaShell", () => ({
  TowerCommandCenterAvaShell: () => null,
}));
jest.mock("@/components/ecl/EclDemoFindingsPanel", () => ({
  EclDemoFindingsPanel: () => null,
}));
jest.mock("@/components/ecl/EclServingSurfaceCoverage", () => ({
  EclServingSurfaceCoverage: () => null,
}));

import TowerPage from "@/app/(maestro)/tower/page";
import TenantTowerSeedPage from "@/app/(maestro)/tenant/[tenantSlug]/tower/page";
import TenantTowerSubsurfacePage from "@/app/(maestro)/tenant/[tenantSlug]/tower/[surface]/page";

const AUTHORIZED_KEY = "authorized-tenant";
const FOREIGN_KEY = "foreign-tenant";
const MART = { marker: "ecl-serving-view" };

type Element = { props: { topBarProps?: { tenantName?: string }; children?: unknown } };

// The Ava shell is the one child that carries the client identity into chat.
function shellProps(element: Element): { clientKey: string | null; tenantName: string } {
  const children = [element.props.children].flat() as Element[];
  const suspense = children.find((child) => child && child.props?.children);
  return (suspense?.props.children as { props: { clientKey: string | null; tenantName: string } })
    .props;
}

function everyKeyThatReachedARead(): unknown[] {
  return [
    ...mockGetActiveClientRow.mock.calls.map(([key]) => key),
    ...mockReadTowerCommandCenter.mock.calls.flatMap(
      ([input]) => (input as { tenantKeyCandidates: unknown[] }).tenantKeyCandidates,
    ),
  ];
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAssertTenantAccess.mockImplementation(async (slug: string) => ({
    clientKey: AUTHORIZED_KEY,
    tenant: { displayName: `Tenant for ${slug}` },
  }));
  mockGetActiveClientRow.mockImplementation(async (key: string | null) =>
    key ? { id: `${key}-row`, key, name: `Row for ${key}` } : null,
  );
  mockReadTowerCommandCenter.mockResolvedValue(MART);
  mockBuildTowerCommandCenterView.mockReturnValue({ view: true });
});

describe("tenant Tower route scope", () => {
  it("renders the tenant route for the tenant assertTenantAccess authorized, not the client query", async () => {
    const element = (await TenantTowerSeedPage({
      params: Promise.resolve({ tenantSlug: "slug-a" }),
      searchParams: Promise.resolve({ client: FOREIGN_KEY }),
    })) as Element;

    expect(mockAssertTenantAccess).toHaveBeenCalledWith("slug-a");
    expect(mockGetActiveClientRow).toHaveBeenCalledWith(AUTHORIZED_KEY);
    expect(mockReadTowerCommandCenter.mock.calls[0][0].tenantKeyCandidates[0]).toBe(
      AUTHORIZED_KEY,
    );
    expect(everyKeyThatReachedARead()).not.toContain(FOREIGN_KEY);
    expect(shellProps(element).clientKey).toBe(AUTHORIZED_KEY);
    expect(element.props.topBarProps?.tenantName).toBe("Tenant for slug-a");
  });

  it("reads nothing when the tenant route refuses access", async () => {
    mockAssertTenantAccess.mockRejectedValue(new Error("NEXT_FORBIDDEN"));

    await expect(
      TenantTowerSeedPage({
        params: Promise.resolve({ tenantSlug: "slug-a" }),
        searchParams: Promise.resolve({ client: FOREIGN_KEY }),
      }),
    ).rejects.toThrow("NEXT_FORBIDDEN");
    expect(mockGetActiveClientRow).not.toHaveBeenCalled();
    expect(mockReadTowerCommandCenter).not.toHaveBeenCalled();
  });

  it("scopes the subsurface route to the authorized tenant and 404s an unknown surface", async () => {
    const element = (await TenantTowerSubsurfacePage({
      params: Promise.resolve({ tenantSlug: "slug-b", surface: "vendors" }),
    })) as Element;
    expect(mockAssertTenantAccess).toHaveBeenCalledWith("slug-b");
    expect(mockGetActiveClientRow).toHaveBeenCalledWith(AUTHORIZED_KEY);
    expect(shellProps(element).clientKey).toBe(AUTHORIZED_KEY);

    jest.clearAllMocks();
    await expect(
      TenantTowerSubsurfacePage({
        params: Promise.resolve({ tenantSlug: "slug-b", surface: "not-a-surface" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockReadTowerCommandCenter).not.toHaveBeenCalled();
  });

  it("does not hop tenant traffic through a redirect", async () => {
    await TenantTowerSeedPage({
      params: Promise.resolve({ tenantSlug: "slug-a" }),
      searchParams: Promise.resolve({}),
    });
    await TenantTowerSubsurfacePage({
      params: Promise.resolve({ tenantSlug: "slug-a", surface: "value" }),
    });
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("passes the explicit client query into the active-client resolver on the generic route", async () => {
    const element = (await TowerPage({
      searchParams: Promise.resolve({ client: FOREIGN_KEY }),
    })) as Element;

    expect(mockAssertTenantAccess).not.toHaveBeenCalled();
    expect(mockGetActiveClientRow).toHaveBeenCalledWith(FOREIGN_KEY);
    expect(shellProps(element).clientKey).toBe(FOREIGN_KEY);
  });

  it("feeds the ECL serving view read into the command-center view model", async () => {
    await TowerPage({ searchParams: Promise.resolve({ client: FOREIGN_KEY }) });

    expect(mockReadTowerCommandCenter).toHaveBeenCalledTimes(1);
    expect(mockBuildTowerCommandCenterView).toHaveBeenCalledWith(
      MART,
      expect.objectContaining({ tenantName: `Row for ${FOREIGN_KEY}` }),
    );
  });
});

/**
 * Item U-404 — behavioral proof of the `/api/home/walkthrough-export` tenancy fence.
 *
 * The sibling suite `route.test.ts` mocks `@/lib/auth/tenancy` wholesale, so it can
 * only prove that the route *calls* the fence with a particular argument; with the
 * fence itself inverted it stays green. Two governed route fences were found on
 * 2026-09-24 asserting only that identifiers appear in a route file, and both
 * survived inversion (see `C-507`). So this suite mocks the identity layer *below*
 * `requireTenancy` — who is signed in, and which tenants that user may read — and
 * runs the real fence. Dropping `requestedClientKey` from the route makes the
 * foreign-alias case answer 200 and this suite fails, which is the mutation
 * recorded in the release record.
 *
 * Covers U-404 acceptance (1), (2) and (3). Acceptance (4) — the signed-in surface
 * checks — is not a behavioral test and remains owed.
 */
import type { NextRequest } from "next/server";

import type { ClientKey } from "@/lib/client-config";

/**
 * The tenants the signed-in user may read. `resolveTenant` always answers
 * `meridian` (the active tenant), so a run with `skyharbor` here and `meridian`
 * active is the multi-tenant reader that acceptance (3) is about.
 */
let readableClientKeys: ClientKey[] = ["meridian"];

const checkTenantAccessByKey = jest.fn(async (clientKey: string) =>
  (readableClientKeys as string[]).includes(clientKey)
    ? ({ ok: true, user: { clerkUserId: "clerk_user_1" } } as const)
    : ({ ok: false, reason: "forbidden" } as const),
);

const resolveClientRow = jest.fn(async (appClientKey: ClientKey) => ({
  id: `client_${appClientKey}`,
  name: appClientKey === "meridian" ? "Meridian Health" : "SkyHarbor Air",
  industry_code: null,
}));

const getActiveClientRow = jest.fn(async () => ({
  id: "client_meridian",
  key: "meridian" as ClientKey,
  name: "Meridian Health",
  industry_code: null,
}));

const getHomeEclProjectionBundleOrReviewedSnapshotWithSource = jest.fn();
const getHomeReviewBundle = jest.fn();
const renderHomeWalkthroughHtml = jest.fn();
const buildHomeWalkthroughPdf = jest.fn();
const pdf = jest.fn();

jest.mock("@/lib/auth/tenant-access", () => ({
  checkTenantAccessByKey: (...args: [string]) => checkTenantAccessByKey(...args),
}));

jest.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: jest.fn(async () => ({
    clerkUserId: "clerk_user_1",
    personId: null,
    primaryRole: "client_viewer",
    email: "viewer@example.test",
    name: "Viewer",
    tenantRoles: null,
  })),
}));

jest.mock("@/lib/auth/maestro", () => ({
  getCurrentPerson: jest.fn(async () => null),
}));

jest.mock("@/lib/auth/operator-persona-provisioning", () => ({
  ensureOperatorPersonProvisioned: jest.fn(async () => null),
}));

class TenantLookupUnavailableError extends Error {}

jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: (...args: unknown[]) => getActiveClientRow(...(args as [])),
  TenantLookupUnavailableError,
}));

const resolveTenantMock = jest.fn(async () => ({
  appClientKey: "meridian",
  displayName: "Meridian Health",
  industryCode: null as string | null,
}));

jest.mock("@/lib/tenant/resolveTenant", () => ({
  resolveClientRow: (...args: [ClientKey]) => resolveClientRow(...args),
  resolveTenant: (...args: unknown[]) => resolveTenantMock(...(args as [])),
}));

jest.mock("@/lib/home/preview/ecl-projection-bundle", () => ({
  getHomeEclProjectionBundleOrReviewedSnapshotWithSource: (...args: unknown[]) =>
    getHomeEclProjectionBundleOrReviewedSnapshotWithSource(...args),
}));

jest.mock("@/lib/home/preview/golden-snapshot", () => {
  const HOME_PREVIEW_TENANT_KEYS = ["meridian-health", "skyharbor-air"] as const;
  return {
    HOME_PREVIEW_TENANT_KEYS,
    isHomePreviewTenantKey: (key: string) =>
      (HOME_PREVIEW_TENANT_KEYS as readonly string[]).includes(key),
    getHomeReviewBundle: (...args: unknown[]) => getHomeReviewBundle(...args),
  };
});

jest.mock("@/lib/home/export/walkthrough-export", () => ({
  buildHomeWalkthroughPdf: (...args: unknown[]) => buildHomeWalkthroughPdf(...args),
  homeWalkthroughFilename: (tenantKey: string, format: string) =>
    `home-walkthrough-${tenantKey}.${format}`,
  renderHomeWalkthroughHtml: (...args: unknown[]) => renderHomeWalkthroughHtml(...args),
}));

jest.mock("@react-pdf/renderer", () => ({
  pdf: (...args: unknown[]) => pdf(...args),
}));

function request(url: string): NextRequest {
  return { url } as NextRequest;
}

/** Every side effect that produces or reads tenant content. None may run on a refusal. */
function contentSideEffects() {
  return [
    getHomeEclProjectionBundleOrReviewedSnapshotWithSource,
    getHomeReviewBundle,
    renderHomeWalkthroughHtml,
    buildHomeWalkthroughPdf,
    pdf,
  ];
}

describe("U-404 — /api/home/walkthrough-export tenancy fence (behavioral)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    readableClientKeys = ["meridian"];
    resolveTenantMock.mockResolvedValue({
      appClientKey: "meridian",
      displayName: "Meridian Health",
      industryCode: null,
    });
    getActiveClientRow.mockResolvedValue({
      id: "client_meridian",
      key: "meridian" as ClientKey,
      name: "Meridian Health",
      industry_code: null,
    });
    getHomeEclProjectionBundleOrReviewedSnapshotWithSource.mockResolvedValue({
      recordSource: {
        kind: "ecl_serving_projection",
        canonicalSnapshotHash: "ecl:test:serving.home_*:3311",
      },
      bundle: {
        provenance: { canonical_snapshot_hash: "ecl:test:serving.home_*:3311" },
      },
    });
    renderHomeWalkthroughHtml.mockReturnValue("<html>walkthrough</html>");
  });

  // (1) the foreign alias is refused, and refused BEFORE anything is rendered.
  it("refuses tenant A a walkthrough export requested under tenant B's alias", async () => {
    const { GET } = await import("../route");

    const response = await GET(
      request(
        "https://app.abarva.ai/api/home/walkthrough-export?tenant=skyharbor-air&provider=ecl&format=html",
      ),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "forbidden" });
    expect(checkTenantAccessByKey).toHaveBeenCalledWith("skyharbor");
  });

  it("refuses before any export document is produced", async () => {
    const { GET } = await import("../route");

    const response = await GET(
      request(
        "https://app.abarva.ai/api/home/walkthrough-export?tenant=skyharbor-air&provider=ecl&format=html",
      ),
    );

    expect(response.status).toBe(403);
    for (const sideEffect of contentSideEffects()) {
      expect(sideEffect).not.toHaveBeenCalled();
    }
  });

  it("refuses the pdf format before the renderer is reached", async () => {
    const { GET } = await import("../route");

    const response = await GET(
      request(
        "https://app.abarva.ai/api/home/walkthrough-export?tenant=skyharbor-air&provider=ecl&format=pdf",
      ),
    );

    expect(response.status).toBe(403);
    for (const sideEffect of contentSideEffects()) {
      expect(sideEffect).not.toHaveBeenCalled();
    }
  });

  // (2) the positive direction — a suite of negative cases alone passes an inverted fence.
  it("serves tenant A its own walkthrough under its canonical alias", async () => {
    const { GET } = await import("../route");

    const response = await GET(
      request(
        "https://app.abarva.ai/api/home/walkthrough-export?tenant=meridian-health&provider=ecl&format=html",
      ),
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("<html>walkthrough</html>");
    expect(checkTenantAccessByKey).toHaveBeenCalledWith("meridian");
    expect(
      getHomeEclProjectionBundleOrReviewedSnapshotWithSource,
    ).toHaveBeenCalledWith("meridian-health");
  });

  it("serves the other tenant its own walkthrough when that tenant is the one signed in", async () => {
    readableClientKeys = ["skyharbor"];
    const { GET } = await import("../route");

    const response = await GET(
      request(
        "https://app.abarva.ai/api/home/walkthrough-export?tenant=skyharbor-air&provider=ecl&format=html",
      ),
    );

    expect(response.status).toBe(200);
    expect(
      getHomeEclProjectionBundleOrReviewedSnapshotWithSource,
    ).toHaveBeenCalledWith("skyharbor-air");
  });

  // (3) the export names the REQUESTED Home tenant — not the app client key it was
  // mapped to for authorization, and not the active tenant it was requested from.
  // The reader here may read both tenants and is sitting in `meridian`, so a label
  // taken from the active tenant instead of the requested one is visible as a
  // different string rather than hidden behind the two agreeing.
  it("names the requested Home tenant in the export, not the active tenant it was requested from", async () => {
    readableClientKeys = ["meridian", "skyharbor"];
    const { GET } = await import("../route");

    const response = await GET(
      request(
        "https://app.abarva.ai/api/home/walkthrough-export?tenant=skyharbor-air&provider=ecl&format=html",
      ),
    );

    expect(response.status).toBe(200);
    expect(renderHomeWalkthroughHtml).toHaveBeenCalledWith(
      expect.objectContaining({ tenantLabel: "SkyHarbor Global" }),
    );
    expect(
      getHomeEclProjectionBundleOrReviewedSnapshotWithSource,
    ).toHaveBeenCalledWith("skyharbor-air");
    expect(response.headers.get("content-disposition")).toContain(
      "home-walkthrough-skyharbor-air.html",
    );
  });

  // A tenant with no Home preview bundle must not be handed another tenant's.
  // `tenantKey` falls back to `HOME_PREVIEW_TENANT_KEYS[0]` when neither the
  // requested nor the active tenant is a Home preview tenant, and that default
  // is a real, named other tenant.
  it("does not serve the default tenant's walkthrough to a tenant that has none", async () => {
    readableClientKeys = ["apexretail"];
    resolveTenantMock.mockResolvedValue({
      appClientKey: "apexretail",
      displayName: "Apex Retail",
      industryCode: null,
    });
    getActiveClientRow.mockResolvedValue({
      id: "client_apexretail",
      key: "apexretail" as ClientKey,
      name: "Apex Retail",
      industry_code: null,
    });
    const { GET } = await import("../route");

    const response = await GET(
      request(
        "https://app.abarva.ai/api/home/walkthrough-export?provider=ecl&format=html",
      ),
    );

    expect(response.status).not.toBe(200);
    expect(
      getHomeEclProjectionBundleOrReviewedSnapshotWithSource,
    ).not.toHaveBeenCalledWith("meridian-health");
    expect(renderHomeWalkthroughHtml).not.toHaveBeenCalled();
  });

  it("does not serve the default tenant's walkthrough when its own alias is asked for by name", async () => {
    readableClientKeys = ["apexretail"];
    resolveTenantMock.mockResolvedValue({
      appClientKey: "apexretail",
      displayName: "Apex Retail",
      industryCode: null,
    });
    getActiveClientRow.mockResolvedValue({
      id: "client_apexretail",
      key: "apexretail" as ClientKey,
      name: "Apex Retail",
      industry_code: null,
    });
    const { GET } = await import("../route");

    const response = await GET(
      request(
        "https://app.abarva.ai/api/home/walkthrough-export?tenant=apex-retail&provider=ecl&format=html",
      ),
    );

    expect(response.status).not.toBe(200);
    expect(
      getHomeEclProjectionBundleOrReviewedSnapshotWithSource,
    ).not.toHaveBeenCalledWith("meridian-health");
    expect(renderHomeWalkthroughHtml).not.toHaveBeenCalled();
  });

  it("names the active tenant when that is the one requested, so the case above is not vacuous", async () => {
    readableClientKeys = ["meridian", "skyharbor"];
    const { GET } = await import("../route");

    const response = await GET(
      request(
        "https://app.abarva.ai/api/home/walkthrough-export?tenant=meridian-health&provider=ecl&format=html",
      ),
    );

    expect(response.status).toBe(200);
    expect(renderHomeWalkthroughHtml).toHaveBeenCalledWith(
      expect.objectContaining({ tenantLabel: "Meridian Health" }),
    );
    expect(response.headers.get("content-disposition")).toContain(
      "home-walkthrough-meridian-health.html",
    );
  });
});

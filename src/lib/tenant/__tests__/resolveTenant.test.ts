import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { TenantResolutionError } from "@/lib/tenant/CanonicalTenant";
import {
  appClientKeyForTenant,
  brokerTenantKey,
  canonicalTenantKey,
  tenantAliasesFor,
} from "@/lib/tenant/aliases";

const currentUserMock = jest.fn();
const cookiesMock = jest.fn();
const azureReadMaybeSingleMock = jest.fn();

jest.mock("@clerk/nextjs/server", () => ({
  currentUser: () => currentUserMock(),
}));

jest.mock("next/headers", () => ({
  cookies: () => cookiesMock(),
}));

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: {
    maybeSingle: (...args: unknown[]) => azureReadMaybeSingleMock(...args),
  },
}));

function mockCookie(value: string | null): void {
  cookiesMock.mockResolvedValue({
    get: () => (value ? { value } : null),
  });
}

function mockClientRow(
  row: { id: string; name: string; industry_code: string | null } | null,
): void {
  azureReadMaybeSingleMock.mockResolvedValue(row);
}

describe("canonical tenant aliases", () => {
  it("normalizes app keys, substrate keys, and legacy names through one map", () => {
    expect(canonicalTenantKey("skyharbor")).toBe("skyharbor-air");
    expect(canonicalTenantKey("skyharbor-air")).toBe("skyharbor-air");
    expect(canonicalTenantKey("skyharbor_global")).toBe("skyharbor-air");
    expect(canonicalTenantKey("northstar")).toBe("northstar-clinical");
    expect(canonicalTenantKey("northstar-clinical")).toBe("northstar-clinical");
    expect(canonicalTenantKey("apexretail")).toBe("apex-retail");
    expect(canonicalTenantKey("meridian")).toBe("meridian-health");
    expect(appClientKeyForTenant("meridian_health_global")).toBe("meridian");
    expect(canonicalTenantKey("arcturus")).toBe("first-capital");
    expect(canonicalTenantKey("lakeshore")).toBe("lakeshore-holdings");
    expect(canonicalTenantKey("lakeshore-holdings")).toBe("lakeshore-holdings");
    expect(appClientKeyForTenant("first-capital")).toBe("arcturus");
    expect(appClientKeyForTenant("lakeshore-holdings")).toBe("lakeshore");
    expect(brokerTenantKey("meridian")).toBe("meridian");
    expect(brokerTenantKey("lakeshore")).toBe("lakeshore-holdings");
    expect(tenantAliasesFor("skyharbor")).toEqual(
      expect.arrayContaining(["skyharbor", "skyharbor-air"]),
    );
    expect(tenantAliasesFor("meridian")).toEqual(
      expect.arrayContaining(["meridian", "meridian_health_global"]),
    );
    expect(tenantAliasesFor("lakeshore")).toEqual(
      expect.arrayContaining(["lakeshore", "lakeshore-holdings"]),
    );
  });
});

describe("resolveTenant", () => {
  beforeEach(() => {
    currentUserMock.mockReset();
    cookiesMock.mockReset();
    azureReadMaybeSingleMock.mockReset();
    mockClientRow(null);
  });

  it("pins explicit SkyHarbor email personas before stale active-client cookies", async () => {
    currentUserMock.mockResolvedValue({
      publicMetadata: { role: "admin" },
      primaryEmailAddress: { emailAddress: "cto@skyharbor-air.example.com" },
      emailAddresses: [],
    });
    mockCookie("apexretail");
    mockClientRow({
      id: "client-skyharbor",
      name: "SkyHarbor Air",
      industry_code: "AIRLINE",
    });

    await expect(resolveTenant()).resolves.toMatchObject({
      appClientKey: "skyharbor",
      canonicalKey: "skyharbor-air",
      brokerKey: "skyharbor-air",
      clientId: "client-skyharbor",
      source: "email",
    });
    expect(azureReadMaybeSingleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        table: "clients",
        where: { tenant_key: "skyharbor" },
      }),
    );
  });

  it("lets an unlocked request body select the tenant when no explicit persona pin exists", async () => {
    currentUserMock.mockResolvedValue({
      publicMetadata: { role: "admin" },
      primaryEmailAddress: { emailAddress: "ops@example.com" },
      emailAddresses: [],
    });
    mockCookie("meridian");

    await expect(
      resolveTenant({ requestedClient: "northstar" }),
    ).resolves.toMatchObject({
      appClientKey: "northstar",
      canonicalKey: "northstar-clinical",
      source: "body",
    });
  });

  it("resolves from the active-client cookie when request and session do not name a tenant", async () => {
    currentUserMock.mockResolvedValue({
      publicMetadata: {},
      primaryEmailAddress: { emailAddress: "ops@example.com" },
      emailAddresses: [],
    });
    mockCookie("skyharbor-air");

    await expect(resolveTenant()).resolves.toMatchObject({
      appClientKey: "skyharbor",
      canonicalKey: "skyharbor-air",
      source: "cookie",
    });
  });

  it("resolves from surface client context when the body omits client", async () => {
    currentUserMock.mockResolvedValue(null);
    mockCookie(null);

    await expect(
      resolveTenant({ surfaceClientKey: "northstar" }),
    ).resolves.toMatchObject({
      appClientKey: "northstar",
      canonicalKey: "northstar-clinical",
      source: "body",
    });
  });

  it("does not let locked client roles switch tenants through requested client ids", async () => {
    currentUserMock.mockResolvedValue({
      publicMetadata: { role: "client", clientId: "meridian" },
      primaryEmailAddress: { emailAddress: "external.cdao@example.com" },
      emailAddresses: [],
    });
    mockCookie("apexretail");

    await expect(
      resolveTenant({ requestedClient: "skyharbor" }),
    ).resolves.toMatchObject({
      appClientKey: "meridian",
      canonicalKey: "meridian-health",
      source: "session",
    });
  });

  it("falls back gracefully to the requested tenant when Clerk is unavailable", async () => {
    currentUserMock.mockRejectedValue(new Error("Clerk unavailable"));
    mockCookie(null);

    await expect(
      resolveTenant({ requestedClient: "meridian" }),
    ).resolves.toMatchObject({
      appClientKey: "meridian",
      canonicalKey: "meridian-health",
      source: "body",
    });
  });

  it("looks up Meridian private global tenant rows as aliases of the app client", async () => {
    currentUserMock.mockResolvedValue({
      publicMetadata: { role: "client", clientId: "meridian" },
      primaryEmailAddress: { emailAddress: "admin@abarva.ai" },
      emailAddresses: [],
    });
    mockCookie(null);
    azureReadMaybeSingleMock.mockImplementation(async (query) => {
      if (query?.where?.tenant_key === "meridian_health_global") {
        return {
          id: "client-meridian-global",
          name: "Meridian Health",
          industry_code: "HEALTHCARE_IDN",
        };
      }
      return null;
    });

    await expect(resolveTenant()).resolves.toMatchObject({
      appClientKey: "meridian",
      canonicalKey: "meridian-health",
      clientId: "client-meridian-global",
      source: "email",
    });
  });

  it("throws instead of falling back when strict resolution is requested", async () => {
    currentUserMock.mockResolvedValue(null);
    mockCookie(null);

    await expect(resolveTenant({ allowFallback: false })).rejects.toMatchObject(
      {
        name: "TenantResolutionError",
        code: "missing_tenant",
      } satisfies Partial<TenantResolutionError>,
    );
  });

  it("throws a distinct unknown-tenant error for strict unknown request aliases", async () => {
    currentUserMock.mockResolvedValue(null);
    mockCookie(null);

    await expect(
      resolveTenant({ requestedClient: "unknown-air", allowFallback: false }),
    ).rejects.toMatchObject({
      name: "TenantResolutionError",
      code: "unknown_tenant",
    } satisfies Partial<TenantResolutionError>);
  });
});

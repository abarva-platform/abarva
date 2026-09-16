jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(),
  TenantLookupUnavailableError: class TenantLookupUnavailableError extends Error {},
}));
jest.mock("@/lib/auth/current-user", () => ({ getCurrentUser: jest.fn() }));
jest.mock("@/lib/auth/maestro", () => ({ getCurrentPerson: jest.fn() }));
jest.mock("@/lib/auth/operator-persona-provisioning", () => ({
  ensureOperatorPersonProvisioned: jest.fn(),
}));
jest.mock("@/lib/auth/tenant-access", () => ({ checkTenantAccessByKey: jest.fn() }));
jest.mock("@/lib/tenant/resolveTenant", () => ({
  resolveClientRow: jest.fn(),
  resolveTenant: jest.fn(),
}));

import { getActiveClientRow } from "@/lib/active-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCurrentPerson } from "@/lib/auth/maestro";
import { checkTenantAccessByKey } from "@/lib/auth/tenant-access";
import { resolveClientRow } from "@/lib/tenant/resolveTenant";
import { requireTenancy } from "../tenancy";

const user = {
  personId: "00000000-0000-4000-8000-000000000011",
  clerkUserId: "user_123",
  email: "signed-in@example.test",
  primaryRole: "client_viewer",
  tenantRoles: { meridian: "client" },
};

beforeEach(() => {
  jest.resetAllMocks();
  (getCurrentUser as jest.Mock).mockResolvedValue(user);
  (getCurrentPerson as jest.Mock).mockResolvedValue(null);
  (checkTenantAccessByKey as jest.Mock).mockResolvedValue({ ok: true, user });
  (resolveClientRow as jest.Mock).mockResolvedValue({
    id: "00000000-0000-4000-8000-000000000022",
    name: "Test tenant",
    industry_code: null,
  });
});

describe("requireTenancy with an explicit client", () => {
  it("uses the authorized client row and real actor without session-default lookup", async () => {
    const tenancy = await requireTenancy({ requestedClientKey: "meridian" });
    expect(tenancy.clientKey).toBe("meridian");
    expect(tenancy.clientId).toBe("00000000-0000-4000-8000-000000000022");
    expect(tenancy.userId).toBe(user.personId);
    expect(checkTenantAccessByKey).toHaveBeenCalledWith("meridian");
    expect(getActiveClientRow).not.toHaveBeenCalled();
  });

  it("rejects a cross-tenant request before any client-row read", async () => {
    (checkTenantAccessByKey as jest.Mock).mockResolvedValue({
      ok: false,
      reason: "forbidden",
    });
    await expect(requireTenancy({ requestedClientKey: "skyharbor" })).rejects.toMatchObject({
      code: "forbidden",
    });
    expect(resolveClientRow).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated explicit request", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);
    await expect(requireTenancy({ requestedClientKey: "meridian" })).rejects.toMatchObject({
      code: "unauthenticated",
    });
    expect(resolveClientRow).not.toHaveBeenCalled();
  });

  it("reports a failed client lookup as retryable, not as a different tenant", async () => {
    (resolveClientRow as jest.Mock).mockRejectedValue(new Error("database unavailable"));
    await expect(requireTenancy({ requestedClientKey: "meridian" })).rejects.toMatchObject({
      code: "tenant_lookup_unavailable",
    });
    expect(getActiveClientRow).not.toHaveBeenCalled();
  });
});

const mockRequireTenancy = jest.fn();

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: () => mockRequireTenancy(),
  TenancyError: class TenancyError extends Error {
    constructor(public readonly code: "unauthenticated" | "no_client") {
      super(code);
    }
  },
}));

describe("getStrategicMovesTenancy", () => {
  beforeEach(() => {
    jest.resetModules();
    mockRequireTenancy.mockReset();
  });

  it("uses the shared tenancy resolver so server pages keep the same tenant-admin signal as APIs", async () => {
    mockRequireTenancy.mockResolvedValue({
      clientId: "client-skyharbor",
      clientKey: "skyharbor",
      userId: "person-anand",
      clerkUserId: "user_skyharbor_cto",
      tenantRole: "tenant_admin",
      role: "client",
      email: "cto@skyharbor-air.example.com",
    });

    const { getStrategicMovesTenancy } =
      await import("../strategic-moves-context");

    await expect(getStrategicMovesTenancy()).resolves.toMatchObject({
      clientId: "client-skyharbor",
      clientKey: "skyharbor",
      userId: "person-anand",
      tenantRole: "tenant_admin",
      role: "client",
      email: "cto@skyharbor-air.example.com",
    });
  });

  it("keeps the previous null contract for unauthenticated or no-client sessions", async () => {
    const { TenancyError } = await import("@/lib/auth/tenancy");
    mockRequireTenancy.mockRejectedValue(new TenancyError("unauthenticated"));

    const { getStrategicMovesTenancy } =
      await import("../strategic-moves-context");

    await expect(getStrategicMovesTenancy()).resolves.toBeNull();
  });

  it("does not hide unexpected tenancy failures", async () => {
    mockRequireTenancy.mockRejectedValue(new Error("database unavailable"));

    const { getStrategicMovesTenancy } =
      await import("../strategic-moves-context");

    await expect(getStrategicMovesTenancy()).rejects.toThrow(
      "database unavailable",
    );
  });
});

export {};

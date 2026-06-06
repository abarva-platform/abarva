const mockGetActiveClientRow = jest.fn();
const mockGetCurrentUser = jest.fn();

jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: () => mockGetActiveClientRow(),
}));

jest.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}));

describe("getStrategicMovesTenancy", () => {
  beforeEach(() => {
    jest.resetModules();
    mockGetActiveClientRow.mockReset();
    mockGetCurrentUser.mockReset();
  });

  it("carries the active client key so Clerk persona policies can resolve same-tenant access", async () => {
    mockGetActiveClientRow.mockResolvedValue({
      id: "client-skyharbor",
      key: "skyharbor",
      name: "SkyHarbor Air",
      industry_code: "airline",
    });
    mockGetCurrentUser.mockResolvedValue({
      personId: null,
      clerkUserId: "user_skyharbor_cto",
      email: "cto@skyharbor-air.example.com",
      primaryRole: "client_viewer",
    });

    const { getStrategicMovesTenancy } =
      await import("../strategic-moves-context");

    await expect(getStrategicMovesTenancy()).resolves.toMatchObject({
      clientId: "client-skyharbor",
      clientKey: "skyharbor",
      userId: "clerk:user_skyharbor_cto",
      email: "cto@skyharbor-air.example.com",
    });
  });
});

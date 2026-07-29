const getActiveClientKeyMock = jest.fn();

jest.mock("@/lib/active-client", () => ({
  getActiveClientKey: () => getActiveClientKeyMock(),
}));

describe("assertBoardGradeTenancy", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("blocks governed foundation tenants from board-grade reference fallbacks", async () => {
    getActiveClientKeyMock.mockResolvedValue("airline-demo-new");

    const { assertBoardGradeTenancy } = await import(
      "../board-grade-route-guard"
    );

    const response = await assertBoardGradeTenancy("test route");

    expect(response?.status).toBe(403);
    await expect(response?.json()).resolves.toMatchObject({
      error: "governed_foundation_tenant",
    });
  });

  it("keeps legacy cross-tenant denial for non-foundation tenants", async () => {
    getActiveClientKeyMock.mockResolvedValue("meridian-health");

    const { assertBoardGradeTenancy } = await import(
      "../board-grade-route-guard"
    );

    const response = await assertBoardGradeTenancy("test route");

    expect(response?.status).toBe(403);
    await expect(response?.json()).resolves.toMatchObject({
      error: "forbidden",
    });
  });

  it("allows the reference artifact owner tenant", async () => {
    getActiveClientKeyMock.mockResolvedValue("apexretail");

    const { assertBoardGradeTenancy } = await import(
      "../board-grade-route-guard"
    );

    await expect(assertBoardGradeTenancy("test route")).resolves.toBeNull();
  });
});

export {};

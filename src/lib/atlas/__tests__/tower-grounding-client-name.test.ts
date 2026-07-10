jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(async () => ({
        data: {
          id: "client-skyharbor",
          name: "Airline Demo",
          tenant_key: "skyharbor-air",
          slug: "skyharbor-air",
          industry_code: "AIRLINE",
          industry: "airline",
        },
      })),
    })),
  })),
}));

jest.mock("@/lib/admin/ai-initiatives/queries", () => ({
  listInitiativesForClient: jest.fn(async () => []),
  listVendorsForClient: jest.fn(async () => []),
}));

jest.mock("@/lib/tower/tower-materialized-read-model", () => ({
  listMaterializedTowerReadModelForClient: jest.fn(async () => ({
    source: "empty",
    initiatives: [],
    vendors: [],
  })),
}));

jest.mock("@/lib/tower/tower-budget-rollups", () => ({
  listTowerBudgetRollupsForClient: jest.fn(async () => []),
  shapeTowerBudgetRollupsFromInitiatives: jest.fn(() => []),
}));

const mockLoadV7TowerProjection = jest.fn(async (_arg: unknown) => ({
  tenantKey: null,
  source: "empty",
  initiatives: [],
  vendors: [],
  metricPackets: [],
}));

jest.mock("@/lib/tower/v7-tower-projection", () => ({
  loadV7TowerProjection: (arg: unknown) => mockLoadV7TowerProjection(arg),
}));

import { buildAtlasTowerCurrentState } from "@/lib/atlas/tower-grounding";

describe("buildAtlasTowerCurrentState client labels", () => {
  beforeEach(() => {
    mockLoadV7TowerProjection.mockClear();
  });

  it("canonicalizes legacy demo client labels before Tower prompts use them", async () => {
    const state = await buildAtlasTowerCurrentState({
      clientId: "client-skyharbor",
      clientKey: "skyharbor",
    });

    expect(state.client.clientName).toBe("Airline Demo");
    expect(state.client.clientName).not.toBe("SkyHarbor Air");
  });

  it("passes active-client tenant candidates into the V7 Tower projection", async () => {
    await buildAtlasTowerCurrentState({
      clientId: "client-lakeshore",
      clientKey: "industrial-demo",
      clientName: "Lakeshore Holdings",
      tenantKeyCandidates: [
        "industrial-demo",
        "Lakeshore Holdings",
        "client-lakeshore",
      ],
    });

    expect(mockLoadV7TowerProjection).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantKeyCandidates: expect.arrayContaining([
          "industrial-demo",
          "Lakeshore Holdings",
          "client-lakeshore",
        ]),
      }),
    );
  });
});

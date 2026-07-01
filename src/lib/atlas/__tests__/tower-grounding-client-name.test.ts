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

import { buildAtlasTowerCurrentState } from "@/lib/atlas/tower-grounding";

describe("buildAtlasTowerCurrentState client labels", () => {
  it("canonicalizes legacy demo client labels before Tower prompts use them", async () => {
    const state = await buildAtlasTowerCurrentState({
      clientId: "client-skyharbor",
      clientKey: "skyharbor",
    });

    expect(state.client.clientName).toBe("SkyHarbor Air");
    expect(state.client.clientName).not.toBe("Airline Demo");
  });
});

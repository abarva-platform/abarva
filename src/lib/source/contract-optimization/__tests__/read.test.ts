import { azureRead } from "@/lib/data-plane/azureRead";
import { getContractOptimizationProfile } from "../read";
import type { ContractOptimizationMveProfile } from "../types";

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: { query: jest.fn() },
}));

const mockedQuery = azureRead.query as jest.Mock;

function fullProfile(
  overrides: Partial<ContractOptimizationMveProfile> = {},
): ContractOptimizationMveProfile {
  return {
    tenantKey: "skyharbor",
    sourceEventId: "evt-1",
    contractName: "Airline Demo Application Managed Services Agreement",
    incumbentVendorName: "Vendor A",
    syntheticDemo: true,
    decisionUse: "renewal",
    readyForOptimization: "ready",
    readyReason: "sufficient evidence",
    extractionBoundary: "existing contract only",
    contractBaseline: {
      currentAnnualRunRateUsd: 38_400_000,
      termStart: "2023-01-01",
      termEnd: "2027-12-31",
      renewalNoticeDate: "2026-09-30",
      evidenceCount: 9,
    },
    findings: [],
    levers: [],
    recommendedPath: {
      immediateAction: "a",
      primaryPath: "b",
      fallbackPath: "c",
      doNotDo: "d",
    },
    clientToComplete: [],
    minimumViableExtractionAreas: [],
    visualInsights: {
      exposureByDriver: [],
      invoiceVarianceTrend: [],
      operationalPressure: { level: "moderate" },
    },
    ...overrides,
  } as unknown as ContractOptimizationMveProfile;
}

describe("getContractOptimizationProfile", () => {
  beforeEach(() => {
    mockedQuery.mockReset();
  });

  it("returns the profile when the persisted payload has every field the panel reads", async () => {
    mockedQuery.mockResolvedValue([{ profile_payload: fullProfile() }]);
    const result = await getContractOptimizationProfile("skyharbor", "evt-1");
    expect(result).not.toBeNull();
    expect(result?.sourceEventId).toBe("evt-1");
  });

  it("returns null instead of a stale snapshot missing visualInsights (the exact regression that crashed the live event page)", async () => {
    const stale = fullProfile();
    delete (stale as unknown as Record<string, unknown>).visualInsights;
    mockedQuery.mockResolvedValue([{ profile_payload: stale }]);
    const result = await getContractOptimizationProfile("skyharbor", "evt-1");
    expect(result).toBeNull();
  });

  it("returns null when visualInsights is present but missing a required sub-field", async () => {
    const stale = fullProfile({
      visualInsights: {
        exposureByDriver: [],
        invoiceVarianceTrend: [],
      } as unknown as ContractOptimizationMveProfile["visualInsights"],
    });
    mockedQuery.mockResolvedValue([{ profile_payload: stale }]);
    const result = await getContractOptimizationProfile("skyharbor", "evt-1");
    expect(result).toBeNull();
  });

  it("returns null when no row exists", async () => {
    mockedQuery.mockResolvedValue([]);
    const result = await getContractOptimizationProfile("skyharbor", "evt-1");
    expect(result).toBeNull();
  });

  it("queries with canonical tenant aliases for any tenant", async () => {
    mockedQuery.mockResolvedValue([]);
    await getContractOptimizationProfile("skyharbor-air", "evt-1");
    const [, params] = mockedQuery.mock.calls[0];
    expect(params[0]).toEqual(
      expect.arrayContaining([
        "skyharbor-air",
        "skyharbor",
        "skyharbor_global",
      ]),
    );

    mockedQuery.mockReset();
    mockedQuery.mockResolvedValue([]);
    await getContractOptimizationProfile("tenant-b", "evt-2");
    const [, tenantBParams] = mockedQuery.mock.calls[0];
    expect(tenantBParams[0]).toEqual(["tenant-b"]);
  });
});

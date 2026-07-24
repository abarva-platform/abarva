import { describe, expect, it, beforeEach } from "@jest/globals";

const mockGetCurrentRateCard = jest.fn();
const mockBuildRateCardCoverageReport = jest.fn();
const mockGetCurrentClientProfile = jest.fn();
const mockGetCurrentModelVersion = jest.fn();
const mockLoadRateCardReferenceSnapshot = jest.fn();

jest.mock("../../rate-card-repository", () => ({
  getCurrentRateCard: (...args: unknown[]) => mockGetCurrentRateCard(...args),
}));
jest.mock("../coverage-report", () => ({
  buildRateCardCoverageReport: (...args: unknown[]) => mockBuildRateCardCoverageReport(...args),
}));
jest.mock("../client-profile-repository", () => ({
  getCurrentClientProfile: (...args: unknown[]) => mockGetCurrentClientProfile(...args),
}));
jest.mock("../reference-lookup", () => ({
  getCurrentModelVersion: (...args: unknown[]) => mockGetCurrentModelVersion(...args),
  loadRateCardReferenceSnapshot: (...args: unknown[]) => mockLoadRateCardReferenceSnapshot(...args),
}));

// Imported AFTER the mocks so the module under test picks up the mocked deps.
import { buildGovernedPricingProjection } from "../governed-projection";

describe("buildGovernedPricingProjection — safe summary only", () => {
  beforeEach(() => {
    mockGetCurrentRateCard.mockReset();
    mockBuildRateCardCoverageReport.mockReset();
    mockGetCurrentClientProfile.mockReset();
    mockGetCurrentModelVersion.mockReset();
    mockLoadRateCardReferenceSnapshot.mockReset();
  });

  it("returns only the documented safe summary fields — no raw rate-card lines anywhere in the shape", async () => {
    mockGetCurrentRateCard.mockResolvedValue({
      card_code: "ENTERPRISE",
      version: 3,
      status: "approved",
      effective_from: "2026-08-01",
      effective_to: null,
    });
    mockBuildRateCardCoverageReport.mockResolvedValue({
      tenantKey: "apex-retail",
      taxonomyVersion: 1,
      totalRoles: 326,
      direct: { count: 10, roles: [] },
      inherited: { count: 316, roles: [] },
      missing: { count: 0, roles: [] },
      coveragePct: 100,
    });
    mockGetCurrentClientProfile.mockResolvedValue({ profile_version: 2, status: "approved" });
    mockGetCurrentModelVersion.mockResolvedValue({ version: 1 });
    mockLoadRateCardReferenceSnapshot.mockResolvedValue({
      taxonomyVersion: 1,
      roleCodes: new Set(),
      rateBandCodes: new Set(),
      levelCodes: new Set(),
    });

    const projection = await buildGovernedPricingProjection("apex-retail");

    expect(projection).toMatchObject({
      tenantKey: "apex-retail",
      rateCard: {
        cardCode: "ENTERPRISE",
        version: 3,
        status: "approved",
        effectiveFrom: "2026-08-01",
        effectiveTo: null,
      },
      coveragePct: 100,
      unresolvedGapCount: 0,
      clientProfile: { version: 2, status: "approved" },
      modelVersion: 1,
      taxonomyVersion: 1,
    });
    expect(typeof projection.generatedAt).toBe("string");

    // Explicitly assert no raw-line-shaped keys ever appear on the projection.
    const serialized = JSON.stringify(projection);
    expect(serialized).not.toMatch(/role_or_band_ref/);
    expect(serialized).not.toMatch(/rate_value/);
    expect(serialized).not.toMatch(/card_version_id/);
  });

  it("reports a null rateCard/clientProfile when the tenant has not been onboarded yet", async () => {
    mockGetCurrentRateCard.mockResolvedValue(null);
    mockBuildRateCardCoverageReport.mockResolvedValue({
      tenantKey: "new-tenant",
      taxonomyVersion: 1,
      totalRoles: 326,
      direct: { count: 0, roles: [] },
      inherited: { count: 326, roles: [] },
      missing: { count: 0, roles: [] },
      coveragePct: 100,
    });
    mockGetCurrentClientProfile.mockResolvedValue(null);
    mockGetCurrentModelVersion.mockResolvedValue(null);
    mockLoadRateCardReferenceSnapshot.mockResolvedValue({
      taxonomyVersion: 1,
      roleCodes: new Set(),
      rateBandCodes: new Set(),
      levelCodes: new Set(),
    });

    const projection = await buildGovernedPricingProjection("new-tenant");
    expect(projection.rateCard).toBeNull();
    expect(projection.clientProfile).toBeNull();
    expect(projection.modelVersion).toBeNull();
  });
});

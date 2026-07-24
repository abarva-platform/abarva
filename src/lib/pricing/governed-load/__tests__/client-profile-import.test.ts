import { describe, expect, it, beforeEach } from "@jest/globals";
import { computeClientProfileDiff } from "../client-profile-import";

const mockGetCurrentClientProfile = jest.fn();
const mockListClientProfileValues = jest.fn();
const mockCreateClientProfileVersion = jest.fn();

jest.mock("../client-profile-repository", () => ({
  getCurrentClientProfile: (...args: unknown[]) => mockGetCurrentClientProfile(...args),
  listClientProfileValues: (...args: unknown[]) => mockListClientProfileValues(...args),
  createClientProfileVersion: (...args: unknown[]) => mockCreateClientProfileVersion(...args),
}));

import {
  commitClientPricingProfileImport,
  previewClientPricingProfileImport,
} from "../client-profile-import";

describe("computeClientProfileDiff — pure", () => {
  it("classifies added/changed/unchanged/removed correctly", () => {
    const current = [
      { assumption_key: "offshore_ratio_default", assumption_value: 0.35 },
      { assumption_key: "discount_tier", assumption_value: "gold" },
    ];
    const incoming = [
      { assumptionKey: "offshore_ratio_default", assumptionValue: 0.5 }, // changed
      { assumptionKey: "annual_billable_hours", assumptionValue: 2080 }, // added
      // discount_tier omitted -> removed
    ];
    const diff = computeClientProfileDiff(current, incoming);
    expect(diff.added).toEqual([{ assumptionKey: "annual_billable_hours", assumptionValue: 2080 }]);
    expect(diff.changed).toEqual([
      {
        before: { assumptionKey: "offshore_ratio_default", assumptionValue: 0.35 },
        after: { assumptionKey: "offshore_ratio_default", assumptionValue: 0.5 },
      },
    ]);
    expect(diff.removed).toEqual([{ assumptionKey: "discount_tier", assumptionValue: "gold" }]);
    expect(diff.unchanged).toEqual([]);
  });
});

describe("previewClientPricingProfileImport", () => {
  beforeEach(() => {
    mockGetCurrentClientProfile.mockReset();
    mockListClientProfileValues.mockReset();
  });

  it("reports parse and duplicate-assumption-key errors without writing anything", async () => {
    mockGetCurrentClientProfile.mockResolvedValue(null);

    const csv = [
      "assumption_key,assumption_value,unit_hint,notes",
      "offshore_ratio_default,0.35,,",
      "offshore_ratio_default,0.5,,", // duplicate within upload
    ].join("\n");

    const preview = await previewClientPricingProfileImport({ tenantKey: "apex-retail", csvText: csv });
    expect(preview.validRowCount).toBe(1);
    expect(preview.validationErrors).toEqual([
      expect.objectContaining({ rowNumber: 2, code: "duplicate_row" }),
    ]);
    expect(preview.diff.added).toHaveLength(1);
    expect(mockListClientProfileValues).not.toHaveBeenCalled();
  });
});

describe("commitClientPricingProfileImport", () => {
  it("forwards approvedBy/status through to createClientProfileVersion", async () => {
    mockCreateClientProfileVersion.mockResolvedValue({ action: "new_version", version: 1, previousVersion: null });
    await commitClientPricingProfileImport({
      tenantKey: "apex-retail",
      values: [{ assumptionKey: "offshore_ratio_default", assumptionValue: 0.35 }],
      approvedBy: "user-1",
      approvalRationale: "Client MSA rate confirmed",
    });
    expect(mockCreateClientProfileVersion).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantKey: "apex-retail",
        status: "approved",
        approvedBy: "user-1",
        approvalRationale: "Client MSA rate confirmed",
      }),
      undefined,
    );
  });
});

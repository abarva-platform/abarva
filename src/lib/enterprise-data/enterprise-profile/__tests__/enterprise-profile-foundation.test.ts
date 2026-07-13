import path from "node:path";

import { buildEnterpriseProfileFoundationReport } from "../enterprise-profile-foundation";

const repoRoot = path.resolve(__dirname, "../../../../..");

describe("enterprise profile foundation", () => {
  it("builds active-tenant canonical profile records without processing Northstar as active", async () => {
    const report = await buildEnterpriseProfileFoundationReport({
      repoRoot,
      generatedAt: "2026-07-13T00:00:00.000Z",
    });

    expect(report.summary.tenantsExpected).toBe(5);
    expect(report.summary.tenantsWithSource).toBe(5);
    expect(report.summary.northstarExcluded).toBe(true);
    expect(report.summary.requiredGapCount).toBe(0);
    expect(report.summary.placeholderRejectionCount).toBe(0);
    expect(report.homeAvaReadiness.every((row) => row.ready)).toBe(true);
    expect(
      report.canonicalRecords.some(
        (record) => record.objectType === "tenant_profile",
      ),
    ).toBe(true);
    expect(
      report.canonicalRecords.some(
        (record) => record.objectType === "business_model_component",
      ),
    ).toBe(true);
    expect(
      report.canonicalRecords.some(
        (record) => record.objectType === "leadership_role",
      ),
    ).toBe(true);
    expect(
      report.canonicalRecords.some(
        (record) => record.objectType === "profile_gap",
      ),
    ).toBe(true);
    expect(
      report.canonicalRecords.some(
        (record) => record.tenantKey === "northstar-clinical",
      ),
    ).toBe(false);
  });

  it("keeps source lineage on every canonical profile record", async () => {
    const report = await buildEnterpriseProfileFoundationReport({
      repoRoot,
      generatedAt: "2026-07-13T00:00:00.000Z",
    });

    for (const record of report.canonicalRecords) {
      expect(record.evidenceReferences.length).toBeGreaterThan(0);
      expect(record.lineage[0]?.mappingProfile).toBe(
        "enterprise-profile-foundation/v1",
      );
      expect(record.lineage[0]?.notes).toContain(
        "No active tenant access update",
      );
    }
  });
});

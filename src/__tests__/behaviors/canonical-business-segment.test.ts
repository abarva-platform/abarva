import fs from "node:fs";
import path from "node:path";

import { buildCanonicalTenantDataReport } from "../../lib/enterprise-data/canonical-build/canonical-tenant-data-build";

const repoRoot = path.resolve(__dirname, "../../..");
const registry = JSON.parse(
  fs.readFileSync(
    path.join(repoRoot, "datasets/tenant-inputs/tenant-input-registry.json"),
    "utf8",
  ),
) as {
  activeTenants: Array<{ tenantKey: string; canonicalInputRoot: string }>;
};
const tenant = registry.activeTenants.find((candidate) =>
  fs.existsSync(
    path.join(repoRoot, candidate.canonicalInputRoot, "01b_business_segments.csv"),
  ),
);

describe("declared business segments in the canonical build", () => {
  it("keeps stable segment identity and resolves function membership", async () => {
    expect(tenant).toBeDefined();
    const tenantKey = tenant!.tenantKey;
    const report = await buildCanonicalTenantDataReport({
      repoRoot,
      tenantKeys: [tenantKey],
      generatedAt: "2026-09-30T00:00:00.000Z",
    });
    const segments = report.canonicalRecords.filter(
      (record) => record.objectType === "business_segment",
    );
    const functions = report.canonicalRecords.filter(
      (record) => record.objectType === "business_function",
    );

    expect(segments.length).toBeGreaterThan(0);
    expect(
      segments.every(
        (record) =>
          record.canonicalObjectKey ===
          `${tenantKey}:business_segment:${record.attributes.segmentKey?.value}`,
      ),
    ).toBe(true);
    expect(
      segments.every((record) =>
        Boolean(record.attributes.segmentName?.value && record.evidenceReferences.length),
      ),
    ).toBe(true);
    expect(
      functions.some((record) =>
        record.relationships.some(
          (relationship) =>
            relationship.relationshipType === "belongs_to_segment" &&
            segments.some(
              (segment) =>
                segment.canonicalObjectKey === relationship.targetObjectKey,
            ),
        ),
      ),
    ).toBe(true);
    expect(
      report.sourceIntegrationCoverage.some(
        (source) =>
          source.sourcePath.endsWith("01b_business_segments.csv") &&
          source.disposition === "blocked_unmapped_source_file",
      ),
    ).toBe(false);
  });
});

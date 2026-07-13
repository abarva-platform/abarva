import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  buildAdminDataQualityControlModel,
  writeAdminDataQualityProofArtifacts,
} from "@/lib/admin/admin-data-quality-control";

describe("admin data quality control model", () => {
  it("builds an all-tenant quality matrix from read-only audit artifacts", async () => {
    const model = await buildAdminDataQualityControlModel(process.cwd());

    expect(model.reportVersion).toBe("admin-data-quality-control/v1");
    expect(model.tenantDetails.length).toBeGreaterThanOrEqual(5);
    expect(model.guardrails).toEqual({
      productionTenantDataWritten: false,
      activeTenantAccessLayerUpdated: false,
      candidatePromoted: false,
      writesPhysicalTables: false,
      moduleRuntimeConsumptionChanged: false,
      moduleReadsCandidateByDefault: false,
      realizedValueClaimed: false,
    });
    expect(model.p0).toEqual([]);
    expect(model.p1).toEqual([]);
  });

  it("surfaces SkyHarbor as source-rich, candidate-thin, relationship-gap, and promotion-unsafe", async () => {
    const model = await buildAdminDataQualityControlModel(process.cwd());
    const skyHarbor = model.tenantDetails.find(
      (tenant) => tenant.tenantKey === "skyharbor-air",
    );

    expect(skyHarbor).toBeDefined();
    expect(skyHarbor?.sourceVsCandidateCoverage.sourceRichCandidateThin).toBe(true);
    expect(skyHarbor?.sourceVsCandidateCoverage.falseGreenRisk).toBe(true);
    expect(skyHarbor?.relationshipQuality?.relationshipOperationCount).toBe(0);
    expect(skyHarbor?.generatedDataRisk?.status).toBe("watch");
    expect(skyHarbor?.matrix.promotionUnsafe).toBe(true);
    expect(skyHarbor?.warnings.join(" ")).toContain("Source-rich / candidate-thin");
    expect(skyHarbor?.topBlocker).toContain("candidate packet");
  });

  it("writes the required Admin proof artifacts", async () => {
    const model = await buildAdminDataQualityControlModel(process.cwd());
    const outputDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "admin-data-quality-"),
    );

    const outputPaths = await writeAdminDataQualityProofArtifacts(model, outputDir);

    expect(Object.keys(outputPaths).sort()).toEqual([
      "admin-home-caveats-view.json",
      "evidence-quality-view.json",
      "guardrails.json",
      "module-readiness-impact.json",
      "promotion-blockers-view.json",
      "relationship-quality-view.json",
      "source-vs-candidate-coverage.json",
      "summary.md",
      "tenant-detail-snapshots.json",
      "tenant-quality-matrix.json",
    ]);
    await expect(
      fs.readFile(path.join(outputDir, "summary.md"), "utf8"),
    ).resolves.toContain("Admin Data Quality Control Center");
  });
});

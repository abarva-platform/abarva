import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

describe("Source cloud consumption package loader", () => {
  const repoRoot = path.resolve(__dirname, "../../..");

  it("plans the AWS-first cloud package with dense Layer 2 and Layer 3 counts", () => {
    const proofDir = fs.mkdtempSync(path.join(os.tmpdir(), "source-cloud-consumption-plan-"));
    const result = spawnSync(
      "node",
      ["scripts/source/load-cloud-consumption-package.mjs", "--mode=plan", `--proof-dir=${proofDir}`],
      { cwd: repoRoot, encoding: "utf8" },
    );

    expect(result.status).toBe(0);
    const summary = JSON.parse(fs.readFileSync(path.join(proofDir, "summary.json"), "utf8"));
    expect(summary.quality_gate.status).toBe("PASS");
    expect(summary.layer2_expected_rows).toBe(460);
    expect(summary.synthetic_evidence_documents).toBe(10);
    expect(summary.layer2_expected_by_adapter.cloud_service_usage_adapter).toBe(192);
    expect(summary.layer2_expected_by_adapter.cloud_resource_inventory_adapter).toBe(84);
    expect(summary.layer3_expected_readback.source_cloud_service_usage_observation).toBe(192);
    expect(summary.layer3_expected_readback.source_cloud_resource_inventory).toBe(84);
    expect(summary.layer3_expected_readback.source_optimization_opportunity).toBe(8);
    expect(summary.layer3_expected_readback.source_canonical_fact_assertion).toBe(372);
  });

  it("keeps cloud control actions out of realized savings semantics", () => {
    const migration = fs.readFileSync(
      path.join(repoRoot, "supabase/migrations/20260907143000_source_cloud_consumption_package.sql"),
      "utf8",
    );
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-cloud-consumption-package.mjs"),
      "utf8",
    );

    expect(migration).toContain("'control_action'");
    expect(loader).toContain("Finance confirmation and owner approval are required before realized value can be claimed.");
    expect(loader).toContain("source_cloud_consumption_package_layer23_verified");
  });
});

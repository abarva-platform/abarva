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
    expect(summary.layer4_expected_readback.source_contract_360_cloud_contracts).toBe(2);
    expect(summary.layer4_expected_readback.source_vendor_contract_portfolio_cloud_vendors).toBe(2);
    expect(summary.layer4_expected_readback.consumption_sourcing_opportunity_v1_cloud_rows).toBe(8);
    expect(summary.layer4_expected_readback.consumption_sourcing_cloud_usage_monthly_v1).toBe(192);
    expect(summary.layer4_expected_readback.consumption_sourcing_cloud_resource_inventory_v1).toBe(84);
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
    expect(loader).toContain('sourceType === "governance_action" ? "control_action" : sourceType');
    expect(loader).toContain("source_opportunity_type");
    expect(loader).toContain("canonical_value_type");
    expect(loader).toContain("Finance confirmation and owner approval are required before realized value can be claimed.");
    expect(loader).toContain('"apply-layer4"');
    expect(loader).toContain("source.l4_cube_active_load_run_overlay");
    expect(loader).toContain("'cloud_consumption_package'");
    expect(loader).toContain("source_cloud_consumption_package_layer4_applied");
    expect(loader).toContain("source_cloud_consumption_package_layer23_verified");
    expect(loader).toContain("source_cloud_consumption_package_layer4_verified");
    expect(loader).toContain("consumption.sourcing_cloud_usage_monthly_v1");
  });

  it("plans the Databricks consumption package with signal-stage opportunity evidence states", () => {
    const proofDir = fs.mkdtempSync(path.join(os.tmpdir(), "source-dbx-consumption-plan-"));
    const result = spawnSync(
      "node",
      [
        "scripts/source/load-cloud-consumption-package.mjs",
        "--mode=plan",
        "--dataset-version=meridian-databricks-consumption-commit-v1-20260908",
        "--package-dir=datasets/source/cloud-consumption/meridian-databricks-consumption-commit-v1-20260908",
        `--proof-dir=${proofDir}`,
      ],
      { cwd: repoRoot, encoding: "utf8" },
    );

    expect(result.status).toBe(0);
    const summary = JSON.parse(fs.readFileSync(path.join(proofDir, "summary.json"), "utf8"));
    expect(summary.quality_gate.status).toBe("PASS");
    expect(summary.layer2_expected_rows).toBe(169);
    expect(summary.layer2_expected_by_adapter.optimization_opportunity_adapter).toBe(6);
    expect(summary.layer3_expected_readback.source_optimization_opportunity).toBe(6);
    expect(summary.layer3_expected_readback.source_opportunity_evidence).toBe(20);
    expect(summary.layer4_expected_readback.consumption_sourcing_opportunity_v1_cloud_rows).toBe(6);
    expect(summary.layer4_expected_readback.consumption_sourcing_opportunity_v1_finance_required_rows).toBe(6);

    const opportunities = fs.readFileSync(
      path.join(
        repoRoot,
        "datasets/source/cloud-consumption/meridian-databricks-consumption-commit-v1-20260908/source-files/optimization_opportunities.csv",
      ),
      "utf8",
    );
    expect(opportunities).toContain("OPT-DBX-DISCOUNT-REPRICE-001");
    expect(opportunities).toContain("OPT-DBX-SERVERLESS-PARITY-001");
    expect(opportunities).toContain(",signal,range,system_evidenced,");
    expect(opportunities).toContain("Benchmark comparable required");
    expect(opportunities).toContain("Per-SKU serverless versus classic comparison required");
  });
});

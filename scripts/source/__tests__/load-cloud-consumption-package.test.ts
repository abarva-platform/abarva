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
    expect(summary.companion_source_rows.contract_page_text).toBe(10);
    expect(summary.layer2_expected_by_adapter.cloud_service_usage_adapter).toBe(192);
    expect(summary.layer2_expected_by_adapter.cloud_resource_inventory_adapter).toBe(84);
    expect(summary.layer3_expected_readback.source_cloud_service_usage_observation).toBe(192);
    expect(summary.layer3_expected_readback.source_cloud_resource_inventory).toBe(84);
    expect(summary.layer3_expected_readback.source_optimization_opportunity).toBe(8);
    expect(summary.layer3_expected_readback.source_canonical_fact_assertion).toBe(392);
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
    const layer4RepairMigration = fs.readFileSync(
      path.join(
        repoRoot,
        "supabase/migrations/20260910143500_source_cloud_l4_opportunity_readiness_repair.sql",
      ),
      "utf8",
    );
    const layer4ControlReadinessMigration = fs.readFileSync(
      path.join(
        repoRoot,
        "supabase/migrations/20260910231500_source_cloud_l4_control_readiness_projection.sql",
      ),
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
    expect(loader).toContain("DELETE FROM source.cloud_consumption_adapter_row");
    expect(loader).toContain("DELETE FROM source.source_record_snapshot");
    expect(loader).toContain("DELETE FROM source.canonical_fact_assertion");
    expect(loader).toContain("'calculated_amount_usd'");
    expect(loader).not.toContain("'candidate_amount_usd',$4");
    expect(layer4RepairMigration).toContain("legacy.opportunity_id");
    expect(layer4RepairMigration).toContain("canonical.opportunity_id = legacy.opportunity_id");
    expect(layer4RepairMigration).toContain("WHEN o.value_type = 'control_action' THEN 'control_required'");
    expect(layer4ControlReadinessMigration).toContain("legacy.opportunity_id");
    expect(layer4ControlReadinessMigration).toContain("canonical.opportunity_id = legacy.opportunity_id");
    expect(layer4ControlReadinessMigration).toContain("WHEN o.value_type = 'control_action' THEN 'control_required'");
    expect(layer4ControlReadinessMigration).not.toContain(
      "o.dataset_version AS knowledge_baseline_ref,\n        o.dataset_version AS knowledge_baseline_ref",
    );
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
    expect(summary.companion_source_rows.contract_page_text).toBe(6);
    expect(summary.package_sha256).not.toBe("24cd1b7921bfcbebd0599dc731703b79689ce01b1290e377ccf6cbc030a8cbd5");
    expect(summary.layer2_expected_by_adapter.optimization_opportunity_adapter).toBe(6);
    expect(summary.layer3_expected_readback.source_optimization_opportunity).toBe(6);
    expect(summary.layer3_expected_readback.source_opportunity_evidence).toBe(20);
    expect(summary.layer3_expected_readback.source_canonical_fact_assertion).toBe(119);
    expect(summary.layer4_expected_readback.consumption_sourcing_opportunity_v1_cloud_rows).toBe(6);
    expect(summary.layer4_expected_readback.consumption_sourcing_opportunity_v1_finance_required_rows).toBe(6);

    const contractRegister = fs.readFileSync(
      path.join(
        repoRoot,
        "datasets/source/cloud-consumption/meridian-databricks-consumption-commit-v1-20260908/source-files/cloud_contract_register.csv",
      ),
      "utf8",
    );
    expect(contractRegister).toContain("contract_english_overview");
    expect(contractRegister).toContain("scope_english_summary");
    expect(contractRegister).toContain("commercial_thesis");
    expect(contractRegister).toContain("relationship_summary");
    expect(contractRegister).toContain("evidence_boundary_summary");
    expect(contractRegister).toContain("context_review_state");
    expect(contractRegister).toContain("context_reviewer_role");
    expect(contractRegister).toContain("context_reviewed_at");
    expect(contractRegister).toContain("reviewed,Source contract intelligence reviewer,2026-09-08T00:00:00Z");
    expect(contractRegister).toContain("Full raw contract documents remain restricted outside the public repo");
    expect(contractRegister).toContain("six governed document page rows");
    expect(contractRegister).not.toContain("document page text is not loaded");

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

  it("loads contract context as reviewed canonical facts rather than render-time prose", () => {
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-cloud-consumption-package.mjs"),
      "utf8",
    );

    expect(loader).toContain("CONTRACT_CONTEXT_FACTS");
    expect(loader).toContain('factKey: "contract.purpose_summary"');
    expect(loader).toContain('factKey: "contract.scope_summary"');
    expect(loader).toContain('factKey: "contract.commercial_thesis"');
    expect(loader).toContain('factKey: "contract.relationship_summary"');
    expect(loader).toContain('factKey: "contract.evidence_boundary"');
    expect(loader).toContain('basis_type: "reviewed_contract_intelligence"');
    expect(loader).toContain("derived_from_load_run_id: args.loadRunId");
    expect(loader).toContain('reviewState: value(row, "context_review_state")');
    expect(loader).toContain("must carry reviewed or approved contract context");
    expect(loader).toContain("SOURCE_CLOUD_CONSUMPTION_PACKAGE_LAYER3_LOAD_RUN_ID");
    expect(loader).toContain("args.layer3LoadRunId");
  });

  it("binds Layer 4 activation to the exact Layer 3 projection run", () => {
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-cloud-consumption-package.mjs"),
      "utf8",
    );

    expect(loader).toContain("const projectionLoadRunId = args.layer3LoadRunId;");
    expect(loader).toContain("projection_load_run_id: projectionLoadRunId");
    expect(loader).toContain("operation_load_run_id: args.loadRunId");
    expect(loader).toContain("args.layer3LoadRunId,");
  });

  it("refuses to reconcile an empty canonical fact target", () => {
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-cloud-consumption-package.mjs"),
      "utf8",
    );

    expect(loader).toContain("const assertionIds = canonicalFactAssertionIds(files, pageRows);");
    expect(loader).toContain("Refusing canonical fact reconciliation with an empty target set");
    expect(loader).toContain("if (assertionIds.length === 0)");
  });

  it("exposes a governed reapply entrypoint for stale Layer 4 readiness views", () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));

    expect(packageJson.scripts["source:cloud-consumption-package:control-readiness:reapply-job"]).toBe(
      "npx tsx src/scripts/run-migrations.ts --ci --force 20260910231500_source_cloud_l4_control_readiness_projection.sql",
    );
  });
});

import fs from "node:fs";
import path from "node:path";

describe("Source contract depth package loader", () => {
  it("reuses one package load run across Layer 2 and Layer 3 phases", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-contract-depth-package.ts"),
      "utf8",
    );
    const migration = fs.readFileSync(
      path.join(
        repoRoot,
        "supabase/migrations/20260828184000_source_contract_depth_package_layer2.sql",
      ),
      "utf8",
    );

    expect(migration).toContain("UNIQUE (tenant_key, dataset_version, load_run_id)");
    expect(loader).toContain("ON CONFLICT (tenant_key, dataset_version, load_run_id)");
    expect(loader).not.toContain(
      "ON CONFLICT (tenant_key, dataset_version, idempotency_key, mode)",
    );
  });

  it("keeps unassessed market alternatives out of Layer 3 readback", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-contract-depth-package.ts"),
      "utf8",
    );

    expect(loader).toContain("alternatives_available: null");
    expect(loader).toContain("contracts_with_assessed_alternatives");
    expect(loader).toContain("contracts_with_assessed_alternatives: 0");
    expect(loader).not.toContain(
      'alternatives_available: stringValue(contract, "archetype") === "ehr_platform" ? "limited" : "available"',
    );
  });

  it("requires document page text and change-order depth through adapter and Layer 3 readback", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-contract-depth-package.ts"),
      "utf8",
    );

    expect(loader).toContain("change_order_adapter");
    expect(loader).toContain("contract_page_text_adapter");
    expect(loader).toContain("change_orders.csv");
    expect(loader).toContain("contract_page_text.csv");
    expect(loader).toContain("upsertChangeOrderFacts");
    expect(loader).toContain("upsertPageTextFacts");
    expect(loader).toContain("annual_change_order_spend");
    expect(loader).toContain("document.page_text_char_count");
    expect(loader).toContain("opportunity_evidence: opportunityEvidenceRows");
    expect(loader).toContain("calculation_output: sourceFiles.optimizationOpportunities.length * 2");
  });

  it("promotes the contract purpose into a governed canonical fact", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-contract-depth-package.ts"),
      "utf8",
    );
    const contracts = fs.readFileSync(
      path.join(
        repoRoot,
        "datasets/source/contract-depth/meridian-databricks-enterprise-agreement-v1-20260908/source-files/contracts.csv",
      ),
      "utf8",
    );

    expect(contracts).toContain("contract_purpose_summary");
    expect(loader).toContain("contract.purpose_summary");
    expect(loader).toContain("system_extracted_synthetic_demo");
    expect(loader).toContain("upsertContractContextFacts");
  });

  it("counts one canonical context fact for each populated contract purpose", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-contract-depth-package.ts"),
      "utf8",
    );

    expect(loader).toContain(
      'const contractContextFactCount = sourceFiles.contracts.filter',
    );
    expect(loader).toContain("contractContextFactCount +");
  });

  it("refreshes spend observation identity fields when a package row is reloaded", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-contract-depth-package.ts"),
      "utf8",
    );

    const spendUpsert = loader.slice(
      loader.indexOf("async function upsertSpend"),
      loader.indexOf("async function upsertPerformance"),
    );

    expect(spendUpsert).toContain("cost_center = EXCLUDED.cost_center");
    expect(spendUpsert).toContain("business_unit = EXCLUDED.business_unit");
    expect(spendUpsert).toContain("currency = EXCLUDED.currency");
    expect(spendUpsert).toContain("source_system = EXCLUDED.source_system");
    expect(spendUpsert).toContain("quality_state = EXCLUDED.quality_state");
  });

  it("does not use an invalid case_opportunity conflict target", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-contract-depth-package.ts"),
      "utf8",
    );

    expect(loader).toContain("DELETE FROM source.case_opportunity");
    expect(loader).not.toContain(
      "ON CONFLICT (tenant_key, dataset_version, optimization_case_id, opportunity_id)",
    );
  });

  it("requires apply approval only for mutating Layer 2 and Layer 3 modes", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-contract-depth-package.ts"),
      "utf8",
    );

    expect(loader).toContain('if (args.mode === "apply-layer2") {\n      requireApplyApproval(args);');
    expect(loader).toContain('if (args.mode === "apply-layer3") {\n      requireApplyApproval(args);');
    expect(loader).toContain('event: "source_contract_depth_package_layer23_verified"');
  });

  it("validates the dataset version declared by each package instead of one hard-coded package", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const adapter = fs.readFileSync(
      path.join(repoRoot, "src/lib/source/contract-depth-package/adapter.ts"),
      "utf8",
    );

    expect(adapter).toContain("singleDeclaredValue");
    expect(adapter).toContain("const datasetVersion = singleDeclaredValue");
    expect(adapter).toContain("datasetVersion,");
    expect(adapter).not.toContain("const EXPECTED_DATASET_VERSION");
  });

  it("normalizes alternate contract-depth source column names without dropping evidence links", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-contract-depth-package.ts"),
      "utf8",
    );

    expect(loader).toContain('stringValue(row, "application_ref")');
    expect(loader).toContain('stringValue(row, "extraction_id")');
    expect(loader).toContain('stringValue(row, "source_file_id") ||');
    expect(loader).toContain("datasetVersion.length > 0");
  });

  it("keeps optimization opportunity value types inside the canonical enum", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-contract-depth-package.ts"),
      "utf8",
    );
    const opportunities = fs.readFileSync(
      path.join(
        repoRoot,
        "datasets/source/contract-depth/meridian-databricks-enterprise-agreement-v1-20260908/source-files/optimization_opportunities.csv",
      ),
      "utf8",
    );

    expect(opportunities).not.toContain("negotiable_improvement");
    expect(opportunities).toContain("negotiated_improvement");
    expect(loader).toContain(
      "Unsupported canonical optimization opportunity value_type",
    );
  });

  it("counts only populated QBR facts in the Layer 3 readback contract", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const loader = fs.readFileSync(
      path.join(repoRoot, "scripts/source/load-contract-depth-package.ts"),
      "utf8",
    );

    expect(loader).toContain(
      'pctValue(row, "run_percent")',
    );
    expect(loader).toContain(
      'numberValue(row, "client_satisfaction_score")',
    );
    expect(loader).not.toContain(
      "const qbrFactCount = sourceFiles.qbrScorecards.length * 5",
    );
  });

  it("keeps positive service-credit assertions conditional on package evidence", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const layer4 = fs.readFileSync(
      path.join(
        repoRoot,
        "scripts/source/project-contract-depth-package-layer4.ts",
      ),
      "utf8",
    );

    expect(layer4).toContain("packageHasServiceCreditEvidence");
    expect(layer4).toContain("expectedLayer3.source_contract_service_credit");
  });
});

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
});

import fs from "node:fs";
import path from "node:path";

const scriptPath = path.resolve(
  process.cwd(),
  "scripts/source/project-contract-depth-package-layer4.ts",
);

describe("contract depth package Layer 4 overlay job", () => {
  const source = fs.readFileSync(scriptPath, "utf8");

  it("projects the depth package as an overlay instead of replacing the active base cube", () => {
    expect(source).toContain("source.l4_cube_active_load_run_overlay");
    expect(source).toContain("UNION");
    expect(source).toContain("source.l4_cube_active_load_run");
    expect(source).toContain("source_contract_360_total regressed");
    expect(source).not.toMatch(/\bDROP VIEW\b/i);
  });

  it("requires repaired canonical alternatives before product projection", () => {
    expect(source).toContain("contracts_with_assessed_alternatives");
    expect(source).toContain(
      "FROM source.contract WHERE tenant_key = $1 AND load_run_id = $3 AND COALESCE(raw_payload->>'alternatives_available', '') <> ''",
    );
    expect(source).not.toContain(
      "FROM source.contract WHERE tenant_key = $1 AND dataset_version = $2",
    );
    expect(source).toContain("not_assessed");
    expect(source).toContain("limited_alternatives_flag");
    expect(source).toContain("THEN false");
  });

  it("projects governed optimization and consumption rows into product views", () => {
    expect(source).toContain("source.optimization_opportunity");
    expect(source).toContain("consumption.sourcing_spend_monthly_v1");
    expect(source).toContain("consumption.sourcing_performance_v1");
    expect(source).toContain("finance_confirmation_required");
    expect(source).toContain("document_page_text_count");
    expect(source).toContain("change_order_count");
    expect(source).toContain("annual_change_order_spend");
    expect(source).toContain("recurring_change_order_exposure_usd");
    expect(source).toContain("source_contract_360_page_text_rows_package: 30");
    expect(source).toContain(
      "source_contract_360_change_order_rows_package: 8",
    );
    expect(source).toContain("source_optimization_opportunity: 6");
    expect(source).toContain(
      "COALESCE(NULLIF(c.raw_payload ->> 'archetype', ''), v.supplier_category) AS vendor_category",
    );
    expect(source).toContain(`SELECT * FROM sourcing
    WHERE source.can_read_sourcing_tenant(tenant_key)
    UNION ALL
    SELECT * FROM optimization
    WHERE source.can_read_sourcing_tenant(tenant_key)`);
  });

  it("builds the deterministic Source impact layer from governed product views", () => {
    const expectedViews = [
      "source.contract_evidence_coverage_v1",
      "source.contract_action_candidate_v1",
      "source.contract_claim_card_v1",
      "source.vendor_position_v1",
      "source.source_page_storyline_v1",
      "source.ava_grounding_bundle_v1",
    ];
    expectedViews.forEach((viewName) => {
      expect(source).toContain(viewName);
    });
    expect(source).toContain("source_contract_evidence_coverage_v1_package: 5");
    expect(source).toContain("source_contract_action_candidate_v1_package: 6");
    expect(source).toContain("source_contract_claim_card_v1_package: 6");
    expect(source).toContain("source_vendor_position_v1_package: 5");
    expect(source).toContain("source_page_storyline_v1_rows: 5");
    expect(source).toContain("source_ava_grounding_bundle_v1_rows: 6");
    expect(source).toContain(
      "deterministic_layer_unclaimed_credit_usd expected > 0",
    );
    expect(source).toContain(
      "deterministic_layer_candidate_amount_usd expected > 0",
    );
    expect(source).toContain(
      "Never present this candidate as realized savings until finance confirms it.",
    );
    expect(source).toContain(
      "Do not answer cross-tenant vendor pricing prompts.",
    );
    expect(source).toContain(
      "COALESCE(NULLIF(cov.vendor_name, ''), 'Vendor name not resolved') AS vendor_name",
    );
    expect(source).not.toContain("o.vendor_ref, 'Unknown vendor') AS vendor_name");
    expect(source).not.toContain("o.vendor_name,");
    expect(source).toContain("page_key = 'contract_action'");
    expect(source).toContain("FROM source.contract_action_candidate_v1 a");
    expect(source).toContain("concat('action:', a.action_candidate_id)");
    expect(source).toContain("AND load_run_id = $2");
    expect(source).toContain("[args.tenantKey, args.loadRunId]");
  });

  it("grants the deterministic Source impact layer to product readers", () => {
    expect(source).toContain(`GRANT SELECT ON
      source.contract_application_scope`);
    expect(source).toContain("source.contract_claim_card_v1");
    expect(source).toContain("source.contract_action_candidate_v1");
    expect(source).toContain("source.ava_grounding_bundle_v1");
    expect(source).toContain("TO authenticated, service_role");
  });

  it("preserves established source view contracts during overlay refresh", () => {
    expect(source).toContain(
      "cs.scope_ref AS it_portfolio_ref,\n      cs.load_run_id",
    );
    expect(source).not.toContain(
      "cs.scope_ref AS it_portfolio_ref,\n      cs.relationship_method",
    );
    expect(source).toContain("'reviewed_mapping'::text AS relationship_method");
    expect(source).toContain("0.8::numeric(5,4) AS relationship_confidence");
    expect(source).toContain("0::numeric AS cloud_sev1_sev2_incidents");
    expect(source).toContain(
      "COALESCE(op.cloud_sev1_sev2_incidents, 0)::int AS cloud_sev1_sev2_incidents",
    );
    expect(source).not.toContain(
      "COALESCE(op.cloud_sev1_sev2_incidents, 0)::numeric AS cloud_sev1_sev2_incidents",
    );
    expect(source).toContain(
      "WHEN c.source_confidence ~ '^[0-9]+(\\\\.[0-9]+)?$' THEN c.source_confidence::numeric",
    );
    expect(source).toContain("ELSE 0.9::numeric");
    expect(source).not.toContain(
      "COALESCE(c.source_confidence, 0.9)::numeric AS confidence",
    );
    expect(source).toContain(
      "c.annual_value::numeric(18,2) AS annual_contract_value",
    );
    expect(source).toContain("c.annual_value::numeric(18,2) AS annual_value");
    expect(source).toContain(
      "c.actual_annual_spend::numeric AS actual_annual_spend",
    );
    expect(source).toContain(
      "c.committed_annual_spend::numeric AS committed_annual_spend",
    );
    expect(source).toContain(
      "c.total_committed_value::numeric(18,2) AS total_committed_value",
    );
    expect(source).toContain("p.vendor_rank <= 5 AS top_5_flag");
    expect(source).toContain("p.vendor_rank <= 10 AS top_10_flag");
    expect(source).toContain("NULL::numeric(18,4) AS consumed_amount");
    expect(source).toContain("NULL::numeric(18,2) AS overage_amount");
    expect(source).toContain("count(*)::bigint AS row_count");
    expect(source).toContain("count(*)::bigint AS populated_count");
    expect(source).not.toContain("AS rows_total");
    expect(source).not.toContain("AS rows_available");
  });

  it("uses typed parameters in Layer 4 readback queries", () => {
    expect(source).toContain(
      "SELECT contract_id FROM source.contract WHERE tenant_key = $1 AND load_run_id = $2 ORDER BY contract_id",
    );
    expect(source).toContain("[args.tenantKey, args.loadRunId]");
    expect(source).not.toContain(
      "SELECT contract_id FROM source.contract WHERE tenant_key = $1 AND load_run_id = $3 ORDER BY contract_id",
    );
  });
});

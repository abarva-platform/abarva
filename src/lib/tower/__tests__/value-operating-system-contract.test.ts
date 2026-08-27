import { readFileSync } from "node:fs";

const baseMigration = readFileSync(
  "supabase/migrations/20260809150000_tower_value_operating_system_v1.sql",
  "utf8",
);
const migration = readFileSync(
  "supabase/migrations/20260809193000_tower_value_os_semantic_remediation_v1.sql",
  "utf8",
);
const reader = readFileSync("src/lib/tower/readTowerCommandCenter.ts", "utf8");

describe("Tower value operating system contract", () => {
  it("creates the additive value-case layer and governed consumption views", () => {
    for (const tableName of [
      "CREATE TABLE IF NOT EXISTS tower.value_case_claim_link",
      "CREATE TABLE IF NOT EXISTS tower.ai_identity_crosswalk",
      "semantic_remediation_v1",
      "economic_classification",
      "board_scope_state",
      "material_scope_state",
      "source_count",
      "value_case_group_key",
    ]) {
      expect(migration).toContain(tableName);
    }

    for (const viewName of [
      "consumption.tower_board_posture_v1",
      "consumption.tower_value_trajectory_v1",
      "consumption.tower_portfolio_decision_v1",
      "consumption.tower_tool_productivity_v1",
      "consumption.tower_agent_outcome_v1",
      "consumption.tower_action_queue_v1",
      "consumption.tower_source_trust_v1",
    ]) {
      expect(migration).toContain(viewName);
      expect(reader).not.toContain(viewName);
    }

    expect(reader).toContain("from serving.${viewName}");
    for (const viewName of [
      '"tower_command_center"',
      '"tower_value_proof"',
      '"tower_evidence"',
      '"tower_ai_portfolio"',
    ]) {
      expect(reader).toContain(viewName);
    }
  });

  it("separates investment from explicit benefit and derives source trust from source count", () => {
    expect(baseMigration).toContain("generate_series(0, 7)");
    expect(baseMigration).toContain("capacity_hours");
    expect(migration).toContain("generate_series(0, 7)");
    expect(migration).toContain("financial_conversion_usd");
    expect(migration).toContain("remaining_commitment_usd");
    expect(migration).toContain("risk_adjusted_forecast_usd");
    expect(migration).toContain("finance_validated_run_rate_usd");
    expect(migration).toContain("realized_p_and_l_usd");
    expect(migration).toContain("realized_cash_usd");
    expect(migration).toContain("forecast_at_completion_usd");
    expect(migration).toContain("no_financial_conversion");
    expect(migration).toMatch(
      /source_trust_state text NOT NULL DEFAULT 'ABSENT'/,
    );
    expect(migration).toMatch(
      /source_trust_state IN \('AGREE', 'ONE_SOURCE', 'CONFLICT', 'ABSENT'\)/,
    );
    expect(migration).toContain("source_count = 0 THEN 'ABSENT'");
    expect(migration).toContain("source_count = 1 THEN 'ONE_SOURCE'");
    expect(migration).toContain(
      "distinct_source_value_count <= 1 THEN 'AGREE'",
    );
    expect(migration).toContain("ELSE 'CONFLICT'");
    expect(migration).toContain(
      "Approved funding is investment, not promised benefit",
    );
    expect(migration).toContain("CTR-061");
    expect(migration).toContain("CTR-090");
  });

  it("dedupes the observation grain and recalculates usage rate from numerator and denominator", () => {
    expect(migration).toContain("tower_metric_observation_deduped_v1");
    expect(migration).toContain("row_number() OVER");
    expect(migration).toContain("duplicate_observation_count");
    expect(migration).toContain("numerator / denominator");
    expect(migration).toContain("reported_usage_rate_pct");
    expect(migration).toContain("calculated_usage_rate_pct");
    expect(migration).toContain("usage_rate_variance_pct");
    expect(migration).toContain("usage_rate_quality_state");
    expect(migration).toContain("effective_usage_rate_pct");
    expect(migration).toContain("active_exceeds_licensed");
    expect(migration).toContain("Stored usage rate differs from calculated");
  });

  it("does not route the new reader through retired marts or tenant-specific cube canaries", () => {
    const combined = `${migration}\n${reader}`;

    expect(combined).not.toMatch(/from\s+cio_tower\.mart/i);
    expect(combined).not.toMatch(/join\s+cio_tower\.mart/i);
    expect(combined).not.toMatch(/alter\s+table\s+cio_tower\.mart/i);
    expect(combined).not.toMatch(/foundation_v2_meridian_health_cube_canary/i);
  });
});

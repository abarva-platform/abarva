import { readFileSync } from "node:fs";

const migration = readFileSync(
  "supabase/migrations/20260809150000_tower_value_operating_system_v1.sql",
  "utf8",
);
const reader = readFileSync("src/lib/tower/readTowerCommandCenter.ts", "utf8");

describe("Tower value operating system contract", () => {
  it("creates the additive value-case layer and governed consumption views", () => {
    for (const tableName of [
      "tower.value_case",
      "tower.value_case_period",
      "tower.subject_link",
      "tower.economic_conversion",
      "tower.attestation_event",
      "tower.proof_action",
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
      expect(reader).toContain(viewName);
    }
  });

  it("keeps promised value conflicted and capacity separate from savings until conversion evidence exists", () => {
    expect(migration).toContain("generate_series(0, 7)");
    expect(migration).toContain("capacity_hours");
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
    expect(migration).toContain("CONFLICT - authority unresolved");
    expect(migration).toContain(
      "Source conflicts block claimable or realized value",
    );
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

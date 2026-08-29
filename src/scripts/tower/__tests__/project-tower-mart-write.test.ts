import { runInTransactionWithTracking } from "../project-tower-mart-write";

class FakeClient {
  queries: Array<{ sql: string; values?: unknown[] }> = [];

  async query(sql: string, values?: unknown[]) {
    this.queries.push({ sql, values });
    if (sql.includes("INSERT INTO ai_control_refresh_runs")) {
      return { rows: [{ id: "run-123" }] };
    }
    return { rows: [] };
  }
}

function valuesByColumn(sql: string, values: unknown[]): Record<string, unknown> {
  const match = sql.match(/INSERT INTO [^(]+ \(([^)]+)\) VALUES/);
  if (!match) throw new Error(`Could not parse insert columns from ${sql}`);
  const columns = match[1].split(",").map((column) => column.trim());
  return Object.fromEntries(columns.map((column, index) => [column, values[index]]));
}

describe("project-tower-mart-write", () => {
  it("serializes evidence lineage JSONB columns before pg insert", async () => {
    const client = new FakeClient();
    const sourceRefs = [
      { source_system: "Source", source_file: "contract.csv", source_row: "CTR-1" },
    ];
    const conflictingValues = [{ source: "legacy", value: "stale" }];

    await runInTransactionWithTracking(
      client as never,
      {
        tenantKey: "meridian-health",
        tenantName: "Meridian Health",
        clientId: "client-123",
      },
      {
        command_center: [
          {
            command_center_key: "cc-1",
            tenant_key: "meridian-health",
            tenant_name: "Meridian Health",
            mart_version: "tower_command_mart_v1",
            source_standard: "active-current",
            formula_version: "unified_facts_v1",
            source_run_id: null,
            total_it_budget_fy26: 1,
            run_budget_fy26: 1,
            change_budget_fy26: 0,
            approved_program_budget_fy26: 0,
            ai_tagged_spend_fy26_non_additive: 0,
            promised_value_fy26: 0,
            partial_finance_validated_value_ytd: 0,
            realized_value_ytd_allowed: 0,
            claimable_value: 0,
            finance_validated_blocked_value: 0,
            promised_value_exposure: 0,
            unknown_value_claim_count: 0,
            claimable_program_count: 0,
            blocked_program_count: 0,
            conflicted_program_count: 0,
            unmeasured_program_count: 0,
            candidate_ai_opportunities: 0,
            watch_pressure_signals: 0,
            run_ratio: 1,
            change_ratio: 0,
            finance_validation_ratio: null,
            decision_question: "Which actions are ready?",
            executive_summary: "No realized value is claimed.",
            source_fact_keys: [],
            source_files: [],
          },
        ],
        value_funnel: [],
        program_decision_lanes: [],
        ai_portfolio: [],
        cxo_actions: [],
        evidence_lineage: [
          {
            lineage_key: "lineage-1",
            tenant_key: "meridian-health",
            surface_section: "contract_depth",
            displayed_fact: "Unclaimed credits",
            displayed_value_text: "$0",
            displayed_value_numeric: 0,
            source_file: "contract.csv",
            source_row: "CTR-1",
            source_system: "Source",
            source_fact_keys: ["fact-1"],
            formula_version: "unified_facts_v1",
            caveat: "Synthetic demo evidence.",
            metric_or_fact_key: "unclaimed_credit",
            board_visible_label: "Unclaimed credits",
            lineage_state: "ONE_SOURCE",
            source_count: 1,
            source_refs: sourceRefs,
            conflicting_values: conflictingValues,
            authoritative_value: "$0",
            resolution_owner_role: "Finance",
            resolution_state: "not_required",
          },
        ],
        required_field_gaps: [],
      } as never,
      [],
      { idempotencyKey: "idem-1", actor: "test" },
    );

    const insert = client.queries.find((query) =>
      query.sql.startsWith("INSERT INTO cio_tower.mart_evidence_lineage"),
    );
    expect(insert).toBeDefined();
    const row = valuesByColumn(insert!.sql, insert!.values ?? []);
    expect(row.source_refs).toBe(JSON.stringify(sourceRefs));
    expect(row.conflicting_values).toBe(JSON.stringify(conflictingValues));
  });
});

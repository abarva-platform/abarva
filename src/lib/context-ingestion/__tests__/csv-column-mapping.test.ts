import { proposeCsvColumnMapping } from "../csv-column-mapping";

const fixtures: Array<{
  file: string;
  requiredFields: string[];
  headers: string[];
}> = [
  {
    file: "dora_productivity_baseline.csv",
    requiredFields: [
      "team_id",
      "measured_at",
      "deploy_freq_per_week",
      "lead_time_hours",
    ],
    headers: [
      "scorecard_id",
      "domain",
      "lead_time_for_change_hours",
      "deploy_frequency_per_week",
      "MTTR_hours",
      "change_failure_rate_pct",
      "automated_test_coverage_pct",
      "last_updated",
    ],
  },
  {
    file: "aws_service_inventory.csv",
    requiredFields: [
      "service_id",
      "app_id",
      "name",
      "criticality",
      "annual_cost_usd",
    ],
    headers: [
      "service_id",
      "app_id",
      "name",
      "criticality",
      "annual_run_cost_usd",
      "stack_era",
      "ams_vendor",
      "business_unit_id",
    ],
  },
  {
    file: "application-portfolio.csv",
    requiredFields: ["app_id", "name", "criticality", "annual_cost_usd"],
    headers: [
      "app_id",
      "name",
      "criticality",
      "business_unit_id",
      "stack_era",
      "time_classification",
      "annual_run_cost_usd",
      "ams_vendor",
      "notes",
    ],
  },
  {
    file: "gcc_capability_roster.csv",
    requiredFields: [
      "gcc_id",
      "capability",
      "current_headcount",
      "target_headcount_24mo",
      "skill_gap",
    ],
    headers: [
      "gcc_id",
      "locations",
      "headcount",
      "engineering_pct",
      "capability",
      "current_headcount",
      "target_headcount_24mo",
      "skill_gap",
    ],
  },
  {
    file: "vendor_renewal_calendar.csv",
    requiredFields: [
      "contract_id",
      "vendor_name",
      "annual_cost_usd",
      "renewal_date",
    ],
    headers: [
      "contract_id",
      "vendor_id",
      "vendor",
      "vendor_name",
      "category",
      "annual_spend",
      "contract_end",
      "renewal_date",
    ],
  },
  {
    file: "sourcing_pipeline.csv",
    requiredFields: [
      "event_id",
      "measured_at",
      "decision_owner",
      "target_outcome",
    ],
    headers: [
      "event_id",
      "vendor_contract_id",
      "event_type",
      "trigger_date",
      "decision_owner",
      "current_state",
      "target_outcome",
    ],
  },
  {
    file: "initiative_portfolio.csv",
    requiredFields: [
      "initiative_id",
      "title",
      "committed_usd",
      "projected_value_usd",
      "status",
    ],
    headers: [
      "initiative_id",
      "title",
      "name",
      "sponsor",
      "budget_committed",
      "projected_value_usd",
      "status",
      "stage",
    ],
  },
  {
    file: "operational_kpi_timeseries.csv",
    requiredFields: ["kpi_id", "title", "measured_at", "metric_value"],
    headers: [
      "kpi_observation_id",
      "kpi_id",
      "name",
      "category",
      "period_month",
      "monthly_value",
      "target",
      "peer_benchmark",
    ],
  },
  {
    file: "executive_stakeholder_map.csv",
    requiredFields: ["persona_id", "title", "modernization_thesis"],
    headers: [
      "persona_id",
      "persona",
      "name",
      "modernization_thesis",
      "top_3_concerns",
      "alignment_with_CTO",
    ],
  },
  {
    file: "integration_topology_edges.csv",
    requiredFields: [
      "edge_id",
      "source_app_id",
      "target_app_id",
      "integration_type",
    ],
    headers: [
      "edge_id",
      "source_system_id",
      "target_system_id",
      "integration_type",
      "latency_class",
      "fragility",
    ],
  },
  {
    file: "ai_sdlc_opportunity_assessment.csv",
    requiredFields: [
      "opportunity_id",
      "team_id",
      "current_baseline_metric",
      "target_metric",
      "readiness_score",
    ],
    headers: [
      "opportunity_id",
      "category",
      "domain",
      "current_baseline_metric",
      "target_metric",
      "AI_tooling_candidate",
      "readiness_score",
    ],
  },
];

describe("csv column mapping proposal", () => {
  it.each(fixtures)(
    "proposes a non-empty source column for runtime required fields in $file",
    ({ requiredFields, headers }) => {
      const proposal = proposeCsvColumnMapping({
        headers,
        template: { requiredFields, optionalFields: [] },
      });

      expect(proposal.unresolvedRequiredFields).toEqual([]);
      for (const field of requiredFields) {
        expect(proposal.fieldMappings[field]).toEqual(expect.any(String));
      }
    },
  );

  it("flags unresolved required fields instead of silently dropping them", () => {
    const proposal = proposeCsvColumnMapping({
      headers: ["mystery", "unknown"],
      template: { requiredFields: ["team_id"], optionalFields: [] },
    });

    expect(proposal.readyForCommit).toBe(false);
    expect(proposal.unresolvedRequiredFields).toEqual(["team_id"]);
    expect(proposal.fieldMappings).not.toHaveProperty("team_id");
  });
});

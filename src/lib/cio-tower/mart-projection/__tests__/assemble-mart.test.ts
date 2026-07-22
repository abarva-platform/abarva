import { assembleMartFromFacts } from "../assemble-mart";
import { projectTowerOperationalToFacts } from "../facts-from-tower";
import { mergeFactsByCanonicalIdentity } from "../merge-facts";
import {
  type CioTowerFactRow,
  type CanonicalIdentity,
  type CioTowerFactView,
  type CioTowerFactValueSource,
  withCanonicalIdentity,
  SOURCE_PRIORITY,
  type CioTowerTenantIdentity,
} from "../facts-schema";
import { BUDGET_METRIC_KEYS, PROGRAM_METRIC_KEYS } from "../mart-metric-keys";
import {
  buildToolProgramCrosswalk,
  type ToolIdentityAlias,
} from "../tool-identity-crosswalk";

const IDENTITY: CioTowerTenantIdentity = {
  tenantKey: "meridian-health",
  clientId: "uuid-1",
  tenantName: "Healthcare Demo",
};

const OPTS = {
  tenantKey: "meridian-health",
  tenantName: "Healthcare Demo",
  martVersion: "tower_command_mart_v1",
  formulaVersion: "unified_facts_v1",
  sourceStandard: "standard-2026-07-v3",
};

// Synthetic V3-side fact builder (budget + program value). These would come
// from the V3 CSV projection; here we construct representative rows so the
// unified assembler can be proven end-to-end.
function v3Fact(args: {
  key: string;
  view: CioTowerFactView;
  metricKey: string;
  value: number;
  programKey?: string;
  programCode?: string;
  systemName?: string;
  valueSource?: CioTowerFactValueSource;
  priority?: number;
}): CioTowerFactRow {
  const identity: CanonicalIdentity = {
    canonical_tool_key: null,
    canonical_program_key: args.programKey ?? null,
    vendor_name: null,
    system_name: args.systemName ?? args.programCode ?? "Enterprise",
    program_code: args.programCode ?? null,
    metric_key: args.metricKey,
    metric_unit: "usd",
    period_start: "2026-01-01",
    period_end: "2026-12-31",
    source_priority: args.priority ?? SOURCE_PRIORITY.v3_template,
  };
  return {
    fact_key: `meridian-health::${args.key}`,
    tenant_key: "meridian-health",
    entity_key: null,
    entity_type: "other",
    measure: args.metricKey,
    scope: args.view === "it_budget" ? "enterprise_envelope" : "initiative",
    view: args.view,
    amount_type: "none",
    basis: "committed",
    period: "fy26",
    value_numeric: args.value,
    value_text: null,
    value_date: null,
    value_bool: null,
    unit: "usd",
    value_source: args.valueSource ?? "synthetic",
    confidence: "medium",
    source_key: "08_it_budget_spend_value.csv",
    source_row: args.key,
    formula_key: "",
    formula_version: "v3",
    is_rollup_of: "",
    component_of: "",
    superseded_by: "",
    valid_from: null,
    valid_to: null,
    attributes: JSON.stringify(
      withCanonicalIdentity({ source_system: "V3 template" }, identity),
    ),
  };
}

function buildFixtureFacts(): CioTowerFactRow[] {
  // Real operational facts (tenant_file) — Copilot usage + spend, Azure AI cost.
  const towerFacts = projectTowerOperationalToFacts(
    {
      aiToolUsage: [
        {
          client_id: "uuid-1",
          tool: "github_copilot",
          team: "engineering",
          period_start: "2026-05-01",
          period_end: "2026-05-31",
          active_users: 210,
          total_suggestions: 90000,
          accepted_suggestions: 27000,
          acceptance_rate_pct: 30,
          monthly_cost_usd: 6300,
          seats_assigned: 300,
          seats_used: 210,
          source_file_id: "sf",
        },
      ],
      cloudCost: [
        {
          client_id: "uuid-1",
          subscription_id: "s",
          resource_group: "rg",
          resource_name: "aoai",
          service: "Azure OpenAI",
          meter_category: "tokens",
          tag_program: "member-service-ai",
          tag_environment: "prod",
          period_start: "2026-05-01",
          period_end: "2026-05-31",
          monthly_cost_usd: 41000,
          source_file_id: "sf",
        },
      ],
    },
    IDENTITY,
  );

  const v3Facts: CioTowerFactRow[] = [
    // Enterprise budget envelope
    v3Fact({
      key: "budget-total",
      view: "it_budget",
      metricKey: BUDGET_METRIC_KEYS.total,
      value: 650_000_000,
    }),
    v3Fact({
      key: "budget-run",
      view: "it_budget",
      metricKey: BUDGET_METRIC_KEYS.run,
      value: 487_500_000,
    }),
    v3Fact({
      key: "budget-change",
      view: "it_budget",
      metricKey: BUDGET_METRIC_KEYS.change,
      value: 162_500_000,
    }),

    // Program A: Copilot productivity — funded + promised value + finance-validated (should FUND)
    v3Fact({
      key: "copilot-fund",
      view: "initiative_budget",
      metricKey: PROGRAM_METRIC_KEYS.approvedFunding,
      value: 1_200_000,
      programKey: "program::copilot-productivity",
      programCode: "PROG-COPILOT",
      systemName: "M365 Copilot Productivity",
    }),
    v3Fact({
      key: "copilot-promise",
      view: "value",
      metricKey: PROGRAM_METRIC_KEYS.promisedValue,
      value: 4_000_000,
      programKey: "program::copilot-productivity",
      programCode: "PROG-COPILOT",
      systemName: "M365 Copilot Productivity",
    }),
    v3Fact({
      key: "copilot-validated",
      view: "value",
      metricKey: PROGRAM_METRIC_KEYS.financeValidatedValue,
      value: 900_000,
      programKey: "program::copilot-productivity",
      programCode: "PROG-COPILOT",
      systemName: "M365 Copilot Productivity",
    }),

    // Program B: ServiceNow AI — funded + promised, NO finance validation (should FIX + gap)
    v3Fact({
      key: "snow-fund",
      view: "initiative_budget",
      metricKey: PROGRAM_METRIC_KEYS.approvedFunding,
      value: 2_000_000,
      programKey: "program::servicenow-ai",
      programCode: "PROG-SNOW",
      systemName: "ServiceNow AI Automation",
    }),
    v3Fact({
      key: "snow-promise",
      view: "value",
      metricKey: PROGRAM_METRIC_KEYS.promisedValue,
      value: 6_000_000,
      programKey: "program::servicenow-ai",
      programCode: "PROG-SNOW",
      systemName: "ServiceNow AI Automation",
    }),

    // Program C: Data foundation — funded, NO promised value case (should FREEZE + gap)
    v3Fact({
      key: "data-fund",
      view: "initiative_budget",
      metricKey: PROGRAM_METRIC_KEYS.approvedFunding,
      value: 58_000_000,
      programKey: "program::data-foundation",
      programCode: "PROG-DATA",
      systemName: "Data Foundation / Lakehouse",
    }),
  ];

  return [...towerFacts, ...v3Facts];
}

describe("assembleMartFromFacts — full CXO story on unified facts", () => {
  const merged = mergeFactsByCanonicalIdentity(buildFixtureFacts());
  const mart = assembleMartFromFacts(merged.facts, OPTS);

  it("builds a single command-center row with the real budget envelope", () => {
    expect(mart.command_center).toHaveLength(1);
    const cc = mart.command_center[0];
    expect(cc.total_it_budget_fy26).toBe(650_000_000);
    expect(cc.run_budget_fy26).toBe(487_500_000);
    expect(cc.run_ratio).toBeCloseTo(0.75, 2);
  });

  it("NEVER auto-claims realized value", () => {
    expect(mart.command_center[0].realized_value_ytd_allowed).toBe(0);
    const realizedStage = mart.value_funnel.find(
      (s) => s.stage_key === "realized_claimable",
    );
    expect(realizedStage?.value_numeric).toBe(0);
    expect(realizedStage?.claim_status).toBe("blocked");
  });

  it("rolls AI-tagged spend from BOTH real tool spend and real cloud AI cost", () => {
    // Copilot 6300 (real) + Azure OpenAI 41000 (real) = 47300 at minimum
    expect(
      mart.command_center[0].ai_tagged_spend_fy26_non_additive,
    ).toBeGreaterThanOrEqual(47_300);
  });

  it("assigns decision lanes correctly: fund (validated), fix (promised no-validation), freeze (no value case)", () => {
    const byProgram = new Map(
      mart.program_decision_lanes.map((l) => [l.program_code, l]),
    );
    expect(byProgram.get("PROG-COPILOT")?.decision_lane).toBe("fund");
    expect(byProgram.get("PROG-SNOW")?.decision_lane).toBe("fix");
    expect(byProgram.get("PROG-DATA")?.decision_lane).toBe("freeze");
  });

  it("marks the funded+validated program as partial (never realized)", () => {
    const copilot = mart.program_decision_lanes.find(
      (l) => l.program_code === "PROG-COPILOT",
    );
    expect(copilot?.tower_claim_allowed).toBe("partial");
    expect(copilot?.value_claim_status).toBe("partial_validated");
    expect(copilot?.finance_validated_value_usd).toBe(900_000);
  });

  it("emits gaps (not zeros) for the missing promised-value and finance-validation fields", () => {
    const gapFields = mart.required_field_gaps.map((g) => g.required_field);
    // ServiceNow: no finance validation → gap
    expect(
      mart.required_field_gaps.some(
        (g) =>
          g.mart_record_key.includes("servicenow-ai") &&
          g.required_field === "finance_validated_value_usd",
      ),
    ).toBe(true);
    // Data foundation: no promised value → gap
    expect(
      mart.required_field_gaps.some(
        (g) =>
          g.mart_record_key.includes("data-foundation") &&
          g.required_field === "promised_value_usd",
      ),
    ).toBe(true);
    expect(gapFields.length).toBeGreaterThan(0);
  });

  it("populates evidence lineage for visible values, tracing to source facts", () => {
    expect(mart.evidence_lineage.length).toBeGreaterThan(0);
    for (const row of mart.evidence_lineage) {
      expect(row.source_fact_keys.length).toBeGreaterThan(0);
    }
  });

  it("produces a value funnel in the right monotone order of claim strength", () => {
    const seq = mart.value_funnel.map((s) => s.stage_key);
    expect(seq).toEqual([
      "approved_funding",
      "ai_tagged_spend",
      "promised_value",
      "finance_validated",
      "realized_claimable",
    ]);
  });

  it("emits CXO actions per non-empty lane", () => {
    const lanes = mart.cxo_actions.map((a) => a.action_lane);
    expect(lanes).toEqual(expect.arrayContaining(["fund", "fix", "freeze"]));
  });

  it("writes an executive summary that leads with the budget, not the tool", () => {
    const summary = mart.command_center[0].executive_summary;
    expect(summary).toMatch(/technology spend is \$650\.0M/);
    expect(summary).toMatch(/run\/operate/);
    expect(summary.toLowerCase()).toContain("realized value stays blocked");
  });
});

describe("assembleMartFromFacts — tool→program crosswalk attaches real telemetry", () => {
  const COPILOT_ALIASES: ToolIdentityAlias[] = [
    {
      tenant_key: "meridian-health",
      canonical_tool_key: "tool::github-copilot",
      alias: "GitHub Copilot",
      vendor_name: "GitHub",
      system_name: "GitHub Copilot",
      program_code: "PROG-COPILOT",
      canonical_program_key: "program::copilot-productivity",
      active: true,
    },
  ];

  function buildWithCrosswalk() {
    const facts = buildFixtureFacts();
    const merged = mergeFactsByCanonicalIdentity(facts);
    const { crosswalk } = buildToolProgramCrosswalk(
      COPILOT_ALIASES,
      "meridian-health",
    );
    return assembleMartFromFacts(merged.facts, { ...OPTS, crosswalk });
  }

  it("rolls real Copilot telemetry INTO the Copilot program lane (usage no longer null)", () => {
    const mart = buildWithCrosswalk();
    const copilot = mart.program_decision_lanes.find(
      (l) => l.program_code === "PROG-COPILOT",
    );
    expect(copilot).toBeDefined();
    // real 210 active users now attached to the funded program, not orphaned
    expect(copilot?.usage_metric).toBe("active_users");
    expect(copilot?.usage_actual).toBe(210);
    // real Copilot tool spend ($6300) rolled up into the program's ai-tagged spend
    expect(copilot?.ai_tagged_spend_usd).toBeGreaterThanOrEqual(6300);
  });

  it("keeps the funded program's authoritative name, not the tool's display name", () => {
    const mart = buildWithCrosswalk();
    const copilot = mart.program_decision_lanes.find(
      (l) => l.program_code === "PROG-COPILOT",
    );
    expect(copilot?.program_name).toBe("M365 Copilot Productivity");
  });

  it("no longer emits a standalone orphaned Copilot tool row in a stop lane", () => {
    const withCrosswalk = buildWithCrosswalk();
    // The standalone "GitHub Copilot" usage_benefit row is gone — its telemetry
    // merged into the program.
    const orphan = withCrosswalk.ai_portfolio.find(
      (p) =>
        p.item_name === "GitHub Copilot" && p.item_kind === "usage_benefit",
    );
    expect(orphan).toBeUndefined();
  });
});

describe("assembleMartFromFacts — honest empty/degraded states", () => {
  it("emits a blocking gap when no budget envelope is loaded, and does not fabricate a total", () => {
    const towerOnly = projectTowerOperationalToFacts(
      {
        aiToolUsage: [
          {
            client_id: "uuid-1",
            tool: "cursor",
            team: "eng",
            period_start: "2026-05-01",
            period_end: "2026-05-31",
            active_users: 30,
            total_suggestions: null,
            accepted_suggestions: null,
            acceptance_rate_pct: null,
            monthly_cost_usd: 600,
            seats_assigned: null,
            seats_used: null,
            source_file_id: "sf",
          },
        ],
      },
      IDENTITY,
    );
    const mart = assembleMartFromFacts(towerOnly, OPTS);
    expect(mart.command_center[0].total_it_budget_fy26).toBe(0);
    expect(
      mart.required_field_gaps.some(
        (g) => g.required_field === "total_it_budget_fy26" && g.blocking,
      ),
    ).toBe(true);
    // real tool with spend but no funding case → stop lane in portfolio
    const cursor = mart.ai_portfolio.find((p) =>
      p.item_name.includes("Cursor"),
    );
    expect(cursor?.decision_lane).toBe("stop");
  });
});

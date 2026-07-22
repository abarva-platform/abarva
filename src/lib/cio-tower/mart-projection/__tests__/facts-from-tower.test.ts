import {
  factsFromAiToolUsage,
  factsFromCloudCost,
  factsFromDoraMetrics,
  factsFromItsmRecords,
  factsFromJiraIssues,
  projectTowerOperationalToFacts,
  type TowerAiToolUsageRow,
  type TowerCloudCostRow,
  type TowerDoraMetricsRow,
  type TowerItsmRecordRow,
  type TowerJiraIssueRow,
} from "../facts-from-tower";
import {
  factSatisfiesValueInvariant,
  readCanonicalIdentity,
  SOURCE_PRIORITY,
  CIO_TOWER_FACT_VIEWS,
  CIO_TOWER_FACT_UNITS,
  type CioTowerTenantIdentity,
  type CioTowerFactRow,
} from "../facts-schema";

const IDENTITY: CioTowerTenantIdentity = {
  tenantKey: "meridian-health",
  clientId: "00000000-0000-0000-0000-000000000001",
  tenantName: "Healthcare Demo",
};

function assertAllValid(facts: CioTowerFactRow[]): void {
  for (const fact of facts) {
    expect(factSatisfiesValueInvariant(fact)).toBe(true);
    expect(fact.tenant_key).toBe("meridian-health");
    expect(fact.value_source).toBe("tenant_file");
    expect(CIO_TOWER_FACT_VIEWS).toContain(fact.view);
    expect(CIO_TOWER_FACT_UNITS).toContain(fact.unit);
    expect(fact.fact_key.startsWith("meridian-health::")).toBe(true);
    // attributes must be valid JSON so the DB jsonb column accepts it.
    expect(() => JSON.parse(fact.attributes)).not.toThrow();
    // every tower fact carries a canonical identity + true metric unit + a
    // tenant_file source priority — the merge spine the assembler relies on.
    const canonical = readCanonicalIdentity(fact);
    expect(canonical).not.toBeNull();
    expect(canonical!.metric_key).toBeTruthy();
    expect(canonical!.metric_unit).toBeTruthy();
    expect(canonical!.source_priority).toBe(SOURCE_PRIORITY.tenant_file);
    // at least one of tool/program identity must anchor the row
    expect(
      canonical!.canonical_tool_key !== null ||
        canonical!.canonical_program_key !== null,
    ).toBe(true);
  }
}

describe("factsFromAiToolUsage", () => {
  const rows: TowerAiToolUsageRow[] = [
    {
      client_id: IDENTITY.clientId!,
      tool: "github_copilot",
      team: "platform",
      period_start: "2026-05-01",
      period_end: "2026-05-31",
      active_users: 120,
      total_suggestions: 40000,
      accepted_suggestions: 12000,
      acceptance_rate_pct: 30,
      monthly_cost_usd: 3800,
      seats_assigned: 200,
      seats_used: 120,
      source_file_id: "sf-1",
    },
  ];

  it("emits spend (app_run_cost), active users, acceptance, and seat utilization facts", () => {
    const facts = factsFromAiToolUsage(rows, IDENTITY);
    assertAllValid(facts);
    const views = facts.map((f) => `${f.view}:${f.unit}`);
    expect(views).toEqual(
      expect.arrayContaining([
        "app_run_cost:usd",
        "adoption:count",
        "adoption:pct",
        "adoption:ratio",
      ]),
    );
  });

  it("marks tool spend as ai_tagged and uses run amount_type", () => {
    const facts = factsFromAiToolUsage(rows, IDENTITY);
    const spend = facts.find((f) => f.view === "app_run_cost");
    expect(spend?.value_numeric).toBe(3800);
    expect(spend?.amount_type).toBe("run");
    expect(JSON.parse(spend!.attributes).ai_tagged).toBe(true);
  });

  it("computes seat utilization as a ratio in [0,1]", () => {
    const facts = factsFromAiToolUsage(rows, IDENTITY);
    const util = facts.find((f) => f.unit === "ratio");
    expect(util?.value_numeric).toBeCloseTo(0.6, 5);
  });

  it("stamps a stable canonical tool key so identity survives display-name drift", () => {
    const facts = factsFromAiToolUsage(rows, IDENTITY);
    for (const fact of facts) {
      expect(readCanonicalIdentity(fact)!.canonical_tool_key).toBe(
        "tool::github-copilot",
      );
    }
    // complementary metrics (spend vs. adoption) must NOT share a merge key
    const spend = readCanonicalIdentity(
      facts.find((f) => f.view === "app_run_cost")!,
    )!;
    const users = readCanonicalIdentity(
      facts.find((f) => f.unit === "count")!,
    )!;
    expect(spend.metric_key).not.toBe(users.metric_key);
  });

  it("skips fields that are null rather than fabricating a zero", () => {
    const sparse: TowerAiToolUsageRow[] = [
      {
        ...rows[0],
        monthly_cost_usd: null,
        acceptance_rate_pct: null,
        seats_assigned: null,
        seats_used: null,
      },
    ];
    const facts = factsFromAiToolUsage(sparse, IDENTITY);
    // only active_users survives
    expect(facts).toHaveLength(1);
    expect(facts[0].view).toBe("adoption");
    expect(facts[0].unit).toBe("count");
  });
});

describe("factsFromCloudCost", () => {
  const rows: TowerCloudCostRow[] = [
    {
      client_id: IDENTITY.clientId!,
      subscription_id: "sub-1",
      resource_group: "rg-ai",
      resource_name: "aoai-1",
      service: "Azure OpenAI",
      meter_category: "tokens",
      tag_program: "member-service-ai",
      tag_environment: "prod",
      period_start: "2026-05-01",
      period_end: "2026-05-31",
      monthly_cost_usd: 12000,
      source_file_id: "sf-2",
    },
    {
      client_id: IDENTITY.clientId!,
      subscription_id: "sub-1",
      resource_group: "rg-ai",
      resource_name: "aoai-2",
      service: "Azure OpenAI",
      meter_category: "tokens",
      tag_program: "member-service-ai",
      tag_environment: "prod",
      period_start: "2026-05-01",
      period_end: "2026-05-31",
      monthly_cost_usd: 8000,
      source_file_id: "sf-2",
    },
    {
      client_id: IDENTITY.clientId!,
      subscription_id: "sub-1",
      resource_group: "rg-core",
      resource_name: "sql-1",
      service: "Azure SQL",
      meter_category: "compute",
      tag_program: "__untagged__",
      tag_environment: "prod",
      period_start: "2026-05-01",
      period_end: "2026-05-31",
      monthly_cost_usd: 5000,
      source_file_id: "sf-2",
    },
  ];

  it("groups by (service, program, period) and sums resource lines", () => {
    const facts = factsFromCloudCost(rows, IDENTITY);
    assertAllValid(facts);
    // 2 groups: Azure OpenAI/member-service-ai (12k+8k) and Azure SQL/untagged (5k)
    expect(facts).toHaveLength(2);
    const openai = facts.find(
      (f) => JSON.parse(f.attributes).service === "Azure OpenAI",
    );
    expect(openai?.value_numeric).toBe(20000);
    expect(JSON.parse(openai!.attributes).resource_lines).toBe(2);
    expect(JSON.parse(openai!.attributes).ai_tagged).toBe(true);
  });

  it("flags untagged cost as not ai_tagged", () => {
    const facts = factsFromCloudCost(rows, IDENTITY);
    const untagged = facts.find(
      (f) => JSON.parse(f.attributes).tag_program === "__untagged__",
    );
    expect(JSON.parse(untagged!.attributes).ai_tagged).toBe(false);
  });
});

describe("factsFromDoraMetrics", () => {
  const rows: TowerDoraMetricsRow[] = [
    {
      client_id: IDENTITY.clientId!,
      repo: "meridian/claims-api",
      team: "claims",
      period_start: "2026-05-01",
      period_end: "2026-05-31",
      deployment_frequency_per_day: 2.5,
      lead_time_for_changes_hours: 18,
      change_failure_rate_pct: 8,
      mttr_hours: 3,
      sample_size_deploys: 55,
      source_file_id: "sf-3",
    },
  ];

  it("emits one operational_kpi fact per DORA measure present", () => {
    const facts = factsFromDoraMetrics(rows, IDENTITY);
    assertAllValid(facts);
    expect(facts).toHaveLength(4);
    expect(facts.every((f) => f.view === "operational_kpi")).toBe(true);
    const measures = facts.map((f) => JSON.parse(f.attributes).metric).sort();
    expect(measures).toEqual([
      "change-failure-rate",
      "deploy-freq",
      "lead-time",
      "mttr",
    ]);
  });
});

describe("factsFromItsmRecords", () => {
  const rows: TowerItsmRecordRow[] = [
    {
      tenant_key: "meridian-health",
      record_number: "INC1",
      record_type: "incident",
      priority: "P2",
      service: "Member Portal",
      opened_at: "2026-05-02",
      closed_at: "2026-05-02",
      mttr_minutes: 120,
      change_success: null,
      source_file_id: "sf-4",
    },
    {
      tenant_key: "meridian-health",
      record_number: "INC2",
      record_type: "incident",
      priority: "P3",
      service: "Member Portal",
      opened_at: "2026-05-03",
      closed_at: "2026-05-03",
      mttr_minutes: 60,
      change_success: null,
      source_file_id: "sf-4",
    },
    {
      tenant_key: "meridian-health",
      record_number: "CHG1",
      record_type: "change",
      priority: "P3",
      service: "Member Portal",
      opened_at: "2026-05-04",
      closed_at: "2026-05-04",
      mttr_minutes: null,
      change_success: true,
      source_file_id: "sf-4",
    },
    {
      tenant_key: "meridian-health",
      record_number: "CHG2",
      record_type: "change",
      priority: "P3",
      service: "Member Portal",
      opened_at: "2026-05-05",
      closed_at: "2026-05-05",
      mttr_minutes: null,
      change_success: false,
      source_file_id: "sf-4",
    },
  ];

  it("aggregates mean MTTR and change success rate per service", () => {
    const facts = factsFromItsmRecords(rows, IDENTITY);
    assertAllValid(facts);
    const mttr = facts.find((f) => f.unit === "count");
    expect(mttr?.value_numeric).toBe(90); // (120+60)/2
    const changeRate = facts.find((f) => f.unit === "pct");
    expect(changeRate?.value_numeric).toBe(50); // 1 of 2 successful
  });
});

describe("factsFromJiraIssues", () => {
  const rows: TowerJiraIssueRow[] = [
    {
      client_id: IDENTITY.clientId!,
      issue_key: "MER-1",
      issue_type: "Story",
      team: "claims",
      status: "Done",
      story_points: 5,
      cycle_time_hours: 40,
      completed_at: "2026-05-10",
      source_file: "sf-5",
    },
    {
      client_id: IDENTITY.clientId!,
      issue_key: "MER-2",
      issue_type: "Story",
      team: "claims",
      status: "Done",
      story_points: 3,
      cycle_time_hours: 20,
      completed_at: "2026-05-12",
      source_file: "sf-5",
    },
    {
      client_id: IDENTITY.clientId!,
      issue_key: "MER-3",
      issue_type: "Story",
      team: "claims",
      status: "In Progress",
      story_points: 8,
      cycle_time_hours: null,
      completed_at: null,
      source_file: "sf-5",
    },
  ];

  it("aggregates mean cycle time per team over completed issues only", () => {
    const facts = factsFromJiraIssues(rows, IDENTITY);
    assertAllValid(facts);
    expect(facts).toHaveLength(1);
    expect(facts[0].value_numeric).toBe(30); // (40+20)/2, MER-3 excluded
  });
});

describe("projectTowerOperationalToFacts", () => {
  it("returns a flat array across all sources and never fabricates for absent sources", () => {
    const facts = projectTowerOperationalToFacts(
      {
        aiToolUsage: [
          {
            client_id: IDENTITY.clientId!,
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
            source_file_id: "sf-6",
          },
        ],
        // no cloudCost/dora/itsm/jira supplied
      },
      IDENTITY,
    );
    assertAllValid(facts);
    // cursor: spend + active_users only
    expect(facts).toHaveLength(2);
  });

  it("returns an empty array for an all-empty input without throwing", () => {
    expect(projectTowerOperationalToFacts({}, IDENTITY)).toEqual([]);
  });
});

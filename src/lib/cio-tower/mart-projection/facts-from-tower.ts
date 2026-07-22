// Project the real, ingested `tower_*` operational tables into the unified
// `cio_tower.facts` substrate. This is the previously-missing bridge: the
// tower_* connectors (Copilot, Cursor, Claude, GitHub DORA, Azure cost, Jira,
// ServiceNow ITSM) already write real per-tenant rows, but nothing carried
// them into the facts layer the CXO mart is assembled from.
//
// Every fact emitted here is value_source = "tenant_file" (real ingested
// data), which is what distinguishes it from the synthetic v3 CSV pack when
// both land in the same facts table. Pure functions only — no DB, no I/O — so
// the mapping is provable with fixtures without reaching the private VNet.

import {
  type CioTowerFactRow,
  type CioTowerFactView,
  type CioTowerFactScope,
  type CioTowerFactBasis,
  type CioTowerFactUnit,
  type CioTowerTenantIdentity,
  type CanonicalIdentity,
  factKey,
  withCanonicalIdentity,
  SOURCE_PRIORITY,
} from "./facts-schema";

const FORMULA_VERSION = "tower_operational_to_facts_v1";

// ---------------------------------------------------------------------------
// Source row shapes — mirror the confirmed physical schemas.
// ---------------------------------------------------------------------------

export interface TowerAiToolUsageRow {
  client_id: string;
  tool: "github_copilot" | "claude_code" | "cursor";
  team: string;
  period_start: string;
  period_end: string;
  active_users: number | null;
  total_suggestions: number | null;
  accepted_suggestions: number | null;
  acceptance_rate_pct: number | null;
  monthly_cost_usd: number | null;
  seats_assigned: number | null;
  seats_used: number | null;
  source_file_id: string | null;
}

export interface TowerCloudCostRow {
  client_id: string;
  subscription_id: string;
  resource_group: string;
  resource_name: string;
  service: string;
  meter_category: string;
  tag_program: string;
  tag_environment: string | null;
  period_start: string;
  period_end: string;
  monthly_cost_usd: number | null;
  source_file_id: string | null;
}

export interface TowerDoraMetricsRow {
  client_id: string;
  repo: string;
  team: string;
  period_start: string;
  period_end: string;
  deployment_frequency_per_day: number | null;
  lead_time_for_changes_hours: number | null;
  change_failure_rate_pct: number | null;
  mttr_hours: number | null;
  sample_size_deploys: number | null;
  source_file_id: string | null;
}

export interface TowerItsmRecordRow {
  tenant_key: string;
  record_number: string;
  record_type: "incident" | "problem" | "change";
  priority: "P1" | "P2" | "P3" | "P4";
  service: string;
  opened_at: string | null;
  closed_at: string | null;
  mttr_minutes: number | null;
  change_success: boolean | null;
  source_file_id: string | null;
}

export interface TowerJiraIssueRow {
  client_id: string;
  issue_key: string;
  issue_type: string;
  team: string;
  status: string;
  story_points: number | null;
  cycle_time_hours: number | null;
  completed_at: string | null;
  source_file: string | null;
}

const TOOL_VENDOR: Record<TowerAiToolUsageRow["tool"], string> = {
  github_copilot: "GitHub",
  claude_code: "Anthropic",
  cursor: "Anysphere",
};

const TOOL_DISPLAY: Record<TowerAiToolUsageRow["tool"], string> = {
  github_copilot: "GitHub Copilot",
  claude_code: "Claude Code",
  cursor: "Cursor",
};

// ---------------------------------------------------------------------------
// Fact builder — one place that stamps the shared invariants.
// ---------------------------------------------------------------------------

interface BuildFactArgs {
  tenantKey: string;
  keyParts: Array<string | number>;
  measure: string;
  view: CioTowerFactView;
  scope: CioTowerFactScope;
  basis: CioTowerFactBasis;
  unit: CioTowerFactUnit;
  period: string;
  valueNumeric?: number | null;
  valueText?: string | null;
  valueBool?: boolean | null;
  sourceSystem: string;
  sourceRowRef: string | null;
  canonical: CanonicalIdentity;
  attributes?: Record<string, unknown>;
}

function buildTenantFileFact(args: BuildFactArgs): CioTowerFactRow {
  return {
    fact_key: factKey(args.tenantKey, ...args.keyParts),
    tenant_key: args.tenantKey,
    entity_key: null,
    entity_type: "other",
    measure: args.measure,
    scope: args.scope,
    view: args.view,
    amount_type: args.view === "app_run_cost" ? "run" : "none",
    basis: args.basis,
    period: args.period,
    value_numeric: args.valueNumeric === undefined ? null : args.valueNumeric,
    value_text: args.valueText ?? null,
    value_date: null,
    value_bool: args.valueBool ?? null,
    unit: args.unit,
    // Real ingested operational data — never synthetic.
    value_source: "tenant_file",
    confidence: "high",
    source_key: null,
    source_row: args.sourceRowRef,
    formula_key: "",
    formula_version: FORMULA_VERSION,
    is_rollup_of: "",
    component_of: "",
    superseded_by: "",
    valid_from: null,
    valid_to: null,
    attributes: JSON.stringify(
      withCanonicalIdentity(
        { source_system: args.sourceSystem, ...(args.attributes ?? {}) },
        args.canonical,
      ),
    ),
  };
}

/** Canonical tool key per ingested tool enum — the identity spine anchor. */
const TOOL_CANONICAL: Record<TowerAiToolUsageRow["tool"], string> = {
  github_copilot: "tool::github-copilot",
  claude_code: "tool::claude-code",
  cursor: "tool::cursor",
};

function num(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return Number.isFinite(value) ? value : null;
}

function period(row: { period_start: string; period_end: string }): string {
  return `${row.period_start}..${row.period_end}`;
}

// ---------------------------------------------------------------------------
// Per-table projections.
// ---------------------------------------------------------------------------

/**
 * AI tool usage → adoption facts (active users, acceptance, seat utilization)
 * plus an app_run_cost fact for the tool's monthly spend. Spend is the AI
 * portfolio's "ai_tagged_spend" evidence; adoption is the "is it actually
 * used" evidence the value funnel gates on.
 */
export function factsFromAiToolUsage(
  rows: readonly TowerAiToolUsageRow[],
  identity: CioTowerTenantIdentity,
): CioTowerFactRow[] {
  const facts: CioTowerFactRow[] = [];
  for (const row of rows) {
    const vendor = TOOL_VENDOR[row.tool];
    const display = TOOL_DISPLAY[row.tool];
    const canonicalToolKey = TOOL_CANONICAL[row.tool];
    const p = period(row);
    const ref = `tower_ai_tool_usage:${row.tool}:${row.team}:${p}`;
    const base = {
      vendor,
      tool: row.tool,
      team: row.team,
      tool_display: display,
    };
    const canonicalFor = (
      metricKey: string,
      metricUnit: string,
    ): CanonicalIdentity => ({
      canonical_tool_key: canonicalToolKey,
      canonical_program_key: null,
      vendor_name: vendor,
      system_name: display,
      program_code: null,
      metric_key: metricKey,
      metric_unit: metricUnit,
      period_start: row.period_start,
      period_end: row.period_end,
      source_priority: SOURCE_PRIORITY.tenant_file,
    });

    const spend = num(row.monthly_cost_usd);
    if (spend !== null) {
      facts.push(
        buildTenantFileFact({
          tenantKey: identity.tenantKey,
          keyParts: ["tool-spend", row.tool, row.team, p],
          measure: `${display} monthly cost`,
          view: "app_run_cost",
          scope: "system",
          basis: "actual",
          unit: "usd",
          period: p,
          valueNumeric: spend,
          sourceSystem: vendor,
          sourceRowRef: ref,
          canonical: canonicalFor("ai_tool_monthly_cost_usd", "usd"),
          attributes: { ...base, ai_tagged: true },
        }),
      );
    }

    const activeUsers = num(row.active_users);
    if (activeUsers !== null) {
      facts.push(
        buildTenantFileFact({
          tenantKey: identity.tenantKey,
          keyParts: ["tool-active-users", row.tool, row.team, p],
          measure: `${display} active users`,
          view: "adoption",
          scope: "system",
          basis: "actual",
          unit: "count",
          period: p,
          valueNumeric: activeUsers,
          sourceSystem: vendor,
          sourceRowRef: ref,
          canonical: canonicalFor("ai_tool_active_users", "users"),
          attributes: base,
        }),
      );
    }

    const acceptance = num(row.acceptance_rate_pct);
    if (acceptance !== null) {
      facts.push(
        buildTenantFileFact({
          tenantKey: identity.tenantKey,
          keyParts: ["tool-acceptance-rate", row.tool, row.team, p],
          measure: `${display} suggestion acceptance rate`,
          view: "adoption",
          scope: "system",
          basis: "actual",
          unit: "pct",
          period: p,
          valueNumeric: acceptance,
          sourceSystem: vendor,
          sourceRowRef: ref,
          canonical: canonicalFor("ai_tool_acceptance_rate_pct", "pct"),
          attributes: base,
        }),
      );
    }

    const seatsAssigned = num(row.seats_assigned);
    const seatsUsed = num(row.seats_used);
    if (seatsAssigned !== null && seatsAssigned > 0 && seatsUsed !== null) {
      facts.push(
        buildTenantFileFact({
          tenantKey: identity.tenantKey,
          keyParts: ["tool-seat-utilization", row.tool, row.team, p],
          measure: `${display} seat utilization`,
          view: "adoption",
          scope: "system",
          basis: "actual",
          unit: "ratio",
          period: p,
          valueNumeric: seatsUsed / seatsAssigned,
          sourceSystem: vendor,
          sourceRowRef: ref,
          canonical: canonicalFor("ai_tool_seat_utilization", "ratio"),
          attributes: {
            ...base,
            seats_used: seatsUsed,
            seats_assigned: seatsAssigned,
          },
        }),
      );
    }
  }
  return facts;
}

/**
 * Cloud cost → app_run_cost facts, grouped by (service, tag_program) so the
 * mart can separate AI-program-tagged spend from untagged run cost. One fact
 * per (service, program, period) sum keeps the facts layer at a decision-
 * useful grain rather than one fact per raw resource line.
 */
export function factsFromCloudCost(
  rows: readonly TowerCloudCostRow[],
  identity: CioTowerTenantIdentity,
): CioTowerFactRow[] {
  const grouped = new Map<
    string,
    {
      service: string;
      program: string;
      period: string;
      total: number;
      lines: number;
    }
  >();
  for (const row of rows) {
    const cost = num(row.monthly_cost_usd);
    if (cost === null) continue;
    const program = row.tag_program?.trim() || "__untagged__";
    const p = period(row);
    const key = `${row.service}|${program}|${p}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.total += cost;
      existing.lines += 1;
    } else {
      grouped.set(key, {
        service: row.service,
        program,
        period: p,
        total: cost,
        lines: 1,
      });
    }
  }
  const facts: CioTowerFactRow[] = [];
  for (const g of grouped.values()) {
    const [pStart, pEnd] = g.period.split("..");
    const aiTagged = g.program !== "__untagged__";
    facts.push(
      buildTenantFileFact({
        tenantKey: identity.tenantKey,
        keyParts: ["cloud-cost", g.service, g.program, g.period],
        measure: `${g.service} cloud run cost (${g.program})`,
        view: "app_run_cost",
        scope: "system",
        basis: "actual",
        unit: "usd",
        period: g.period,
        valueNumeric: g.total,
        sourceSystem: "Azure Cost",
        sourceRowRef: `tower_cloud_cost:${g.service}:${g.program}:${g.period}`,
        canonical: {
          canonical_tool_key: `system::${g.service.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          // Program-tagged cloud spend ties to the program identity so the
          // mart can roll AI-service cost up under the funded program.
          canonical_program_key: aiTagged
            ? `program::${g.program.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
            : null,
          vendor_name: "Microsoft Azure",
          system_name: g.service,
          program_code: aiTagged ? g.program : null,
          metric_key: "cloud_run_cost_usd",
          metric_unit: "usd",
          period_start: pStart ?? null,
          period_end: pEnd ?? null,
          source_priority: SOURCE_PRIORITY.tenant_file,
        },
        attributes: {
          service: g.service,
          tag_program: g.program,
          resource_lines: g.lines,
          ai_tagged: aiTagged,
        },
      }),
    );
  }
  return facts;
}

/**
 * DORA metrics → operational_kpi facts. Emits before (baseline) and after
 * (actual) for the four DORA measures so the mart can show KPI movement, not
 * a single point. Movement is the developer-productivity value evidence.
 */
export function factsFromDoraMetrics(
  rows: readonly TowerDoraMetricsRow[],
  identity: CioTowerTenantIdentity,
): CioTowerFactRow[] {
  const facts: CioTowerFactRow[] = [];
  const measures: Array<{
    field: keyof TowerDoraMetricsRow;
    label: string;
    unit: CioTowerFactUnit;
    metricUnit: string;
    basis: CioTowerFactBasis;
    slug: string;
    metricKey: string;
  }> = [
    {
      field: "lead_time_for_changes_hours",
      label: "lead time for changes (hours)",
      unit: "count",
      metricUnit: "hours",
      basis: "actual",
      slug: "lead-time",
      metricKey: "dora_lead_time_hours",
    },
    {
      field: "deployment_frequency_per_day",
      label: "deployment frequency (per day)",
      unit: "count",
      metricUnit: "deploys_per_day",
      basis: "actual",
      slug: "deploy-freq",
      metricKey: "dora_deploy_frequency_per_day",
    },
    {
      field: "change_failure_rate_pct",
      label: "change failure rate",
      unit: "pct",
      metricUnit: "pct",
      basis: "actual",
      slug: "change-failure-rate",
      metricKey: "dora_change_failure_rate_pct",
    },
    {
      field: "mttr_hours",
      label: "MTTR (hours)",
      unit: "count",
      metricUnit: "hours",
      basis: "actual",
      slug: "mttr",
      metricKey: "dora_mttr_hours",
    },
  ];
  for (const row of rows) {
    const p = period(row);
    const ref = `tower_dora_metrics:${row.repo}:${p}`;
    for (const m of measures) {
      const value = num(row[m.field] as number | null);
      if (value === null) continue;
      facts.push(
        buildTenantFileFact({
          tenantKey: identity.tenantKey,
          keyParts: ["dora", m.slug, row.repo, p],
          measure: `${row.repo} ${m.label}`,
          view: "operational_kpi",
          scope: "kpi",
          basis: m.basis,
          unit: m.unit,
          period: p,
          valueNumeric: value,
          sourceSystem: "GitHub",
          sourceRowRef: ref,
          canonical: {
            canonical_tool_key: `repo::${row.repo.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
            canonical_program_key: null,
            vendor_name: "GitHub",
            system_name: row.repo,
            program_code: null,
            metric_key: m.metricKey,
            metric_unit: m.metricUnit,
            period_start: row.period_start,
            period_end: row.period_end,
            source_priority: SOURCE_PRIORITY.tenant_file,
          },
          attributes: {
            repo: row.repo,
            team: row.team,
            metric: m.slug,
            sample_size_deploys: num(row.sample_size_deploys),
          },
        }),
      );
    }
  }
  return facts;
}

/**
 * ITSM records → operational_kpi facts, aggregated per service: change
 * success rate and mean MTTR. Per-record ticket rows are far too fine for a
 * CXO mart; the decision-useful grain is service-level outcome.
 */
export function factsFromItsmRecords(
  rows: readonly TowerItsmRecordRow[],
  identity: CioTowerTenantIdentity,
): CioTowerFactRow[] {
  const byService = new Map<
    string,
    {
      mttrSum: number;
      mttrCount: number;
      changeTotal: number;
      changeSuccess: number;
    }
  >();
  for (const row of rows) {
    const svc = row.service?.trim() || "__unassigned__";
    const agg = byService.get(svc) ?? {
      mttrSum: 0,
      mttrCount: 0,
      changeTotal: 0,
      changeSuccess: 0,
    };
    const mttr = num(row.mttr_minutes);
    if (mttr !== null) {
      agg.mttrSum += mttr;
      agg.mttrCount += 1;
    }
    if (row.record_type === "change" && row.change_success !== null) {
      agg.changeTotal += 1;
      if (row.change_success) agg.changeSuccess += 1;
    }
    byService.set(svc, agg);
  }
  const facts: CioTowerFactRow[] = [];
  const svcCanonical = (svc: string): string =>
    `service::${svc.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  for (const [svc, agg] of byService.entries()) {
    if (agg.mttrCount > 0) {
      facts.push(
        buildTenantFileFact({
          tenantKey: identity.tenantKey,
          keyParts: ["itsm-mean-mttr", svc],
          measure: `${svc} mean MTTR (minutes)`,
          view: "operational_kpi",
          scope: "kpi",
          basis: "actual",
          unit: "count",
          period: "trailing",
          valueNumeric: agg.mttrSum / agg.mttrCount,
          sourceSystem: "ServiceNow ITSM",
          sourceRowRef: `tower_itsm_records:${svc}:mttr`,
          canonical: {
            canonical_tool_key: svcCanonical(svc),
            canonical_program_key: null,
            vendor_name: "ServiceNow",
            system_name: svc,
            program_code: null,
            metric_key: "itsm_mean_mttr_minutes",
            metric_unit: "minutes",
            period_start: null,
            period_end: null,
            source_priority: SOURCE_PRIORITY.tenant_file,
          },
          attributes: { service: svc, incident_sample: agg.mttrCount },
        }),
      );
    }
    if (agg.changeTotal > 0) {
      facts.push(
        buildTenantFileFact({
          tenantKey: identity.tenantKey,
          keyParts: ["itsm-change-success-rate", svc],
          measure: `${svc} change success rate`,
          view: "operational_kpi",
          scope: "kpi",
          basis: "actual",
          unit: "pct",
          period: "trailing",
          valueNumeric: (agg.changeSuccess / agg.changeTotal) * 100,
          sourceSystem: "ServiceNow ITSM",
          sourceRowRef: `tower_itsm_records:${svc}:change-success`,
          canonical: {
            canonical_tool_key: svcCanonical(svc),
            canonical_program_key: null,
            vendor_name: "ServiceNow",
            system_name: svc,
            program_code: null,
            metric_key: "itsm_change_success_rate_pct",
            metric_unit: "pct",
            period_start: null,
            period_end: null,
            source_priority: SOURCE_PRIORITY.tenant_file,
          },
          attributes: { service: svc, change_sample: agg.changeTotal },
        }),
      );
    }
  }
  return facts;
}

/**
 * Jira issues → operational_kpi facts, aggregated per team: mean cycle time
 * and completed throughput over the loaded window.
 */
export function factsFromJiraIssues(
  rows: readonly TowerJiraIssueRow[],
  identity: CioTowerTenantIdentity,
): CioTowerFactRow[] {
  const byTeam = new Map<
    string,
    { cycleSum: number; cycleCount: number; completed: number }
  >();
  for (const row of rows) {
    const team = row.team?.trim() || "__unassigned__";
    const agg = byTeam.get(team) ?? {
      cycleSum: 0,
      cycleCount: 0,
      completed: 0,
    };
    const cycle = num(row.cycle_time_hours);
    if (cycle !== null && row.completed_at) {
      agg.cycleSum += cycle;
      agg.cycleCount += 1;
    }
    if (row.completed_at) agg.completed += 1;
    byTeam.set(team, agg);
  }
  const facts: CioTowerFactRow[] = [];
  for (const [team, agg] of byTeam.entries()) {
    if (agg.cycleCount > 0) {
      facts.push(
        buildTenantFileFact({
          tenantKey: identity.tenantKey,
          keyParts: ["jira-mean-cycle-time", team],
          measure: `${team} mean issue cycle time (hours)`,
          view: "operational_kpi",
          scope: "kpi",
          basis: "actual",
          unit: "count",
          period: "trailing",
          valueNumeric: agg.cycleSum / agg.cycleCount,
          sourceSystem: "Jira",
          sourceRowRef: `tower_jira_issues:${team}:cycle-time`,
          canonical: {
            canonical_tool_key: `team::${team.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
            canonical_program_key: null,
            vendor_name: "Atlassian",
            system_name: `Jira · ${team}`,
            program_code: null,
            metric_key: "jira_mean_cycle_time_hours",
            metric_unit: "hours",
            period_start: null,
            period_end: null,
            source_priority: SOURCE_PRIORITY.tenant_file,
          },
          attributes: { team, completed_sample: agg.cycleCount },
        }),
      );
    }
  }
  return facts;
}

export interface TowerOperationalInput {
  aiToolUsage?: readonly TowerAiToolUsageRow[];
  cloudCost?: readonly TowerCloudCostRow[];
  doraMetrics?: readonly TowerDoraMetricsRow[];
  itsmRecords?: readonly TowerItsmRecordRow[];
  jiraIssues?: readonly TowerJiraIssueRow[];
}

/**
 * Project every supplied tower_* source into one flat facts array. Missing
 * sources are simply absent — the caller records those as gaps against the
 * mart, not here. This function never fabricates; it only maps rows that
 * exist.
 */
export function projectTowerOperationalToFacts(
  input: TowerOperationalInput,
  identity: CioTowerTenantIdentity,
): CioTowerFactRow[] {
  return [
    ...factsFromAiToolUsage(input.aiToolUsage ?? [], identity),
    ...factsFromCloudCost(input.cloudCost ?? [], identity),
    ...factsFromDoraMetrics(input.doraMetrics ?? [], identity),
    ...factsFromItsmRecords(input.itsmRecords ?? [], identity),
    ...factsFromJiraIssues(input.jiraIssues ?? [], identity),
  ];
}

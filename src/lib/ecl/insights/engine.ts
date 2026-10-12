import { createHash } from "node:crypto";
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import type {
  CanonicalRow, InsightFinding, InsightInput, InsightMeasure, InsightObject,
  InsightPlan, InsightRelationship, InsightRuleKey,
} from "./types";

export const INSIGHT_RULES = [
  { key: "priority-delivery-links", version: 1, basis: "Declared ADVANCES_PRIORITY edges from program or ai_program to strategic_priority; absence is scoped to this assessment." },
  { key: "program-forecast-budget", version: 1, basis: "Recorded forecast_usd exceeds approved_budget_usd for the same program, USD unit and exact dated period; no realized-value inference." },
  { key: "ai-target-actual-gap", version: 1, basis: "A dated AI-use-case target has no eligible actual of the same metric, unit and period in this assessment; absence is not proof of failure." },
  { key: "risk-critical-dependency", version: 1, basis: "High/critical risk APPLIES_TO a critical application, then either direct HOSTED_ON/DEPENDS_ON a platform or an application_deployment DEPLOYMENT_OF the application and HOSTED_ON a platform; only declared edges are traversed." },
  { key: "compatible-benchmark", version: 1, basis: "Confirmed non-synthetic external reference, cited HTTPS source and matching definition, industry, cohort, geography, dated period and period basis; compare an actual to the recorded range, never calculate percentile." },
] as const;

const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.entries(value).sort(([a], [b]) => compare(a, b))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
}

export function insightHash(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

export function insightUuid(value: unknown): string {
  const hex = insightHash(value);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function date(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

const sorted = <T>(rows: T[]): T[] => [...rows].sort((a, b) =>
  compare(canonicalJson(a), canonicalJson(b)));
const unique = (values: string[]) => [...new Set(values)].sort();
const text = (value: unknown): string => typeof value === "string" ? value.trim() : "";
const type = (object: InsightObject) => object.canonical_semantic_type || object.object_type;

export function buildIntegratedInsightPlan(raw: InsightInput): InsightPlan {
  if (!(CANONICAL_TENANT_KEYS as readonly string[]).includes(raw.tenantKey)) {
    throw new Error("A canonical tenant key is required");
  }
  if (!raw.assessmentId.trim() || !date(raw.asOf)) throw new Error("Assessment and valid as-of date are required");
  const input: InsightInput = {
    ...raw, objects: sorted(raw.objects), relationships: sorted(raw.relationships),
    measures: sorted(raw.measures), sources: sorted(raw.sources),
    metricDefinitions: sorted(raw.metricDefinitions), cubeMeasureLinks: sorted(raw.cubeMeasureLinks),
    cubeManifests: sorted(raw.cubeManifests),
  };
  for (const family of [input.objects, input.relationships, input.measures, input.sources]) {
    if (family.some((row) => row.tenant_key !== input.tenantKey || row.assessment_id !== input.assessmentId)) {
      throw new Error("Cross-tenant or cross-assessment input refused");
    }
    if (new Set(family.map((row) => row.id)).size !== family.length) throw new Error("Duplicate canonical IDs refused");
  }
  const sourceSetHash = insightHash(input);
  const ruleSetHash = insightHash(INSIGHT_RULES);
  const releaseId = insightUuid({ tenant: input.tenantKey, assessment: input.assessmentId, sourceSetHash, ruleSetHash });
  const sources = new Map(input.sources.map((row) => [row.id, row]));
  const eligible = (row: CanonicalRow) => {
    const source = sources.get(row.source_record_id ?? "");
    return Boolean(source && /^[0-9a-f]{64}$/.test(source.file_hash) && /^[0-9a-f]{64}$/.test(source.record_hash) && source.access_class !== "restricted" &&
      ["accepted", "partial"].includes(source.quality_state) &&
      ["parsed", "partial"].includes(source.parse_state) &&
      ["source_recorded", "owner_confirmed", "calculated", "document_extracted"].includes(row.basis) &&
      ["known", "estimated"].includes(row.value_state) &&
      ["not_reviewed", "in_review", "confirmed", "corrected"].includes(row.review_state));
  };
  const objects = input.objects.filter((row) => eligible(row) && row.lifecycle_state !== "retired");
  const byId = new Map(objects.map((row) => [row.id, row]));
  const relationships = input.relationships.filter((row) => eligible(row) &&
    byId.has(row.from_object_id) && byId.has(row.to_object_id));
  const definitions = new Map(input.metricDefinitions.map((row) => [row.metric_key, row]));
  const measures = input.measures.filter((row) => eligible(row) && byId.has(row.subject_object_id) &&
    ["usable", "estimated"].includes(row.quality_state) &&
    definitions.get(row.metric_key)?.unit === row.unit &&
    row.value_number !== null && Number.isFinite(row.value_number));
  const inventory: InsightPlan["inventory"] = {};
  for (const object of input.objects) {
    const family = inventory[type(object)] ??= { recorded: 0, eligible: 0, reviewed: 0 };
    family.recorded++;
    if (byId.has(object.id)) family.eligible++;
    if (byId.has(object.id) && ["confirmed", "corrected"].includes(object.review_state)) family.reviewed++;
  }
  const findings: InsightFinding[] = [];
  const evaluations: InsightPlan["evaluations"] = [];
  const add = (ruleKey: InsightRuleKey, headline: string, detail: string,
    objectRows: InsightObject[], edgeRows: InsightRelationship[] = [], measureRows: InsightMeasure[] = [],
    caveats: string[] = [], kind: InsightFinding["kind"] = "record_finding") => {
    const objectIds = unique(objectRows.map((row) => row.id));
    const relationshipIds = unique(edgeRows.map((row) => row.id));
    const measureIds = unique(measureRows.map((row) => row.id));
    findings.push({
      id: insightUuid({ releaseId, ruleKey, objectIds, relationshipIds, measureIds }),
      ruleKey, kind, headline, detail, objectIds, relationshipIds, measureIds,
      sourceRecordIds: unique([...objectRows, ...edgeRows, ...measureRows].map((row) => row.source_record_id!)),
      cubeSliceIds: unique(input.cubeMeasureLinks.filter((link) => measureIds.includes(link.measure_id) &&
        measureRows.some((row) => row.id === link.measure_id && row.metric_key === link.metric_key))
        .map((link) => link.cube_slice_id)),
      caveats: unique(["Candidate finding; not human reviewed or approved for product serving.",
        ...(new Set([...objectRows, ...edgeRows, ...measureRows].map((row) => sources.get(row.source_record_id!)?.source_file_id)).size === 1
          ? ["One source file; not independently corroborated."] : []),
        ...([...objectRows, ...edgeRows, ...measureRows].some((row) => sources.get(row.source_record_id!)?.origin === "synthetic_generator")
          ? ["Includes synthetic source records; not client-attested."] : []), ...caveats]),
      reviewState: "not_reviewed", agentReady: false,
    });
  };
  const evaluate = (ruleKey: InsightRuleKey, assessable: boolean, reason: string, fn: () => void) => {
    const before = findings.length;
    if (assessable) fn();
    const count = findings.length - before;
    evaluations.push({ ruleKey, state: !assessable ? "not_assessable" : count ? "matched" : "clear", findings: count, reason });
  };
  const programs = objects.filter((row) => ["program", "ai_program"].includes(type(row)));
  const priorities = objects.filter((row) => type(row) === "strategic_priority");
  evaluate("priority-delivery-links", priorities.length > 0 && programs.length > 0,
    "Only declared links in the selected assessment are checked; this is not whole-enterprise completeness.", () => {
      for (const priority of priorities) {
        const links = relationships.filter((edge) => edge.relationship_type === "ADVANCES_PRIORITY" &&
          edge.to_object_id === priority.id && programs.some((program) => program.id === edge.from_object_id));
        if (!links.length) add("priority-delivery-links", `${priority.display_name}: delivery linkage cannot be verified`,
          "No eligible program-to-priority link is recorded in this assessment. This identifies a mapping gap, not proof that delivery work does not exist.",
          [priority], [], [], ["Unrecorded or excluded relationships may change this finding."]);
      }
    });
  const dated = (row: InsightMeasure) => Boolean(row.period_start && row.period_end &&
    date(row.period_start) && date(row.period_end) && row.period_start <= row.period_end);
  const samePeriod = (a: InsightMeasure, b: InsightMeasure) => dated(a) && dated(b) &&
    a.period_start === b.period_start && a.period_end === b.period_end;
  let budgetPairs = 0;
  evaluate("program-forecast-budget", programs.length > 0,
    "Only one eligible approved budget and forecast per identical program, unit and dated period can be compared.", () => {
      for (const program of programs) {
        const rows = measures.filter((row) => row.subject_object_id === program.id && row.unit === "USD");
        for (const budget of rows.filter((row) => row.metric_key === "approved_budget_usd")) {
          const budgets = rows.filter((row) => row.metric_key === "approved_budget_usd" && samePeriod(row, budget));
          const forecasts = rows.filter((row) => row.metric_key === "forecast_usd" && samePeriod(row, budget) && row.scenario === "forecast");
          if (budgets.length !== 1 || forecasts.length !== 1 || budget.value_state !== "known" ||
            text(budget.attributes_json.budget_approval_status) !== "approved") continue;
          budgetPairs++;
          const forecast = forecasts[0];
          if (forecast.value_number! > budget.value_number!) add("program-forecast-budget",
            `${program.display_name}: forecast exceeds recorded approved budget`,
            `Recorded forecast ${forecast.value_number} USD exceeds approved budget ${budget.value_number} USD for ${budget.period_start} to ${budget.period_end}. These are not realized benefits.`,
            [program], [], [budget, forecast], ["Amounts are source-recorded; the comparison does not grant financial approval."]);
        }
      }
    });
  if (!budgetPairs) evaluations[1].state = "not_assessable";
  const aiCases = objects.filter((row) => type(row) === "ai_use_case");
  const aiTargets = measures.filter((row) => aiCases.some((object) => object.id === row.subject_object_id) &&
    row.scenario === "target" && dated(row) && row.period_end! <= input.asOf);
  evaluate("ai-target-actual-gap", aiTargets.length > 0,
    "Only targets whose period has ended are checked. An absent actual means measurement is unavailable, not that performance failed.", () => {
      for (const target of aiTargets) {
        const actual = measures.filter((row) => row.subject_object_id === target.subject_object_id &&
          row.metric_key === target.metric_key && row.unit === target.unit && row.scenario === "actual" && samePeriod(row, target));
        if (!actual.length) add("ai-target-actual-gap", `${byId.get(target.subject_object_id)!.display_name}: outcome comparison is unavailable`,
          `A ${target.metric_key} target is recorded for ${target.period_start} to ${target.period_end}; no eligible same-period actual is present in this assessment.`,
          [byId.get(target.subject_object_id)!], [], [target], ["This is an evidence gap, not a benefit shortfall or failed use case."]);
      }
    });
  const risks = objects.filter((row) => type(row) === "risk" &&
    ["high", "critical"].includes(text(row.attributes_json.severity).toLowerCase()));
  const criticalApplication = (row: InsightObject) => {
    const values = [row.attributes_json.criticality, row.attributes_json.criticality_tier]
      .filter((value) => value !== undefined && value !== null && text(value) !== "");
    return type(row) === "application" && values.length > 0 &&
      values.every((value) => ["high", "critical", "tier_1"].includes(text(value).toLowerCase()));
  };
  const isPlatform = (row: InsightObject) => ["infrastructure", "data_platform"].includes(type(row));
  let riskPaths = 0;
  evaluate("risk-critical-dependency", risks.length > 0,
    "Severity and criticality must be explicitly recorded; a dependency path does not establish causation or an uncontrolled risk.", () => {
      for (const risk of risks) {
        for (const applies of relationships.filter((edge) => edge.from_object_id === risk.id && edge.relationship_type === "APPLIES_TO")) {
          const app = byId.get(applies.to_object_id)!;
          if (!criticalApplication(app)) continue;
          for (const dependency of relationships.filter((edge) => edge.from_object_id === app.id &&
            ["HOSTED_ON", "DEPENDS_ON"].includes(edge.relationship_type))) {
            const platform = byId.get(dependency.to_object_id)!;
            if (!isPlatform(platform)) continue;
            riskPaths++;
            add("risk-critical-dependency", `${risk.display_name}: declared dependency reaches ${platform.display_name}`,
              `The risk applies to critical application ${app.display_name}, which has a declared ${dependency.relationship_type.toLowerCase().replaceAll("_", " ")} link to ${platform.display_name}.`,
              [risk, app, platform], [applies, dependency], [], ["Control effectiveness and causal impact are not established by these links."]);
          }
          for (const deploymentOf of relationships.filter((edge) => edge.to_object_id === app.id &&
            edge.relationship_type === "DEPLOYMENT_OF")) {
            const deployment = byId.get(deploymentOf.from_object_id)!;
            if (type(deployment) !== "application_deployment") continue;
            for (const hostedOn of relationships.filter((edge) => edge.from_object_id === deployment.id &&
              edge.relationship_type === "HOSTED_ON")) {
              const platform = byId.get(hostedOn.to_object_id)!;
              if (!isPlatform(platform)) continue;
              riskPaths++;
              add("risk-critical-dependency", `${risk.display_name}: declared dependency reaches ${platform.display_name}`,
                `The risk applies to critical application ${app.display_name}. Its declared deployment ${deployment.display_name} is hosted on ${platform.display_name}.`,
                [risk, app, deployment, platform], [applies, deploymentOf, hostedOn], [],
                ["Control effectiveness and causal impact are not established by these links."]);
            }
          }
        }
      }
    });
  if (!riskPaths) evaluations[3].state = "not_assessable";
  const contractKeys = ["metric_definition", "industry", "cohort", "geography", "period_basis"];
  const benchmarks = objects.filter((row) => type(row) === "external_benchmark" &&
    ["confirmed", "corrected"].includes(row.review_state) &&
    sources.get(row.source_record_id!)?.origin === "client_intake");
  let benchmarkPairs = 0;
  evaluate("compatible-benchmark", benchmarks.length > 0,
    "Synthetic, unreviewed, stale or incompatible references cannot establish an industry comparison.", () => {
      for (const benchmark of benchmarks) {
        const attrs = benchmark.attributes_json;
        const contract = attrs.comparison_contract as Record<string, unknown> | undefined;
        const low = attrs.range_low;
        const high = attrs.range_high;
        const expires = text(attrs.valid_until);
        if (!contract || typeof low !== "number" || typeof high !== "number" || !Number.isFinite(low) || !Number.isFinite(high) || low > high ||
          !/^https:\/\//.test(text(attrs.source_uri)) || !date(expires) || expires < input.asOf ||
          !contractKeys.every((key) => text(contract[key]))) continue;
        for (const measure of measures.filter((row) => row.scenario === "actual" && dated(row) && row.period_end! <= input.asOf &&
          row.period_start === attrs.period_start && row.period_end === attrs.period_end &&
          row.metric_key === attrs.metric_key && row.unit === attrs.unit)) {
          const measureContract = measure.attributes_json.comparison_contract as Record<string, unknown> | undefined;
          if (!measureContract || !contractKeys.every((key) => text(contract[key]) === text(measureContract[key])) ||
            text(contract.metric_definition) !== definitions.get(measure.metric_key)?.definition) continue;
          const duplicates = measures.filter((row) => row.subject_object_id === measure.subject_object_id &&
            row.metric_key === measure.metric_key && row.scenario === "actual" && samePeriod(row, measure));
          if (duplicates.length !== 1) continue;
          benchmarkPairs++;
          if (measure.value_number! < low || measure.value_number! > high) add("compatible-benchmark",
            `${byId.get(measure.subject_object_id)!.display_name}: measure is outside the cited comparator range`,
            `Recorded ${measure.metric_key}: ${measure.value_number} ${measure.unit} for ${measure.period_start} to ${measure.period_end}; cited same-period comparator range: ${low} to ${high} ${measure.unit}. This is a range comparison, not a percentile or performance judgment.`,
            [byId.get(measure.subject_object_id)!, benchmark], [], [measure],
            [`External reference: ${text(attrs.source_uri)}; comparator valid through ${expires}.`], "benchmark_comparison");
        }
      }
    });
  if (!benchmarkPairs) evaluations[4].state = "not_assessable";
  const result = { findings: findings.sort((a, b) => compare(a.id, b.id)), evaluations, inventory,
    excluded: { objects: input.objects.length - objects.length, relationships: input.relationships.length - relationships.length, measures: input.measures.length - measures.length } };
  const resultHash = insightHash(result);
  return { tenantKey: input.tenantKey, assessmentId: input.assessmentId, asOf: input.asOf,
    sourceSetHash, ruleSetHash, releaseId, resultHash,
    loadVersionHash: insightHash({ sourceSetHash, ruleSetHash, resultHash }), ...result };
}

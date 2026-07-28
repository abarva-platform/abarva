/**
 * Canonical → V1 payload shaping. The single source of truth that maps accepted
 * `knowledge.*` / `metrics.*` / `governance.evidence_gap` rows into the exact
 * ConsumptionEnvelope `V1` payload shapes the shell reads.
 *
 * Used by the projection-build extension (writes V1-shaped `payload` jsonb into
 * consumption.*_v1) and mirrored by the reader (which then passes payload
 * straight through). Keeping the mapping here means build-time and read-time
 * agree by construction.
 *
 * The canonical `canonical_payload`/`fact_value` JSON shape is set by the tenant
 * loader and is not a fixed schema, so these shapers read well-known keys
 * defensively and fall back to null + an availability_state — never to zero.
 */

import type {
  AvailabilityState,
  DomainReadinessV1,
  EnterpriseBriefV1,
  EnterpriseIdentityV1,
  EntityFieldValue,
  EntitySummaryV1,
  EvidenceGapSeverityLevel,
  EvidenceGapV1,
  GovernedMetricValue,
} from "../consumption-contracts";

/** Minimal row shapes read from the accepted knowledge layer. */
export interface KnowledgeEntityRow {
  entity_ref: string;
  entity_type: string;
  display_name: string;
  canonical_payload: Record<string, unknown> | null;
  authority_state: string;
  availability_state: string | null;
  accepted_evidence_refs: string[] | null;
}
export interface FactRow {
  entity_ref: string;
  fact_type: string;
  fact_value: Record<string, unknown> | null;
  evidence_refs: string[] | null;
  availability_state?: string | null;
}
export interface MetricRow {
  metric_ref: string;
  metric_name: string | null;
  unit: string | null;
  period_start: string | null;
  period_end: string | null;
  metric_value: number | null;
  disclosure_mode: string | null;
  evidence_refs: string[] | null;
}
export interface EvidenceGapRow {
  gap_ref: string;
  domain_ref: string | null;
  missing_evidence_type: string | null;
  why_it_matters: string | null;
  severity: string | null;
  availability_state: string | null;
  source_request_text: string | null;
}

const ALLOWED_AVAIL = new Set<AvailabilityState>([
  "available", "not_loaded", "not_measured", "withheld", "conflicting",
  "stale", "candidate", "accepted", "superseded", "not_applicable",
]);
function avail(v: string | null | undefined, fallback: AvailabilityState = "available"): AvailabilityState {
  return v && ALLOWED_AVAIL.has(v as AvailabilityState) ? (v as AvailabilityState) : fallback;
}

/** Pull a value from canonical_payload by any of several candidate keys. */
function pick(payload: Record<string, unknown> | null, keys: string[]): unknown {
  if (!payload) return undefined;
  for (const k of keys) if (payload[k] !== undefined && payload[k] !== null) return payload[k];
  return undefined;
}
function asString(v: unknown): string | null {
  return typeof v === "string" ? v : typeof v === "number" ? String(v) : null;
}
function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}

export function shapeMetric(row: MetricRow): GovernedMetricValue {
  // withheld disclosure → no value, never zero.
  const withheld = row.disclosure_mode === "withheld" || row.disclosure_mode === "restricted";
  const value = withheld ? null : row.metric_value;
  const availability: AvailabilityState =
    withheld ? "withheld" : value === null ? "not_measured" : "available";
  return {
    metricKey: row.metric_ref,
    label: row.metric_name ?? row.metric_ref,
    value,
    unit: row.unit,
    period: row.period_start && row.period_end ? `${row.period_start}..${row.period_end}` : row.period_start,
    availabilityState: availability,
    semanticModelVersion: null,
    metricQueryHash: null,
    evidenceRefs: row.evidence_refs ?? [],
    unavailableReason: value === null
      ? (withheld ? "Value is restricted/withheld." : "Underlying source has not been measured.")
      : null,
  };
}

export function shapeEnterpriseIdentity(
  entity: KnowledgeEntityRow | null,
  facts: FactRow[],
): EnterpriseIdentityV1 {
  const p = entity?.canonical_payload ?? null;
  const revenueFact = facts.find((f) => /revenue/i.test(f.fact_type));
  const employeesFact = facts.find((f) => /employee|headcount/i.test(f.fact_type));
  return {
    organizationId: entity?.entity_ref ?? null,
    displayName: entity?.display_name ?? asString(pick(p, ["display_name", "name", "organization"])),
    industry: asString(pick(p, ["industry", "sector"])),
    revenue: revenueFact ? factToMetric("enterprise.revenue", "Revenue", revenueFact) : null,
    employees: employeesFact ? factToMetric("enterprise.employees", "Employees", employeesFact) : null,
    footprint: asString(pick(p, ["footprint", "geography", "locations"])),
    footprintState: entity ? avail(entity.availability_state) : "not_loaded",
  };
}

function factToMetric(key: string, label: string, f: FactRow): GovernedMetricValue {
  const raw = pick(f.fact_value, ["value", "amount", "count", "number"]);
  const value = asNumber(raw);
  const withheld = f.availability_state === "withheld";
  return {
    metricKey: key,
    label,
    value: withheld ? null : value,
    unit: asString(pick(f.fact_value, ["unit", "currency"])),
    period: asString(pick(f.fact_value, ["period", "fiscal_year", "year"])),
    availabilityState: withheld ? "withheld" : value === null ? "not_measured" : "available",
    semanticModelVersion: null,
    metricQueryHash: null,
    evidenceRefs: f.evidence_refs ?? [],
    unavailableReason: value === null ? "Underlying source has not been provided or confirmed." : null,
  };
}

export function shapeEntitySummary(entity: KnowledgeEntityRow, facts: FactRow[]): EntitySummaryV1 {
  const fields: EntityFieldValue[] = facts.map((f) => {
    const withheld = f.availability_state === "withheld";
    const raw = pick(f.fact_value, ["value", "amount", "text", "name"]);
    return {
      key: f.fact_type,
      label: humanize(f.fact_type),
      value: withheld ? null : (asNumber(raw) ?? asString(raw)),
      availabilityState: avail(f.availability_state, withheld ? "withheld" : "available"),
      evidenceRefs: f.evidence_refs ?? [],
    };
  });
  return {
    entityRef: entity.entity_ref,
    entityType: entity.entity_type,
    displayName: entity.display_name,
    domainKey: asString(pick(entity.canonical_payload, ["domain", "domain_key"])) ?? entity.entity_type,
    availabilityState: avail(entity.availability_state),
    fields,
    evidenceRefs: entity.accepted_evidence_refs ?? [],
  };
}

export function shapeDomainReadiness(
  domainKey: string,
  label: string,
  entityCount: number,
  openGapCount: number,
  evidenceCoverage: number,
  availability: AvailabilityState = "available",
): DomainReadinessV1 {
  return {
    domainKey,
    label,
    availabilityState: availability,
    evidenceCoverage,
    entityCount: {
      metricKey: `${domainKey}.count`, label: "Entities", value: entityCount, unit: "count",
      period: null, availabilityState: "available", semanticModelVersion: null,
      metricQueryHash: null, evidenceRefs: [],
    },
    openGapCount,
    summary: null,
  };
}

export function shapeEvidenceGap(row: EvidenceGapRow): EvidenceGapV1 {
  const severity = (["low", "medium", "high", "critical"].includes(row.severity ?? "")
    ? row.severity : "medium") as EvidenceGapSeverityLevel;
  const gapState = avail(row.availability_state, "not_loaded");
  return {
    id: row.gap_ref,
    contentClass: "evidence_gap",
    availabilityState: gapState,
    evidenceRefs: [],
    absenceReason: row.why_it_matters,
    gapId: row.gap_ref,
    severity,
    domainKey: row.domain_ref,
    title: row.missing_evidence_type ?? "Missing evidence",
    businessImpact: row.why_it_matters ?? "Missing evidence limits this view.",
    requestedSource: row.source_request_text,
    gapState,
  };
}

/**
 * Compose the enterprise brief from the shaped parts. Keeps EnterpriseBriefV1
 * assembly in one place so the build extension and any test agree.
 */
export function shapeEnterpriseBrief(args: {
  identity: EnterpriseIdentityV1;
  headlineMetrics: GovernedMetricValue[];
  domains: DomainReadinessV1[];
  topGapRefs: string[];
}): EnterpriseBriefV1 {
  return {
    identity: args.identity,
    headlineMetrics: args.headlineMetrics,
    interpretation: null, // Claude-authored interpretation is a separate projection.
    perspectives: [],
    benchmarks: [],
    targets: [],
    domains: args.domains,
    topGapRefs: args.topGapRefs,
  };
}

function humanize(s: string): string {
  return s.replace(/[_.]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

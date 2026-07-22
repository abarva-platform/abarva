// Canonical `cio_tower.facts` row contract, shared by every projection that
// feeds the unified facts layer (v3 CSV templates AND the real `tower_*`
// operational ingest tables). The mart assembler reads ONLY from facts, so
// this shape is the single merge point for the whole Tower CXO story.
//
// The column set, enums, and the "at least one value_* is non-null unless
// value_source=not_loaded" invariant mirror the physical table in
// supabase/migrations/20260628202000_cio_tower_schema_v1.sql. Keeping this in
// one typed place means a tower_* projection row and a v3 CSV projection row
// cannot drift from each other or from the DB before the mart is assembled.

export const CIO_TOWER_FACT_SCOPES = [
  "enterprise_envelope",
  "portfolio_company",
  "shared_services",
  "contract",
  "initiative",
  "system",
  "vendor",
  "kpi",
  "other",
] as const;
export type CioTowerFactScope = (typeof CIO_TOWER_FACT_SCOPES)[number];

export const CIO_TOWER_FACT_VIEWS = [
  "it_budget",
  "vendor_contract",
  "app_run_cost",
  "org_budget",
  "initiative_budget",
  "value",
  "operational_kpi",
  "adoption",
  "risk",
] as const;
export type CioTowerFactView = (typeof CIO_TOWER_FACT_VIEWS)[number];

export const CIO_TOWER_FACT_AMOUNT_TYPES = [
  "opex",
  "capex",
  "run",
  "change",
  "none",
] as const;
export type CioTowerFactAmountType =
  (typeof CIO_TOWER_FACT_AMOUNT_TYPES)[number];

export const CIO_TOWER_FACT_BASES = [
  "committed",
  "actual",
  "forecast",
  "baseline",
  "target",
] as const;
export type CioTowerFactBasis = (typeof CIO_TOWER_FACT_BASES)[number];

export const CIO_TOWER_FACT_UNITS = [
  "usd",
  "pct",
  "count",
  "date",
  "text",
  "bool",
  "ratio",
  "none",
] as const;
export type CioTowerFactUnit = (typeof CIO_TOWER_FACT_UNITS)[number];

// The honesty flag that keeps synthetic demo context from ever reading as
// real client evidence: `tenant_file` is a real ingested row (the tower_*
// connectors), `synthetic` is the v3 demo CSV pack, `derived` is computed,
// `not_loaded` is an intentional gap placeholder.
export const CIO_TOWER_FACT_VALUE_SOURCES = [
  "tenant_file",
  "synthetic",
  "derived",
  "not_loaded",
] as const;
export type CioTowerFactValueSource =
  (typeof CIO_TOWER_FACT_VALUE_SOURCES)[number];

export const CIO_TOWER_FACT_CONFIDENCES = [
  "high",
  "medium",
  "low",
  "not_loaded",
] as const;
export type CioTowerFactConfidence =
  (typeof CIO_TOWER_FACT_CONFIDENCES)[number];

/**
 * A single atomic fact row, write-compatible with `cio_tower.facts`. Field
 * names and JSON encoding match what the existing Meridian projection writes
 * (see scripts/tower/project-meridian-v3-to-cio-tower.mjs `fact()`), so both
 * projections upsert into the same table without a translation step.
 */
export interface CioTowerFactRow {
  fact_key: string;
  tenant_key: string;
  entity_key: string | null;
  entity_type: string;
  measure: string;
  scope: CioTowerFactScope;
  view: CioTowerFactView;
  amount_type: CioTowerFactAmountType;
  basis: CioTowerFactBasis;
  period: string;
  value_numeric: number | null;
  value_text: string | null;
  value_date: string | null;
  value_bool: boolean | null;
  unit: CioTowerFactUnit;
  value_source: CioTowerFactValueSource;
  confidence: CioTowerFactConfidence;
  source_key: string | null;
  source_row: string | null;
  formula_key: string;
  formula_version: string;
  is_rollup_of: string;
  component_of: string;
  superseded_by: string;
  valid_from: string | null;
  valid_to: string | null;
  attributes: string; // JSON-encoded, matching the .mjs json() helper
}

/**
 * Enforces the DB CHECK: a fact must carry at least one value_* unless it is
 * an explicit `not_loaded` placeholder. Projections call this before emitting
 * so a bad row fails in a unit test, not mid-transaction against Azure.
 */
export function factSatisfiesValueInvariant(fact: CioTowerFactRow): boolean {
  if (fact.value_source === "not_loaded") return true;
  return (
    fact.value_numeric !== null ||
    fact.value_text !== null ||
    fact.value_date !== null ||
    fact.value_bool !== null
  );
}

const SAFE_KEY_MAX = 240;

/** Mirrors the .mjs safeKey(): lowercase, non-alphanumeric → single hyphen. */
export function safeKey(
  ...parts: Array<string | number | null | undefined>
): string {
  return parts
    .filter(
      (part) =>
        part !== null && part !== undefined && String(part).trim() !== "",
    )
    .map((part) =>
      String(part)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    )
    .join("::")
    .slice(0, SAFE_KEY_MAX);
}

export function factKey(
  tenantKey: string,
  ...parts: Array<string | number | null | undefined>
): string {
  return `${tenantKey}::${safeKey(...parts)}`;
}

/**
 * The tenant identity a projection run resolves once up front. tower_* tables
 * key on client_id UUID (4 of 6) or tenant_key TEXT (itsm) or client_id TEXT
 * (cmdb); the whole cio_tower.* layer keys on tenant_key. This bundle carries
 * both so a projection can read either source shape and always emit the
 * tenant_key the mart requires.
 */
export interface CioTowerTenantIdentity {
  tenantKey: string;
  clientId: string | null;
  tenantName: string;
}

// ---------------------------------------------------------------------------
// Canonical identity spine.
//
// The mart assembler MUST merge/dedup by canonical identity, never by display
// name — otherwise "Developer Productivity AI", "GitHub Copilot & Codex", and
// "GitHub Copilot Enterprise" read as three different bets. Every fact carries
// its canonical keys and an explicit source_priority in `attributes`, so the
// assembler can pick a winner among rows measuring THE SAME metric for THE
// SAME tool/program/period, while leaving complementary metrics (e.g. Copilot
// license spend vs. Copilot usage) untouched.
// ---------------------------------------------------------------------------

/**
 * Source precedence for the "same canonical metric, same period" winner rule.
 * Higher wins. Kept explicit (not inferred from value_source) so a real
 * extract always beats a template estimate beats a planning assumption, and
 * so the ordering survives if value_source labeling ever drifts.
 */
export const SOURCE_PRIORITY = {
  tenant_file: 3, // real ingested extract with source lineage
  v3_template: 2, // curated V3 template pack
  synthetic: 1, // synthetic / planning assumption
} as const;
export type SourcePriorityTier = keyof typeof SOURCE_PRIORITY;

export interface CanonicalIdentity {
  canonical_tool_key: string | null;
  canonical_program_key: string | null;
  vendor_name: string | null;
  system_name: string | null;
  program_code: string | null;
  metric_key: string;
  /** True unit of the value, preserved even when the DB `unit` enum coerces
   * to `count` (e.g. DORA lead time is hours, ITSM MTTR is minutes). Charts
   * and aVa read this, not the coarse enum, so "22" is never misread. */
  metric_unit: string;
  period_start: string | null;
  period_end: string | null;
  source_priority: number;
}

/**
 * The merge key for the winner rule: same canonical tool/program + same metric
 * + same period. Rows sharing this key are candidates to dedup; rows differing
 * on any component are complementary and both survive.
 */
export function canonicalMergeKey(identity: CanonicalIdentity): string {
  return [
    identity.canonical_tool_key ?? identity.canonical_program_key ?? "__none__",
    identity.metric_key,
    identity.period_start ?? "",
    identity.period_end ?? "",
  ].join("|");
}

/** Merge a canonical identity into a fact's attributes object (pre-JSON). */
export function withCanonicalIdentity(
  attributes: Record<string, unknown>,
  identity: CanonicalIdentity,
): Record<string, unknown> {
  return { ...attributes, canonical: identity };
}

/** Read the canonical identity back off a fact row; null if not stamped. */
export function readCanonicalIdentity(
  fact: Pick<CioTowerFactRow, "attributes">,
): CanonicalIdentity | null {
  try {
    const parsed = JSON.parse(fact.attributes) as {
      canonical?: CanonicalIdentity;
    };
    return parsed.canonical ?? null;
  } catch {
    return null;
  }
}

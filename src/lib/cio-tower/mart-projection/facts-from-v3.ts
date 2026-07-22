// Project the curated V3 template CSVs (budget 08, programs 09, benefits SA08)
// into the same unified cio_tower.facts layer the tower_* operational
// projection feeds. This is the "budget & program & promised-value" half of
// the CXO story that tower_* telemetry alone cannot supply.
//
// Every fact is value_source = "synthetic" with source_priority = v3_template
// (2) — so when real tenant_file telemetry (priority 3) describes the SAME
// canonical metric for the same program/period, the merge prefers the real
// extract. Canonical program keys are derived deterministically from the V3
// program_code so the tool→program crosswalk can attach telemetry to them.
//
// Pure functions over already-parsed CSV row objects — the CLI does the file
// read; the mapping is testable against real fixture rows without I/O.

import {
  type CioTowerFactRow,
  type CioTowerFactView,
  type CioTowerFactScope,
  type CanonicalIdentity,
  type CioTowerTenantIdentity,
  factKey,
  safeKey,
  withCanonicalIdentity,
  SOURCE_PRIORITY,
} from "./facts-schema";
import { BUDGET_METRIC_KEYS, PROGRAM_METRIC_KEYS } from "./mart-metric-keys";

const FORMULA_VERSION = "v3_template_to_facts_v1";

export type CsvRow = Record<string, string>;

function num(value: string | undefined | null): number {
  if (value === null || value === undefined) return 0;
  const cleaned = String(value)
    .trim()
    .replace(/[$,%\s]/g, "");
  if (!cleaned || cleaned === "not_provided") return 0;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Deterministic canonical program key from a V3 program_code, so the crosswalk
 * (tool → canonical_program_key) and the V3 program facts agree on identity. */
export function programKeyFromCode(programCode: string): string {
  return `program::${safeKey(programCode)}`;
}

interface BuildV3FactArgs {
  tenantKey: string;
  keyParts: Array<string | number>;
  measure: string;
  view: CioTowerFactView;
  scope: CioTowerFactScope;
  valueNumeric: number;
  sourceFile: string;
  sourceRow: string | null;
  canonical: CanonicalIdentity;
  attributes?: Record<string, unknown>;
}

function buildV3Fact(args: BuildV3FactArgs): CioTowerFactRow {
  return {
    fact_key: factKey(args.tenantKey, ...args.keyParts),
    tenant_key: args.tenantKey,
    entity_key: null,
    entity_type: "other",
    measure: args.measure,
    scope: args.scope,
    view: args.view,
    amount_type: args.view === "app_run_cost" ? "run" : "none",
    basis: "committed",
    period: "fy26",
    value_numeric: args.valueNumeric,
    value_text: null,
    value_date: null,
    value_bool: null,
    unit: "usd",
    value_source: "synthetic",
    confidence: "medium",
    source_key: args.sourceFile,
    source_row: args.sourceRow,
    formula_key: "",
    formula_version: FORMULA_VERSION,
    is_rollup_of: "",
    component_of: "",
    superseded_by: "",
    valid_from: null,
    valid_to: null,
    attributes: JSON.stringify(
      withCanonicalIdentity(
        { source_system: "V3 template", ...(args.attributes ?? {}) },
        args.canonical,
      ),
    ),
  };
}

function budgetCanonical(metricKey: string): CanonicalIdentity {
  return {
    canonical_tool_key: null,
    canonical_program_key: null,
    vendor_name: null,
    system_name: "Enterprise IT budget",
    program_code: null,
    metric_key: metricKey,
    metric_unit: "usd",
    period_start: null,
    period_end: null,
    source_priority: SOURCE_PRIORITY.v3_template,
  };
}

/**
 * Budget envelope (08_it_budget_spend_value.csv). Sums the atomic budget facts
 * into total / run / change envelope facts. Rows that are narrative (not
 * budget facts) are ignored.
 */
export function factsFromV3Budget(
  rows: readonly CsvRow[],
  identity: CioTowerTenantIdentity,
): CioTowerFactRow[] {
  const atomic = rows.filter(
    (r) => r.budget_row_level === "atomic_budget_fact",
  );
  let total = 0;
  let run = 0;
  let change = 0;
  for (const r of atomic) {
    total += num(r.budget_amount_usd);
    run += num(r.run_budget_usd);
    change += num(r.change_budget_usd);
  }
  const file = "08_it_budget_spend_value.csv";
  const facts: CioTowerFactRow[] = [];
  if (total > 0) {
    facts.push(
      buildV3Fact({
        tenantKey: identity.tenantKey,
        keyParts: ["budget-total"],
        measure: "FY26 total IT budget",
        view: "it_budget",
        scope: "enterprise_envelope",
        valueNumeric: total,
        sourceFile: file,
        sourceRow: `sum(atomic_budget_fact) n=${atomic.length}`,
        canonical: budgetCanonical(BUDGET_METRIC_KEYS.total),
      }),
      buildV3Fact({
        tenantKey: identity.tenantKey,
        keyParts: ["budget-run"],
        measure: "FY26 run budget",
        view: "it_budget",
        scope: "enterprise_envelope",
        valueNumeric: run,
        sourceFile: file,
        sourceRow: `sum(run_budget_usd) n=${atomic.length}`,
        canonical: budgetCanonical(BUDGET_METRIC_KEYS.run),
      }),
      buildV3Fact({
        tenantKey: identity.tenantKey,
        keyParts: ["budget-change"],
        measure: "FY26 change budget",
        view: "it_budget",
        scope: "enterprise_envelope",
        valueNumeric: change,
        sourceFile: file,
        sourceRow: `sum(change_budget_usd) n=${atomic.length}`,
        canonical: budgetCanonical(BUDGET_METRIC_KEYS.change),
      }),
    );
  }
  return facts;
}

function programCanonical(
  programCode: string,
  programName: string,
  metricKey: string,
): CanonicalIdentity {
  return {
    canonical_tool_key: null,
    canonical_program_key: programKeyFromCode(programCode),
    vendor_name: null,
    system_name: programName,
    program_code: programCode,
    metric_key: metricKey,
    metric_unit: "usd",
    period_start: null,
    period_end: null,
    source_priority: SOURCE_PRIORITY.v3_template,
  };
}

/**
 * Funded programs (09_programs_initiatives.csv). Emits an approved-funding fact
 * per funded program, and a promised-value fact when planned/target value is
 * present. Programs with no approved funding are skipped (they surface as
 * candidates or via SA08 only).
 */
export function factsFromV3Programs(
  rows: readonly CsvRow[],
  identity: CioTowerTenantIdentity,
): CioTowerFactRow[] {
  const file = "09_programs_initiatives.csv";
  const facts: CioTowerFactRow[] = [];
  for (const r of rows) {
    const code = (r.program_code ?? "").trim();
    if (!code) continue;
    const funding = num(r.approved_funding_usd);
    if (funding <= 0) continue;
    const name = (r.business_name ?? code).trim();
    facts.push(
      buildV3Fact({
        tenantKey: identity.tenantKey,
        keyParts: ["program-funding", code],
        measure: `${name} approved funding`,
        view: "initiative_budget",
        scope: "initiative",
        valueNumeric: funding,
        sourceFile: file,
        sourceRow: r.record_id ?? code,
        canonical: programCanonical(
          code,
          name,
          PROGRAM_METRIC_KEYS.approvedFunding,
        ),
        attributes: {
          executive_owner: r.executive_owner ?? null,
          finance_owner: r.finance_owner ?? null,
          funding_status: r.funding_status ?? null,
        },
      }),
    );
    const planned = num(r.planned_value_usd) || num(r.target_value_usd);
    if (planned > 0) {
      facts.push(
        buildV3Fact({
          tenantKey: identity.tenantKey,
          keyParts: ["program-promised", code],
          measure: `${name} promised value`,
          view: "value",
          scope: "initiative",
          valueNumeric: planned,
          sourceFile: file,
          sourceRow: r.record_id ?? code,
          canonical: programCanonical(
            code,
            name,
            PROGRAM_METRIC_KEYS.promisedValue,
          ),
        }),
      );
    }
  }
  return facts;
}

/**
 * Benefits ledger (SA08). The authoritative source for promised value,
 * finance-validated value, and per-program usage/adoption. Keyed to the
 * program via ai_program_id. Only emits finance-validated facts when finance
 * actually validated (never fabricates a realized number).
 */
export function factsFromV3Benefits(
  rows: readonly CsvRow[],
  identity: CioTowerTenantIdentity,
  programIdToCode: Record<string, string> = {},
): CioTowerFactRow[] {
  const file = "SA08_AI_Benefits_Realization_Usage_Ledger.csv";
  const facts: CioTowerFactRow[] = [];
  for (const r of rows) {
    const programId = (r.ai_program_id ?? "").trim();
    if (!programId) continue;
    const code = programIdToCode[programId] ?? programId;
    const name = (r.program_name ?? code).trim();
    const promised = num(r.promised_value_usd);
    if (promised > 0) {
      facts.push(
        buildV3Fact({
          tenantKey: identity.tenantKey,
          keyParts: ["benefit-promised", code],
          measure: `${name} promised value (benefits ledger)`,
          view: "value",
          scope: "initiative",
          valueNumeric: promised,
          sourceFile: file,
          sourceRow: r.source_record_id ?? programId,
          canonical: programCanonical(
            code,
            name,
            PROGRAM_METRIC_KEYS.promisedValue,
          ),
          attributes: {
            vendor_name: r.vendor_name ?? null,
            tool_name: r.tool_name ?? null,
          },
        }),
      );
    }
    const validated = num(r.finance_validated_value_usd);
    // Only when finance actually validated — realized value is never invented.
    if (
      validated > 0 &&
      (r.finance_validation_status ?? "").toLowerCase() !== "not_validated"
    ) {
      facts.push(
        buildV3Fact({
          tenantKey: identity.tenantKey,
          keyParts: ["benefit-validated", code],
          measure: `${name} finance-validated value`,
          view: "value",
          scope: "initiative",
          valueNumeric: validated,
          sourceFile: file,
          sourceRow: r.source_record_id ?? programId,
          canonical: programCanonical(
            code,
            name,
            PROGRAM_METRIC_KEYS.financeValidatedValue,
          ),
          attributes: {
            finance_validation_status: r.finance_validation_status ?? null,
            tower_claim_allowed: r.tower_claim_allowed ?? null,
          },
        }),
      );
    }
  }
  return facts;
}

export interface V3FactInput {
  budget?: readonly CsvRow[];
  programs?: readonly CsvRow[];
  benefits?: readonly CsvRow[];
  /** SA08 ai_program_id → 09 program_code, so benefits attach to the same
   * canonical program as the funding rows. */
  programIdToCode?: Record<string, string>;
}

export function projectV3ToFacts(
  input: V3FactInput,
  identity: CioTowerTenantIdentity,
): CioTowerFactRow[] {
  return [
    ...factsFromV3Budget(input.budget ?? [], identity),
    ...factsFromV3Programs(input.programs ?? [], identity),
    ...factsFromV3Benefits(
      input.benefits ?? [],
      identity,
      input.programIdToCode ?? {},
    ),
  ];
}

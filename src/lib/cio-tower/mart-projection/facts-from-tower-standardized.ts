// Facts from the `tower-standardized-v1/` T-family.
//
// WHY THIS EXISTS
//
// Two source trees hold Tower data, and until now the mart projection only read
// the smaller one:
//
//   datasets/tenant-inputs/<tenant>/standard-2026-07-v3/   18 files, 3 tenants  <- read
//   tower-standardized-v1/<tenant>/                        45 files, 5 tenants  <- NOT read
//
// The second tree carries the full T00–T13 AI Control Tower family for every
// tenant, and — critically — it is *properly keyed*. `T08_spend-contracts.csv`
// joins to `T01_initiative-registry.csv` on a real `initiative_id`
// (`SHA-INIT-001`), and T01 carries an `owner_role` for every initiative.
//
// That is precisely the data the live surface was missing. Verified on the
// deployed tenants 2026-07-23/24:
//
//   · `ai_tagged_spend_usd` = $0 on all 250 AI portfolio rows, because nothing
//     joined vendor/tool spend to a program.
//   · "No owner recorded" on every decision row, because no owner reached the
//     lane.
//
// Both are answered by T01 + T08. This module reads them and emits the same
// `CioTowerFactRow` shape `facts-from-v3.ts` produces, so the existing
// precedence-merge and mart assembler are reused unchanged.
//
// Scope rule: only families a Tower surface reads today. T02/T05/T06/T09–T13
// are deliberately not read yet — no tab renders milestones, persona
// productivity or DORA, and generating facts nothing displays is how the AI
// portfolio ended up 97% unreachable candidate rows.

import {
  type CanonicalIdentity,
  type CioTowerFactRow,
  type CioTowerFactScope,
  type CioTowerFactView,
  type CioTowerTenantIdentity,
  SOURCE_PRIORITY,
  factKey,
  withCanonicalIdentity,
} from "./facts-schema";
import { programKeyFromCode } from "./facts-from-v3";
import { PROGRAM_METRIC_KEYS } from "./mart-metric-keys";

export type CsvRow = Record<string, string>;

const FORMULA_VERSION = "tower_standardized_v1";

/** `T08` spend rolls into `ai_tagged_spend` via this key (SPEND_METRIC_KEYS). */
const AI_TOOL_SPEND_METRIC = "ai_tool_monthly_cost_usd";

function num(value: string | undefined | null): number {
  if (value === null || value === undefined) return 0;
  const cleaned = String(value)
    .trim()
    .replace(/[$,%\s]/g, "");
  if (!cleaned || cleaned === "not_provided" || cleaned === "not_applicable") {
    return 0;
  }
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(value: string | undefined | null): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 && trimmed !== "not_provided" ? trimmed : null;
}

function programCanonical(
  initiativeId: string,
  initiativeName: string,
  metricKey: string,
  vendorName: string | null = null,
): CanonicalIdentity {
  return {
    canonical_tool_key: null,
    canonical_program_key: programKeyFromCode(initiativeId),
    vendor_name: vendorName,
    system_name: initiativeName,
    program_code: initiativeId,
    metric_key: metricKey,
    metric_unit: "usd",
    period_start: null,
    period_end: null,
    source_priority: SOURCE_PRIORITY.v3_template,
  };
}

interface BuildFactArgs {
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

function buildFact(args: BuildFactArgs): CioTowerFactRow {
  return {
    fact_key: factKey(args.tenantKey, ...args.keyParts),
    tenant_key: args.tenantKey,
    entity_key: null,
    entity_type: "other",
    measure: args.measure,
    scope: args.scope,
    view: args.view,
    amount_type: "none",
    basis: "committed",
    period: "fy26",
    value_numeric: args.valueNumeric,
    value_text: null,
    value_date: null,
    value_bool: null,
    unit: "usd",
    // The T-family is a tenant-delivered standardized packet, not a derived
    // estimate — the same precedence tier the V3 templates get.
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
        {
          source_system: "Tower standardized v1",
          ...(args.attributes ?? {}),
        },
        args.canonical,
      ),
    ),
  };
}

/**
 * `T01_initiative-registry.csv` — the join spine.
 *
 * Emits promised value and finance-validated value per initiative, and carries
 * `owner_role` / `business_sponsor_role` on the fact attributes so the lane can
 * stop rendering "No owner recorded".
 *
 * `measured_value_usd` maps to finance-validated, NOT to claimable. The claim
 * gate stays where it is; measuring a benefit is not permission to book it.
 */
export function factsFromTowerInitiatives(
  rows: readonly CsvRow[],
  identity: CioTowerTenantIdentity,
): CioTowerFactRow[] {
  const file = "ai-control-tower/T01_initiative-registry.csv";
  const facts: CioTowerFactRow[] = [];

  for (const r of rows) {
    const id = text(r.initiative_id);
    if (!id) continue;
    const name = text(r.initiative_name) ?? id;
    const owner = text(r.owner_role);
    const sponsor = text(r.business_sponsor_role);
    const attributes = {
      executive_owner: owner,
      finance_owner: sponsor,
      business_area: text(r.business_area),
      portfolio_segment: text(r.portfolio_segment),
      stage: text(r.stage),
      status: text(r.status),
      evidence_status: text(r.evidence_status),
      scale_decision: text(r.scale_decision),
      value_confidence: text(r.value_confidence),
    };

    const promised = num(r.promised_benefit_usd);
    if (promised > 0) {
      facts.push(
        buildFact({
          tenantKey: identity.tenantKey,
          keyParts: ["tsv1-initiative-promised", id],
          measure: `${name} promised value`,
          view: "value",
          scope: "initiative",
          valueNumeric: promised,
          sourceFile: file,
          sourceRow: id,
          canonical: programCanonical(
            id,
            name,
            PROGRAM_METRIC_KEYS.promisedValue,
          ),
          attributes,
        }),
      );
    }

    const measured = num(r.measured_value_usd);
    if (measured > 0) {
      facts.push(
        buildFact({
          tenantKey: identity.tenantKey,
          keyParts: ["tsv1-initiative-measured", id],
          measure: `${name} finance-validated value`,
          view: "value",
          scope: "initiative",
          valueNumeric: measured,
          sourceFile: file,
          sourceRow: id,
          canonical: programCanonical(
            id,
            name,
            PROGRAM_METRIC_KEYS.financeValidatedValue,
          ),
          attributes,
        }),
      );
    }
  }

  return facts;
}

/**
 * `T08_spend-contracts.csv` — the `$0 AI-tagged` fix.
 *
 * Every row joins to an initiative on `initiative_id` and names a
 * `vendor_or_tool`. Two facts per row:
 *
 *   · `budget_fy26_usd` → approved funding for the initiative
 *   · `actual_ytd_usd`  → AI-tagged spend, which is what the portfolio's bubble
 *     size, spend lens and vendor-concentration tile all read
 *
 * Actual-YTD is used for the AI-tagged figure rather than budget because the
 * tile says "AI-tagged spend", not "AI-tagged budget" — reporting committed
 * budget as spend would overstate it.
 *
 * Rows whose `vendor_or_tool` is "internal" still carry funding but are not
 * vendor-attributed, so they are excluded from the vendor-concentration input
 * by leaving `vendor_name` null.
 */
export function factsFromTowerSpend(
  rows: readonly CsvRow[],
  identity: CioTowerTenantIdentity,
  initiativeNames: Readonly<Record<string, string>>,
): CioTowerFactRow[] {
  const file = "ai-control-tower/T08_spend-contracts.csv";
  const facts: CioTowerFactRow[] = [];

  for (const r of rows) {
    const initiativeId = text(r.initiative_id);
    if (!initiativeId) continue;
    const lineId = text(r.line_id) ?? initiativeId;
    const name = initiativeNames[initiativeId] ?? initiativeId;
    const toolRaw = text(r.vendor_or_tool);
    const vendor =
      toolRaw && toolRaw.toLowerCase() !== "internal" ? toolRaw : null;

    const attributes = {
      vendor_or_tool: toolRaw,
      spend_category: text(r.spend_category),
      renewal_date: text(r.renewal_date),
      contract_value_usd: num(r.contract_value_usd) || null,
      unit_economic_note: text(r.unit_economic_note),
    };

    const budget = num(r.budget_fy26_usd);
    if (budget > 0) {
      facts.push(
        buildFact({
          tenantKey: identity.tenantKey,
          keyParts: ["tsv1-spend-budget", lineId],
          measure: `${name} approved funding`,
          view: "initiative_budget",
          scope: "initiative",
          valueNumeric: budget,
          sourceFile: file,
          sourceRow: lineId,
          canonical: programCanonical(
            initiativeId,
            name,
            PROGRAM_METRIC_KEYS.approvedFunding,
            vendor,
          ),
          attributes,
        }),
      );
    }

    const actual = num(r.actual_ytd_usd);
    if (actual > 0) {
      facts.push(
        buildFact({
          tenantKey: identity.tenantKey,
          keyParts: ["tsv1-spend-actual", lineId],
          measure: `${name} AI-tagged spend`,
          view: "vendor_contract",
          scope: "initiative",
          valueNumeric: actual,
          sourceFile: file,
          sourceRow: lineId,
          canonical: programCanonical(
            initiativeId,
            name,
            AI_TOOL_SPEND_METRIC,
            vendor,
          ),
          attributes,
        }),
      );
    }
  }

  return facts;
}

export interface TowerStandardizedInput {
  initiatives?: readonly CsvRow[];
  spend?: readonly CsvRow[];
}

/** Initiative id → display name, so spend rows can label their program. */
export function initiativeNameIndex(
  rows: readonly CsvRow[],
): Record<string, string> {
  const index: Record<string, string> = {};
  for (const r of rows) {
    const id = text(r.initiative_id);
    if (!id) continue;
    index[id] = text(r.initiative_name) ?? id;
  }
  return index;
}

export function projectTowerStandardizedToFacts(
  input: TowerStandardizedInput,
  identity: CioTowerTenantIdentity,
): CioTowerFactRow[] {
  const initiatives = input.initiatives ?? [];
  const names = initiativeNameIndex(initiatives);
  return [
    ...factsFromTowerInitiatives(initiatives, identity),
    ...factsFromTowerSpend(input.spend ?? [], identity, names),
  ];
}

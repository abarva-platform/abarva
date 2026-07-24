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
 * `T01_initiative-registry.csv` — identity and ownership only.
 *
 * T01 carries a denormalised copy of promised/measured value, but it is NOT the
 * source of record for it and is not reliably populated: Meridian's T01 has
 * both columns empty on all 7 rows. `T07_benefit-realization.csv` is the actual
 * benefit ledger and is 100% populated on every tenant. Value comes from there;
 * T01 supplies the name and the owner, which is what stops the lane rendering
 * "No owner recorded".
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

    // Identity + ownership only. An initiative with no money yet still needs a
    // lane, so this emits a text-valued anchor fact rather than a fabricated
    // zero — the value invariant is satisfied without inventing a number.
    facts.push({
      ...buildFact({
        tenantKey: identity.tenantKey,
        keyParts: ["tsv1-initiative", id],
        measure: `${name} initiative`,
        view: "initiative_budget",
        scope: "initiative",
        valueNumeric: 0,
        sourceFile: file,
        sourceRow: id,
        canonical: programCanonical(id, name, "initiative_registered"),
        attributes,
      }),
      value_numeric: null,
      value_text: name,
      unit: "count",
    });
  }

  return facts;
}

/**
 * `T08_spend-contracts.csv` — approved funding and vendor attribution.
 *
 * Every row joins to an initiative on `initiative_id` and names a
 * `vendor_or_tool`. One fact per initiative:
 *
 *   · `budget_fy26_usd` → approved funding
 *
 * `actual_ytd_usd` is NOT emitted as AI-tagged spend — see the note at the
 * emission site. T08 is total delivery cost across `labor` / `vendor_license` /
 * `cloud_infra` / `si_services`, most of it non-AI vendors. AI-tagged spend
 * comes from T03.
 *
 * Rows whose `vendor_or_tool` is "internal" still carry funding but are not
 * vendor-attributed, so they are excluded from the vendor-concentration input
 * by leaving `vendor_name` null.
 */
export function factsFromTowerSpend(
  rows: readonly CsvRow[],
  identity: CioTowerTenantIdentity,
  initiativeNames: Readonly<Record<string, string>>,
  aiShareByInitiative: Readonly<Record<string, number>> = {},
): CioTowerFactRow[] {
  const file = "ai-control-tower/T08_spend-contracts.csv";

  // AGGREGATE PER INITIATIVE BEFORE EMITTING.
  //
  // T08 carries one row per initiative *per vendor* — four lines for
  // SHA-INIT-001 (internal, AWS, Teradata, SAS). Emitting a fact per line makes
  // them collide: `canonicalMergeKey` is
  // `canonical_tool_key ?? canonical_program_key` + metric_key, so four lines
  // with the same program key and the same metric are treated as four
  // assertions of ONE fact, and the merge keeps a single winner.
  //
  // That silently dropped 3 of every 4 spend rows. Because T08's per-initiative
  // values run 1:2:3:4, keeping the first yielded exactly one tenth of the true
  // total — source $1,031.2M projected as $103.1M. The source→mart
  // reconciliation in the delta report is what caught it.
  //
  // The lane wants initiative-level money, so summing here is both correct and
  // the fix. Vendor detail is preserved in `attributes.vendor_breakdown` for a
  // surface that wants it, rather than being thrown away.
  interface SpendAggregate {
    initiativeId: string;
    budget: number;
    actual: number;
    contract: number;
    vendors: Array<{ vendor: string; budget: number; actual: number }>;
    lineIds: string[];
    renewalDates: string[];
  }

  const byInitiative = new Map<string, SpendAggregate>();

  for (const r of rows) {
    const initiativeId = text(r.initiative_id);
    if (!initiativeId) continue;
    let agg = byInitiative.get(initiativeId);
    if (!agg) {
      agg = {
        initiativeId,
        budget: 0,
        actual: 0,
        contract: 0,
        vendors: [],
        lineIds: [],
        renewalDates: [],
      };
      byInitiative.set(initiativeId, agg);
    }
    const budget = num(r.budget_fy26_usd);
    const actual = num(r.actual_ytd_usd);
    agg.budget += budget;
    agg.actual += actual;
    agg.contract += num(r.contract_value_usd);
    agg.lineIds.push(text(r.line_id) ?? initiativeId);
    const renewal = text(r.renewal_date);
    if (renewal) agg.renewalDates.push(renewal);
    const vendor = text(r.vendor_or_tool);
    if (vendor && vendor.toLowerCase() !== "internal") {
      agg.vendors.push({ vendor, budget, actual });
    }
  }

  const facts: CioTowerFactRow[] = [];

  for (const agg of byInitiative.values()) {
    const name = initiativeNames[agg.initiativeId] ?? agg.initiativeId;
    // The largest vendor by spend labels the aggregate, so vendor concentration
    // has something to read; the full breakdown rides in attributes.
    const topVendor =
      [...agg.vendors].sort((a, b) => b.actual - a.actual)[0]?.vendor ?? null;
    const attributes = {
      vendor_breakdown: agg.vendors,
      contract_value_usd: agg.contract || null,
      actual_ytd_usd: agg.actual || null,
      renewal_date: agg.renewalDates[0] ?? null,
      spend_line_count: agg.lineIds.length,
    };
    const sourceRow = agg.lineIds[0] ?? agg.initiativeId;

    if (agg.budget > 0) {
      facts.push(
        buildFact({
          tenantKey: identity.tenantKey,
          keyParts: ["tsv1-spend-budget", agg.initiativeId],
          measure: `${name} approved funding`,
          view: "initiative_budget",
          scope: "initiative",
          valueNumeric: agg.budget,
          sourceFile: file,
          sourceRow,
          canonical: programCanonical(
            agg.initiativeId,
            name,
            PROGRAM_METRIC_KEYS.approvedFunding,
            topVendor,
          ),
          attributes,
        }),
      );
    }

    // AI-tagged spend = this initiative's delivery spend x its AI share.
    //
    // AI programmes ARE transformation programmes, so the AI investment is
    // programme money, not the tool licences — those are a rounding error
    // beside it. But not all of a programme's money is AI: an `ai_enabled`
    // modernization spends most of its budget on the platform it is
    // modernising. `T01.ai_investment_share_pct` carries the split, and
    // `T00_ai-investment-super-template` — the AI investment register — is
    // what decides the tag. See scripts/tower/tag-ai-initiatives.mjs.
    const aiShare = aiShareByInitiative[agg.initiativeId] ?? 0;
    const aiSpend = Math.round(agg.actual * aiShare);
    if (aiSpend > 0) {
      facts.push(
        buildFact({
          tenantKey: identity.tenantKey,
          keyParts: ["tsv1-spend-ai", agg.initiativeId],
          measure: `${name} AI-tagged spend`,
          view: "vendor_contract",
          scope: "initiative",
          valueNumeric: aiSpend,
          sourceFile: file,
          sourceRow,
          canonical: programCanonical(
            agg.initiativeId,
            name,
            AI_TOOL_SPEND_METRIC,
            topVendor,
          ),
          attributes: { ...attributes, ai_investment_share: aiShare },
        }),
      );
    }

    // The FULL `actual_ytd_usd` is deliberately NOT emitted as AI-tagged spend.
    //
    // An earlier version mapped it to `ai_tool_monthly_cost_usd`, which rolls
    // into `ai_tagged_spend`. That was wrong, and it read as an airline
    // spending $539.2M a year on AI against a $2,600M IT budget.
    //
    // T08's own `spend_category` values are `labor` / `vendor_license` /
    // `cloud_infra` / `si_services` — the four cost categories of an
    // initiative's TOTAL delivery cost — and its vendors are the core IT
    // estate: Sabre, Amadeus and Jeppesen (reservations and flight planning),
    // Honeywell, Collins and GE Aerospace (avionics), Okta, Splunk, Datadog.
    // An AI initiative that replatforms onto Sabre spends most of that money on
    // Sabre, not on AI. It is programme delivery spend, not AI spend.
    //
    // AI-tagged spend comes from `T03_tool-usage-monthly.csv` instead, which
    // carries per-tool `cost_usd` for the actual AI tools. Actual-YTD stays on
    // the fact as an attribute so a burn-rate surface can still read it.
  }

  return facts;
}

/**
 * `T07_benefit-realization.csv` — the benefit ledger, and the source of record
 * for promised and finance-validated value.
 *
 * 100% populated on all five tenants (14 / 126 / 30 / 10 / 14 rows), every row
 * carrying an `initiative_id`. `measured_value_usd` maps to finance-validated,
 * NOT to claimable — the claim gate stays where it is, and measuring a benefit
 * is not permission to book it.
 */
export function factsFromTowerBenefits(
  rows: readonly CsvRow[],
  identity: CioTowerTenantIdentity,
  initiativeNames: Readonly<Record<string, string>>,
): CioTowerFactRow[] {
  const file = "ai-control-tower/T07_benefit-realization.csv";
  const facts: CioTowerFactRow[] = [];

  // One initiative can carry several benefit lines; sum them, as with T08.
  const byInitiative = new Map<
    string,
    { promised: number; measured: number; blocked: number; rows: number }
  >();
  for (const r of rows) {
    const id = text(r.initiative_id);
    if (!id) continue;
    const agg = byInitiative.get(id) ?? {
      promised: 0,
      measured: 0,
      blocked: 0,
      rows: 0,
    };
    agg.promised += num(r.promised_benefit_usd);
    agg.measured += num(r.measured_value_usd);
    agg.blocked += num(r.unrealized_or_blocked_value_usd);
    agg.rows += 1;
    byInitiative.set(id, agg);
  }

  for (const [id, agg] of byInitiative) {
    const name = initiativeNames[id] ?? id;
    const attributes = { benefit_line_count: agg.rows };
    if (agg.promised > 0) {
      facts.push(
        buildFact({
          tenantKey: identity.tenantKey,
          keyParts: ["tsv1-benefit-promised", id],
          measure: `${name} promised value`,
          view: "value",
          scope: "initiative",
          valueNumeric: agg.promised,
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
    if (agg.measured > 0) {
      facts.push(
        buildFact({
          tenantKey: identity.tenantKey,
          keyParts: ["tsv1-benefit-measured", id],
          measure: `${name} finance-validated value`,
          view: "value",
          scope: "initiative",
          valueNumeric: agg.measured,
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

export interface TowerStandardizedInput {
  initiatives?: readonly CsvRow[];
  spend?: readonly CsvRow[];
  benefits?: readonly CsvRow[];
  toolUsage?: readonly CsvRow[];
}

/**
 * `T03_tool-usage-monthly.csv` — the real AI-tagged spend, and adoption.
 *
 * This is what a CIO means by "AI spend": per-tool licence and consumption cost
 * for the AI tools themselves (M365 Copilot, the coding assistants, the agent
 * platforms), one row per tool per month. SkyHarbor's twelve tools over twelve
 * months total $10.2M — 0.4% of a $2,600M IT budget, which is the right order
 * of magnitude for 2026. The $539.2M this surface used to report came from
 * mis-reading T08 programme delivery cost as AI spend.
 *
 * Emitted per period, not summed here: `canonicalMergeKey` includes the period,
 * so twelve monthly facts survive the merge and `assembleMartFromFacts` adds
 * them into an annual figure. Summing here instead would work, but it would
 * throw away the month, and the spend lens wants the trend.
 *
 * `active_users` rides along as adoption evidence — it is what
 * `usageSupportedUsd` reads to decide how much promised value is actually
 * backed by someone using the thing.
 */
export function factsFromTowerToolUsage(
  rows: readonly CsvRow[],
  identity: CioTowerTenantIdentity,
): CioTowerFactRow[] {
  const file = "ai-control-tower/T03_tool-usage-monthly.csv";
  const facts: CioTowerFactRow[] = [];

  for (const r of rows) {
    const tool = text(r.tool_name);
    if (!tool) continue;
    const period = text(r.period);
    const vendor = text(r.vendor);
    const toolKey = programKeyFromCode(tool);
    const canonical = (metricKey: string, unit: string): CanonicalIdentity => ({
      canonical_tool_key: toolKey,
      canonical_program_key: null,
      vendor_name: vendor,
      system_name: tool,
      program_code: null,
      metric_key: metricKey,
      metric_unit: unit,
      period_start: period ? `${period}-01` : null,
      period_end: period ? `${period}-01` : null,
      source_priority: SOURCE_PRIORITY.v3_template,
    });
    const attributes = {
      tool_name: tool,
      vendor,
      period,
      business_function: text(r.business_function),
      licensed_users: num(r.licensed_users) || null,
      active_users: num(r.active_users) || null,
      policy_status: text(r.policy_status),
    };

    const cost = num(r.cost_usd);
    if (cost > 0) {
      facts.push(
        buildFact({
          tenantKey: identity.tenantKey,
          keyParts: ["tsv1-tool-cost", tool, period ?? "fy26"],
          measure: `${tool} AI tool cost`,
          view: "vendor_contract",
          scope: "system",
          valueNumeric: cost,
          sourceFile: file,
          sourceRow: period ? `${tool}/${period}` : tool,
          canonical: canonical(AI_TOOL_SPEND_METRIC, "usd"),
          attributes,
        }),
      );
    }

    const active = num(r.active_users);
    if (active > 0) {
      facts.push({
        ...buildFact({
          tenantKey: identity.tenantKey,
          keyParts: ["tsv1-tool-active", tool, period ?? "fy26"],
          measure: `${tool} active users`,
          view: "adoption",
          scope: "system",
          valueNumeric: active,
          sourceFile: file,
          sourceRow: period ? `${tool}/${period}` : tool,
          canonical: canonical("ai_tool_active_users", "users"),
          attributes,
        }),
        unit: "count",
      });
    }
  }

  return facts;
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

/** Initiative id → AI investment share (0..1), from T01's ai_classification. */
export function aiShareIndex(rows: readonly CsvRow[]): Record<string, number> {
  const index: Record<string, number> = {};
  for (const r of rows) {
    const id = text(r.initiative_id);
    if (!id) continue;
    const pct = num(r.ai_investment_share_pct);
    // An untagged packet predates the AI register. Treating it as 100% AI is
    // the assumption that caused this whole problem, so it is 0 until tagged.
    index[id] = pct > 0 ? pct / 100 : 0;
  }
  return index;
}

export function projectTowerStandardizedToFacts(
  input: TowerStandardizedInput,
  identity: CioTowerTenantIdentity,
): CioTowerFactRow[] {
  const initiatives = input.initiatives ?? [];
  const names = initiativeNameIndex(initiatives);
  const aiShare = aiShareIndex(initiatives);
  return [
    ...factsFromTowerInitiatives(initiatives, identity),
    ...factsFromTowerSpend(input.spend ?? [], identity, names, aiShare),
    ...factsFromTowerToolUsage(input.toolUsage ?? [], identity),
    ...factsFromTowerBenefits(input.benefits ?? [], identity, names),
  ];
}

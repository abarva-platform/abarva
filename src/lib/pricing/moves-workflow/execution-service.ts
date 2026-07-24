/**
 * Nexus Pricing Engine — PR5 estimate execution (brief §9.4).
 *
 * Given a complete, validated estimate: loads the PR4 reference pack + rate
 * resolution, calls PR4's REAL `runEffortEngine` entry point (never a
 * re-implementation of its math), persists the resulting line items
 * (replace-on-rerun via `estimate-repository.ts`), and shapes the results
 * brief §9.4 asks for.
 *
 * ## Honesty disclosures for the breakdowns this module derives
 *
 * PR4's `EffortLineItem` has no "internal vs external", "cash vs absorbed
 * capacity", or "one-time vs recurring" flag — those breakdowns are
 * DERIVED here from the closest REAL signal available, every derivation
 * disclosed rather than silently presented as a first-class engine output:
 *
 *   - **internal vs external** / **cash vs absorbed capacity** both reuse
 *     `pricing_roles.internal_external_default` (a real PR1/PR2 taxonomy
 *     column: `'internal' | 'external'`). The cash/absorbed-capacity lens is
 *     the SAME split under a different label (external role cost = cash
 *     outlay; internal role cost = absorbed capacity), a disclosed planning
 *     simplification, not a treasury cash-flow determination. As of the PR4
 *     seed taxonomy every role is `'internal'` (grepped
 *     `datasets/reference/pricing-engine-v1/pricing_roles.csv` — zero
 *     `'external'` rows exist yet), so both breakdowns will show 100%
 *     internal/absorbed against today's seed data — an honest reflection of
 *     the current reference pack, not a bug in this module.
 *   - **one-time vs recurring**: PR4's effort engine only computes
 *     ONE-TIME project delivery effort — it has no modeled steady-state run
 *     cost. The one exception is the `ai_accelerated` scenario's
 *     `pricing_agent_costs` lines (`SCENARIO-AI-ACCELERATION` activity pack
 *     code), some of which are genuinely recurring per their own `unit`
 *     column (e.g. `"USD/month"`), so this module reads the ORIGINAL
 *     `PricingAgentCostRow.unit` for those specific lines (matched by
 *     `rule_code === agent_cost_code`) to split them; every other line is
 *     one-time by construction.
 *   - **change/training/adoption/governance/transition breakdown**: buckets
 *     the REAL `shared_nontechnical` activity-pack codes (`AP-SHARED-*`)
 *     into named groups by their own real names/descriptions (see
 *     `CHANGE_ADOPTION_BUCKETS` below) — a labeling convention over already-
 *     computed real cost lines, not a new data source.
 *   - **technology/third-party breakdown**: the sum of every line's
 *     `manualCostCents` — `manual_cost_line` is the ONLY operation in PR4's
 *     closed operation set that represents a non-labor cost (tooling,
 *     platform, vendor, per each rule's own disclosed `rationale`), so it is
 *     the honest technology/third-party total; labor cost is by definition
 *     people cost, never technology cost.
 */
import { readEffortEnginePack } from "../effort-engine/model-registry";
import { resolveActivityPacksForArchetype } from "../effort-engine/activity-packs";
import { runEffortEngine, type EffortEngineInput } from "../effort-engine/effort-engine";
import { computeRange } from "../effort-engine/range-policy";
import { assertLowExpectedHighInvariant, assertDeterministicRecomputation } from "../effort-engine/validation";
import { resolveRoleRatesForTenant } from "../effort-engine/rate-card-resolver";
import type { EffortLineItem, RangePolicyInputs, ResolvedRate, ScenarioKey } from "../effort-engine/types";
import { getCurrentTaxonomyVersion, listRoles } from "../reference-repository";
import { buildRateCardCoverageReport } from "../governed-load/coverage-report";
import type { PricingEstimateInputRow, PricingEstimateLineItemRow, PricingRoleRow } from "../types";
import { getEstimate, listEstimateInputs, listLineItems, replaceLineItems } from "./estimate-repository";
import { listRequiredDriverCodesForArchetype } from "./move-context-suggestions";
import { validateEstimateForRun } from "./validation-gate";
import type { EstimateRunGroupedBucket, EstimateRunResult } from "./types";

export class EstimateNotFoundError extends Error {
  constructor(estimateId: string) {
    super(`estimate_not_found: '${estimateId}'`);
    this.name = "EstimateNotFoundError";
  }
}

export class EstimateTenantMismatchError extends Error {
  constructor(estimateId: string) {
    super(`estimate_tenant_mismatch: '${estimateId}' does not belong to the requesting tenant`);
    this.name = "EstimateTenantMismatchError";
  }
}

export class EstimateNotReadyError extends Error {
  constructor(public readonly blockingReasons: { inputKey: string; reason: string }[]) {
    super(`estimate_not_ready: ${blockingReasons.length} blocking reason(s) — run /validate first`);
    this.name = "EstimateNotReadyError";
  }
}

const RANGE_TIER_INPUT_KEYS = [
  "range_scope_maturity",
  "range_evidence_quality",
  "range_delivery_novelty",
  "range_quantity_uncertainty",
] as const;

type RangeTierInputKey = (typeof RANGE_TIER_INPUT_KEYS)[number];
type Tier = "low" | "medium" | "high";

function readTier(inputs: readonly PricingEstimateInputRow[], key: RangeTierInputKey, fallback: Tier): Tier {
  const row = inputs.find((i) => i.input_key === key);
  const value = row?.value;
  return value === "low" || value === "medium" || value === "high" ? value : fallback;
}

function toGateInput(row: PricingEstimateInputRow) {
  return {
    inputKey: row.input_key,
    value: row.value,
    confirmedAt: row.confirmed_at,
    overrideReason: row.override_reason,
    confidence: row.confidence,
  };
}

function toLineItemInsert(
  li: EffortLineItem,
): Omit<PricingEstimateLineItemRow, "id" | "estimate_id" | "tenant_key" | "run_id" | "created_at"> {
  return {
    archetype_code: li.archetypeCode,
    activity_pack_code: li.activityPackCode,
    activity_pack_name: li.activityPackName,
    category: li.category,
    rule_code: li.ruleCode,
    operation: li.operation,
    driver_code: li.driverCode,
    driver_quantity: li.driverQuantity,
    model_version: li.modelVersion,
    scenario_key: li.scenarioKey,
    classification: li.classification,
    shared_cost_ref: li.sharedCostRef,
    role_code: li.roleCode,
    allocation_pct: li.allocationPct,
    raw_hours: li.moduleHours?.raw ?? null,
    complexity_factor: li.moduleHours?.complexityFactor ?? null,
    novelty_factor: li.moduleHours?.noveltyFactor ?? null,
    assurance_factor: li.moduleHours?.assuranceFactor ?? null,
    scenario_factor: li.moduleHours?.scenarioFactor ?? null,
    expected_hours: li.moduleHours?.expected ?? null,
    role_hours: li.roleHours,
    rate_resolved_from_scope: li.rate?.resolvedFromScope ?? null,
    rate_hourly_cents: li.rate?.hourlyRateCents ?? null,
    rate_currency: li.rate?.currency ?? null,
    rate_card_version_id: li.rate?.rateCardVersionId ?? null,
    labor_cost_cents: li.laborCostCents,
    manual_cost_cents: li.manualCostCents,
    gap_reason: li.gapReason,
    override_rationale: li.overrideRationale,
    formula_trace: li.formulaTrace,
  };
}

function lineCostCents(li: EffortLineItem): number {
  return (li.laborCostCents ?? 0) + (li.manualCostCents ?? 0);
}

function groupBy(
  lineItems: readonly EffortLineItem[],
  keyFn: (li: EffortLineItem) => { key: string; label: string } | null,
): EstimateRunGroupedBucket[] {
  const buckets = new Map<string, EstimateRunGroupedBucket>();
  for (const li of lineItems) {
    if (li.classification === "out_of_scope") continue;
    const bucket = keyFn(li);
    if (!bucket) continue;
    const existing = buckets.get(bucket.key) ?? {
      key: bucket.key,
      label: bucket.label,
      laborCostCents: 0,
      manualCostCents: 0,
      totalCostCents: 0,
      expectedHours: 0,
    };
    existing.laborCostCents += li.laborCostCents ?? 0;
    existing.manualCostCents += li.manualCostCents ?? 0;
    existing.totalCostCents += lineCostCents(li);
    existing.expectedHours += li.moduleHours?.expected ?? 0;
    buckets.set(bucket.key, existing);
  }
  return Array.from(buckets.values()).sort((a, b) => b.totalCostCents - a.totalCostCents);
}

/** Real `AP-SHARED-*` activity-pack codes bucketed into the brief's named change/adoption lenses — see file header. */
const CHANGE_ADOPTION_BUCKETS: Record<string, string> = {
  "AP-SHARED-01": "Change & stakeholder engagement",
  "AP-SHARED-02": "Change & stakeholder engagement",
  "AP-SHARED-04": "Training",
  "AP-SHARED-05": "Adoption support",
  "AP-SHARED-08": "Governance",
  "AP-SHARED-09": "Governance",
  "AP-SHARED-10": "Governance",
  "AP-SHARED-11": "Governance",
  "AP-SHARED-12": "Transition",
  "AP-TECH-AMS-01": "Transition",
  "AP-TECH-AMS-02": "Transition",
};

export interface RunEstimateOptions {
  estimateId: string;
  tenantKey: string;
}

export async function runEstimate(options: RunEstimateOptions): Promise<EstimateRunResult> {
  const estimate = await getEstimate(options.estimateId);
  if (!estimate) throw new EstimateNotFoundError(options.estimateId);
  if (estimate.tenant_key !== options.tenantKey) throw new EstimateTenantMismatchError(options.estimateId);

  const pack = await readEffortEnginePack(estimate.model_version);
  const inputRows = await listEstimateInputs(estimate.id);

  const requiredKeys = listRequiredDriverCodesForArchetype(pack, estimate.archetype_code);
  const validation = validateEstimateForRun(
    {
      currency: estimate.currency,
      targetStartDate: estimate.target_start_date,
      targetDurationWeeks: estimate.target_duration_weeks,
      selectedRateCardId: estimate.selected_rate_card_id,
    },
    requiredKeys,
    inputRows.map(toGateInput),
  );
  if (!validation.ready) throw new EstimateNotReadyError(validation.blockingReasons);

  const scopeDrivers: Record<string, number> = {};
  for (const driverCode of listRequiredDriverCodesForArchetype(pack, estimate.archetype_code)) {
    const row = inputRows.find((i) => i.input_key === driverCode);
    const numeric = Number(row?.value);
    scopeDrivers[driverCode] = Number.isFinite(numeric) ? numeric : 0;
  }

  const taxonomy = await getCurrentTaxonomyVersion();
  if (!taxonomy) {
    throw new Error("pricing_taxonomy_not_loaded: no current pricing_taxonomy_versions row — run the PR1/PR2 reference-pack loader first");
  }

  const resolvedPacks = resolveActivityPacksForArchetype(pack, estimate.archetype_code);
  const roleCodes = Array.from(new Set(resolvedPacks.flatMap((p) => p.roleMix.map((r) => r.roleCode))));
  const rates: Map<string, ResolvedRate> = await resolveRoleRatesForTenant(estimate.tenant_key, taxonomy.version, roleCodes);

  const engineInput: EffortEngineInput = {
    archetypeCode: estimate.archetype_code,
    tenantKey: estimate.tenant_key,
    scenarioKey: estimate.scenario_key as ScenarioKey,
    scopeDrivers,
    rates,
  };

  // Determinism proof (brief §12) — run twice, assert identical output,
  // before persisting anything.
  const output = assertDeterministicRecomputation(() => runEffortEngine(pack, engineInput));

  const coverage = await buildRateCardCoverageReport(estimate.tenant_key);

  const rangeInputs: RangePolicyInputs = {
    scopeMaturity: readTier(inputRows, "range_scope_maturity", "medium"),
    evidenceQuality: readTier(inputRows, "range_evidence_quality", "medium"),
    deliveryNovelty: readTier(inputRows, "range_delivery_novelty", "medium"),
    quantityUncertainty: readTier(inputRows, "range_quantity_uncertainty", "medium"),
    rateCardCoveragePct: coverage.coveragePct,
  };
  const range = assertLowExpectedHighInvariant(computeRange(rangeInputs, output.totals.totalCostCents, pack.rangePolicies));

  const roles: PricingRoleRow[] = await listRoles(taxonomy.version);
  const internalExternalByRole = new Map(roles.map((r) => [r.role_code, r.internal_external_default]));

  const monthlyAgentCostCodes = new Set(
    pack.agentCosts.filter((c) => /month/i.test(c.unit)).map((c) => c.agent_cost_code),
  );

  const internalVsExternal = { internalCostCents: 0, externalCostCents: 0, unknownCostCents: 0 };
  const oneTimeVsRecurring = { oneTimeCostCents: 0, recurringCostCents: 0 };
  let technologyThirdPartyCostCents = 0;

  for (const li of output.lineItems) {
    if (li.classification === "out_of_scope") continue;
    const cost = lineCostCents(li);

    const ie = li.roleCode ? internalExternalByRole.get(li.roleCode) : null;
    if (ie === "internal") internalVsExternal.internalCostCents += cost;
    else if (ie === "external") internalVsExternal.externalCostCents += cost;
    else internalVsExternal.unknownCostCents += cost;

    const isRecurring = li.activityPackCode === "SCENARIO-AI-ACCELERATION" && monthlyAgentCostCodes.has(li.ruleCode);
    if (isRecurring) oneTimeVsRecurring.recurringCostCents += cost;
    else oneTimeVsRecurring.oneTimeCostCents += cost;

    technologyThirdPartyCostCents += li.manualCostCents ?? 0;
  }

  const cashVsAbsorbedCapacity = {
    cashCostCents: internalVsExternal.externalCostCents,
    absorbedCapacityCostCents: internalVsExternal.internalCostCents,
    unknownCostCents: internalVsExternal.unknownCostCents,
  };

  const costByActivityPack = groupBy(output.lineItems, (li) => ({ key: li.activityPackCode, label: li.activityPackName }));
  const costByRole = groupBy(output.lineItems, (li) =>
    li.roleCode ? { key: li.roleCode, label: li.roleCode } : { key: "__manual__", label: "Manual / non-labor cost" },
  );
  const changeAdoptionBreakdown = groupBy(output.lineItems, (li) => {
    const label = CHANGE_ADOPTION_BUCKETS[li.activityPackCode];
    return label ? { key: label, label } : null;
  });

  const topAssumptions: string[] = [];
  for (const row of inputRows) {
    if (row.source_type === "global_default") {
      topAssumptions.push(`${row.input_key} defaulted to ${JSON.stringify(row.value)} (AbarVa default) — no Move-recorded source found.`);
    }
    if (row.override_reason) {
      topAssumptions.push(`${row.input_key}: ${row.override_reason}`);
    }
  }

  const topUncertaintyDrivers: string[] = [];
  const tierLabels: Record<RangeTierInputKey, string> = {
    range_scope_maturity: "Scope maturity",
    range_evidence_quality: "Evidence quality",
    range_delivery_novelty: "Delivery novelty",
    range_quantity_uncertainty: "Quantity uncertainty",
  };
  for (const key of RANGE_TIER_INPUT_KEYS) {
    const label = tierLabels[key];
    if (readTier(inputRows, key, "medium") === "high") {
      topUncertaintyDrivers.push(`${label} scored high uncertainty for this estimate.`);
    }
  }
  if (coverage.coveragePct < 60) {
    topUncertaintyDrivers.push(`Rate-card coverage is only ${coverage.coveragePct}% for this tenant, widening the range.`);
  }
  if (output.totals.gapCount > 0) {
    topUncertaintyDrivers.push(`${output.totals.gapCount} line item(s) have an unresolved role rate (honest cost gap, not fabricated).`);
  }

  const lineItemInserts = output.lineItems.map(toLineItemInsert);
  const { runId, ranAt } = await replaceLineItems(estimate.id, estimate.tenant_key, lineItemInserts);
  const persistedLineItems = await listLineItems(estimate.id);

  return {
    estimateId: estimate.id,
    runId,
    ranAt,
    modelVersion: estimate.model_version,
    scenarioKey: estimate.scenario_key,
    archetypeCode: estimate.archetype_code,
    totals: output.totals,
    range: {
      policyCode: range.policyCode,
      policyName: range.policyName,
      score: range.score,
      lowCents: range.lowCents,
      expectedCents: range.expectedCents,
      highCents: range.highCents,
    },
    costByActivityPack,
    costByRole,
    internalVsExternal,
    cashVsAbsorbedCapacity,
    oneTimeVsRecurring,
    changeAdoptionBreakdown,
    technologyThirdPartyCostCents,
    rateCardCoverage: {
      coveragePct: coverage.coveragePct,
      directCount: coverage.direct.count,
      inheritedCount: coverage.inherited.count,
      missingCount: coverage.missing.count,
    },
    topAssumptions,
    topUncertaintyDrivers,
    lineItems: persistedLineItems,
  };
}

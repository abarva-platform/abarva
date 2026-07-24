/**
 * Nexus Pricing Engine — PR4 effort/cost engine shared domain types.
 *
 * See `docs/architecture/PRICING_ENGINE_CURRENT_STATE.md` and the PR4
 * execution prompt (brief §7) for the design this implements. This module
 * has no I/O and no dependency on any other `effort-engine/*` file except
 * where noted — it exists so every other module (and every test) shares one
 * vocabulary.
 *
 * ## Money convention (brief's decimal/currency forcing function)
 *
 * PR0's audit found NO decimal/fixed-point money library anywhere in this
 * repo (`docs/architecture/PRICING_ENGINE_CURRENT_STATE.md` §6) — every
 * existing cost calculation (expert-kernel, workforce-economics) uses plain
 * JS `number` (IEEE-754 float) with display-time rounding only. `package.json`
 * has no `decimal.js`/`big.js`/`dinero.js`/similar dependency to reach for
 * instead. Rather than silently inheriting that convention for a NEW
 * calculation engine (or adding a new runtime dependency for a single PR),
 * this engine adopts **integer cents** as its internal money representation:
 * every `Cents` value below is a whole number of US-cent units (e.g. $145.00
 * = `14500`). All internal cost arithmetic (role-hour cost, module totals,
 * archetype totals, portfolio roll-ups) operates on integer cents via
 * `money.ts`'s helpers, which round to the nearest cent at the ONE point
 * where a fractional value would otherwise arise (hours × rate) and never
 * again downstream — sums of already-integer cents never need rounding.
 * Conversion to a display dollar amount happens only at output boundaries
 * (`money.ts`'s `centsToDisplayDollars`). This deliberately diverges from
 * the rest of the repo's float convention — see the PR4 release record for
 * the explicit call-out.
 */

// ---------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------

/** A whole number of US-cent units. See file header for the money convention. */
export type Cents = number;

// ---------------------------------------------------------------------------
// Effort-rule operation set (brief §7.3) — closed, typed, no eval.
// ---------------------------------------------------------------------------

export interface TieredUnitBand {
  /** Inclusive upper bound of this tier's driver quantity; `null` = "and above" (last tier only). */
  uptoQuantity: number | null;
  unitHours: number;
}

export type EffortOperation =
  | { readonly op: "fixed_hours"; readonly hours: number }
  | { readonly op: "per_unit_hours"; readonly driverCode: string; readonly unitHours: number }
  | { readonly op: "tiered_unit_hours"; readonly driverCode: string; readonly tiers: readonly TieredUnitBand[] }
  | {
      readonly op: "percentage_of_selected_labor";
      readonly percentage: number;
      /**
       * Despite the operation's name (matching the brief's exact vocabulary),
       * the "selected labor" base this percentage multiplies is the SUM OF
       * EXPECTED HOURS of the referenced activity packs, not their dollar
       * cost — hours are the calculation currency at the point this
       * operation runs in the pipeline (before rate resolution), so basing
       * it on hours avoids a circular hours<-cost<-rate<-hours dependency.
       * Cost is derived from this operation's resulting hours exactly the
       * same way as every other operation's hours, immediately afterward.
       * Exactly one of `selectionScope` / `selectedActivityPackCodes` must
       * be set (see rule-interpreter.ts for the runtime check).
       */
      readonly selectionScope?: "technical_packs_in_archetype";
      readonly selectedActivityPackCodes?: readonly string[];
    }
  | { readonly op: "hours_per_week"; readonly driverCode: string; readonly hoursPerWeek: number }
  | { readonly op: "hours_per_wave"; readonly driverCode: string; readonly hoursPerWave: number }
  | { readonly op: "hours_per_stakeholder_group"; readonly driverCode: string; readonly hoursPerGroup: number }
  | { readonly op: "hours_per_course"; readonly driverCode: string; readonly hoursPerCourse: number }
  | { readonly op: "hours_per_training_session"; readonly driverCode: string; readonly hoursPerSession: number }
  | { readonly op: "hours_per_supplier_month"; readonly driverCode: string; readonly hoursPerSupplierMonth: number }
  | { readonly op: "manual_cost_line"; readonly costCents: Cents; readonly rationale: string };

export type EffortOperationKind = EffortOperation["op"];

// ---------------------------------------------------------------------------
// Portfolio/shared-cost classification (brief §7.7)
// ---------------------------------------------------------------------------

export type LineClassification =
  | "initiative_specific"
  | "shared_program"
  | "reused"
  | "already_funded"
  | "out_of_scope";

// ---------------------------------------------------------------------------
// Scenarios (brief §7.9)
// ---------------------------------------------------------------------------

export type ScenarioKey = "traditional" | "ai_accelerated" | "vendor_led" | "client_led" | "custom";

// ---------------------------------------------------------------------------
// Reference-pack row shapes (mirrors the PR4 migration's tables; hand-written
// like every other `pricing_*` type per src/lib/pricing/types.ts's own
// convention).
// ---------------------------------------------------------------------------

export interface PricingArchetypeRow {
  model_version: number;
  archetype_code: string;
  archetype_name: string;
  description: string | null;
  status: string;
}

export interface PricingActivityPackRow {
  model_version: number;
  activity_pack_code: string;
  activity_pack_name: string;
  category: "technical" | "shared_nontechnical";
  tower_code: string | null;
  capability_code: string | null;
  description: string | null;
  status: string;
}

export interface PricingEffortDriverRow {
  model_version: number;
  driver_code: string;
  driver_name: string;
  unit_label: string;
  description: string | null;
  status: string;
}

export interface PricingEffortRuleRow {
  model_version: number;
  activity_pack_code: string;
  rule_code: string;
  operation: EffortOperationKind;
  driver_code: string | null;
  parameters: Record<string, unknown>;
  classification: LineClassification;
  sequence: number;
  status: string;
}

export interface PricingActivityRoleMixRow {
  model_version: number;
  activity_pack_code: string;
  role_code: string;
  allocation_pct: number;
  level_hint: string | null;
  status: string;
}

export interface PricingArchetypeActivityMapRow {
  model_version: number;
  archetype_code: string;
  activity_pack_code: string;
  applicability: "required" | "conditional" | "excluded";
  notes: string | null;
  status: string;
}

export interface PricingRangePolicyRow {
  model_version: number;
  policy_code: string;
  policy_name: string;
  min_score: number;
  max_score: number;
  low_multiplier: number;
  high_multiplier: number;
  description: string | null;
  status: string;
}

export interface PricingAgentCostRow {
  model_version: number;
  agent_cost_code: string;
  cost_key: string;
  applies_to_archetype_code: string | null;
  cost_value: number;
  unit: string;
  description: string | null;
  status: string;
}

/** The full PR4 reference pack for one model_version, as consumed by the engine modules. */
export interface EffortEnginePack {
  modelVersion: number;
  archetypes: readonly PricingArchetypeRow[];
  activityPacks: readonly PricingActivityPackRow[];
  effortDrivers: readonly PricingEffortDriverRow[];
  effortRules: readonly PricingEffortRuleRow[];
  roleMix: readonly PricingActivityRoleMixRow[];
  archetypeActivityMap: readonly PricingArchetypeActivityMapRow[];
  rangePolicies: readonly PricingRangePolicyRow[];
  agentCosts: readonly PricingAgentCostRow[];
}

// ---------------------------------------------------------------------------
// Rate resolution (rate-card-resolver.ts's output shape)
// ---------------------------------------------------------------------------

export type RateResolutionScope = "client" | "global" | "rate_band_default" | "missing";

export interface ResolvedRate {
  resolvedFromScope: RateResolutionScope;
  roleCode: string;
  levelCode: string | null;
  hourlyRateCents: Cents | null;
  currency: string;
  rateCardVersionId: string | null;
  gapReason: string | null;
}

// ---------------------------------------------------------------------------
// Multipliers (brief §7.4 — "use only these few visible multipliers")
// ---------------------------------------------------------------------------

export interface ModuleMultipliers {
  /** Scope/technical complexity relative to a typical instance of this activity pack. Default 1.0. */
  complexityFactor: number;
  /** Novelty (>1) vs. reuse of a proven pattern (<1). Default 1.0. */
  noveltyFactor: number;
  /** Extra assurance/oversight rigor (e.g. regulated environment). Default 1.0. */
  assuranceFactor: number;
}

export const DEFAULT_MODULE_MULTIPLIERS: ModuleMultipliers = {
  complexityFactor: 1,
  noveltyFactor: 1,
  assuranceFactor: 1,
};

// ---------------------------------------------------------------------------
// Line item — the per-calculated-line provenance record (brief §2.8, §9.4).
// ---------------------------------------------------------------------------

export interface EffortLineItem {
  archetypeCode: string;
  activityPackCode: string;
  activityPackName: string;
  category: "technical" | "shared_nontechnical";
  ruleCode: string;
  operation: EffortOperationKind;
  driverCode: string | null;
  driverQuantity: number | null;
  modelVersion: number;
  scenarioKey: ScenarioKey;
  classification: LineClassification;
  /** Non-null only for classification in {shared_program, reused, already_funded} — the dedup key a portfolio roll-up groups by. */
  sharedCostRef: string | null;
  /** Null for a manual_cost_line (no role attached). */
  roleCode: string | null;
  allocationPct: number | null;
  moduleHours:
    | {
        raw: number;
        complexityFactor: number;
        noveltyFactor: number;
        assuranceFactor: number;
        scenarioFactor: number;
        expected: number;
      }
    | null;
  roleHours: number | null;
  rate: ResolvedRate | null;
  laborCostCents: Cents | null;
  manualCostCents: Cents | null;
  /** Set when a role's rate could not be resolved — the line's cost is an honest gap, never a fabricated number. */
  gapReason: string | null;
  overrideRationale: string | null;
  /** Human-readable "N base + M driver-hours × factors × allocation × rate = $X" trace for the drilldown UI. */
  formulaTrace: string;
}

// ---------------------------------------------------------------------------
// Engine output
// ---------------------------------------------------------------------------

export interface EffortEngineTotals {
  totalRawHours: number;
  totalExpectedHours: number;
  totalLaborCostCents: Cents;
  totalManualCostCents: Cents;
  /** labor + manual, EXCLUDING out_of_scope-classified lines. */
  totalCostCents: Cents;
  gapCount: number;
}

export interface EffortEngineOutput {
  archetypeCode: string;
  modelVersion: number;
  scenarioKey: ScenarioKey;
  tenantKey: string;
  lineItems: readonly EffortLineItem[];
  totals: EffortEngineTotals;
}

// ---------------------------------------------------------------------------
// Range (low/expected/high) output
// ---------------------------------------------------------------------------

export interface RangePolicyInputs {
  scopeMaturity: "low" | "medium" | "high";
  evidenceQuality: "low" | "medium" | "high";
  deliveryNovelty: "low" | "medium" | "high";
  quantityUncertainty: "low" | "medium" | "high";
  /** 0-100. From PR3's rate-card coverage report (`coveragePct`). */
  rateCardCoveragePct: number;
}

export interface RangeResult {
  policyCode: string;
  policyName: string;
  score: number;
  lowMultiplier: number;
  highMultiplier: number;
  expectedCents: Cents;
  lowCents: Cents;
  highCents: Cents;
}

/**
 * Nexus Pricing Engine — PR5 Moves Cost & Effort workflow shared types.
 *
 * Server-side service layer that wires the PR4 effort/cost engine
 * (`src/lib/pricing/effort-engine/`) to a real, persisted, per-Move draft
 * workflow (the 5-step wizard, brief §9.2) — see
 * `docs/architecture/PRICING_ENGINE_CURRENT_STATE.md` §14 for why this stays
 * an independent `pricing_*` module and does not import
 * `expert-kernel/rate-card/`, `expert-kernel/effort-estimator.ts`,
 * `expert-kernel/business-case-compiler.ts`, or `workforce-economics/`.
 */
import type {
  PricingEstimateInputConfidence,
  PricingEstimateInputRow,
  PricingEstimateInputSourceType,
  PricingEstimateLineItemRow,
  PricingEstimateRow,
  PricingSnapshotStatus,
} from "../types";

// ---------------------------------------------------------------------------
// Draft CRUD
// ---------------------------------------------------------------------------

export interface CreateEstimateDraftInput {
  tenantKey: string;
  moveId: string;
  scenarioName: string;
  scenarioKey?: string;
  archetypeCode: string;
  modelVersion: number;
  currency?: string;
  targetStartDate?: string | null;
  targetDurationWeeks?: number | null;
  selectedRateCardId?: string | null;
  /** Omit to start a new costing exercise (a fresh group); pass an existing group id to add a scenario variant alongside prior ones. */
  scenarioGroupId?: string | null;
  createdBy?: string | null;
}

export interface UpdateEstimateHeaderInput {
  scenarioName?: string;
  scenarioKey?: string;
  archetypeCode?: string;
  currency?: string;
  targetStartDate?: string | null;
  targetDurationWeeks?: number | null;
  selectedRateCardId?: string | null;
  status?: PricingSnapshotStatus;
}

export interface UpsertEstimateInputRecord {
  inputKey: string;
  value: unknown;
  unit?: string | null;
  required?: boolean;
  sourceType: PricingEstimateInputSourceType;
  sourceRef?: string | null;
  confidence?: PricingEstimateInputConfidence | null;
  /** Setting this marks the input CONFIRMED as of now. Omit to leave a proposed/unconfirmed suggestion untouched. */
  confirmedBy?: string | null;
  overrideReason?: string | null;
  modelVersion?: number | null;
}

// ---------------------------------------------------------------------------
// Move-context suggestions (brief §9.6/§9.3) — every suggestion carries a
// source chip; the user must explicitly confirm, modify, or reject it.
// Never auto-treat a suggestion as confirmed (`confirmedBy` is always null
// on a freshly-resolved suggestion).
// ---------------------------------------------------------------------------

export interface EstimateInputSuggestion {
  inputKey: string;
  label: string;
  unit: string | null;
  required: boolean;
  /** `null` when no real, honest source resolves a value — the UI must render this as an open question, never a fabricated default. */
  value: unknown | null;
  sourceType: PricingEstimateInputSourceType;
  sourceRef: string | null;
  confidence: PricingEstimateInputConfidence | null;
  /** Set when `value` is null — explains WHY no suggestion exists (e.g. "Move schema has no integration_count field yet"). */
  gapReason: string | null;
}

// ---------------------------------------------------------------------------
// Validation gate (brief §9.2 step 5) — the canonical `ValidationBlockingReason`
// / `EstimateValidationResult` types live in `./validation-gate.ts` (the pure
// gate module); re-exported from there via `index.ts`, not redefined here.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Config (brief §10 GET .../pricing/config)
// ---------------------------------------------------------------------------

export interface EstimateConfigArchetype {
  archetypeCode: string;
  archetypeName: string;
  description: string | null;
}

/**
 * Which wizard step (brief §9.2) a driver-derived question belongs on —
 * `'scope'` when EVERY activity pack referencing the driver is `technical`
 * (step 2, "Scope and quantities"); `'people'` when at least one
 * `shared_nontechnical` pack references it (step 3, "People/change/
 * adoption") — a real category split already present in
 * `pricing_activity_packs.category`, not an invented taxonomy. `'setup'` is
 * reserved for the five fixed step-1 fields.
 */
export type EstimateWizardStepHint = "setup" | "scope" | "people";

export interface EstimateConfigRequiredInput {
  inputKey: string;
  label: string;
  unit: string | null;
  required: boolean;
  stepHint: EstimateWizardStepHint;
}

export interface EstimateConfig {
  modelVersion: number;
  archetypes: EstimateConfigArchetype[];
  /** archetype_code -> the scope-driver questions that apply, derived from the REAL archetype→activity-pack→driver mapping (brief §9.2 step 2) — never a hardcoded list. */
  requiredInputsByArchetype: Record<string, EstimateConfigRequiredInput[]>;
}

// ---------------------------------------------------------------------------
// Execution / results (brief §9.4)
// ---------------------------------------------------------------------------

export interface EstimateRunTotals {
  totalRawHours: number;
  totalExpectedHours: number;
  totalLaborCostCents: number;
  totalManualCostCents: number;
  totalCostCents: number;
  gapCount: number;
}

export interface EstimateRunRangeResult {
  policyCode: string;
  policyName: string;
  score: number;
  lowCents: number;
  expectedCents: number;
  highCents: number;
}

export interface EstimateRunGroupedBucket {
  key: string;
  label: string;
  laborCostCents: number;
  manualCostCents: number;
  totalCostCents: number;
  expectedHours: number;
}

export interface EstimateRunResult {
  estimateId: string;
  runId: string;
  ranAt: string;
  modelVersion: number;
  scenarioKey: string;
  archetypeCode: string;
  totals: EstimateRunTotals;
  range: EstimateRunRangeResult;
  /** Cost by activity pack (brief's "cost by phase/activity pack/role" — activity pack is the real grain the engine computes; "phase" in brief prose maps to this). */
  costByActivityPack: EstimateRunGroupedBucket[];
  costByRole: EstimateRunGroupedBucket[];
  internalVsExternal: { internalCostCents: number; externalCostCents: number; unknownCostCents: number };
  /**
   * Uses the SAME `pricing_roles.internal_external_default` signal as
   * `internalVsExternal` above, as a disclosed planning-simplification proxy
   * (external role cost = cash outlay; internal role cost = absorbed
   * capacity/existing headcount redeployed) — not a treasury cash-flow
   * determination. See `execution-service.ts`'s header for the honesty
   * disclosure.
   */
  cashVsAbsorbedCapacity: { cashCostCents: number; absorbedCapacityCostCents: number; unknownCostCents: number };
  oneTimeVsRecurring: { oneTimeCostCents: number; recurringCostCents: number };
  changeAdoptionBreakdown: EstimateRunGroupedBucket[];
  technologyThirdPartyCostCents: number;
  rateCardCoverage: {
    coveragePct: number;
    directCount: number;
    inheritedCount: number;
    missingCount: number;
  };
  topAssumptions: string[];
  topUncertaintyDrivers: string[];
  lineItems: PricingEstimateLineItemRow[];
}

export type { PricingEstimateInputRow, PricingEstimateLineItemRow, PricingEstimateRow };

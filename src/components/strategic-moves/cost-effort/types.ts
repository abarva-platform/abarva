// Cost & Effort wizard — client-side JSON shapes mirroring the
// `/api/v1/programs/:programId/pricing/**` route responses. Hand-written
// (camelCase, matching each route's `_shared.ts` `estimateToJson`/
// `inputToJson` transforms) rather than importing server-only types —
// this directory is a client component and must not pull in `azureRead`/
// Postgres-adjacent modules.

export interface EstimateConfigArchetypeJson {
  archetypeCode: string;
  archetypeName: string;
  description: string | null;
}

export type EstimateWizardStepHint = "setup" | "scope" | "people";

export interface EstimateConfigRequiredInputJson {
  inputKey: string;
  label: string;
  unit: string | null;
  required: boolean;
  stepHint: EstimateWizardStepHint;
}

export interface EstimateConfigJson {
  modelVersion: number;
  archetypes: EstimateConfigArchetypeJson[];
  requiredInputsByArchetype: Record<string, EstimateConfigRequiredInputJson[]>;
}

export interface DefaultRateCardJson {
  id: string;
  cardCode: string;
  version: number;
}

export interface EstimateJson {
  id: string;
  tenantKey: string;
  moveId: string;
  scenarioGroupId: string;
  scenarioName: string;
  scenarioKey: string;
  archetypeCode: string;
  modelVersion: number;
  currency: string;
  targetStartDate: string | null;
  targetDurationWeeks: number | null;
  selectedRateCardId: string | null;
  status: string;
  lastRunId: string | null;
  lastRunAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export type EstimateInputSourceType = "move_context" | "client_profile" | "global_default" | "client_input" | "override";
export type EstimateInputConfidence = "low" | "medium" | "high";

export interface EstimateInputJson {
  inputKey: string;
  value: unknown;
  unit: string | null;
  required: boolean;
  sourceType: EstimateInputSourceType;
  sourceRef: string | null;
  confidence: EstimateInputConfidence | null;
  confirmedBy: string | null;
  confirmedAt: string | null;
  overrideReason: string | null;
  modelVersion: number | null;
  updatedAt: string;
}

export interface ValidationBlockingReasonJson {
  inputKey: string;
  reason: string;
}

export interface ValidationResultJson {
  ok: true;
  estimateId: string;
  ready: boolean;
  blockingReasons: ValidationBlockingReasonJson[];
  requiredInputKeys: string[];
}

export interface EstimateRunGroupedBucketJson {
  key: string;
  label: string;
  laborCostCents: number;
  manualCostCents: number;
  totalCostCents: number;
  expectedHours: number;
}

export interface EstimateRunResultJson {
  estimateId: string;
  runId: string;
  ranAt: string;
  modelVersion: number;
  scenarioKey: string;
  archetypeCode: string;
  totals: {
    totalRawHours: number;
    totalExpectedHours: number;
    totalLaborCostCents: number;
    totalManualCostCents: number;
    totalCostCents: number;
    gapCount: number;
  };
  range: {
    policyCode: string;
    policyName: string;
    score: number;
    lowCents: number;
    expectedCents: number;
    highCents: number;
  };
  costByActivityPack: EstimateRunGroupedBucketJson[];
  costByRole: EstimateRunGroupedBucketJson[];
  internalVsExternal: { internalCostCents: number; externalCostCents: number; unknownCostCents: number };
  cashVsAbsorbedCapacity: { cashCostCents: number; absorbedCapacityCostCents: number; unknownCostCents: number };
  oneTimeVsRecurring: { oneTimeCostCents: number; recurringCostCents: number };
  changeAdoptionBreakdown: EstimateRunGroupedBucketJson[];
  technologyThirdPartyCostCents: number;
  rateCardCoverage: { coveragePct: number; directCount: number; inheritedCount: number; missingCount: number };
  topAssumptions: string[];
  topUncertaintyDrivers: string[];
}

export const RANGE_TIER_KEYS = [
  "range_scope_maturity",
  "range_evidence_quality",
  "range_delivery_novelty",
  "range_quantity_uncertainty",
] as const;

export const RANGE_TIER_LABELS: Record<(typeof RANGE_TIER_KEYS)[number], string> = {
  range_scope_maturity: "Scope maturity",
  range_evidence_quality: "Evidence quality",
  range_delivery_novelty: "Delivery novelty",
  range_quantity_uncertainty: "Quantity uncertainty",
};

export const SCENARIO_KEY_LABELS: Record<string, string> = {
  traditional: "Traditional",
  ai_accelerated: "AI-accelerated",
  vendor_led: "Vendor-led",
  client_led: "Client-led",
  custom: "Custom",
};

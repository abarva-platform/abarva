// =============================================================================
// P2 Risk-Tier Fields — charter JSONB transformer
// -----------------------------------------------------------------------------
// Same isolated seam as p0-extended-intake-fields.ts: pure embed/read of the
// D1-D5/E1-E8 risk-tier INPUTS inside the existing `engagements.charter`
// JSONB, gated by `moves_risk_tier_scoring_v1`. Stores only the raw inputs,
// never the computed result — the result is always re-derived on read via
// `computeRiskTier` (risk-tier-scoring.ts), so there is no stale-cache class
// of bug if the scoring model itself changes later.
//
// Per the target model, risk is "scored from the same discovery answers" —
// this is why the capture surface lives on P2 Discover & Diagnose, not P0/P1.
// =============================================================================

import type { RiskTierInputs } from "./risk-tier-scoring";

const RISK_TIER_KEY = "p2_risk_tier_inputs_v1";

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const DIMENSION_LEVELS = new Set(["Low", "Moderate", "High", "Critical"]);
const ESCALATOR_SEVERITIES = new Set([
  "NotTriggered",
  "Moderate",
  "High",
  "Critical",
]);

const DIMENSION_KEYS: Array<keyof RiskTierInputs> = [
  "d1DataSensitivity",
  "d2HumanOversight",
  "d3IntegrationImpact",
  "d4BuildOrigin",
  "d5DomainBreadth",
];
const ESCALATOR_KEYS: Array<keyof RiskTierInputs> = [
  "e1PhiExposure",
  "e2AutonomousAction",
  "e3ClinicalDecisioning",
  "e4OrganizationReadiness",
  "e5CrossDomainIntegration",
  "e6PublicRegulatoryExposure",
  "e7BrandReputationRisk",
  "e8PatientFacingExposure",
];

/** Safe read of the risk-tier inputs — null unless every field is present and valid. */
export function readRiskTierInputsFromCharter(
  charter: Record<string, unknown> | null,
): RiskTierInputs | null {
  if (!charter) return null;
  const v = charter[RISK_TIER_KEY];
  if (!isPlainObject(v)) return null;
  for (const key of DIMENSION_KEYS) {
    if (!DIMENSION_LEVELS.has(v[key] as string)) return null;
  }
  for (const key of ESCALATOR_KEYS) {
    if (!ESCALATOR_SEVERITIES.has(v[key] as string)) return null;
  }
  return v as unknown as RiskTierInputs;
}

/** Embed the inputs into a charter. Pure — returns a new object, never mutates. */
export function embedRiskTierInputsInCharter(
  charter: Record<string, unknown>,
  inputs: RiskTierInputs,
): Record<string, unknown> {
  return { ...charter, [RISK_TIER_KEY]: inputs };
}

/**
 * P2 capture helper: embed the inputs only when the feature flag is on. Pure
 * — the flag decision is passed in, so the wiring stays unit-testable
 * without a live tenant or DB. No-op (same reference) otherwise.
 */
export function applyRiskTierInputsIfEnabled(
  charter: Record<string, unknown>,
  inputs: RiskTierInputs | null | undefined,
  flagEnabled: boolean,
): Record<string, unknown> {
  if (!flagEnabled || !inputs) return charter;
  return embedRiskTierInputsInCharter(charter, inputs);
}

// =============================================================================
// Risk-factor vocabulary — the WORDS the D1-D5/E1-E8 risk factors are asked in
// -----------------------------------------------------------------------------
// The risk-tier model (risk-tier-scoring.ts) is domain-neutral: thirteen
// factors, each scored on a fixed level/severity scale. The PROMPTS that ask
// for them were not. The shipped set asks E1 as "PHI / Sensitive Data
// Exposure", E3 as "Clinical Decisioning" and E8 as "Patient-Facing Exposure"
// — a clinical reading of three otherwise generic factors (sensitive-data
// exposure, decision authority, audience exposure). Every Move saw those
// words, so a Move that had DECLARED a non-clinical archetype was asked to
// rate a clinical decision before its assessment could be saved (the panel
// requires all thirteen).
//
// This module is the same shape as the other declared-archetype joins: a
// catalog keyed by archetype id, an exact match wins, and the shipped set is
// the fallback. Two invariants make it safe to configure:
//
//   1. A catalog entry is an OVERLAY of prompts, never a field list. The
//      resolved vocabulary therefore always covers exactly the thirteen
//      `RiskTierInputs` keys, in one fixed order — a configured archetype
//      cannot drop, add or reorder a factor.
//   2. Nothing here reaches the stored value or the score. The charter JSONB
//      keys (`p2_risk_tier_inputs_v1`) and `computeRiskTier` are untouched, so
//      an assessment saved under one vocabulary reads back identically under
//      another. Only the prompt text differs.
// =============================================================================

import type { RiskTierInputs } from "./risk-tier-scoring";

export type RiskDimensionKey = Extract<
  keyof RiskTierInputs,
  | "d1DataSensitivity"
  | "d2HumanOversight"
  | "d3IntegrationImpact"
  | "d4BuildOrigin"
  | "d5DomainBreadth"
>;

export type RiskEscalatorKey = Extract<
  keyof RiskTierInputs,
  | "e1PhiExposure"
  | "e2AutonomousAction"
  | "e3ClinicalDecisioning"
  | "e4OrganizationReadiness"
  | "e5CrossDomainIntegration"
  | "e6PublicRegulatoryExposure"
  | "e7BrandReputationRisk"
  | "e8PatientFacingExposure"
>;

export interface RiskDimensionPrompt {
  key: RiskDimensionKey;
  label: string;
  question: string;
  /** Which answer level each real-world case maps to. The LEVELS are fixed by
   * the scoring model; only the case wording is vocabulary. */
  hint: string;
}

export interface RiskEscalatorPrompt {
  key: RiskEscalatorKey;
  label: string;
  question: string;
}

export interface RiskFactorVocabulary {
  dimensions: readonly RiskDimensionPrompt[];
  escalators: readonly RiskEscalatorPrompt[];
}

/** The order the factors are asked in. Fixed, and not configurable. */
export const RISK_DIMENSION_KEYS: readonly RiskDimensionKey[] = [
  "d1DataSensitivity",
  "d2HumanOversight",
  "d3IntegrationImpact",
  "d4BuildOrigin",
  "d5DomainBreadth",
];

export const RISK_ESCALATOR_KEYS: readonly RiskEscalatorKey[] = [
  "e1PhiExposure",
  "e2AutonomousAction",
  "e3ClinicalDecisioning",
  "e4OrganizationReadiness",
  "e5CrossDomainIntegration",
  "e6PublicRegulatoryExposure",
  "e7BrandReputationRisk",
  "e8PatientFacingExposure",
];

/**
 * The shipped prompts — what every Move was asked before this module existed,
 * word for word. A Move that declares nothing, or declares an archetype with
 * no catalog entry, still sees exactly this.
 */
export const SHIPPED_RISK_FACTOR_VOCABULARY: RiskFactorVocabulary = {
  dimensions: [
    {
      key: "d1DataSensitivity",
      label: "D1 · Data Sensitivity",
      question: "What type of data is involved?",
      hint: "Low = Public · Moderate = — · High = PII · Critical = PHI or PII+PHI",
    },
    {
      key: "d2HumanOversight",
      label: "D2 · Human Oversight",
      question: "What level of independent AI operation is involved?",
      hint: "Low = Assistive · Moderate = Advisory or Automated · High = — · Critical = Autonomous or Agentic",
    },
    {
      key: "d3IntegrationImpact",
      label: "D3 · Integration Impact",
      question: "What does the AI do to core systems?",
      hint: "Low = None · Moderate = Read-only · High = — · Critical = Write",
    },
    {
      key: "d4BuildOrigin",
      label: "D4 · Build Origin",
      question: "Where did the capability come from?",
      hint: "Low = SaaS · Moderate = Vendor Configured · High = Fine-tuned · Critical = Internally Built",
    },
    {
      key: "d5DomainBreadth",
      label: "D5 · Domain Breadth",
      question: "How many domains does this touch?",
      hint: "Low = Single · Moderate = Multi · High = — · Critical = Enterprise",
    },
  ],
  escalators: [
    {
      key: "e1PhiExposure",
      label: "E1 · PHI / Sensitive Data Exposure",
      question: "How broadly is the data exposed, and how well protected?",
    },
    {
      key: "e2AutonomousAction",
      label: "E2 · Autonomous / Agentic Action",
      question: "Does the AI act on its own, without a human confirming first?",
    },
    {
      key: "e3ClinicalDecisioning",
      label: "E3 · Clinical Decisioning",
      question: "Does this influence a clinical decision?",
    },
    {
      key: "e4OrganizationReadiness",
      label: "E4 · Organization Readiness / Ability to Adopt",
      question:
        "Is the vendor/tool sanctioned, and what's the integration impact?",
    },
    {
      key: "e5CrossDomainIntegration",
      label: "E5 · Cross-Domain Integration Impact",
      question: "Does this cross domains, and does it write?",
    },
    {
      key: "e6PublicRegulatoryExposure",
      label: "E6 · Public / Regulatory Exposure",
      question: "Do specific regulations apply to this use case?",
    },
    {
      key: "e7BrandReputationRisk",
      label: "E7 · Brand / Reputation Risk",
      question:
        "If this use case failed publicly, would it cause reputational harm?",
    },
    {
      key: "e8PatientFacingExposure",
      label: "E8 · Patient-Facing Exposure",
      question: "Who is the audience — internal, patient/public, or direct?",
    },
  ],
};

/** A partial re-wording of a factor. Omitted fields keep the shipped text. */
type PromptOverride = {
  label?: string;
  question?: string;
  /** Dimensions only — an escalator prompt has no hint. */
  hint?: string;
};

export type RiskFactorVocabularyOverlay = Partial<
  Record<RiskDimensionKey | RiskEscalatorKey, PromptOverride>
>;

/**
 * Per-archetype re-wordings, keyed the same way the other declared-archetype
 * joins key theirs (`archetypeVocabularyKey`). Deliberately narrow: only the
 * factors whose shipped wording is domain-bound are re-worded. D2-D5, E2 and
 * E4-E7 read the same everywhere because they already ask about the capability
 * and the organisation, not about a subject domain.
 */
export const RISK_FACTOR_VOCABULARY_CATALOG: Record<
  string,
  RiskFactorVocabularyOverlay
> = {
  governed_data_foundation: {
    // The level mapping is unchanged — only the data categories are named in
    // terms a data-foundation Move actually holds.
    d1DataSensitivity: {
      hint: "Low = Public · Moderate = — · High = Personal data · Critical = Regulated or combined personal data",
    },
    e1PhiExposure: {
      label: "E1 · Regulated / Sensitive Data Exposure",
      question:
        "How broadly is the governed data exposed, and how well protected?",
    },
    e3ClinicalDecisioning: {
      label: "E3 · Decision Authority",
      question:
        "Does a decision of consequence rely on this data without an independent check?",
    },
    e8PatientFacingExposure: {
      label: "E8 · External-Facing Exposure",
      question:
        "Who consumes the output — one team, the wider organisation, or parties outside it?",
    },
  },
};

/** Normalised catalog key. Matches the id normalisation used by the other
 * declared-archetype joins, so `Governed Data Foundation`,
 * `GOVERNED_DATA_FOUNDATION` and `governed-data-foundation` all resolve. */
export function archetypeVocabularyKey(
  value: string | null | undefined,
): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function applyOverride<T extends RiskDimensionPrompt | RiskEscalatorPrompt>(
  prompt: T,
  override: PromptOverride | undefined,
): T {
  if (!override) return prompt;
  const next: T = { ...prompt };
  if (override.label) next.label = override.label;
  if (override.question) next.question = override.question;
  if (override.hint && "hint" in next) {
    (next as RiskDimensionPrompt).hint = override.hint;
  }
  return next;
}

/**
 * The prompts for a Move, given the archetype it has DECLARED. An exact
 * catalog match re-words the factors it names; everything else — and every
 * Move that declares nothing, or declares an archetype with no entry — keeps
 * the shipped wording. The resolved set always holds all thirteen factors in
 * `RISK_DIMENSION_KEYS` / `RISK_ESCALATOR_KEYS` order.
 */
export function resolveRiskFactorVocabulary(
  declaredArchetypeId?: string | null,
): RiskFactorVocabulary {
  const overlay =
    RISK_FACTOR_VOCABULARY_CATALOG[archetypeVocabularyKey(declaredArchetypeId)];
  if (!overlay) return SHIPPED_RISK_FACTOR_VOCABULARY;
  return {
    dimensions: SHIPPED_RISK_FACTOR_VOCABULARY.dimensions.map((prompt) =>
      applyOverride(prompt, overlay[prompt.key]),
    ),
    escalators: SHIPPED_RISK_FACTOR_VOCABULARY.escalators.map((prompt) =>
      applyOverride(prompt, overlay[prompt.key]),
    ),
  };
}

// SOL9 · Solution Recommendation Engine.
//
// Pure deterministic library that unifies SOL3 archetypes, SOL4 / SOL5
// component packs, SOL6 build/buy/partner evaluator, and the SOL7
// detail read model into a single Nexus-facing recommendation layer.
//
// Given a caller-supplied SolutionRecommendationInput (industry,
// business problem, signals, datasets, preferences) the engine returns
// a deterministic, scored, reason-annotated set of archetype
// recommendations together with build/buy/partner guidance, missing
// inputs, and a concrete next action.
//
// This module is a *library*. It does NOT compose tenant-specific live
// architectures, it does NOT invoke models, and it does NOT read tenant
// runtime state. All scoring is integer / rational arithmetic against
// the SOL3 archetype registry. Tie-breaks fall back to canonical
// archetype order for byte-equal determinism across calls.
//
// No live runtime, no live model invocation, no clock reads,
// no random IDs, no Supabase reads, no migrations.
//
// This module does NOT import:
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/agent/**, src/components/agent/**
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/app/programs/**, src/app/(maestro)/preview/**, src/app/demo/**
//   - src/lib/programs/mock.ts
//   - src/lib/auth/**
//   - supabase/**

import {
  SOLUTION_ARCHETYPE_KEYS,
  SOLUTION_ARCHETYPES,
  type SolutionArchetype,
  type SolutionArchetypeKey,
} from '@/lib/solutions/solution-archetype-registry';
import {
  evaluateBuildBuyPartnerScenario,
  type BuildBuyPartnerOption,
  type BuildBuyPartnerScenarioInput,
} from '@/lib/solutions/build-buy-partner-framework';

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export interface SolutionRecommendationInput {
  industry?: string;
  businessProblem?: string;
  desiredOutcomes?: readonly string[];
  currentStateSignals?: readonly string[];
  detectedFailureModes?: readonly string[];
  detectedPatterns?: readonly string[];
  availableDatasetDomains?: readonly string[];
  regulatorySensitivity?: 'low' | 'medium' | 'high';
  buildBuyPreference?: 'build' | 'buy' | 'partner' | 'no_preference';
  urgency?: 'low' | 'medium' | 'high';
  existingPlatforms?: readonly string[];
  knownConstraints?: readonly string[];
}

export interface SolutionRecommendationScore {
  raw: number;
  normalized: number;
  band: 'low' | 'medium' | 'high';
}

export interface SolutionRecommendationReason {
  kind:
    | 'industry_match'
    | 'failure_mode_match'
    | 'pattern_match'
    | 'capability_match'
    | 'dataset_match'
    | 'preference_match';
  description: string;
  weight: number;
}

export interface SolutionRecommendationMissingInput {
  kind: string;
  impact: 'blocks_recommendation' | 'downgrades_confidence' | 'missing_metadata';
  reason: string;
}

export interface SolutionRecommendationNextAction {
  kind:
    | 'schedule_workshop'
    | 'capture_inputs'
    | 'evaluate_build_buy_partner'
    | 'review_governance'
    | 'compose_architecture';
  description: string;
}

export interface SolutionRecommendation {
  archetypeKey: string;
  archetypeName: string;
  score: SolutionRecommendationScore;
  confidence: 'low' | 'medium' | 'high';
  reasons: readonly SolutionRecommendationReason[];
  missingInputs: readonly SolutionRecommendationMissingInput[];
  recommendedComponents: readonly string[];
  recommendedWorkshops: readonly string[];
  smesRequired: readonly string[];
  architectureBuildingBlocks: readonly string[];
  deliverablesGenerated: readonly string[];
  buildBuyPartnerGuidance: {
    recommendedOption: 'build' | 'buy' | 'partner';
    rationale: string;
    warnings: readonly string[];
  };
  governanceRisks: readonly string[];
  nextAction: SolutionRecommendationNextAction;
  createdFrom: 'deterministic_solution_recommendation_engine';
}

export interface SolutionRecommendationSummary {
  totalRecommendations: number;
  topArchetypeKey: string | null;
  highConfidenceCount: number;
  totalMissingInputs: number;
}

// ---------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------

const SCORE_CAP = 24;
const RESULT_LIMIT = 5;

const HEALTHCARE_KEYWORDS: readonly string[] = [
  'clinical',
  'ambient',
  'hcc',
  'prior auth',
  'prior authorization',
  'payer',
  'ehr',
  'healthcare',
  'health care',
  'utilization management',
  'risk adjustment',
];

const ANALYTICS_KEYWORDS: readonly string[] = [
  'data',
  'lakehouse',
  'semantic',
  'bi',
  'warehouse',
  'feature store',
  'analytics',
  'data foundation',
  'metric',
  'reporting',
];

const PDLC_KEYWORDS: readonly string[] = [
  'pdlc',
  'dora',
  'code review',
  'developer productivity',
  'engineering',
  'devex',
  'software development',
  'sdlc',
];

const KYC_KEYWORDS: readonly string[] = [
  'kyc',
  'onboarding',
  'customer due diligence',
  'aml',
  'know your customer',
  'customer onboarding',
];

const HEALTHCARE_BIAS_KEYS: ReadonlyArray<SolutionArchetypeKey> = [
  'healthcare_ambient_clinical_value_chain',
  'hcc_risk_adjustment_coding_accuracy',
  'prior_authorization_utilization_management',
];

const PRIOR_BONUS = 4;

// ---------------------------------------------------------------------
// Public exports
// ---------------------------------------------------------------------

/**
 * Recommend canonical SOL3 archetypes for the supplied caller context.
 *
 * Determinism:
 *   - Pure: same input → identical output (byte-equal across calls).
 *   - Tie-break order is the canonical SOL3 archetype key order.
 *   - No clock reads / no random scoring / no live model calls.
 *
 * Scoring weights:
 *   - industry_match           (4)
 *   - failure_mode_match       (3 per match)
 *   - pattern_match            (3 per match)
 *   - capability_match         (2 per match)
 *   - dataset_match            (2 per match)
 *   - preference_match         (1 if aligned)
 *
 * Filters: only archetypes with raw ≥ 1 are returned. Top 5.
 *
 * Sparse input (no industry, no outcomes, no signals, no failure modes,
 * no patterns) returns one placeholder recommendation with a
 * `capture_inputs` next action and explicit missing-input prompts.
 */
export function recommendSolutionArchetypesForContext(
  input: SolutionRecommendationInput,
): readonly SolutionRecommendation[] {
  const normalizedInput = normalizeInput(input);

  if (isSparseInput(normalizedInput)) {
    return [buildSparsePlaceholder(normalizedInput)];
  }

  const scored: ScoredArchetype[] = [];

  for (let i = 0; i < SOLUTION_ARCHETYPE_KEYS.length; i++) {
    const key = SOLUTION_ARCHETYPE_KEYS[i];
    const archetype = SOLUTION_ARCHETYPES[key];
    const result = scoreArchetype(archetype, normalizedInput, i);
    if (result.raw >= 1) {
      scored.push(result);
    }
  }

  scored.sort((a, b) => {
    if (a.raw !== b.raw) return b.raw - a.raw;
    return a.canonicalIndex - b.canonicalIndex;
  });

  const limited = scored.slice(0, RESULT_LIMIT);

  return limited.map((s) =>
    buildRecommendationFromScored(s, normalizedInput),
  );
}

/**
 * Reduce a recommendation list into an at-a-glance summary. Pure.
 */
export function summarizeSolutionRecommendations(
  recs: readonly SolutionRecommendation[],
): SolutionRecommendationSummary {
  let high = 0;
  let missing = 0;
  for (const r of recs) {
    if (r.confidence === 'high') high += 1;
    missing += r.missingInputs.length;
  }
  return {
    totalRecommendations: recs.length,
    topArchetypeKey: recs.length > 0 ? recs[0].archetypeKey : null,
    highConfidenceCount: high,
    totalMissingInputs: missing,
  };
}

/**
 * Convenience: top-1 recommendation for the supplied input. Pure.
 */
export function getTopSolutionRecommendation(
  input: SolutionRecommendationInput,
): SolutionRecommendation | null {
  const recs = recommendSolutionArchetypesForContext(input);
  if (recs.length === 0) return null;
  return recs[0];
}

// ---------------------------------------------------------------------
// Internal: input normalization
// ---------------------------------------------------------------------

interface NormalizedInput {
  raw: SolutionRecommendationInput;
  industryLower: string;
  businessProblemLower: string;
  desiredOutcomesLower: readonly string[];
  currentStateSignalsLower: readonly string[];
  detectedFailureModes: readonly string[];
  detectedPatterns: readonly string[];
  availableDatasetDomainsLower: readonly string[];
  regulatorySensitivity: 'low' | 'medium' | 'high';
  buildBuyPreference: 'build' | 'buy' | 'partner' | 'no_preference';
  urgency: 'low' | 'medium' | 'high';
  existingPlatformsLower: readonly string[];
  knownConstraintsLower: readonly string[];
  combinedKeywords: string;
}

function normalizeInput(input: SolutionRecommendationInput): NormalizedInput {
  const industryLower = (input.industry ?? '').trim().toLowerCase();
  const businessProblemLower = (input.businessProblem ?? '')
    .trim()
    .toLowerCase();

  const desiredOutcomesLower = freezeStrings(
    (input.desiredOutcomes ?? []).map((s) => s.trim().toLowerCase()),
  );
  const currentStateSignalsLower = freezeStrings(
    (input.currentStateSignals ?? []).map((s) => s.trim().toLowerCase()),
  );
  const detectedFailureModes = freezeStrings(
    (input.detectedFailureModes ?? []).map((s) => s.trim()),
  );
  const detectedPatterns = freezeStrings(
    (input.detectedPatterns ?? []).map((s) => s.trim()),
  );
  const availableDatasetDomainsLower = freezeStrings(
    (input.availableDatasetDomains ?? []).map((s) => s.trim().toLowerCase()),
  );
  const existingPlatformsLower = freezeStrings(
    (input.existingPlatforms ?? []).map((s) => s.trim().toLowerCase()),
  );
  const knownConstraintsLower = freezeStrings(
    (input.knownConstraints ?? []).map((s) => s.trim().toLowerCase()),
  );

  const combinedKeywords = [
    industryLower,
    businessProblemLower,
    ...desiredOutcomesLower,
    ...currentStateSignalsLower,
    ...availableDatasetDomainsLower,
    ...knownConstraintsLower,
  ]
    .filter((s) => s.length > 0)
    .join(' | ');

  return {
    raw: input,
    industryLower,
    businessProblemLower,
    desiredOutcomesLower,
    currentStateSignalsLower,
    detectedFailureModes,
    detectedPatterns,
    availableDatasetDomainsLower,
    regulatorySensitivity: input.regulatorySensitivity ?? 'medium',
    buildBuyPreference: input.buildBuyPreference ?? 'no_preference',
    urgency: input.urgency ?? 'medium',
    existingPlatformsLower,
    knownConstraintsLower,
    combinedKeywords,
  };
}

function isSparseInput(n: NormalizedInput): boolean {
  return (
    n.industryLower.length === 0 &&
    n.desiredOutcomesLower.length === 0 &&
    n.currentStateSignalsLower.length === 0 &&
    n.detectedFailureModes.length === 0 &&
    n.detectedPatterns.length === 0
  );
}

// ---------------------------------------------------------------------
// Internal: scoring
// ---------------------------------------------------------------------

interface ScoredArchetype {
  archetype: SolutionArchetype;
  canonicalIndex: number;
  raw: number;
  reasons: readonly SolutionRecommendationReason[];
  failureModeOverlap: number;
}

function scoreArchetype(
  archetype: SolutionArchetype,
  n: NormalizedInput,
  canonicalIndex: number,
): ScoredArchetype {
  const reasons: SolutionRecommendationReason[] = [];
  let raw = 0;

  // industry_match (weight 4)
  const sectorLower = archetype.sector.toLowerCase();
  const familyLower = archetype.capabilityFamily.toLowerCase();
  if (n.industryLower.length > 0) {
    if (
      sectorLower.includes(n.industryLower) ||
      familyLower.includes(n.industryLower) ||
      n.industryLower.includes(sectorLower) ||
      n.industryLower.includes(familyLower)
    ) {
      raw += 4;
      reasons.push({
        kind: 'industry_match',
        description: `Industry "${n.raw.industry ?? ''}" aligns with archetype sector "${archetype.sector}".`,
        weight: 4,
      });
    }
  }

  // failure_mode_match (weight 3 per match)
  let failureModeOverlap = 0;
  for (const fm of n.detectedFailureModes) {
    if (fm.length === 0) continue;
    if (archetype.failureModesAddressed.includes(fm)) {
      raw += 3;
      failureModeOverlap += 1;
      reasons.push({
        kind: 'failure_mode_match',
        description: `Failure mode "${fm}" is addressed by this archetype.`,
        weight: 3,
      });
    }
  }

  // pattern_match (weight 3 per match)
  for (const p of n.detectedPatterns) {
    if (p.length === 0) continue;
    if (archetype.patternsUsed.includes(p)) {
      raw += 3;
      reasons.push({
        kind: 'pattern_match',
        description: `Pattern "${p}" is used by this archetype.`,
        weight: 3,
      });
    }
  }

  // capability_match (weight 2 per match)
  const capabilityHaystack = buildCapabilityHaystack(archetype);
  const capabilityTokens = [
    ...n.desiredOutcomesLower,
    ...n.currentStateSignalsLower,
  ];
  for (const token of capabilityTokens) {
    if (token.length === 0) continue;
    if (capabilityHaystack.includes(token)) {
      raw += 2;
      reasons.push({
        kind: 'capability_match',
        description: `Capability signal "${token}" matches archetype problem statement or business outcomes.`,
        weight: 2,
      });
    }
  }

  // dataset_match (weight 2 per match)
  const datasetHaystack = buildDatasetHaystack(archetype);
  for (const ds of n.availableDatasetDomainsLower) {
    if (ds.length === 0) continue;
    if (datasetHaystack.includes(ds)) {
      raw += 2;
      reasons.push({
        kind: 'dataset_match',
        description: `Dataset domain "${ds}" matches archetype current-state inputs or building blocks.`,
        weight: 2,
      });
    }
  }

  // preference_match (weight 1)
  if (n.buildBuyPreference !== 'no_preference') {
    const considerationsHaystack = archetype.buildBuyPartnerConsiderations
      .join(' ')
      .toLowerCase();
    if (considerationsHaystack.includes(n.buildBuyPreference)) {
      raw += 1;
      reasons.push({
        kind: 'preference_match',
        description: `Build/buy/partner preference "${n.buildBuyPreference}" aligns with archetype considerations.`,
        weight: 1,
      });
    }
  }

  // Special-case priors (additive bias to keep scoring deterministic)
  raw += applyPriors(archetype, n, reasons);

  return {
    archetype,
    canonicalIndex,
    raw,
    reasons: Object.freeze(reasons),
    failureModeOverlap,
  };
}

function applyPriors(
  archetype: SolutionArchetype,
  n: NormalizedInput,
  reasons: SolutionRecommendationReason[],
): number {
  let bias = 0;

  const haystack = n.combinedKeywords;

  if (containsAny(haystack, HEALTHCARE_KEYWORDS)) {
    if ((HEALTHCARE_BIAS_KEYS as ReadonlyArray<string>).includes(archetype.key)) {
      bias += PRIOR_BONUS;
      reasons.push({
        kind: 'capability_match',
        description: 'Healthcare keyword prior favors this clinical archetype.',
        weight: PRIOR_BONUS,
      });
    }
  }

  if (containsAny(haystack, ANALYTICS_KEYWORDS)) {
    if (archetype.key === 'analytics_modernization') {
      bias += PRIOR_BONUS;
      reasons.push({
        kind: 'capability_match',
        description: 'Analytics keyword prior favors analytics modernization archetype.',
        weight: PRIOR_BONUS,
      });
    }
  }

  // PDLC priors are triggered by either keyword presence in the haystack
  // OR by detected patterns / failure modes that mark engineering work.
  const pdlcSignal =
    containsAny(haystack, PDLC_KEYWORDS) ||
    n.detectedFailureModes.includes('ai_governance_operating_model_gap');
  if (pdlcSignal) {
    if (archetype.key === 'ai_led_pdlc_transformation') {
      bias += PRIOR_BONUS;
      reasons.push({
        kind: 'capability_match',
        description: 'PDLC keyword prior favors AI-led PDLC transformation archetype.',
        weight: PRIOR_BONUS,
      });
    }
  }

  if (containsAny(haystack, KYC_KEYWORDS)) {
    if (archetype.key === 'kyc_customer_onboarding_ai') {
      bias += PRIOR_BONUS;
      reasons.push({
        kind: 'capability_match',
        description: 'KYC keyword prior favors KYC and customer onboarding archetype.',
        weight: PRIOR_BONUS,
      });
    }
  }

  return bias;
}

function buildCapabilityHaystack(a: SolutionArchetype): string {
  return [a.problemStatement, ...a.businessOutcomes].join(' | ').toLowerCase();
}

function buildDatasetHaystack(a: SolutionArchetype): string {
  return [...a.currentStateInputsRequired, ...a.architectureBuildingBlocks]
    .join(' | ')
    .toLowerCase();
}

function containsAny(haystack: string, needles: readonly string[]): boolean {
  if (haystack.length === 0) return false;
  for (const needle of needles) {
    if (needle.length === 0) continue;
    if (haystack.includes(needle)) return true;
  }
  return false;
}

// ---------------------------------------------------------------------
// Internal: recommendation construction
// ---------------------------------------------------------------------

function buildRecommendationFromScored(
  scored: ScoredArchetype,
  n: NormalizedInput,
): SolutionRecommendation {
  const archetype = scored.archetype;

  const score = computeScore(scored.raw);
  const missingInputs = collectMissingInputs(n);
  const confidence = classifyConfidence(score, missingInputs.length);
  const buildBuyGuidance = deriveBuildBuyGuidance(archetype, scored, n);
  const nextAction = chooseNextAction(missingInputs.length, confidence);

  return {
    archetypeKey: archetype.key,
    archetypeName: archetype.name,
    score,
    confidence,
    reasons: scored.reasons,
    missingInputs,
    recommendedComponents: archetype.solutionComponents,
    recommendedWorkshops: archetype.workshopsRequired,
    smesRequired: archetype.smesRequired,
    architectureBuildingBlocks: archetype.architectureBuildingBlocks,
    deliverablesGenerated: archetype.deliverablesGenerated,
    buildBuyPartnerGuidance: buildBuyGuidance,
    governanceRisks: archetype.governanceRiskConsiderations,
    nextAction,
    createdFrom: 'deterministic_solution_recommendation_engine',
  };
}

function computeScore(raw: number): SolutionRecommendationScore {
  const cappedRaw = Math.max(0, raw);
  const ratio = cappedRaw / SCORE_CAP;
  const normalized = ratio > 1 ? 1 : ratio;
  let band: 'low' | 'medium' | 'high';
  if (normalized < 0.34) {
    band = 'low';
  } else if (normalized < 0.67) {
    band = 'medium';
  } else {
    band = 'high';
  }
  return { raw: cappedRaw, normalized, band };
}

function classifyConfidence(
  score: SolutionRecommendationScore,
  missingCount: number,
): 'low' | 'medium' | 'high' {
  if (score.normalized >= 0.67 && missingCount <= 1) return 'high';
  if (score.normalized >= 0.34) return 'medium';
  return 'low';
}

function collectMissingInputs(
  n: NormalizedInput,
): readonly SolutionRecommendationMissingInput[] {
  const missing: SolutionRecommendationMissingInput[] = [];
  if (n.industryLower.length === 0) {
    missing.push({
      kind: 'industry',
      impact: 'downgrades_confidence',
      reason: 'Industry was not provided; cannot anchor sector-specific archetypes.',
    });
  }
  if (n.desiredOutcomesLower.length === 0) {
    missing.push({
      kind: 'desired_outcomes',
      impact: 'downgrades_confidence',
      reason: 'No desired outcomes captured; capability scoring is partial.',
    });
  }
  if (n.currentStateSignalsLower.length === 0) {
    missing.push({
      kind: 'current_state_signals',
      impact: 'missing_metadata',
      reason: 'No current-state signals captured; architecture composition will be partial.',
    });
  }
  if (n.detectedFailureModes.length === 0 && n.detectedPatterns.length === 0) {
    missing.push({
      kind: 'failure_modes_or_patterns',
      impact: 'downgrades_confidence',
      reason: 'No failure modes or patterns supplied; PF1 / I1 evidence chain is incomplete.',
    });
  }
  return Object.freeze(missing);
}

function deriveBuildBuyGuidance(
  archetype: SolutionArchetype,
  scored: ScoredArchetype,
  n: NormalizedInput,
): SolutionRecommendation['buildBuyPartnerGuidance'] {
  const differentiation: BuildBuyPartnerScenarioInput['differentiation'] =
    scored.failureModeOverlap >= 2 ? 'high' : 'medium';
  const internalCapabilityPresent = n.existingPlatformsLower.length > 0;
  const timeToValuePressure: BuildBuyPartnerScenarioInput['timeToValuePressure'] =
    n.urgency;
  const regulatedContext = n.regulatorySensitivity === 'high';

  const dataRightsRequired: BuildBuyPartnerScenarioInput['dataRightsRequired'] =
    regulatedContext ? 'tenant_owned' : 'shared';

  const marketCapabilityMaturity: BuildBuyPartnerScenarioInput['marketCapabilityMaturity'] =
    classifyMarketMaturity(archetype.key);

  const workflowComplexity: BuildBuyPartnerScenarioInput['workflowComplexity'] =
    scored.failureModeOverlap >= 1 ? 'high' : 'medium';

  const highRiskTags: readonly string[] = regulatedContext
    ? ['regulatory_context']
    : [];

  const scenario: BuildBuyPartnerScenarioInput = {
    capabilityKey: archetype.key,
    differentiation,
    internalCapabilityPresent,
    timeToValuePressure,
    marketCapabilityMaturity,
    regulatedContext,
    highRiskTags,
    dataRightsRequired,
    workflowComplexity,
  };

  const evaluation = evaluateBuildBuyPartnerScenario(scenario);
  const recommendedOption: BuildBuyPartnerOption =
    evaluation.recommendation.recommendedOption;

  return {
    recommendedOption,
    rationale: evaluation.recommendation.rationale,
    warnings: evaluation.recommendation.governanceWarnings,
  };
}

function classifyMarketMaturity(
  key: SolutionArchetypeKey,
): BuildBuyPartnerScenarioInput['marketCapabilityMaturity'] {
  // Deterministic mapping of canonical archetype key to a defensible
  // market-maturity assumption. Keeps SOL9 a pure library — no live
  // vendor catalog reads.
  switch (key) {
    case 'analytics_modernization':
    case 'contact_center_ai_transformation':
    case 'predictive_maintenance_modernization':
    case 'finance_fpna_ai_automation':
      return 'mature';
    case 'ai_led_pdlc_transformation':
    case 'healthcare_ambient_clinical_value_chain':
    case 'kyc_customer_onboarding_ai':
    case 'service_operations_agentic_automation':
      return 'emerging';
    case 'hcc_risk_adjustment_coding_accuracy':
    case 'prior_authorization_utilization_management':
    case 'build_buy_partner_evaluation':
    case 'ai_governance_operating_model':
      return 'fragmented';
    default:
      return 'emerging';
  }
}

function chooseNextAction(
  missingCount: number,
  confidence: 'low' | 'medium' | 'high',
): SolutionRecommendationNextAction {
  if (missingCount >= 2) {
    return {
      kind: 'capture_inputs',
      description: 'Capture missing current-state inputs before continuing.',
    };
  }
  if (confidence === 'high') {
    return {
      kind: 'compose_architecture',
      description: 'Compose the target-state architecture using SOL3 building blocks.',
    };
  }
  if (confidence === 'medium') {
    return {
      kind: 'evaluate_build_buy_partner',
      description: 'Run SOL6 build/buy/partner evaluation against the candidate option.',
    };
  }
  return {
    kind: 'schedule_workshop',
    description: 'Schedule the recommended first workshop to capture remaining context.',
  };
}

// ---------------------------------------------------------------------
// Internal: sparse-input placeholder
// ---------------------------------------------------------------------

function buildSparsePlaceholder(
  n: NormalizedInput,
): SolutionRecommendation {
  const missingInputs: SolutionRecommendationMissingInput[] = [
    {
      kind: 'industry',
      impact: 'blocks_recommendation',
      reason: 'Industry was not supplied; recommendation cannot be anchored to a sector.',
    },
    {
      kind: 'desired_outcomes',
      impact: 'blocks_recommendation',
      reason: 'No desired outcomes were supplied; capability scoring cannot run.',
    },
    {
      kind: 'current_state_signals',
      impact: 'blocks_recommendation',
      reason: 'No current-state signals were supplied; architecture composition is unsafe.',
    },
    {
      kind: 'failure_modes_or_patterns',
      impact: 'blocks_recommendation',
      reason: 'No failure modes or patterns were supplied; PF1 / I1 evidence chain is empty.',
    },
  ];

  // Use the first canonical archetype as a placeholder anchor so callers
  // see a fully-shaped record. The score band is low and confidence is
  // low; the next action explicitly tells callers to capture inputs.
  const placeholderKey = SOLUTION_ARCHETYPE_KEYS[0];
  const placeholder = SOLUTION_ARCHETYPES[placeholderKey];

  void n; // placeholder anchored to canonical archetype, not raw input.

  return {
    archetypeKey: placeholder.key,
    archetypeName: placeholder.name,
    score: { raw: 0, normalized: 0, band: 'low' },
    confidence: 'low',
    reasons: Object.freeze([]),
    missingInputs: Object.freeze(missingInputs),
    recommendedComponents: placeholder.solutionComponents,
    recommendedWorkshops: placeholder.workshopsRequired,
    smesRequired: placeholder.smesRequired,
    architectureBuildingBlocks: placeholder.architectureBuildingBlocks,
    deliverablesGenerated: placeholder.deliverablesGenerated,
    buildBuyPartnerGuidance: {
      recommendedOption: 'partner',
      rationale:
        'Insufficient inputs to evaluate build vs buy vs partner; defaulting to partner-led discovery while inputs are captured.',
      warnings: Object.freeze([
        'Build/buy/partner posture is provisional until inputs are captured.',
      ]),
    },
    governanceRisks: placeholder.governanceRiskConsiderations,
    nextAction: {
      kind: 'capture_inputs',
      description:
        'Capture industry, desired outcomes, current-state signals, and detected failure modes / patterns before re-running the engine.',
    },
    createdFrom: 'deterministic_solution_recommendation_engine',
  };
}

// ---------------------------------------------------------------------
// Internal: helpers
// ---------------------------------------------------------------------

function freezeStrings(arr: string[]): readonly string[] {
  return Object.freeze(arr.slice());
}

// Deterministic Context Bundle scoring and classification.
//
// S2 slice. Consumes the declarative types from ./context-bundle.ts and
// produces a ContextBundleQualityScore (6 dimensions), a
// ContextBundleState (5 states), and a ContextBundleResponseGate that
// downstream composition must honor.
//
// Deterministic by design:
// - No model calls.
// - No network.
// - No Date.now() reads.
// - Same input produces same output every time.
//
// Scoring scale: 0-100 integer. For normal dimensions, higher is better.
// For vanilla_response_risk, higher = higher risk of a generic answer.

import {
  CONTEXT_BUNDLE_CATEGORY_KEYS,
  type ContextBundle,
  type ContextBundleCategoryKey,
  type ContextBundleConfidenceTier,
  type ContextBundleEvidenceReference,
  type ContextBundlePatternReference,
  type ContextBundleQualityScore,
  type ContextBundleResponseGate,
  type ContextBundleState,
} from './context-bundle';

// --- Scoring thresholds (named so tests and S4 read them explicitly) --

/**
 * Integer 0-100 score thresholds used by classification and gating.
 * Kept as exported constants so S4 and test fixtures align with the
 * runtime rules without re-deriving them.
 */
export const CONTEXT_BUNDLE_SCORE_THRESHOLDS = {
  /** Minimum completeness to consider a bundle "complete". */
  completeMinCompleteness: 75,
  /** Minimum evidence coverage to consider a bundle "complete". */
  completeMinEvidenceCoverage: 60,
  /** Minimum workflow awareness to consider a bundle "complete". */
  completeMinWorkflowAwareness: 60,
  /** Minimum actionability to consider a bundle "complete". */
  completeMinActionability: 50,
  /** Maximum vanilla response risk to consider a bundle "complete". */
  completeMaxVanillaRisk: 35,

  /** Pattern grounding floor for the "pattern_only" fallback. */
  patternOnlyMinPatternGrounding: 50,
  /** Evidence ceiling to still be in "pattern_only" rather than "complete". */
  patternOnlyMaxEvidenceCoverage: 45,

  /** Completeness floor below which a bundle is "insufficient". */
  insufficientMaxCompleteness: 35,

  /** Confidence tier cutoffs on a 0-100 scale. */
  highConfidenceMin: 75,
  mediumConfidenceMin: 50,
} as const;

// --- Dimension scorers -------------------------------------------------

/**
 * Per-category weights summing to 100. Identity is the heaviest because
 * a bundle without identity can never serve any safe response.
 */
const CATEGORY_WEIGHTS: Record<ContextBundleCategoryKey, number> = {
  identity: 20,
  workObject: 15,
  workflowState: 15,
  businessContext: 10,
  artifacts: 10,
  patterns: 10,
  evidence: 15,
  conversation: 5,
};

export function computeContextCompleteness(bundle: ContextBundle): number {
  let earned = 0;
  for (const key of CONTEXT_BUNDLE_CATEGORY_KEYS) {
    const category = bundle.categories[key];
    if (!category || !category.present) continue;
    const weight = CATEGORY_WEIGHTS[key];
    // Partial credit when a category is present but self-reports gaps.
    const gapPenalty = Math.min(category.missingFields.length * 0.1, 0.5);
    earned += weight * (1 - gapPenalty);
  }
  return clamp01to100(earned);
}

const PATTERN_AUTHORING_BASE: Record<
  ContextBundlePatternReference['authoringStatus'],
  number
> = {
  'BATTLE-TESTED': 100,
  'AUTHORED-EXPERT': 85,
  'AUTHORED-REVIEWED': 70,
  'AUTHORED-DRAFT': 50,
  unknown: 30,
};

export function computePatternGrounding(bundle: ContextBundle): number {
  if (bundle.patternReferences.length === 0) return 0;

  // Use the strongest authoring tier in the bundle as the base.
  const bestBase = bundle.patternReferences.reduce((max, pattern) => {
    const base = PATTERN_AUTHORING_BASE[pattern.authoringStatus] ?? 30;
    return Math.max(max, base);
  }, 0);

  // Relevance signal from the best-scoring pattern.
  const bestRelevance = bundle.patternReferences.reduce((max, pattern) => {
    const r = Number.isFinite(pattern.relevanceScore) ? pattern.relevanceScore : 0;
    return Math.max(max, clamp01to100(r));
  }, 0);

  // Cited sections and multi-pattern coverage add a small deterministic bump.
  const sectionsCitedCount = bundle.patternReferences.reduce(
    (sum, p) => sum + p.sectionsCited.length,
    0,
  );
  const sectionBonus = Math.min(sectionsCitedCount * 2, 10);
  const multiPatternBonus = bundle.patternReferences.length > 1 ? 5 : 0;

  // Blend the base and relevance, then add bonuses.
  const blended = 0.6 * bestBase + 0.4 * bestRelevance;
  return clamp01to100(blended + sectionBonus + multiPatternBonus);
}

const EVIDENCE_CONFIDENCE_POINTS: Record<ContextBundleConfidenceTier, number> = {
  HIGH: 30,
  MEDIUM: 20,
  LOW: 10,
};

export function computeEvidenceCoverage(bundle: ContextBundle): number {
  const refs = bundle.evidenceReferences;
  if (refs.length === 0) return 0;

  // Sum confidence points with diminishing returns; first reference is
  // worth its full points, each subsequent reference adds 0.75x, 0.5x,
  // 0.25x, then a flat small bonus per additional reference. Cap at 100.
  const sorted = [...refs].sort(
    (a, b) => EVIDENCE_CONFIDENCE_POINTS[b.confidence]
      - EVIDENCE_CONFIDENCE_POINTS[a.confidence],
  );
  const diminishing = [1, 0.75, 0.5, 0.25];
  let total = 0;
  for (let i = 0; i < sorted.length; i += 1) {
    const basePoints = EVIDENCE_CONFIDENCE_POINTS[sorted[i].confidence];
    const multiplier = diminishing[i] ?? 0.1;
    total += basePoints * multiplier;
  }
  // Evidence category-present bonus so a populated Evidence category with
  // references can reach complete territory.
  if (bundle.categories.evidence?.present) total += 10;
  return clamp01to100(total);
}

export function computeWorkflowAwareness(bundle: ContextBundle): number {
  let score = 0;
  if (bundle.categories.workObject?.present) score += 25;
  if (bundle.categories.workflowState?.present) {
    score += 35;
    if (bundle.categories.workflowState.missingFields.length === 0) score += 10;
  }
  if (bundle.categories.artifacts?.present) score += 10;
  if (bundle.artifactReferences.length > 0) score += 10;
  if (bundle.categories.businessContext?.present) score += 10;
  return clamp01to100(score);
}

export function computeActionability(bundle: ContextBundle): number {
  const actions = bundle.allowedActions;
  if (actions.length === 0) return 0;

  const allowed = actions.filter((a) => a.allowed);
  if (allowed.length === 0) return 10;

  const distinctKinds = new Set(allowed.map((a) => a.kind));
  const substantive = allowed.filter(
    (a) => a.kind !== 'none' && a.kind !== 'refuse',
  );

  let score = 0;
  // Any substantive action earns a base.
  if (substantive.length >= 1) score += 40;
  // Multiple allowed actions demonstrates breadth.
  if (allowed.length >= 2) score += 20;
  if (allowed.length >= 3) score += 15;
  // Distinct kinds show the bundle covers more than one lane.
  if (distinctKinds.size >= 2) score += 15;
  // Workflow awareness pairs with actionability; without a work object
  // "actionable" is weaker because actions are usually meta-navigation.
  if (!bundle.categories.workObject?.present) score = Math.min(score, 60);

  return clamp01to100(score);
}

export function computeVanillaResponseRisk(bundle: ContextBundle): number {
  // Start at maximum risk; each specific signal reduces it.
  let risk = 100;

  if (bundle.categories.identity?.present) risk -= 10;
  if (bundle.categories.workObject?.present) risk -= 20;
  if (bundle.categories.workflowState?.present) risk -= 15;
  if (bundle.categories.artifacts?.present) risk -= 10;
  if (bundle.categories.conversation?.present) risk -= 5;
  if (bundle.categories.businessContext?.present) risk -= 5;

  // Evidence and patterns most directly prevent vanilla answers.
  if (bundle.evidenceReferences.length > 0) risk -= 15;
  const highConfidenceEvidence = bundle.evidenceReferences.some(
    (ref) => ref.confidence === 'HIGH',
  );
  if (highConfidenceEvidence) risk -= 10;

  if (bundle.patternReferences.length > 0) {
    risk -= 10;
    const strongPattern = bundle.patternReferences.some(
      (p) => p.authoringStatus === 'BATTLE-TESTED' || p.authoringStatus === 'AUTHORED-EXPERT',
    );
    if (strongPattern) risk -= 5;
    const sectionsCited = bundle.patternReferences.some(
      (p) => p.sectionsCited.length > 0,
    );
    if (sectionsCited) risk -= 5;
  }

  return clamp01to100(risk);
}

// --- Classification ----------------------------------------------------

export function classifyContextBundle(bundle: ContextBundle): ContextBundleState {
  // `blocked` precedence: any missing input flagged as blocking, or the
  // identity category itself absent, forces a refusal.
  const hasBlockingInput = bundle.missingInputs.some((m) => m.blocking);
  const identityMissing = !bundle.categories.identity?.present;
  if (hasBlockingInput || identityMissing) return 'blocked';

  const completeness = computeContextCompleteness(bundle);
  const patternGrounding = computePatternGrounding(bundle);
  const evidenceCoverage = computeEvidenceCoverage(bundle);
  const workflowAwareness = computeWorkflowAwareness(bundle);
  const actionability = computeActionability(bundle);
  const vanillaRisk = computeVanillaResponseRisk(bundle);
  const t = CONTEXT_BUNDLE_SCORE_THRESHOLDS;

  // `complete`: all signals strong, risk low.
  if (
    completeness >= t.completeMinCompleteness
    && evidenceCoverage >= t.completeMinEvidenceCoverage
    && workflowAwareness >= t.completeMinWorkflowAwareness
    && actionability >= t.completeMinActionability
    && vanillaRisk <= t.completeMaxVanillaRisk
  ) {
    return 'complete';
  }

  // `insufficient`: bundle is too thin to be safe.
  if (
    completeness <= t.insufficientMaxCompleteness
    && !bundle.categories.workObject?.present
    && patternGrounding < t.patternOnlyMinPatternGrounding
  ) {
    return 'insufficient';
  }

  // `pattern_only`: patterns carry the answer because event-specific
  // context is missing.
  if (
    patternGrounding >= t.patternOnlyMinPatternGrounding
    && evidenceCoverage <= t.patternOnlyMaxEvidenceCoverage
    && (!bundle.categories.workObject?.present || workflowAwareness < 40)
  ) {
    return 'pattern_only';
  }

  // Otherwise the bundle is usable with gaps.
  return 'usable_with_gaps';
}

// --- Quality score aggregator -----------------------------------------

export function scoreContextBundle(bundle: ContextBundle): ContextBundleQualityScore {
  const context_completeness = computeContextCompleteness(bundle);
  const pattern_grounding = computePatternGrounding(bundle);
  const evidence_coverage = computeEvidenceCoverage(bundle);
  const workflow_awareness = computeWorkflowAwareness(bundle);
  const actionability = computeActionability(bundle);
  const vanilla_response_risk = computeVanillaResponseRisk(bundle);
  const state = classifyContextBundle(bundle);

  return {
    context_completeness,
    pattern_grounding,
    evidence_coverage,
    workflow_awareness,
    actionability,
    vanilla_response_risk,
    overallConfidence: deriveConfidence(state),
    notes: collectNotes(bundle, {
      context_completeness,
      pattern_grounding,
      evidence_coverage,
      workflow_awareness,
      actionability,
      vanilla_response_risk,
    }),
  };
}

function deriveConfidence(state: ContextBundleState): ContextBundleConfidenceTier {
  switch (state) {
    case 'complete':
      return 'HIGH';
    case 'usable_with_gaps':
    case 'pattern_only':
      return 'MEDIUM';
    case 'insufficient':
    case 'blocked':
      return 'LOW';
  }
}

function collectNotes(
  bundle: ContextBundle,
  score: Pick<
    ContextBundleQualityScore,
    | 'context_completeness'
    | 'pattern_grounding'
    | 'evidence_coverage'
    | 'workflow_awareness'
    | 'actionability'
    | 'vanilla_response_risk'
  >,
): string[] {
  const notes: string[] = [];
  if (!bundle.categories.identity?.present) {
    notes.push('Identity context is missing.');
  }
  if (!bundle.categories.workObject?.present) {
    notes.push('Work object context is missing.');
  }
  if (!bundle.categories.workflowState?.present) {
    notes.push('Workflow state context is missing.');
  }
  if (bundle.evidenceReferences.length === 0) {
    notes.push('No evidence references are attached to this bundle.');
  }
  if (bundle.patternReferences.length === 0) {
    notes.push('No pattern references are attached to this bundle.');
  }
  if (score.vanilla_response_risk >= 60) {
    notes.push('Vanilla-response risk is elevated for this bundle.');
  }
  if (score.actionability < 30) {
    notes.push('Actionability is low; few allowed actions are available.');
  }
  const blockingInputs = bundle.missingInputs.filter((m) => m.blocking);
  if (blockingInputs.length > 0) {
    notes.push(
      `Blocking inputs remain: ${blockingInputs.map((m) => m.label).join('; ')}.`,
    );
  }
  return notes;
}

// --- Response gate -----------------------------------------------------

/**
 * Machine-readable recommendation consumed by downstream composition.
 * The concrete gate booleans on ContextBundleResponseGate already encode
 * the same decision, but the reason code is easier to branch on.
 */
export type ContextBundleGateRecommendation =
  | 'proceed'
  | 'proceed_with_disclosure'
  | 'ask_for_missing_context'
  | 'refuse_or_defer';

export function createResponseGate(bundle: ContextBundle): ContextBundleResponseGate {
  const state = bundle.state ?? classifyContextBundle(bundle);
  const evidenceMissing = bundle.evidenceReferences.length === 0;
  const workObjectMissing = !bundle.categories.workObject?.present;
  const blockingInputs = bundle.missingInputs.filter((m) => m.blocking);

  switch (state) {
    case 'complete':
      return {
        state,
        permitsResponse: true,
        requiresDisclosure: false,
        requiresPatternLabeling: false,
        requiresRefusal: false,
        requiresGuidedChoices: false,
        reason: 'proceed',
      };

    case 'usable_with_gaps':
      return {
        state,
        permitsResponse: true,
        requiresDisclosure: true,
        requiresPatternLabeling: false,
        requiresRefusal: false,
        requiresGuidedChoices: false,
        reason: 'proceed_with_disclosure',
      };

    case 'pattern_only': {
      // If the event-specific gap is so wide we can't even situate the
      // pattern, downgrade to asking for missing context instead of
      // delivering pattern prose the user can't apply.
      if (workObjectMissing && evidenceMissing) {
        return {
          state,
          permitsResponse: false,
          requiresDisclosure: true,
          requiresPatternLabeling: true,
          requiresRefusal: false,
          requiresGuidedChoices: true,
          reason: 'ask_for_missing_context',
        };
      }
      return {
        state,
        permitsResponse: true,
        requiresDisclosure: true,
        requiresPatternLabeling: true,
        requiresRefusal: false,
        requiresGuidedChoices: false,
        reason: 'proceed_with_disclosure',
      };
    }

    case 'insufficient':
      return {
        state,
        permitsResponse: false,
        requiresDisclosure: true,
        requiresPatternLabeling: false,
        requiresRefusal: false,
        requiresGuidedChoices: true,
        reason: 'ask_for_missing_context',
      };

    case 'blocked':
      return {
        state,
        permitsResponse: false,
        requiresDisclosure: true,
        requiresPatternLabeling: false,
        requiresRefusal: true,
        requiresGuidedChoices: false,
        reason: blockingInputs.length > 0
          ? `refuse_or_defer:${blockingInputs.map((m) => m.id).join(',')}`
          : 'refuse_or_defer',
      };
  }
}

// --- Utilities ---------------------------------------------------------

function clamp01to100(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 100) return 100;
  return Math.round(value);
}

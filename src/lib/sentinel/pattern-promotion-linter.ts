// pattern-promotion-linter.ts — PAT2
//
// Deterministic linter that checks whether a PatternRegistryEntry is ready to
// be promoted from one lifecycle stage to another.
// No React. No network calls. No model calls. Deterministic seed output only.
//
// PAT2 explicitly DOES NOT:
//   - call fetch, Date.now, Math.random, or new Date.
//   - read from src/lib/source/, src/lib/nexus/, src/lib/atlas/,
//     src/lib/agent/, src/lib/auth/, supabase.
//   - render any UI or invoke any agent runtime.

import {
  buildPatternRegistryView,
  type PatternRegistryEntry,
  type PatternLifecycleStage,
} from './pattern-registry-lifecycle';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PatternPromotionFinding {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  field: string | null;
}

export interface PatternPromotionResult {
  patternKey: string;
  fromStage: PatternLifecycleStage;
  toStage: PatternLifecycleStage;
  isAllowed: boolean;
  findings: readonly PatternPromotionFinding[];
  errorCount: number;
  warningCount: number;
  deterministicSeed: true;
}

export interface PatternPromotionRule {
  id: string;
  description: string;
  appliesTo: readonly PatternLifecycleStage[];
  severity: 'error' | 'warning' | 'info';
}

// ---------------------------------------------------------------------------
// Canonical promotion rules
// ---------------------------------------------------------------------------

export const PATTERN_PROMOTION_RULES: readonly PatternPromotionRule[] = [
  {
    id: 'requires_trigger_conditions',
    description:
      'Pattern must have at least one trigger condition to be promoted to active.',
    appliesTo: ['active'],
    severity: 'error',
  },
  {
    id: 'requires_contra_indicators',
    description:
      'Pattern should have at least one contra-indicator to help practitioners avoid false positives.',
    appliesTo: ['active', 'deprecated'],
    severity: 'warning',
  },
  {
    id: 'requires_remedy_hooks',
    description:
      'Pattern must have at least one remedy hook to be promoted to active.',
    appliesTo: ['active'],
    severity: 'error',
  },
  {
    id: 'requires_description_length',
    description:
      'Pattern description must be at least 20 characters to ensure adequate documentation.',
    appliesTo: ['active', 'deprecated', 'archived'],
    severity: 'error',
  },
  {
    id: 'requires_deprecation_note_when_retiring',
    description:
      'Pattern must have a deprecationNote set when promoting to deprecated.',
    appliesTo: ['deprecated'],
    severity: 'error',
  },
  {
    id: 'signal_strength_proposed_should_be_weak_or_moderate',
    description:
      'Proposed patterns with definitive or strong signal strength should be reconsidered — promote to active or downgrade signal confidence.',
    appliesTo: ['proposed'],
    severity: 'warning',
  },
] as const;

// ---------------------------------------------------------------------------
// Internal rule evaluators
// ---------------------------------------------------------------------------

type RuleEvaluator = (
  entry: PatternRegistryEntry,
  toStage: PatternLifecycleStage,
) => PatternPromotionFinding | null;

const RULE_EVALUATORS: readonly RuleEvaluator[] = [
  // requires_trigger_conditions
  (entry, toStage) => {
    const rule = PATTERN_PROMOTION_RULES[0];
    if (!rule.appliesTo.includes(toStage)) return null;
    if (entry.triggerConditions.length >= 1) return null;
    return {
      ruleId: rule.id,
      severity: rule.severity,
      message:
        'Pattern has no trigger conditions. At least one is required before promoting to active.',
      field: 'triggerConditions',
    };
  },

  // requires_contra_indicators
  (entry, toStage) => {
    const rule = PATTERN_PROMOTION_RULES[1];
    if (!rule.appliesTo.includes(toStage)) return null;
    if (entry.contraIndicators.length >= 1) return null;
    return {
      ruleId: rule.id,
      severity: rule.severity,
      message:
        'Pattern has no contra-indicators. Adding at least one reduces false-positive risk.',
      field: 'contraIndicators',
    };
  },

  // requires_remedy_hooks
  (entry, toStage) => {
    const rule = PATTERN_PROMOTION_RULES[2];
    if (!rule.appliesTo.includes(toStage)) return null;
    if (entry.remedyHooks.length >= 1) return null;
    return {
      ruleId: rule.id,
      severity: rule.severity,
      message:
        'Pattern has no remedy hooks. At least one is required before promoting to active.',
      field: 'remedyHooks',
    };
  },

  // requires_description_length
  (entry, toStage) => {
    const rule = PATTERN_PROMOTION_RULES[3];
    if (!rule.appliesTo.includes(toStage)) return null;
    if (entry.description.length >= 20) return null;
    return {
      ruleId: rule.id,
      severity: rule.severity,
      message:
        `Pattern description is ${entry.description.length} characters. Minimum is 20 characters.`,
      field: 'description',
    };
  },

  // requires_deprecation_note_when_retiring
  (entry, toStage) => {
    const rule = PATTERN_PROMOTION_RULES[4];
    if (!rule.appliesTo.includes(toStage)) return null;
    if (entry.deprecationNote !== null && entry.deprecationNote.length > 0) return null;
    return {
      ruleId: rule.id,
      severity: rule.severity,
      message:
        'Pattern must have a deprecationNote explaining why it is being retired.',
      field: 'deprecationNote',
    };
  },

  // signal_strength_proposed_should_be_weak_or_moderate
  (entry, toStage) => {
    const rule = PATTERN_PROMOTION_RULES[5];
    if (!rule.appliesTo.includes(toStage)) return null;
    if (
      entry.signalStrength !== 'definitive' &&
      entry.signalStrength !== 'strong'
    )
      return null;
    return {
      ruleId: rule.id,
      severity: rule.severity,
      message:
        `Pattern has signal strength '${entry.signalStrength}' while still proposed. Consider promoting to active or downgrading signal confidence to weak or moderate.`,
      field: 'signalStrength',
    };
  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns all promotion findings for the given entry and target stage.
 */
export function listPromotionFindings(
  entry: PatternRegistryEntry,
  toStage: PatternLifecycleStage,
): readonly PatternPromotionFinding[] {
  const findings: PatternPromotionFinding[] = [];
  for (const evaluator of RULE_EVALUATORS) {
    const finding = evaluator(entry, toStage);
    if (finding !== null) findings.push(finding);
  }
  return findings;
}

/**
 * Returns true if all error-severity rules pass for the given promotion.
 * Warnings do not block promotion.
 */
export function isPromotionAllowed(
  entry: PatternRegistryEntry,
  toStage: PatternLifecycleStage,
): boolean {
  const findings = listPromotionFindings(entry, toStage);
  return findings.every((f) => f.severity !== 'error');
}

/**
 * Runs all promotion lint rules for the given entry and target stage.
 * Returns a PatternPromotionResult with full findings and a single
 * isAllowed flag.
 */
export function lintPatternPromotion(
  entry: PatternRegistryEntry,
  toStage: PatternLifecycleStage,
): PatternPromotionResult {
  const findings = listPromotionFindings(entry, toStage);
  let errorCount = 0;
  let warningCount = 0;
  for (const f of findings) {
    if (f.severity === 'error') errorCount += 1;
    else if (f.severity === 'warning') warningCount += 1;
  }
  return {
    patternKey: entry.patternKey,
    fromStage: entry.lifecycleStage,
    toStage,
    isAllowed: errorCount === 0,
    findings,
    errorCount,
    warningCount,
    deterministicSeed: true,
  };
}

// ---------------------------------------------------------------------------
// Convenience re-export for consumers that want the registry
// ---------------------------------------------------------------------------

export { buildPatternRegistryView };

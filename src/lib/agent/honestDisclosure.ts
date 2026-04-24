// Honest-disclosure vocabulary · File 08 Section 10
//
// Agents speak with consistent confidence vocabulary. This module is the
// single source of truth for the phrases listed in §10.1-10.6. The
// renderer composes them against the `rendered_response` shape to tell
// the reader what kind of claim they're looking at.
//
// Why a module and not inline strings: personas reading the library (Dr.
// L especially) track confidence vocabulary carefully. If Nexus and
// Sentinel say the same thing different ways for "evidence is thin" the
// pattern reads as sloppy, not rigorous. One module ensures the voice
// stays tight across four agents.
//
// The phrases here are intentionally short — they're headers or openers,
// not body prose. The agent's composed response provides the substantive
// claim; the vocabulary frames what level of certainty the claim carries.

import type {
  ConfidenceSignal,
  ConfidenceTier,
  HonestDisclosureMetadata,
  Provenance,
  RecommendedResponseMode,
} from './renderedResponse';
import {
  CONTEXT_BUNDLE_CATEGORY_KEYS,
  type ContextBundle,
  type ContextBundleCategoryKey,
  type ContextBundleQualityScore,
  type ContextBundleResponseGate,
  type ContextBundleState,
  type ContextBundleSummary,
} from './context-bundle';

/**
 * §10.1 · High confidence openers.
 * Use when retrieval returned ≥3 patterns above 0.8 confidence and at
 * least one direct precedent was cited.
 */
export const HIGH_CONFIDENCE_PHRASES = [
  'Direct precedent.',
  'Measured across multiple programs.',
  'Benchmarked.',
] as const;

/**
 * §10.2 · Medium confidence openers.
 * Use when retrieval matched adjacent patterns or when direct evidence
 * is limited but inference is defensible.
 */
export const MEDIUM_CONFIDENCE_PHRASES = [
  'Inferred from adjacent pattern. Direct evidence is limited.',
  'Pattern suggests, though we haven\u2019t seen this specific case.',
  'Reasonable extrapolation; applies if the named assumption holds.',
] as const;

/**
 * §10.3 · Low confidence openers.
 * Use when retrieval returned nothing above 0.6 or when the claim is
 * explicitly speculative. The response MUST open with one of these before
 * rendering any LOW-tier citations (per §9.3 rule).
 */
export const LOW_CONFIDENCE_PHRASES = [
  'This is a reasoned guess \u2014 we don\u2019t have direct evidence.',
  'The pattern library doesn\u2019t cover this case; here\u2019s the closest analog.',
  'I don\u2019t have strong data on this. Want me to tell you what we\u2019d need to answer better?',
] as const;

/**
 * §10.4 · Sparse retrieval openers.
 * When `rendered_response.sparsity_flag` is true, the renderer MUST show
 * one of these as the first substantive sentence (§4.7, §7.3).
 */
export const SPARSITY_PHRASES = [
  'Evidence on this is thin \u2014 here\u2019s what we can say.',
  'The library doesn\u2019t have strong patterns for this. What we do have is below.',
  'I can\u2019t answer this from patterns alone. Do you want me to reason from first principles instead?',
] as const;

/**
 * §10.5 · Industry-authored vs measured-outcome prefixes.
 * Attach to any observation citation so the reader sees whether the
 * source is industry knowledge vs customer outcomes. Conflating them is
 * a rendering bug per §10.5 and the canonical disclaimer.
 */
export const PROVENANCE_PREFIXES: Record<Provenance, string> = {
  authored: 'Authored from industry knowledge (not measured outcomes):',
  observed: 'Observed in program telemetry:',
  measured: 'Measured in programs:',
  composite: 'Composite observation (aggregated across tenants):',
};

/**
 * §10.6 · "I can't help on this turn" patterns.
 * Used when Claude legitimately can't answer — outside scope, missing
 * composition, wrong surface. Every one of these offers a path forward;
 * never a bare refusal.
 */
export const CANNOT_HELP_PHRASES = [
  'That\u2019s outside what AbarVa tracks.',
  'I don\u2019t have access to that data in the current composition. Want me to flag it for the program team?',
  'The question is worth asking but the answer lives outside the pattern library. Try the linked alternate path.',
] as const;

/**
 * Select the opener phrase that matches the response's confidence signal.
 * Returns null for `none` signal (operational/procedural responses don't
 * need a confidence opener).
 */
export function openerFor(signal: ConfidenceSignal, index = 0): string | null {
  switch (signal) {
    case 'high':
      return HIGH_CONFIDENCE_PHRASES[index % HIGH_CONFIDENCE_PHRASES.length];
    case 'medium':
      return MEDIUM_CONFIDENCE_PHRASES[index % MEDIUM_CONFIDENCE_PHRASES.length];
    case 'low':
      return LOW_CONFIDENCE_PHRASES[index % LOW_CONFIDENCE_PHRASES.length];
    case 'none':
    default:
      return null;
  }
}

/**
 * Select a sparsity opener. Callers can rotate the index to avoid the
 * library feeling stale across repeated sparse responses.
 */
export function sparsityOpener(index = 0): string {
  return SPARSITY_PHRASES[index % SPARSITY_PHRASES.length];
}

/**
 * Attach §10.5 provenance prefix to an observation label. Returns the
 * label unchanged when provenance is unset (legacy citations from
 * earlier work orders may not have it yet).
 */
export function withProvenance(label: string, provenance?: Provenance): string {
  if (!provenance) return label;
  return `${PROVENANCE_PREFIXES[provenance]} ${label}`;
}

// =====================================================================
// S5 · Honest-disclosure metadata derived from S1 ContextBundle + S2
// scoring. Pure, deterministic, no model calls. Each helper accepts the
// minimal information it needs so callers can mix-and-match (e.g. a
// renderer that has the bundle vs. an API consumer that only has the
// summary).
// =====================================================================

/**
 * Vanilla-response-risk threshold above which we suppress a HIGH
 * confidence verdict even if completeness is otherwise high.
 */
const HIGH_VANILLA_RISK_THRESHOLD = 50;

/** Human-friendly labels for the eight canonical Context Bundle categories. */
export const CONTEXT_CATEGORY_LABELS: Record<ContextBundleCategoryKey, string> = {
  identity: 'Identity',
  workObject: 'Work object',
  workflowState: 'Workflow state',
  businessContext: 'Business context',
  artifacts: 'Artifacts',
  patterns: 'Pattern library',
  evidence: 'Evidence',
  conversation: 'Conversation',
};

/**
 * Disclosure prose per state. Kept short, polished, surface-agnostic.
 * Renderers can append a more specific addendum (named missing input,
 * named vendor, etc.) but the stock copy is the canonical baseline.
 */
const DISCLOSURE_MESSAGES: Record<ContextBundleState, string> = {
  complete:
    'I have enough client, workflow, evidence, and pattern context to provide a grounded recommendation.',
  usable_with_gaps:
    'I can provide a directional recommendation, but a few inputs are missing.',
  pattern_only:
    'This is pattern-informed guidance; client-specific evidence is limited.',
  insufficient:
    'I do not have enough context to give a reliable answer yet.',
  blocked:
    'I cannot responsibly answer this until the blocking context is resolved.',
};

/**
 * Map a Context Bundle state plus its score into a display confidence
 * tier. High vanilla-response risk suppresses HIGH even if completeness
 * is otherwise sufficient.
 */
export function deriveConfidenceLevelFromContextScore(
  score: Pick<ContextBundleQualityScore, 'vanilla_response_risk' | 'overallConfidence'>
    | null
    | undefined,
  state?: ContextBundleState | null,
): ConfidenceTier {
  // No score at all → defer to the state.
  if (!score) {
    if (state === 'complete') return 'HIGH';
    if (state === 'usable_with_gaps' || state === 'pattern_only') return 'MEDIUM';
    return 'LOW';
  }

  const tier = score.overallConfidence;
  // HIGH suppression: even if the bundle scores high overall, an
  // elevated vanilla-response risk means we cannot claim HIGH.
  if (tier === 'HIGH'
    && score.vanilla_response_risk > HIGH_VANILLA_RISK_THRESHOLD) {
    return 'MEDIUM';
  }
  return tier;
}

/**
 * Build the disclosure prose line for a bundle state. Returns null for
 * states the renderer should not announce (no state available yet).
 */
export function deriveDisclosureMessage(input: {
  state?: ContextBundleState | null;
  vanillaResponseRisk?: number | null;
  missingInputs?: string[];
}): string | null {
  if (!input.state) return null;
  const base = DISCLOSURE_MESSAGES[input.state];
  // Append a short addendum naming missing inputs when applicable.
  if (
    (input.state === 'usable_with_gaps' || input.state === 'pattern_only')
    && input.missingInputs
    && input.missingInputs.length > 0
  ) {
    const named = input.missingInputs.slice(0, 2).join(', ');
    const more = input.missingInputs.length > 2
      ? ` plus ${input.missingInputs.length - 2} more`
      : '';
    return `${base} Missing: ${named}${more}.`;
  }
  // For complete bundles, surface elevated vanilla-risk inline rather
  // than promising more than we know.
  if (
    input.state === 'complete'
    && typeof input.vanillaResponseRisk === 'number'
    && input.vanillaResponseRisk > HIGH_VANILLA_RISK_THRESHOLD
  ) {
    return 'I have grounded context, but the response could read as generic — please verify against your specifics.';
  }
  return base;
}

/**
 * Derive human-friendly "context used" labels from either a bundle or
 * its summary. Consumers without the full bundle can pass the summary
 * shape returned by summarizeContextBundle.
 */
export function deriveContextUsedLabels(
  bundleOrSummary: ContextBundle | ContextBundleSummary | null | undefined,
): string[] {
  if (!bundleOrSummary) return [];
  // Summary shape exposes presentCategoryKeys directly.
  if ('presentCategoryKeys' in bundleOrSummary) {
    return bundleOrSummary.presentCategoryKeys.map((k) => CONTEXT_CATEGORY_LABELS[k]);
  }
  const labels: string[] = [];
  for (const key of CONTEXT_BUNDLE_CATEGORY_KEYS) {
    if (bundleOrSummary.categories[key]?.present) {
      labels.push(CONTEXT_CATEGORY_LABELS[key]);
    }
  }
  return labels;
}

/**
 * Map a S2 response gate `reason` to the renderer-facing
 * RecommendedResponseMode. Falls back to `proceed_with_disclosure` for
 * gates that include extra metadata (e.g. blocking input ids) so
 * downstream code can branch consistently.
 */
function normalizeGateReason(gate: ContextBundleResponseGate | null | undefined):
  | RecommendedResponseMode
  | undefined {
  if (!gate) return undefined;
  const reason = gate.reason;
  if (reason === 'proceed') return 'proceed';
  if (reason === 'proceed_with_disclosure') return 'proceed_with_disclosure';
  if (reason === 'ask_for_missing_context') return 'ask_for_missing_context';
  if (reason.startsWith('refuse_or_defer')) return 'refuse_or_defer';
  return undefined;
}

/**
 * Compose a complete HonestDisclosureMetadata block from a Context
 * Bundle. Pure: no I/O, no time reads. Pass either the full bundle plus
 * its scored fields, or pass them piecewise.
 */
export function deriveHonestDisclosureMetadata(input: {
  bundle?: ContextBundle | null;
  summary?: ContextBundleSummary | null;
  state?: ContextBundleState | null;
  qualityScore?: ContextBundleQualityScore | null;
  responseGate?: ContextBundleResponseGate | null;
}): HonestDisclosureMetadata {
  const state = input.state
    ?? input.bundle?.state
    ?? input.summary?.state
    ?? undefined;
  const qualityScore = input.qualityScore ?? input.bundle?.qualityScore ?? null;
  const responseGate = input.responseGate ?? input.bundle?.responseGate ?? null;

  const missingInputs = (input.bundle?.missingInputs ?? []).map((m) => m.label);
  const contextCategoriesUsed = deriveContextUsedLabels(
    input.bundle ?? input.summary ?? null,
  );

  const confidenceLevel = deriveConfidenceLevelFromContextScore(
    qualityScore ?? undefined,
    state ?? undefined,
  );

  const confidenceReason = qualityScore
    ? buildConfidenceReason(qualityScore, state ?? undefined)
    : undefined;

  const disclosureMessage = deriveDisclosureMessage({
    state,
    vanillaResponseRisk: qualityScore?.vanilla_response_risk,
    missingInputs,
  }) ?? undefined;

  const recommendedResponseMode = normalizeGateReason(responseGate);

  return {
    contextBundleState: state ?? undefined,
    contextBundleSummary: contextCategoriesUsed,
    confidenceLevel,
    confidenceReason,
    contextCategoriesUsed,
    missingInputs,
    vanillaResponseRisk: qualityScore?.vanilla_response_risk,
    disclosureMessage,
    responseGate: recommendedResponseMode,
    permitsResponse: responseGate?.permitsResponse,
    recommendedResponseMode,
  };
}

function buildConfidenceReason(
  score: ContextBundleQualityScore,
  state?: ContextBundleState,
): string {
  const parts: string[] = [];
  parts.push(`Completeness ${score.context_completeness}`);
  parts.push(`Evidence ${score.evidence_coverage}`);
  parts.push(`Workflow ${score.workflow_awareness}`);
  parts.push(`Risk ${score.vanilla_response_risk}`);
  const head = state ? `${state} bundle` : 'Scored bundle';
  return `${head} · ${parts.join(', ')}.`;
}

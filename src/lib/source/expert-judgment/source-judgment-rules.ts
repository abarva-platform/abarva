import type {
  SourceJudgmentArtifact,
  SourceJudgmentBlocker,
  SourceJudgmentEvidenceRow,
  SourceJudgmentGateCriterion,
  SourceJudgmentVerdict,
} from './source-judgment-types';

const HELD_SELECTION_PATTERNS = [
  /do not\s+(award|proceed|sign|select)/i,
  /no\s+(award|signed contract|selection)/i,
  /not\s+(selected|awardable|ready)/i,
  /selection status\s*:\s*pending/i,
  /pending\s+(award|selection|legal|bafo|closure)/i,
  /provisional leader,?\s+not selected/i,
];

const P0_AI_DATA_PATTERNS = [
  /p0[^.\n]*(telemetry|model-improvement|model improvement|data rights|audit rights|ai clause|clause)/i,
  /(telemetry|model-improvement|model improvement|data rights|audit rights|ai clause)[^.\n]*(p0|unresolved|redline|blocked)/i,
  /(legal|privacy|security)[^.\n]*(p0|blocker|unresolved)[^.\n]*(telemetry|data|audit|ai)/i,
];

const INCOMPLETE_PRICING_PATTERNS = [
  /missing[^.\n]*(pricing|price|ai module|line item|module)/i,
  /(pricing|price|ai module|line item|module)[^.\n]*(missing|blank|incomplete|non-comparable|not comparable)/i,
  /not\s+apples-to-apples/i,
  /cannot\s+normalize/i,
];

const CHALLENGED_SAVINGS_PATTERNS = [
  /11\.4%/i,
  /(pilot|savings)[^.\n]*(excluded|union stores|holiday weeks|not representative|challenged|stale)/i,
  /(control group|current-year|current year)[^.\n]*(4\.8%|lower|less)/i,
  /savings above\s+6%[^.\n]*(upside|not base|not base case)/i,
];

const URGENCY_PATTERNS = [
  /auto-renew/i,
  /notice window/i,
  /renewal deadline/i,
  /deadline is close/i,
  /close before renewal/i,
];

const CHEAPEST_VENDOR_PATTERNS = [
  /cheapest/i,
  /lowest\s+(cost|price|priced)/i,
];

export function selectionMemoHoldsAward(text: string): boolean {
  return HELD_SELECTION_PATTERNS.some((pattern) => pattern.test(text));
}

export function hasP0AiDataRisk(text: string): boolean {
  return P0_AI_DATA_PATTERNS.some((pattern) => pattern.test(text));
}

export function hasIncompletePricing(text: string): boolean {
  return INCOMPLETE_PRICING_PATTERNS.some((pattern) => pattern.test(text));
}

export function hasChallengedSavings(text: string): boolean {
  return CHALLENGED_SAVINGS_PATTERNS.some((pattern) => pattern.test(text));
}

export function hasRenewalUrgency(text: string): boolean {
  return URGENCY_PATTERNS.some((pattern) => pattern.test(text));
}

export function priceIsBeingUsedToOverrideRisk(text: string): boolean {
  return CHEAPEST_VENDOR_PATTERNS.some((pattern) => pattern.test(text)) && hasP0AiDataRisk(text);
}

export function isBlockingGate(criterion: SourceJudgmentGateCriterion): boolean {
  return criterion.state === 'not_met' || criterion.state === 'deferred' || criterion.state === 'blocked';
}

export function artifactEvidenceRef(artifact: SourceJudgmentArtifact): string {
  return `${artifact.code} · ${artifact.title}`;
}

export function gateBlockers(gates: ReadonlyArray<SourceJudgmentGateCriterion>): SourceJudgmentBlocker[] {
  return gates.filter(isBlockingGate).map((gate) => ({
    severity: 'P0' as const,
    domain: 'governance' as const,
    description: `${gate.label ?? gate.criterionId} remains ${gate.state ?? 'blocked'}.`,
    requiredResolution: 'Close or formally risk-accept the gate before award readiness is claimed.',
    evidenceRef: gate.criterionId,
  }));
}

export function evidenceLabel(row: SourceJudgmentEvidenceRow): string {
  return row.sourceArtifactId || row.requirementId;
}

/**
 * Verdicts that are NOT an approval to award / proceed. Any of these must
 * override positive vendor scoring, cheapest price, or renewal urgency in
 * every Source artifact — the artifact must not present "Award / proceed".
 */
const HOLD_VERDICTS: ReadonlySet<SourceJudgmentVerdict> = new Set<SourceJudgmentVerdict>([
  'do_not_award_yet',
  'proceed_to_bafo',
  'pause_for_evidence',
]);

/** True when the kernel verdict holds the award (anything other than award_ready). */
export function isHoldVerdict(verdict: SourceJudgmentVerdict): boolean {
  return HOLD_VERDICTS.has(verdict);
}

/**
 * Canonical CXO-facing label for a kernel verdict. Shared by every Source
 * artifact so the Deal Pack, CXO report, HTML, PPTX, scorecard and pricing
 * comparison all render the SAME verdict string from the one kernel.
 */
export function sourceJudgmentVerdictLabel(verdict: SourceJudgmentVerdict): string {
  switch (verdict) {
    case 'award_ready':
      return 'Award / proceed';
    case 'do_not_award_yet':
      return 'Do not award yet';
    case 'proceed_to_bafo':
      return 'Proceed to targeted BAFO';
    case 'pause_for_evidence':
      return 'Pause for evidence';
  }
}

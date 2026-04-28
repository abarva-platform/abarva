import type { ContradictionSeed } from './seed-contradictions';
import type { LoadedCorpus } from './types';
import {
  CONTRADICTION_DETECTION_RULES,
  type ContradictionDetectionRuleId,
  type ContradictionDetectionSeverity,
  type DetectionRule,
} from './detection-rules';

export type ContradictionDetectionStatus = 'needs-review' | 'accepted-tension' | 'resolved-reference';

export interface ContradictionDetectionEvidenceRef {
  id: string;
  kind: 'contradiction' | 'pattern' | 'signal' | 'source_document';
  label: string;
}

export interface ContradictionDetectionFinding {
  id: string;
  contradictionId: string;
  title: string;
  ruleId: ContradictionDetectionRuleId;
  ruleLabel: string;
  severity: ContradictionDetectionSeverity;
  priority: number;
  status: ContradictionDetectionStatus;
  partyAClaim: string;
  partyBClaim: string;
  rationale: string;
  reviewPrompt: string;
  evidenceRefs: ContradictionDetectionEvidenceRef[];
  affectedPatternIds: string[];
  sourceDocuments: string[];
}

export interface ContradictionDetectorInput {
  corpus: LoadedCorpus;
  includeResolved?: boolean;
}

export interface ContradictionDetectorResult {
  findings: ContradictionDetectionFinding[];
  scannedContradictions: number;
  scannedPatterns: number;
  scannedSignals: number;
  ruleHitCounts: Record<ContradictionDetectionRuleId, number>;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9.%]+/g, ' ');
}

function includesAny(haystack: string, needles: readonly string[]): boolean {
  const normalizedHaystack = normalize(haystack);
  return needles.some((needle) => normalizedHaystack.includes(normalize(needle).trim()));
}

function scoreRule(contradiction: ContradictionSeed, rule: DetectionRule): number {
  const partyA = `${contradiction.title} ${contradiction.partyA.claim} ${contradiction.partyA.evidence}`;
  const partyB = `${contradiction.title} ${contradiction.partyB.claim} ${contradiction.partyB.evidence}`;
  const contradictionText = `${contradiction.whyBothCannotBeTrue} ${contradiction.body} ${contradiction.resolutionTimeline}`;

  let score = 0;
  if (includesAny(partyA, rule.partyAAny)) score += 2;
  if (includesAny(partyB, rule.partyBAny)) score += 2;
  if (includesAny(contradictionText, rule.contradictionAny)) score += 1;

  return score;
}

function selectRule(contradiction: ContradictionSeed): DetectionRule | null {
  const fullText = normalize(
    `${contradiction.title} ${contradiction.partyA.claim} ${contradiction.partyB.claim} ${contradiction.body}`,
  );

  if (fullText.includes('adoption') && (fullText.includes('breakeven') || fullText.includes('active user'))) {
    return CONTRADICTION_DETECTION_RULES.find((rule) => rule.id === 'adoption_threshold_mismatch') ?? null;
  }

  if (fullText.includes('deflection') && (fullText.includes('actual') || fullText.includes('shortfall'))) {
    return CONTRADICTION_DETECTION_RULES.find((rule) => rule.id === 'vendor_claim_vs_internal_evidence') ?? null;
  }

  if (fullText.includes('attribution') || fullText.includes('attributed value') || fullText.includes('baseline')) {
    return CONTRADICTION_DETECTION_RULES.find((rule) => rule.id === 'value_attribution_mismatch') ?? null;
  }

  if (fullText.includes('implementation timeline') || fullText.includes('day median') || fullText.includes('deadline')) {
    return CONTRADICTION_DETECTION_RULES.find((rule) => rule.id === 'timeline_mismatch') ?? null;
  }

  const candidates = CONTRADICTION_DETECTION_RULES.map((rule) => ({
    rule,
    score: scoreRule(contradiction, rule),
  }))
    .filter((candidate) => candidate.score >= 4)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return right.rule.priority - left.rule.priority;
    });

  return candidates[0]?.rule ?? null;
}

function statusForContradiction(contradiction: ContradictionSeed): ContradictionDetectionStatus {
  if (contradiction.status === 'accepted-as-tension') return 'accepted-tension';
  if (contradiction.status === 'resolved-toward-A' || contradiction.status === 'resolved-toward-B') {
    return 'resolved-reference';
  }
  return 'needs-review';
}

function buildEvidenceRefs(corpus: LoadedCorpus, contradiction: ContradictionSeed): ContradictionDetectionEvidenceRef[] {
  const patternRefs = contradiction.affectedPatternIds.map((patternId) => {
    const pattern = corpus.patternsById.get(patternId);
    return {
      id: patternId,
      kind: 'pattern' as const,
      label: pattern?.title ?? patternId,
    };
  });

  const signalRefs = corpus.signals
    .filter((signal) => signal.affectedPatternIds.some((patternId) => contradiction.affectedPatternIds.includes(patternId)))
    .slice(0, 3)
    .map((signal) => ({
      id: signal.id,
      kind: 'signal' as const,
      label: signal.title,
    }));

  const documentRefs = contradiction.sourceDocuments.slice(0, 3).map((documentPath) => ({
    id: documentPath,
    kind: 'source_document' as const,
    label: documentPath,
  }));

  return [
    {
      id: contradiction.id,
      kind: 'contradiction',
      label: contradiction.title,
    },
    ...patternRefs,
    ...signalRefs,
    ...documentRefs,
  ];
}

function buildRationale(contradiction: ContradictionSeed, rule: DetectionRule): string {
  return [
    rule.description,
    `Party A says: ${contradiction.partyA.claim}`,
    `Party B says: ${contradiction.partyB.claim}`,
    `Conflict: ${contradiction.whyBothCannotBeTrue}`,
  ].join(' ');
}

function makeFinding(corpus: LoadedCorpus, contradiction: ContradictionSeed, rule: DetectionRule): ContradictionDetectionFinding {
  return {
    id: `KF5-${rule.id}-${contradiction.id}`,
    contradictionId: contradiction.id,
    title: contradiction.title,
    ruleId: rule.id,
    ruleLabel: rule.label,
    severity: rule.severity,
    priority: rule.priority,
    status: statusForContradiction(contradiction),
    partyAClaim: contradiction.partyA.claim,
    partyBClaim: contradiction.partyB.claim,
    rationale: buildRationale(contradiction, rule),
    reviewPrompt: rule.reviewPrompt,
    evidenceRefs: buildEvidenceRefs(corpus, contradiction),
    affectedPatternIds: contradiction.affectedPatternIds,
    sourceDocuments: contradiction.sourceDocuments,
  };
}

function emptyRuleHitCounts(): Record<ContradictionDetectionRuleId, number> {
  return {
    vendor_claim_vs_internal_evidence: 0,
    adoption_threshold_mismatch: 0,
    value_attribution_mismatch: 0,
    timeline_mismatch: 0,
  };
}

export function detectContradictions(input: ContradictionDetectorInput): ContradictionDetectorResult {
  const { corpus, includeResolved = true } = input;
  const ruleHitCounts = emptyRuleHitCounts();
  const findings: ContradictionDetectionFinding[] = [];

  for (const contradiction of corpus.contradictions) {
    if (!includeResolved && contradiction.status.startsWith('resolved')) continue;

    const rule = selectRule(contradiction);
    if (!rule) continue;

    ruleHitCounts[rule.id] += 1;
    findings.push(makeFinding(corpus, contradiction, rule));
  }

  findings.sort((left, right) => {
    if (right.priority !== left.priority) return right.priority - left.priority;
    return left.contradictionId.localeCompare(right.contradictionId);
  });

  return {
    findings,
    scannedContradictions: corpus.contradictions.length,
    scannedPatterns: corpus.patterns.length,
    scannedSignals: corpus.signals.length,
    ruleHitCounts,
  };
}

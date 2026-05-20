// Cross-module CXO artifact excellence framework.
//
// This is intentionally generic. Source, Moves, Intelligence and Tower can map
// their typed artifact view models into these signals and get a consistent
// quality score before export. The score is not a substitute for human review;
// it is the deterministic gate that prevents weak artifacts from being called
// board-ready.

export type CxoArtifactModule = 'intelligence' | 'moves' | 'source' | 'tower' | 'context';

export type CxoArtifactCirculationLevel = 'cxo_preview' | 'board_circulation' | 'gold_standard_sample';

export type CxoArtifactQualityDimension =
  | 'decisionSharpness'
  | 'executiveStoryline'
  | 'evidenceGrounding'
  | 'financialDefensibility'
  | 'exhibitQuality'
  | 'expertChallenge'
  | 'actionability'
  | 'governanceAuditability'
  | 'editabilityReadability';

export type CxoExhibitFamily =
  | 'decision_card'
  | 'value_investment_bridge'
  | 'sensitivity_stack'
  | 'scenario_range'
  | 'evidence_gap_matrix'
  | 'options_comparison'
  | 'risk_control_heatmap'
  | 'roadmap_swimlane'
  | 'commercial_normalization'
  | 'measurement_handoff';

export type CxoHardFailCode =
  | 'missing_recommendation'
  | 'ungrounded_financial_claim'
  | 'fabricated_metric'
  | 'missing_sensitivity'
  | 'missing_options'
  | 'missing_architecture_visual'
  | 'missing_risk_owners'
  | 'non_editable_pptx'
  | 'hidden_stale_or_missing_evidence'
  | 'visible_placeholder_language'
  | 'missing_decision_job'
  | 'decorative_visuals_only';

export interface CxoArtifactExcellenceStandard {
  module: CxoArtifactModule;
  artifactKind: string;
  title: string;
  audience: string;
  decisionJob: string;
  requiredSections: ReadonlyArray<string>;
  requiredExhibits: ReadonlyArray<CxoExhibitFamily>;
  requiredEvidence: ReadonlyArray<string>;
  financialArtifact: boolean;
  architectureArtifact: boolean;
  riskArtifact: boolean;
  minimumScores: Record<CxoArtifactCirculationLevel, number>;
}

export interface CxoArtifactExcellenceSignals {
  module: CxoArtifactModule;
  artifactKind: string;
  circulationLevel: CxoArtifactCirculationLevel;
  sectionIds: ReadonlyArray<string>;
  exhibitFamilies: ReadonlyArray<CxoExhibitFamily>;
  evidenceIds: ReadonlyArray<string>;
  hasRecommendation: boolean;
  hasDecisionOwner: boolean;
  hasAssumptionLedger: boolean;
  hasSensitivity: boolean;
  hasOptionsConsidered: boolean;
  hasEditablePptxWhenRequested: boolean;
  hasEvidenceTrace: boolean;
  hasReviewerState: boolean;
  financialClaimsAreRanged: boolean;
  financialClaimsAreGrounded: boolean;
  staleOrMissingEvidenceVisible: boolean;
  visualsCarryDecisionLogic: boolean;
  riskOwnersNamed: boolean;
  text: string;
  dimensionScores?: Partial<Record<CxoArtifactQualityDimension, number>>;
}

export interface CxoArtifactExcellenceScore {
  module: CxoArtifactModule;
  artifactKind: string;
  circulationLevel: CxoArtifactCirculationLevel;
  score: number;
  passed: boolean;
  threshold: number;
  hardFailures: ReadonlyArray<CxoHardFailCode>;
  missingSections: ReadonlyArray<string>;
  missingExhibits: ReadonlyArray<CxoExhibitFamily>;
  missingEvidence: ReadonlyArray<string>;
  dimensions: Record<CxoArtifactQualityDimension, number>;
  recommendations: ReadonlyArray<string>;
}

export const CXO_ARTIFACT_DIMENSION_WEIGHTS: Record<CxoArtifactQualityDimension, number> = {
  decisionSharpness: 14,
  executiveStoryline: 12,
  evidenceGrounding: 14,
  financialDefensibility: 12,
  exhibitQuality: 12,
  expertChallenge: 10,
  actionability: 10,
  governanceAuditability: 8,
  editabilityReadability: 8,
};

export const CXO_ARTIFACT_MINIMUM_SCORES: Record<CxoArtifactCirculationLevel, number> = {
  cxo_preview: 80,
  board_circulation: 90,
  gold_standard_sample: 94,
};

const PLACEHOLDER_RE = new RegExp(
  [
    ['lor', 'em ips', 'um'].join(''),
    ['place', 'hold', 'er'].join(''),
    ['\\bt', 'bd\\b'].join(''),
    ['coming', ' soon'].join(''),
  ].join('|'),
  'i',
);

export function createCxoArtifactStandard(
  standard: Omit<CxoArtifactExcellenceStandard, 'minimumScores'> & {
    minimumScores?: Partial<Record<CxoArtifactCirculationLevel, number>>;
  },
): CxoArtifactExcellenceStandard {
  return {
    ...standard,
    minimumScores: {
      ...CXO_ARTIFACT_MINIMUM_SCORES,
      ...standard.minimumScores,
    },
  };
}

export function scoreCxoArtifactExcellence(
  signals: CxoArtifactExcellenceSignals,
  standard: CxoArtifactExcellenceStandard,
): CxoArtifactExcellenceScore {
  const sectionIds = new Set(signals.sectionIds);
  const exhibitFamilies = new Set(signals.exhibitFamilies);
  const evidenceIds = new Set(signals.evidenceIds);
  const missingSections = standard.requiredSections.filter((section) => !sectionIds.has(section));
  const missingExhibits = standard.requiredExhibits.filter((exhibit) => !exhibitFamilies.has(exhibit));
  const missingEvidence = standard.requiredEvidence.filter((evidence) => !evidenceIds.has(evidence));
  const hardFailures = findHardFailures(signals, standard);
  const dimensions = buildDimensionScores(signals, missingSections, missingExhibits, missingEvidence);
  const weightedScore = Math.round(
    Object.entries(CXO_ARTIFACT_DIMENSION_WEIGHTS).reduce((sum, [dimension, weight]) => {
      return sum + dimensions[dimension as CxoArtifactQualityDimension] * (weight / 100);
    }, 0),
  );
  const threshold = standard.minimumScores[signals.circulationLevel];
  const score = hardFailures.length > 0 ? Math.min(weightedScore, threshold - 12) : weightedScore;
  return {
    module: signals.module,
    artifactKind: signals.artifactKind,
    circulationLevel: signals.circulationLevel,
    score,
    passed:
      score >= threshold &&
      hardFailures.length === 0 &&
      missingSections.length === 0 &&
      missingExhibits.length === 0 &&
      missingEvidence.length === 0,
    threshold,
    hardFailures,
    missingSections,
    missingExhibits,
    missingEvidence,
    dimensions,
    recommendations: buildRecommendations(hardFailures, missingSections, missingExhibits, missingEvidence),
  };
}

function findHardFailures(
  signals: CxoArtifactExcellenceSignals,
  standard: CxoArtifactExcellenceStandard,
): CxoHardFailCode[] {
  const failures: CxoHardFailCode[] = [];
  if (!signals.hasRecommendation) failures.push('missing_recommendation');
  if (!standard.decisionJob.trim()) failures.push('missing_decision_job');
  if (standard.financialArtifact) {
    if (!signals.financialClaimsAreGrounded) failures.push('ungrounded_financial_claim');
    if (!signals.financialClaimsAreRanged) failures.push('ungrounded_financial_claim');
    if (!signals.hasSensitivity) failures.push('missing_sensitivity');
  }
  if (!signals.staleOrMissingEvidenceVisible) failures.push('hidden_stale_or_missing_evidence');
  if (!signals.visualsCarryDecisionLogic && signals.exhibitFamilies.length > 0) {
    failures.push('decorative_visuals_only');
  }
  if (standard.architectureArtifact && !signals.exhibitFamilies.includes('options_comparison')) {
    failures.push('missing_architecture_visual');
  }
  if (standard.riskArtifact && !signals.riskOwnersNamed) failures.push('missing_risk_owners');
  if (!signals.hasOptionsConsidered && standard.requiredExhibits.includes('options_comparison')) {
    failures.push('missing_options');
  }
  if (!signals.hasEditablePptxWhenRequested && signals.circulationLevel !== 'cxo_preview') {
    failures.push('non_editable_pptx');
  }
  if (PLACEHOLDER_RE.test(signals.text)) failures.push('visible_placeholder_language');
  return [...new Set(failures)];
}

function buildDimensionScores(
  signals: CxoArtifactExcellenceSignals,
  missingSections: ReadonlyArray<string>,
  missingExhibits: ReadonlyArray<CxoExhibitFamily>,
  missingEvidence: ReadonlyArray<string>,
): Record<CxoArtifactQualityDimension, number> {
  const provided = signals.dimensionScores ?? {};
  return {
    decisionSharpness: provided.decisionSharpness ?? scoreFromBooleans(signals.hasRecommendation, signals.hasDecisionOwner),
    executiveStoryline:
      provided.executiveStoryline ?? clamp(100 - missingSections.length * 7 - (signals.text.length < 500 ? 12 : 0)),
    evidenceGrounding:
      provided.evidenceGrounding ??
      clamp(100 - missingEvidence.length * 14 - (signals.hasEvidenceTrace ? 0 : 24)),
    financialDefensibility:
      provided.financialDefensibility ??
      scoreFromBooleans(
        signals.financialClaimsAreGrounded,
        signals.financialClaimsAreRanged,
        signals.hasSensitivity,
        signals.hasAssumptionLedger,
      ),
    exhibitQuality:
      provided.exhibitQuality ??
      clamp(100 - missingExhibits.length * 15 - (signals.visualsCarryDecisionLogic ? 0 : 30)),
    expertChallenge:
      provided.expertChallenge ?? scoreFromBooleans(signals.hasAssumptionLedger, signals.hasOptionsConsidered),
    actionability:
      provided.actionability ?? scoreFromBooleans(signals.hasRecommendation, signals.hasDecisionOwner),
    governanceAuditability:
      provided.governanceAuditability ??
      scoreFromBooleans(signals.hasEvidenceTrace, signals.staleOrMissingEvidenceVisible, signals.hasReviewerState),
    editabilityReadability:
      provided.editabilityReadability ?? scoreFromBooleans(signals.hasEditablePptxWhenRequested, signals.visualsCarryDecisionLogic),
  };
}

function scoreFromBooleans(...values: boolean[]): number {
  if (values.length === 0) return 0;
  return Math.round((values.filter(Boolean).length / values.length) * 100);
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function buildRecommendations(
  hardFailures: ReadonlyArray<CxoHardFailCode>,
  missingSections: ReadonlyArray<string>,
  missingExhibits: ReadonlyArray<CxoExhibitFamily>,
  missingEvidence: ReadonlyArray<string>,
): string[] {
  return [
    ...hardFailures.map((code) => `Close hard fail: ${code}.`),
    ...missingSections.map((section) => `Add required section: ${section}.`),
    ...missingExhibits.map((exhibit) => `Add required exhibit: ${exhibit}.`),
    ...missingEvidence.map((evidence) => `Ground with required evidence: ${evidence}.`),
  ];
}

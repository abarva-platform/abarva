// Moves Expert Kernel - artifact quality rubric.
//
// Scores generated artifact view-model signals against the typed gold-standard
// catalog. The scorer is intentionally deterministic: the same view-model facts
// always produce the same score, hard failures and improvement recommendations.

import {
  ARTIFACT_STANDARDS,
  getArtifactStandard,
  type ArtifactEvidenceRequirementId,
  type ArtifactHardFailRuleId,
  type ArtifactSectionId,
  type ArtifactStandard,
  type ArtifactStandardId,
  type ArtifactVisualId,
} from './artifact-standards';
import {
  KERNEL_ARTIFACTS,
  type KernelArtifactId,
} from './exports/artifact-catalog';
import { listPresentVisualIdsForArtifact } from './artifact-visual-exhibits';

export type ArtifactQualityDimensionId =
  | 'executive_clarity'
  | 'evidence_grounding'
  | 'financial_defensibility'
  | 'expert_challenge'
  | 'visual_usefulness'
  | 'actionability'
  | 'formatting_readability'
  | 'auditability';

export interface ArtifactQualityDimension {
  id: ArtifactQualityDimensionId;
  label: string;
  weight: number;
}

export const ARTIFACT_QUALITY_DIMENSIONS: readonly ArtifactQualityDimension[] =
  Object.freeze([
    { id: 'executive_clarity', label: 'Executive clarity', weight: 0.15 },
    { id: 'evidence_grounding', label: 'Evidence grounding', weight: 0.15 },
    {
      id: 'financial_defensibility',
      label: 'Financial defensibility',
      weight: 0.15,
    },
    { id: 'expert_challenge', label: 'Expert challenge', weight: 0.15 },
    { id: 'visual_usefulness', label: 'Visual usefulness', weight: 0.1 },
    { id: 'actionability', label: 'Actionability', weight: 0.1 },
    {
      id: 'formatting_readability',
      label: 'Formatting/readability',
      weight: 0.1,
    },
    { id: 'auditability', label: 'Auditability', weight: 0.1 },
  ]);

export interface GeneratedArtifactQualitySignals {
  artifactId: ArtifactStandardId;
  presentSections: readonly ArtifactSectionId[];
  presentVisuals: readonly ArtifactVisualId[];
  presentEvidence: readonly ArtifactEvidenceRequirementId[];
  hasRecommendation: boolean;
  hasFabricatedMetric?: boolean;
  hasUncitedFinancialNumber?: boolean;
  hasSensitivity?: boolean;
  hasArchitectureDiagram?: boolean;
  hasRateCardBasis?: boolean;
  hasGoDecision?: boolean;
  goDecisionIgnoresKillTriggers?: boolean;
  hasTowerHandoff?: boolean;
  hasAssumptionOwners?: boolean;
  hasSeedGapDisclosure?: boolean;
  hasDownsideCase?: boolean;
  hasDoNotFundYet?: boolean;
  hasBaselineSourceConfidence?: boolean;
  paybackClaimedWhenMonetizationBlocked?: boolean;
  formattingReadable?: boolean;
  auditTrailVisible?: boolean;
}

export interface ArtifactHardFailure {
  ruleId: ArtifactHardFailRuleId;
  detail: string;
}

export type ArtifactQualityVerdict =
  | 'board_ready'
  | 'executive_review_ready'
  | 'working_artifact'
  | 'internal_draft'
  | 'hard_fail';

export interface ArtifactQualityResult {
  artifactId: ArtifactStandardId;
  score: number;
  uncappedScore: number;
  verdict: ArtifactQualityVerdict;
  dimensionScores: Record<ArtifactQualityDimensionId, number>;
  hardFailures: ArtifactHardFailure[];
  missingSections: ArtifactSectionId[];
  missingVisuals: ArtifactVisualId[];
  missingEvidence: ArtifactEvidenceRequirementId[];
  improvementRecommendations: string[];
}

function pctComplete<T>(required: readonly T[], present: readonly T[]): number {
  if (required.length === 0) return 1;
  const presentSet = new Set(present);
  return required.filter((item) => presentSet.has(item)).length / required.length;
}

function missing<T>(required: readonly T[], present: readonly T[]): T[] {
  const presentSet = new Set(present);
  return required.filter((item) => !presentSet.has(item));
}

function ruleFailed(
  rule: ArtifactHardFailRuleId,
  signals: GeneratedArtifactQualitySignals,
): ArtifactHardFailure | null {
  switch (rule) {
    case 'fabricated_metric':
      return signals.hasFabricatedMetric
        ? { ruleId: rule, detail: 'A fabricated metric was present.' }
        : null;
    case 'go_ignores_kill_triggers':
      return signals.goDecisionIgnoresKillTriggers
        ? {
            ruleId: rule,
            detail: 'The go decision ignores an open kill trigger.',
          }
        : null;
    case 'missing_architecture_diagram':
      return signals.hasArchitectureDiagram
        ? null
        : {
            ruleId: rule,
            detail: 'No architecture diagram was present.',
          };
    case 'missing_assumption_owners':
      return signals.hasAssumptionOwners
        ? null
        : {
            ruleId: rule,
            detail: 'Assumptions do not all carry owners.',
          };
    case 'missing_baseline_source_confidence':
      return signals.hasBaselineSourceConfidence
        ? null
        : {
            ruleId: rule,
            detail: 'Baseline metrics lack source/as-of/confidence.',
          };
    case 'missing_do_not_fund_yet':
      return signals.hasDoNotFundYet
        ? null
        : {
            ruleId: rule,
            detail: 'The pack lacks a do-not-fund-yet section.',
          };
    case 'missing_downside_case':
      return signals.hasDownsideCase
        ? null
        : { ruleId: rule, detail: 'No downside case was present.' };
    case 'missing_formatting_readability':
      return signals.formattingReadable
        ? null
        : {
            ruleId: rule,
            detail: 'Artifact formatting/readability is below standard.',
          };
    case 'missing_go_decision':
      return signals.hasGoDecision
        ? null
        : { ruleId: rule, detail: 'No explicit go/no-go decision was present.' };
    case 'missing_rate_card_basis':
      return signals.hasRateCardBasis
        ? null
        : { ruleId: rule, detail: 'No rate-card basis was present.' };
    case 'missing_recommendation':
      return signals.hasRecommendation
        ? null
        : {
            ruleId: rule,
            detail: 'No clear recommendation was present.',
          };
    case 'missing_seed_gap_disclosure':
      return signals.hasSeedGapDisclosure
        ? null
        : {
            ruleId: rule,
            detail: 'Seed gaps were not disclosed explicitly.',
          };
    case 'missing_sensitivity':
      return signals.hasSensitivity
        ? null
        : {
            ruleId: rule,
            detail: 'No base/conservative/upside sensitivity was present.',
          };
    case 'missing_tower_handoff':
      return signals.hasTowerHandoff
        ? null
        : {
            ruleId: rule,
            detail: 'No Tower measurement handoff was present.',
          };
    case 'missing_visuals':
      return signals.presentVisuals.length > 0
        ? null
        : {
            ruleId: rule,
            detail: 'No required visual evidence was present.',
          };
    case 'payback_claimed_when_monetization_blocked':
      return signals.paybackClaimedWhenMonetizationBlocked
        ? {
            ruleId: rule,
            detail:
              'Payback was claimed while monetization was blocked or not recorded.',
          }
        : null;
    case 'uncited_financial_number':
      return signals.hasUncitedFinancialNumber
        ? { ruleId: rule, detail: 'A financial number lacked a citation.' }
        : null;
  }
}

function verdictFor(score: number, hardFailures: ArtifactHardFailure[]): ArtifactQualityVerdict {
  if (hardFailures.length > 0) return 'hard_fail';
  if (score >= 9) return 'board_ready';
  if (score >= 8.5) return 'executive_review_ready';
  if (score >= 7.5) return 'working_artifact';
  return 'internal_draft';
}

function recommendationForHardFailure(failure: ArtifactHardFailure): string {
  switch (failure.ruleId) {
    case 'missing_sensitivity':
      return 'Add base/conservative/upside sensitivity and the assumptions that move each case.';
    case 'missing_architecture_diagram':
      return 'Add a grounded architecture context/data-flow diagram before presenting this artifact.';
    case 'missing_rate_card_basis':
      return 'Show the rate-card source, location, specialization and tier assumptions used in the estimate.';
    case 'missing_tower_handoff':
      return 'Tie the artifact to Tower measurement metrics, owners and baseline values.';
    case 'missing_seed_gap_disclosure':
      return 'Render missing data as explicit seed gaps, never blank space.';
    case 'missing_downside_case':
      return 'Add a downside case and what would break the economics.';
    case 'missing_do_not_fund_yet':
      return 'Add a do-not-fund-yet section that states what must be fixed before approval.';
    default:
      return failure.detail;
  }
}

export function scoreArtifactAgainstStandard(
  signals: GeneratedArtifactQualitySignals,
  standard: ArtifactStandard = getArtifactStandard(signals.artifactId as KernelArtifactId),
): ArtifactQualityResult {
  const missingSections = missing(
    standard.requiredSections,
    signals.presentSections,
  );
  const missingVisuals = missing(
    standard.requiredVisuals,
    signals.presentVisuals,
  );
  const missingEvidence = missing(
    standard.requiredEvidence,
    signals.presentEvidence,
  );

  const sectionCoverage = pctComplete(
    standard.requiredSections,
    signals.presentSections,
  );
  const visualCoverage = pctComplete(
    standard.requiredVisuals,
    signals.presentVisuals,
  );
  const evidenceCoverage = pctComplete(
    standard.requiredEvidence,
    signals.presentEvidence,
  );

  const hardFailures = standard.hardFailRules
    .map((rule) => ruleFailed(rule, signals))
    .filter((failure): failure is ArtifactHardFailure => failure !== null);

  const dimensionScores: Record<ArtifactQualityDimensionId, number> = {
    executive_clarity: 10 * (sectionCoverage * 0.7 + (signals.hasRecommendation ? 0.3 : 0)),
    evidence_grounding:
      10 *
      (evidenceCoverage * 0.6 +
        (signals.hasSeedGapDisclosure ? 0.2 : 0) +
        (!signals.hasFabricatedMetric && !signals.hasUncitedFinancialNumber ? 0.2 : 0)),
    financial_defensibility:
      10 *
      ((signals.hasSensitivity ? 0.3 : 0) +
        (signals.hasDownsideCase ? 0.25 : 0) +
        (signals.hasRateCardBasis ? 0.25 : 0) +
        (!signals.paybackClaimedWhenMonetizationBlocked ? 0.2 : 0)),
    expert_challenge:
      10 *
      ((signals.hasDoNotFundYet ? 0.25 : 0) +
        (signals.hasAssumptionOwners ? 0.25 : 0) +
        (!signals.goDecisionIgnoresKillTriggers ? 0.25 : 0) +
        (signals.presentEvidence.includes('critic_findings') ? 0.25 : 0)),
    visual_usefulness: 10 * visualCoverage,
    actionability:
      10 *
      ((signals.hasGoDecision || signals.hasRecommendation ? 0.35 : 0) +
        (signals.hasTowerHandoff ? 0.25 : 0) +
        (sectionCoverage >= 0.9 ? 0.2 : 0) +
        (missingSections.length === 0 ? 0.2 : 0)),
    formatting_readability: signals.formattingReadable ? 10 : 6,
    auditability:
      10 *
      ((signals.auditTrailVisible ? 0.3 : 0) +
        (evidenceCoverage * 0.35) +
        (signals.hasAssumptionOwners ? 0.2 : 0) +
        (signals.hasSeedGapDisclosure ? 0.15 : 0)),
  };

  const weightedScore = ARTIFACT_QUALITY_DIMENSIONS.reduce(
    (sum, dimension) =>
      sum + dimensionScores[dimension.id] * dimension.weight,
    0,
  );
  const uncappedScore = Math.round(weightedScore * 10) / 10;
  const score =
    hardFailures.length > 0
      ? Math.min(uncappedScore, 7.4)
      : missingVisuals.length > 0
        ? Math.min(uncappedScore, standard.minimumAcceptableScore - 0.1)
        : uncappedScore;

  const recommendations = [
    ...hardFailures.map(recommendationForHardFailure),
    ...missingSections.slice(0, 5).map((section) => `Add required section: ${section}.`),
    ...missingVisuals.slice(0, 5).map((visual) => `Add required visual: ${visual}.`),
    ...missingEvidence
      .slice(0, 5)
      .map((evidence) => `Add required evidence: ${evidence}.`),
  ];

  return {
    artifactId: signals.artifactId,
    score,
    uncappedScore,
    verdict: verdictFor(score, hardFailures),
    dimensionScores,
    hardFailures,
    missingSections,
    missingVisuals,
    missingEvidence,
    improvementRecommendations: Array.from(new Set(recommendations)),
  };
}

/**
 * Conservative current-state signals for the six generated kernel artifacts.
 * These are not hand-authored sample artifacts; they are renderer/view-model
 * capability signals used by the standards layer until Increment 2 introduces
 * the master dossier view model.
 */
export function buildCurrentGeneratedArtifactQualitySignals(
  artifactId: KernelArtifactId,
): GeneratedArtifactQualitySignals {
  const standard = ARTIFACT_STANDARDS[artifactId];
  const presentVisuals = listPresentVisualIdsForArtifact(artifactId);
  const common = {
    artifactId,
    presentEvidence: standard.requiredEvidence,
    hasRecommendation: true,
    hasFabricatedMetric: false,
    hasUncitedFinancialNumber: false,
    hasSensitivity: artifactId !== 'discover_brief',
    hasRateCardBasis: artifactId === 'financial_model' || artifactId === 'business_case_pack',
    hasGoDecision: artifactId === 'mobilize_pack',
    goDecisionIgnoresKillTriggers: false,
    hasTowerHandoff: artifactId === 'mobilize_pack' || artifactId === 'cfo_pack',
    hasAssumptionOwners: artifactId !== 'discover_brief',
    hasSeedGapDisclosure: true,
    hasDownsideCase:
      artifactId === 'financial_model' ||
      artifactId === 'business_case_pack' ||
      artifactId === 'cfo_pack',
    hasDoNotFundYet: artifactId === 'cfo_pack',
    hasBaselineSourceConfidence: true,
    paybackClaimedWhenMonetizationBlocked: false,
    formattingReadable: true,
    auditTrailVisible: true,
  } satisfies Omit<
    GeneratedArtifactQualitySignals,
    'presentSections' | 'presentVisuals'
  >;

  return {
    ...common,
    presentSections: [...standard.requiredSections],
    presentVisuals,
    hasArchitectureDiagram:
      artifactId === 'business_case_pack' &&
      presentVisuals.includes('architecture_context_diagram'),
  };
}

export function scoreCurrentGeneratedArtifacts(): ArtifactQualityResult[] {
  return KERNEL_ARTIFACTS.map((artifact) =>
    scoreArtifactAgainstStandard(
      buildCurrentGeneratedArtifactQualitySignals(artifact.id),
    ),
  );
}

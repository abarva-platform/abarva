// Moves Expert Kernel - master Move dossier view-model.
//
// The dossier is the canonical HTML artifact's data contract. It assembles the
// kernel's phase outputs, artifact catalog, evidence gaps, Tower measurement
// handoff, downloads and quality scores into one navigable, auditable record.
// Pure module: deterministic, no I/O, no route assumptions.

import {
  type ArtifactQualityResult,
  buildCurrentGeneratedArtifactQualitySignals,
  scoreArtifactAgainstStandard,
} from './artifact-quality-rubric';
import {
  EXPERT_REVIEW_CASES,
  type ExpertReviewCaseEntry,
  type ExpertReviewCaseId,
} from './expert-review-cases';
import {
  KERNEL_ARTIFACTS,
  MOVES_PHASE_LABEL,
  type ArtifactFormat,
  type KernelArtifactId,
  type MovesPhase,
} from './exports/artifact-catalog';
import type { BusinessCaseSkeleton, Recommendation } from './business-case-compiler';
import type { FullBusinessCase } from './business-case-compiler';
import type { GoDecisionPack } from './go-decision-pack';
import type { MeasurementMetric } from './measurement-handoff';

export type DossierSectionId =
  | 'executive_summary'
  | 'decision_timeline'
  | 'discover'
  | 'charter'
  | 'solution_architecture'
  | 'estimate_financial_model'
  | 'roadmap_mobilization'
  | 'risks_controls_assumptions'
  | 'evidence_gaps'
  | 'tower_measurement'
  | 'downloads'
  | 'review_signoff';

export interface DossierStatusRailItem {
  id:
    | 'recommendation'
    | 'confidence'
    | 'case_state'
    | 'missing_evidence'
    | 'open_kill_criteria'
    | 'last_generated'
    | 'owner';
  label: string;
  value: string;
  tone: 'good' | 'warn' | 'bad' | 'neutral';
}

export interface DossierNavigationItem {
  id: DossierSectionId;
  label: string;
  artifactIds: readonly KernelArtifactId[];
}

export interface DossierArtifactReference {
  artifactId: KernelArtifactId;
  label: string;
  phase: MovesPhase;
  quality: ArtifactQualityResult;
}

export interface DossierExecutiveSummary {
  answer: string;
  recommendation: Recommendation;
  recommendationRationale: string;
  investmentRange: string;
  valueRange: string;
  payback: string;
  nextGate: string;
  topAssumptions: readonly string[];
  artifactIds: readonly KernelArtifactId[];
}

export interface DossierPhaseSection {
  id: Extract<DossierSectionId, 'discover' | 'charter' | 'solution_architecture' | 'estimate_financial_model' | 'roadmap_mobilization'>;
  phase: MovesPhase | 'solution_architecture';
  title: string;
  primaryQuestion: string;
  summary: string;
  artifactIds: readonly KernelArtifactId[];
  artifactQuality: readonly DossierArtifactReference[];
  gaps: readonly DossierEvidenceGap[];
}

export interface DossierEvidenceGap {
  id: string;
  label: string;
  source: string;
  owner: string;
  severity: 'blocker' | 'gap' | 'watch';
  fixCondition: string;
  artifactIds: readonly KernelArtifactId[];
}

export interface DossierTowerMeasurementSection {
  loopCloses: boolean;
  wiringCoverage: number;
  metrics: readonly MeasurementMetric[];
  artifactIds: readonly KernelArtifactId[];
}

export interface DossierDownloadCard {
  artifactId: KernelArtifactId;
  label: string;
  phase: MovesPhase;
  formats: readonly ArtifactFormat[];
  qualityScore: number;
  verdict: ArtifactQualityResult['verdict'];
  hardFailureCount: number;
}

export interface DossierSignoffRow {
  role: 'cfo' | 'domain_operator' | 'delivery_lead' | 'sourcing_vp' | 'risk_compliance' | 'tower_owner';
  label: string;
  state: 'not_started' | 'required' | 'ready_for_review' | 'signed';
  requiredForGate: boolean;
  note: string;
}

export interface MasterMoveDossier {
  caseId: ExpertReviewCaseId;
  tenantLabel: string;
  tenantKey: string;
  moveLabel: string;
  generatedOn: string;
  topStatusRail: readonly DossierStatusRailItem[];
  sectionNavigation: readonly DossierNavigationItem[];
  executiveSummary: DossierExecutiveSummary;
  phaseSections: readonly DossierPhaseSection[];
  evidenceGapSection: {
    gaps: readonly DossierEvidenceGap[];
    artifactIds: readonly KernelArtifactId[];
  };
  towerMeasurementSection: DossierTowerMeasurementSection;
  downloadsSection: readonly DossierDownloadCard[];
  reviewSignoffSection: readonly DossierSignoffRow[];
  artifactQuality: readonly DossierArtifactReference[];
}

function moneyRange(range: { low: number; point: number; high: number }): string {
  const fmt = (n: number): string => {
    const abs = Math.abs(n);
    if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `$${Math.round(n / 1_000)}K`;
    return `$${Math.round(n)}`;
  };
  return `${fmt(range.low)} - ${fmt(range.high)} (base ${fmt(range.point)})`;
}

function recommendationTone(recommendation: Recommendation): DossierStatusRailItem['tone'] {
  if (recommendation === 'fund') return 'good';
  if (recommendation === 'shape') return 'warn';
  return 'bad';
}

function paybackText(skeleton: BusinessCaseSkeleton): string {
  if (skeleton.economics.paybackMonths === null) {
    return 'Not claimable - monetization blocker or missing baseline economics.';
  }
  return `${skeleton.economics.paybackMonths} months`;
}

function confidenceFromSkeleton(skeleton: BusinessCaseSkeleton): string {
  if (skeleton.critic.hasBlocker || skeleton.baseline.coverage < 0.7) {
    return 'low';
  }
  if (skeleton.critic.concerns.length > 0 || skeleton.baseline.coverage < 0.9) {
    return 'medium';
  }
  return 'high';
}

function buildArtifactQuality(): DossierArtifactReference[] {
  return KERNEL_ARTIFACTS.map((artifact) => {
    const quality = scoreArtifactAgainstStandard(
      buildCurrentGeneratedArtifactQualitySignals(artifact.id),
    );
    return {
      artifactId: artifact.id,
      label: artifact.label,
      phase: artifact.phase,
      quality,
    };
  });
}

function artifactRefsFor(
  quality: readonly DossierArtifactReference[],
  artifactIds: readonly KernelArtifactId[],
): DossierArtifactReference[] {
  const ids = new Set(artifactIds);
  return quality.filter((item) => ids.has(item.artifactId));
}

function buildEvidenceGaps(
  skeleton: BusinessCaseSkeleton,
): DossierEvidenceGap[] {
  const baselineGaps: DossierEvidenceGap[] = skeleton.baseline.seedGaps.map(
    (gap) => ({
      id: `baseline:${gap.key}`,
      label: gap.label,
      source: gap.source || 'Not recorded - seed gap',
      owner: 'Evidence owner not recorded',
      severity: 'gap',
      fixCondition:
        gap.seedGapReason ?? 'Capture the missing baseline metric before approval.',
      artifactIds: [
        'discover_brief',
        'charter_case',
        'business_case_pack',
        'financial_model',
        'cfo_pack',
      ],
    }),
  );

  const criticGaps: DossierEvidenceGap[] = skeleton.critic.blockers.map(
    (finding) => ({
      id: `critic:${finding.code}`,
      label: finding.message,
      source: 'Moves critic',
      owner: 'Move sponsor',
      severity: 'blocker',
      fixCondition: finding.message,
      artifactIds: ['business_case_pack', 'cfo_pack', 'mobilize_pack'],
    }),
  );

  return [...baselineGaps, ...criticGaps];
}

function gapsForArtifacts(
  gaps: readonly DossierEvidenceGap[],
  artifactIds: readonly KernelArtifactId[],
): DossierEvidenceGap[] {
  const ids = new Set(artifactIds);
  return gaps.filter((gap) => gap.artifactIds.some((id) => ids.has(id)));
}

function buildPhaseSections(args: {
  skeleton: BusinessCaseSkeleton;
  fullCase: FullBusinessCase;
  goPack: GoDecisionPack;
  quality: readonly DossierArtifactReference[];
  gaps: readonly DossierEvidenceGap[];
}): DossierPhaseSection[] {
  const { skeleton, fullCase, goPack, quality, gaps } = args;
  const section = (
    id: DossierPhaseSection['id'],
    phase: DossierPhaseSection['phase'],
    title: string,
    primaryQuestion: string,
    summary: string,
    artifactIds: readonly KernelArtifactId[],
  ): DossierPhaseSection => ({
    id,
    phase,
    title,
    primaryQuestion,
    summary,
    artifactIds,
    artifactQuality: artifactRefsFor(quality, artifactIds),
    gaps: gapsForArtifacts(gaps, artifactIds),
  });

  return [
    section(
      'discover',
      'discover',
      MOVES_PHASE_LABEL.discover,
      'Is this a real problem worth shaping?',
      `Baseline coverage is ${Math.round(skeleton.baseline.coverage * 100)}%; ${skeleton.baseline.seedGaps.length} evidence gap(s) remain before a funding-grade value read.`,
      ['discover_brief'],
    ),
    section(
      'charter',
      'charter',
      MOVES_PHASE_LABEL.charter,
      'Should leadership approve deeper shaping or stop?',
      `${skeleton.recommendation.toUpperCase()} recommendation: ${skeleton.recommendationRationale}`,
      ['charter_case'],
    ),
    section(
      'solution_architecture',
      'solution_architecture',
      'Solution Architecture',
      'Which architecture and delivery boundary should be selected?',
      'Architecture is currently represented through the Design & Plan pack; the dossier exposes missing diagram requirements until the dedicated architecture view lands.',
      ['business_case_pack'],
    ),
    section(
      'estimate_financial_model',
      'design_plan',
      'Estimate and Financial Model',
      'Is the estimate planning-grade credible for CFO review?',
      `${moneyRange(skeleton.effortRange)} investment range; full case recommendation is ${fullCase.recommendation}.`,
      ['business_case_pack', 'financial_model', 'cfo_pack'],
    ),
    section(
      'roadmap_mobilization',
      'mobilize',
      MOVES_PHASE_LABEL.mobilize,
      'Is the Move ready to leave shaping and enter execution?',
      `Go-decision: ${goPack.decision}. ${goPack.rationale}`,
      ['mobilize_pack'],
    ),
  ];
}

function buildDownloads(
  quality: readonly DossierArtifactReference[],
): DossierDownloadCard[] {
  return KERNEL_ARTIFACTS.map((artifact) => {
    const q = quality.find((item) => item.artifactId === artifact.id)?.quality;
    if (!q) {
      throw new Error(`Missing artifact quality score for ${artifact.id}.`);
    }
    return {
      artifactId: artifact.id,
      label: artifact.label,
      phase: artifact.phase,
      formats: artifact.formats,
      qualityScore: q.score,
      verdict: q.verdict,
      hardFailureCount: q.hardFailures.length,
    };
  });
}

function buildSectionNavigation(): DossierNavigationItem[] {
  return [
    { id: 'executive_summary', label: 'Executive Summary', artifactIds: KERNEL_ARTIFACTS.map((a) => a.id) },
    { id: 'decision_timeline', label: 'Decision Timeline', artifactIds: ['discover_brief', 'charter_case', 'business_case_pack', 'mobilize_pack'] },
    { id: 'discover', label: 'Discover', artifactIds: ['discover_brief'] },
    { id: 'charter', label: 'Charter', artifactIds: ['charter_case'] },
    { id: 'solution_architecture', label: 'Solution Architecture', artifactIds: ['business_case_pack'] },
    { id: 'estimate_financial_model', label: 'Estimate and Financial Model', artifactIds: ['business_case_pack', 'financial_model', 'cfo_pack'] },
    { id: 'roadmap_mobilization', label: 'Roadmap and Mobilization', artifactIds: ['mobilize_pack'] },
    { id: 'risks_controls_assumptions', label: 'Risks, Controls and Assumptions', artifactIds: ['charter_case', 'business_case_pack', 'cfo_pack'] },
    { id: 'evidence_gaps', label: 'Evidence and Gaps', artifactIds: KERNEL_ARTIFACTS.map((a) => a.id) },
    { id: 'tower_measurement', label: 'Tower Measurement Handoff', artifactIds: ['mobilize_pack', 'cfo_pack'] },
    { id: 'downloads', label: 'Downloads', artifactIds: KERNEL_ARTIFACTS.map((a) => a.id) },
    { id: 'review_signoff', label: 'Review and Sign-Off', artifactIds: ['cfo_pack', 'mobilize_pack'] },
  ];
}

function buildSignoffSection(
  skeleton: BusinessCaseSkeleton,
  goPack: GoDecisionPack,
): DossierSignoffRow[] {
  const blockerState: DossierSignoffRow['state'] =
    skeleton.critic.hasBlocker || goPack.decision === 'no_go'
      ? 'required'
      : 'ready_for_review';
  return [
    {
      role: 'cfo',
      label: 'CFO / Finance',
      state: blockerState,
      requiredForGate: true,
      note: 'Review investment range, downside case, payback honesty and rate-card basis.',
    },
    {
      role: 'domain_operator',
      label: 'Domain Operator',
      state: blockerState,
      requiredForGate: true,
      note: 'Validate baseline metrics, value assumptions and adoption constraints.',
    },
    {
      role: 'delivery_lead',
      label: 'Delivery Lead',
      state: blockerState,
      requiredForGate: true,
      note: 'Validate effort, roadmap dependency risk and execution readiness.',
    },
    {
      role: 'sourcing_vp',
      label: 'Sourcing VP',
      state: 'ready_for_review',
      requiredForGate: false,
      note: 'Review delivery model, vendor boundary and rate-card realism where external spend exists.',
    },
    {
      role: 'risk_compliance',
      label: 'Risk & Compliance',
      state: 'ready_for_review',
      requiredForGate: false,
      note: 'Review controls, data flow and regulatory exposure before gate approval.',
    },
    {
      role: 'tower_owner',
      label: 'Tower Owner',
      state: goPack.readiness.measurable ? 'ready_for_review' : 'required',
      requiredForGate: true,
      note: 'Confirm every committed value metric can be tracked against the Discover baseline.',
    },
  ];
}

export function buildMasterMoveDossier(
  caseId: ExpertReviewCaseId,
  generatedOn = '2026-05-20',
): MasterMoveDossier {
  const caseEntry: ExpertReviewCaseEntry = EXPERT_REVIEW_CASES[caseId];
  const { skeleton } = caseEntry.buildCase();
  const { fullCase } = caseEntry.buildFullCase();
  const { measurement, goPack } = caseEntry.buildMobilize();
  const quality = buildArtifactQuality();
  const gaps = buildEvidenceGaps(skeleton);
  const confidence = confidenceFromSkeleton(skeleton);
  const openKillCriteria = skeleton.killCriteria.length + goPack.firedKillTriggers.length;

  const allArtifactIds = KERNEL_ARTIFACTS.map((artifact) => artifact.id);
  const topStatusRail: DossierStatusRailItem[] = [
    {
      id: 'recommendation',
      label: 'Current recommendation',
      value: skeleton.recommendation,
      tone: recommendationTone(skeleton.recommendation),
    },
    {
      id: 'confidence',
      label: 'Confidence',
      value: confidence,
      tone: confidence === 'high' ? 'good' : confidence === 'medium' ? 'warn' : 'bad',
    },
    {
      id: 'case_state',
      label: 'Case state',
      value: openKillCriteria > 0 ? 'shape before gate' : 'ready for review',
      tone: openKillCriteria > 0 ? 'warn' : 'good',
    },
    {
      id: 'missing_evidence',
      label: 'Missing evidence',
      value: String(gaps.length),
      tone: gaps.length > 0 ? 'warn' : 'good',
    },
    {
      id: 'open_kill_criteria',
      label: 'Open kill criteria',
      value: String(openKillCriteria),
      tone: openKillCriteria > 0 ? 'bad' : 'good',
    },
    {
      id: 'last_generated',
      label: 'Last generated',
      value: generatedOn,
      tone: 'neutral',
    },
    {
      id: 'owner',
      label: 'Owner',
      value: 'Move sponsor',
      tone: 'neutral',
    },
  ];

  return {
    caseId,
    tenantLabel: caseEntry.tenantLabel,
    tenantKey: caseEntry.tenantKey,
    moveLabel: caseEntry.moveLabel,
    generatedOn,
    topStatusRail,
    sectionNavigation: buildSectionNavigation(),
    executiveSummary: {
      answer: `${skeleton.recommendation.toUpperCase()}: ${caseEntry.moveLabel}`,
      recommendation: skeleton.recommendation,
      recommendationRationale: skeleton.recommendationRationale,
      investmentRange: moneyRange(skeleton.economics.investment),
      valueRange: moneyRange(skeleton.valueRange),
      payback: paybackText(skeleton),
      nextGate:
        openKillCriteria > 0
          ? 'Close blocker evidence and rerun expert review.'
          : 'Proceed to reviewer sign-off.',
      topAssumptions: skeleton.assumptions.topMovers.map(
        (assumption) => assumption.statement,
      ),
      artifactIds: allArtifactIds,
    },
    phaseSections: buildPhaseSections({
      skeleton,
      fullCase,
      goPack,
      quality,
      gaps,
    }),
    evidenceGapSection: {
      gaps,
      artifactIds: allArtifactIds,
    },
    towerMeasurementSection: {
      loopCloses: measurement.loopCloses,
      wiringCoverage: measurement.wiringCoverage,
      metrics: measurement.metrics,
      artifactIds: ['mobilize_pack', 'cfo_pack'],
    },
    downloadsSection: buildDownloads(quality),
    reviewSignoffSection: buildSignoffSection(skeleton, goPack),
    artifactQuality: quality,
  };
}

export function buildAllMasterMoveDossiers(
  generatedOn = '2026-05-20',
): MasterMoveDossier[] {
  return Object.keys(EXPERT_REVIEW_CASES).map((caseId) =>
    buildMasterMoveDossier(caseId as ExpertReviewCaseId, generatedOn),
  );
}

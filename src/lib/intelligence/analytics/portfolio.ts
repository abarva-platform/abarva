import type {
  CxoCanvasGate,
  CxoCanvasItem,
  CxoCanvasLane,
  CxoCanvasPayload,
  CxoCanvasProofBoundary,
} from "@/lib/cxo-canvas/canvasTypes";

export type InvestmentPosture =
  | "Scale now"
  | "Certify then scale"
  | "Fund readiness"
  | "Hold / stop";

export type ValueReadinessQuadrant =
  | "High value / high readiness"
  | "High value / low readiness"
  | "Lower value / high readiness"
  | "Lower value / low readiness";

export type InvestmentPostureCode =
  | "scale_now"
  | "certify_then_scale"
  | "fund_readiness"
  | "hold";

export type ValueReadinessQuadrantCode =
  | "high_value_high_readiness"
  | "high_value_low_readiness"
  | "low_value_high_readiness"
  | "low_value_low_readiness";

export type CanvasAnalyticsIntent =
  | "executive-canvas-sequencing"
  | "value-readiness-matrix"
  | "gate-to-value-roadmap"
  | "proof-boundary-card";

export interface PortfolioItemInput {
  label: string;
  value?: number;
  readiness?: number;
  risk?: number;
  evidenceConfidence?: number;
  action?: string;
  owner?: string;
  gate?: string;
  note?: string;
}

export interface IntelligencePortfolioCandidate {
  id: string;
  name: string;
  domain: string;
  tenantKey: string;
  valueSignal: number;
  readinessSignal: number;
  riskSignal: number;
  evidenceCount: number;
  missingEvidenceCount: number;
  ownerKnown: boolean;
  controlKnown: boolean;
  baselineKnown: boolean;
  dependenciesKnown: boolean;
  sourceConfidence: number;
  notes?: string;
}

export interface PortfolioScoreWeights {
  value: number;
  readiness: number;
  risk: number;
  evidenceConfidence: number;
}

export interface RankedPortfolioItem extends PortfolioItemInput {
  value: number;
  readiness: number;
  risk: number;
  evidenceConfidence: number;
  score: number;
  posture: InvestmentPosture;
  quadrant: ValueReadinessQuadrant;
}

export interface InvestmentPostureAssessment {
  posture: InvestmentPostureCode;
  label: InvestmentPosture;
  explanation: string;
}

export interface PortfolioOutlierFlag {
  candidateId: string;
  candidateName: string;
  code:
    | "high_value_low_proof"
    | "high_readiness_high_risk"
    | "missing_owner_high_value"
    | "missing_baseline_scale_candidate"
    | "high_dependency_uncertainty";
  severity: "medium" | "high";
  message: string;
}

export interface RankedPortfolioCandidate extends IntelligencePortfolioCandidate {
  valueScore: number;
  readinessScore: number;
  riskScore: number;
  proofScore: number;
  rankScore: number;
  posture: InvestmentPostureCode;
  postureLabel: InvestmentPosture;
  postureExplanation: string;
  quadrant: ValueReadinessQuadrantCode;
  quadrantLabel: ValueReadinessQuadrant;
  outlierFlags: PortfolioOutlierFlag[];
}

export interface GateInput {
  label: string;
  owner?: string;
  dependency?: string;
  valueUnlocked?: string;
  status?: string;
  note?: string;
}

export interface ProofBoundaryInput {
  known?: string[];
  assumed?: string[];
  missing?: string[];
  decisionRequired?: string;
}

export interface FastCanvasAnalyticsContext {
  title: string;
  intent?: CanvasAnalyticsIntent;
  decisionRequired?: string;
  summary?: string;
  suggestedFollowUpQuestions?: string[];
}

export interface FastCanvasAnalyticsPayload {
  title: string;
  intent: CanvasAnalyticsIntent;
  rankedCandidates: RankedPortfolioCandidate[];
  lanes: Array<{
    posture: InvestmentPostureCode;
    label: InvestmentPosture;
    candidates: RankedPortfolioCandidate[];
  }>;
  quadrantPlacements: Record<ValueReadinessQuadrantCode, RankedPortfolioCandidate[]>;
  topRecommendation?: RankedPortfolioCandidate;
  keyProofGaps: string[];
  outlierFlags: PortfolioOutlierFlag[];
  decisionRequired: string;
  suggestedFollowUpQuestions: string[];
  canvas: CxoCanvasPayload;
}

export interface NumericSeriesPoint {
  label: string;
  value: number;
}

export interface OutlierPoint extends NumericSeriesPoint {
  kind: "low" | "high";
  zScore: number;
}

export interface SensitivityCaseInput {
  label: string;
  value: number;
  lowMultiplier?: number;
  highMultiplier?: number;
  assumption?: string;
}

export interface SensitivityCase {
  label: string;
  low: number;
  base: number;
  high: number;
  assumption?: string;
}

const DEFAULT_WEIGHTS: PortfolioScoreWeights = {
  value: 0.38,
  readiness: 0.34,
  risk: 0.18,
  evidenceConfidence: 0.1,
};

const LANE_ORDER: InvestmentPosture[] = [
  "Scale now",
  "Certify then scale",
  "Fund readiness",
  "Hold / stop",
];

const POSTURE_CODE_TO_LABEL: Record<InvestmentPostureCode, InvestmentPosture> = {
  scale_now: "Scale now",
  certify_then_scale: "Certify then scale",
  fund_readiness: "Fund readiness",
  hold: "Hold / stop",
};

const QUADRANT_CODE_TO_LABEL: Record<
  ValueReadinessQuadrantCode,
  ValueReadinessQuadrant
> = {
  high_value_high_readiness: "High value / high readiness",
  high_value_low_readiness: "High value / low readiness",
  low_value_high_readiness: "Lower value / high readiness",
  low_value_low_readiness: "Lower value / low readiness",
};

const POSTURE_CODE_ORDER: InvestmentPostureCode[] = [
  "scale_now",
  "certify_then_scale",
  "fund_readiness",
  "hold",
];

const QUADRANT_CODE_ORDER: ValueReadinessQuadrantCode[] = [
  "high_value_high_readiness",
  "high_value_low_readiness",
  "low_value_high_readiness",
  "low_value_low_readiness",
];

export function normalizeScore(
  value: number | null | undefined,
  min = 0,
  max = 10,
): number {
  if (!Number.isFinite(value) || max <= min) return 0;
  const normalized = ((Number(value) - min) / (max - min)) * 100;
  return round(Math.max(0, Math.min(100, normalized)), 1);
}

export function normalizeTenPointScore(value: number | null | undefined): number {
  if (!Number.isFinite(value)) return 0;
  return round(Math.max(0, Math.min(10, Number(value))), 1);
}

export function normalizeValueScore(
  candidate: IntelligencePortfolioCandidate,
): number {
  return normalizeTenPointScore(candidate.valueSignal);
}

export function normalizeReadinessScore(
  candidate: IntelligencePortfolioCandidate,
): number {
  return normalizeTenPointScore(candidate.readinessSignal);
}

export function normalizeRiskScore(
  candidate: IntelligencePortfolioCandidate,
): number {
  const dependencyPenalty = candidate.dependenciesKnown ? 0 : 0.6;
  const controlPenalty = candidate.controlKnown ? 0 : 0.4;
  return normalizeTenPointScore(
    candidate.riskSignal + dependencyPenalty + controlPenalty,
  );
}

export function calculateProofBoundaryScore(
  candidate: IntelligencePortfolioCandidate,
): number {
  const evidenceTotal = candidate.evidenceCount + candidate.missingEvidenceCount;
  const evidenceCoverage =
    evidenceTotal > 0 ? candidate.evidenceCount / evidenceTotal : 0.5;
  const sourceConfidence = normalizeSourceConfidence(candidate.sourceConfidence);
  const completeness =
    [
      candidate.ownerKnown,
      candidate.controlKnown,
      candidate.baselineKnown,
      candidate.dependenciesKnown,
    ].filter(Boolean).length / 4;
  return round(
    Math.max(
      0,
      Math.min(
        10,
        evidenceCoverage * 4 + sourceConfidence * 3 + completeness * 3,
      ),
    ),
    1,
  );
}

export function assignInvestmentPosture(
  candidate: IntelligencePortfolioCandidate,
): InvestmentPostureAssessment {
  const value = normalizeValueScore(candidate);
  const readiness = normalizeReadinessScore(candidate);
  const risk = normalizeRiskScore(candidate);
  const proof = calculateProofBoundaryScore(candidate);
  const weakValueMeasurement = !candidate.baselineKnown && value < 6;

  if (value >= 7 && readiness >= 7 && risk <= 6 && proof >= 6.5) {
    return {
      posture: "scale_now",
      label: POSTURE_CODE_TO_LABEL.scale_now,
      explanation:
        "High value, high readiness, acceptable risk, and enough proof to scale with normal governance.",
    };
  }

  if (value >= 7 && readiness >= 5 && risk <= 7.5 && proof >= 5) {
    return {
      posture: "certify_then_scale",
      label: POSTURE_CODE_TO_LABEL.certify_then_scale,
      explanation:
        "High-value candidate with enough readiness to pursue, but it needs certification before scale capital.",
    };
  }

  if (value >= 7 && (readiness < 5 || proof < 5 || risk > 7.5)) {
    return {
      posture: "fund_readiness",
      label: POSTURE_CODE_TO_LABEL.fund_readiness,
      explanation:
        "High value is visible, but readiness, proof, or risk is not strong enough for scale.",
    };
  }

  if (weakValueMeasurement || (value < 6 && (readiness < 6 || proof < 6))) {
    return {
      posture: "hold",
      label: POSTURE_CODE_TO_LABEL.hold,
      explanation:
        "Value measurement or proof is too weak to justify scale funding now.",
    };
  }

  if (readiness >= 6 && proof >= 6 && risk <= 6.5) {
    return {
      posture: "certify_then_scale",
      label: POSTURE_CODE_TO_LABEL.certify_then_scale,
      explanation:
        "Operationally plausible, but value case should be certified before scaling.",
    };
  }

  return {
    posture: "hold",
    label: POSTURE_CODE_TO_LABEL.hold,
    explanation:
      "The candidate lacks enough combined value, readiness, proof, or risk posture for near-term funding.",
  };
}

export function calculateQuadrantPlacement(
  candidate: IntelligencePortfolioCandidate,
): {
  quadrant: ValueReadinessQuadrantCode;
  label: ValueReadinessQuadrant;
} {
  const value = normalizeValueScore(candidate);
  const readiness = normalizeReadinessScore(candidate);
  const highValue = value >= 7;
  const highReadiness = readiness >= 6.5;
  if (highValue && highReadiness) {
    return {
      quadrant: "high_value_high_readiness",
      label: QUADRANT_CODE_TO_LABEL.high_value_high_readiness,
    };
  }
  if (highValue && !highReadiness) {
    return {
      quadrant: "high_value_low_readiness",
      label: QUADRANT_CODE_TO_LABEL.high_value_low_readiness,
    };
  }
  if (!highValue && highReadiness) {
    return {
      quadrant: "low_value_high_readiness",
      label: QUADRANT_CODE_TO_LABEL.low_value_high_readiness,
    };
  }
  return {
    quadrant: "low_value_low_readiness",
    label: QUADRANT_CODE_TO_LABEL.low_value_low_readiness,
  };
}

export function bucketInvestmentPosture(
  item: Pick<PortfolioItemInput, "value" | "readiness" | "risk">,
): InvestmentPosture {
  const value = normalizeTenPointScore(item.value);
  const readiness = normalizeTenPointScore(item.readiness);
  const risk = normalizeTenPointScore(item.risk);

  if (value >= 7 && readiness >= 7 && risk <= 6) return "Scale now";
  if (value >= 7 && readiness < 5) return "Fund readiness";
  if (value >= 6 && readiness >= 5 && risk <= 7) {
    return "Certify then scale";
  }
  if (value < 6 && readiness >= 6 && risk <= 5) {
    return "Certify then scale";
  }
  return "Hold / stop";
}

export function computeValueReadinessQuadrant(
  item: Pick<PortfolioItemInput, "value" | "readiness">,
): ValueReadinessQuadrant {
  const value = normalizeTenPointScore(item.value);
  const readiness = normalizeTenPointScore(item.readiness);
  const highValue = value >= 7;
  const highReadiness = readiness >= 6.5;
  if (highValue && highReadiness) return "High value / high readiness";
  if (highValue && !highReadiness) return "High value / low readiness";
  if (!highValue && highReadiness) return "Lower value / high readiness";
  return "Lower value / low readiness";
}

export function detectPortfolioOutliers(
  candidates: IntelligencePortfolioCandidate[],
): PortfolioOutlierFlag[] {
  return candidates.flatMap((candidate) => {
    const value = normalizeValueScore(candidate);
    const readiness = normalizeReadinessScore(candidate);
    const risk = normalizeRiskScore(candidate);
    const proof = calculateProofBoundaryScore(candidate);
    const flags: PortfolioOutlierFlag[] = [];

    if (value >= 8 && proof < 5.5) {
      flags.push({
        candidateId: candidate.id,
        candidateName: candidate.name,
        code: "high_value_low_proof",
        severity: "high",
        message: `${candidate.name} has high value signal but weak proof coverage.`,
      });
    }

    if (readiness >= 7 && risk >= 7) {
      flags.push({
        candidateId: candidate.id,
        candidateName: candidate.name,
        code: "high_readiness_high_risk",
        severity: "medium",
        message: `${candidate.name} looks ready operationally but still carries high risk.`,
      });
    }

    if (value >= 7 && !candidate.ownerKnown) {
      flags.push({
        candidateId: candidate.id,
        candidateName: candidate.name,
        code: "missing_owner_high_value",
        severity: "high",
        message: `${candidate.name} is high value but lacks a named accountable owner.`,
      });
    }

    if (value >= 7 && readiness >= 6.5 && !candidate.baselineKnown) {
      flags.push({
        candidateId: candidate.id,
        candidateName: candidate.name,
        code: "missing_baseline_scale_candidate",
        severity: "high",
        message: `${candidate.name} is near scale posture but lacks a signed value baseline.`,
      });
    }

    if (value >= 7 && !candidate.dependenciesKnown) {
      flags.push({
        candidateId: candidate.id,
        candidateName: candidate.name,
        code: "high_dependency_uncertainty",
        severity: "medium",
        message: `${candidate.name} has high value but unresolved dependency evidence.`,
      });
    }

    return flags;
  });
}

export function rankPortfolioCandidates(
  candidates: IntelligencePortfolioCandidate[],
): RankedPortfolioCandidate[] {
  const flags = detectPortfolioOutliers(candidates);
  return candidates
    .map((candidate) => {
      const valueScore = normalizeValueScore(candidate);
      const readinessScore = normalizeReadinessScore(candidate);
      const riskScore = normalizeRiskScore(candidate);
      const proofScore = calculateProofBoundaryScore(candidate);
      const posture = assignInvestmentPosture(candidate);
      const quadrant = calculateQuadrantPlacement(candidate);
      const rankScore =
        valueScore * 0.36 +
        readinessScore * 0.26 +
        proofScore * 0.24 +
        (10 - riskScore) * 0.14 +
        completenessBonus(candidate);
      return {
        ...candidate,
        valueScore,
        readinessScore,
        riskScore,
        proofScore,
        rankScore: round(rankScore, 2),
        posture: posture.posture,
        postureLabel: posture.label,
        postureExplanation: posture.explanation,
        quadrant: quadrant.quadrant,
        quadrantLabel: quadrant.label,
        outlierFlags: flags.filter((flag) => flag.candidateId === candidate.id),
      };
    })
    .sort((a, b) => {
      if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
      if (b.valueScore !== a.valueScore) return b.valueScore - a.valueScore;
      return a.riskScore - b.riskScore;
    });
}

export function buildFastCanvasAnalytics(
  candidates: IntelligencePortfolioCandidate[],
  context: FastCanvasAnalyticsContext,
): FastCanvasAnalyticsPayload {
  const rankedCandidates = rankPortfolioCandidates(candidates);
  const lanes = POSTURE_CODE_ORDER.map((posture) => ({
    posture,
    label: POSTURE_CODE_TO_LABEL[posture],
    candidates: rankedCandidates.filter((candidate) => candidate.posture === posture),
  })).filter((lane) => lane.candidates.length > 0);
  const quadrantPlacements = QUADRANT_CODE_ORDER.reduce(
    (accumulator, quadrant) => {
      accumulator[quadrant] = rankedCandidates.filter(
        (candidate) => candidate.quadrant === quadrant,
      );
      return accumulator;
    },
    {} as Record<ValueReadinessQuadrantCode, RankedPortfolioCandidate[]>,
  );
  const outlierFlags = rankedCandidates.flatMap((candidate) => candidate.outlierFlags);
  const keyProofGaps = buildKeyProofGaps(rankedCandidates, outlierFlags);
  const topRecommendation =
    rankedCandidates.find((candidate) => candidate.posture !== "hold") ??
    rankedCandidates[0];
  const decisionRequired =
    context.decisionRequired ??
    buildDecisionRequired(topRecommendation, keyProofGaps);
  const suggestedFollowUpQuestions =
    context.suggestedFollowUpQuestions ??
    buildSuggestedFollowUps(topRecommendation, keyProofGaps);
  const proofBoundary = buildAnalyticsProofBoundary(
    rankedCandidates,
    keyProofGaps,
    decisionRequired,
  );
  const intent = context.intent ?? "executive-canvas-sequencing";
  const canvas = buildAnalyticsCanvas({
    title: context.title,
    summary: context.summary,
    intent,
    rankedCandidates,
    proofBoundary,
    decisionRequired,
  });

  return {
    title: context.title,
    intent,
    rankedCandidates,
    lanes,
    quadrantPlacements,
    ...(topRecommendation ? { topRecommendation } : {}),
    keyProofGaps,
    outlierFlags,
    decisionRequired,
    suggestedFollowUpQuestions,
    canvas,
  };
}

export function rankPortfolioItems(
  items: PortfolioItemInput[],
  weights: Partial<PortfolioScoreWeights> = {},
): RankedPortfolioItem[] {
  const mergedWeights = { ...DEFAULT_WEIGHTS, ...weights };
  return items
    .map((item) => {
      const value = normalizeTenPointScore(item.value);
      const readiness = normalizeTenPointScore(item.readiness);
      const risk = normalizeTenPointScore(item.risk);
      const evidenceConfidence = normalizeTenPointScore(
        item.evidenceConfidence ?? readiness,
      );
      const score =
        value * mergedWeights.value +
        readiness * mergedWeights.readiness +
        (10 - risk) * mergedWeights.risk +
        evidenceConfidence * mergedWeights.evidenceConfidence;
      const posture = bucketInvestmentPosture({ value, readiness, risk });
      return {
        ...item,
        value,
        readiness,
        risk,
        evidenceConfidence,
        score: round(score, 2),
        posture,
        quadrant: computeValueReadinessQuadrant({ value, readiness }),
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.value !== a.value) return b.value - a.value;
      return b.readiness - a.readiness;
    });
}

export function computeValueReadinessQuadrants(
  items: PortfolioItemInput[],
): Record<ValueReadinessQuadrant, RankedPortfolioItem[]> {
  const quadrants: Record<ValueReadinessQuadrant, RankedPortfolioItem[]> = {
    "High value / high readiness": [],
    "High value / low readiness": [],
    "Lower value / high readiness": [],
    "Lower value / low readiness": [],
  };
  for (const item of rankPortfolioItems(items)) {
    quadrants[item.quadrant].push(item);
  }
  return quadrants;
}

export function buildInvestmentSequencingPayload({
  title,
  items,
  summary,
  proofBoundary,
  decisionRequired,
}: {
  title: string;
  items: PortfolioItemInput[];
  summary?: string;
  proofBoundary?: ProofBoundaryInput;
  decisionRequired?: string;
}): CxoCanvasPayload {
  const rankedItems = rankPortfolioItems(items);
  const lanes = LANE_ORDER.map<CxoCanvasLane>((label) => ({
    label,
    items: rankedItems
      .filter((item) => item.posture === label)
      .map(toCanvasItem),
  })).filter((lane) => lane.items.length > 0);

  return withoutEmptyPayloadFields({
    canvasType: "executive-canvas-sequencing",
    title,
    summary,
    lanes,
    proofBoundary: compactProofBoundary(proofBoundary),
    decisionRequired,
    confidence: averageConfidence(rankedItems),
  });
}

export function buildValueReadinessMatrixPayload({
  title,
  items,
  summary,
  proofBoundary,
  decisionRequired,
}: {
  title: string;
  items: PortfolioItemInput[];
  summary?: string;
  proofBoundary?: ProofBoundaryInput;
  decisionRequired?: string;
}): CxoCanvasPayload {
  const rankedItems = rankPortfolioItems(items);
  return withoutEmptyPayloadFields({
    canvasType: "value-readiness-matrix",
    title,
    summary,
    items: rankedItems.map(toCanvasItem),
    proofBoundary: compactProofBoundary(proofBoundary),
    decisionRequired,
    confidence: averageConfidence(rankedItems),
  });
}

export function computeGateToValueRoadmap(gates: GateInput[]): CxoCanvasGate[] {
  return gates.map((gate, index) => ({
    label: gate.label,
    ...(gate.owner ? { owner: gate.owner } : {}),
    ...(gate.dependency ? { dependency: gate.dependency } : {}),
    ...(gate.valueUnlocked ? { valueUnlocked: gate.valueUnlocked } : {}),
    status: gate.status ?? `Gate ${index + 1}`,
    ...(gate.note ? { note: gate.note } : {}),
  }));
}

export function buildGateToValueRoadmapPayload({
  title,
  gates,
  summary,
  proofBoundary,
  decisionRequired,
}: {
  title: string;
  gates: GateInput[];
  summary?: string;
  proofBoundary?: ProofBoundaryInput;
  decisionRequired?: string;
}): CxoCanvasPayload {
  return withoutEmptyPayloadFields({
    canvasType: "gate-to-value-roadmap",
    title,
    summary,
    gates: computeGateToValueRoadmap(gates),
    proofBoundary: compactProofBoundary(proofBoundary),
    decisionRequired,
  });
}

export function computeProofBoundary(
  proofBoundary: ProofBoundaryInput,
): CxoCanvasProofBoundary {
  return compactProofBoundary(proofBoundary) ?? {};
}

export function buildProofBoundaryPayload({
  title,
  proofBoundary,
  summary,
  decisionRequired,
}: {
  title: string;
  proofBoundary: ProofBoundaryInput;
  summary?: string;
  decisionRequired?: string;
}): CxoCanvasPayload {
  return withoutEmptyPayloadFields({
    canvasType: "proof-boundary-card",
    title,
    summary,
    proofBoundary: compactProofBoundary({
      ...proofBoundary,
      decisionRequired: proofBoundary.decisionRequired ?? decisionRequired,
    }),
    decisionRequired,
  });
}

export function detectOutliers(
  series: NumericSeriesPoint[],
  threshold = 2,
): OutlierPoint[] {
  const values = series
    .map((point) => point.value)
    .filter((value) => Number.isFinite(value));
  if (values.length < 3) return [];
  const mean = values.reduce((total, value) => total + value, 0) / values.length;
  const variance =
    values.reduce((total, value) => total + (value - mean) ** 2, 0) /
    values.length;
  const standardDeviation = Math.sqrt(variance);
  if (standardDeviation === 0) return [];
  return series
    .map((point) => ({
      ...point,
      zScore: round((point.value - mean) / standardDeviation, 2),
    }))
    .filter((point) => Math.abs(point.zScore) >= threshold)
    .map((point) => ({
      ...point,
      kind: point.zScore > 0 ? "high" : "low",
    }));
}

export function computeSensitivityCases(
  cases: SensitivityCaseInput[],
): SensitivityCase[] {
  return cases.map((entry) => {
    const base = Number.isFinite(entry.value) ? entry.value : 0;
    return {
      label: entry.label,
      low: round(base * (entry.lowMultiplier ?? 0.75), 2),
      base: round(base, 2),
      high: round(base * (entry.highMultiplier ?? 1.25), 2),
      ...(entry.assumption ? { assumption: entry.assumption } : {}),
    };
  });
}

export const INDUSTRIAL_DEMO_PORTFOLIO_CANDIDATES: IntelligencePortfolioCandidate[] =
  [
    {
      id: "industrial-treasury-kyriba",
      name: "Treasury / Kyriba",
      domain: "Treasury",
      tenantKey: "lakeshore-holdings",
      valueSignal: 8.5,
      readinessSignal: 8,
      riskSignal: 4,
      evidenceCount: 14,
      missingEvidenceCount: 2,
      ownerKnown: true,
      controlKnown: true,
      baselineKnown: true,
      dependenciesKnown: true,
      sourceConfidence: 0.82,
      notes: "Control evidence, bank connectivity, and CFO/Treasurer ownership make this the cleanest scale lane.",
    },
    {
      id: "industrial-finance-semantic-layer",
      name: "Finance semantic layer",
      domain: "Finance / FP&A",
      tenantKey: "lakeshore-holdings",
      valueSignal: 8.2,
      readinessSignal: 6.5,
      riskSignal: 5.5,
      evidenceCount: 10,
      missingEvidenceCount: 4,
      ownerKnown: true,
      controlKnown: true,
      baselineKnown: true,
      dependenciesKnown: false,
      sourceConfidence: 0.7,
      notes: "High priority, but AP/AR/GL feed quality and semantic ownership need certification.",
    },
    {
      id: "industrial-shared-services-agent",
      name: "Shared Services AI agent",
      domain: "Shared Services",
      tenantKey: "lakeshore-holdings",
      valueSignal: 8,
      readinessSignal: 5.8,
      riskSignal: 6,
      evidenceCount: 8,
      missingEvidenceCount: 5,
      ownerKnown: true,
      controlKnown: false,
      baselineKnown: true,
      dependenciesKnown: false,
      sourceConfidence: 0.62,
      notes: "Good lighthouse candidate if service baseline and control boundaries are ratified.",
    },
    {
      id: "industrial-hr-ai",
      name: "HR AI",
      domain: "HR",
      tenantKey: "lakeshore-holdings",
      valueSignal: 7,
      readinessSignal: 4.8,
      riskSignal: 6.5,
      evidenceCount: 6,
      missingEvidenceCount: 8,
      ownerKnown: true,
      controlKnown: false,
      baselineKnown: false,
      dependenciesKnown: false,
      sourceConfidence: 0.55,
      notes: "Requires process-volume proof, policy ownership, and employee-facing control boundaries.",
    },
    {
      id: "industrial-legal-ai",
      name: "Legal AI",
      domain: "Legal",
      tenantKey: "lakeshore-holdings",
      valueSignal: 7.3,
      readinessSignal: 4,
      riskSignal: 7.5,
      evidenceCount: 4,
      missingEvidenceCount: 9,
      ownerKnown: true,
      controlKnown: false,
      baselineKnown: false,
      dependenciesKnown: false,
      sourceConfidence: 0.45,
      notes: "Needs CLM/eBilling evidence, matter taxonomy, clause library, and approval authority.",
    },
    {
      id: "industrial-m365-copilot-scale",
      name: "M365 Copilot scale",
      domain: "Productivity",
      tenantKey: "lakeshore-holdings",
      valueSignal: 5.8,
      readinessSignal: 7,
      riskSignal: 6,
      evidenceCount: 12,
      missingEvidenceCount: 8,
      ownerKnown: true,
      controlKnown: true,
      baselineKnown: false,
      dependenciesKnown: true,
      sourceConfidence: 0.66,
      notes: "Deployment is technically ready, but scale should wait for value measurement and use-case ownership.",
    },
  ];

export const SKYHARBOR_DEMO_PORTFOLIO_CANDIDATES: IntelligencePortfolioCandidate[] =
  [
    {
      id: "skyharbor-loyalty-ai",
      name: "Loyalty AI",
      domain: "Commercial / Loyalty",
      tenantKey: "skyharbor-air",
      valueSignal: 8.8,
      readinessSignal: 8,
      riskSignal: 4,
      evidenceCount: 18,
      missingEvidenceCount: 1,
      ownerKnown: true,
      controlKnown: true,
      baselineKnown: true,
      dependenciesKnown: true,
      sourceConfidence: 0.9,
      notes: "Strong customer-domain evidence and clear ownership make this the cleanest scale candidate.",
    },
    {
      id: "skyharbor-crew-recovery",
      name: "Crew Recovery",
      domain: "Operations",
      tenantKey: "skyharbor-air",
      valueSignal: 8.2,
      readinessSignal: 6.5,
      riskSignal: 5.5,
      evidenceCount: 12,
      missingEvidenceCount: 4,
      ownerKnown: true,
      controlKnown: true,
      baselineKnown: true,
      dependenciesKnown: false,
      sourceConfidence: 0.72,
      notes: "Worth scaling after crew legality, override, and human-in-loop gates are certified.",
    },
    {
      id: "skyharbor-predictive-maintenance",
      name: "Predictive Maintenance",
      domain: "TechOps",
      tenantKey: "skyharbor-air",
      valueSignal: 7.4,
      readinessSignal: 6.1,
      riskSignal: 5.8,
      evidenceCount: 10,
      missingEvidenceCount: 5,
      ownerKnown: true,
      controlKnown: true,
      baselineKnown: false,
      dependenciesKnown: false,
      sourceConfidence: 0.65,
      notes: "Good candidate once maintenance lineage and value baseline are signed.",
    },
    {
      id: "skyharbor-irops",
      name: "IROPS",
      domain: "Operations / IROPS",
      tenantKey: "skyharbor-air",
      valueSignal: 10,
      readinessSignal: 3.5,
      riskSignal: 8.2,
      evidenceCount: 8,
      missingEvidenceCount: 10,
      ownerKnown: true,
      controlKnown: false,
      baselineKnown: false,
      dependenciesKnown: false,
      sourceConfidence: 0.56,
      notes: "Largest value pool, but data/control readiness risk makes this a readiness-funded bet.",
    },
    {
      id: "skyharbor-customer-disruption-recovery",
      name: "Customer Disruption Recovery",
      domain: "Customer Operations",
      tenantKey: "skyharbor-air",
      valueSignal: 9,
      readinessSignal: 3.8,
      riskSignal: 8,
      evidenceCount: 6,
      missingEvidenceCount: 9,
      ownerKnown: true,
      controlKnown: false,
      baselineKnown: false,
      dependenciesKnown: false,
      sourceConfidence: 0.5,
      notes: "High-value recovery lane, but PNR, consent, and customer impact controls are not scale-ready.",
    },
  ];

function buildAnalyticsCanvas({
  title,
  summary,
  intent,
  rankedCandidates,
  proofBoundary,
  decisionRequired,
}: {
  title: string;
  summary?: string;
  intent: CanvasAnalyticsIntent;
  rankedCandidates: RankedPortfolioCandidate[];
  proofBoundary: ProofBoundaryInput;
  decisionRequired: string;
}): CxoCanvasPayload {
  const portfolioItems = rankedCandidates.map(candidateToPortfolioItem);
  if (intent === "value-readiness-matrix") {
    return buildValueReadinessMatrixPayload({
      title,
      items: portfolioItems,
      summary,
      proofBoundary,
      decisionRequired,
    });
  }
  if (intent === "gate-to-value-roadmap") {
    return buildGateToValueRoadmapPayload({
      title,
      gates: rankedCandidates.slice(0, 4).map(candidateToGate),
      summary,
      proofBoundary,
      decisionRequired,
    });
  }
  if (intent === "proof-boundary-card") {
    return buildProofBoundaryPayload({
      title,
      summary,
      proofBoundary,
      decisionRequired,
    });
  }
  return buildInvestmentSequencingPayload({
    title,
    items: portfolioItems,
    summary,
    proofBoundary,
    decisionRequired,
  });
}

function buildAnalyticsProofBoundary(
  rankedCandidates: RankedPortfolioCandidate[],
  keyProofGaps: string[],
  decisionRequired: string,
): ProofBoundaryInput {
  const topKnown = rankedCandidates
    .filter((candidate) => candidate.proofScore >= 6.5)
    .slice(0, 2)
    .map(
      (candidate) =>
        `${candidate.name}: ${candidate.postureLabel.toLowerCase()} with proof score ${candidate.proofScore}/10.`,
    );
  const missing = keyProofGaps.slice(0, 4);
  return {
    known: topKnown.length
      ? topKnown
      : ["AbarVa has enough candidate-level signals to build an initial ranking."],
    missing: missing.length
      ? missing
      : ["No major proof gap surfaced in the deterministic fast canvas."],
    assumed: [
      "Scores are deterministic fast-canvas planning scores until the model-grounded answer finishes.",
    ],
    decisionRequired,
  };
}

function buildKeyProofGaps(
  rankedCandidates: RankedPortfolioCandidate[],
  outlierFlags: PortfolioOutlierFlag[],
): string[] {
  const gaps = new Set<string>();
  for (const candidate of rankedCandidates) {
    if (!candidate.ownerKnown) gaps.add(`${candidate.name}: name an accountable owner.`);
    if (!candidate.controlKnown) gaps.add(`${candidate.name}: certify control boundary.`);
    if (!candidate.baselineKnown) gaps.add(`${candidate.name}: sign value baseline.`);
    if (!candidate.dependenciesKnown) gaps.add(`${candidate.name}: resolve dependency evidence.`);
  }
  for (const flag of outlierFlags) gaps.add(flag.message);
  return [...gaps].slice(0, 8);
}

function buildDecisionRequired(
  topRecommendation: RankedPortfolioCandidate | undefined,
  keyProofGaps: string[],
): string {
  if (!topRecommendation) {
    return "Confirm the candidate list and assign an executive owner before funding decisions.";
  }
  if (topRecommendation.posture === "scale_now") {
    return `Approve ${topRecommendation.name} as the first scale lane and require proof closure on ${keyProofGaps[0] ?? "remaining control gaps"}.`;
  }
  if (topRecommendation.posture === "certify_then_scale") {
    return `Certify ${topRecommendation.name} before scale funding and name the owner for unresolved proof gaps.`;
  }
  if (topRecommendation.posture === "fund_readiness") {
    return `Fund readiness for ${topRecommendation.name}; do not release scale capital until proof and control gates close.`;
  }
  return `Hold ${topRecommendation.name} until the value case and evidence boundary are stronger.`;
}

function buildSuggestedFollowUps(
  topRecommendation: RankedPortfolioCandidate | undefined,
  keyProofGaps: string[],
): string[] {
  const candidateName = topRecommendation?.name ?? "the top candidate";
  return [
    `What proof must be closed before ${candidateName} scales?`,
    "Which initiatives should move into scale, certify, readiness, or hold?",
    keyProofGaps.length
      ? "Which proof gap is the biggest blocker?"
      : "What is the 90-day path to make this board-ready?",
  ];
}

function candidateToPortfolioItem(
  candidate: RankedPortfolioCandidate,
): PortfolioItemInput {
  return {
    label: candidate.name,
    value: candidate.valueScore,
    readiness: candidate.readinessScore,
    risk: candidate.riskScore,
    evidenceConfidence: candidate.proofScore,
    action: candidate.postureLabel,
    gate: candidateToGateText(candidate),
    note: candidate.notes ?? candidate.postureExplanation,
  };
}

function candidateToGate(candidate: RankedPortfolioCandidate): GateInput {
  return {
    label: candidateToGateText(candidate),
    owner: candidate.ownerKnown ? "Named owner exists" : "Owner required",
    dependency: candidate.dependenciesKnown
      ? "Dependencies known"
      : "Dependency evidence required",
    valueUnlocked: `${candidate.name}: ${candidate.postureLabel.toLowerCase()}`,
    status: candidate.postureLabel,
    note: candidate.notes ?? candidate.postureExplanation,
  };
}

function candidateToGateText(candidate: RankedPortfolioCandidate): string {
  const gates: string[] = [];
  if (!candidate.ownerKnown) gates.push("owner");
  if (!candidate.controlKnown) gates.push("control");
  if (!candidate.baselineKnown) gates.push("baseline");
  if (!candidate.dependenciesKnown) gates.push("dependencies");
  return gates.length
    ? `Close ${gates.join(", ")} proof`
    : "Maintain proof and control signoff";
}

function completenessBonus(candidate: IntelligencePortfolioCandidate): number {
  return round(
    [
      candidate.ownerKnown,
      candidate.controlKnown,
      candidate.baselineKnown,
      candidate.dependenciesKnown,
    ].filter(Boolean).length * 0.08,
    2,
  );
}

function normalizeSourceConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value <= 1 ? Math.max(0, Math.min(1, value)) : normalizeTenPointScore(value) / 10;
}

function toCanvasItem(item: RankedPortfolioItem): CxoCanvasItem {
  return {
    label: item.label,
    value: item.value,
    readiness: item.readiness,
    risk: item.risk,
    confidence: item.evidenceConfidence,
    action: item.action ?? item.posture,
    ...(item.owner ? { owner: item.owner } : {}),
    ...(item.gate ? { gate: item.gate } : {}),
    ...(item.note ? { note: item.note } : {}),
  };
}

function compactProofBoundary(
  proofBoundary: ProofBoundaryInput | undefined,
): CxoCanvasProofBoundary | undefined {
  if (!proofBoundary) return undefined;
  const compacted: CxoCanvasProofBoundary = {};
  if (proofBoundary.known?.length) compacted.known = proofBoundary.known;
  if (proofBoundary.assumed?.length) compacted.assumed = proofBoundary.assumed;
  if (proofBoundary.missing?.length) compacted.missing = proofBoundary.missing;
  if (proofBoundary.decisionRequired) {
    compacted.decisionRequired = proofBoundary.decisionRequired;
  }
  return Object.keys(compacted).length > 0 ? compacted : undefined;
}

function withoutEmptyPayloadFields(payload: CxoCanvasPayload): CxoCanvasPayload {
  const next = { ...payload };
  if (next.items?.length === 0) delete next.items;
  if (next.lanes?.length === 0) delete next.lanes;
  if (next.gates?.length === 0) delete next.gates;
  return next;
}

function averageConfidence(items: RankedPortfolioItem[]): number | undefined {
  if (items.length === 0) return undefined;
  const average =
    items.reduce((total, item) => total + item.evidenceConfidence, 0) /
    items.length;
  return round(average, 1);
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

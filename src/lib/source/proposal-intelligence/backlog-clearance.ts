import { buildVendorLevers, topLevers } from "./levers";
import type {
  EvaluationCriterion,
  NegotiationLever,
  NormalizedCategory,
  VendorScore,
} from "./types";
import type { VendorResponseParseReport } from "./parser";

export interface SourceFirstPassScorecard {
  sourceEventId: string;
  tenantKey: string;
  generatedAt: string;
  criteria: EvaluationCriterion[];
  scores: VendorScore[];
  holdbacks: SourceScoreHoldback[];
  readyVendorCount: number;
  totalVendorCount: number;
  nextAction: string;
}

export interface SourceScoreHoldback {
  holdbackId: string;
  vendorName: string;
  criteriaId: string;
  severity: "blocker" | "holdback";
  reason: string;
  requiredEvidence: string;
}

export interface SourceBafoLeverageOptimizer {
  sourceEventId: string;
  tenantKey: string;
  generatedAt: string;
  levers: NegotiationLever[];
  evidencedValueLowUsd: number | null;
  evidencedValueHighUsd: number | null;
  opportunityToTestCount: number;
  guardrail: string;
  nextAction: string;
}

export interface SourceExecutiveDecisionPack {
  sourceEventId: string;
  tenantKey: string;
  generatedAt: string;
  posture: "ready_for_cxo_review" | "hold_for_bafo" | "hold_for_evidence";
  recommendation: string;
  decisionConditions: string[];
  evidenceUsed: string[];
  unresolvedRisks: string[];
  valueNarrative: string;
  nextAction: string;
}

export interface SourceValueRealizationProofPlan {
  sourceEventId: string;
  tenantKey: string;
  generatedAt: string;
  proofState: "ready_to_track" | "needs_award_commitments" | "not_ready";
  trackedLevers: SourceValueProofLever[];
  missingProof: string[];
  bookedValueLowUsd: number | null;
  bookedValueHighUsd: number | null;
  guardrail: string;
  nextAction: string;
}

export interface SourceValueProofLever {
  leverId: string;
  vendorName: string | "all";
  proofRequired: string;
  baselineRequired: string;
  ownerRole: string;
  cadence: "monthly" | "quarterly" | "milestone";
  valueBasis: "evidenced" | "opportunity_to_test";
}

const GENERATED_AT = "2026-08-11T00:00:00.000Z";

const DEFAULT_CRITERIA: EvaluationCriterion[] = [
  criterion("scope", "scope_coverage", "Scope fit", 15, "Sourcing lead"),
  criterion(
    "pricing",
    "pricing_structure",
    "Comparable TCO",
    20,
    "Commercial lead",
  ),
  criterion(
    "sla",
    "sla_commitments",
    "SLA accountability",
    15,
    "Service owner",
  ),
  criterion(
    "staffing",
    "staffing_model",
    "Delivery capacity",
    15,
    "Delivery lead",
  ),
  criterion(
    "transition",
    "transition_approach",
    "Transition risk",
    15,
    "Transition lead",
  ),
  criterion(
    "security",
    "security_compliance",
    "Risk and compliance",
    10,
    "Risk owner",
  ),
  criterion(
    "productivity",
    "automation_productivity",
    "Productivity commitment",
    10,
    "Commercial lead",
  ),
];

export function buildSourceFirstPassScorecard(
  reports: VendorResponseParseReport[],
  criteria: EvaluationCriterion[] = DEFAULT_CRITERIA,
  generatedAt = GENERATED_AT,
): SourceFirstPassScorecard {
  const scores: VendorScore[] = [];
  const holdbacks: SourceScoreHoldback[] = [];

  for (const report of reports) {
    for (const criterion of criteria) {
      const finding = report.sectionFindings.find(
        (section) => section.normalizedCategory === criterion.category,
      );
      const missing = report.missingInputs.find(
        (item) =>
          item.scoringImpact
            .toLowerCase()
            .includes(criterion.description.toLowerCase()) ||
          finding?.evaluatorHoldback === item.scoringImpact ||
          item.request
            .toLowerCase()
            .includes(criterion.description.toLowerCase()),
      );
      const evidenceReference = finding?.citationIds[0] ?? null;
      const score = suggestedScoreFor(finding?.status, evidenceReference);
      scores.push({
        sourceEventId: report.sourceEventId,
        vendorName: report.vendorName,
        responseVersion: report.responseVersion,
        criteriaId: criterion.criteriaId,
        aiSuggestedScore: score,
        aiRationale: rationaleFor(
          criterion,
          finding?.status,
          evidenceReference,
        ),
        evidenceReference,
        aiConfidence: evidenceReference ? "medium" : "low",
        evaluatorScore: null,
        evaluatorComment: null,
        evaluatorId: null,
        overrideReason: null,
        finalScore: null,
        locked: false,
        lockedBy: null,
        lockedAt: null,
      });
      if (!finding || finding.status !== "answered" || !evidenceReference) {
        holdbacks.push({
          holdbackId: `${report.vendorName}-${criterion.criteriaId}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-"),
          vendorName: report.vendorName,
          criteriaId: criterion.criteriaId,
          severity: finding?.status === "weak" ? "holdback" : "blocker",
          reason:
            missing?.scoringImpact ??
            finding?.evaluatorHoldback ??
            `${criterion.description} lacks cited evidence.`,
          requiredEvidence:
            missing?.request ??
            `Provide cited evidence for ${criterion.description}.`,
        });
      }
    }
  }

  const readyVendorCount = reports.filter(
    (report) => report.scoreReadiness === "ready_to_score",
  ).length;
  return {
    sourceEventId: reports[0]?.sourceEventId ?? "unknown-source-event",
    tenantKey: reports[0]?.tenantKey ?? "unknown-tenant",
    generatedAt,
    criteria,
    scores,
    holdbacks,
    readyVendorCount,
    totalVendorCount: reports.length,
    nextAction:
      holdbacks.length > 0
        ? "Resolve score holdbacks before evaluator lock."
        : "Send first-pass scorecard to named evaluators for review.",
  };
}

export function buildSourceBafoLeverageOptimizer(
  reports: VendorResponseParseReport[],
  generatedAt = GENERATED_AT,
): SourceBafoLeverageOptimizer {
  const levers = topLevers(
    reports.flatMap((report) =>
      buildVendorLevers({
        vendorName: report.vendorName,
        rows: report.normalizationRows,
        findings: report.health.findings,
        annualRunRateUsd: annualRunRateFor(report),
      }),
    ),
    12,
  );
  const evidenced = levers.filter((lever) => lever.valueBasis === "evidenced");
  const low = sumNullable(evidenced.map((lever) => lever.expectedValueLowUsd));
  const high = sumNullable(
    evidenced.map((lever) => lever.expectedValueHighUsd),
  );
  return {
    sourceEventId: reports[0]?.sourceEventId ?? "unknown-source-event",
    tenantKey: reports[0]?.tenantKey ?? "unknown-tenant",
    generatedAt,
    levers,
    evidencedValueLowUsd: low,
    evidencedValueHighUsd: high,
    opportunityToTestCount: levers.filter(
      (lever) => lever.valueBasis === "opportunity_to_test",
    ).length,
    guardrail:
      "Only evidenced ranges may be carried as modeled value. Opportunity-to-test asks are negotiation pressure, not booked savings.",
    nextAction:
      levers.length > 0
        ? "Issue BAFO asks for P0 levers before score lock."
        : "No BAFO levers are ready until proposal evidence is parsed.",
  };
}

export function buildSourceExecutiveDecisionPack(
  scorecard: SourceFirstPassScorecard,
  optimizer: SourceBafoLeverageOptimizer,
): SourceExecutiveDecisionPack {
  const unresolvedRisks = scorecard.holdbacks
    .filter((holdback) => holdback.severity === "blocker")
    .slice(0, 8)
    .map(
      (holdback) =>
        `${holdback.vendorName}: ${holdback.reason} (${holdback.requiredEvidence})`,
    );
  const posture =
    unresolvedRisks.length > 0
      ? "hold_for_evidence"
      : optimizer.levers.length > 0
        ? "hold_for_bafo"
        : "ready_for_cxo_review";
  return {
    sourceEventId: scorecard.sourceEventId,
    tenantKey: scorecard.tenantKey,
    generatedAt: scorecard.generatedAt,
    posture,
    recommendation:
      posture === "ready_for_cxo_review"
        ? "Advance to CXO award review with evaluator-owned scoring."
        : posture === "hold_for_bafo"
          ? "Run BAFO before CXO award review so leverage is not left on the table."
          : "Hold executive decision until critical vendor evidence is complete.",
    decisionConditions: [
      ...scorecard.holdbacks
        .slice(0, 5)
        .map((holdback) => holdback.requiredEvidence),
      ...optimizer.levers.slice(0, 5).map((lever) => lever.negotiationAsk),
    ],
    evidenceUsed: unique([
      ...scorecard.scores
        .map((score) => score.evidenceReference)
        .filter((value): value is string => Boolean(value)),
      ...optimizer.levers.flatMap((lever) => lever.evidenceBasis),
    ]).slice(0, 12),
    unresolvedRisks,
    valueNarrative:
      optimizer.evidencedValueLowUsd !== null &&
      optimizer.evidencedValueHighUsd !== null
        ? `Evidenced BAFO leverage range: ${formatUsd(optimizer.evidencedValueLowUsd)} to ${formatUsd(optimizer.evidencedValueHighUsd)}.`
        : "No evidenced savings range is booked yet; leverage remains opportunity-to-test.",
    nextAction:
      posture === "ready_for_cxo_review"
        ? "Prepare award recommendation for sponsor review."
        : posture === "hold_for_bafo"
          ? "Close BAFO asks, then refresh scoring and decision conditions."
          : "Collect required evidence and rerun first-pass scoring.",
  };
}

export function buildSourceValueRealizationProofPlan(
  optimizer: SourceBafoLeverageOptimizer,
): SourceValueRealizationProofPlan {
  const trackedLevers = optimizer.levers.map((lever) => ({
    leverId: lever.leverId,
    vendorName: lever.vendorName,
    proofRequired:
      lever.valueBasis === "evidenced"
        ? "Awarded contract term, baseline, invoice actuals, and owner signoff."
        : "Vendor-priced BAFO response before any value can be booked.",
    baselineRequired:
      lever.valueBasis === "evidenced"
        ? "Current annual run-rate and committed contract delta."
        : "Baseline plus vendor commitment still missing.",
    ownerRole: lever.owner,
    cadence: (lever.leverType === "transition_risk" ||
    lever.leverType === "payment_milestones"
      ? "milestone"
      : "quarterly") as SourceValueProofLever["cadence"],
    valueBasis: lever.valueBasis,
  }));
  const missingProof = trackedLevers
    .filter((lever) => lever.valueBasis === "opportunity_to_test")
    .map(
      (lever) =>
        `${lever.vendorName}: ${lever.proofRequired} (${lever.ownerRole})`,
    );
  return {
    sourceEventId: optimizer.sourceEventId,
    tenantKey: optimizer.tenantKey,
    generatedAt: optimizer.generatedAt,
    proofState:
      trackedLevers.length === 0
        ? "not_ready"
        : missingProof.length > 0
          ? "needs_award_commitments"
          : "ready_to_track",
    trackedLevers,
    missingProof,
    bookedValueLowUsd: optimizer.evidencedValueLowUsd,
    bookedValueHighUsd: optimizer.evidencedValueHighUsd,
    guardrail:
      "Booked value requires awarded commercial commitment plus realized actuals. Proposal leverage alone is not realized savings.",
    nextAction:
      missingProof.length > 0
        ? "Convert opportunity-to-test levers into vendor-priced commitments."
        : "Track committed value against invoices and operational actuals.",
  };
}

function criterion(
  criteriaId: string,
  category: NormalizedCategory,
  description: string,
  weight: number,
  evaluatorRole: string,
): EvaluationCriterion {
  return {
    criteriaId,
    category,
    description,
    weight,
    scoringScale: "1-5",
    evaluatorRole,
    requiredEvidence: [category],
    scoringGuidance:
      "AI suggestion is a first pass. A named evaluator must set and lock the final score.",
    redFlags: ["missing evidence", "weak citation", "non-comparable answer"],
    approvedBy: "source-workflow-default",
    approvedAt: GENERATED_AT,
  };
}

function suggestedScoreFor(
  status: "answered" | "weak" | "missing" | undefined,
  evidenceReference: string | null,
): number | null {
  if (status === "answered" && evidenceReference) return 4;
  if (status === "weak" && evidenceReference) return 2;
  return null;
}

function rationaleFor(
  criterion: EvaluationCriterion,
  status: "answered" | "weak" | "missing" | undefined,
  evidenceReference: string | null,
): string | null {
  if (status === "answered" && evidenceReference) {
    return `${criterion.description} has cited vendor evidence. Evaluator must confirm quality before final scoring.`;
  }
  if (status === "weak" && evidenceReference) {
    return `${criterion.description} has cited but weak or non-comparable evidence. Treat as a holdback.`;
  }
  return `${criterion.description} lacks enough cited evidence for an AI score suggestion.`;
}

function annualRunRateFor(report: VendorResponseParseReport): number | null {
  const pricingText = report.normalizationRows
    .filter((row) => row.normalizedCategory === "pricing_structure")
    .map((row) => row.vendorResponseSummary)
    .join(" ");
  const match =
    pricingText.match(/year one run[- ]?rate\s+(\d{5,})/i) ??
    pricingText.match(/run[- ]?rate\s+\$?([\d,]{5,})/i);
  if (!match) return null;
  const parsed = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function sumNullable(values: Array<number | null>): number | null {
  const numbers = values.filter((value): value is number => value !== null);
  if (numbers.length === 0) return null;
  return numbers.reduce((sum, value) => sum + value, 0);
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) return false;
    seen.add(trimmed);
    return true;
  });
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

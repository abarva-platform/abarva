import type {
  VendorBafoInstructionPack,
  VendorChallengeIntelligence,
  VendorEvaluationDecisionView,
  VendorEvaluationRecommendation,
  VendorResponseProfile,
} from "./types";
import type { VendorResponseProfileSet } from "./mve-profile";

export type EvaluationBafoReadinessState =
  | "no_records"
  | "blocked"
  | "clarify_before_bafo"
  | "ready_for_evaluator_review";

export type EvaluationBafoVendorComparability =
  | "comparable"
  | "conditional"
  | "blocked";

export interface EvaluationBafoReceivedRow {
  vendorId: string;
  vendorName: string;
  packageStatus: "received" | "received_with_gaps" | "not_score_ready";
  sectionsAnswered: number;
  sectionsTotal: number;
  exhibitCount: number;
  extractionCardCount: number;
  readyForEvaluation: VendorResponseProfile["readyForEvaluation"];
  readyReason: string;
}

export interface EvaluationBafoComparableRow {
  vendorId: string;
  vendorName: string;
  comparability: EvaluationBafoVendorComparability;
  scorePosture: string;
  rationale: string;
  evidenceBasis: string[];
}

export interface EvaluationBafoPricingRow {
  vendorId: string;
  vendorName: string;
  comparability: EvaluationBafoVendorComparability;
  fiveYearTcoLabel: string;
  yearOneRunCostLabel: string;
  transitionCostLabel: string;
  oneTimeCostLabel: string;
  optionalCostLabel: string;
  pricingBasis: string;
  rationale: string;
}

export interface EvaluationBafoBlocker {
  blockerId: string;
  vendorId: string | null;
  vendorName: string;
  severity: "blocker" | "risk";
  label: string;
  detail: string;
  nextAction: string;
}

export interface EvaluationBafoReadinessView {
  state: EvaluationBafoReadinessState;
  headline: string;
  contextLine: string;
  archetypeLine: string;
  received: EvaluationBafoReceivedRow[];
  comparable: EvaluationBafoComparableRow[];
  pricing: EvaluationBafoPricingRow[];
  blockers: EvaluationBafoBlocker[];
  singleNextAction: string;
  guardrail: string;
}

export function buildEvaluationBafoReadinessView(args: {
  profileSet?: VendorResponseProfileSet | null;
  challengeIntelligence?: VendorChallengeIntelligence | null;
  bafoInstructionPack?: VendorBafoInstructionPack | null;
  decisionView?: VendorEvaluationDecisionView | null;
}): EvaluationBafoReadinessView {
  const profiles = args.profileSet?.profiles ?? [];
  if (profiles.length === 0) {
    return {
      state: "no_records",
      headline: "Evaluation / BAFO readiness is waiting on response records.",
      contextLine:
        "No normalized vendor response profiles are loaded for this event, so Source cannot compare vendors or prepare BAFO asks.",
      archetypeLine: "No archetype-specific response profile is available yet.",
      received: [],
      comparable: [],
      pricing: [],
      blockers: [
        {
          blockerId: "no-vendor-response-profiles",
          vendorId: null,
          vendorName: "All vendors",
          severity: "blocker",
          label: "Vendor response profiles missing",
          detail:
            "Source needs governed response, evidence, pricing, and scoring records before Evaluation can move toward BAFO.",
          nextAction:
            "Load normalized vendor response packages before comparing vendors.",
        },
      ],
      singleNextAction:
        "Load normalized vendor response packages before comparing vendors.",
      guardrail:
        "No ranking, benchmark, award posture, or BAFO claim is available until governed response records exist. This view does not select a winner.",
    };
  }

  const summariesByVendor = new Map(
    (args.decisionView?.vendorSummaries ?? []).map((summary) => [
      summary.vendorId,
      summary,
    ]),
  );
  const scoreRows = args.decisionView?.scorecardRows ?? [];
  const challengeByVendor = groupByVendor(
    args.challengeIntelligence?.challengeLog ?? [],
  );
  const instructionByVendor = new Map(
    (args.bafoInstructionPack?.vendorInstructions ?? []).map((instruction) => [
      instruction.vendorId,
      instruction,
    ]),
  );

  const received = profiles.map((profile) => buildReceivedRow(profile));
  const pricing = profiles.map((profile) => buildPricingRow(profile));
  const comparable = profiles.map((profile) => {
    const summary = summariesByVendor.get(profile.vendorId);
    const scoreEvidence = scoreRows
      .flatMap((row) =>
        row.scores
          .filter((score) => score.vendorId === profile.vendorId)
          .map((score) => score.evidenceLabel),
      )
      .filter(unique)
      .slice(0, 3);
    return buildComparableRow(profile, summary, scoreEvidence);
  });

  const blockers = profiles.flatMap((profile) =>
    buildVendorBlockers({
      profile,
      recommendation: summariesByVendor.get(profile.vendorId)?.recommendation,
      challenges: challengeByVendor.get(profile.vendorId) ?? [],
      mustResolveBeforeScoring:
        instructionByVendor.get(profile.vendorId)?.mustResolveBeforeScoring ??
        [],
      scoreRows,
    }),
  );
  const pricingBlockers = pricing
    .filter((row) => row.comparability === "blocked")
    .map((row) => ({
      blockerId: `${row.vendorId}:pricing-comparability`,
      vendorId: row.vendorId,
      vendorName: row.vendorName,
      severity: "blocker" as const,
      label: "Pricing comparison blocked",
      detail: row.rationale,
      nextAction: `Load a normalized pricing workbook for ${row.vendorName} with five-year TCO, year-one run cost, and pricing basis before comparison.`,
    }));
  const allBlockers = dedupeBlockers([...blockers, ...pricingBlockers]);

  const state = deriveState({
    blockers: allBlockers,
    comparable,
    hasDecisionView: Boolean(args.decisionView),
  });
  const vendorCount = profiles.length;
  const comparableCount = comparable.filter(
    (row) => row.comparability === "comparable",
  ).length;
  const pricingComparableCount = pricing.filter(
    (row) => row.comparability === "comparable",
  ).length;
  const blockedCount = comparable.filter(
    (row) => row.comparability === "blocked",
  ).length;

  return {
    state,
    headline: headlineForState(state, comparableCount, vendorCount),
    contextLine:
      `${vendorCount} vendor package${vendorCount === 1 ? "" : "s"} received; ` +
      `${comparableCount} comparable without caveat; ${pricingComparableCount} pricing reads comparable; ` +
      `${blockedCount} held from BAFO-ready scoring.`,
    archetypeLine: archetypeLine(args.profileSet),
    received,
    comparable,
    pricing,
    blockers: allBlockers,
    singleNextAction: nextActionFor({ blockers: allBlockers, state }),
    guardrail:
      "Deterministic read: this panel only summarizes governed response, pricing, evidence, scorecard, and BAFO-instruction records. It does not select a winner or create benchmark claims.",
  };
}

function buildReceivedRow(
  profile: VendorResponseProfile,
): EvaluationBafoReceivedRow {
  const sectionsAnswered = profile.sectionMap.filter(
    (section) => section.status === "complete",
  ).length;
  const sectionsTotal = profile.sectionMap.length;
  const hasGaps =
    profile.responseCompleteness.missingSections.length > 0 ||
    profile.unsupportedClaims.length > 0 ||
    profile.exhibits.some((exhibit) => exhibit.status !== "complete");
  const packageStatus =
    profile.readyForEvaluation === "no"
      ? "not_score_ready"
      : hasGaps
        ? "received_with_gaps"
        : "received";

  return {
    vendorId: profile.vendorId,
    vendorName: profile.vendorName,
    packageStatus,
    sectionsAnswered,
    sectionsTotal,
    exhibitCount: profile.exhibits.length,
    extractionCardCount: profile.extractionCards.length,
    readyForEvaluation: profile.readyForEvaluation,
    readyReason: profile.readyReason,
  };
}

function buildPricingRow(
  profile: VendorResponseProfile,
): EvaluationBafoPricingRow {
  const summary = profile.pricingSummary;
  const pricingBasis = summary.pricingBasis.trim() || "Not recorded";
  const missing: string[] = [];
  if (summary.fiveYearTcoUsd === null) missing.push("five-year TCO");
  if (summary.yearOneRunCostUsd === null) missing.push("year-one run cost");
  if (!summary.pricingBasis.trim()) missing.push("pricing basis");

  const comparability: EvaluationBafoVendorComparability =
    missing.length > 0
      ? "blocked"
      : /assumption|uncapped|indicative|unconfirmed|items are optional|optional items/i.test(
            pricingBasis,
          )
        ? "conditional"
        : "comparable";
  const basisSentence = stripTerminalPunctuation(pricingBasis).toLowerCase();

  return {
    vendorId: profile.vendorId,
    vendorName: profile.vendorName,
    comparability,
    fiveYearTcoLabel: moneyLabel(summary.fiveYearTcoUsd),
    yearOneRunCostLabel: moneyLabel(summary.yearOneRunCostUsd),
    transitionCostLabel: moneyLabel(summary.transitionCostUsd),
    oneTimeCostLabel: moneyLabel(summary.oneTimeCostUsd),
    optionalCostLabel: moneyLabel(summary.optionalCostUsd),
    pricingBasis,
    rationale:
      missing.length > 0
        ? `Missing ${joinList(missing)}; pricing comparison stays blocked until normalized pricing evidence is loaded.`
        : comparability === "conditional"
          ? `Pricing is present, but ${basisSentence} keeps the TCO read conditional until BAFO clarification.`
          : "Five-year TCO, year-one run cost, and pricing basis are present for comparison.",
  };
}

function buildComparableRow(
  profile: VendorResponseProfile,
  summary:
    | VendorEvaluationDecisionView["vendorSummaries"][number]
    | undefined,
  scoreEvidence: string[],
): EvaluationBafoComparableRow {
  const comparability = comparabilityFor(
    summary?.recommendation,
    profile.readyForEvaluation,
  );
  const basis = scoreEvidence.length
    ? scoreEvidence
    : profile.extractionCards
        .map((card) => card.evidenceReference)
        .filter((value): value is string => Boolean(value))
        .filter(unique)
        .slice(0, 3);

  return {
    vendorId: profile.vendorId,
    vendorName: profile.vendorName,
    comparability,
    scorePosture: summary
      ? `${summary.weightedScore.toFixed(1)}/10 advisory score; ${labelRecommendation(summary.recommendation)}`
      : "No scorecard view available",
    rationale:
      summary?.decisionRationale ??
      `${profile.readyReason} Scorecard posture is not available yet.`,
    evidenceBasis: basis,
  };
}

function buildVendorBlockers(args: {
  profile: VendorResponseProfile;
  recommendation?: VendorEvaluationRecommendation;
  challenges: NonNullable<VendorChallengeIntelligence["challengeLog"]>;
  mustResolveBeforeScoring: string[];
  scoreRows: VendorEvaluationDecisionView["scorecardRows"];
}): EvaluationBafoBlocker[] {
  const blockers: EvaluationBafoBlocker[] = [];
  const missingSections = args.profile.responseCompleteness.missingSections;

  for (const section of missingSections.slice(0, 3)) {
    blockers.push({
      blockerId: `${args.profile.vendorId}:missing-section:${section}`,
      vendorId: args.profile.vendorId,
      vendorName: args.profile.vendorName,
      severity: "blocker",
      label: "Missing response section",
      detail: section,
      nextAction: `Request ${section} from ${args.profile.vendorName}.`,
    });
  }

  for (const claim of args.profile.unsupportedClaims.slice(0, 3)) {
    blockers.push({
      blockerId: `${args.profile.vendorId}:unsupported:${claim}`,
      vendorId: args.profile.vendorId,
      vendorName: args.profile.vendorName,
      severity: "risk",
      label: "Unsupported claim",
      detail: claim,
      nextAction:
        args.profile.clarificationQuestions[0] ??
        "Request cited evidence before scoring the claim.",
    });
  }

  for (const challenge of args.challenges
    .filter((item) => item.severity === "high")
    .slice(0, 3)) {
    blockers.push({
      blockerId: challenge.challengeId,
      vendorId: args.profile.vendorId,
      vendorName: args.profile.vendorName,
      severity: "blocker",
      label: challenge.issueCategory.replaceAll("_", " "),
      detail: challenge.finding,
      nextAction: challenge.clarificationQuestion,
    });
  }

  for (const condition of args.mustResolveBeforeScoring.slice(0, 3)) {
    blockers.push({
      blockerId: `${args.profile.vendorId}:must-resolve:${condition}`,
      vendorId: args.profile.vendorId,
      vendorName: args.profile.vendorName,
      severity: "blocker",
      label: "Must-resolve BAFO condition",
      detail: condition,
      nextAction: condition,
    });
  }

  for (const row of args.scoreRows) {
    const score = row.scores.find(
      (candidate) => candidate.vendorId === args.profile.vendorId,
    );
    if (!score || score.scoreEligibility === "scoreable") continue;
    blockers.push({
      blockerId: `${args.profile.vendorId}:score:${row.criterionId}`,
      vendorId: args.profile.vendorId,
      vendorName: args.profile.vendorName,
      severity:
        score.scoreEligibility === "not_scoreable" ? "blocker" : "risk",
      label: `${row.label}: ${score.scoreReadinessLabel}`,
      detail: score.rationale,
      nextAction: score.scoreReadinessAction,
    });
  }

  if (
    blockers.length === 0 &&
    args.recommendation === "hold_until_clarified"
  ) {
    blockers.push({
      blockerId: `${args.profile.vendorId}:held-without-specific-condition`,
      vendorId: args.profile.vendorId,
      vendorName: args.profile.vendorName,
      severity: "blocker",
      label: "Held from BAFO-ready scoring",
      detail:
        "The evaluation recommendation is hold, but no specific blocker was available in the decision-support records.",
      nextAction:
        "Review parsed response records and add cited conditions before moving to BAFO.",
    });
  }

  return dedupeBlockers(blockers);
}

function deriveState(args: {
  blockers: EvaluationBafoBlocker[];
  comparable: EvaluationBafoComparableRow[];
  hasDecisionView: boolean;
}): EvaluationBafoReadinessState {
  if (
    args.blockers.some((blocker) => blocker.severity === "blocker") ||
    args.comparable.some((row) => row.comparability === "blocked")
  ) {
    return "blocked";
  }
  if (
    !args.hasDecisionView ||
    args.blockers.length > 0 ||
    args.comparable.some((row) => row.comparability === "conditional")
  ) {
    return "clarify_before_bafo";
  }
  return "ready_for_evaluator_review";
}

function nextActionFor(args: {
  blockers: EvaluationBafoBlocker[];
  state: EvaluationBafoReadinessState;
}): string {
  const blocker =
    args.blockers.find((item) => item.severity === "blocker") ??
    args.blockers[0];
  if (blocker) return blocker.nextAction;
  if (args.state === "clarify_before_bafo") {
    return "Complete the scorecard and BAFO clarification pack before advancing.";
  }
  if (args.state === "ready_for_evaluator_review") {
    return "Schedule named evaluator review; do not dispatch BAFO or award without human approval.";
  }
  return "Load normalized vendor response packages before comparing vendors.";
}

function comparabilityFor(
  recommendation: VendorEvaluationRecommendation | undefined,
  readyForEvaluation: VendorResponseProfile["readyForEvaluation"],
): EvaluationBafoVendorComparability {
  if (recommendation === "hold_until_clarified" || readyForEvaluation === "no") {
    return "blocked";
  }
  if (
    recommendation === "advance_with_conditions" ||
    readyForEvaluation === "conditional" ||
    !recommendation
  ) {
    return "conditional";
  }
  return "comparable";
}

function headlineForState(
  state: EvaluationBafoReadinessState,
  comparableCount: number,
  vendorCount: number,
): string {
  if (state === "blocked") {
    return "Evaluation is not BAFO-ready; evidence blockers remain.";
  }
  if (state === "clarify_before_bafo") {
    return "Evaluation can continue only as a conditional BAFO-prep read.";
  }
  if (state === "ready_for_evaluator_review") {
    return `${comparableCount}/${vendorCount} vendors are ready for named evaluator review.`;
  }
  return "Evaluation / BAFO readiness is waiting on response records.";
}

function archetypeLine(
  profileSet?: VendorResponseProfileSet | null,
): string {
  if (!profileSet) return "No archetype-specific response profile is available yet.";
  return `${profileSet.eventName} uses the current governed response profile set; comparisons stay inside that event profile.`;
}

function labelRecommendation(
  recommendation: VendorEvaluationRecommendation,
): string {
  if (recommendation === "advance_to_bafo") return "advance to BAFO";
  if (recommendation === "advance_with_conditions") {
    return "advance with conditions";
  }
  return "hold until clarified";
}

function groupByVendor<T extends { vendorId: string }>(
  rows: readonly T[],
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    grouped.set(row.vendorId, [...(grouped.get(row.vendorId) ?? []), row]);
  }
  return grouped;
}

function dedupeBlockers(
  blockers: EvaluationBafoBlocker[],
): EvaluationBafoBlocker[] {
  const seen = new Set<string>();
  return blockers.filter((blocker) => {
    const key = [
      blocker.vendorId,
      blocker.label,
      blocker.detail,
      blocker.nextAction,
    ].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function unique<T>(value: T, index: number, array: T[]): boolean {
  return array.indexOf(value) === index;
}

function moneyLabel(value: number | null): string {
  if (value === null) return "Not recorded";
  const millions = value / 1_000_000;
  const formatted =
    Math.abs(millions) >= 10
      ? millions.toFixed(1)
      : millions.toFixed(1);
  return `$${formatted}M`;
}

function joinList(values: string[]): string {
  if (values.length <= 1) return values[0] ?? "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
}

function stripTerminalPunctuation(value: string): string {
  return value.replace(/[.!?]+$/g, "");
}

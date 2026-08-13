/**
 * The decision agenda for the Responses stage.
 *
 * The stage already produces challenges, leverage seeds and BAFO questions,
 * but the brief above them reported activity counts ("8 challenges found",
 * "9 decision view") and flat lists of file locators. Neither tells a buyer
 * which item to act on first, what it is worth, or what it blocks.
 *
 * This builder joins the three models the stage already computes into one
 * ranked agenda. It adds no data: every field is carried through from a
 * challenge, a leverage seed, or a BAFO question, with the evidence label the
 * source model already attached.
 */

import type {
  CommercialLeverageSeed,
  VendorBafoInstructionPack,
  VendorBafoQuestion,
  VendorChallengeIntelligence,
  VendorChallengeLogEntry,
} from "./proposal-intelligence";

export type DecisionAgendaSeverity = "high" | "medium" | "low";

export interface DecisionAgendaItem {
  key: string;
  vendorName: string;
  /** What the review found. */
  finding: string;
  /** What it is worth, in the source model's own words. Null when not quantified. */
  worth: string | null;
  /** What it holds back if it stays open. */
  blocks: string;
  /** The ask to put to the vendor before scoring hardens. */
  ask: string;
  /** Evidence locator carried from the source model. */
  evidence: string | null;
  severity: DecisionAgendaSeverity;
  /** True when the item must be resolved before a score can be given. */
  blocksScoring: boolean;
  /** Whether the commercial impact is evidence-backed or only worth testing. */
  impactConfidence: DecisionAgendaSeverity | null;
}

export interface DecisionAgenda {
  items: DecisionAgendaItem[];
  /** Every item, before any display cap. */
  totalCount: number;
  blocksScoringCount: number;
  leverageOnlyCount: number;
  /** Leverage that is evidence-backed rather than a hypothesis to test. */
  evidencedImpactCount: number;
  testOnlyImpactCount: number;
}

const SEVERITY_RANK: Record<DecisionAgendaSeverity, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function severityOf(
  challenge?: VendorChallengeLogEntry,
  question?: VendorBafoQuestion,
): DecisionAgendaSeverity {
  if (challenge) return challenge.severity;
  return question?.priority === "must_resolve" ? "high" : "medium";
}

function itemFromQuestion(
  question: VendorBafoQuestion,
  challengeById: Map<string, VendorChallengeLogEntry>,
  seedById: Map<string, CommercialLeverageSeed>,
): DecisionAgendaItem {
  const challenge = challengeById.get(question.sourceChallengeId);
  const seed = seedById.get(question.sourceLeverageSeedId);

  return {
    key: question.questionId,
    vendorName: question.vendorName,
    finding: challenge?.finding ?? seed?.finding ?? question.question,
    worth: seed?.estimatedImpact ?? null,
    blocks:
      question.scoringDisposition ||
      challenge?.scoringImplication ||
      question.buyerRisk,
    ask: seed?.recommendedAsk ?? question.question,
    evidence: question.evidenceLabel || challenge?.evidenceLabel || null,
    severity: severityOf(challenge, question),
    blocksScoring: question.priority === "must_resolve",
    impactConfidence: seed?.confidence ?? null,
  };
}

function itemFromChallenge(
  challenge: VendorChallengeLogEntry,
  seedByVendor: Map<string, CommercialLeverageSeed>,
): DecisionAgendaItem {
  const seed = seedByVendor.get(challenge.vendorId);
  return {
    key: challenge.challengeId,
    vendorName: challenge.vendorName,
    finding: challenge.finding,
    worth: seed?.estimatedImpact ?? null,
    blocks: challenge.scoringImplication || challenge.whyItMatters,
    ask: challenge.clarificationQuestion,
    evidence: challenge.evidenceLabel || null,
    severity: challenge.severity,
    // Without a BAFO pack the only honest signal is the challenge's own
    // evaluation readiness: "no" means a score cannot be given yet.
    blocksScoring: challenge.readyForEvaluation === "no",
    impactConfidence: seed?.confidence ?? null,
  };
}

function rank(a: DecisionAgendaItem, b: DecisionAgendaItem): number {
  if (a.blocksScoring !== b.blocksScoring) return a.blocksScoring ? -1 : 1;
  const bySeverity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
  if (bySeverity !== 0) return bySeverity;
  // Quantified items outrank unquantified ones at equal severity.
  if (Boolean(a.worth) !== Boolean(b.worth)) return a.worth ? -1 : 1;
  return a.vendorName.localeCompare(b.vendorName);
}

export function buildResponseDecisionAgenda(
  challengeIntelligence?: VendorChallengeIntelligence | null,
  bafoInstructionPack?: VendorBafoInstructionPack | null,
): DecisionAgenda {
  const challengeLog = challengeIntelligence?.challengeLog ?? [];
  const seeds = challengeIntelligence?.leverageSeeds ?? [];
  const challengeById = new Map(
    challengeLog.map((challenge) => [challenge.challengeId, challenge]),
  );
  const seedById = new Map(seeds.map((seed) => [seed.seedId, seed]));
  const seedByVendor = new Map(seeds.map((seed) => [seed.vendorId, seed]));

  const questions =
    bafoInstructionPack?.vendorInstructions.flatMap(
      (instruction) => instruction.questions,
    ) ?? [];

  // BAFO questions are the actionable unit and carry the scoring disposition,
  // so prefer them. Fall back to the challenge log when no pack exists yet.
  const items =
    questions.length > 0
      ? questions.map((question) =>
          itemFromQuestion(question, challengeById, seedById),
        )
      : challengeLog.map((challenge) =>
          itemFromChallenge(challenge, seedByVendor),
        );

  items.sort(rank);

  return {
    items,
    totalCount: items.length,
    blocksScoringCount: items.filter((item) => item.blocksScoring).length,
    leverageOnlyCount: items.filter((item) => !item.blocksScoring).length,
    evidencedImpactCount: seeds.filter((seed) => seed.confidence === "high")
      .length,
    testOnlyImpactCount: seeds.filter((seed) => seed.confidence !== "high")
      .length,
  };
}

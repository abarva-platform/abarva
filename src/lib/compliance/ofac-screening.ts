export type OfacScreeningStatus =
  | "clear"
  | "possible_match"
  | "blocked"
  | "manual_review_required";

export interface OfacScreeningSubject {
  readonly customerName: string;
  readonly aliases: readonly string[];
  readonly country: string | null;
}

export interface OfacWatchlistHit {
  readonly listName: "OFAC SDN" | "OFAC Non-SDN" | "Other sanctions list";
  readonly matchedName: string;
  readonly score: number;
  readonly program: string | null;
  readonly sourceUrl: string;
}

export interface OfacScreeningInput {
  readonly subject: OfacScreeningSubject;
  readonly hits: readonly OfacWatchlistHit[];
  readonly screenedAt: string;
  readonly screenedBy: "manual" | "api" | "batch";
}

export interface OfacScreeningDecision {
  readonly status: OfacScreeningStatus;
  readonly customerName: string;
  readonly canProceed: boolean;
  readonly requiresManualReview: boolean;
  readonly reason: string;
  readonly evidenceRequired: readonly string[];
  readonly highestScore: number;
}

const BLOCK_SCORE = 0.95;
const REVIEW_SCORE = 0.82;

export function evaluateOfacScreening(
  input: OfacScreeningInput,
): OfacScreeningDecision {
  const sortedHits = [...input.hits].sort((a, b) => b.score - a.score);
  const topHit = sortedHits[0] ?? null;
  const highestScore = topHit?.score ?? 0;

  if (!topHit) {
    return {
      status: "clear",
      customerName: input.subject.customerName,
      canProceed: true,
      requiresManualReview: false,
      reason: "No sanctions-screening hits were returned for the customer or aliases.",
      evidenceRequired: [
        "screened_at",
        "screened_by",
        "customer_name",
        "alias_list",
        "watchlist_source_version",
      ],
      highestScore,
    };
  }

  if (highestScore >= BLOCK_SCORE) {
    return {
      status: "blocked",
      customerName: input.subject.customerName,
      canProceed: false,
      requiresManualReview: true,
      reason: `${topHit.listName} match ${topHit.matchedName} scored ${highestScore}; do not proceed until counsel/compliance clears.`,
      evidenceRequired: [
        "screened_at",
        "screened_by",
        "customer_name",
        "alias_list",
        "matched_name",
        "match_score",
        "source_url",
        "compliance_clearance",
      ],
      highestScore,
    };
  }

  if (highestScore >= REVIEW_SCORE) {
    return {
      status: "possible_match",
      customerName: input.subject.customerName,
      canProceed: false,
      requiresManualReview: true,
      reason: `${topHit.listName} possible match ${topHit.matchedName} scored ${highestScore}; manual review required before onboarding.`,
      evidenceRequired: [
        "screened_at",
        "screened_by",
        "customer_name",
        "alias_list",
        "matched_name",
        "match_score",
        "source_url",
        "manual_review_disposition",
      ],
      highestScore,
    };
  }

  return {
    status: "manual_review_required",
    customerName: input.subject.customerName,
    canProceed: false,
    requiresManualReview: true,
    reason: `Low-confidence sanctions hit scored ${highestScore}; record manual review before proceeding.`,
    evidenceRequired: [
      "screened_at",
      "screened_by",
      "customer_name",
      "alias_list",
      "watchlist_source_version",
      "manual_review_disposition",
    ],
    highestScore,
  };
}

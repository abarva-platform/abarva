/**
 * Evidence-derived scoring for the vendor evaluation scorecard.
 *
 * Scores used to be returned from hardcoded branches on the vendor identity
 * string (`vendorId.includes("specialist") ? 8.8 : ...`) while the scorecard
 * rendered an evidence citation beside the number. The citation pointed at a
 * document that had no part in producing the score, and any vendor whose id
 * did not match a known branch fell to a single default — so two comparable
 * bidders scored identically no matter what their proposals said.
 *
 * Every score now derives from the parsed evidence the criterion cites: the
 * extraction cards of that type, the structured exhibit behind them, and the
 * response section map. The rationale states the drivers that moved the score,
 * so a score can be defended line by line in an evaluation challenge.
 *
 * Where a criterion has no parsed evidence at all, the score is withheld
 * rather than defaulted. A missing exhibit the vendor was asked for is a low
 * score; nothing to read is not a score.
 */

import type {
  VendorExtractionCard,
  VendorExtractionCardType,
  VendorResponseExhibitKind,
  VendorResponseProfile,
} from "./types";

export type ScoreConfidence = "high" | "medium" | "low";

export interface CriterionEvidenceSpec {
  /** Extraction card types that evidence this criterion. */
  cardTypes: VendorExtractionCardType[];
  /** Structured exhibits that evidence this criterion. */
  exhibitKinds: VendorResponseExhibitKind[];
  /** Response section map rows that evidence this criterion. */
  sectionPattern?: RegExp;
  /** Keywords used to attribute an unsupported claim to this criterion. */
  claimPattern?: RegExp;
  /**
   * Comparative cost input. When present the score is adjusted by the vendor's
   * position against peers on this measure, lower being better.
   */
  costBasis?: (profile: VendorResponseProfile) => number | null;
}

export interface EvidenceDerivedScore {
  /** False when there is nothing parsed to judge. The score is then withheld. */
  scorable: boolean;
  score: number;
  confidence: ScoreConfidence;
  rationale: string;
  evidenceLabel: string | null;
  /** The individual signals that moved the score, in applied order. */
  drivers: string[];
}

const NEUTRAL = 5;
const MIN_SCORE = 0;
const MAX_SCORE = 10;

function clamp(value: number): number {
  return Math.min(MAX_SCORE, Math.max(MIN_SCORE, value));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function cardsFor(
  profile: VendorResponseProfile,
  spec: CriterionEvidenceSpec,
): VendorExtractionCard[] {
  if (spec.cardTypes.length === 0) return profile.extractionCards;
  return profile.extractionCards.filter((card) =>
    spec.cardTypes.includes(card.type),
  );
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Score one criterion for one vendor from that criterion's own evidence.
 *
 * `peerCosts` carries the same cost measure for every vendor in the event, so
 * comparative criteria can place a vendor against the field. It is ignored
 * when the spec has no cost basis.
 */
export function scoreCriterionFromEvidence(
  profile: VendorResponseProfile,
  spec: CriterionEvidenceSpec,
  peerCosts: number[] = [],
): EvidenceDerivedScore {
  const cards = cardsFor(profile, spec);
  const exhibits = profile.exhibits.filter((exhibit) =>
    spec.exhibitKinds.includes(exhibit.kind),
  );
  const sections = spec.sectionPattern
    ? profile.sectionMap.filter((row) =>
        spec.sectionPattern?.test(row.rfpSection),
      )
    : [];

  if (cards.length === 0 && exhibits.length === 0 && sections.length === 0) {
    return {
      scorable: false,
      score: 0,
      confidence: "low",
      rationale:
        "No parsed evidence for this criterion, so the score is withheld rather than assumed.",
      evidenceLabel: null,
      drivers: ["no_evidence"],
    };
  }

  const drivers: string[] = [];
  let score = NEUTRAL;

  // 1. Structured exhibit — the strongest single signal.
  for (const exhibit of exhibits) {
    if (exhibit.status === "complete") {
      score += 2;
      drivers.push(`${exhibit.label}: complete`);
    } else if (exhibit.status === "partial") {
      score += 0.4;
      drivers.push(`${exhibit.label}: partial`);
    } else {
      score -= 2.2;
      drivers.push(`${exhibit.label}: missing`);
    }
    if (exhibit.issue) {
      score -= 0.4;
      drivers.push(`issue noted: ${exhibit.issue}`);
    }
  }
  if (exhibits.length === 0 && spec.exhibitKinds.length > 0) {
    score -= 1;
    drivers.push("no structured exhibit for this criterion");
  }

  // 2. Extraction card confidence and structured backing.
  if (cards.length > 0) {
    const confidenceDelta = average(
      cards.map((card) =>
        card.confidence === "high"
          ? 1.2
          : card.confidence === "medium"
            ? 0.2
            : -0.8,
      ),
    );
    score += confidenceDelta;
    drivers.push(
      `${cards.length} cited extraction card(s), ${describeCardConfidence(cards)}`,
    );

    const backingDelta = average(
      cards.map((card) =>
        card.structuredExhibitStatus === "supported"
          ? 1
          : card.structuredExhibitStatus === "partial"
            ? 0
            : -0.8,
      ),
    );
    score += backingDelta;

    const missingFields = cards.flatMap((card) => card.missingFields);
    if (missingFields.length > 0) {
      const penalty = Math.min(1.4, missingFields.length * 0.35);
      score -= penalty;
      drivers.push(
        `${missingFields.length} field(s) still missing: ${missingFields.slice(0, 3).join(", ")}`,
      );
    }
  }

  // 3. Unsupported claims attributed to this criterion.
  if (spec.claimPattern) {
    const claims = profile.unsupportedClaims.filter((claim) =>
      spec.claimPattern?.test(claim),
    );
    if (claims.length > 0) {
      const penalty = Math.min(1.4, claims.length * 0.7);
      score -= penalty;
      drivers.push(`${claims.length} unsupported claim(s) in this area`);
    }
  }

  // 4. Response section map.
  if (sections.length > 0) {
    const sectionDelta = average(
      sections.map((row) =>
        row.status === "complete" ? 0.4 : row.status === "partial" ? 0 : -1,
      ),
    );
    score += sectionDelta;
    if (sections.some((row) => row.status === "missing")) {
      drivers.push("a required response section is missing");
    }
  }

  // 5. Comparative cost position, for criteria that have one.
  if (spec.costBasis) {
    const own = spec.costBasis(profile);
    const peers = peerCosts.filter((value) => Number.isFinite(value));
    if (own !== null && Number.isFinite(own) && peers.length > 1) {
      const min = Math.min(...peers);
      const max = Math.max(...peers);
      if (max > min) {
        // Lowest cost gains the full band, highest loses it.
        const position = (own - min) / (max - min);
        const delta = 1.5 - position * 3;
        score += delta;
        drivers.push(
          delta >= 0
            ? "cost position is favourable against the field"
            : "cost position is unfavourable against the field",
        );
      }
    } else if (own === null) {
      score -= 0.5;
      drivers.push("no comparable cost figure provided");
    }
  }

  const evidenceLabel =
    cards.find((card) => card.evidenceReference)?.evidenceReference ??
    exhibits.find((exhibit) => exhibit.evidenceReference)?.evidenceReference ??
    sections[0]?.responseReference ??
    null;

  return {
    scorable: true,
    score: round1(clamp(score)),
    confidence: confidenceFor(cards, exhibits),
    rationale: buildRationale(drivers),
    evidenceLabel,
    drivers,
  };
}

function describeCardConfidence(cards: VendorExtractionCard[]): string {
  const high = cards.filter((card) => card.confidence === "high").length;
  const low = cards.filter((card) => card.confidence === "low").length;
  if (high === cards.length) return "all at high confidence";
  if (low === cards.length) return "all at low confidence";
  return `${high} at high confidence`;
}

function confidenceFor(
  cards: VendorExtractionCard[],
  exhibits: VendorResponseProfile["exhibits"],
): ScoreConfidence {
  const hasCompleteExhibit = exhibits.some(
    (exhibit) => exhibit.status === "complete",
  );
  const hasHighCard = cards.some((card) => card.confidence === "high");
  if (hasCompleteExhibit && hasHighCard) return "high";
  if (cards.length === 0) return "low";
  if (exhibits.some((exhibit) => exhibit.status === "missing")) return "low";
  return "medium";
}

function buildRationale(drivers: string[]): string {
  if (drivers.length === 0) return "Scored from parsed evidence.";
  const sentence = drivers.slice(0, 3).join("; ");
  return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`;
}

/**
 * Weighted total across scored criteria only. An unscorable criterion is
 * excluded and its weight is renormalized across the rest, so a vendor is
 * never penalized as if they had scored zero on something we could not read.
 */
export function weightedScoreOverScorable(
  entries: Array<{ weight: number; score: number; scorable: boolean }>,
): number {
  const scored = entries.filter((entry) => entry.scorable);
  const totalWeight = scored.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight === 0) return 0;
  const total = scored.reduce(
    (sum, entry) => sum + entry.score * (entry.weight / totalWeight),
    0,
  );
  return round1(total);
}

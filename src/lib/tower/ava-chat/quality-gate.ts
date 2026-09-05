// Tower aVa chat — post-hoc answer quality gate.
//
// Tower's read models own values and Claude owns narrative. The detective
// half of that rule lives here: an answer may only state a figure the
// deterministic packet already published, may only call value realized when
// the claim allows it, and may never say Tower certifies anything.

import {
  textMentionsAny,
  type AvaModuleQualityGateResult,
} from "@/lib/agent/module-expert-contract";
import { normalizeTowerAvaFigureFingerprints, permittedFigures } from "./packet";
import type {
  TowerAvaAnswerMode,
  TowerAvaChatPacket,
  TowerAvaQualityCheckId,
} from "./types";

export type TowerAvaQualityGateResult =
  AvaModuleQualityGateResult<TowerAvaQualityCheckId>;

/** Money, percentages, and bare figures a reader would take as a measurement. */
const FIGURE_RE = /\$?\d[\d,]*(?:\.\d+)?\s?(?:%|k|m|bn|b)?/gi;
const WORD_FIGURE_RE =
  /\b(?:(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)(?:[-\s](one|two|three|four|five|six|seven|eight|nine))?|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)\s+(percent|per cent|dollars?|million|billion|thousand)\b/gi;

const WORD_NUMBER_VALUES: Readonly<Record<string, number>> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

const REALIZED_VALUE_TERMS = [
  "realized",
  "realised",
  "value delivered",
  "banked",
  "captured value",
  "proven value",
];

const CERTIFICATION_TERMS = [
  "tower certifies",
  "tower has certified",
  "tower confirms the value",
  "certified by tower",
];

const BOUNDARY_TERMS = [
  "needs confirmation",
  "not yet",
  "blocked",
  "missing",
  "gap",
  "unproven",
  "cannot confirm",
];

const BANNED_INTERNAL_TERMS = [
  "contextpack",
  "read model",
  "read-model",
  "projection status",
  "metric record",
  "value record",
  "claim gate",
  "raw json",
  "packet",
];

function wordFigureToNumeric(match: string): string | null {
  const parts = match.toLowerCase().replace(/-/g, " ").split(/\s+/);
  const unit = parts.at(-1);
  if (!unit) return null;
  const numberWords =
    unit === "cent" && parts.at(-2) === "per" ? parts.slice(0, -2) : parts.slice(0, -1);
  const value = numberWords.reduce((sum, word) => {
    const part = WORD_NUMBER_VALUES[word];
    return part === undefined ? Number.NaN : sum + part;
  }, 0);
  if (!Number.isFinite(value)) return null;
  if (unit === "percent" || unit === "cent") return `${value} percent`;
  return `${value} ${unit}`;
}

function statedFigureFingerprintGroups(answerText: string): string[][] {
  const digitFingerprints = (answerText.match(FIGURE_RE) ?? []).map(
    normalizeTowerAvaFigureFingerprints,
  );
  const wordFingerprints = [...answerText.matchAll(WORD_FIGURE_RE)].map(
    (match) => {
      const numeric = wordFigureToNumeric(match[0]);
      return numeric ? normalizeTowerAvaFigureFingerprints(numeric) : [];
    },
  );
  return [...digitFingerprints, ...wordFingerprints].filter(
    (fingerprints) => fingerprints.length > 0,
  );
}

/**
 * Every figure in the answer must be traceable to something the deterministic
 * layer published. Packet prose (labels, caveats, gap text) counts, because
 * aVa may legitimately quote it.
 */
function figuresAreSupported(
  answerText: string,
  packet: TowerAvaChatPacket,
): boolean {
  const stated = statedFigureFingerprintGroups(answerText);
  if (stated.length === 0) return true;

  const supportedFigures = new Set(permittedFigures(packet));

  return stated.every((fingerprints) =>
    fingerprints.some((figure) => supportedFigures.has(figure)),
  );
}

export function runTowerAvaQualityGate(
  answerText: string,
  packet: TowerAvaChatPacket,
  mode: TowerAvaAnswerMode,
): TowerAvaQualityGateResult {
  const trimmed = (answerText ?? "").trim();

  const noUnsupportedNumber = figuresAreSupported(trimmed, packet);

  const realizedAllowedAnywhere = packet.valueClaims.some(
    (claim) => claim.realizedValueLanguageAllowed,
  );
  const noRealizedOverclaim =
    realizedAllowedAnywhere || !textMentionsAny(trimmed, REALIZED_VALUE_TERMS);

  const noCertificationClaim = !textMentionsAny(trimmed, CERTIFICATION_TERMS);

  // Only demanded when the packet actually carries a limit worth naming.
  const boundaryRequired =
    packet.blockedValueClaims.length > 0 ||
    packet.evidenceGaps.length > 0 ||
    packet.withheldMetricLabels.length > 0;
  const namesEvidenceBoundary =
    mode === "out_of_scope_redirect" ||
    !boundaryRequired ||
    textMentionsAny(trimmed, BOUNDARY_TERMS);

  const noBannedInternalLanguage = !textMentionsAny(
    trimmed,
    BANNED_INTERNAL_TERMS,
  );

  const checks: Record<TowerAvaQualityCheckId, boolean> = {
    no_unsupported_number: noUnsupportedNumber,
    no_realized_value_overclaim: noRealizedOverclaim,
    no_certification_claim: noCertificationClaim,
    names_evidence_boundary: namesEvidenceBoundary,
    no_banned_internal_language: noBannedInternalLanguage,
  };

  const failedChecks = (
    Object.keys(checks) as TowerAvaQualityCheckId[]
  ).filter((id) => !checks[id]);

  const repairInstructions: string[] = [];
  if (!noUnsupportedNumber) {
    repairInstructions.push(
      "Remove any figure that was not published in this turn's Tower context. Describe the direction or status in words instead of stating a number.",
    );
  }
  if (!noRealizedOverclaim) {
    repairInstructions.push(
      "No value claim in this turn permits realized-value language. Describe the value as forecast or unproven and name the evidence still required.",
    );
  }
  if (!noCertificationClaim) {
    repairInstructions.push(
      "Tower tracks value evidence; the accountable owner or Finance certifies it. Restate without claiming Tower certifies.",
    );
  }
  if (!namesEvidenceBoundary) {
    repairInstructions.push(
      "This turn carries blocked claims, withheld metrics, or evidence gaps. Name that limit plainly rather than answering as if the picture were complete.",
    );
  }
  if (!noBannedInternalLanguage) {
    repairInstructions.push(
      "Remove internal implementation language and describe the business meaning instead.",
    );
  }

  return {
    pass: failedChecks.length === 0,
    checks,
    failedChecks,
    repairInstructions,
  };
}

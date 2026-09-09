import {
  CONSULTING_GRADE_MIN_SCORE,
  CONSULTING_GRADE_STANDARD_ID,
  buildConsultingGradeCompactRetryPrompt,
  buildMalformedConsultingGradeReview,
  buildConsultingGradeReviewPrompt,
  buildConsultingGradeRewritePrompt,
  parseConsultingGradeReviewJson,
  summarizeConsultingGradeReview,
  type ConsultingGradeReview,
} from "@/lib/deliverables/quality/consulting-grade-rubric";
import {
  formatD09RfpEvidenceCoverage,
  resolveGenerationEvidenceState,
} from "./prompt-registry";
import type { SourceGenerationContext } from "./types";
import { getSourceArtifactProfile } from "@/lib/source/documentation-standards/source-artifact-profiles";

// Two artifact-code vocabularies exist in Source: `source-artifact-profiles.ts`
// keys profiles by short code ("d01"), while the generation pipeline and this
// gate key by the long canonical code ("d01_strategy_memo"). Every long code
// is `<shortCode>_<slug>`, so splitting on the first underscore recovers the
// short code without a second lookup table. Do not assume the two vocabularies
// are otherwise interchangeable — see artifact-governance.ts's header comment
// for the third (approval-state) vocabulary this doesn't touch.
export function shortSourceArtifactCode(artifactCode: string): string {
  return artifactCode.split("_")[0] ?? artifactCode;
}

// The consulting-grade gate was originally RFP-only. The artifact-aware context
// below now supports the high-stakes narrative/decision/vendor-pack artifacts
// this rubric was written for, with D09-specific evidence coverage scoped to
// D09 only.
export const SOURCE_CONSULTING_GRADE_GATE_CODES = new Set([
  "d09_rfp_pack",
  "d01_strategy_memo",
  "d02_value_target",
  "d05_scope_memo",
  "d24_decision_brief",
  "d27_selection_memo",
]);

export interface SourceArtifactQualityGateMetadata {
  required: boolean;
  standardId: typeof CONSULTING_GRADE_STANDARD_ID;
  minRequiredScore: typeof CONSULTING_GRADE_MIN_SCORE;
  passed: boolean;
  rewriteAttempted: boolean;
  attempts: number;
  finalSummary: string;
  reviews: ConsultingGradeReview[];
}

export interface DeterministicSourceClaimViolation {
  claim: string;
  reason: string;
}

const DETERMINISTIC_CLAIM_GATE_CODES = new Set([
  "d01_strategy_memo",
  "d02_value_target",
]);

/**
 * Deterministic backstop for the artifacts that establish the event's
 * commercial narrative. Model review remains useful for judgment, but it
 * cannot waive an unbound percentage, dollar amount, date, duration,
 * benchmark, market assertion, or leaked internal identifier.
 */
export function findDeterministicSourceClaimViolations(args: {
  artifactCode: string;
  body: string;
  sourceContext: string;
}): DeterministicSourceClaimViolation[] {
  if (!DETERMINISTIC_CLAIM_GATE_CODES.has(args.artifactCode)) return [];

  const supportedNumbers = extractMaterialNumbers(args.sourceContext);
  const violations: DeterministicSourceClaimViolation[] = [];
  for (const claim of extractMaterialNumberClaims(args.body)) {
    if (!supportedNumbers.some((value) => materiallyEqual(value, claim.value))) {
      violations.push({
        claim: claim.text,
        reason: "Quantified claim is absent from the bound event evidence.",
      });
    }
  }

  const supportedTemporalClaims = new Set(
    extractTemporalClaims(args.sourceContext).flatMap((claim) => {
      const month = claim.key.match(/^(20\d{2}-\d{2})-\d{2}$/)?.[1];
      return month ? [claim.key, month] : [claim.key];
    }),
  );
  for (const claim of extractTemporalClaims(args.body)) {
    if (!supportedTemporalClaims.has(claim.key)) {
      violations.push({
        claim: claim.text,
        reason:
          "Date or duration claim is absent from the bound event evidence; do not invent or back-solve a sourcing calendar in narrative generation.",
      });
    }
  }

  const generalizationPatterns = [
    /\b(?:typically|frequently|almost always|industry benchmark|market benchmark|best practice)\b/i,
    /\bmarket\s+(?:is|remains|appears)\s+(?:active|receptive|competitive|favorable)\b/i,
    /\b(?:providers?|vendors?)\s+(?:are|remain)\s+competing\s+aggressively\b/i,
    /\bperiod of vendor capacity constraint\b/i,
    /\b(?:uncommon|unusual)\s+to\s+have\b/i,
    /\b(?:normal|typical)\s+for\s+(?:this|the)\s+stage\b/i,
    /\bcompared\s+with\s+[^.!?]*\b(?:typical|equivalent)\b/i,
    /\bpricing\s+can\s+diverge\s+from\s+market\b/i,
  ];
  for (const sentence of args.body.split(/(?<=[.!?])\s+|\n+/)) {
    const text = sentence.replace(/\s+/g, " ").trim();
    if (!text) continue;
    if (isEvidenceAbsenceStatement(text)) continue;
    if (generalizationPatterns.some((pattern) => pattern.test(text))) {
      violations.push({
        claim: text.slice(0, 220),
        reason:
          "External benchmark or current-market assertion is not established by the bound event evidence.",
      });
    }
  }

  for (const match of args.body.matchAll(/\bartifact\s+[0-9a-f]{6,}\b/gi)) {
    violations.push({
      claim: match[0],
      reason:
        "Client-facing narrative exposes an internal artifact identifier instead of a friendly evidence citation.",
    });
  }

  return uniqueViolations(violations).slice(0, 12);
}

function extractTemporalClaims(text: string): Array<{
  text: string;
  key: string;
}> {
  const claims: Array<{ text: string; key: string }> = [];
  const patterns = [
    /\b(?:Q[1-4]\s+20\d{2})\b/gi,
    /\b(?:20\d{2}[-\s]?Q[1-4])\b/gi,
    /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+20\d{2}\b/gi,
    /\b\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+20\d{2}\b/gi,
    /(?<!\d\s)\b(?:mid-|early\s+|late\s+)?(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+20\d{2}\b/gi,
    /\b20\d{2}-\d{2}-\d{2}\b/g,
    /\b20\d{2}-(?:0[1-9]|1[0-2])\b/g,
    /\b(?:\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(?:-|–|to)\s*(?:\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(?:business\s+)?(?:days?|weeks?|months?|years?)\b/gi,
    /\b(?:\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)(?:\s*-\s*|\s+)(?:business\s+)?(?:days?|weeks?|months?|years?)\b/gi,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const normalized = normalizeTemporalClaim(match[0]);
      claims.push({ text: match[0].trim(), key: normalized });
    }
  }
  return claims;
}

const MONTH_NUMBER_BY_NAME: Record<string, string> = {
  jan: "01",
  january: "01",
  feb: "02",
  february: "02",
  mar: "03",
  march: "03",
  apr: "04",
  april: "04",
  may: "05",
  jun: "06",
  june: "06",
  jul: "07",
  july: "07",
  aug: "08",
  august: "08",
  sep: "09",
  september: "09",
  oct: "10",
  october: "10",
  nov: "11",
  november: "11",
  dec: "12",
  december: "12",
};

function normalizeTemporalClaim(raw: string): string {
  const normalized = raw
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/,/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const quarter = normalized.match(/(?:q([1-4])\s+(20\d{2})|(20\d{2})[-\s]?q([1-4]))/);
  if (quarter) {
    return `${quarter[2] ?? quarter[3]}-q${quarter[1] ?? quarter[4]}`;
  }
  const isoDate = normalized.match(/^(20\d{2})-(\d{2})-(\d{2})$/);
  if (isoDate) return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;
  const monthFirst = normalized.match(
    /^([a-z]+)\s+(\d{1,2})\s+(20\d{2})$/,
  );
  if (monthFirst && MONTH_NUMBER_BY_NAME[monthFirst[1]]) {
    return `${monthFirst[3]}-${MONTH_NUMBER_BY_NAME[monthFirst[1]]}-${monthFirst[2].padStart(2, "0")}`;
  }
  const dayFirst = normalized.match(
    /^(\d{1,2})\s+([a-z]+)\s+(20\d{2})$/,
  );
  if (dayFirst && MONTH_NUMBER_BY_NAME[dayFirst[2]]) {
    return `${dayFirst[3]}-${MONTH_NUMBER_BY_NAME[dayFirst[2]]}-${dayFirst[1].padStart(2, "0")}`;
  }
  const isoMonth = normalized.match(/^(20\d{2})-(\d{2})$/);
  if (isoMonth) return `${isoMonth[1]}-${isoMonth[2]}`;
  const monthYear = normalized.match(/^([a-z]+)\s+(20\d{2})$/);
  if (monthYear && MONTH_NUMBER_BY_NAME[monthYear[1]]) {
    return `${monthYear[2]}-${MONTH_NUMBER_BY_NAME[monthYear[1]]}`;
  }
  const duration = normalized
    .replace(/(?<=\w)-(?=\w)/g, " ")
    .match(
      /^(\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(business\s+)?(day|days|week|weeks|month|months|year|years)$/,
    );
  if (duration) {
    const amount = durationWordToNumber(duration[1]);
    const unit = duration[3].replace(/s$/, "");
    if (amount !== null) {
      if (unit === "year") return `duration-month:${amount * 12}`;
      if (unit === "month") return `duration-month:${amount}`;
      return `duration-${duration[2] ? "business-" : ""}${unit}:${amount}`;
    }
  }
  return normalized
    .replace(/\b(days?|weeks?|months?|years?)\b/g, (unit) =>
      unit.endsWith("s") ? unit.slice(0, -1) : unit,
    )
    .replace(/(?<=\d)-(?=day|week|month|year)/g, " ");
}

function durationWordToNumber(raw: string): number | null {
  const numeric = Number(raw);
  if (Number.isFinite(numeric)) return numeric;
  const words: Record<string, number> = {
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
  };
  return words[raw] ?? null;
}

function isEvidenceAbsenceStatement(text: string): boolean {
  return /\b(?:no|none|absent|missing|unavailable|not\s+(?:loaded|available|provided|established))\b[^.!?]{0,100}\b(?:benchmark|evidence|source|dataset|baseline)\b/i.test(
    text,
  );
}

export function applyDeterministicSourceClaimGate(
  review: ConsultingGradeReview,
  violations: readonly DeterministicSourceClaimViolation[],
): ConsultingGradeReview {
  if (violations.length === 0) return review;
  const claims = violations.map(
    (violation) => `${violation.claim} - ${violation.reason}`,
  );
  const dimensionScores = review.dimensionScores.map((dimension) => {
    if (
      dimension.id !== "evidence_grounding" &&
      dimension.id !== "source_discipline"
    ) {
      return dimension;
    }
    return {
      ...dimension,
      score: Math.min(dimension.score, 5),
      rationale:
        "Deterministic evidence scan found material claims outside the bound source context.",
      requiredFixes: [
        ...dimension.requiredFixes,
        "Remove, cite, or register every flagged claim as an unvalidated hypothesis.",
      ].slice(0, 3),
    };
  });
  return {
    ...review,
    pass: false,
    overallScore: Math.min(review.overallScore, 5),
    dimensionScores,
    unsupportedClaims: [...new Set([...review.unsupportedClaims, ...claims])].slice(
      0,
      12,
    ),
    rewriteGuidance: [
      ...review.rewriteGuidance,
      "Use only values and market facts present in bound evidence; otherwise name the gap without supplying a benchmark.",
    ].slice(0, 12),
  };
}

function extractMaterialNumbers(text: string): number[] {
  const values = extractMaterialNumberClaims(text).map((claim) => claim.value);
  for (const line of text.split("\n")) {
    if (
      !/\b(?:amount|annual_value|baseline|cost|credit|fee|invoice|price|rate|spend|usd|value)\b/i.test(
        line,
      )
    ) {
      continue;
    }
    for (const match of line.matchAll(/\b\d[\d,]*(?:\.\d+)?\b/g)) {
      const value = Number(match[0].replace(/,/g, ""));
      if (Number.isFinite(value)) values.push(value);
    }
  }
  return values;
}

function extractMaterialNumberClaims(text: string): Array<{
  text: string;
  value: number;
}> {
  const matches: Array<{ text: string; value: number }> = [];
  const pattern =
    /\$\s*\d[\d,]*(?:\.\d+)?(?:\s*(?:billion|million|thousand|bn|mm|m|k)\b)?|\b\d+(?:\.\d+)?\s*(?:%|percent)\b/gi;
  for (const match of text.matchAll(pattern)) {
    const value = parseMaterialNumber(match[0]);
    if (value !== null) matches.push({ text: match[0].trim(), value });
  }
  for (const match of text.matchAll(
    /\b(\d+(?:\.\d+)?)\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*(%|percent)\b/gi,
  )) {
    matches.push(
      { text: `${match[1]} ${match[3]}`, value: Number(match[1]) },
      { text: `${match[2]} ${match[3]}`, value: Number(match[2]) },
    );
  }
  return matches;
}

function parseMaterialNumber(raw: string): number | null {
  const normalized = raw.toLowerCase().replace(/[$,%]/g, "").replace(/,/g, "");
  const numeric = Number(normalized.match(/\d+(?:\.\d+)?/)?.[0]);
  if (!Number.isFinite(numeric)) return null;
  if (/(?:billion|bn)\s*$/.test(normalized)) return numeric * 1_000_000_000;
  if (/(?:million|mm|m)\s*$/.test(normalized)) return numeric * 1_000_000;
  if (/(?:thousand|k)\s*$/.test(normalized)) return numeric * 1_000;
  return numeric;
}

function materiallyEqual(left: number, right: number): boolean {
  return Math.abs(left - right) <= Math.max(0.01, Math.abs(right) * 0.0001);
}

function uniqueViolations(
  violations: readonly DeterministicSourceClaimViolation[],
): DeterministicSourceClaimViolation[] {
  const seen = new Set<string>();
  return violations.filter((violation) => {
    const key = `${violation.claim}|${violation.reason}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function requiresSourceConsultingGradeGate(
  artifactCode: string,
): boolean {
  return SOURCE_CONSULTING_GRADE_GATE_CODES.has(artifactCode);
}

export function buildSourceQualitySourceContext(args: {
  ctx: SourceGenerationContext;
  upstreamBound: Record<string, string>;
  artifactCode: string;
}): string {
  const { ctx, upstreamBound, artifactCode } = args;
  const isRfpPackage = artifactCode === "d09_rfp_pack";
  const upstreamLines = Object.entries(upstreamBound).map(([code, body]) => {
    const excerpt = body.replace(/\s+/g, " ").trim().slice(0, 900);
    return `- ${code}: ${excerpt}${body.length > 900 ? "..." : ""}`;
  });
  const evidenceLines = ctx.evidence.map((item) => {
    const state = resolveGenerationEvidenceState(ctx, item, isRfpPackage);
    return [
      `- ${item.requirementId}`,
      `state=${state}`,
      item.sourceArtifactId ? "source=linked evidence record" : null,
      item.notes ? `notes=${item.notes}` : null,
    ]
      .filter(Boolean)
      .join("; ");
  });
  const uploadedEvidenceLines = (ctx.uploadedEvidence ?? []).flatMap(
    (artifact) => {
      const header = [
        `- ${artifact.originalName}`,
        `family=${artifact.artifactFamily}`,
        `format=${artifact.sourceFormat}`,
        `parse=${artifact.parseStatus}`,
        `evidence=${artifact.evidenceState}`,
      ].join("; ");
      const chunks = artifact.chunkExcerpts
        .slice(0, 3)
        .map((chunk) => `  chunk: ${chunk}`);
      const facts = artifact.factSummaries
        .slice(0, 6)
        .map((fact) => `  fact: ${fact}`);
      return [header, ...chunks, ...facts];
    },
  );
  const gateLines = ctx.gateCriteria.map(
    (criterion) =>
      `- ${criterion.criterionId}: ${criterion.state}${
        criterion.notes ? ` (${criterion.notes})` : ""
      }`,
  );
  const profile = getSourceArtifactProfile(shortSourceArtifactCode(artifactCode));
  const profileLines = profile
    ? [
        `- Decision purpose: ${profile.decisionPurpose}`,
        `- Audience: ${Array.isArray(profile.audience) ? profile.audience.join(", ") : profile.audience}`,
        `- Risk depth: ${profile.riskDepth}`,
        `- Required exhibits: ${profile.requiredExhibits.join(", ")}`,
      ]
    : ["- No registered profile for this artifact code."];
  return [
    `Tenant: ${ctx.tenantName} (${ctx.tenantKey})`,
    `Event: ${ctx.event.name} (${ctx.event.code})`,
    ctx.event.owner ? `Owner: ${ctx.event.owner}` : "Owner: not recorded",
    ctx.event.estimatedValueUsd
      ? `Estimated value: $${ctx.event.estimatedValueUsd.toLocaleString()}`
      : "Estimated value: not recorded",
    `Approved event trigger / why-now: ${ctx.event.triggerDescription ?? "not recorded"}`,
    `Approved event scope and intake facts: ${ctx.event.scopeDescription ?? "not recorded"}`,
    "",
    "Artifact-specific requirements (from source-artifact-profiles.ts):",
    ...profileLines,
    "",
    "Upstream authored artifacts:",
    upstreamLines.length ? upstreamLines.join("\n") : "- none",
    "",
    "Evidence states:",
    evidenceLines.length ? evidenceLines.join("\n") : "- none",
    "",
    "Parsed uploaded evidence excerpts:",
    uploadedEvidenceLines.length
      ? uploadedEvidenceLines.join("\n")
      : "- none",
    ...(isRfpPackage
      ? [
          "",
          "D09 RFP evidence coverage semantics:",
          formatD09RfpEvidenceCoverage(ctx),
        ]
      : []),
    "",
    "Gate criteria states:",
    gateLines.length ? gateLines.join("\n") : "- none",
  ].join("\n");
}

export function buildSourceConsultingGradeReviewPrompt(args: {
  artifactCode: string;
  artifactName: string;
  bodyMarkdown: string;
  sourceContext: string;
}): string {
  return buildConsultingGradeReviewPrompt(args);
}

export function buildSourceConsultingGradeCompactRetryPrompt(args: {
  artifactCode: string;
  artifactName: string;
  bodyMarkdown: string;
  sourceContext: string;
  previousError: string;
}): string {
  return buildConsultingGradeCompactRetryPrompt(args);
}

export function buildSourceConsultingGradeRewritePrompt(args: {
  artifactCode: string;
  artifactName: string;
  bodyMarkdown: string;
  sourceContext: string;
  review: ConsultingGradeReview;
}): string {
  return buildConsultingGradeRewritePrompt(args);
}

export function parseSourceConsultingGradeReview(args: {
  artifactCode: string;
  artifactName: string;
  raw: string;
}): ConsultingGradeReview {
  return parseConsultingGradeReviewJson(args);
}

export function buildMalformedSourceConsultingGradeReview(args: {
  artifactCode: string;
  artifactName: string;
  reason: string;
}): ConsultingGradeReview {
  return buildMalformedConsultingGradeReview(args);
}

export function buildSourceQualityGateMetadata(args: {
  reviews: ConsultingGradeReview[];
  rewriteAttempted: boolean;
}): SourceArtifactQualityGateMetadata {
  const finalReview = args.reviews.at(-1);
  return {
    required: true,
    standardId: CONSULTING_GRADE_STANDARD_ID,
    minRequiredScore: CONSULTING_GRADE_MIN_SCORE,
    passed: Boolean(finalReview?.pass),
    rewriteAttempted: args.rewriteAttempted,
    attempts: args.reviews.length,
    finalSummary: finalReview
      ? summarizeConsultingGradeReview(finalReview)
      : "No consulting-grade review was recorded.",
    reviews: args.reviews,
  };
}

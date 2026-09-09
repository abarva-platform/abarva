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
  getD09RfpSatisfiedRequirementIds,
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
    extractTemporalClaims(args.sourceContext).map((claim) => claim.key),
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
    /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+20\d{2}\b/gi,
    /\b\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+20\d{2}\b/gi,
    /\b(?:mid-|early\s+|late\s+)?(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+20\d{2}\b/gi,
    /\b20\d{2}-\d{2}-\d{2}\b/g,
    /\b(?:\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(?:-|–|to)\s*(?:\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(?:business\s+)?(?:days?|weeks?|months?|years?)\b/gi,
    /\b(?:\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)(?:\s*-\s*|\s+)(?:business\s+)?(?:days?|weeks?|months?|years?)\b/gi,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const normalized = match[0]
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/,/g, "")
        .trim();
      claims.push({ text: match[0].trim(), key: normalized });
    }
  }
  return claims;
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
  return extractMaterialNumberClaims(text).map((claim) => claim.value);
}

function extractMaterialNumberClaims(text: string): Array<{
  text: string;
  value: number;
}> {
  const matches: Array<{ text: string; value: number }> = [];
  const pattern =
    /\$\s*\d[\d,]*(?:\.\d+)?\s*(?:billion|million|thousand|bn|mm|m|k)?|\b\d+(?:\.\d+)?\s*(?:%|percent)\b/gi;
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
  const d09SatisfiedIds = isRfpPackage
    ? getD09RfpSatisfiedRequirementIds(ctx)
    : new Set<string>();
  const evidenceLines = ctx.evidence.map((item) => {
    const state =
      item.currentState === "Not Requested" &&
      d09SatisfiedIds.has(item.requirementId)
        ? "Available parsed evidence — citation review pending (normalized from uploaded D09 coverage map)"
        : item.currentState;
    return [
      `- ${item.requirementId}`,
      `state=${state}`,
      item.sourceArtifactId ? `artifact=${item.sourceArtifactId}` : null,
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
        .slice(0, 3)
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

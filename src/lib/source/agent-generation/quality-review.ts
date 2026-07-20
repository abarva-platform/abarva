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

// The consulting-grade gate was previously RFP-only: `SOURCE_CONSULTING_GRADE_CODES`
// held just d09, and its review context unconditionally injected D09-specific
// evidence-coverage language regardless of artifact code (a latent bug — harmless
// while d09 was the only gated code, but wrong the moment another code joined).
// This gate is now artifact-aware: coverage is derived from source-artifact-profiles.ts
// (gated codes are the high-stakes narrative/decision/vendor-pack artifacts — the
// document types this rubric's dimensions were actually written for), and the
// D09-specific context block below is now scoped to d09 only.
//
// Expansion beyond d09 is a real production behavior change (added review +
// possible rewrite latency, and a new failure mode if a previously-single-pass
// artifact doesn't clear the bar), so it stays behind SOURCE_QUALITY_GATE_EXPANDED
// until it has a live-proof pass on each newly-gated code.
const SOURCE_QUALITY_GATE_ALWAYS_CODES = new Set(["d09_rfp_pack"]);

// Long-code aliases for the short codes selected below, confirmed against
// exports/spec-builder.ts's ARTIFACT_CODE_ALIASES so this doesn't guess at a
// naming convention it can't verify.
const SOURCE_QUALITY_GATE_EXPANDED_CODES = new Set([
  "d01_strategy_memo",
  "d05_scope_memo",
  "d24_decision_brief",
  "d27_selection_memo",
]);

function isSourceQualityGateExpansionEnabled(): boolean {
  return process.env.SOURCE_QUALITY_GATE_EXPANDED === "1";
}

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

export function requiresSourceConsultingGradeGate(
  artifactCode: string,
): boolean {
  if (SOURCE_QUALITY_GATE_ALWAYS_CODES.has(artifactCode)) return true;
  return (
    isSourceQualityGateExpansionEnabled() &&
    SOURCE_QUALITY_GATE_EXPANDED_CODES.has(artifactCode)
  );
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

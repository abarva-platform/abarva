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

// The consulting-grade gate's review rubric is RFP-specific (it grades against
// D09 exhibits, the coverage map, and RFP §-structure). It only fits d09. Short
// strategy docs (d02/d03) were forced through it and always blocked on RFP
// criteria they should not have — they now generate single-pass on the
// board-grade model (like d01, which is board-grade with no gate) + the bound
// uploaded evidence. Making the gate artifact-aware (per-artifact rubric) is the
// follow-up that would let d02/d03 be rigorously gated against their own rubric.
const SOURCE_CONSULTING_GRADE_CODES = new Set(["d09_rfp_pack"]);

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
  return SOURCE_CONSULTING_GRADE_CODES.has(artifactCode);
}

export function buildSourceQualitySourceContext(args: {
  ctx: SourceGenerationContext;
  upstreamBound: Record<string, string>;
}): string {
  const { ctx, upstreamBound } = args;
  const upstreamLines = Object.entries(upstreamBound).map(([code, body]) => {
    const excerpt = body.replace(/\s+/g, " ").trim().slice(0, 900);
    return `- ${code}: ${excerpt}${body.length > 900 ? "..." : ""}`;
  });
  const d09SatisfiedIds = getD09RfpSatisfiedRequirementIds(ctx);
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
  return [
    `Tenant: ${ctx.tenantName} (${ctx.tenantKey})`,
    `Event: ${ctx.event.name} (${ctx.event.code})`,
    ctx.event.owner ? `Owner: ${ctx.event.owner}` : "Owner: not recorded",
    ctx.event.estimatedValueUsd
      ? `Estimated value: $${ctx.event.estimatedValueUsd.toLocaleString()}`
      : "Estimated value: not recorded",
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
    "",
    "D09 RFP evidence coverage semantics:",
    formatD09RfpEvidenceCoverage(ctx),
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

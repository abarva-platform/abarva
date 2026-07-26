import "server-only";

// PR9 — the GOVERNED ROADMAP BUILDER.
//
// The single seam both pipelines call after the model returns. It turns model
// output into either (a) a validated RoadmapPresentationContract plus three
// SYNCHRONIZED renders (HTML preview, DOCX detail, PPTX deck) all derived from
// that one contract, plus a provenance record — or (b) a governed failure with
// NO contract and NO renders. It never infers structure from prose, never
// substitutes defaults, never fabricates an evidence status.

import {
  buildRoadmapContractFromStructured,
  type RoadmapExtractionIssue,
} from "./roadmap-contract-extractor";
import {
  parseRoadmapStructuredBlock,
  ROADMAP_SO_OPEN,
  ROADMAP_SO_CLOSE,
} from "./roadmap-structured-output";
import {
  checkProseStructureConsistency,
  type ProseStructureMismatch,
} from "./roadmap-prose-structure-consistency";
import {
  ROADMAP_CONTRACT_VERSION,
  type RoadmapLineage,
  type RoadmapPresentationContract,
} from "./roadmap-presentation-contract";
import type { RoadmapLifecycleState } from "./roadmap-lifecycle";
import { renderRoadmapPreviewHtml } from "./roadmap-preview-html-renderer";
import { renderRoadmapDetailDocx } from "./roadmap-docx-renderer";
import { renderExecutiveRoadmapPptx } from "./roadmap-pptx-renderer";

export type RoadmapPipeline = "golden_bar" | "orchestrator";

/** The governed provenance recorded with the artifact (user PR9 step 4/5). */
export interface RoadmapArtifactProvenance {
  pipeline: RoadmapPipeline;
  contractVersion: string;
  structuredOutputVersion: string;
  schemaValidation: "passed";
  contentHash: string;
  generatedAt: string;
  lifecycleState: RoadmapLifecycleState;
  lineage: RoadmapLineage;
  /** The model's cited authoritative sources, recorded verbatim (not trusted for governance). */
  sourceLineageRefs: string[];
  /** Non-fatal issues the extractor surfaced (e.g. defaulted evidence). */
  extractionIssues: RoadmapExtractionIssue[];
}

export interface GovernedRoadmapRenders {
  html: string;
  docx: Buffer;
  pptx: Buffer;
}

export type GovernedRoadmapResult =
  | {
      ok: true;
      contract: RoadmapPresentationContract;
      provenance: RoadmapArtifactProvenance;
      renders: GovernedRoadmapRenders;
    }
  | {
      ok: false;
      code: "roadmap_structured_output_invalid";
      reason: string;
      mismatches?: ProseStructureMismatch[];
    };

export interface BuildGovernedRoadmapArgs {
  /** The raw model text (narrative + the delimited structured block). */
  modelText: string;
  pipeline: RoadmapPipeline;
  /** Governed, system-derived — NOT model-asserted. */
  lineage: RoadmapLineage;
  lifecycleState: RoadmapLifecycleState;
  phase: number;
  /** ISO timestamp, injected for determinism/testability. */
  generatedAt: string;
  /** Whether the governed system holds authoritative approved-evidence for this
   * Move. When false (the default), any `approved` evidence status in the
   * structured output is an unsupported claim and blocks the artifact. */
  authoritativeApprovedEvidence?: boolean;
}

/** Remove the delimited structured block (and its markers) from the model text,
 * leaving just the narrative for prose⇄structure comparison. */
function stripStructuredBlock(modelText: string): string {
  const start = modelText.indexOf(ROADMAP_SO_OPEN);
  if (start === -1) return modelText;
  const closeAt = modelText.indexOf(ROADMAP_SO_CLOSE, start);
  const end =
    closeAt === -1 ? modelText.length : closeAt + ROADMAP_SO_CLOSE.length;
  return (modelText.slice(0, start) + modelText.slice(end)).trim();
}

function hasApprovedClaim(cells: { evidenceStatus?: string }[]): boolean {
  return cells.some((c) => c.evidenceStatus === "approved");
}

/** Build the governed roadmap artifact, or fail honestly. */
export async function buildGovernedRoadmapArtifact(
  args: BuildGovernedRoadmapArgs,
): Promise<GovernedRoadmapResult> {
  const {
    modelText,
    pipeline,
    lineage,
    lifecycleState,
    phase,
    generatedAt,
    authoritativeApprovedEvidence = false,
  } = args;

  // 1) Parse + strictly validate the structured block. Absent/malformed/incomplete → fail.
  const parsed = parseRoadmapStructuredBlock(modelText);
  if (!parsed.ok) return parsed;

  // 2) Unsupported approval claims are blocked (never rendered as certainty).
  if (!authoritativeApprovedEvidence && hasApprovedClaim(parsed.input.cells)) {
    return {
      ok: false,
      code: "roadmap_structured_output_invalid",
      reason:
        'Structured output marks an item "approved" but the governed system holds no authoritative approved-evidence for this Move. Unsupported approval claims are blocked.',
    };
  }

  // 3) The model's claimed lifecycle must match the governed lifecycle state.
  if (parsed.output.lifecycleStateRef !== lifecycleState) {
    return {
      ok: false,
      code: "roadmap_structured_output_invalid",
      reason: `Structured output claims lifecycle "${parsed.output.lifecycleStateRef}" but the governed state is "${lifecycleState}".`,
    };
  }

  // 4) Prose ⇄ structure consistency — block on any material mismatch. Compare
  //    the NARRATIVE against the structure, so strip the structured block itself
  //    (its own JSON strings are structure, not prose claims).
  const prose = stripStructuredBlock(modelText);
  const mismatches = checkProseStructureConsistency({
    prose,
    input: parsed.input,
    lifecycleState,
  });
  const material = mismatches.filter((m) => m.material);
  if (material.length > 0) {
    return {
      ok: false,
      code: "roadmap_structured_output_invalid",
      reason: `Prose and structured output disagree: ${material
        .map((m) => m.code)
        .join(", ")}. Blocked pending regeneration or review.`,
      mismatches,
    };
  }

  // 5) Build the ONE contract, then the three synchronized renders from it.
  const { contract, issues } = buildRoadmapContractFromStructured({
    input: parsed.input,
    lineage,
    lifecycleState,
    phase,
  });

  const [docx, pptx] = await Promise.all([
    renderRoadmapDetailDocx(contract),
    renderExecutiveRoadmapPptx(contract),
  ]);
  const html = renderRoadmapPreviewHtml(contract);

  const provenance: RoadmapArtifactProvenance = {
    pipeline,
    contractVersion: ROADMAP_CONTRACT_VERSION,
    structuredOutputVersion: parsed.output.schemaVersion,
    schemaValidation: "passed",
    contentHash: contract.contentHash,
    generatedAt,
    lifecycleState,
    lineage,
    sourceLineageRefs: parsed.output.sourceLineageRefs,
    extractionIssues: issues,
  };

  return { ok: true, contract, provenance, renders: { html, docx, pptx } };
}

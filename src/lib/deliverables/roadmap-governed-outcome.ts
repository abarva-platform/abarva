import "server-only";

// PR12A/C — the explicit governed-build OUTCOME model.
//
// Every roadmap build attempt resolves to a typed outcome — success OR a
// specific failure code — never a swallowed `undefined`. The outcome carries the
// audit metadata the product persists so it can distinguish "narrative succeeded
// but structured contract failed" from "contract succeeded but a renderer
// failed" from "full success".
//
// This consumes the ALREADY-PARSED structured input from the dedicated pass
// (roadmap-structured-pass.ts). It never parses HTML.

import {
  buildRoadmapContractFromStructured,
  type RoadmapStructuredInput,
} from "./roadmap-contract-extractor";
import { checkProseStructureConsistency } from "./roadmap-prose-structure-consistency";
import {
  ROADMAP_CONTRACT_VERSION,
  type RoadmapLineage,
  type RoadmapPresentationContract,
} from "./roadmap-presentation-contract";
import type { RoadmapLifecycleState } from "./roadmap-lifecycle";
import { renderRoadmapPreviewHtml } from "./roadmap-preview-html-renderer";
import { renderRoadmapDetailDocx } from "./roadmap-docx-renderer";
import { renderExecutiveRoadmapPptx } from "./roadmap-pptx-renderer";
import {
  ROADMAP_RENDERER_VERSIONS,
  type RoadmapSyncMetadata,
} from "./roadmap-artifact-persistence";
import type { RoadmapPipeline } from "./build-governed-roadmap-artifact";
import type { RoadmapStructuredPassFailureCode } from "./roadmap-structured-pass";

/** The full governed-build outcome status set (PR12A). */
export type GovernedRoadmapOutcomeCode =
  | "success"
  | RoadmapStructuredPassFailureCode // structured_output_missing|malformed|schema_invalid
  | "unsupported_approval_claim"
  | "lifecycle_mismatch"
  | "prose_structure_contradiction"
  | "renderer_failure"
  | "persistence_failure";

export interface GovernedRoadmapRenders {
  html: string;
  docx: Buffer;
  pptx: Buffer;
}

export type GovernedRoadmapOutcome =
  | {
      status: "success";
      contract: RoadmapPresentationContract;
      renders: GovernedRoadmapRenders;
      sourceLineageRefs: string[];
    }
  | {
      status: Exclude<GovernedRoadmapOutcomeCode, "success">;
      detail: string;
    };

function hasApprovedClaim(cells: { evidenceStatus?: string }[]): boolean {
  return cells.some((c) => c.evidenceStatus === "approved");
}

/** Turn a validated structured input into a governed outcome. Never throws; a
 * renderer error is reported as `renderer_failure`, not a crash. */
export async function buildGovernedRoadmapOutcome(args: {
  input: RoadmapStructuredInput;
  /** The model's claimed lifecycle, cross-checked against the governed state. */
  claimedLifecycleRef: string;
  sourceLineageRefs: string[];
  /** The completed HTML narrative text, for prose⇄structure consistency. */
  narrativeText: string;
  lineage: RoadmapLineage;
  lifecycleState: RoadmapLifecycleState;
  phase: number;
  authoritativeApprovedEvidence?: boolean;
}): Promise<GovernedRoadmapOutcome> {
  const {
    input,
    claimedLifecycleRef,
    sourceLineageRefs,
    narrativeText,
    lineage,
    lifecycleState,
    phase,
    authoritativeApprovedEvidence = false,
  } = args;

  // 1) Unsupported approval claim.
  if (!authoritativeApprovedEvidence && hasApprovedClaim(input.cells)) {
    return {
      status: "unsupported_approval_claim",
      detail:
        'Structured output marks an item "approved" but the governed system holds no authoritative approved-evidence for this Move.',
    };
  }

  // 2) Lifecycle cross-check.
  if (claimedLifecycleRef !== lifecycleState) {
    return {
      status: "lifecycle_mismatch",
      detail: `Structured output claims lifecycle "${claimedLifecycleRef}" but the governed state is "${lifecycleState}".`,
    };
  }

  // 3) Prose ⇄ structure consistency (against the narrative).
  const mismatches = checkProseStructureConsistency({
    prose: narrativeText,
    input,
    lifecycleState,
  }).filter((m) => m.material);
  if (mismatches.length > 0) {
    return {
      status: "prose_structure_contradiction",
      detail: mismatches.map((m) => m.code).join(", "),
    };
  }

  // 4) Build the contract.
  const { contract } = buildRoadmapContractFromStructured({
    input,
    lineage,
    lifecycleState,
    phase,
  });

  // 5) Render — a renderer error is a distinct, reported outcome.
  let renders: GovernedRoadmapRenders;
  try {
    const [docx, pptx] = await Promise.all([
      renderRoadmapDetailDocx(contract),
      renderExecutiveRoadmapPptx(contract),
    ]);
    renders = { html: renderRoadmapPreviewHtml(contract), docx, pptx };
  } catch (e) {
    return {
      status: "renderer_failure",
      detail: `A roadmap renderer failed: ${(e as Error).message}`,
    };
  }

  return { status: "success", contract, renders, sourceLineageRefs };
}

// ── Persisted outcome record (PR12A) ────────────────────────────────────────

export interface GovernedRoadmapOutcomeRecord {
  artifactId: string;
  moveId: string;
  tenantKey: string;
  generationRunId: string;
  pipeline: RoadmapPipeline;
  attemptedAt: string;
  status: GovernedRoadmapOutcomeCode;
  /** Populated on non-success; a SAFE, client-showable reason (no raw model text). */
  failureCode: Exclude<GovernedRoadmapOutcomeCode, "success"> | null;
  failureDetail: string | null;
  structuredOutputSchemaVersion: string;
  lifecycleStateVersion: string;
  /** Hash of the model's structured-pass response (audit; not the contract). */
  modelResponseHash: string;
  /** The governed contract hash on success, else null. */
  contentHash: string | null;
  rendererVersions: typeof ROADMAP_RENDERER_VERSIONS;
  rendererResults: { html: boolean; docx: boolean; pptx: boolean };
  supersedesContentHash: string | null;
  version: number;
}

/** Build the persisted outcome record for ANY attempt (success or failure). */
export function buildGovernedOutcomeRecord(args: {
  outcome: GovernedRoadmapOutcome;
  artifactId: string;
  moveId: string;
  tenantKey: string;
  generationRunId: string;
  pipeline: RoadmapPipeline;
  attemptedAt: string;
  schemaVersion: string;
  lifecycleStateVersion: string;
  modelResponseHash: string;
  prior?: { version: number; contentHash: string | null } | null;
}): GovernedRoadmapOutcomeRecord {
  const o = args.outcome;
  const success = o.status === "success";
  return {
    artifactId: args.artifactId,
    moveId: args.moveId,
    tenantKey: args.tenantKey,
    generationRunId: args.generationRunId,
    pipeline: args.pipeline,
    attemptedAt: args.attemptedAt,
    status: o.status,
    failureCode:
      o.status === "success"
        ? null
        : (o.status as Exclude<GovernedRoadmapOutcomeCode, "success">),
    failureDetail: o.status === "success" ? null : o.detail,
    structuredOutputSchemaVersion: args.schemaVersion,
    lifecycleStateVersion: args.lifecycleStateVersion,
    modelResponseHash: args.modelResponseHash,
    contentHash: o.status === "success" ? o.contract.contentHash : null,
    rendererVersions: ROADMAP_RENDERER_VERSIONS,
    rendererResults: success
      ? { html: true, docx: true, pptx: true }
      : { html: false, docx: false, pptx: false },
    supersedesContentHash: args.prior?.contentHash ?? null,
    version: args.prior ? args.prior.version + 1 : 1,
  };
}

export { ROADMAP_CONTRACT_VERSION };
export type { RoadmapSyncMetadata };

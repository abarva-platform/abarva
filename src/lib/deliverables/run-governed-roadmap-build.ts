import "server-only";

// PR12D — the fast governed roadmap BUILD service.
//
// This is the operational fix for the 504: instead of piggybacking the governed
// contract on the multi-minute HTML narrative generation, this runs ONE focused
// structured pass + build + persist. It is short enough to complete well within
// the proxy window and returns the outcome directly.
//
// It persists EITHER a valid governed record (so the Move-addressable download
// route resolves it) OR a governed FAILURE record (so the failure is observable
// and the UI can show a reason instead of a dead link). Nothing is swallowed.

import { randomUUID } from "node:crypto";

import { azureRead } from "@/lib/data-plane/azureRead";
import { createMovesGenerateArtifactDeps } from "./moves-generate-deps";
import { assembleMoveSolutionContext } from "@/lib/programs/assemble-solution-context";
import { draftModuleDeliverable } from "@/lib/programs/nexus";
import type { TenancyCtx } from "@/lib/programs/types.db";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { runRoadmapStructuredPass } from "./roadmap-structured-pass";
import {
  buildGovernedRoadmapOutcome,
  buildGovernedOutcomeRecord,
  type GovernedRoadmapOutcome,
} from "./roadmap-governed-outcome";
import { ROADMAP_STRUCTURED_OUTPUT_VERSION } from "./roadmap-structured-output";
import { buildPersistedRoadmapRecord } from "./roadmap-artifact-persistence";
import type { RoadmapArtifactProvenance } from "./build-governed-roadmap-artifact";
import type { RoadmapLineage } from "./roadmap-presentation-contract";

const LIFECYCLE_STATE = "review_draft" as const;
const LIFECYCLE_STATE_VERSION = "lc-review_draft";

export interface GovernedRoadmapBuildResult {
  moveId: string;
  runId: string;
  attemptedAt: string;
  status: GovernedRoadmapOutcome["status"];
  failureDetail: string | null;
  contentHash: string | null;
  version: number;
  deliverableId: string | null;
  attempts: number;
}

/** Load the latest execution_roadmap narrative text + the prior governed version
 * (for consistency checking and supersession), scoped to this Move. */
async function loadNarrativeAndPrior(moveId: string): Promise<{
  narrative: string;
  prior: { version: number; contentHash: string | null } | null;
}> {
  const rows = await azureRead.query<{
    content: string | null;
    version: number;
    structured_data: unknown;
  }>(
    "SELECT dv.content, dv.version, dv.structured_data FROM deliverable_versions dv " +
      "JOIN deliverables_v2 d ON d.id = dv.deliverable_id " +
      "WHERE d.engagement_id = $1 AND d.deliverable_type_key = $2 " +
      "ORDER BY dv.version DESC",
    [moveId, "execution_roadmap"],
    { missingTable: "empty" },
  );
  const narrative = rows.find((r) => (r.content ?? "").trim())?.content ?? "";
  // Prior governed version = the newest version whose structured_data already
  // carries a governed record (success), for supersession lineage.
  let prior: { version: number; contentHash: string | null } | null = null;
  for (const r of rows) {
    const sd = r.structured_data as Record<string, unknown> | null;
    const rec = sd?.roadmap_governed_record as
      | { sync?: { contentHash?: string } }
      | undefined;
    if (rec?.sync?.contentHash) {
      prior = { version: r.version, contentHash: rec.sync.contentHash };
      break;
    }
  }
  return { narrative, prior };
}

/** Run the governed roadmap build for a Move. Persists success or a governed
 * failure record; never swallows. */
export async function runGovernedRoadmapBuild(
  ctx: TenancyCtx,
  args: { moveId: string },
): Promise<GovernedRoadmapBuildResult> {
  const tenantKey = ctx.clientKey ?? ctx.clientId;
  const attemptedAt = new Date().toISOString();
  const runId = randomUUID();
  const artifactId = `${args.moveId}:execution_roadmap`;

  // Flag gate (defense in depth; the route also checks).
  if (
    !isFeatureEnabled(
      { clientKey: ctx.clientKey, clientId: ctx.clientId },
      "moves_governed_roadmap_downloads",
    )
  ) {
    throw new Error(
      "moves_governed_roadmap_downloads is not enabled for this tenant",
    );
  }

  const deps = createMovesGenerateArtifactDeps(ctx);
  const assembled = await assembleMoveSolutionContext(
    { moveId: args.moveId, tenantKey, targetPhase: 4 },
    deps.contextSources,
  );
  const { narrative, prior } = await loadNarrativeAndPrior(args.moveId);

  const pass = await runRoadmapStructuredPass({
    ctx: assembled.context,
    phase: 4,
    callModel: (system, user) =>
      deps.callModel(system, user, {
        artifact: "execution_roadmap",
        phase: 4,
        maxTokens: 2000,
      }),
  });

  const lineage: RoadmapLineage = {
    moveId: args.moveId,
    tenantKey,
    architectureRef: assembled.context.architecture
      ? "accepted-p3-architecture"
      : undefined,
  };

  let outcome: GovernedRoadmapOutcome;
  if (!pass.ok) {
    outcome = { status: pass.code, detail: pass.detail };
  } else {
    outcome = await buildGovernedRoadmapOutcome({
      input: pass.input,
      claimedLifecycleRef: pass.output.lifecycleStateRef,
      sourceLineageRefs: pass.output.sourceLineageRefs,
      narrativeText: narrative,
      lineage,
      lifecycleState: LIFECYCLE_STATE,
      phase: 4,
    });
  }

  const record = buildGovernedOutcomeRecord({
    outcome,
    artifactId,
    moveId: args.moveId,
    tenantKey,
    generationRunId: runId,
    pipeline: "golden_bar",
    attemptedAt,
    schemaVersion: ROADMAP_STRUCTURED_OUTPUT_VERSION,
    lifecycleStateVersion: LIFECYCLE_STATE_VERSION,
    modelResponseHash: pass.modelResponseHash,
    prior,
  });

  // On success, ALSO store the download-route's expected roadmap_governed_record
  // (PersistedRoadmapRecord shape) so the Move-addressable route resolves it.
  const structuredData: Record<string, unknown> = {
    phase: 4,
    artifact: "execution_roadmap",
    output_role: "governed_roadmap_build",
    roadmap_governed_outcome: record,
  };
  if (outcome.status === "success") {
    const provenance: RoadmapArtifactProvenance = {
      pipeline: "golden_bar",
      contractVersion: outcome.contract.contractVersion,
      structuredOutputVersion: ROADMAP_STRUCTURED_OUTPUT_VERSION,
      schemaValidation: "passed",
      contentHash: outcome.contract.contentHash,
      generatedAt: attemptedAt,
      lifecycleState: LIFECYCLE_STATE,
      lineage,
      sourceLineageRefs: outcome.sourceLineageRefs,
      extractionIssues: [],
    };
    structuredData.roadmap_governed_record = buildPersistedRoadmapRecord({
      contract: outcome.contract,
      provenance,
      artifactId,
      generationRunId: runId,
      lifecycleStateVersion: LIFECYCLE_STATE_VERSION,
      prior: prior
        ? {
            sync: {
              version: prior.version,
              contentHash: prior.contentHash ?? "",
            } as never,
          }
        : null,
    });
  }

  let deliverableId: string | null = null;
  try {
    const persisted = await draftModuleDeliverable(ctx, {
      programId: args.moveId,
      moduleKey: "execution_roadmap",
      deliverableTypeKey: "execution_roadmap",
      title: "Executive Roadmap",
      draftContent: narrative || "<governed roadmap build>",
      structuredData,
    });
    deliverableId = persisted.deliverableId;
  } catch (e) {
    // Persistence failure is its own distinct, reported outcome.
    return {
      moveId: args.moveId,
      runId,
      attemptedAt,
      status: "persistence_failure",
      failureDetail: `Failed to persist governed outcome: ${(e as Error).message}`,
      contentHash: null,
      version: record.version,
      deliverableId: null,
      attempts: pass.attempts.length,
    };
  }

  return {
    moveId: args.moveId,
    runId,
    attemptedAt,
    status: outcome.status,
    failureDetail: outcome.status === "success" ? null : outcome.detail,
    contentHash: record.contentHash,
    version: record.version,
    deliverableId,
    attempts: pass.attempts.length,
  };
}

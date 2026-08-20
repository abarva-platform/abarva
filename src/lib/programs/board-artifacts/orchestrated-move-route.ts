import type { NextRequest } from "next/server";

import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import type { MoveBusinessCaseInput } from "@/lib/programs/move-business-case";
import {
  generatedArtifactResponseHeaders,
  persistBoardGradeMoveArtifact,
} from "@/lib/programs/board-artifacts/board-grade-persistence";
import {
  runOrchestratedMoveDeliverable,
  type RunOrchestratedMoveDeliverableInput,
} from "@/lib/programs/deliverables/orchestrated/run-orchestrated-move-deliverable";

export interface MaybeOrchestratedMoveRouteInput {
  req: NextRequest;
  routePath: string;
  moveId: string;
  moveInput: MoveBusinessCaseInput;
  generatedOn: string;
  renderedBy: string;
  userClientKey?: string | null;
  artifactId: string;
  title: string;
  filename: string;
  deliverableType: string;
  phaseOrStage: string;
  artifactStandard: string;
  decisionContext: string;
  audience?: RunOrchestratedMoveDeliverableInput["audience"];
}

function qualityScore(
  quality: Awaited<
    ReturnType<typeof runOrchestratedMoveDeliverable>
  >["quality"],
): number | null {
  if (!quality) return null;
  const blockerPenalty = quality.blockers.length * 20;
  const warningPenalty = quality.warnings.length * 5;
  return Math.max(0, Math.min(100, 100 - blockerPenalty - warningPenalty));
}

/**
 * Try the governed orchestrator branch for an existing Moves board-grade route.
 *
 * Returns a full Response only when the tenant flag is ON and orchestration
 * passes. Otherwise returns null so the caller can continue through the
 * pre-existing deterministic renderer. This preserves the route contract and
 * keeps the feature safely default-off.
 */
export async function maybeRenderOrchestratedMoveArtifact(
  input: MaybeOrchestratedMoveRouteInput,
): Promise<Response | null> {
  const params = new URL(input.req.url).searchParams;
  const flagCtx = {
    clientKey: input.moveInput.tenant_key ?? input.moveInput.tenantKey ?? null,
    clientId: input.moveInput.tenant_key ?? input.moveInput.tenantKey ?? null,
  };
  const enabled =
    params.get("engine") !== "deterministic" &&
    isFeatureEnabled(flagCtx, "moves_orchestrated_deliverables");
  if (!enabled) return null;

  const run = await runOrchestratedMoveDeliverable({
    moveInput: input.moveInput,
    moveId: input.moveId,
    tenantId:
      input.moveInput.tenant_key ??
      input.moveInput.tenantKey ??
      input.userClientKey ??
      input.moveId,
    userId: input.renderedBy,
    generatedOn: input.generatedOn,
    deliverableType: input.deliverableType,
    phaseOrStage: input.phaseOrStage,
    artifactStandard: input.artifactStandard,
    decisionContext: input.decisionContext,
    ...(input.audience ? { audience: input.audience } : {}),
  }).catch((err) => {
    console.error(`[GET ${input.routePath}] orchestration error`, {
      err,
      moveId: input.moveId,
      deliverableType: input.deliverableType,
    });
    return null;
  });

  if (!run?.ok || !run.html || !run.document) {
    console.warn(
      `[GET ${input.routePath}] orchestration not used; falling back to deterministic deck`,
      {
        moveId: input.moveId,
        deliverableType: input.deliverableType,
        reason: run?.blockedReason,
      },
    );
    return null;
  }

  const artifactRecord = await persistBoardGradeMoveArtifact({
    clientId:
      input.moveInput.tenant_key ??
      input.moveInput.tenantKey ??
      input.userClientKey,
    moveId: input.moveId,
    artifactId: input.artifactId,
    title: input.title,
    html: run.html,
    renderableDoc: {
      ...run.document,
      deliverableType: input.deliverableType,
      deliverableTypeKey: input.artifactId,
    },
    renderableMetadata: {
      artifactType: input.artifactId,
      source: "moves_orchestrated_deliverables",
      routePath: input.routePath,
      evidenceRefs: run.citedInputIds,
    },
    renderedBy: input.renderedBy,
    routePath: input.routePath,
    generatedOn: input.generatedOn,
    citedInputIds: run.citedInputIds,
    qualityScore: qualityScore(run.quality),
  });

  const download = params.get("download") === "1";
  return new Response(run.html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-kernel-move": `move:${input.moveId}`,
      "x-deliverable-engine": "orchestrated",
      "x-deliverable-cited-input-count": String(run.citedInputIds.length),
      ...generatedArtifactResponseHeaders(artifactRecord),
      ...(download
        ? { "content-disposition": `attachment; filename="${input.filename}"` }
        : {}),
    },
  });
}

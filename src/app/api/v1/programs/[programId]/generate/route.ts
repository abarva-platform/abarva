// POST /api/v1/programs/:programId/generate
//
// Governed Moves artifact generation. This route is intentionally thin: tenancy,
// program lookup, canonical artifact mapping, then the tested generateArtifact()
// keystone. That keystone owns phase gates, cumulative SolutionContext binding,
// dynamic prompt construction, Claude invocation, and the visual golden bar.
//
// Body (back-compat): { phase?: number, deliverableTypeKey?: string, title?: string, generationMode?: "final" | "draft" }

import "server-only";
import { requireTenancy, tenancyErrorResponse } from "../../_auth";
import { getProgramById } from "@/lib/programs/queries";
import { generateArtifact } from "@/lib/deliverables/generate-artifact";
import {
  createMovesGenerateArtifactDeps,
  normalizeMovesDeliverableKey,
} from "@/lib/deliverables/moves-generate-deps";
import { getDeliverableProfile } from "@/lib/deliverables/profiles/registry";
import { createDeliverableRun, type DeliverableRunJobPayload } from "@/lib/deliverables/orchestrator/runs-repository";
import { assertPhaseReadyForGeneration } from "@/lib/programs/assert-phase-ready";
import { persistMoveGeneratedArtifact } from "@/lib/deliverables/persist-move-generated-artifact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const PHASE_LABEL: Record<number, string> = {
  0: "P0 Originate",
  1: "P1 Charter",
  2: "P2 Discover & Diagnose",
  3: "P3 Design Future State",
  4: "P4 Roadmap & Business Case",
  5: "P5 Mobilize & Handoff",
};

function shouldEnqueuePremiumArtifact(args: {
  phase: number;
  artifact: string;
  generationMode: "final" | "draft";
}): boolean {
  return (
    args.phase === 2 &&
    args.artifact === "discovery_report" &&
    args.generationMode === "draft"
  );
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ programId: string }> },
): Promise<Response> {
  let ctx: Awaited<ReturnType<typeof requireTenancy>>;
  try {
    ctx = await requireTenancy();
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      return Response.json({ error: "internal_error" }, { status: 500 });
    }
  }

  if (!ctx.clientKey) {
    return Response.json(
      {
        error: "no_tenant_key",
        detail: "Active tenant has no resolvable tenant key.",
      },
      { status: 409 },
    );
  }
  const clientKey = ctx.clientKey;

  const { programId } = await params;

  const program = await getProgramById(ctx, programId);
  if (!program) return Response.json({ error: "not_found" }, { status: 404 });

  let body: {
    phase?: number;
    deliverableTypeKey?: string;
    title?: string;
    generationMode?: "final" | "draft";
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const targetPhase = body.phase ?? program.currentPhase ?? 1;
  const registryKey = body.deliverableTypeKey ?? `p${targetPhase}_package`;
  const generationMode = body.generationMode === "draft" ? "draft" : "final";

  const phaseLabel = PHASE_LABEL[targetPhase] ?? `P${targetPhase}`;
  const artifact = normalizeMovesDeliverableKey(
    registryKey,
    targetPhase,
    body.title,
  );
  const profile = getDeliverableProfile(artifact);
  const deps = createMovesGenerateArtifactDeps(ctx);

  if (shouldEnqueuePremiumArtifact({ phase: targetPhase, artifact, generationMode })) {
    const gate = await assertPhaseReadyForGeneration(
      {
        moveId: programId,
        phase: targetPhase,
        allowApprovedRetry: true,
        generationMode,
      },
      deps.gateSources,
    );
    if (!gate.ready) {
      return Response.json(
        {
          error: "generation_gate_blocked",
          blockers: gate.blockers,
          phase: targetPhase,
          deliverableKey: artifact,
        },
        { status: 409 },
      );
    }

    const jobPayload: DeliverableRunJobPayload = {
      kind: "moves_premium_artifact",
      module: "moves",
      useCaseArchetype: program.archetype ?? "strategic_move",
      deliverableType: artifact,
      decisionContext: `${program.name} — ${phaseLabel}: ${profile.decisionPurpose}`,
      clientDisplayName: "Client",
      initiativeDisplayName: program.name,
      sourceArtifactRef: programId,
      phase: targetPhase,
      artifact,
      generationMode,
      title: body.title ?? profile.title,
      useCaseQuery:
        program.problemStatement ?? program.targetOutcome ?? program.name,
    };
    const run = await createDeliverableRun({
      clientId: ctx.clientId,
      tenantKey: clientKey,
      userId: ctx.userId,
      module: "moves",
      archetype: program.archetype ?? "strategic_move",
      deliverableType: artifact,
      jobPayload,
    });
    return Response.json(
      {
        runId: run.id,
        status: "queued",
        async: true,
        phase: targetPhase,
        deliverableKey: artifact,
        generationMode,
        statusUrl: `/api/v1/deliverables/runs/${run.id}`,
      },
      { status: 202 },
    );
  }

  const result = await generateArtifact(
    {
      moveId: programId,
      tenantKey: clientKey,
      phase: targetPhase,
      artifact,
      allowApprovedRetry: true,
      generationMode,
      useCaseQuery:
        program.problemStatement ?? program.targetOutcome ?? program.name,
    },
    deps,
  );

  if (result.status === "blocked_gate") {
    return Response.json(
      {
        error: "generation_gate_blocked",
        blockers: result.blockers,
        phase: targetPhase,
        deliverableKey: artifact,
      },
      { status: result.httpStatus },
    );
  }

  if (result.status === "blocked_context") {
    return Response.json(
      {
        error: "generation_context_blocked",
        missing: result.missing,
        phase: targetPhase,
        deliverableKey: artifact,
      },
      { status: 409 },
    );
  }

  if (result.status === "blocked_quality") {
    return Response.json(
      {
        error: "golden_bar_failed",
        goldenBar: result.goldenBar,
        rawContent: result.html,
        detail: "Artifact did not meet the visual-first golden bar.",
      },
      { status: 422 },
    );
  }

  const persisted = await persistMoveGeneratedArtifact({
    ctx,
    program,
    phase: targetPhase,
    artifact,
    title: body.title ?? profile.title,
    result,
  });

  return Response.json({
    deliverableId: persisted.deliverableId,
    versionId: persisted.versionId,
    artifactId: persisted.artifactId,
    artifactVersion: persisted.artifactVersion,
    artifactBlobStored: persisted.artifactBlobStored,
    content: result.html,
    phase: targetPhase,
    deliverableKey: artifact,
    generationMode: result.generationMode,
    draftOnly: result.draftOnly,
    draftCaveats: result.draftCaveats,
    contextCaveats: result.contextCaveats,
    artifactStatus:
      result.generationMode === "draft"
        ? "Pre-gate draft — review required"
        : "Draft",
    outputFormat: "html",
    goldenBar: result.goldenBar,
  });
}

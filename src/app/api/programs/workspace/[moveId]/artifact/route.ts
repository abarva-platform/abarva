// POST /api/programs/workspace/[moveId]/artifact · Wave 4A workspace artifact drafting
//
// Lets the Nexus workspace chat generate deliverable drafts and persist them to
// deliverables_v2. Mirrors the pattern from /api/v1/programs/[programId]/nexus/draft
// but scoped to the strategic-moves workspace surface and simplified for the
// phase-keyed workspace schema.
//
// Body: {
//   phase: 1-5,
//   deliverableKey: string,  // e.g. "charter", "diagnose_report", "design_spec", "roadmap", "mobilize_plan"
//   title: string,
//   prompt: string           // what Nexus should draft
// }
// Returns: { deliverableId, versionId, content, phase }

import { NextRequest } from "next/server";
import { generateArtifact } from "@/lib/deliverables/generate-artifact";
import { buildGeneratedPhaseDigest } from "@/lib/deliverables/generated-phase-digest";
import {
  createMovesGenerateArtifactDeps,
  normalizeMovesDeliverableKey,
} from "@/lib/deliverables/moves-generate-deps";
import { getDeliverableProfile } from "@/lib/deliverables/profiles/registry";
import { draftModuleDeliverable } from "@/lib/programs/nexus";
import {
  requireTenancy,
  tenancyErrorResponse,
} from "@/app/api/v1/programs/_auth";
import { getProgramById } from "@/lib/programs/queries";
import { PHASE_LABEL_MAP } from "@/lib/programs/programs-fixture";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const PHASE_TO_MODULE_KEY: Record<number, string> = {
  1: "charter",
  2: "diagnose",
  3: "design",
  4: "roadmap",
  5: "mobilize",
};

const PHASE_LABEL: Record<number, string> = {
  1: PHASE_LABEL_MAP[1] ?? "Discovery",
  2: PHASE_LABEL_MAP[2] ?? "Synthesis",
  3: PHASE_LABEL_MAP[3] ?? "Design",
  4: PHASE_LABEL_MAP[4] ?? "Execution Roadmap",
  5: PHASE_LABEL_MAP[5] ?? "Approval & Mobilization",
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ moveId: string }> },
) {
  try {
    const { moveId } = await params;

    // 1. Auth gate
    const ctx = await requireTenancy();

    // 2. Tenant gate — confirm the move/program belongs to this tenant
    const program = await getProgramById(ctx, moveId);
    if (!program) return Response.json({ error: "not_found" }, { status: 404 });
    if (program.archivedAt || program.deletedAt) {
      return Response.json({ error: "archived_or_deleted" }, { status: 410 });
    }

    // 3. Validate body
    const body = (await req.json()) as {
      phase?: number;
      deliverableKey?: string;
      title?: string;
      prompt?: string;
    };

    if (
      !body?.phase ||
      !Number.isInteger(body.phase) ||
      body.phase < 1 ||
      body.phase > 5
    ) {
      return Response.json(
        { error: "bad_request", detail: "phase must be an integer in [1,5]" },
        { status: 400 },
      );
    }
    if (!body?.deliverableKey || !body?.title || !body?.prompt) {
      return Response.json(
        {
          error: "bad_request",
          detail: "deliverableKey + title + prompt required",
        },
        { status: 400 },
      );
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

    const phase = body.phase;
    const moduleKey = PHASE_TO_MODULE_KEY[phase];
    const phaseLabel = PHASE_LABEL[phase];
    const artifact = normalizeMovesDeliverableKey(
      body.deliverableKey,
      phase,
      body.title,
    );
    const profile = getDeliverableProfile(artifact);

    const result = await generateArtifact(
      {
        moveId,
        tenantKey: ctx.clientKey,
        phase,
        artifact,
        allowApprovedRetry: true,
        useCaseQuery: body.prompt,
      },
      createMovesGenerateArtifactDeps(ctx),
    );

    if (result.status === "blocked_gate") {
      return Response.json(
        {
          error: "generation_gate_blocked",
          blockers: result.blockers,
          phase,
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
          phase,
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
          detail:
            "Artifact did not meet the visual-first golden bar. The raw HTML is returned for review/regeneration.",
        },
        { status: 422 },
      );
    }

    const solutionContextDigest = buildGeneratedPhaseDigest({
      artifact,
      phase,
      html: result.html,
      context: result.context,
    });

    const { deliverableId, versionId } = await draftModuleDeliverable(ctx, {
      programId: moveId,
      moduleKey,
      deliverableTypeKey: artifact,
      title: body.title || profile.title,
      draftContent: result.html,
      structuredData: {
        prompt: body.prompt,
        phase,
        artifact,
        output_format: "html",
        mode: "workspace_artifact",
        solutionContextDigest,
        solution_context: result.context,
        golden_bar: result.goldenBar,
      },
      provenanceMap: {
        module: moduleKey,
        program: program.name,
        phase,
        phase_label: phaseLabel,
        artifact,
        output_format: "html",
      },
    });

    return Response.json({
      deliverableId,
      versionId,
      content: result.html,
      phase,
      deliverableKey: artifact,
      outputFormat: "html",
      goldenBar: result.goldenBar,
    });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {}
    console.error("[POST /programs/workspace/:moveId/artifact]", err);
    return Response.json(
      { error: "internal_error", message: (err as Error).message },
      { status: 500 },
    );
  }
}

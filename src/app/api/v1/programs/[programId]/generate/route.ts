// POST /api/v1/programs/:programId/generate
//
// Governed Moves artifact generation. This route is intentionally thin: tenancy,
// program lookup, canonical artifact mapping, then the tested generateArtifact()
// keystone. That keystone owns phase gates, cumulative SolutionContext binding,
// dynamic prompt construction, Claude invocation, and the visual golden bar.
//
// Body (back-compat): { phase?: number, deliverableTypeKey?: string, title?: string }

import "server-only";
import { requireTenancy, tenancyErrorResponse } from "../../_auth";
import { getProgramById } from "@/lib/programs/queries";
import { generateArtifact } from "@/lib/deliverables/generate-artifact";
import { buildGeneratedPhaseDigest } from "@/lib/deliverables/generated-phase-digest";
import {
  createMovesGenerateArtifactDeps,
  normalizeMovesDeliverableKey,
} from "@/lib/deliverables/moves-generate-deps";
import { getDeliverableProfile } from "@/lib/deliverables/profiles/registry";
import { draftModuleDeliverable } from "@/lib/programs/nexus";
import { saveMoveArtifact } from "@/lib/programs/deliverables/move-artifacts";

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

function safeArtifactFileName(title: string, artifact: string): string {
  const base = (title || artifact)
    .replace(/[^\w\s.-]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `${base || artifact}.html`;
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

  let body: { phase?: number; deliverableTypeKey?: string; title?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const targetPhase = body.phase ?? program.currentPhase ?? 1;
  const registryKey = body.deliverableTypeKey ?? `p${targetPhase}_package`;

  const phaseLabel = PHASE_LABEL[targetPhase] ?? `P${targetPhase}`;
  const artifact = normalizeMovesDeliverableKey(
    registryKey,
    targetPhase,
    body.title,
  );
  const profile = getDeliverableProfile(artifact);
  const result = await generateArtifact(
    {
      moveId: programId,
      tenantKey: clientKey,
      phase: targetPhase,
      artifact,
      allowApprovedRetry: true,
      useCaseQuery:
        program.problemStatement ?? program.targetOutcome ?? program.name,
    },
    createMovesGenerateArtifactDeps(ctx),
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

  const solutionContextDigest = buildGeneratedPhaseDigest({
    artifact,
    phase: targetPhase,
    html: result.html,
    context: result.context,
  });

  const { deliverableId, versionId } = await draftModuleDeliverable(ctx, {
    programId,
    moduleKey: artifact,
    deliverableTypeKey: artifact,
    title: body.title ?? profile.title,
    draftContent: result.html,
    structuredData: {
      phase: targetPhase,
      artifact,
      output_format: "html",
      mode: "program_generate",
      solutionContextDigest,
      solution_context: result.context,
      golden_bar: result.goldenBar,
    },
    provenanceMap: {
      program: program.name,
      phase: targetPhase,
      phase_label: phaseLabel,
      artifact,
      output_format: "html",
    },
  });

  const savedArtifact = await saveMoveArtifact(ctx, {
    moveId: programId,
    phase: targetPhase,
    artifactType: artifact,
    artifactFamily: "generated_deliverable",
    title: body.title ?? profile.title,
    description:
      "Generated through the governed Moves artifact generation path. Review before final client use.",
    fileName: safeArtifactFileName(body.title ?? profile.title, artifact),
    fileFormat: "html",
    body: result.html,
    status: "draft",
    generatedBy: ctx.email ?? ctx.userId ?? "moves-generate",
    qualityScore: result.goldenBar.pass ? 96 : null,
    unsupportedClaimsCount: 0,
    sourceBasis: "moves_solution_context",
    confidence: result.goldenBar.hasDataGap ? "medium" : "high",
    citationReady: !result.goldenBar.hasDataGap,
    metadata: {
      deliverableId,
      versionId,
      phaseLabel,
      outputFormat: "html",
      qualityStatus: result.goldenBar.pass ? "Passed" : "Needs review",
      goldenBarStatus: result.goldenBar.pass ? "Passed" : "Failed",
      artifactStatus: "Draft",
      openItems: [],
      reviewStatus: "not_reviewed",
      clientFacingVersionLabel: "Version 1",
    },
  });

  return Response.json({
    deliverableId,
    versionId,
    artifactId: savedArtifact.artifactId,
    artifactVersion: savedArtifact.version,
    artifactBlobStored: savedArtifact.blobStored,
    content: result.html,
    phase: targetPhase,
    deliverableKey: artifact,
    outputFormat: "html",
    goldenBar: result.goldenBar,
  });
}

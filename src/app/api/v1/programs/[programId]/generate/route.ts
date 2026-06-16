// POST /api/v1/programs/:programId/generate
//
// DEPRECATED single-pass shim → orchestrated async path.
//
// This route ONCE ran a single Claude call (streamAgentTurn / draftModuleDeliverable)
// with NO plan gate and NO quality gate, saving straight to deliverable_versions.
// That path could fabricate and was the one the founder asked to retire.
//
// It now delegates to the governed, multi-pass orchestrator (the same engine the
// Documents tab uses via POST /api/v1/deliverables/generate): create a
// deliverable_runs row, kick off runDeliverableForTenant in the background, and
// return { runId, status: 'running' } (202). Callers should poll
// GET /api/v1/deliverables/runs/{runId}. No Moves UI invokes this route anymore;
// it is kept only so any lingering external/programmatic caller lands on the
// governed path instead of the retired single-pass one.
//
// Body (back-compat): { phase?: number, deliverableTypeKey?: string, title?: string }

import "server-only";
import { requireTenancy, tenancyErrorResponse } from "../../_auth";
import { getProgramById } from "@/lib/programs/queries";
import { getActiveClientRow } from "@/lib/active-client";
import {
  getDeliverableSpec,
  type DeliverableSpec,
} from "@/lib/programs/deliverable-registry";
import { orchestratorDeliverableType } from "@/lib/programs/orchestrated-deliverable-map";
import { runDeliverableForTenant } from "@/lib/deliverables/orchestrator/generate-service";
import {
  createDeliverableRun,
  completeDeliverableRun,
  updateDeliverableRunProgress,
} from "@/lib/deliverables/orchestrator/runs-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PHASE_LABEL: Record<number, string> = {
  0: "P0 Originate",
  1: "P1 Charter",
  2: "P2 Discover & Diagnose",
  3: "P3 Design Future State",
  4: "P4 Roadmap & Business Case",
  5: "P5 Mobilize & Handoff",
};

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
      { error: "no_tenant_key", detail: "Active tenant has no resolvable tenant key." },
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

  // Resolve the registry spec for purpose/title; unknown keys still produce a
  // valid orchestrator run via the generic board-grade brief.
  const spec: DeliverableSpec | undefined = getDeliverableSpec(registryKey);
  const phaseLabel = PHASE_LABEL[targetPhase] ?? `P${targetPhase}`;
  const documentTitle = spec?.documentTitle ?? body.title ?? `Phase ${targetPhase} Deliverable`;
  const purpose = spec?.documentPurpose ?? "Phase deliverable";

  const archetype = program.archetype ?? "strategic_transformation";
  const deliverableType = orchestratorDeliverableType(registryKey);

  const activeClient = await getActiveClientRow().catch(() => null);
  const clientDisplayName = activeClient?.name ?? "Client";
  const initiativeDisplayName = program.name ?? "Strategic Move";
  const decisionContext = `${initiativeDisplayName} — ${phaseLabel}: ${purpose}`;

  // 1 · create the run row (shared state; polls may hit a different replica)
  const run = await createDeliverableRun({
    clientId: ctx.clientId,
    tenantKey: clientKey,
    userId: ctx.userId,
    module: "moves",
    archetype,
    deliverableType,
  });

  // 2 · run the governed multi-pass orchestrator in the background; the HTTP
  //     response returns immediately. A failed progress write never aborts gen.
  void (async () => {
    try {
      const result = await runDeliverableForTenant({
        module: "moves",
        useCaseArchetype: archetype,
        deliverableType,
        decisionContext,
        clientDisplayName,
        initiativeDisplayName,
        sourceArtifactRef: programId,
        tenantClientKey: clientKey,
        clientId: ctx.clientId,
        userId: ctx.userId,
        onProgress: (p) => {
          void updateDeliverableRunProgress(run.id, {
            pct: p.pct,
            label: p.nextLabel ?? p.label,
            pass: p.pass,
          }).catch(() => {});
        },
      });
      await completeDeliverableRun(
        run.id,
        result.ok
          ? {
              status: "succeeded",
              artifactId: result.artifactId ?? null,
              sectionCount: result.sectionCount ?? null,
              retrievedEvidence: result.retrievedEvidence ?? null,
              warnings: result.warnings ?? [],
            }
          : {
              status: "blocked",
              blockers: result.blockers ?? [],
              retrievedEvidence: result.retrievedEvidence ?? null,
              sectionCount: result.sectionCount ?? null,
              error: result.blockedReason ?? null,
            },
      );
    } catch (err) {
      await completeDeliverableRun(run.id, {
        status: "failed",
        error: (err instanceof Error ? err.message : String(err)).slice(0, 600),
      }).catch(() => {});
    }
  })();

  return Response.json(
    {
      runId: run.id,
      status: "running",
      deliverableType,
      title: documentTitle,
      phase: targetPhase,
      // Back-compat hint for any old caller that expected an inline document:
      // the artifact is now produced asynchronously and governed by quality gates.
      detail:
        "Single-pass generation is retired. This deliverable is now authored by the governed multi-pass orchestrator; poll GET /api/v1/deliverables/runs/{runId}.",
    },
    { status: 202 },
  );
}

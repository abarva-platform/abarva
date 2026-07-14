// POST /api/v1/deliverables/generate-phase
//
// Phase-level "Approve & Build": ENQUEUES every governed deliverable for a Move
// phase in one batch, rather than the client firing one generate call per document.
// This is the north-star action — a phase is approved and built as a unit, not a
// pile of per-deliverable buttons.
//
// Like /generate, it does NO model work: for each deliverable in the phase it
// validates and persists a self-contained queued run row, then returns 202 with the
// run ids. The durable ACA Job worker claims and runs each row; the client polls
// GET /deliverables/runs/{id} per returned run. Enqueue is best-effort per
// deliverable — a single deliverable that fails to enqueue is reported in its row
// with an error, and does not abort the others.

import type { NextRequest } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { createDeliverableRun, type DeliverableRunJobPayload } from '@/lib/deliverables/orchestrator/runs-repository';
import {
  tenantInvariantHttpStatus,
  validateDeliverableTenantInvariant,
} from '@/lib/deliverables/orchestrator/tenant-invariant';
import {
  PHASE_CANONICAL_KEYS,
  DELIVERABLE_REGISTRY,
  type DeliverableSpec,
} from '@/lib/programs/deliverable-registry';
import { orchestratorDeliverableType } from '@/lib/programs/orchestrated-deliverable-map';
import {
  createMoveContextExtract,
  type MoveContextExtractResult,
} from '@/lib/programs/move-context-extract';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface GeneratePhaseBody {
  moveId?: string;
  phase?: number;
  useCaseArchetype?: string;
  moveName?: string;
  clientDisplayName?: string;
  contextExtract?: {
    candidatePreview?: {
      enabled?: boolean;
      candidateVersionId?: string;
      acknowledgedNotActiveRuntimeTruth?: boolean;
    };
  };
}

interface EnqueuedDeliverable {
  deliverableTypeKey: string;
  documentTitle: string;
  deliverableType: string;
  gateArtifact: boolean;
  runId: string | null;
  status: 'queued' | 'error';
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireTenancy();
    if (!ctx.clientKey) {
      return Response.json({ error: 'no_tenant_key', detail: 'Active tenant has no resolvable tenant key.' }, { status: 409 });
    }
    const clientKey = ctx.clientKey;

    let body: GeneratePhaseBody;
    try {
      body = (await req.json()) as GeneratePhaseBody;
    } catch {
      return Response.json({ error: 'bad_request', detail: 'Body was not valid JSON.' }, { status: 400 });
    }

    const moveId = body.moveId?.trim();
    const phase = Number(body.phase);
    const useCaseArchetype = body.useCaseArchetype?.trim();
    if (!moveId) return Response.json({ error: 'bad_request', detail: 'moveId is required.' }, { status: 400 });
    if (!Number.isInteger(phase) || phase < 1 || phase > 5) {
      return Response.json({ error: 'bad_request', detail: 'phase must be an integer 1–5.' }, { status: 400 });
    }
    if (!useCaseArchetype) return Response.json({ error: 'bad_request', detail: 'useCaseArchetype is required.' }, { status: 400 });

    const moveName = body.moveName?.trim() || 'Strategic Move';
    const clientDisplayName = body.clientDisplayName?.trim() || 'Client';

    const tenantInvariant = await validateDeliverableTenantInvariant({
      module: 'moves',
      sourceArtifactRef: moveId,
      clientId: ctx.clientId,
      tenantKey: clientKey,
    });
    if (!tenantInvariant.ok) {
      return Response.json(
        {
          error: tenantInvariant.code,
          detail: tenantInvariant.detail,
          sourceKind: tenantInvariant.sourceKind,
          sourceId: tenantInvariant.sourceId,
          expectedTenantKey: tenantInvariant.expectedTenantKey,
          actualTenantKey: tenantInvariant.actualTenantKey,
        },
        { status: tenantInvariantHttpStatus(tenantInvariant) },
      );
    }

    // Resolve the phase's canonical deliverables from the registry. These are the
    // documents an "Approve & Build" for this phase produces.
    const specs = (PHASE_CANONICAL_KEYS[phase] ?? [])
      .map((key) => DELIVERABLE_REGISTRY.find((d) => d.deliverableTypeKey === key))
      .filter(Boolean) as DeliverableSpec[];

    if (specs.length === 0) {
      return Response.json(
        { error: 'no_deliverables', detail: `Phase ${phase} has no configured deliverables to build.` },
        { status: 422 },
      );
    }

    const phaseLabel = specs[0]?.phaseLabel ?? `P${phase}`;
    // The registry's phaseLabel (e.g. "P4 Roadmap & Business Case") is an internal
    // gate name — it must never reach the model's prompt verbatim. decisionContext IS
    // sent to the model (prompt-builder.ts), so a model faithfully following its own
    // instructions will naturally echo "P4" back into the client-facing narrative,
    // which the non_mechanical_writing gate then (correctly) blocks. Strip the leading
    // "P<n>" token for the client-safe decision framing; phaseLabel itself is kept
    // as-is for the route's own response (internal/ops-facing, not model input).
    const clientSafePhaseLabel = phaseLabel.replace(/^P\d+\s*/i, '').trim() || 'this phase';

    let contextExtract: MoveContextExtractResult | null = null;
    try {
      contextExtract = await createMoveContextExtract({
        ctx,
        moveId,
        tenantKey: clientKey,
        phase,
        targetPhase: phase,
        moveName,
        useCaseArchetype,
        phaseLabel,
        phasePurpose: specs.map((spec) => spec.documentPurpose).join(' '),
        candidatePreview: {
          enabled:
            req.headers.get('x-abarva-candidate-preview-mode') === 'enabled' &&
            body.contextExtract?.candidatePreview?.enabled === true,
          candidateVersionId:
            body.contextExtract?.candidatePreview?.candidateVersionId?.trim(),
          acknowledgedNotActiveRuntimeTruth:
            body.contextExtract?.candidatePreview
              ?.acknowledgedNotActiveRuntimeTruth === true,
        },
      });
    } catch (err) {
      contextExtract = {
        status: 'error',
        extractId: null,
        artifactId: null,
        evidenceId: null,
        moveId,
        tenantKey: clientKey,
        sourceMode: 'active_home_context',
        phase,
        targetPhase: phase,
        activeTenantAccessVersionId: null,
        candidateVersionId: null,
        sourceBuildId: null,
        attachedEvidenceItems: [],
        suggestedContextItems: [],
        excludedContextItems: [],
        gapItems: [
          {
            status: 'gap',
            label: 'Move Context Extract',
            summary: 'Context extract failed before generation enqueue.',
            reason: err instanceof Error ? err.message : 'unknown error',
            sourceMode: 'active_home_context',
          },
        ],
        generatedAt: new Date().toISOString(),
        message: err instanceof Error ? err.message : 'unknown error',
      };
    }

    // Enqueue one run per deliverable. Best-effort: a failure on one is reported in
    // its row, not fatal to the batch — so the user still gets the rest building.
    const results: EnqueuedDeliverable[] = [];
    for (const spec of specs) {
      const deliverableType = orchestratorDeliverableType(spec.deliverableTypeKey);
      try {
        const jobPayload: DeliverableRunJobPayload = {
          module: 'moves',
          useCaseArchetype,
          deliverableType,
          decisionContext: `${moveName} — ${clientSafePhaseLabel}: ${spec.documentPurpose}`,
          clientDisplayName,
          initiativeDisplayName: moveName,
          sourceArtifactRef: moveId,
        };
        const run = await createDeliverableRun({
          clientId: ctx.clientId,
          tenantKey: clientKey,
          userId: ctx.userId,
          module: 'moves',
          archetype: useCaseArchetype,
          deliverableType,
          jobPayload,
        });
        results.push({
          deliverableTypeKey: spec.deliverableTypeKey,
          documentTitle: spec.documentTitle,
          deliverableType,
          gateArtifact: spec.gateArtifact,
          runId: run.id,
          status: 'queued',
        });
      } catch (err) {
        results.push({
          deliverableTypeKey: spec.deliverableTypeKey,
          documentTitle: spec.documentTitle,
          deliverableType,
          gateArtifact: spec.gateArtifact,
          runId: null,
          status: 'error',
          error: err instanceof Error ? err.message : 'enqueue failed',
        });
      }
    }

    const queued = results.filter((r) => r.status === 'queued').length;
    // 202 if anything queued; 500 only if every deliverable failed to enqueue.
    return Response.json(
      { phase, phaseLabel, contextExtract, queued, total: results.length, deliverables: results },
      { status: queued > 0 ? 202 : 500 },
    );
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      /* not a tenancy error */
    }
    const message = err instanceof Error ? err.message : 'unknown error';
    console.error('[POST /api/v1/deliverables/generate-phase]', err);
    return Response.json({ error: 'internal_error', message }, { status: 500 });
  }
}

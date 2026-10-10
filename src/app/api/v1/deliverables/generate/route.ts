// POST /api/v1/deliverables/generate
//
// ENQUEUES board-grade generation. Board-grade authoring is a six-pass Claude flow
// (~5–10 min) that cannot complete inside one HTTP request. It used to run as a detached
// `void (async…)` promise in this handler, but on Azure Container Apps the web replica
// (minReplicas:0) is recycled right after the 202 returns, killing the orphaned promise
// mid-run. So this route now does NO model work: it validates, persists a self-contained
// job row (status='queued', carrying the full job payload), and returns 202. A separate
// ACA Job worker (src/scripts/process-deliverable-queue.ts) atomically claims the row and
// runs the generation durably. The client still polls GET /deliverables/runs/{id}.

import type { NextRequest } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { createDeliverableRun, type DeliverableRunJobPayload } from '@/lib/deliverables/orchestrator/runs-repository';
import { tenantInvariantHttpStatus, validateDeliverableTenantInvariant } from '@/lib/deliverables/orchestrator/tenant-invariant';
import type { AudienceRole, DeliverableModule, OutputFormat } from '@/lib/deliverables/orchestrator/types';
import {
  approvedMoveEvidenceRevisionForPhase,
  loadApprovedMoveEvidenceSnapshot,
} from '@/lib/programs/approved-move-evidence-snapshot';
import { phaseForOrchestratorDeliverableType } from '@/lib/programs/orchestrated-deliverable-map';
import { isFeatureEnabled } from '@/lib/features/is-feature-enabled';
import { VALUE_ENGINE_FLAG } from '@/lib/programs/value-engine/value-case-view';
import { loadValueGenerationForMove } from '@/lib/programs/value-model-generation';
import type { ValueGenerationSnapshot } from '@/lib/programs/value-model-capture-evidence';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface GenerateBody {
  module?: DeliverableModule;
  useCaseArchetype?: string;
  deliverableType?: string;
  audience?: AudienceRole[];
  decisionContext?: string;
  clientDisplayName?: string;
  initiativeDisplayName?: string;
  sourceArtifactRef?: string;
  evidenceQuery?: string;
  outputFormats?: OutputFormat[];
  model?: string;
}

const MODULES: DeliverableModule[] = ['source', 'moves', 'tower', 'intelligence'];

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireTenancy();
    if (!ctx.clientKey) {
      return Response.json(
        {
          error: 'no_tenant_key',
          detail: 'Active tenant has no resolvable tenant key.',
        },
        { status: 409 },
      );
    }
    const clientKey = ctx.clientKey;

    let body: GenerateBody;
    try {
      body = (await req.json()) as GenerateBody;
    } catch {
      return Response.json({ error: 'bad_request', detail: 'Body was not valid JSON.' }, { status: 400 });
    }

    if (!body.module || !MODULES.includes(body.module)) {
      return Response.json(
        {
          error: 'bad_request',
          detail: `module must be one of ${MODULES.join(', ')}.`,
        },
        { status: 400 },
      );
    }
    const useCaseArchetype = body.useCaseArchetype?.trim();
    const deliverableType = body.deliverableType?.trim();
    const sourceArtifactRef = body.sourceArtifactRef?.trim();
    const decisionContext = body.decisionContext?.trim();
    if (!useCaseArchetype) return Response.json({ error: 'bad_request', detail: 'useCaseArchetype is required.' }, { status: 400 });
    if (!deliverableType) return Response.json({ error: 'bad_request', detail: 'deliverableType is required.' }, { status: 400 });
    if (!sourceArtifactRef) return Response.json({ error: 'bad_request', detail: 'sourceArtifactRef is required.' }, { status: 400 });
    if (!decisionContext) return Response.json({ error: 'bad_request', detail: 'decisionContext is required.' }, { status: 400 });

    const tenantInvariant = await validateDeliverableTenantInvariant({
      module: body.module,
      sourceArtifactRef,
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

    const phase = body.module === 'moves' ? phaseForOrchestratorDeliverableType(deliverableType) : null;
    if (body.module === 'moves' && phase === null) {
      return Response.json(
        {
          error: 'moves_deliverable_phase_unresolved',
          detail: 'The Moves deliverable must map to exactly one canonical phase before generation.',
        },
        { status: 422 },
      );
    }

    let valueGeneration: ValueGenerationSnapshot | undefined;
    if (
      body.module === 'moves' &&
      phase === 4 &&
      isFeatureEnabled({ clientKey, clientId: ctx.clientId }, VALUE_ENGINE_FLAG)
    ) {
      let read: Awaited<ReturnType<typeof loadValueGenerationForMove>>;
      try {
        read = await loadValueGenerationForMove(ctx, sourceArtifactRef);
      } catch {
        return Response.json(
          { error: 'value_model_read_failed', detail: 'The value model or its register inputs could not be read. No artifact was queued.' },
          { status: 503 },
        );
      }
      if (read.kind === 'review_required') {
        return Response.json(
          { error: 'value_model_review_required', detail: read.detail },
          { status: 409 },
        );
      }
      if (read.kind === 'ready') valueGeneration = read.snapshot;
    }

    const evidenceSnapshot =
      body.module === 'moves'
        ? await loadApprovedMoveEvidenceSnapshot({
            tenantKey: clientKey,
            moveId: sourceArtifactRef,
          })
        : null;
    if (body.module === 'moves' && !evidenceSnapshot) {
      return Response.json(
        {
          error: 'evidence_snapshot_unavailable',
          detail: 'Approved Move evidence could not be verified. No artifact was queued.',
        },
        { status: 503 },
      );
    }
    const phaseEvidenceSnapshotHash =
      evidenceSnapshot && phase !== null
        ? approvedMoveEvidenceRevisionForPhase(evidenceSnapshot, phase)
        : undefined;

    // Build the self-contained job payload the worker reconstructs the generation input
    // from. clientId/tenantKey/userId are stored as first-class run columns; everything
    // else the generation needs travels here so the run is runnable from the row alone.
    const jobPayload: DeliverableRunJobPayload = {
      module: body.module,
      useCaseArchetype,
      deliverableType,
      ...(body.audience ? { audience: body.audience } : {}),
      decisionContext,
      clientDisplayName: body.clientDisplayName?.trim() || 'Client',
      initiativeDisplayName: body.initiativeDisplayName?.trim() || useCaseArchetype,
      sourceArtifactRef,
      ...(phase !== null ? { phase } : {}),
      ...(evidenceSnapshot ? { evidenceSnapshotHash: evidenceSnapshot.revision } : {}),
      ...(phaseEvidenceSnapshotHash ? { phaseEvidenceSnapshotHash } : {}),
      ...(body.evidenceQuery ? { evidenceQuery: body.evidenceQuery } : {}),
      ...(body.outputFormats ? { outputFormats: body.outputFormats } : {}),
      ...(body.model ? { model: body.model } : {}),
      ...(valueGeneration ? { valueGeneration } : {}),
    };

    // Enqueue only — no model work in the request. The durable worker claims and runs it,
    // so a recycled web replica can never orphan an in-flight generation. Polls may hit a
    // different replica, which is why the run state lives in Postgres, not memory.
    const run = await createDeliverableRun({
      clientId: ctx.clientId,
      tenantKey: clientKey,
      userId: ctx.userId,
      module: body.module,
      archetype: useCaseArchetype,
      deliverableType,
      jobPayload,
    });

    return Response.json({ runId: run.id, status: 'queued' }, { status: 202 });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      /* not a tenancy error */
    }
    const message = err instanceof Error ? err.message : 'unknown error';
    console.error('[POST /api/v1/deliverables/generate]', err);
    return Response.json({ error: 'internal_error', message }, { status: 500 });
  }
}

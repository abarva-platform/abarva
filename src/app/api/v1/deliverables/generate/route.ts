// POST /api/v1/deliverables/generate
//
// Kicks off async board-grade generation. Board-grade authoring is a six-pass Claude
// flow (~5–10 min) that cannot complete inside one HTTP request, so this route creates
// a run row, starts the generation in the persistent app process (fire-and-forget), and
// returns the run id immediately (202). The client polls GET /deliverables/runs/{id}.

import type { NextRequest } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { runDeliverableForTenant } from '@/lib/deliverables/orchestrator/generate-service';
import { createDeliverableRun, completeDeliverableRun } from '@/lib/deliverables/orchestrator/runs-repository';
import type { AudienceRole, DeliverableModule, OutputFormat } from '@/lib/deliverables/orchestrator/types';

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
      return Response.json({ error: 'no_tenant_key', detail: 'Active tenant has no resolvable tenant key.' }, { status: 409 });
    }
    const clientKey = ctx.clientKey;

    let body: GenerateBody;
    try {
      body = (await req.json()) as GenerateBody;
    } catch {
      return Response.json({ error: 'bad_request', detail: 'Body was not valid JSON.' }, { status: 400 });
    }

    if (!body.module || !MODULES.includes(body.module)) {
      return Response.json({ error: 'bad_request', detail: `module must be one of ${MODULES.join(', ')}.` }, { status: 400 });
    }
    const useCaseArchetype = body.useCaseArchetype?.trim();
    const deliverableType = body.deliverableType?.trim();
    const sourceArtifactRef = body.sourceArtifactRef?.trim();
    const decisionContext = body.decisionContext?.trim();
    if (!useCaseArchetype) return Response.json({ error: 'bad_request', detail: 'useCaseArchetype is required.' }, { status: 400 });
    if (!deliverableType) return Response.json({ error: 'bad_request', detail: 'deliverableType is required.' }, { status: 400 });
    if (!sourceArtifactRef) return Response.json({ error: 'bad_request', detail: 'sourceArtifactRef is required.' }, { status: 400 });
    if (!decisionContext) return Response.json({ error: 'bad_request', detail: 'decisionContext is required.' }, { status: 400 });

    // 1 · create the run row (shared state — polls may hit a different replica)
    const run = await createDeliverableRun({
      clientId: ctx.clientId,
      tenantKey: clientKey,
      userId: ctx.userId,
      module: body.module,
      archetype: useCaseArchetype,
      deliverableType,
    });

    // 2 · start generation in the persistent app process; update the run on completion.
    //     Not awaited — the HTTP response returns immediately.
    void (async () => {
      try {
        const result = await runDeliverableForTenant({
          module: body.module!,
          useCaseArchetype,
          deliverableType,
          audience: body.audience,
          decisionContext,
          clientDisplayName: body.clientDisplayName?.trim() || 'Client',
          initiativeDisplayName: body.initiativeDisplayName?.trim() || useCaseArchetype,
          sourceArtifactRef,
          evidenceQuery: body.evidenceQuery,
          outputFormats: body.outputFormats,
          ...(body.model ? { model: body.model } : {}),
          tenantClientKey: clientKey,
          clientId: ctx.clientId,
          userId: ctx.userId,
        });
        await completeDeliverableRun(run.id, result.ok
          ? { status: 'succeeded', artifactId: result.artifactId ?? null, sectionCount: result.sectionCount ?? null, retrievedEvidence: result.retrievedEvidence ?? null, warnings: result.warnings ?? [] }
          : { status: 'blocked', blockers: result.blockers ?? [], retrievedEvidence: result.retrievedEvidence ?? null, sectionCount: result.sectionCount ?? null, error: result.blockedReason ?? null });
      } catch (err) {
        await completeDeliverableRun(run.id, { status: 'failed', error: (err instanceof Error ? err.message : String(err)).slice(0, 600) }).catch(() => {});
      }
    })();

    return Response.json({ runId: run.id, status: 'running' }, { status: 202 });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      /* not a tenancy error */
    }
    console.error('[POST /api/v1/deliverables/generate]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}

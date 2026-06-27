// GET /api/v1/deliverables/runs/{runId}
//
// Poll endpoint for async board-grade generation. Returns the run status and, when
// terminal, the artifact reference (succeeded), the quality-gate blockers (blocked), or
// the error (failed). Scoped to the caller's client (tenant isolation).

import type { NextRequest } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { getDeliverableRun } from '@/lib/deliverables/orchestrator/runs-repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, ctxParam: { params: Promise<{ runId: string }> }) {
  try {
    const ctx = await requireTenancy();
    const { runId } = await ctxParam.params;
    if (!runId?.trim()) {
      return Response.json({ error: 'bad_request', detail: 'runId is required.' }, { status: 400 });
    }

    const run = await getDeliverableRun(runId, ctx.clientId);
    if (!run) {
      return Response.json({ error: 'not_found', detail: 'Run not found for this tenant.' }, { status: 404 });
    }

    return Response.json({
      runId: run.id,
      status: run.status, // 'queued' | 'running' | 'succeeded' | 'blocked' | 'failed'
      artifactId: run.artifactId,
      blobUrl: run.artifactId ? `/api/v1/artifacts/${run.artifactId}` : null,
      quality: {
        contextReadiness: run.status === 'queued' || run.status === 'running' ? 'checking' : 'checked',
        gateReadiness: run.status === 'blocked' ? 'blocked' : run.status === 'failed' ? 'not_available' : 'ready',
        goldenBarStatus:
          run.status === 'succeeded'
            ? 'Passed quality check'
            : run.status === 'blocked'
              ? 'Failed quality check'
              : run.status === 'failed'
                ? 'Blocked before quality check'
                : 'Not run',
        artifactStatus:
          run.status === 'succeeded'
            ? 'generated'
            : run.status === 'blocked'
              ? 'blocked'
              : run.status,
        evidenceCaveats: run.warnings,
        blockers: run.blockers,
      },
      sectionCount: run.sectionCount,
      retrievedEvidence: run.retrievedEvidence,
      blockers: run.blockers,
      warnings: run.warnings,
      error: run.error,
      // Live progress band: 0..100 + the pass now in flight. Queued = waiting for the
      // worker to claim it (0%); running = live percent; terminal = 100%.
      progressPct: run.status === 'queued' ? 0 : run.status === 'running' ? (run.progressPct ?? 0) : 100,
      progressLabel: run.status === 'queued' ? 'Queued — waiting for the generation worker' : run.progressLabel,
      updatedAt: run.updatedAt,
    });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      /* not a tenancy error */
    }
    console.error('[GET /api/v1/deliverables/runs/[runId]]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}

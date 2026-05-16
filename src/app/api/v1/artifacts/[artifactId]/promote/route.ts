// POST /api/v1/artifacts/:artifactId/promote
// Promote ephemeral intelligence_artifact → deliverables_v2 (one-way per §4.5).
// Creates a new deliverables_v2 row attributed to the user + links it back
// via intelligence_artifacts.promoted_to_deliverable_id.

import { NextRequest } from 'next/server';
import { getArtifact, promoteArtifact } from '@/lib/intelligence/db/artifactRepository';
import { selectDeliverableWriteAdapter } from '@/lib/data-plane/write-adapters/deliverableWriteAdapter';
import { requireTenancy, tenancyErrorResponse } from '../../../_intel-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ artifactId: string }> }) {
  try {
    const { artifactId } = await params;
    const ctx = await requireTenancy();
    const body = (await req.json()) as {
      targetProgramId?: string;
      attachmentMetadata?: Record<string, unknown>;
    };
    if (!body?.targetProgramId) {
      return Response.json({ error: 'bad_request', detail: 'targetProgramId required · use "new" to create' }, { status: 400 });
    }

    const artifact = await getArtifact(ctx, artifactId);
    if (!artifact) return Response.json({ error: 'not_found' }, { status: 404 });
    if (artifact.governanceState === 'persistent') {
      return Response.json({ error: 'already_promoted', promotedTo: artifact.promotedToDeliverableId }, { status: 409 });
    }

    // Steps 1-3 (type upsert + deliverable insert + version insert) routed
    // through the data-plane write seam (Slice 3b). On Azure they run as one
    // transaction; on Supabase they apply individually as before.
    const typeKey = `artifact_${artifact.kind}`;
    const promotionWrite = await selectDeliverableWriteAdapter().promoteToDeliverable({
      typeKey,
      artifactKind: artifact.kind,
      engagementId: body.targetProgramId,
      title: artifact.title,
      htmlContent: artifact.htmlContent,
      artifactId: artifact.id,
      attachmentMetadata: body.attachmentMetadata ?? {},
      createdByUserId: ctx.userId,
    });
    if (!promotionWrite.ok || !promotionWrite.deliverableId) {
      throw new Error(promotionWrite.error ?? 'deliverable promotion write failed');
    }
    const deliverableId = promotionWrite.deliverableId;

    // 4 · flip artifact governance
    const promoted = await promoteArtifact(ctx, artifactId, deliverableId);

    return Response.json({
      ok: true,
      artifactId,
      deliverableId,
      programId: body.targetProgramId,
      version: 'v1.0',
      governanceState: promoted.governanceState,
      catalogUrl: `/engagements/${body.targetProgramId}/deliverables/${deliverableId}`,
    });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[POST /artifacts/:id/promote]', err);
    return Response.json({ error: 'internal_error', message: (err as Error).message }, { status: 500 });
  }
}

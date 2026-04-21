// POST /api/v1/artifacts/:artifactId/promote
// Promote ephemeral intelligence_artifact → deliverables_v2 (one-way per §4.5).
// Creates a new deliverables_v2 row attributed to the user + links it back
// via intelligence_artifacts.promoted_to_deliverable_id.

import { NextRequest } from 'next/server';
import { getArtifact, promoteArtifact } from '@/lib/intelligence/db/artifactRepository';
import { getServerSupabase } from '@/lib/supabase-server';
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

    const sb = getServerSupabase();

    // 1 · ensure deliverable_types row for the artifact kind exists
    const typeKey = `artifact_${artifact.kind}`;
    await sb.from('deliverable_types').upsert(
      {
        type_key: typeKey,
        title: `${artifact.kind} (from Intelligence)`,
        description: 'Artifact promoted from Intelligence thread',
        applicable_phases: [],
        applicable_topics: [],
        template_structure: {},
        required_data_inputs: {},
        quality_rubric: {},
        generation_prompt_template: '',
        output_format: 'markdown',
        maturity: 'production',
      },
      { onConflict: 'type_key' },
    );

    // 2 · create deliverables_v2 row
    const { data: deliverable, error: dErr } = await sb
      .from('deliverables_v2')
      .insert({
        engagement_id: body.targetProgramId,
        deliverable_type_key: typeKey,
        title: artifact.title,
        status: 'draft',
        current_version: 1,
        created_by: ctx.userId,
      })
      .select('id')
      .single();
    if (dErr) throw dErr;

    // 3 · insert the artifact content as v1
    const deliverableId = (deliverable as { id: string }).id;
    await sb.from('deliverable_versions').insert({
      deliverable_id: deliverableId,
      version: 1,
      content: artifact.htmlContent,
      structured_data: {
        promoted_from_artifact_id: artifact.id,
        attachment_metadata: body.attachmentMetadata ?? {},
      },
    });

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

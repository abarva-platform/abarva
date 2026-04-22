// GET /api/v1/programs/:programId/module/:key · single module workspace state
// Returns ModuleState (view-model).

import { getModuleState, getProgramById } from '@/lib/programs/queries';
import { getServerSupabase } from '@/lib/supabase-server';
import { requireTenancy, tenancyErrorResponse } from '../../../_auth';
import type { ModuleState, ProgramModuleRow } from '@/lib/programs/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function mapStatus(
  dbStatus: ProgramModuleRow['status'],
  deliverableStatus: string | undefined,
): ModuleState['status'] {
  if (dbStatus === 'blocked') return 'blocked';
  if (dbStatus === 'skipped') return 'skipped';
  if (dbStatus === 'completed') {
    if (deliverableStatus === 'signed_off') return 'signed_off';
    if (deliverableStatus === 'in_review') return 'in_review';
    return 'signed_off';
  }
  if (dbStatus === 'in_progress') {
    if (deliverableStatus === 'in_review') return 'in_review';
    if (deliverableStatus === 'draft') return 'draft';
    return 'in_progress';
  }
  return 'not_started';
}

export async function GET(_req: Request, { params }: { params: Promise<{ programId: string; key: string }> }) {
  try {
    const { programId, key } = await params;
    const ctx = await requireTenancy();
    const program = await getProgramById(ctx, programId);
    if (!program) return Response.json({ error: 'not_found' }, { status: 404 });

    const modules = await getModuleState(ctx, programId);
    const moduleState = modules.find((m) => m.moduleKey === key);
    if (!moduleState) return Response.json({ error: 'module_not_found' }, { status: 404 });

    // Pull the active deliverable + latest version for provenance + draft content
    const sb = getServerSupabase();
    const { data: delivRow } = await sb
      .from('deliverables_v2')
      .select('id, status, current_version, title, updated_at')
      .eq('engagement_id', programId)
      .eq('deliverable_type_key', key)
      .maybeSingle();
    const deliverable = delivRow as { id: string; status: string; current_version: number; title: string; updated_at: string } | null;

    let lastEditedAt: string | undefined;
    let provenanceMap: Record<string, unknown> | null = null;
    let draftContent: string | null = null;
    if (deliverable) {
      const { data: vRow } = await sb
        .from('deliverable_versions')
        .select('content, quality_issues, generated_at')
        .eq('deliverable_id', deliverable.id)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();
      const version = vRow as { content: string; quality_issues: Record<string, unknown> | null; generated_at: string } | null;
      if (version) {
        lastEditedAt = version.generated_at;
        provenanceMap = (version.quality_issues?.provenance_map as Record<string, unknown> | null | undefined) ?? null;
        draftContent = version.content ?? null;
      }
    }

    const state: ModuleState = {
      moduleKey: moduleState.moduleKey,
      name: moduleState.moduleName,
      phase: moduleState.phaseNumber,
      status: mapStatus(moduleState.status, deliverable?.status),
      currentVersion: deliverable?.current_version,
      lastEditedAt: lastEditedAt
        ? new Date(lastEditedAt)
        : moduleState.completedAt
          ? new Date(moduleState.completedAt)
          : moduleState.startedAt
            ? new Date(moduleState.startedAt)
            : undefined,
      nexusDraftPending: !!(moduleState.state?.nexus_draft_pending),
      blockerReason: (moduleState.state?.blocker_reason as string | undefined) ?? undefined,
      deliverableIds: deliverable ? [deliverable.id] : [],
    };

    return Response.json({
      module: state,
      draftContent,
      provenanceMap,
    });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[GET /api/v1/programs/:programId/module/:key]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}

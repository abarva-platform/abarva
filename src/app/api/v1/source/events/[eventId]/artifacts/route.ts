// GET /api/v1/source/events/{eventId}/artifacts
//
// File Cabinet listing for a Source event. Tenant-scoped. Returns the current versions
// by default; ?includeHistory=1 includes superseded/retired. Optional ?group= and
// ?status= filters.

import type { NextRequest } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { listSourceArtifacts } from '@/lib/source/file-cabinet/repository';
import type { ArtifactGroup, ArtifactStatus } from '@/lib/source/file-cabinet/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GROUPS: ArtifactGroup[] = ['generated', 'upload', 'template', 'session', 'approval'];

export async function GET(req: NextRequest, ctxParam: { params: Promise<{ eventId: string }> }) {
  try {
    const ctx = await requireTenancy();
    const { eventId } = await ctxParam.params;
    if (!eventId?.trim()) {
      return Response.json({ error: 'bad_request', detail: 'eventId is required.' }, { status: 400 });
    }
    const url = new URL(req.url);
    const groupParam = url.searchParams.get('group');
    const statusParam = url.searchParams.get('status');
    const includeHistory = url.searchParams.get('includeHistory') === '1';

    const artifacts = await listSourceArtifacts(eventId, ctx.clientId, {
      includeHistory,
      ...(groupParam && GROUPS.includes(groupParam as ArtifactGroup) ? { artifactGroup: groupParam as ArtifactGroup } : {}),
      ...(statusParam ? { status: statusParam as ArtifactStatus } : {}),
    });

    // group for the File Cabinet UI
    const grouped: Record<string, typeof artifacts> = { generated: [], upload: [], template: [], session: [], approval: [] };
    for (const a of artifacts) (grouped[a.artifactGroup] ??= []).push(a);

    return Response.json({
      sourceEventId: eventId,
      count: artifacts.length,
      includeHistory,
      artifacts,
      grouped,
    });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      /* not a tenancy error */
    }
    console.error('[GET /api/v1/source/events/[eventId]/artifacts]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}

// GET /api/v1/source/events/{eventId}/artifacts
//
// File Cabinet listing for a Source event. Tenant-scoped. Returns the current versions
// by default; ?includeHistory=1 includes superseded/retired. Optional ?group= and
// ?status= filters.

import type { NextRequest } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { artifactDisplayName } from '@/lib/source/artifact-display-names';
import { listArtifactStatesForEvent } from '@/lib/source/canvas-substrate/queries';
import { specByCode } from '@/lib/source/canonical-specs';
import { listSourceArtifacts } from '@/lib/source/file-cabinet/repository';
import type { ArtifactGroup, ArtifactStatus, SourceArtifactRecord } from '@/lib/source/file-cabinet/types';

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
    const generatedStateArtifacts = await listGeneratedArtifactStateFallbacks({
      sourceEventId: eventId,
      clientId: ctx.clientId,
      tenantKey: ctx.clientKey ?? ctx.clientId,
      existingArtifacts: artifacts,
      includeHistory,
      groupParam,
      statusParam,
    });
    const visibleArtifacts = [...artifacts, ...generatedStateArtifacts];

    // group for the File Cabinet UI
    const grouped: Record<string, typeof visibleArtifacts> = { generated: [], upload: [], template: [], session: [], approval: [] };
    for (const a of visibleArtifacts) (grouped[a.artifactGroup] ??= []).push(a);

    return Response.json({
      sourceEventId: eventId,
      count: visibleArtifacts.length,
      includeHistory,
      artifacts: visibleArtifacts,
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

async function listGeneratedArtifactStateFallbacks(args: {
  sourceEventId: string;
  clientId: string;
  tenantKey: string;
  existingArtifacts: SourceArtifactRecord[];
  includeHistory: boolean;
  groupParam: string | null;
  statusParam: string | null;
}): Promise<SourceArtifactRecord[]> {
  if (args.groupParam && args.groupParam !== 'generated') return [];
  const existingIds = new Set(args.existingArtifacts.map((artifact) => artifact.id));
  const existingSourceBasis = new Set(
    args.existingArtifacts
      .map((artifact) => artifact.sourceBasis)
      .filter((basis): basis is string => Boolean(basis)),
  );
  const states = await listArtifactStatesForEvent(args.sourceEventId);
  const fallbackArtifacts: SourceArtifactRecord[] = [];
  for (const state of states) {
    if (!state.linkedArtifactId) continue;
    if (existingIds.has(state.linkedArtifactId)) continue;
    if (existingSourceBasis.has(`source_event_artifact_states:${state.id}`)) continue;
    if (!args.includeHistory && state.status === 'superseded') continue;
    const spec = specByCode(state.artifactCode);
    const status = mapArtifactStateStatus(state.status);
    if (args.statusParam && args.statusParam !== status) continue;
    const title = artifactDisplayName(state.artifactCode, spec?.name);
    const updatedAt = state.bodyUpdatedAt ?? state.updatedAt;
    fallbackArtifacts.push({
      id: state.linkedArtifactId,
      clientId: args.clientId,
      tenantKey: args.tenantKey,
      sourceEventId: args.sourceEventId,
      sourcingStage: state.stage,
      artifactGroup: 'generated',
      artifactType: state.artifactCode,
      artifactFamily: state.family,
      title,
      description: spec?.description ?? 'Generated Source deliverable.',
      fileName: `${state.artifactCode}.md`,
      fileFormat: 'md',
      blobContainer: 'source-artifacts',
      blobPath: `inline://source-event-artifact-state/${state.id}`,
      fileSize: state.body ? Buffer.byteLength(state.body, 'utf8') : null,
      version: 1,
      status,
      generatedBy: state.bodyAuthoredBy,
      generatedAt: updatedAt,
      sourceBasis: `source_event_artifact_states:${state.id}`,
      confidence: null,
      citationReady: Boolean(state.body?.trim()),
      evidenceFamiliesUsed: [],
      sourceRegisterId: state.linkedArtifactId,
      contextBundleTraceId: null,
      approvalState: null,
      approvedBy: null,
      approvedAt: null,
      maestroOverrideId: null,
      missingInputs: [],
      clientCompleteItems: [],
      assumptions: [],
      supersedesArtifactId: null,
      supersededByArtifactId: null,
      lifecycleState: state.status === 'superseded' ? 'superseded' : 'current',
      blobSha256: null,
      isClientFinal: false,
      isCurrentAuthoritative: false,
      sourceGeneratedArtifactId: null,
      clientFinalUploadedBy: null,
      clientFinalUploadedAt: null,
      clientFinalAcceptedBy: null,
      clientFinalAcceptedAt: null,
      clientFinalNote: null,
      clientFinalReviewMeetingDate: null,
      clientFinalStakeholderGroup: null,
      clientFinalChangeSummary: {},
      createdAt: state.createdAt,
      updatedAt: state.updatedAt,
    });
  }
  return fallbackArtifacts;
}

function mapArtifactStateStatus(status: string): ArtifactStatus {
  if (status === 'approved' || status === 'locked') return 'approved';
  if (status === 'superseded') return 'superseded';
  if (status === 'needs_review') return 'preliminary';
  if (status === 'drafting') return 'draft';
  return 'draft';
}

// POST /api/v1/source/:eventId/artifacts/:artifactCode/accept
//
// Body: { approvalRationale: string, contentDriftStatus?, gatePreconditionStatus?,
//         downstreamContextPolicy?, diffSummary? }
//
// SOURCE-SHELL-004 — records an explicit, auditable "accept this artifact as
// authoritative" action, independent of the stage GATE (see
// /api/v1/source/events/:eventId/approve for that). Append-only: this route
// never updates an existing row, it inserts a new source_artifact_acceptances
// row. `artifactState` and `artifactRole` are computed server-side from the
// real persisted artifact record — never trusted from the client — so an
// acceptance record always reflects what the artifact genuinely was at
// accept time, not what a caller claims.
//
// Auth: requireTenancy + canUploadSourceArtifacts — same gate the status
// route uses. Accepting an artifact is a stronger claim than flipping its
// status, but this repo's pilot-mode gate model treats both as
// upload-rights-level actions (see Memory · Gate self-approval model);
// stage-gate approval itself stays behind the separate, stricter
// canApproveSourceStages check on the approve route.

import { getAzureReadFluentClient } from '@/lib/data-plane/postgresCompat';
import type { NextRequest } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { getActiveClientRow } from '@/lib/active-client';
import { getCurrentUser } from '@/lib/auth/current-user';
import { CANONICAL_CLIENT_ADMIN_EMAILS } from '@/lib/auth/canonical-auth-roster';
import { loadUserSourceAccessPolicy } from '@/lib/auth/source-access-policy';
import { inferClientKeyFromEmail, isClientKey } from '@/lib/client-config';
import type { SourceEventArtifactStateRow } from '@/lib/source/canvas-substrate/types';
import { scaffoldNewEventSubstrate } from '@/lib/source/queries';
import { deriveSourceArtifactGovernanceStage } from '@/lib/source/artifact-governance';
import { specByCode } from '@/lib/source/canonical-specs/artifact-specs';
import {
  insertArtifactAcceptance,
  type ArtifactContentDriftStatus,
  type ArtifactDownstreamContextPolicy,
  type ArtifactGatePreconditionStatus,
} from '@/lib/source/artifact-acceptances';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ eventId: string; artifactCode: string }> };

interface SourceArtifactGovernanceRow {
  id: string;
  status: string | null;
  lifecycle_state: string | null;
  approval_state: string | null;
  approved_by: string | null;
}

const DRIFT_STATUSES: ArtifactContentDriftStatus[] = ['current', 'stale', 'unknown'];
const GATE_PRECONDITION_STATUSES: ArtifactGatePreconditionStatus[] = [
  'not_ready',
  'ready',
  'waived',
];
const CONTEXT_POLICIES: ArtifactDownstreamContextPolicy[] = [
  'include',
  'exclude',
  'restricted',
];

function isOneOf<T extends string>(allowed: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

function isCanonicalClientAdminEmail(email: string | null | undefined): boolean {
  const normalized = email?.trim().toLowerCase() ?? '';
  return CANONICAL_CLIENT_ADMIN_EMAILS.includes(
    normalized as (typeof CANONICAL_CLIENT_ADMIN_EMAILS)[number],
  );
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(req: NextRequest, { params }: RouteCtx) {
  let tenancy;
  let tenancyError: unknown = null;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    tenancyError = err;
  }

  try {
    const { eventId, artifactCode } = await params;
    const [activeClient, currentUser] = await Promise.all([
      getActiveClientRow().catch(() => null),
      getCurrentUser().catch(() => null),
    ]);

    const body = (await req.json().catch(() => null)) as
      | {
          approvalRationale?: unknown;
          contentDriftStatus?: unknown;
          gatePreconditionStatus?: unknown;
          downstreamContextPolicy?: unknown;
          diffSummary?: unknown;
        }
      | null;

    const approvalRationale =
      typeof body?.approvalRationale === 'string' ? body.approvalRationale.trim() : '';
    if (!approvalRationale) {
      return Response.json(
        { error: 'bad_request', detail: 'approvalRationale is required.' },
        { status: 400 },
      );
    }
    const contentDriftStatus = isOneOf(DRIFT_STATUSES, body?.contentDriftStatus)
      ? body.contentDriftStatus
      : 'unknown';
    const gatePreconditionStatus = isOneOf(
      GATE_PRECONDITION_STATUSES,
      body?.gatePreconditionStatus,
    )
      ? body.gatePreconditionStatus
      : 'not_ready';
    const downstreamContextPolicy = isOneOf(CONTEXT_POLICIES, body?.downstreamContextPolicy)
      ? body.downstreamContextPolicy
      : 'restricted';
    const diffSummary =
      typeof body?.diffSummary === 'string' && body.diffSummary.trim().length > 0
        ? body.diffSummary.trim()
        : null;

    const supabase = getAzureReadFluentClient();
    const eventQuery = supabase.from('source_events').select('id, client_key');
    const { data: persistedEvent, error: fetchError } = isUuid(eventId)
      ? await eventQuery.eq('id', eventId).maybeSingle()
      : { data: null, error: null };
    if (fetchError) {
      return Response.json({ error: 'lookup_failed', detail: fetchError.message }, { status: 500 });
    }
    if (!persistedEvent) {
      return Response.json(
        { error: 'not_found', detail: `No source event with id ${eventId}` },
        { status: 404 },
      );
    }

    const fallbackClientKey =
      (isClientKey(currentUser?.metadataClientKey) ? currentUser.metadataClientKey : null) ??
      inferClientKeyFromEmail(currentUser?.email);
    const effectiveClientKey = activeClient?.key ?? fallbackClientKey;
    if (!effectiveClientKey) {
      if (tenancyError) return tenancyErrorResponse(tenancyError);
      return Response.json(
        { error: 'no_client', detail: 'No active client for Source artifact mutation' },
        { status: 403 },
      );
    }
    if (persistedEvent.client_key !== effectiveClientKey) {
      return Response.json(
        { error: 'not_found', detail: `No source event with id ${eventId}` },
        { status: 404 },
      );
    }

    await scaffoldNewEventSubstrate(persistedEvent.id, persistedEvent.client_key).catch(
      (error) => {
        console.warn(
          '[source artifact accept] substrate scaffold repair failed:',
          error instanceof Error ? error.message : String(error),
        );
      },
    );

    const accessPolicy =
      tenancy && activeClient
        ? await loadUserSourceAccessPolicy(tenancy, {
            activeClientKey: activeClient.key,
            sourceEventId: persistedEvent.id,
          }).catch(() => null)
        : null;
    const canonicalAdminFallbackAllowed =
      !activeClient &&
      isCanonicalClientAdminEmail(currentUser?.email) &&
      persistedEvent.client_key === effectiveClientKey;
    const canMutate = Boolean(
      accessPolicy?.canUploadSourceArtifacts || canonicalAdminFallbackAllowed,
    );
    if (!canMutate) {
      return Response.json(
        {
          error: 'forbidden',
          detail: 'Source artifact upload rights are required to accept an artifact.',
        },
        { status: 403 },
      );
    }

    // Locate the per-event artifact slot, then the real artifact row it
    // links to — same lookup the status route uses, one hop further.
    const { data: artifactRow, error: artifactFetchError } = await supabase
      .from('source_event_artifact_states')
      .select('*')
      .eq('source_event_id', persistedEvent.id)
      .eq('artifact_code', artifactCode)
      .maybeSingle<SourceEventArtifactStateRow>();
    if (artifactFetchError) {
      return Response.json(
        { error: 'lookup_failed', detail: artifactFetchError.message },
        { status: 500 },
      );
    }
    if (!artifactRow) {
      return Response.json(
        {
          error: 'artifact_not_found',
          detail: `No artifact ${artifactCode} on event ${persistedEvent.id}.`,
        },
        { status: 404 },
      );
    }
    if (!artifactRow.linked_artifact_id) {
      return Response.json(
        {
          error: 'no_content_to_accept',
          detail: `Artifact ${artifactCode} has no uploaded or generated content yet — nothing to accept.`,
        },
        { status: 409 },
      );
    }

    const { data: sourceArtifactRow, error: sourceArtifactError } = await supabase
      .from('source_artifacts')
      .select('id, status, lifecycle_state, approval_state, approved_by')
      .eq('id', artifactRow.linked_artifact_id)
      .maybeSingle<SourceArtifactGovernanceRow>();
    if (sourceArtifactError || !sourceArtifactRow) {
      return Response.json(
        {
          error: 'artifact_record_not_found',
          detail: `Linked artifact ${artifactRow.linked_artifact_id} could not be read.`,
        },
        { status: 404 },
      );
    }

    const artifactState = deriveSourceArtifactGovernanceStage({
      status: sourceArtifactRow.status,
      isClientFinal: sourceArtifactRow.status === 'client_final',
      lifecycleState: sourceArtifactRow.lifecycle_state,
      approvalState: sourceArtifactRow.approval_state,
      approvedBy: sourceArtifactRow.approved_by,
    });
    const artifactRole: 'authoritative' | 'evidence' = specByCode(artifactCode)?.gateDefining
      ? 'authoritative'
      : 'evidence';

    const write = await insertArtifactAcceptance({
      artifactId: sourceArtifactRow.id,
      eventId: persistedEvent.id,
      stageKey: artifactRow.stage_key,
      artifactState,
      authoritativeVersionId: sourceArtifactRow.id,
      artifactRole,
      contentDriftStatus,
      gatePreconditionStatus,
      downstreamContextPolicy,
      diffSummary,
      approvalRationale,
      acceptedBy: tenancy?.userId ?? currentUser?.clerkUserId ?? 'unknown',
    });
    if (!write.ok) {
      return Response.json({ error: 'insert_failed', detail: write.error }, { status: 500 });
    }

    return Response.json({ ok: true, acceptance: write.record });
  } catch (err) {
    console.error('[POST /api/v1/source/:eventId/artifacts/:artifactCode/accept]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}

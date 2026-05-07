// PATCH /api/v1/source/:eventId/artifacts/:artifactCode/status
//
// Body: { status: SourceEventArtifactStatus }
//
// Updates the per-event artifact status on the canvas. Used by the
// Document tab's "Mark complete" / status pill so a sourcing lead can
// checkpoint their work artifact-by-artifact rather than waiting for
// the coarse-grained Promote-stage button.
//
// Auth: requireTenancy + canUploadSourceArtifacts (any user with
// upload rights can also flip status). Canonical client admins fall
// through if no participant row is present.
//
// Per Memory · Gate self-approval model: any source-access user can
// self-approve gates in pilot mode. Marking an individual artifact
// complete is a strictly weaker action than gate approval, so we use
// the same upload-rights gate.

import type { NextRequest } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { getActiveClientRow } from '@/lib/active-client';
import { getCurrentUser } from '@/lib/auth/current-user';
import { CANONICAL_CLIENT_ADMIN_EMAILS } from '@/lib/auth/canonical-auth-roster';
import { loadUserSourceAccessPolicy } from '@/lib/auth/source-access-policy';
import { getServerSupabase } from '@/lib/supabase-server';
import { inferClientKeyFromEmail, isClientKey } from '@/lib/client-config';
import {
  artifactStateRowToView,
  type SourceEventArtifactState,
  type SourceEventArtifactStateRow,
  type SourceEventArtifactStatus,
} from '@/lib/source/canvas-substrate/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ eventId: string; artifactCode: string }> };

const ALLOWED_STATUSES: SourceEventArtifactStatus[] = [
  'not_started',
  'drafting',
  'needs_review',
  'approved',
  'locked',
  'superseded',
];

function isAllowedStatus(value: unknown): value is SourceEventArtifactStatus {
  return typeof value === 'string' && (ALLOWED_STATUSES as string[]).includes(value);
}

function isCanonicalClientAdminEmail(email: string | null | undefined): boolean {
  const normalized = email?.trim().toLowerCase() ?? '';
  return CANONICAL_CLIENT_ADMIN_EMAILS.includes(
    normalized as (typeof CANONICAL_CLIENT_ADMIN_EMAILS)[number],
  );
}

export async function PATCH(req: NextRequest, { params }: RouteCtx) {
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

    const body = (await req.json().catch(() => null)) as { status?: unknown } | null;
    const status = body?.status;
    if (!isAllowedStatus(status)) {
      return Response.json(
        {
          error: 'bad_request',
          detail: `status must be one of: ${ALLOWED_STATUSES.join(', ')}`,
        },
        { status: 400 },
      );
    }

    const supabase = getServerSupabase();
    const { data: persistedEvent, error: fetchError } = await supabase
      .from('source_events')
      .select('id, client_key')
      .eq('id', eventId)
      .maybeSingle();
    if (fetchError) {
      return Response.json(
        { error: 'lookup_failed', detail: fetchError.message },
        { status: 500 },
      );
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

    const accessPolicy =
      tenancy && activeClient
        ? await loadUserSourceAccessPolicy(tenancy, {
            activeClientKey: activeClient.key,
            sourceEventId: eventId,
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
          detail: 'Source artifact upload rights are required to update artifact status.',
        },
        { status: 403 },
      );
    }

    // Locate the per-event artifact row.
    const { data: artifactRow, error: artifactFetchError } = await supabase
      .from('source_event_artifact_states')
      .select('*')
      .eq('source_event_id', eventId)
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
          detail: `No artifact ${artifactCode} on event ${eventId}. Run db:backfill:source-canvas to scaffold.`,
        },
        { status: 404 },
      );
    }

    // Locked / superseded artifacts are terminal — refuse to flip them
    // back to drafting from the canvas. Admins can edit the row
    // directly if needed.
    if (
      (artifactRow.status === 'locked' || artifactRow.status === 'superseded') &&
      status !== artifactRow.status
    ) {
      return Response.json(
        {
          error: 'terminal_state',
          detail: `Artifact ${artifactCode} is ${artifactRow.status}; cannot transition to ${status} from the canvas.`,
        },
        { status: 409 },
      );
    }

    const { data: updatedRow, error: updateError } = await supabase
      .from('source_event_artifact_states')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', artifactRow.id)
      .select('*')
      .single<SourceEventArtifactStateRow>();
    if (updateError) {
      return Response.json(
        { error: 'update_failed', detail: updateError.message },
        { status: 500 },
      );
    }

    const view: SourceEventArtifactState = artifactStateRowToView(updatedRow);
    return Response.json({ ok: true, artifact: view });
  } catch (err) {
    console.error(
      '[PATCH /api/v1/source/:eventId/artifacts/:artifactCode/status]',
      err,
    );
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}

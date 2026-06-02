// PATCH /api/v1/source/:eventId/artifacts/:artifactCode/body
//
// Body: { body: string, format?: 'markdown' | 'html' | 'plain' }
//
// Persists per-event inline-authored artifact content. Distinct from
// the status endpoint (sibling /status route): status is a workflow
// flag, body is the actual document content. Until this endpoint
// existed the canvas Document tab was display-only — `Mark complete`
// flipped a pill but nothing was authored.
//
// Auth: requireTenancy + canUploadSourceArtifacts (same gate as
// status flips and the file-upload endpoint).

import type { NextRequest } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { getActiveClientRow } from '@/lib/active-client';
import { getCurrentUser } from '@/lib/auth/current-user';
import { CANONICAL_CLIENT_ADMIN_EMAILS } from '@/lib/auth/canonical-auth-roster';
import { loadUserSourceAccessPolicy } from '@/lib/auth/source-access-policy';
import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import { inferClientKeyFromEmail, isClientKey } from '@/lib/client-config';
import { getSourcingEvent } from '@/lib/source/queries';
import {
  artifactStateRowToView,
  type SourceEventArtifactState,
  type SourceEventArtifactStateRow,
} from '@/lib/source/canvas-substrate/types';
import type { SourcingEventDetail } from '@/lib/source/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ eventId: string; artifactCode: string }> };

const ALLOWED_FORMATS = ['markdown', 'html', 'plain'] as const;
type AllowedFormat = (typeof ALLOWED_FORMATS)[number];

function isAllowedFormat(value: unknown): value is AllowedFormat {
  return typeof value === 'string' && (ALLOWED_FORMATS as readonly string[]).includes(value);
}

const MAX_BODY_BYTES = 256 * 1024; // 256 KiB cap; rejects accidental megabyte pastes.

function isCanonicalClientAdminEmail(email: string | null | undefined): boolean {
  const normalized = email?.trim().toLowerCase() ?? '';
  return CANONICAL_CLIENT_ADMIN_EMAILS.includes(
    normalized as (typeof CANONICAL_CLIENT_ADMIN_EMAILS)[number],
  );
}

function sourceEventNotFoundResponse() {
  return Response.json({ error: 'not_found' }, { status: 404 });
}

async function resolveArtifactBodyAccess(eventId: string): Promise<
  | {
      ok: true;
      event: SourcingEventDetail;
      currentUser: Awaited<ReturnType<typeof getCurrentUser>> | null;
      canMutate: boolean;
    }
  | { ok: false; response: Response }
> {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    return { ok: false, response: tenancyErrorResponse(err) };
  }

  const [event, activeClient, currentUser] = await Promise.all([
    getSourcingEvent(eventId).catch((err) => {
      console.error('[source artifact body] event lookup failed', err);
      return null;
    }),
    getActiveClientRow().catch(() => null),
    getCurrentUser().catch(() => null),
  ]);

  if (!event) {
    return { ok: false, response: sourceEventNotFoundResponse() };
  }

  const fallbackClientKey =
    (isClientKey(currentUser?.metadataClientKey) ? currentUser.metadataClientKey : null) ??
    inferClientKeyFromEmail(currentUser?.email);
  const effectiveClientKey = activeClient?.key ?? fallbackClientKey;
  if (!effectiveClientKey) {
    return {
      ok: false,
      response: Response.json(
        { error: 'no_client', detail: 'No active client for Source artifact body access' },
        { status: 403 },
      ),
    };
  }

  const accessPolicy = await loadUserSourceAccessPolicy(tenancy, {
    activeClientKey: effectiveClientKey,
    sourceEventId: event.id,
  }).catch(() => null);
  const canonicalAdminFallbackAllowed =
    !activeClient &&
    isCanonicalClientAdminEmail(currentUser?.email) &&
    fallbackClientKey === effectiveClientKey;
  const canMutate = Boolean(
    accessPolicy?.canUploadSourceArtifacts || canonicalAdminFallbackAllowed,
  );

  return { ok: true, event, currentUser, canMutate };
}

async function loadArtifactRow(eventId: string, artifactCode: string) {
  const supabase = getAzureWriteFluentClient();
  return supabase
    .from('source_event_artifact_states')
    .select('*')
    .eq('source_event_id', eventId)
    .eq('artifact_code', artifactCode)
    .maybeSingle<SourceEventArtifactStateRow>();
}

export async function GET(_req: NextRequest, { params }: RouteCtx) {
  try {
    const { eventId, artifactCode } = await params;
    const access = await resolveArtifactBodyAccess(eventId);
    if (!access.ok) return access.response;

    const { data: artifactRow, error: artifactFetchError } = await loadArtifactRow(
      access.event.id,
      artifactCode,
    );
    if (artifactFetchError) {
      return Response.json(
        { error: 'lookup_failed', detail: artifactFetchError.message },
        { status: 500 },
      );
    }
    if (!artifactRow) {
      return Response.json({ error: 'artifact_not_found' }, { status: 404 });
    }

    return Response.json({
      ok: true,
      artifact: artifactStateRowToView(artifactRow),
    });
  } catch (err) {
    console.error('[GET /api/v1/source/:eventId/artifacts/:artifactCode/body]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  try {
    const { eventId, artifactCode } = await params;
    const access = await resolveArtifactBodyAccess(eventId);
    if (!access.ok) return access.response;
    if (!access.canMutate) {
      return Response.json(
        {
          error: 'forbidden',
          detail: 'Source artifact upload rights are required to author artifact bodies.',
        },
        { status: 403 },
      );
    }
    const { currentUser } = access;

    const payload = (await req.json().catch(() => null)) as
      | { body?: unknown; format?: unknown }
      | null;

    if (typeof payload?.body !== 'string') {
      return Response.json(
        { error: 'bad_request', detail: 'body must be a string (use empty string to clear).' },
        { status: 400 },
      );
    }
    const body = payload.body;
    if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) {
      return Response.json(
        {
          error: 'body_too_large',
          detail: `body exceeds ${MAX_BODY_BYTES} bytes; use the file-upload endpoint for larger documents.`,
        },
        { status: 413 },
      );
    }
    const format: AllowedFormat = isAllowedFormat(payload?.format) ? payload.format : 'markdown';

    const supabase = getAzureWriteFluentClient();
    const { data: artifactRow, error: artifactFetchError } = await loadArtifactRow(
      access.event.id,
      artifactCode,
    );
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
          detail: `No artifact ${artifactCode} on event ${eventId}.`,
        },
        { status: 404 },
      );
    }
    if (artifactRow.status === 'locked' || artifactRow.status === 'superseded') {
      return Response.json(
        {
          error: 'terminal_state',
          detail: `Artifact ${artifactCode} is ${artifactRow.status}; body cannot be edited.`,
        },
        { status: 409 },
      );
    }

    // Empty body clears the column → falls back to template.
    const trimmed = body.trim();
    const nowIso = new Date().toISOString();
    const existingGenerationMetadata =
      artifactRow.body_generation_metadata && typeof artifactRow.body_generation_metadata === 'object'
        ? artifactRow.body_generation_metadata
        : null;
    const update: Partial<SourceEventArtifactStateRow> = {
      body: trimmed.length === 0 ? null : body,
      body_format: format,
      body_authored_by: currentUser?.clerkUserId ?? null,
      body_updated_at: nowIso,
      body_generation_metadata:
        trimmed.length > 0 && existingGenerationMetadata
          ? {
              ...existingGenerationMetadata,
              humanEditedAt: nowIso,
              humanEditedByUserId: currentUser?.clerkUserId ?? null,
            }
          : existingGenerationMetadata,
      updated_at: nowIso,
    };
    // Authoring real content moves the tier off `stub` automatically —
    // a stub artifact is one with no per-event content. Keep richer
    // tiers (outline / rich) intact.
    if (trimmed.length > 0 && artifactRow.tier === 'stub') {
      update.tier = 'outline';
    }

    const { data: updatedRow, error: updateError } = await supabase
      .from('source_event_artifact_states')
      .update(update)
      .eq('id', artifactRow.id)
      .select('*')
      .single<SourceEventArtifactStateRow>();
    if (updateError) {
      return Response.json(
        { error: 'update_failed', detail: updateError.message },
        { status: 500 },
      );
    }
    if (!updatedRow) {
      return Response.json(
        { error: 'update_failed', detail: 'No artifact row returned after update.' },
        { status: 500 },
      );
    }

    const view: SourceEventArtifactState = artifactStateRowToView(updatedRow);
    return Response.json({ ok: true, artifact: view });
  } catch (err) {
    console.error(
      '[PATCH /api/v1/source/:eventId/artifacts/:artifactCode/body]',
      err,
    );
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}

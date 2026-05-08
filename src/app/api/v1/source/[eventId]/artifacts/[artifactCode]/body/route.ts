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
import { getServerSupabase } from '@/lib/supabase-server';
import { inferClientKeyFromEmail, isClientKey } from '@/lib/client-config';
import {
  artifactStateRowToView,
  type SourceEventArtifactState,
  type SourceEventArtifactStateRow,
} from '@/lib/source/canvas-substrate/types';

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
        { error: 'no_client', detail: 'No active client for Source artifact body mutation' },
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
          detail: 'Source artifact upload rights are required to author artifact bodies.',
        },
        { status: 403 },
      );
    }

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
    const update: Partial<SourceEventArtifactStateRow> = {
      body: trimmed.length === 0 ? null : body,
      body_format: format,
      body_authored_by: currentUser?.clerkUserId ?? null,
      body_updated_at: nowIso,
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

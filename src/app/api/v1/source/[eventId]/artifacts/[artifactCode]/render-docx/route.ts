// GET /api/v1/source/:eventId/artifacts/:artifactCode/render-docx
//
// Builds a docx file for the given artifact + event, binding context
// from the canvas substrate (event metadata + authored / scaffold
// markdown body), and streams the bytes back as an attachment download.
//
// Slice 3.1 shipped d05 Scope Memo. Slice 3.2 adds d09 RFP Package,
// d24 Atlas Decision Brief, d27 Selection Memo — all narrative
// markdown bodies that share the same renderer + binder pattern.
//
// Auth: same gate as render-xlsx (requireTenancy +
// canUploadSourceArtifacts | canGenerateSourcingArtifacts | canonical-
// admin fallback).

import type { NextRequest } from 'next/server';
import { Packer } from 'docx';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { getActiveClientRow } from '@/lib/active-client';
import { getCurrentUser } from '@/lib/auth/current-user';
import { CANONICAL_CLIENT_ADMIN_EMAILS } from '@/lib/auth/canonical-auth-roster';
import { loadUserSourceAccessPolicy } from '@/lib/auth/source-access-policy';
import { buildSourceGenerationContext } from '@/lib/source/agent-generation/server';
import {
  DOCX_CONTENT_TYPE,
  isDocxGeneratable,
  renderArtifactDocx,
} from '@/lib/source/exports';
import { buildNarrativeDocxPayloadFromContext } from '@/lib/source/exports/payloads/narrative-docx-payload';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type RouteCtx = { params: Promise<{ eventId: string; artifactCode: string }> };

function isCanonicalClientAdminEmail(email: string | null | undefined): boolean {
  const normalized = email?.trim().toLowerCase() ?? '';
  return CANONICAL_CLIENT_ADMIN_EMAILS.includes(
    normalized as (typeof CANONICAL_CLIENT_ADMIN_EMAILS)[number],
  );
}

export async function GET(_req: NextRequest, { params }: RouteCtx) {
  let tenancy;
  let tenancyError: unknown = null;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    tenancyError = err;
  }

  const { eventId, artifactCode } = await params;

  if (!isDocxGeneratable(artifactCode)) {
    return Response.json(
      {
        error: 'unsupported_artifact',
        detail: `docx generation is not yet wired for ${artifactCode}.`,
      },
      { status: 404 },
    );
  }

  const ctx = await buildSourceGenerationContext(eventId);
  if (!ctx) {
    return Response.json(
      { error: 'not_found', detail: `No source event with slug ${eventId}` },
      { status: 404 },
    );
  }

  const [activeClient, currentUser] = await Promise.all([
    getActiveClientRow().catch(() => null),
    getCurrentUser().catch(() => null),
  ]);
  const accessPolicy =
    tenancy && activeClient
      ? await loadUserSourceAccessPolicy(tenancy, {
          activeClientKey: activeClient.key,
          sourceEventId: ctx.event.id,
        }).catch(() => null)
      : null;
  const canonicalAdminFallbackAllowed =
    !activeClient && isCanonicalClientAdminEmail(currentUser?.email);
  const canExport = Boolean(
    accessPolicy?.canUploadSourceArtifacts ||
      accessPolicy?.canGenerateSourcingArtifacts ||
      canonicalAdminFallbackAllowed,
  );
  if (!canExport) {
    if (tenancyError) return tenancyErrorResponse(tenancyError);
    return Response.json(
      {
        error: 'forbidden',
        detail: 'Source artifact rights are required to export docx documents.',
      },
      { status: 403 },
    );
  }

  // Build payload + render. All narrative artifacts (d05/d09/d24/d27)
  // share the same payload shape — they only differ in the cover-block
  // config that the renderer dispatcher applies.
  const generatedAt = new Date().toISOString();
  let document;
  try {
    const payload = buildNarrativeDocxPayloadFromContext(
      ctx,
      artifactCode,
      generatedAt,
    );
    document = await renderArtifactDocx({ artifactCode, payload });
  } catch (err) {
    console.error(
      '[GET /api/v1/source/:eventId/artifacts/:artifactCode/render-docx] renderer error',
      err,
    );
    return Response.json(
      {
        error: 'render_failed',
        detail: err instanceof Error ? err.message : 'docx renderer failed',
      },
      { status: 500 },
    );
  }

  const buffer = await Packer.toBuffer(document);
  const filename = `${artifactCode}__${ctx.event.code}__${generatedAt.slice(0, 10)}.docx`;
  return new Response(buffer as unknown as ArrayBuffer, {
    status: 200,
    headers: {
      'content-type': DOCX_CONTENT_TYPE,
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'no-store',
      'x-source-artifact-code': artifactCode,
      'x-source-event-code': ctx.event.code,
      'x-source-artifact-format': 'docx',
    },
  });
}

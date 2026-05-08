// GET /api/v1/source/:eventId/artifacts/:artifactCode/render-html
//
// Returns a self-contained HTML document for an authored narrative
// artifact (d05 / d09 / d24 / d27). Companion to render-docx — same
// payload binder, different output format.
//
// Unlike render-xlsx and render-docx, this route does NOT set
// Content-Disposition: attachment — the browser renders the HTML in-
// place when the user clicks the canvas "View HTML" anchor. Easier
// for distribution (signed share link in a future slice) than the
// download-only artifact formats.
//
// Auth: same gate as the other render-* routes.

import type { NextRequest } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { getActiveClientRow } from '@/lib/active-client';
import { getCurrentUser } from '@/lib/auth/current-user';
import { CANONICAL_CLIENT_ADMIN_EMAILS } from '@/lib/auth/canonical-auth-roster';
import { loadUserSourceAccessPolicy } from '@/lib/auth/source-access-policy';
import { buildSourceGenerationContext } from '@/lib/source/agent-generation/server';
import {
  HTML_CONTENT_TYPE,
  isHtmlGeneratable,
  renderArtifactHtml,
} from '@/lib/source/exports';
import { buildNarrativeDocxPayloadFromContext } from '@/lib/source/exports/payloads/narrative-docx-payload';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

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

  if (!isHtmlGeneratable(artifactCode)) {
    return Response.json(
      {
        error: 'unsupported_artifact',
        detail: `HTML rendering is not yet wired for ${artifactCode}.`,
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
        detail: 'Source artifact rights are required to render HTML documents.',
      },
      { status: 403 },
    );
  }

  const generatedAt = new Date().toISOString();
  let html: string;
  try {
    const payload = buildNarrativeDocxPayloadFromContext(
      ctx,
      artifactCode,
      generatedAt,
    );
    html = renderArtifactHtml({ artifactCode, payload });
  } catch (err) {
    console.error(
      '[GET /api/v1/source/:eventId/artifacts/:artifactCode/render-html] renderer error',
      err,
    );
    return Response.json(
      {
        error: 'render_failed',
        detail: err instanceof Error ? err.message : 'HTML renderer failed',
      },
      { status: 500 },
    );
  }

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': HTML_CONTENT_TYPE,
      'cache-control': 'no-store',
      'x-source-artifact-code': artifactCode,
      'x-source-event-code': ctx.event.code,
      'x-source-artifact-format': 'html',
      // Strict CSP — no scripts, no remote assets. Keeps the rendered
      // HTML safe to share even when a vendor opens it in a third-party
      // viewer.
      'content-security-policy':
        "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; font-src 'self' data:;",
      'x-content-type-options': 'nosniff',
    },
  });
}

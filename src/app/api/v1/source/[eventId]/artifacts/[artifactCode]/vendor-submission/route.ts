// POST /api/v1/source/:eventId/artifacts/:artifactCode/vendor-submission
//
// Accepts a vendor's filled-in copy of the d19a Pricing Template xlsx,
// parses it server-side, and persists a structured submission row.
// Slice 2c.2 of the pricing-normalization workflow.
//
// Multipart body:
//   - file:        the xlsx (required)
//   - vendorName:  optional override; otherwise pulled from Cover sheet
//
// Auth: same gate as render-xlsx + render-comparison-xlsx
// (canUploadSourceArtifacts is the more relevant cap here, but the
// canGenerate cap is also accepted to match the existing pattern).
//
// Returns:
//   200 { id, vendorName, parseStatus, parseWarnings[], unitPriceCount,
//         deviationCount, supersededCount }
//   400 if the multipart body is malformed or no file
//   403 if auth fails
//   404 if the event slug is unknown OR artifactCode is not d19
//   500 if persistence fails

import type { NextRequest } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { getActiveClientRow } from '@/lib/active-client';
import { getCurrentUser } from '@/lib/auth/current-user';
import { CANONICAL_CLIENT_ADMIN_EMAILS } from '@/lib/auth/canonical-auth-roster';
import { loadUserSourceAccessPolicy } from '@/lib/auth/source-access-policy';
import { buildSourceGenerationContext } from '@/lib/source/agent-generation/server';
import { parseVendorPricingSubmission } from '@/lib/source/pricing-submissions/parser';
import { insertSubmission } from '@/lib/source/pricing-submissions/dao';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type RouteCtx = { params: Promise<{ eventId: string; artifactCode: string }> };

const SUPPORTED_ARTIFACT_CODES = new Set(['d19_pricing_workbook']);

function isCanonicalClientAdminEmail(email: string | null | undefined): boolean {
  const normalized = email?.trim().toLowerCase() ?? '';
  return CANONICAL_CLIENT_ADMIN_EMAILS.includes(
    normalized as (typeof CANONICAL_CLIENT_ADMIN_EMAILS)[number],
  );
}

export async function POST(req: NextRequest, { params }: RouteCtx) {
  let tenancy;
  let tenancyError: unknown = null;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    tenancyError = err;
  }

  const { eventId, artifactCode } = await params;
  if (!SUPPORTED_ARTIFACT_CODES.has(artifactCode)) {
    return Response.json(
      {
        error: 'unsupported_artifact',
        detail: `Vendor submission upload is not wired for ${artifactCode}.`,
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
  const canUpload = Boolean(
    accessPolicy?.canUploadSourceArtifacts ||
      accessPolicy?.canGenerateSourcingArtifacts ||
      canonicalAdminFallbackAllowed,
  );
  if (!canUpload) {
    if (tenancyError) return tenancyErrorResponse(tenancyError);
    return Response.json(
      {
        error: 'forbidden',
        detail: 'Source artifact rights are required to upload vendor submissions.',
      },
      { status: 403 },
    );
  }

  // ── Parse multipart body ──────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (err) {
    return Response.json(
      {
        error: 'invalid_multipart',
        detail: err instanceof Error ? err.message : 'Could not parse multipart body.',
      },
      { status: 400 },
    );
  }
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return Response.json(
      { error: 'missing_file', detail: 'Expected a file field named "file".' },
      { status: 400 },
    );
  }
  const vendorNameOverride = (() => {
    const v = formData.get('vendorName');
    return typeof v === 'string' ? v : undefined;
  })();

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // ── Parse xlsx → structured submission ───────────────────────────────────
  const parseResult = await parseVendorPricingSubmission({
    bytes,
    filename: file.name,
    sourceEventId: ctx.event.id,
    tenantKey: ctx.tenantKey,
    vendorNameOverride,
    uploadedByUserId: currentUser?.clerkUserId ?? null,
  });

  // ── Persist ───────────────────────────────────────────────────────────────
  const insertResult = await insertSubmission(parseResult.insert);
  if (!insertResult.ok) {
    console.error(
      '[POST /api/v1/source/:eventId/artifacts/:artifactCode/vendor-submission] insert failed',
      insertResult,
    );
    return Response.json(
      {
        error: insertResult.error,
        detail: insertResult.detail,
      },
      { status: 500 },
    );
  }

  return Response.json(
    {
      id: insertResult.row.id,
      vendorName: insertResult.row.vendorName,
      parseStatus: insertResult.row.parseStatus,
      parseWarnings: insertResult.row.parseWarnings,
      unitPriceCount: Object.keys(insertResult.row.unitPricesById).length,
      deviationCount: insertResult.row.assumptionDeviations.length,
      supersededCount: insertResult.supersededCount,
      submittedAt: insertResult.row.submittedAt,
    },
    { status: 200 },
  );
}

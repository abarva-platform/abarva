// GET /api/v1/source/:eventId/artifacts/:artifactCode/vendor-submissions
//
// Returns the active (non-superseded) vendor pricing submissions for
// an event + artifact code. Read-only companion to the upload route
// (vendor-submission · singular). Used by the canvas to render the
// submissions list on the d19 card.
//
// Auth: same gate as the upload + render-comparison routes.
//
// Response shape:
//   {
//     submissions: [
//       {
//         id, vendorName, submittedAt, parseStatus,
//         parseWarnings: [{ code, message }],
//         unitPriceCount, deviationCount,
//         uploadedFilename
//       },
//       ...
//     ]
//   }

import type { NextRequest } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { getActiveClientRow } from '@/lib/active-client';
import { getCurrentUser } from '@/lib/auth/current-user';
import { CANONICAL_CLIENT_ADMIN_EMAILS } from '@/lib/auth/canonical-auth-roster';
import { loadUserSourceAccessPolicy } from '@/lib/auth/source-access-policy';
import { buildSourceGenerationContext } from '@/lib/source/agent-generation/server';
import { listActiveSubmissionsForEvent } from '@/lib/source/pricing-submissions/dao';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ eventId: string; artifactCode: string }> };

const SUPPORTED_ARTIFACT_CODES = new Set(['d19_pricing_workbook']);

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
  if (!SUPPORTED_ARTIFACT_CODES.has(artifactCode)) {
    return Response.json(
      {
        error: 'unsupported_artifact',
        detail: `Vendor submissions list is not wired for ${artifactCode}.`,
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
  const canRead = Boolean(
    accessPolicy?.canUploadSourceArtifacts ||
      accessPolicy?.canGenerateSourcingArtifacts ||
      canonicalAdminFallbackAllowed,
  );
  if (!canRead) {
    if (tenancyError) return tenancyErrorResponse(tenancyError);
    return Response.json(
      {
        error: 'forbidden',
        detail: 'Source access rights are required to view vendor submissions.',
      },
      { status: 403 },
    );
  }

  const rows = await listActiveSubmissionsForEvent(ctx.event.id);
  return Response.json({
    submissions: rows.map((r) => ({
      id: r.id,
      vendorName: r.vendorName,
      submittedAt: r.submittedAt,
      parseStatus: r.parseStatus,
      parseWarnings: r.parseWarnings,
      unitPriceCount: Object.keys(r.unitPricesById).length,
      deviationCount: r.assumptionDeviations.length,
      uploadedFilename: r.uploadedFilename,
    })),
  });
}

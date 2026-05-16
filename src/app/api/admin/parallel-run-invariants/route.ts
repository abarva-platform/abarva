// GET /api/admin/parallel-run-invariants
//
// Read-only invariant snapshot for parallel-run diff (Vercel prod vs Azure
// lab). Returns canonical, deterministic aggregates per tenant: node/edge
// counts, segment count, program count, top-3 KPI names, top-3 pattern IDs.
//
// Data plane
// ----------
// The query logic lives behind a data-plane read adapter
// (`src/lib/data-plane/read-adapters`). The `ABARVA_DATA_PLANE` env var
// selects the backing store:
//   - `supabase`        -> current production path (DEFAULT)
//   - `azure-postgres`  -> Azure lab Postgres (direct `pg`)
// The route itself no longer talks to Supabase directly — that is what
// makes a clean prod-vs-Azure parallel run possible.
//
// Auth model
// ----------
// This endpoint is intentionally NOT behind Clerk. Parallel-run diffs are
// driven by an ops harness (`scripts/parallel-run-diff.ts`) that talks to
// two backends at once and cannot easily forge Clerk sessions for both.
// Instead, it carries a shared bearer secret in the
// `Authorization: Bearer <token>` header that must match the
// `PARALLEL_RUN_INVARIANT_TOKEN` env var on the responding backend. The
// token is constant-time compared. If the env var is unset, the endpoint
// always 403s — never accidentally open.
//
// Response is read-only and contains no PII / secrets. It is safe to log.

import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { CANONICAL_TENANT_KEYS } from '@/lib/tenant-keys';
import {
  buildInvariantPayload,
  selectReadAdapter,
} from '@/lib/data-plane/read-adapters';

// Re-exported for callers that still import the shapes from this route.
export type {
  TenantInvariants,
  ParallelRunInvariantPayload,
} from '@/lib/data-plane/read-adapters';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function tokensMatch(presented: string, expected: string): boolean {
  // Pad to equal length so timingSafeEqual does not throw and so we
  // do not leak the expected length through fast-path early exits.
  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    // Still spend the work — compare against a same-length buffer.
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

function extractBearerToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization');
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

export async function GET(req: NextRequest) {
  const expected = process.env.PARALLEL_RUN_INVARIANT_TOKEN?.trim();
  if (!expected) {
    return NextResponse.json(
      { error: 'forbidden', detail: 'parallel-run invariants disabled on this backend' },
      { status: 403 },
    );
  }
  const presented = extractBearerToken(req);
  if (!presented || !tokensMatch(presented, expected)) {
    return NextResponse.json(
      { error: 'forbidden', detail: 'invalid bearer token' },
      { status: 403 },
    );
  }

  // Backend marker lets the harness label the report column without
  // hardcoding URLs. Vercel sets VERCEL_URL; Azure Container Apps tend
  // to expose CONTAINER_APP_HOSTNAME / WEBSITE_HOSTNAME. Falls back to
  // a generic marker so the field is always present.
  const backendMarker =
    process.env.PARALLEL_RUN_BACKEND_MARKER?.trim()
    || process.env.VERCEL_URL?.trim()
    || process.env.CONTAINER_APP_HOSTNAME?.trim()
    || process.env.WEBSITE_HOSTNAME?.trim()
    || 'unknown-backend';

  const adapter = selectReadAdapter();
  const tenants = await adapter.getTenantInvariants(CANONICAL_TENANT_KEYS);
  const payload = buildInvariantPayload(tenants, backendMarker);

  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

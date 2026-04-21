// GET /api/v1/intelligence/signals
// Zone 3 portfolio signals · filters by severity, limit.

import { NextRequest } from 'next/server';
import { listSignals } from '@/lib/intelligence/db/signalRepository';
import { requireTenancy, tenancyErrorResponse } from '../../_intel-auth';
import type { SignalSeverity } from '@/lib/intelligence/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_SEVERITY: SignalSeverity[] = ['critical', 'warning', 'info'];

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireTenancy();
    const url = new URL(req.url);
    const minSeverityParam = url.searchParams.get('severity_gte');
    const minSeverity = VALID_SEVERITY.includes(minSeverityParam as SignalSeverity)
      ? (minSeverityParam as SignalSeverity)
      : undefined;
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20', 10) || 20, 100);

    const signals = await listSignals(ctx, { minSeverity, limit });
    return Response.json({
      signals,
      totalActive: signals.length,
      asOf: new Date().toISOString(),
    });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[GET /intelligence/signals]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}

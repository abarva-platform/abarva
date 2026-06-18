import { NextRequest } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import {
  listContextInsights,
  type ContextInsightMateriality,
} from '@/lib/intelligence/context-insights';
import { canonicalTenantKey } from '@/lib/tenant/aliases';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_MATERIALITY: ContextInsightMateriality[] = ['high', 'medium', 'low'];

function parseLimit(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function GET(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireTenancy();
  } catch (err) {
    return tenancyErrorResponse(err);
  }

  const url = new URL(req.url);
  const materialityParam = url.searchParams.get('materiality');
  const materiality = VALID_MATERIALITY.includes(materialityParam as ContextInsightMateriality)
    ? (materialityParam as ContextInsightMateriality)
    : null;
  const tenantKey = canonicalTenantKey(ctx.clientKey ?? ctx.clientId);
  const insights = await listContextInsights({
    tenantKey,
    domain: url.searchParams.get('domain'),
    materiality,
    limit: parseLimit(url.searchParams.get('limit')),
  });

  return Response.json({
    tenantKey,
    totalActive: insights.length,
    insights,
    asOf: new Date().toISOString(),
  }, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

import { NextRequest } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { runBrokeredGenomeQuery } from '@/lib/intelligence/genome-query-broker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireTenancy();
  } catch (err) {
    return tenancyErrorResponse(err);
  }

  const body = (await req.json().catch(() => ({}))) as { query?: string };
  const query = typeof body.query === 'string' ? body.query.trim() : '';
  if (!query) {
    return Response.json({ error: 'query required' }, { status: 400 });
  }

  const result = await runBrokeredGenomeQuery({
    query,
    clientId: ctx.clientId,
    clientKey: ctx.clientKey ?? ctx.clientId,
  });
  return Response.json(result.body, { status: result.status });
}

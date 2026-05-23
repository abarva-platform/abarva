import { NextRequest, NextResponse } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { attestValueLayer, errorCode, parseLayer } from '@/lib/tower/value-states';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ ok: true, data }, { status });
}

function fail(error: unknown): NextResponse {
  const mapped = errorCode(error);
  return NextResponse.json(
    { ok: false, error: { code: mapped.code, message: mapped.message } },
    { status: mapped.status },
  );
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ moveId: string }> },
) {
  let ctx;
  try {
    ctx = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error) as NextResponse;
  }

  const body = (await request.json().catch(() => null)) as {
    layer?: unknown;
    note?: unknown;
  } | null;
  const layer = parseLayer(body?.layer);
  if (!layer) {
    return NextResponse.json(
      { ok: false, error: { code: 'invalid_layer', message: 'Known value layer is required.' } },
      { status: 400 },
    );
  }

  const { moveId } = await context.params;
  try {
    const detail = await attestValueLayer(ctx, {
      moveId,
      layer,
      note: typeof body?.note === 'string' ? body.note : null,
    });
    return ok({ detail });
  } catch (error) {
    return fail(error);
  }
}

import { NextResponse } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { errorCode, getMoveValueDetail } from '@/lib/tower/value-states';

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

export async function GET(
  _request: Request,
  context: { params: Promise<{ moveId: string }> },
) {
  let ctx;
  try {
    ctx = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error) as NextResponse;
  }

  const { moveId } = await context.params;
  try {
    return ok({ detail: await getMoveValueDetail(ctx, moveId) });
  } catch (error) {
    return fail(error);
  }
}

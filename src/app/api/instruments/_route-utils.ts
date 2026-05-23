import { NextResponse } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';

export type InstrumentApiCtx = Awaited<ReturnType<typeof requireTenancy>>;

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(code: string, message: string, status = 400): NextResponse {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export async function requireInstrumentCtx(): Promise<InstrumentApiCtx | NextResponse> {
  try {
    return await requireTenancy();
  } catch (err) {
    try {
      return tenancyErrorResponse(err) as NextResponse;
    } catch {
      return fail('internal_error', 'Unable to resolve tenancy context.', 500);
    }
  }
}

export function mutationCtx(ctx: InstrumentApiCtx): { userId: string; clientId: string } {
  return { userId: ctx.userId, clientId: ctx.clientId };
}

export function canReviewInstruments(ctx: InstrumentApiCtx): boolean {
  return ['admin', 'maestro', 'tenant_admin', 'client_admin', 'instrument_reviewer', 'reviewer'].includes(ctx.role ?? '');
}

export function errorResponse(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : String(error);
  if (message.startsWith('instrument_template_not_found')) {
    return fail('not_found', 'Instrument template not found.', 404);
  }
  if (message.startsWith('depth_lint_blocked')) {
    return fail('depth_lint_blocked', `Depth lint blocked this transition (${message.split(':')[1] ?? 'score unavailable'}).`, 422);
  }
  if (message.includes('AI egress denied')) {
    return fail('ai-egress-denied', message, 403);
  }
  return fail('instrument_error', message, 500);
}

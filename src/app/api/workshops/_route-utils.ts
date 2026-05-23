import { NextResponse } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';

export type WorkshopsApiCtx = Awaited<ReturnType<typeof requireTenancy>>;

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(code: string, message: string, status = 400): NextResponse {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export async function requireWorkshopCtx(): Promise<WorkshopsApiCtx | NextResponse> {
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

export function mutationCtx(ctx: WorkshopsApiCtx): { userId: string; clientId: string } {
  return { userId: ctx.userId, clientId: ctx.clientId };
}

export function canReviewWorkshops(ctx: WorkshopsApiCtx): boolean {
  return ['admin', 'maestro', 'tenant_admin', 'client_admin', 'workshop_reviewer', 'reviewer'].includes(ctx.role ?? '');
}

export function errorResponse(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : String(error);
  if (message.startsWith('workshop_template_not_found')) {
    return fail('not_found', 'Workshop template not found.', 404);
  }
  if (message.startsWith('depth_lint_blocked')) {
    return fail('depth_lint_blocked', `Depth lint blocked this transition (${message.split(':')[1] ?? 'score unavailable'}).`, 422);
  }
  if (message === 'client_id_required_for_render') {
    return fail('client_id_required', 'A tenant client_id is required to render a workshop pack.', 400);
  }
  return fail('workshop_error', message, 500);
}

import { NextResponse } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';

export type TemplatesApiCtx = Awaited<ReturnType<typeof requireTenancy>>;

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(code: string, message: string, status = 400): NextResponse {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export async function requireTemplatesCtx(): Promise<TemplatesApiCtx | NextResponse> {
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

export function mutationCtx(ctx: TemplatesApiCtx): { userId: string; clientId: string } {
  return { userId: ctx.userId, clientId: ctx.clientId };
}

export function canReviewTemplates(ctx: TemplatesApiCtx): boolean {
  return ['admin', 'maestro', 'tenant_admin', 'client_admin', 'template_reviewer', 'reviewer'].includes(ctx.role ?? '');
}

export function errorResponse(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : String(error);
  if (message.startsWith('move_template_not_found')) {
    return fail('not_found', 'Move template not found.', 404);
  }
  if (message.startsWith('move_template_version_not_found')) {
    return fail('not_found', 'Move template version not found.', 404);
  }
  if (message.startsWith('move_template_not_published')) {
    return fail('template_not_published', 'Template must be published before instantiation.', 422);
  }
  if (message.startsWith('depth_lint_blocked')) {
    return fail('depth_lint_blocked', `Depth lint blocked this transition (${message.split(':')[1] ?? 'score unavailable'}).`, 422);
  }
  if (message.includes('AI egress denied')) {
    return fail('ai-egress-denied', message, 403);
  }
  return fail('template_error', message, 500);
}

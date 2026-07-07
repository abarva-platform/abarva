import { NextResponse } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';

export type CorpusApiCtx = Awaited<ReturnType<typeof requireTenancy>>;

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(code: string, message: string, status = 400): NextResponse {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export async function requireCorpusCtx(): Promise<CorpusApiCtx | NextResponse> {
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

export function mutationCtx(ctx: CorpusApiCtx): { userId: string; clientId: string; clientKey: string | null } {
  return { userId: ctx.userId, clientId: ctx.clientId, clientKey: ctx.clientKey ?? null };
}

export function canReviewCorpus(ctx: CorpusApiCtx): boolean {
  return ['admin', 'maestro', 'tenant_admin', 'client_admin', 'corpus_reviewer', 'reviewer'].includes(ctx.role ?? '');
}

export function errorResponse(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : String(error);
  if (message.startsWith('corpus_pattern_not_found')) {
    return fail('not_found', 'Corpus pattern not found.', 404);
  }
  if (message.startsWith('depth_lint_blocked')) {
    return fail('depth_lint_blocked', `Depth lint blocked this transition (${message.split(':')[1] ?? 'score unavailable'}).`, 422);
  }
  if (message.includes('AI egress denied')) {
    return fail('ai-egress-denied', message, 403);
  }
  return fail('corpus_error', message, 500);
}

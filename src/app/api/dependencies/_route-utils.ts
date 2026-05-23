import { NextResponse } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';

export type DependenciesApiCtx = Awaited<ReturnType<typeof requireTenancy>>;

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(code: string, message: string, status = 400): NextResponse {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export async function requireDependenciesCtx(): Promise<DependenciesApiCtx | NextResponse> {
  try {
    return await requireTenancy();
  } catch (error) {
    try {
      return tenancyErrorResponse(error) as NextResponse;
    } catch {
      return fail('internal_error', 'Unable to resolve tenancy context.', 500);
    }
  }
}

export function errorResponse(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : String(error);
  if (message === 'dependency_node_not_found' || message === 'dependency_parent_not_found') {
    return fail('not_found', 'Dependency node not found for the active client.', 404);
  }
  if (message === 'dependency_not_found') {
    return fail('not_found', 'Dependency edge not found for the active client.', 404);
  }
  if (message === 'dependency_self_edge') {
    return fail('bad_request', 'A dependency cannot point to itself.', 400);
  }
  if (message === 'dependency_identifier_required') {
    return fail('bad_request', 'Expected dependency id or edge tuple.', 400);
  }
  if (message.startsWith('move_template_not_found')) {
    return fail('not_found', 'Move template not found.', 404);
  }
  if (message.startsWith('move_template_not_published')) {
    return fail('template_not_published', 'Template must be published before dependency instantiation.', 422);
  }
  return fail('dependency_error', message, 500);
}

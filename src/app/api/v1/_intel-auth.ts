// Shared auth + tenancy resolver for /api/v1/intelligence/**, /nexus/**,
// /threads/**, /artifacts/**. Every route MUST call requireTenancy()
// first and scope queries by the returned TenancyCtx.

import { currentUser } from '@clerk/nextjs/server';
import { getCurrentPerson } from '@/lib/auth/maestro';
import { getActiveClientRow } from '@/lib/active-client';
import { getCurrentUser } from '@/lib/auth/current-user';
import type { TenancyCtx } from '@/lib/intelligence/types';

export class TenancyError extends Error {
  constructor(public readonly code: 'unauthenticated' | 'no_client') {
    super(code);
  }
}

export async function requireTenancy(): Promise<TenancyCtx> {
  const [person, user] = await Promise.all([getCurrentPerson(), getCurrentUser()]);
  const clerkUser = user ? null : await currentUser().catch(() => null);
  if (!person && !user?.personId && !clerkUser) throw new TenancyError('unauthenticated');
  const client = await getActiveClientRow();
  if (!client) throw new TenancyError('no_client');
  const userId = person?.id ?? user?.personId ?? null;
  if (!userId) throw new TenancyError('unauthenticated');
  return { clientId: client.id, userId };
}

export function tenancyErrorResponse(err: unknown): Response {
  if (err instanceof TenancyError) {
    if (err.code === 'unauthenticated') return Response.json({ error: 'unauthenticated' }, { status: 401 });
    return Response.json({ error: 'no_client', detail: 'No active client for this user' }, { status: 403 });
  }
  throw err;
}

/**
 * Service-to-service auth for /emergent/cohort. Checks x-service-auth
 * header against SERVICE_AUTH_TOKEN. Prod MUST set this env; dev falls
 * back to the service role key.
 */
export function requireServiceAuth(req: Request): Response | null {
  const expected = process.env.SERVICE_AUTH_TOKEN ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  const presented = req.headers.get('x-service-auth');
  if (!expected || presented !== expected) {
    return Response.json({ error: 'forbidden', detail: 'Service auth required' }, { status: 403 });
  }
  return null;
}

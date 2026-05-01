import { getActiveClientRow } from '@/lib/active-client';
import { getCurrentUser } from '@/lib/auth/current-user';
import { getCurrentPerson } from '@/lib/auth/maestro';
import type { TenancyCtx } from '@/lib/programs/types.db';

export class TenancyError extends Error {
  constructor(public readonly code: 'unauthenticated' | 'no_client') {
    super(code);
  }
}

export async function requireTenancy(): Promise<TenancyCtx> {
  const [person, user] = await Promise.all([getCurrentPerson(), getCurrentUser()]);
  const userId = person?.id
    ?? user?.personId
    ?? (user?.clerkUserId ? `clerk:${user.clerkUserId}` : null);
  if (!userId) throw new TenancyError('unauthenticated');
  const client = await getActiveClientRow();
  if (!client) throw new TenancyError('no_client');
  return {
    clientId: client.id,
    userId,
    role: person?.role ?? user?.primaryRole ?? undefined,
    email: user?.email ?? person?.email ?? null,
  };
}

export function tenancyErrorResponse(err: unknown): Response {
  if (err instanceof TenancyError) {
    if (err.code === 'unauthenticated') {
      return Response.json({ error: 'unauthenticated' }, { status: 401 });
    }
    return Response.json({ error: 'no_client', detail: 'No active client for this user' }, { status: 403 });
  }
  throw err;
}

// Shared auth + tenancy resolver for /api/v1/programs/** routes.
// Every route MUST call requireTenancy(req) first and scope all queries
// by the returned { clientId, userId }.

import { getCurrentPerson } from '@/lib/auth/maestro';
import { getActiveClientRow } from '@/lib/active-client';
import type { TenancyCtx } from '@/lib/programs/types';

export class TenancyError extends Error {
  constructor(public readonly code: 'unauthenticated' | 'no_client') {
    super(code);
  }
}

export async function requireTenancy(): Promise<TenancyCtx> {
  const person = await getCurrentPerson();
  if (!person) throw new TenancyError('unauthenticated');
  const client = await getActiveClientRow();
  if (!client) throw new TenancyError('no_client');
  return { clientId: client.id, userId: person.id, role: person.role ?? undefined };
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

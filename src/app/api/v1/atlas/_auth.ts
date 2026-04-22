import { currentUser } from '@clerk/nextjs/server';
import { TenancyError, tenancyErrorResponse } from '@/app/api/v1/_intel-auth';
import { getActiveClientRow } from '@/lib/active-client';
import { getCurrentUser, userCanAccessClient } from '@/lib/auth/current-user';
import { getCurrentPerson } from '@/lib/auth/maestro';
import type { AtlasTenancyCtx } from '@/lib/atlas/types';

export async function requireAtlasTenancy(clientId?: string | null): Promise<AtlasTenancyCtx> {
  const person = await getCurrentPerson();
  const user = await getCurrentUser();
  const clerkUser = user ? null : await currentUser().catch(() => null);
  if (!user && !clerkUser) throw new TenancyError('unauthenticated');

  const requestedClientId = clientId?.trim() || null;
  if (requestedClientId) {
    if (user && !userCanAccessClient(user, requestedClientId)) {
      throw new TenancyError('no_client');
    }
    if (!user) {
      const activeClient = await getActiveClientRow();
      if (!activeClient || activeClient.id !== requestedClientId) {
        throw new TenancyError('no_client');
      }
    }
    return { clientId: requestedClientId, userId: person?.id ?? user?.personId ?? null };
  }

  const client = await getActiveClientRow();
  if (!client) throw new TenancyError('no_client');
  return { clientId: client.id, userId: person?.id ?? user?.personId ?? null };
}

export { tenancyErrorResponse };

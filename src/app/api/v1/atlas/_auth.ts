import { TenancyError, tenancyErrorResponse } from '@/app/api/v1/_intel-auth';
import { getActiveClientRow } from '@/lib/active-client';
import { getCurrentUser, userCanAccessClient } from '@/lib/auth/current-user';
import { getCurrentPerson } from '@/lib/auth/maestro';
import type { AtlasTenancyCtx } from '@/lib/atlas/types';

export async function requireAtlasTenancy(clientId?: string | null): Promise<AtlasTenancyCtx> {
  const person = await getCurrentPerson();
  if (!person) throw new TenancyError('unauthenticated');

  const requestedClientId = clientId?.trim() || null;
  if (requestedClientId) {
    const user = await getCurrentUser();
    if (!userCanAccessClient(user, requestedClientId)) {
      throw new TenancyError('no_client');
    }
    return { clientId: requestedClientId, userId: person.id };
  }

  const client = await getActiveClientRow();
  if (!client) throw new TenancyError('no_client');
  return { clientId: client.id, userId: person.id };
}

export { tenancyErrorResponse };

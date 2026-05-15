import { TenancyError, tenancyErrorResponse } from '@/app/api/v1/_intel-auth';
import { requireTenancy } from '@/lib/auth/tenancy';
import type { AtlasTenancyCtx } from '@/lib/atlas/types';

export async function requireAtlasTenancy(clientId?: string | null): Promise<AtlasTenancyCtx> {
  const tenancy = await requireTenancy().catch((err) => {
    if (err instanceof Error && (err.message === 'unauthenticated' || err.message === 'no_client')) {
      throw new TenancyError(err.message as 'unauthenticated' | 'no_client');
    }
    throw err;
  });
  const requestedClientId = clientId?.trim() || null;
  if (
    requestedClientId &&
    requestedClientId !== tenancy.clientId &&
    requestedClientId !== tenancy.clientKey
  ) {
    throw new TenancyError('no_client');
  }

  return { clientId: tenancy.clientId, userId: tenancy.userId };
}

export { tenancyErrorResponse };

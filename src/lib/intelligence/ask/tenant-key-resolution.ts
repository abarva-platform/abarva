import { clientKeyToInventorySubstrateKey } from '@/lib/agent/tools/intelligence/_shared';
import { isClientKey, type ClientKey } from '@/lib/client-config';
import type { AskSurfaceContext } from './types';

export interface AskTenantKeyFallback {
  requestedClientKey: ClientKey | null;
  tenantInventoryKey: string | null;
}

export function resolveAskTenantKeyFallback(
  requestedClient: string | null | undefined,
  surfaceContext: AskSurfaceContext | null | undefined,
): AskTenantKeyFallback {
  const requestedClientKey = isClientKey(requestedClient)
    ? requestedClient
    : isClientKey(surfaceContext?.clientKey)
      ? surfaceContext.clientKey
      : null;
  return {
    requestedClientKey,
    tenantInventoryKey: requestedClientKey
      ? clientKeyToInventorySubstrateKey(requestedClientKey)
      : null,
  };
}

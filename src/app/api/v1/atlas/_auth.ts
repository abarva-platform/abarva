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

  const deriveUserId = (): string | null =>
    person?.id
      ?? user?.personId
      ?? (user?.clerkUserId ? `clerk:${user.clerkUserId}` : null)
      ?? (clerkUser?.id ? `clerk:${clerkUser.id}` : null);

  const requestedClientId = clientId?.trim() || null;
  if (requestedClientId) {
    // Primary check · explicit membership (or maestro) access.
    if (user && userCanAccessClient(user, requestedClientId)) {
      return { clientId: requestedClientId, userId: deriveUserId() };
    }
    // Fallback · the Clerk session resolves to the same client via metadata
    // (demo / test users who are scoped via publicMetadata.clientId but have
    // no rows in `persons` / `person_client_memberships`). We compare against
    // `getActiveClientRow` which already honors the cookie-then-metadata
    // precedence, so this is the same source of truth the nav uses.
    const activeClient = await getActiveClientRow();
    if (!activeClient || activeClient.id !== requestedClientId) {
      throw new TenancyError('no_client');
    }
    return { clientId: requestedClientId, userId: deriveUserId() };
  }

  const client = await getActiveClientRow();
  if (!client) throw new TenancyError('no_client');
  return { clientId: client.id, userId: deriveUserId() };
}

export { tenancyErrorResponse };

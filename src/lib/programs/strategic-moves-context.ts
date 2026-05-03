import { getActiveClientRow } from '@/lib/active-client';
import { getCurrentUser } from '@/lib/auth/current-user';
import type { TenancyCtx } from './types.db';

export async function getStrategicMovesTenancy(): Promise<TenancyCtx | null> {
  const [activeClient, user] = await Promise.all([
    getActiveClientRow(),
    getCurrentUser(),
  ]);
  if (!activeClient) return null;
  const userId = user?.personId ?? (user?.clerkUserId ? `clerk:${user.clerkUserId}` : null);
  if (!userId) return null;
  return {
    clientId: activeClient.id,
    userId,
    role: user?.primaryRole,
    email: user?.email ?? null,
  };
}


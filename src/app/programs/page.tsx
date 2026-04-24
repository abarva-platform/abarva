import { redirect } from 'next/navigation';
import { getActiveClientKey } from '@/lib/active-client';
import { CLIENT_KEY_TO_ROUTE_SLUG } from '@/lib/client-config';

export const dynamic = 'force-dynamic';

// Retire the stale mock-only /programs shell. Canonical program access now
// lives on the tenant-scoped seeded routes, so every legacy /programs link
// resolves into the same source of truth as preview + investor flows.
export default async function ProgramsRedirectPage() {
  const clientKey = await getActiveClientKey();
  redirect(`/tenant/${CLIENT_KEY_TO_ROUTE_SLUG[clientKey]}/programs`);
}

import { redirect } from 'next/navigation';
import { getActiveClientKey } from '@/lib/active-client';
import { CLIENT_KEY_TO_ROUTE_SLUG } from '@/lib/client-config';

export const dynamic = 'force-dynamic';

// /preview/programs is a stable entrypoint in the nav and investor preview,
// but the canonical tenant-scoped seeded routes now carry the complete
// program inventory and Morrison/Ambient walkthroughs. Redirect here so
// users never fall back to the stale Apex-only mock shell.

export default async function ProgramsPreviewPage() {
  const clientKey = await getActiveClientKey();
  redirect(`/tenant/${CLIENT_KEY_TO_ROUTE_SLUG[clientKey]}/programs`);
}

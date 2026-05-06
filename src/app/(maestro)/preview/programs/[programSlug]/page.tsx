// PROG-P1 · Preview program detail — direct to canonical route.
// Was: resolveSeedProgramPath → /tenant/[slug]/programs/[slug] → /programs/[slug] (double hop).
// Now: resolves slug from seed, then single redirect to /programs/[slug] canonical.

import { notFound, redirect } from 'next/navigation';
import { getActiveClientKey } from '@/lib/active-client';
import { resolveSeedProgramContext } from '@/lib/deliverables/legacy-route-resolver';

export const dynamic = 'force-dynamic';

export default async function PreviewProgramRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ programSlug: string }>;
  searchParams: Promise<{ client?: string }>;
}) {
  const { programSlug } = await params;
  const { client } = await searchParams;
  const activeClientKey = await getActiveClientKey(client);
  const context = resolveSeedProgramContext(programSlug, activeClientKey);

  if (context) {
    redirect(`/programs/${context.program.programSlug}`);
  }

  // Unresolvable program slug — fall back to portfolio index.
  redirect('/programs');
}

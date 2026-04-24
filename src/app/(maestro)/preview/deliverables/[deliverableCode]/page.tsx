import { notFound, redirect } from 'next/navigation';
import { getActiveClientKey } from '@/lib/active-client';
import { getSeedProgramsIndexPath, resolveSeedDeliverablePath } from '@/lib/deliverables/legacy-route-resolver';

export const dynamic = 'force-dynamic';

export default async function PreviewDeliverableRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ deliverableCode: string }>;
  searchParams: Promise<{ client?: string }>;
}) {
  const [{ deliverableCode }, query] = await Promise.all([params, searchParams]);
  const activeClientKey = await getActiveClientKey(query.client);
  const canonicalDeliverablePath = resolveSeedDeliverablePath(deliverableCode, activeClientKey);

  if (canonicalDeliverablePath) {
    redirect(canonicalDeliverablePath);
  }

  const fallbackPath = getSeedProgramsIndexPath(activeClientKey);
  if (fallbackPath) {
    redirect(fallbackPath);
  }

  notFound();
}

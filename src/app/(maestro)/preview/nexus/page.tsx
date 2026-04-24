import { redirect } from 'next/navigation';
import { getActiveClientKey } from '@/lib/active-client';
import { getSeedProgramsIndexPath } from '@/lib/deliverables/legacy-route-resolver';

export const dynamic = 'force-dynamic';

export default async function PreviewNexusPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const params = await searchParams;
  const activeClientKey = await getActiveClientKey(params.client);
  redirect(getSeedProgramsIndexPath(activeClientKey));
}

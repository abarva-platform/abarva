import { notFound, redirect } from 'next/navigation';
import { getActiveClientKey } from '@/lib/active-client';
import { getSeedProgramsIndexPath, resolveSeedProgramPath } from '@/lib/deliverables/legacy-route-resolver';

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
  const canonicalProgramPath = resolveSeedProgramPath(programSlug, activeClientKey);

  if (canonicalProgramPath) {
    redirect(canonicalProgramPath);
  }

  const fallback = getSeedProgramsIndexPath(activeClientKey);
  if (fallback) {
    redirect(fallback);
  }

  notFound();
}

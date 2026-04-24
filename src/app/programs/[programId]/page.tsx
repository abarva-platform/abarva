import { redirect } from 'next/navigation';
import { getActiveClientKey } from '@/lib/active-client';
import { resolveSeedProgramPath } from '@/lib/deliverables/legacy-route-resolver';
import { LegacyProgramDetailPage } from '@/components/programs/LegacyProgramDetailPage';

export const dynamic = 'force-dynamic';

export default async function ProgramDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ programId: string }>;
  searchParams: Promise<{ client?: string }>;
}) {
  const [{ programId }, query] = await Promise.all([params, searchParams]);
  const activeClientKey = await getActiveClientKey(query.client);
  const canonicalProgramPath = resolveSeedProgramPath(programId, activeClientKey);

  if (canonicalProgramPath) {
    redirect(canonicalProgramPath);
  }

  return <LegacyProgramDetailPage params={Promise.resolve({ programId })} />;
}

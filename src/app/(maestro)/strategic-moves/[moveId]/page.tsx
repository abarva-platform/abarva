import { notFound, redirect } from 'next/navigation';
import { requireProductModule } from '@/lib/auth/server-module-access';
import { getStrategicMoveById } from '@/lib/programs/queries';
import { getStrategicMovesTenancy } from '@/lib/programs/strategic-moves-context';
import { StrategicMoveDetailView } from '@/components/strategic-moves/StrategicMoveDetailView';
import { AppShell } from '@/components/shell/AppShell';

export const dynamic = 'force-dynamic';

type Tab = 'overview' | 'documents' | 'activity';

interface Props {
  params: Promise<{ moveId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

function resolveTab(raw: string | undefined): Tab {
  if (raw === 'documents' || raw === 'activity') return raw;
  return 'overview';
}

export default async function StrategicMoveDetailPage({ params, searchParams }: Props) {
  await requireProductModule('programs');
  const ctx = await getStrategicMovesTenancy();
  if (!ctx) redirect('/sign-in');

  const [{ moveId }, sp] = await Promise.all([params, searchParams]);
  const activeTab = resolveTab(sp.tab);

  const move = await getStrategicMoveById(ctx, moveId);
  if (!move) notFound();

  return (
    <AppShell surface="programs-detail">
      <StrategicMoveDetailView move={move} activeTab={activeTab} />
    </AppShell>
  );
}

import { notFound, redirect } from 'next/navigation';
import { requireProductModule } from '@/lib/auth/server-module-access';
import { getStrategicMoveById } from '@/lib/programs/queries';
import { getStrategicMovesTenancy } from '@/lib/programs/strategic-moves-context';
import { StrategicMoveDetailView } from '@/components/strategic-moves/StrategicMoveDetailView';
import { AppShell } from '@/components/shell/AppShell';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ moveId: string }>;
}

export default async function StrategicMoveDetailPage({ params }: Props) {
  await requireProductModule('programs');
  const ctx = await getStrategicMovesTenancy();
  if (!ctx) {
    redirect('/sign-in');
  }

  const { moveId } = await params;
  const move = await getStrategicMoveById(ctx, moveId);
  if (!move) notFound();

  return (
    <AppShell surface="programs-detail">
      <StrategicMoveDetailView move={move} />
    </AppShell>
  );
}


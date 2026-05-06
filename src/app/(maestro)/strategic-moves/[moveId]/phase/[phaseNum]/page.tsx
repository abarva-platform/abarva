import { notFound, redirect } from 'next/navigation';
import { requireProductModule } from '@/lib/auth/server-module-access';
import { getStrategicMoveById } from '@/lib/programs/queries';
import { getStrategicMovesTenancy } from '@/lib/programs/strategic-moves-context';
import { AppShell } from '@/components/shell/AppShell';
import { StrategicMovePhaseClient } from '@/components/strategic-moves/StrategicMovePhaseClient';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ moveId: string; phaseNum: string }>;
}

export default async function StrategicMovePhaseWorkspacePage({ params }: Props) {
  await requireProductModule('programs');
  const ctx = await getStrategicMovesTenancy();
  if (!ctx) {
    redirect('/sign-in');
  }

  const { moveId, phaseNum } = await params;

  // Validate phaseNum is 1–5
  const parsedPhase = parseInt(phaseNum, 10);
  if (isNaN(parsedPhase) || parsedPhase < 1 || parsedPhase > 5) {
    notFound();
  }

  const move = await getStrategicMoveById(ctx, moveId);
  if (!move) notFound();

  return (
    <AppShell surface="programs-detail">
      <StrategicMovePhaseClient move={move} phaseNum={parsedPhase} />
    </AppShell>
  );
}

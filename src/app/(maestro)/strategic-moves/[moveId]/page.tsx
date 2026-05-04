import { notFound, redirect } from 'next/navigation';
import { requireProductModule } from '@/lib/auth/server-module-access';
import { loadUserProgramAccessPolicy } from '@/lib/auth/program-access-policy';
import { getStrategicMoveById } from '@/lib/programs/queries';
import { getStrategicMovesTenancy } from '@/lib/programs/strategic-moves-context';
import { StrategicMoveDetailView } from '@/components/strategic-moves/StrategicMoveDetailView';

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

  const accessPolicy = await loadUserProgramAccessPolicy(ctx, { programId: move.id });
  const canOpenAdminApprovals = accessPolicy.canApproveGates;

  return <StrategicMoveDetailView canOpenAdminApprovals={canOpenAdminApprovals} move={move} />;
}


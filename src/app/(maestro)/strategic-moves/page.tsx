import { redirect } from 'next/navigation';
import { requireProductModule } from '@/lib/auth/server-module-access';
import { getStrategicMovePortfolio } from '@/lib/programs/queries';
import { getStrategicMovesTenancy } from '@/lib/programs/strategic-moves-context';
import { DEFAULT_STRATEGIC_MOVES_PREFERENCES, getStrategicMovesPreferences } from '@/lib/programs/strategic-moves-preferences';
import { StrategicMovesHomeClient } from '@/components/strategic-moves/StrategicMovesHomeClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Strategic Moves | AbarVa Nexus',
};

export default async function StrategicMovesPage() {
  await requireProductModule('programs');
  const ctx = await getStrategicMovesTenancy();
  if (!ctx) {
    redirect('/sign-in');
  }

  const [portfolio, prefs] = await Promise.all([
    getStrategicMovePortfolio(ctx),
    getStrategicMovesPreferences(ctx).catch(() => DEFAULT_STRATEGIC_MOVES_PREFERENCES),
  ]);

  return (
    <StrategicMovesHomeClient
      initialListView={prefs.listView}
      initialSort={prefs.sort}
      portfolio={portfolio}
    />
  );
}

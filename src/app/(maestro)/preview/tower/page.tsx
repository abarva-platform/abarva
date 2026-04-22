import { buildTowerViewModel } from '@/lib/tower/aggregate';
import { getActiveClientRow } from '@/lib/active-client';
import { TowerPreviewShell } from '@/components/tower/TowerPreviewShell';

export const dynamic = 'force-dynamic';

// /preview/tower · redesign sandbox for Control Tower per the page-by-page
// audit. Parked alongside the live /tower (untouched) so design decisions
// can be made by clicking both. The one-line operating header replaces the
// cream narrative hero; Pressure Today surfaces the 3 highest-dollar
// unowned contradictions; the 5-column strip remains the cockpit but each
// column is now clickable to drill down; Atlas is demoted from a
// permanent right column to a summonable right-edge dock.

export default async function TowerPreviewPage() {
  const activeClient = await getActiveClientRow();
  const vm = activeClient ? await buildTowerViewModel(activeClient.id) : null;

  return (
    <TowerPreviewShell
      vm={vm}
      clientName={activeClient?.name ?? 'Meridian Health'}
      currentPath="/tower"
    />
  );
}

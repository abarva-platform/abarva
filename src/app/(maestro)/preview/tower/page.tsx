import { buildTowerViewModel } from '@/lib/tower/aggregate';
import { getActiveClientKey, getActiveClientRow } from '@/lib/active-client';
import { CLIENT_KEY_TO_ROUTE_SLUG, getClientOption } from '@/lib/client-config';
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
  const [activeClientKey, activeClient] = await Promise.all([
    getActiveClientKey(),
    getActiveClientRow(),
  ]);
  const currentClient = getClientOption(activeClientKey);
  const vm = activeClient ? await buildTowerViewModel(activeClient.id) : null;
  const programsHref = `/tenant/${CLIENT_KEY_TO_ROUTE_SLUG[activeClientKey]}/programs`;

  return (
    <TowerPreviewShell
      vm={vm}
      clientName={activeClient?.name ?? currentClient?.shortName ?? 'Client workspace'}
      programsHref={programsHref}
    />
  );
}

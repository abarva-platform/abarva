import { buildTowerViewModel } from '@/lib/tower/aggregate';
import { getActiveClientKey, getActiveClientRow } from '@/lib/active-client';
import { canonicalClientDisplayName, getClientOption } from '@/lib/client-config';
import { TowerPreviewShell } from '@/components/tower/TowerPreviewShell';

export const dynamic = 'force-dynamic';

// /preview/tower · redesign sandbox for Control Tower per the page-by-page
// audit. Parked alongside the live /tower (untouched) so design decisions
// can be made by clicking both. The one-line operating header replaces the
// cream narrative hero; Pressure Today surfaces the 3 highest-dollar
// unowned contradictions; the 5-column strip remains the cockpit but each
// column is now clickable to drill down; Atlas is demoted from a
// permanent right column to a summonable right-edge dock.

export default async function TowerPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const params = await searchParams;
  const activeClientKey = await getActiveClientKey(params.client);
  const activeClient = await getActiveClientRow(params.client);
  const vm = activeClient?.id ? await buildTowerViewModel(activeClient.id) : null;
  const clientOption = getClientOption(activeClientKey);
  const activeClientDisplayName =
    canonicalClientDisplayName({ key: activeClient?.key ?? activeClientKey, name: activeClient?.name }) ??
    clientOption.name;

  return (
    <TowerPreviewShell
      vm={vm}
      clientId={activeClient?.id ?? clientOption.id}
      clientName={activeClientDisplayName}
      currentPath="/tower"
    />
  );
}

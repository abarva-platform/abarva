import { TowerIndexPage } from '@/components/tower/TowerIndexPage';
import { getActiveClientRow } from '@/lib/active-client';

export const metadata = { title: 'Control Tower · AbarVa' };

async function getActiveTenantName(): Promise<string> {
  try {
    const client = await getActiveClientRow();
    return client?.name ?? 'AbarVa Client';
  } catch {
    return 'AbarVa Client';
  }
}

export default async function TowerPage() {
  const tenantName = await getActiveTenantName();
  return <TowerIndexPage tenantName={tenantName} />;
}

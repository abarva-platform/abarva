import { redirect } from 'next/navigation';
import { requireProductModule } from '@/lib/auth/server-module-access';
import { getActiveClientRow } from '@/lib/active-client';
import { StrategicMoveOriginateClient } from '@/components/strategic-moves/StrategicMoveOriginateClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Originate Strategic Move | AbarVa Nexus',
};

export default async function StrategicMoveOriginatePage() {
  await requireProductModule('programs');
  const activeClient = await getActiveClientRow();
  if (!activeClient) {
    redirect('/sign-in');
  }

  return <StrategicMoveOriginateClient tenantName={activeClient.name} />;
}


import { redirect } from 'next/navigation';
import { requireProductModule } from '@/lib/auth/server-module-access';
import { requireTenancy } from '@/app/api/v1/programs/_auth';
import { getActiveClientRow } from '@/lib/active-client';
import { StrategicMoveOriginateClient } from '@/components/strategic-moves/StrategicMoveOriginateClient';
import { composeOriginateFirstMessage } from '@/components/strategic-moves/composeOriginateFirstMessage';
import { AppShell } from '@/components/shell/AppShell';

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

  // Compose first-message variant server-side (2A empty entry or 2B partial draft return).
  let firstMessage = null;
  try {
    const ctx = await requireTenancy();
    firstMessage = await composeOriginateFirstMessage(ctx);
  } catch {
    // Tenancy or draft read failure — fall through; client uses its default 2A message.
  }

  return (
    <AppShell surface="programs">
      <StrategicMoveOriginateClient
        tenantName={activeClient.name}
        initialTurns={firstMessage ? [firstMessage] : undefined}
      />
    </AppShell>
  );
}


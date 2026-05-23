import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { requireProductModule } from '@/lib/auth/server-module-access';
import { requireTenancy } from '@/lib/auth/tenancy';
import { listDiscoveryKitForMove } from '@/lib/instruments/authoring';
import { AppShell } from '@/components/shell/AppShell';
import { DiscoveryKitClient } from './DiscoveryKitClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DiscoveryKitPage({ params }: Props) {
  await connection();
  await requireProductModule('programs');
  const ctx = await requireTenancy().catch(() => null);
  if (!ctx) redirect('/sign-in');
  const { id } = await params;
  const instruments = await listDiscoveryKitForMove(id, ctx.clientId).catch(() => []);

  return (
    <AppShell surface="programs-detail">
      <DiscoveryKitClient moveId={id} initialItems={instruments} />
    </AppShell>
  );
}

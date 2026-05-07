import { redirect } from 'next/navigation';
import { requireProductModule } from '@/lib/auth/server-module-access';
import { requireTenancy } from '@/app/api/v1/programs/_auth';
import { getActiveClientRow } from '@/lib/active-client';
import { StrategicMoveOriginateClient } from '@/components/strategic-moves/StrategicMoveOriginateClient';
import {
  composeOriginateFirstMessage,
  type FromInitiativeCtx,
} from '@/components/strategic-moves/composeOriginateFirstMessage';
import { AppShell } from '@/components/shell/AppShell';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Originate Strategic Move | AbarVa Nexus',
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function parseFromInitiative(
  params: Record<string, string | string[] | undefined>,
): FromInitiativeCtx | null {
  const raw = (key: string) => {
    const v = params[key];
    return typeof v === 'string' ? v : undefined;
  };
  if (raw('fromInitiative') !== '1') return null;
  const displayId = raw('fromId');
  if (!displayId) return null;
  const gapRaw = raw('fromGapUsd');
  return {
    displayId,
    name: raw('fromName') ?? displayId,
    statusFlag: raw('fromStatus') ?? '',
    gapUsd: gapRaw ? Number(gapRaw) : null,
    ownerName: raw('fromOwner') ?? '',
    goalName: raw('fromGoal') ?? '',
  };
}

export default async function StrategicMoveOriginatePage({ searchParams }: PageProps) {
  await requireProductModule('programs');
  const activeClient = await getActiveClientRow();
  if (!activeClient) {
    redirect('/sign-in');
  }

  const params = await searchParams;
  const fromInitiative = parseFromInitiative(params);

  // Compose first-message variant server-side:
  //   2A — empty entry (no draft, no initiative context)
  //   2B — partial draft return
  //   2D — from "Shape into a Move →" CTA on an AI Initiative page
  let firstMessage = null;
  try {
    const ctx = await requireTenancy();
    firstMessage = await composeOriginateFirstMessage(ctx, fromInitiative);
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


import { redirect } from 'next/navigation';
import { getAllPrograms } from '@/lib/programs/mock';
import { getActiveClientKey, getActiveClientRow } from '@/lib/active-client';
import { CLIENT_KEY_TO_DB_NAME, getClientOption } from '@/lib/client-config';
import { ProgramsIridescentShell } from '@/components/programs/ProgramsIridescentShell';

export const dynamic = 'force-dynamic';

// /preview/programs · iridescent canon build · Nexus chat-first.
// Scoped to the signed-in user's active tenant — programs from other
// tenants never leak in here. Empty state renders when the active
// tenant has no programs yet (new Keystone/Meridian seats, etc.); the
// "+ New Program" pill inside the shell is the primary call to action.

export default async function ProgramsPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const params = await searchParams;
  const activeClientKey = await getActiveClientKey(params.client);
  const activeClient = await getActiveClientRow(params.client);
  const clientOption = getClientOption(activeClientKey);
  const all = getAllPrograms();
  const candidates = CLIENT_KEY_TO_DB_NAME[activeClientKey].map((name) => name.toLowerCase());
  const programs = all.filter((p) => candidates.includes(p.clientName.toLowerCase()));
  const activeClientName = activeClient?.name ?? clientOption.name;

  if (programs.length === 0 && activeClient?.id) {
    redirect(`/engagements?client=${activeClientKey}`);
  }

  return <ProgramsIridescentShell programs={programs} activeClientName={activeClientName} />;
}

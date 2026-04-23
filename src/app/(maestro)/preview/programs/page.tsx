import { getAllPrograms } from '@/lib/programs/mock';
import { getActiveClientRow } from '@/lib/active-client';
import { ProgramsIridescentShell } from '@/components/programs/ProgramsIridescentShell';

export const dynamic = 'force-dynamic';

// /preview/programs · iridescent canon build · Nexus chat-first.
// Scoped to the signed-in user's active tenant — programs from other
// tenants never leak in here. Empty state renders when the active
// tenant has no programs yet (new Keystone/Meridian seats, etc.); the
// "+ New Program" pill inside the shell is the primary call to action.

export default async function ProgramsPreviewPage() {
  const activeClient = await getActiveClientRow();
  const all = getAllPrograms();
  const programs = activeClient
    ? all.filter((p) => p.clientName === activeClient.name)
    : all;
  const activeClientName = activeClient?.name ?? null;
  return <ProgramsIridescentShell programs={programs} activeClientName={activeClientName} />;
}

// /programs/new · Surface 1 of Programs Strict Completion v1.2
//
// Replaces the legacy 3-step wizard (kickoff §5: "the 3-step wizard is
// deleted, not deprecated") with a Steward-led reactive workspace.
// Server component: resolves the signed-in user via getUserContext,
// composes the cold-open Steward greeting, hydrates it as the first
// turn in the workspace.

import { ProgramOriginationWorkspace } from '@/components/programs/origination/ProgramOriginationWorkspace';
import { composeColdOpen } from '@/components/programs/origination/composeColdOpen';
import { getUserContext } from '@/lib/agent/userContext';

export const metadata = {
  title: 'New Program · AbarVa',
};

export const dynamic = 'force-dynamic';

export default async function ProgramsNewPage() {
  const user = await getUserContext();
  const greeting = composeColdOpen({ user, variant: 'production' });

  return (
    <ProgramOriginationWorkspace
      surface="/programs/new"
      tenantName={user?.tenantDisplayName ?? 'AbarVa'}
      initialTurns={[
        {
          id: greeting.id,
          role: 'assistant',
          agentName: 'Steward',
          text: greeting.text,
        },
      ]}
    />
  );
}

// /demo/programs/new · Surface 1 of Programs Strict Completion v1.2
//
// Public-route demo of the Steward origination workspace. Same UX
// paradigm as the production /programs/new (kickoff §5: "Both routes
// get the same reactive workspace + Steward conversation. The demo
// route may diverge in fixtures... but the UX paradigm is identical.").
//
// The demo route does not require authentication; the cold-open uses
// the demo greeting variant and Steward runs against demo fixtures
// surfaced through AGENT_DEMO_SYSTEM_BLOCK.

import { ProgramOriginationWorkspace } from '@/components/programs/origination/ProgramOriginationWorkspace';
import { composeColdOpen } from '@/components/programs/origination/composeColdOpen';

export const metadata = {
  title: 'New Program · Demo · AbarVa',
};

export const dynamic = 'force-dynamic';

export default function DemoProgramsNewPage() {
  const greeting = composeColdOpen({ user: null, variant: 'demo' });

  return (
    <ProgramOriginationWorkspace
      surface="/demo/programs/new"
      tenantName="Apex Retail Group"
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

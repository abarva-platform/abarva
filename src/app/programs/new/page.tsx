// /programs/new · Surface 1 of Programs Strict Completion v1.2
//
// Replaces the legacy 3-step wizard (kickoff §5: "the 3-step wizard is
// deleted, not deprecated") with a Steward-led reactive workspace.
// Server component: resolves the signed-in user via getUserContext,
// composes the cold-open Steward greeting, hydrates it as the first
// turn in the workspace.

import { redirect } from 'next/navigation';
import { ProgramOriginationWorkspace } from '@/components/programs/origination/ProgramOriginationWorkspace';
import { composeColdOpen } from '@/components/programs/origination/composeColdOpen';
import { getUserContext } from '@/lib/agent/userContext';
import { requireTenancy } from '@/app/api/v1/programs/_auth';
import { instantiateTemplate } from '@/lib/templates/registry';

export const metadata = {
  title: 'New Program · AbarVa',
};

export const dynamic = 'force-dynamic';

export default async function ProgramsNewPage({
  searchParams,
}: {
  searchParams?: Promise<{ template?: string; version?: string }>;
}) {
  const params = await searchParams;
  if (params?.template) {
    const ctx = await requireTenancy();
    const parsedVersion = params.version ? Number(params.version) : undefined;
    const instance = await instantiateTemplate(
      params.template,
      Number.isFinite(parsedVersion) ? parsedVersion : undefined,
      ctx.clientId,
      {
        origin: '/programs/new',
        createProgramShell: true,
      },
      { userId: ctx.userId, clientId: ctx.clientId },
    );
    redirect(`/programs/${instance.engagementId ?? instance.instanceId}`);
  }

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

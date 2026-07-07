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
import { isFeatureEnabled } from '@/lib/features/is-feature-enabled';

export const metadata = {
  title: 'New Program · AbarVa',
};

export const dynamic = 'force-dynamic';

export default async function ProgramsNewPage({
  searchParams,
}: {
  searchParams?: Promise<{
    template?: string;
    version?: string;
    fromIntelligence?: string;
    intelligenceSessionId?: string;
    sessionId?: string;
    originatingSessionId?: string;
  }>;
}) {
  const params = await searchParams;
  const originatingIntelligenceSessionId =
    params?.fromIntelligence === '1'
      ? params.intelligenceSessionId ?? params.sessionId ?? params.originatingSessionId ?? null
      : null;
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
        originatingIntelligenceSessionId,
      },
      { userId: ctx.userId, clientId: ctx.clientId },
    );
    redirect(`/programs/${instance.engagementId ?? instance.instanceId}`);
  }

  const user = await getUserContext();
  const greeting = composeColdOpen({ user, variant: 'production' });

  // Discovery Intake (S6): compute the flag server-side; the client workspace
  // renders the discovery capture panel only when it's on for this tenant.
  const flagCtx = await requireTenancy();
  const discoveryIntakeEnabled = isFeatureEnabled(flagCtx, 'discovery_intake_v2');

  return (
    <ProgramOriginationWorkspace
      surface="/programs/new"
      tenantName={user?.tenantDisplayName ?? 'AbarVa'}
      discoveryIntakeEnabled={discoveryIntakeEnabled}
      initialTurns={[
        {
          id: greeting.id,
          role: 'assistant',
          agentName: 'Steward',
          text: originatingIntelligenceSessionId
            ? `${greeting.text}\n\nI also have the originating Intelligence session attached, so the brief can preserve the rationale behind this Move.`
            : greeting.text,
        },
      ]}
      originatingIntelligenceSessionId={originatingIntelligenceSessionId}
    />
  );
}

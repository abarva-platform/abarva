import { notFound } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { StageTrackerStrip } from '@/components/shell/StageTrackerStrip';
import { SentinelAgentColumn } from '@/components/source/SentinelAgentColumn';
import { SourceWorkingPane } from '@/components/source/SourceWorkingPane';
import { NexusEngagementCanvas } from '@/components/source/NexusEngagementCanvas';
import { SourceCommercialEventSection } from '@/components/source/SourceCommercialEventSection';
import { getSourcingEvent } from '@/lib/source/queries';
import { AMS_SOURCE_EVENT } from '@/lib/source/shell-source-fixture';

export const dynamic = 'force-dynamic';

export default async function SourceEventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await getSourcingEvent(eventId);
  if (!event) notFound();

  return (
    <AppShell
      surface="source"
      topBarProps={{
        tenantName: event.accountName,
        showLocked: true,
        context: `Source · ${event.name} · ${event.currentStageLabel}`,
      }}
      middleStrip={
        <StageTrackerStrip
          stages={AMS_SOURCE_EVENT.stages}
          activeStage={event.currentStageLabel === 'Orals/BAFO' ? 'BAFO' : event.currentStageLabel}
        />
      }
    >
      <SentinelAgentColumn
        quote={`${event.name} at ${event.currentStageLabel}. ${event.blocker ? `Blocker: ${event.blocker}.` : 'No active blockers.'} Linked to ${event.code}.`}
        agentContext={`Sentinel · ${event.name} · ${event.currentStageLabel}`}
        actions={[
          { letter: 'A', text: 'Review Design gate blockers', detail: 'Gate items blocking P2 → P3 advance for linked program' },
          { letter: 'B', text: 'Open Workshop 5 outcomes', detail: 'Workshop 5 decisions and unresolved evidence gaps' },
          { letter: 'C', text: 'Inspect deliverable evidence', detail: 'Review staged artifacts before moving to BAFO' },
        ]}
      />
      <SourceWorkingPane>
        <NexusEngagementCanvas event={event} />
        <SourceCommercialEventSection
          eventId={event.id}
          eventName={event.name}
          accountName={event.accountName}
        />
      </SourceWorkingPane>
    </AppShell>
  );
}

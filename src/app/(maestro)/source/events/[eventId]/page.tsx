import { notFound } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { StageTrackerStrip } from '@/components/shell/StageTrackerStrip';
import { SentinelAgentColumn } from '@/components/source/SentinelAgentColumn';
import { SentinelSynthesisQuote } from '@/components/source/SentinelSynthesisQuote';
import { SourceWorkingPane } from '@/components/source/SourceWorkingPane';
import { NexusEngagementCanvas } from '@/components/source/NexusEngagementCanvas';
import { SourceCommercialEventSection } from '@/components/source/SourceCommercialEventSection';
import { getSourcingEvent } from '@/lib/source/queries';
import { AMS_SOURCE_EVENT } from '@/lib/source/shell-source-fixture';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';

export const dynamic = 'force-dynamic';

export default async function SourceEventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await getSourcingEvent(eventId);
  if (!event) notFound();

  // Resolve typed instance for live synthesis. Fallback to AMS instance when
  // other events don't have a typed SourceEventInstance yet.
  const matchedInstance = SOURCE_EVENT_INSTANCES.find(i => i.id === eventId)
    ?? SOURCE_EVENT_INSTANCES[0];

  return (
    <AppShell
      surface="source"
      surfaceContext={{
        eventId: event.id,
        eventName: event.name,
        eventCode: event.code ?? '',
        currentStage: event.currentStageLabel ?? '',
        blocker: event.blocker ?? null,
        valueAtStakeUsd: event.valueAtStakeUsd ?? null,
      }}
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
        synthesisNode={
          <SentinelSynthesisQuote
            instanceId={matchedInstance?.id ?? 'ams-vendor-consolidation-2026'}
            fallback={`${event.name} at ${event.currentStageLabel}.${event.blocker ? ` Blocker: ${event.blocker}.` : ''}`}
          />
        }
        quote={`${event.name} at ${event.currentStageLabel}.`}
        agentContext={`Sentinel · ${event.name} · ${event.currentStageLabel}`}
        actions={[
          { letter: 'A', text: 'Review BAFO award status', detail: 'Vendor C selected — award and integration contract in final review' },
          { letter: 'B', text: 'Open CDP linked program', detail: 'APX-CDP-2026 P3 Design · Architecture sprint active' },
          { letter: 'C', text: 'Inspect vendor evidence', detail: 'BAFO submissions and SOC-2 attestations on file' },
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

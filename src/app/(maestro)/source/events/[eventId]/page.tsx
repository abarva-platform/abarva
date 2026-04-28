import { notFound } from 'next/navigation';
import { NexusEngagementCanvas, SourceCanonShell } from '@/components/source';
import { SourceRouteShell } from '@/components/source/SourceRouteShell';
import { getSourcingEvent } from '@/lib/source/queries';
import { SourceCommercialEventSection } from '@/components/source/SourceCommercialEventSection';

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
      <SourceRouteShell
        pageMode="event_detail"
        eventName={event.name}
        tenantName={event.accountName}
        contextUsed={[
          `Program: ${event.name}`,
          `Current stage: ${event.currentStageLabel}`,
          `Gate state: ${event.stages.find((stage) => stage.key === event.currentStageKey)?.status ?? 'unknown'}`,
          `Linked program: ${event.code}`
        ]}
        suggestedActions={[
          { label: 'Review Design gate blockers', href: '#source-route-gate-blockers', description: 'View stage blockers and next gate requirements.' },
          { label: 'Open Workshop 5 outcomes', href: '#source-route-workshop-5', description: 'Open workshop-linked evidence and notes.' },
          { label: 'Inspect deliverable evidence', href: '#source-route-evidence', description: 'Inspect staged artifacts before moving to BAFO.' },
        ]}
        customAskPrompt="Ask Nexus about this program, gate, workshop, or evidence..."
      >
      <SourceCanonShell
        activeRoute="events"
        title={event.name}
        summary={`${event.accountName} · ${event.code} · Source event canvas led by Nexus across pricing, risk, BAFO, readiness, mission, and signal workflow steps.`}
      >
        <NexusEngagementCanvas event={event} />
        <SourceCommercialEventSection
          eventId={event.id}
          eventName={event.name}
          accountName={event.accountName}
        />
      </SourceCanonShell>
    </SourceRouteShell>
  );
}

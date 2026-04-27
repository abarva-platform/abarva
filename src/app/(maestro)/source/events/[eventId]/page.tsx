import { notFound } from 'next/navigation';
import { NexusEngagementCanvas, SourceCanonShell } from '@/components/source';
import { SourceRouteShell } from '@/components/source/SourceRouteShell';
import { getSourcingEvent } from '@/lib/source/queries';
import { SourceCommercialEventSection } from '@/components/source/SourceCommercialEventSection';
import { buildLinkedProgramBadgeView } from '@/lib/source/linked-program-badge-view';

export const dynamic = 'force-dynamic';

export default async function SourceEventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await getSourcingEvent(eventId);
  if (!event) notFound();
  const linkedProgram = buildLinkedProgramBadgeView(event.id);

  return (
    <SourceRouteShell
      pageMode="event_detail"
      eventName={event.name}
      tenantName={event.accountName}
      hasLinkedProgram={!!linkedProgram}
      linkedProgramCode={linkedProgram?.programCode}
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

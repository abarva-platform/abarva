import { notFound } from 'next/navigation';
import { NexusEngagementCanvas, SourceFoundationShell } from '@/components/source';
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
    <SourceFoundationShell
      activeRoute="events"
      title={event.name}
      summary={`${event.accountName} · ${event.code} · Source event canvas shell led by Nexus with deterministic mission, readiness, and journey context.`}
    >
      <NexusEngagementCanvas event={event} />
      <SourceCommercialEventSection
        eventId={event.id}
        eventName={event.name}
        accountName={event.accountName}
      />
    </SourceFoundationShell>
  );
}

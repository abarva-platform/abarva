import { notFound } from 'next/navigation';
import { NexusEngagementCanvas, SourceFoundationShell } from '@/components/source';
import { getSourcingEvent } from '@/lib/source/queries';

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
      summary={`${event.accountName} · ${event.code} · canonical Source event workspace led by Nexus. This page establishes the event canvas boundary only.`}
    >
      <NexusEngagementCanvas event={event} />
    </SourceFoundationShell>
  );
}

import { notFound } from 'next/navigation';
import { ScorecardGovernancePanel, SourceFoundationShell } from '@/components/source';
import { getSourcingEvent } from '@/lib/source/queries';

export const dynamic = 'force-dynamic';

export default async function SourceEventScorecardPage({
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
      title={`${event.name} · scorecard`}
      summary="Canonical Source scorecard route. This is the governance boundary for evaluation criteria, approval state, and decision readiness."
    >
      <ScorecardGovernancePanel scorecard={event.scorecard} />
    </SourceFoundationShell>
  );
}

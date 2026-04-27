import { SourceCanonShell } from '@/components/source';
import { SourceEventsPortfolio } from '@/components/source/SourceEventsPortfolio';
import { listSourcingEvents } from '@/lib/source/queries';

export const dynamic = 'force-dynamic';

export default async function SourceEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; status?: string }>;
}) {
  const { stage, status } = await searchParams;
  const events = await listSourcingEvents();

  return (
    <SourceCanonShell
      activeRoute="events"
      title="Source events"
      summary="Source Events Portfolio command surface for scanning seeded sourcing events by stage, blocker, value, and next commercial move before drilling into the full event canvas."
    >
      <SourceEventsPortfolio
        events={events}
        activeStage={stage ?? null}
        activeStatus={status ?? null}
      />
    </SourceCanonShell>
  );
}

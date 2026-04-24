import { SourceFoundationShell, SourcingEventTable } from '@/components/source';
import { listSourcingEvents } from '@/lib/source/queries';

export const dynamic = 'force-dynamic';

export default async function SourceEventsPage() {
  const events = await listSourcingEvents();

  return (
    <SourceFoundationShell
      activeRoute="events"
      title="Source events"
      summary="Canonical event index for sourcing workflows. This replaces the need to extend legacy /programs and keeps Source-specific lifecycle, scorecard, artifact, and ledger boundaries in one route family."
    >
      <SourcingEventTable events={events} />
    </SourceFoundationShell>
  );
}

import { AppShell } from '@/components/shell/AppShell';
import { StageTrackerStrip } from '@/components/shell/StageTrackerStrip';
import { SentinelAgentColumn } from '@/components/source/SentinelAgentColumn';
import { SourceWorkingPane } from '@/components/source/SourceWorkingPane';
import { SourceEventsPortfolio } from '@/components/source/SourceEventsPortfolio';
import { SourceEmptyState } from '@/components/source/SourceEmptyState';
import { listSourcingEvents } from '@/lib/source/queries';
import { AMS_SOURCE_EVENT } from '@/lib/source/shell-source-fixture';

export const dynamic = 'force-dynamic';

export default async function SourceEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; status?: string }>;
}) {
  const { stage, status } = await searchParams;
  const events = await listSourcingEvents();

  return (
    <AppShell
      surface="source"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Source · Events portfolio',
      }}
      middleStrip={
        <StageTrackerStrip
          stages={AMS_SOURCE_EVENT.stages}
          activeStage=""
        />
      }
    >
      {events.length === 0 ? (
        <SourceEmptyState />
      ) : (
        <>
          <SentinelAgentColumn
            quote="12 events across the portfolio · 4 active · AMS Vendor Consolidation 2026 in Stage 7 BAFO, one input away from close."
            agentContext="Sentinel · Source events · Apex Retail Group"
            actions={[
              { letter: 'A', text: 'Review BAFO events', detail: 'Sourcing events currently in Orals/BAFO stage' },
              { letter: 'B', text: 'Review evaluation queue', detail: 'Events in vendor evaluation awaiting scoring' },
              { letter: 'C', text: 'Review at-risk events', detail: 'Events flagged with blockers or governance gaps' },
            ]}
          />
          <SourceWorkingPane>
            <SourceEventsPortfolio
              events={events}
              activeStage={stage ?? null}
              activeStatus={status ?? null}
            />
          </SourceWorkingPane>
        </>
      )}
    </AppShell>
  );
}

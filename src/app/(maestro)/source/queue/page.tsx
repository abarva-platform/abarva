import { AppShell } from '@/components/shell/AppShell';
import { SourceSubNav } from '@/components/source/SourceSubNav';
import { SourceWorkingPane } from '@/components/source/SourceWorkingPane';
import { SourceDecisionQueueView } from '@/components/source/SourceDecisionQueueView';
import { getActiveClientRow } from '@/lib/active-client';
import { canonicalClientDisplayName } from '@/lib/client-config';
import { loadSourceDecisionQueueWithEvidence } from '@/lib/source/decision-queue/load';
import { listSourcingEvents } from '@/lib/source/queries';
import { computeSourcePortfolioMetrics } from '@/lib/source/portfolio-metrics';
import {
  normalizeTriageBandFilter,
  normalizeTriageSort,
} from '@/lib/source/queue/triage-banding';

export const metadata = { title: 'Source · Decision Queue · AbarVa' };
export const dynamic = 'force-dynamic';

type QueueSearchParams = Record<string, string | string[] | undefined>;

/**
 * The Source Decision Queue — the triggered-decision inbox (Practitioner-Fit
 * §3). Re-fronts Source as "here is what to decide today" rather than "start
 * a workflow". Cards deep-link into the Renewal Cockpit, pre-loaded.
 */
export default async function SourceDecisionQueuePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [activeClient, params, events] = await Promise.all([
    getActiveClientRow().catch(() => null),
    searchParams ?? Promise.resolve({} as QueueSearchParams),
    listSourcingEvents().catch(() => []),
  ]);
  const clientKey = activeClient?.key ?? 'apexretail';
  const activeClientDisplayName =
    canonicalClientDisplayName({ key: activeClient?.key, name: activeClient?.name }) ??
    'AbarVa Client';
  const activeBand = normalizeTriageBandFilter(params.band);
  const sort = normalizeTriageSort(params.sort);
  const { visibleEvents } = computeSourcePortfolioMetrics(events);
  const activeEventsCount = visibleEvents.filter(
    (event) => event.status !== 'completed' && event.status !== 'archived',
  ).length;
  const { queue, evidenceContext } =
    await loadSourceDecisionQueueWithEvidence(clientKey);

  return (
    <AppShell
      surface="source"
      topBarProps={{
        tenantName: activeClientDisplayName,
        showLocked: true,
        context: 'Source · Decision Queue',
      }}
      subNav={<SourceSubNav />}
    >
      <SourceWorkingPane>
        <SourceDecisionQueueView
          queue={queue}
          evidenceContext={evidenceContext}
          activeBand={activeBand}
          sort={sort}
          activeEventsCount={activeEventsCount}
        />
      </SourceWorkingPane>
    </AppShell>
  );
}

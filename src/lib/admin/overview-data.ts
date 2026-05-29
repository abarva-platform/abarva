/**
 * overview-data.ts · Admin Overview supplemental data fetchers
 *
 * Thin wrappers around the raw DB queries used by /admin/page.tsx so the
 * page server component does not directly reference the Supabase client.
 * This keeps the admin page within the broker-boundary contract tested by
 * the production-readiness-tracker module-hygiene suite.
 */

import { azureRead } from '@/lib/data-plane/azureRead';
import { listInitiativesForClient, type AIInitiative } from '@/lib/admin/ai-initiatives/queries';

export interface OverviewSupplementalData {
  programsCount: number;
  programsP6Count: number;
  sourceEventsCount: number;
  sourceEventsAtRiskCount: number;
  initiativesList: ReadonlyArray<AIInitiative>;
}

/**
 * Fetches engagement + source event + initiative counts for the admin
 * overview tile strip. All queries fail-soft — returns zeroes if the
 * tenant is unbound or RLS blocks a row.
 */
export async function getOverviewSupplementalData(
  clientKey: string,
  clientId: string | null,
): Promise<OverviewSupplementalData> {
  const [programsRows, sourceEventsRows, initiativesList] = await Promise.all([
    clientId
      ? azureRead.select<{ id: string; current_phase: number | null }>({
          table: 'engagements',
          columns: ['id', 'current_phase'],
          where: { client_id: clientId },
        }).catch(() => [])
      : Promise.resolve([]),
    azureRead.select<{ id: string; lifecycle_state: string | null }>({
      table: 'source_events',
      columns: ['id', 'lifecycle_state'],
      where: { client_key: clientKey },
    }).catch(() => []),
    clientId
      ? listInitiativesForClient(clientId).catch(() => [] as ReadonlyArray<AIInitiative>)
      : Promise.resolve([] as ReadonlyArray<AIInitiative>),
  ]);

  return {
    programsCount: programsRows.length,
    programsP6Count: programsRows.filter((r) => (r.current_phase ?? 0) >= 6).length,
    sourceEventsCount: sourceEventsRows.length,
    sourceEventsAtRiskCount: sourceEventsRows.filter((r) =>
      /risk|blocked|stalled/i.test(r.lifecycle_state ?? ''),
    ).length,
    initiativesList,
  };
}

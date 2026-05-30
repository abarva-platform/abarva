/**
 * Overview supplemental broker · Wave 1 PR-4
 *
 * Companion to `trust-spine-broker.ts`. Surfaces the engagement +
 * source-event + AI-initiative counts the admin landing page needs
 * for its panel-readiness extras (`composeHomeV2Extras`).
 *
 * This file replaces the old `src/lib/admin/overview-data.ts`
 * location. `overview-data.ts` now re-exports from here so callers
 * (admin/page.tsx, existing tests) keep working unchanged, but the
 * data queries live behind the broker dir — codifying that admin
 * surface code reads through `src/lib/admin/broker/**` only.
 *
 * Broker-boundary doctrine: this module uses `azureRead` (the
 * compatibility data-plane reader) and is server-only. The
 * `broker-boundary` hygiene test allows `azureRead` inside
 * `src/lib/admin/broker/**`; everywhere else in admin it is
 * still allowed (it is the canonical read seam — see
 * `setup-data-broker.ts`). What is NOT allowed is bypassing the
 * broker layer by reaching for the Supabase server client or a
 * direct supabase-js client from page components or sibling
 * lib files. The hygiene test at
 * `src/lib/admin/__tests__/broker-boundary.test.ts` enforces the
 * exact names.
 */

import 'server-only';

import { azureRead } from '@/lib/data-plane/azureRead';
import {
  listInitiativesForClient,
  type AIInitiative,
} from '@/lib/admin/ai-initiatives/queries';

export interface OverviewSupplementalData {
  programsCount: number;
  programsP6Count: number;
  sourceEventsCount: number;
  sourceEventsAtRiskCount: number;
  initiativesList: ReadonlyArray<AIInitiative>;
}

/**
 * Fetch engagement + source-event + initiative counts for the
 * admin overview supplemental tiles. All queries fail-soft —
 * returns zeroes if the tenant is unbound or RLS blocks a row.
 */
export async function getOverviewSupplementalData(
  clientKey: string,
  clientId: string | null,
): Promise<OverviewSupplementalData> {
  const [programsRows, sourceEventsRows, initiativesList] = await Promise.all([
    clientId
      ? azureRead
          .select<{ id: string; current_phase: number | null }>({
            table: 'engagements',
            columns: ['id', 'current_phase'],
            where: { client_id: clientId },
          })
          .catch(() => [])
      : Promise.resolve([]),
    azureRead
      .select<{ id: string; lifecycle_state: string | null }>({
        table: 'source_events',
        columns: ['id', 'lifecycle_state'],
        where: { client_key: clientKey },
      })
      .catch(() => []),
    clientId
      ? listInitiativesForClient(clientId).catch(
          () => [] as ReadonlyArray<AIInitiative>,
        )
      : Promise.resolve([] as ReadonlyArray<AIInitiative>),
  ]);

  return {
    programsCount: programsRows.length,
    programsP6Count: programsRows.filter((r) => (r.current_phase ?? 0) >= 6)
      .length,
    sourceEventsCount: sourceEventsRows.length,
    sourceEventsAtRiskCount: sourceEventsRows.filter((r) =>
      /risk|blocked|stalled/i.test(r.lifecycle_state ?? ''),
    ).length,
    initiativesList,
  };
}

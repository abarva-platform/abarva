// Cross-module decision trace · Wave 5, Slice 5.4.
//
// NEW read-only route: /strategic-moves/[moveId]/trace.
//
// Renders the joined evidence trail for one Move across
// Intelligence -> Move -> Source -> Tower. It READS and ID-joins
// existing data — the Move (programs query seam), the tenant's Source
// events (source-events read adapter), and the tenant's outcome-ledger
// entries (outcome-ledger read adapter). Where a loop hand-off is not
// wired, the trace step is shown as "not yet linked" — never
// fabricated. See docs/strategy/scenarios/*-LOOP-WIRING-GAPS.md.
//
// This route does NOT mutate data, runs no migration, and does not
// edit the Intelligence/Moves/Source/Tower surface pages.

import { notFound, redirect } from 'next/navigation';
import { requireProductModule } from '@/lib/auth/server-module-access';
import { getActiveClientRow } from '@/lib/active-client';
import { getStrategicMoveById } from '@/lib/programs/queries';
import { getStrategicMovesTenancy } from '@/lib/programs/strategic-moves-context';
import {
  buildCrossModuleTrace,
  type TraceSourceEvent,
} from '@/lib/programs/cross-module-trace-view';
import { buildControlEvalMatrix } from '@/lib/programs/controls/control-eval-matrix';
import { getSolutionArchetype } from '@/lib/programs/taxonomy/solution-archetype-taxonomy';
import {
  isSr117RegulatedTenant,
  resolveSolutionArchetypeForMove,
} from '@/lib/programs/regulatory/sr-11-7-control-deliverable';
import { selectSourceEventsReadAdapter } from '@/lib/data-plane/read-adapters/sourceEventsReadAdapter';
import { selectOutcomeLedgerReadAdapter } from '@/lib/data-plane/read-adapters/outcomeLedgerReadAdapter';
import { canonicalTenantKey } from '@/lib/tenant-keys';
import { CrossModuleTraceView } from '@/components/strategic-moves/CrossModuleTraceView';
import { AppShell } from '@/components/shell/AppShell';
import type { SourceEventDbRow } from '@/lib/data-plane/read-adapters/sourceEventsReadAdapter';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Decision trace · AbarVa' };

interface Props {
  params: Promise<{ moveId: string }>;
}

/** Project a persisted source-events row onto the trace's join shape. */
function toTraceSourceEvent(row: SourceEventDbRow): TraceSourceEvent {
  return {
    id: row.id,
    code: row.event_code,
    name: row.event_name,
    currentStageLabel: row.current_stage_key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    statusLabel: row.lifecycle_state
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    nextAction: row.scope_description || 'Continue Source workflow.',
    linkedProgramId: row.linked_program_id,
  };
}

export default async function StrategicMoveTracePage({ params }: Props) {
  await requireProductModule('programs');
  const ctx = await getStrategicMovesTenancy();
  if (!ctx) redirect('/sign-in');

  const { moveId } = await params;

  const move = await getStrategicMoveById(ctx, moveId);
  if (!move) notFound();

  // ID-join the cross-module evidence trail. Source-event and
  // outcome-ledger reads are scoped to the active tenant and degrade
  // to [] when their tables are absent — the trace then renders the
  // affected steps honestly as "not yet linked".
  const activeClient = await getActiveClientRow();
  const clientKey = canonicalTenantKey(activeClient?.key ?? ctx.clientKey ?? '');

  let sourceEvents: TraceSourceEvent[] = [];
  let outcomeEntries: Awaited<
    ReturnType<
      ReturnType<typeof selectOutcomeLedgerReadAdapter>['getCurrentEntries']
    >
  > = [];

  if (clientKey) {
    const sourceAdapter = selectSourceEventsReadAdapter(undefined, clientKey);
    const [active, pending, ledger] = await Promise.all([
      sourceAdapter.getActiveEventsForClient(clientKey).catch(() => []),
      sourceAdapter.getPendingEventsForClient(clientKey).catch(() => []),
      selectOutcomeLedgerReadAdapter(undefined, clientKey)
        .getCurrentEntries(clientKey)
        .catch(() => []),
    ]);
    const seen = new Set<string>();
    sourceEvents = [...active, ...pending]
      .filter((row) => {
        if (seen.has(row.id)) return false;
        seen.add(row.id);
        return true;
      })
      .map(toTraceSourceEvent);
    outcomeEntries = ledger;
  }

  // For a regulated tenant (financial services), shape the Slice 2.5
  // control & eval matrix so the trace can surface the SR 11-7 model-risk
  // control deliverable (model validation, ongoing monitoring, governance)
  // as an explicit, traceable artifact on the Move phase trace. The Move
  // touches a regulated decision, so the matrix is built with the
  // sensitive-data and high-stakes framing flags set — this is the
  // model-risk-conservative reading SR 11-7 expects.
  const controlMatrix = isSr117RegulatedTenant(move.tenant.industryCode)
    ? buildControlEvalMatrix(
        getSolutionArchetype(resolveSolutionArchetypeForMove(move.archetype)),
        { handlesSensitiveData: true, highStakesDecision: true },
      )
    : undefined;

  const trace = buildCrossModuleTrace({
    move,
    sourceEvents,
    outcomeEntries,
    controlMatrix,
  });

  return (
    <AppShell surface="programs-detail">
      <CrossModuleTraceView trace={trace} />
    </AppShell>
  );
}

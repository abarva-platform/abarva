// Agent generation · context binder
//
// Pulls everything a prompt template needs to generate an artifact
// body: tenant identity, event metadata, all per-event substrate.
// Tenant-scoped via the existing canvas-substrate queries (RLS holds).
//
// Pure function over the substrate query layer — no caching, no
// memoization. Each generation call gets a fresh read so a body
// generated after Mark-met flips reflects the latest state.

import {
  listArtifactStatesForEvent,
  listEvidenceStatesForEvent,
  listGateCriterionStatesForEvent,
} from '@/lib/source/canvas-substrate/queries';
import { getSourcingEvent } from '@/lib/source/queries';
import { canonicalClientDisplayName } from '@/lib/client-config';
import { getActiveClientRow } from '@/lib/active-client';
import { clientKeyToInventorySubstrateKey } from '@/lib/agent/tools/intelligence/_shared';
import { listAppInventoryRecords } from '@/lib/admin/setup-data-broker';
import type { SourceAppInventoryEntry, SourceGenerationContext } from './types';

/**
 * Build the read-only context snapshot for a generation call.
 *
 * Returns null if the event can't be resolved or the active client
 * doesn't match — the caller renders a 404 / 403 from there.
 */
export async function buildSourceGenerationContext(
  eventIdOrCode: string,
): Promise<SourceGenerationContext | null> {
  const [event, activeClient] = await Promise.all([
    getSourcingEvent(eventIdOrCode),
    getActiveClientRow().catch(() => null),
  ]);
  if (!event) return null;

  const tenantName =
    canonicalClientDisplayName({
      key: activeClient?.key,
      name: activeClient?.name,
    }) ?? event.accountName;

  // The substrate queries take a UUID. event.id is always a UUID
  // even when the URL slug is a code.
  const [artifactStates, gateCriteria, evidence] = await Promise.all([
    listArtifactStatesForEvent(event.id),
    listGateCriterionStatesForEvent(event.id),
    listEvidenceStatesForEvent(event.id),
  ]);

  // Pull the tenant's application inventory through the sanctioned broker seam
  // so d04 pre-populates from real systems instead of a blank stub. The active
  // client key (e.g. 'apexretail') must be translated to the substrate key
  // (e.g. 'apex-retail') first, or the read returns zero rows. Degrades to an
  // empty inventory when nothing is loaded — never fatal to generation.
  const substrateKey = activeClient?.key
    ? clientKeyToInventorySubstrateKey(activeClient.key)
    : null;
  const appInventoryRows = substrateKey
    ? await listAppInventoryRecords(substrateKey).catch(() => [])
    : [];
  const enterpriseAppInventory: SourceAppInventoryEntry[] = appInventoryRows.map(
    (row) => ({
      appId: row.recordId,
      name: row.name,
      tier: row.tier,
      owner: row.owner,
      vendor: row.vendor,
      criticality: row.criticality,
      notes: row.notes,
    }),
  );

  return {
    tenantKey: activeClient?.key ?? 'unknown',
    tenantName,
    event: {
      id: event.id,
      code: event.code,
      name: event.name,
      archetype: event.archetype ?? null,
      rigor: event.rigor ?? null,
      currentStageKey: event.currentStageKey,
      statusLabel: event.statusLabel,
      owner: event.owner ?? null,
      // SourcingEventDetail exposes synopsis + problemStatement which
      // capture the trigger + scope narrative produced at intake time.
      triggerDescription: extractTrigger(event.problemStatement) ?? null,
      scopeDescription: event.problemStatement ?? null,
      estimatedValueUsd: event.valueAtStakeUsd ?? null,
    },
    artifactStates,
    gateCriteria,
    evidence,
    enterpriseAppInventory,
  };
}

/**
 * Pluck approved-or-richer bodies from the substrate, keyed by code.
 * The prompt builder uses this to bind upstream artifacts into the
 * user message. Pre-approval-status bodies are still included if a
 * body exists — the user may have authored content but not yet flipped
 * the status pill, and the agent should still consume what's there.
 */
export function collectUpstreamBodies(
  ctx: SourceGenerationContext,
  codes: string[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const code of codes) {
    const row = ctx.artifactStates.find((a) => a.artifactCode === code);
    if (row?.body && row.body.trim().length > 0) {
      out[code] = row.body;
    }
  }
  return out;
}

/**
 * Cheap heuristic — pull the first sentence-ish out of scope_description
 * to surface the trigger in the prompt without dragging in the whole
 * narrative. The intake form's trigger field gets concatenated into
 * scope_description on event creation.
 */
function extractTrigger(scope: string | null | undefined): string | null {
  if (!scope) return null;
  const triggerLine = scope
    .split('\n')
    .find((line) => /trigger|why\s*now/i.test(line));
  return triggerLine?.replace(/^[^:]*:\s*/, '').trim() || null;
}

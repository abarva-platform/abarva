// Load a Move's `MoveBusinessCaseInput` — the route-side loader for the
// generic board-grade Costed Business-Case deck.
//
// The board-grade business-case route, given a `?moveId=`, must render that
// Move's kernel-derived deck. `buildMoveBusinessCase` / the generic renderer
// need a `MoveBusinessCaseInput` — the Move's industry code, charter, name and
// recorded baseline metrics. This module assembles that input for a real
// `engagements` row, tenancy-scoped.
//
// TENANCY: the Move is resolved through `getProgramById` — the tenancy-scoped,
// RBAC-gated single-program query. A caller can only load a Move on their own
// tenant; an out-of-tenant or inaccessible `moveId` resolves to `null`. The
// industry code (`clients.industry_code`) and the recorded baseline metrics
// (`engagements.baseline_metrics`) are then read with the same server client,
// scoped to the program that already passed the tenancy check.
//
// Returns `null` honestly when the Move is not accessible — the route falls
// back to its reference deck rather than rendering a wrong-tenant Move.

import { getServerSupabase } from '@/lib/supabase-server';
import { requireTenancy } from '@/lib/auth/tenancy';
import { getProgramById } from '../queries';
import type { MoveBusinessCaseInput } from '../move-business-case';

/**
 * Load the `MoveBusinessCaseInput` for a Move by id, tenancy-scoped.
 *
 * Resolves the Move through `getProgramById` (RBAC-gated, tenant-scoped), then
 * reads the tenant's industry code and the Move's recorded baseline metrics.
 * Returns `null` when the Move does not exist or is not accessible to the
 * caller — the route then falls back honestly.
 */
export async function loadMoveBusinessCaseInput(
  moveId: string,
): Promise<MoveBusinessCaseInput | null> {
  if (!moveId.trim()) return null;

  const ctx = await requireTenancy();
  const program = await getProgramById(ctx, moveId);
  if (!program) return null;
  if (program.archivedAt || program.deletedAt) return null;

  const sb = getServerSupabase();

  // Industry code, tenant key, and tenant display name — all from the program's
  // client. The program already passed the tenancy check, so its client is the
  // caller's tenant. Tenant key/name are threaded so the board-grade renderer
  // can label the deck with the canonical tenant display name (P1-3) instead
  // of the industry slug ("retail").
  const { data: clientRow } = await sb
    .from('clients')
    .select('key, name, industry_code')
    .eq('id', program.clientId)
    .maybeSingle();
  const industryCode =
    typeof (clientRow as { industry_code?: unknown } | null)?.industry_code ===
    'string'
      ? ((clientRow as { industry_code: string }).industry_code)
      : null;
  const tenantKey =
    typeof (clientRow as { key?: unknown } | null)?.key === 'string'
      ? ((clientRow as { key: string }).key)
      : null;
  const tenantName =
    typeof (clientRow as { name?: unknown } | null)?.name === 'string'
      ? ((clientRow as { name: string }).name)
      : null;

  // Recorded baseline metrics — the `engagements.baseline_metrics` JSONB
  // array. Defensively narrowed: the column is untyped JSONB, so a non-array
  // value is treated as absent rather than trusted.
  const { data: engagementRow } = await sb
    .from('engagements')
    .select('baseline_metrics')
    .eq('id', moveId)
    .maybeSingle();
  const rawBaseline = (engagementRow as { baseline_metrics?: unknown } | null)
    ?.baseline_metrics;
  const baselineMetrics = Array.isArray(rawBaseline)
    ? (rawBaseline as MoveBusinessCaseInput['baseline_metrics'])
    : null;

  return {
    industry_code: industryCode,
    name: program.name,
    // The first-class `engagements.function_pack_key` column (via
    // `getProgramById` → `rowToProgram`). The resolver prefers it; `charter`
    // remains the fallback for a row the column-backfill missed.
    function_pack_key: program.functionPackKey,
    charter: program.charter,
    baseline_metrics: baselineMetrics,
    tenant_key: tenantKey,
    tenant_name: tenantName,
  };
}

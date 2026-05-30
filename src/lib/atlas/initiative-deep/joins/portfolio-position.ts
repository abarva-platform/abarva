// Join: within-tenant portfolio position.
//
// Computes this initiative's value-attainment percentile relative to its
// tenant's OTHER initiatives. Within-tenant only — we never reach across
// tenants for percentile peers.
//
// Formula:
//   - attainment_i = measured_value_usd / committed_annual_usd, when both
//     are present and committed_annual_usd > 0 (fallback to committed_total).
//   - percentile = (# peers with strictly lower attainment) / (# peers + 1) × 100,
//     rounded to the nearest integer. Mid-rank handling kept simple — we want
//     a stable order, not a published statistical method.
//
// Returns `null` when:
//   - this initiative has no measured value (nothing to rank);
//   - the tenant has fewer than 2 OTHER initiatives with attainment values
//     (sample too small to honestly call a percentile).
//
// Confidence tier:
//   - 'high' when ≥ 6 peers contributed,
//   - 'medium' when 3–5,
//   - 'low' when < 3 (or null).

import type { PostgresCompatClient } from '@/lib/data-plane/postgresCompat';
import type {
  AtlasTenancyCtx,
  ConfidenceTier,
  InitiativePortfolioPosition,
} from '../types';

interface InitiativeAttainmentRow {
  initiative_id: string;
  measured_value_usd: number | string | null;
  committed_annual_usd: number | string | null;
  committed_total_usd: number | string | null;
}

function toNum(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function attainmentOf(row: InitiativeAttainmentRow): number | null {
  const measured = toNum(row.measured_value_usd);
  const annual = toNum(row.committed_annual_usd);
  const total = toNum(row.committed_total_usd);
  const committed = annual !== null && annual > 0 ? annual : total !== null && total > 0 ? total : null;
  if (measured === null || committed === null) return null;
  return measured / committed;
}

function tierFromPeerCount(peerCount: number): ConfidenceTier {
  if (peerCount >= 6) return 'high';
  if (peerCount >= 3) return 'medium';
  return 'low';
}

/**
 * Compute the within-tenant portfolio position for one initiative.
 *
 * Tenant-scoped: pulls ONLY this tenant's other initiatives. There is no
 * cross-tenant percentile here, ever.
 */
export async function computePortfolioPosition(
  client: PostgresCompatClient,
  initiativeId: string,
  ctx: AtlasTenancyCtx,
): Promise<InitiativePortfolioPosition> {
  let rows: InitiativeAttainmentRow[] = [];
  try {
    const { data } = await client
      .from('ai_initiatives')
      .select('initiative_id, measured_value_usd, committed_annual_usd, committed_total_usd')
      .eq('client_id', ctx.clientId);
    rows = (data as InitiativeAttainmentRow[] | null) ?? [];
  } catch {
    return { valueAttainmentPercentileInTenant: null, confidenceTier: 'low' };
  }

  const me = rows.find((row) => row.initiative_id === initiativeId);
  if (!me) {
    return { valueAttainmentPercentileInTenant: null, confidenceTier: 'low' };
  }
  const myAttainment = attainmentOf(me);
  const peers = rows
    .filter((row) => row.initiative_id !== initiativeId)
    .map(attainmentOf)
    .filter((value): value is number => value !== null);

  if (myAttainment === null || peers.length < 2) {
    return {
      valueAttainmentPercentileInTenant: null,
      confidenceTier: tierFromPeerCount(peers.length),
    };
  }

  const lower = peers.filter((value) => value < myAttainment).length;
  const percentile = Math.round((lower / (peers.length + 1)) * 100);

  return {
    valueAttainmentPercentileInTenant: percentile,
    confidenceTier: tierFromPeerCount(peers.length),
  };
}

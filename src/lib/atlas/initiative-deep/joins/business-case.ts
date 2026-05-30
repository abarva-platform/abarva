// Join: kernel business-case skeleton.
//
// `buildMoveBusinessCase` operates on a Move (`engagements` row) with an
// `industry_code` and an optional `function_pack_key`. An `ai_initiatives`
// row is NOT a Move — it carries no industry code or function-pack key of
// its own. So this join makes a best-effort call:
//
//   - it resolves the tenant's `clients.industry_code` (the only
//     industry signal we have for a registry initiative);
//   - it passes the initiative's name + the tenant's industry to the kernel;
//   - if a Function Pack binds, the kernel runs and we surface the skeleton's
//     verdict, recommendation rationale, and kill criteria;
//   - if NOTHING binds, we return `null` — the deep view honestly says
//     "kernel could not compute a business case for this initiative".
//
// HONESTY: we NEVER fabricate a pack, a verdict, or a kill criterion. We
// also map the kernel's `Recommendation` ('fund'|'shape'|'kill') with a
// `'hold'` alias for the shape verdict where the critic has flagged
// monetisation as blocked (the kernel exposes this via the recommendation
// rationale, not as a separate verdict — we surface it untouched).

import type { PostgresCompatClient } from '@/lib/data-plane/postgresCompat';
import { buildMoveBusinessCase } from '@/lib/programs/move-business-case';
import type { AtlasTenancyCtx, InitiativeBusinessCaseSkeleton, PlanningRange } from '../types';
import type { InitiativeRow } from './ai-initiatives';

interface ClientIndustryRow {
  industry_code: string | null;
}

/**
 * Look up the tenant's `clients.industry_code`. This is the only industry
 * signal an ai_initiative row inherits — we read it tenant-scoped. Honest
 * `null` when the column is empty.
 */
export async function loadTenantIndustryCode(
  client: PostgresCompatClient,
  ctx: AtlasTenancyCtx,
): Promise<string | null> {
  const { data } = await client
    .from('clients')
    .select('industry_code')
    .eq('id', ctx.clientId)
    .limit(1)
    .maybeSingle();
  const row = data as ClientIndustryRow | null;
  return row?.industry_code ?? null;
}

export interface BusinessCaseJoinResult {
  skeleton: InitiativeBusinessCaseSkeleton | null;
  /** The kernel's value-forecast planning range, when computed — used by value-attestation. */
  projectedRange: PlanningRange | null;
}

/**
 * Build the deep-view business-case skeleton + projected planning range.
 *
 * Returns `{ skeleton: null, projectedRange: null }` when the kernel cannot
 * bind a Function Pack — the honest dead-end. The value-attestation join
 * then surfaces `projectedRange: null` and the deep view's
 * `businessCaseSkeleton` is `null`.
 */
export function buildBusinessCaseSkeleton(input: {
  initiative: InitiativeRow;
  industryCode: string | null;
}): BusinessCaseJoinResult {
  const { initiative, industryCode } = input;

  const result = buildMoveBusinessCase({
    industry_code: industryCode,
    name: initiative.name,
    id: initiative.initiative_id,
  });

  if (!result.bound || !result.skeleton) {
    return { skeleton: null, projectedRange: null };
  }

  const skeleton = result.skeleton;

  // The kernel returns 'fund' | 'shape' | 'kill'. We keep the verdict literal.
  // Composer can map 'shape' → "hold" in narrative; we surface 'shape' here.
  const verdict = skeleton.recommendation;

  const killCriteria = skeleton.killCriteria.map((kc) => ({
    name: kc.code,
    condition: kc.condition,
  }));

  const valueRange = skeleton.valueRange;
  const projectedRange: PlanningRange | null =
    Number.isFinite(valueRange.low) && Number.isFinite(valueRange.high)
      ? { label: 'planning-range', low: valueRange.low, high: valueRange.high, unit: 'USD' }
      : null;

  return {
    skeleton: {
      verdict,
      reasoning: skeleton.recommendationRationale ?? null,
      killCriteria,
    },
    projectedRange,
  };
}

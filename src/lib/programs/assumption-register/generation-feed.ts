import "server-only";

// Move assumptions register — the generation feed.
//
// Document generation reads a Move's register here and nowhere else. The flag
// decides whether the register governs a generation at all: off, this returns
// null and the caller builds its request exactly as before the register
// existed. On, the caller gets the rows a document may cite as `[A:ID]` — the
// counted statuses that pass the governance projection (see
// `approvedAssumptionsFromRegister`) — and the request is marked enforced, so
// a figure not in evidence traces only to one of these rows.
//
// A failed read is thrown, never folded into an empty register: an empty
// register under enforcement reads as "this Move has no working figures",
// which is a verdict, not a failure.

import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import type { ApprovedAssumption } from "@/lib/deliverables/orchestrator/types";
import type { TenancyCtx } from "@/lib/programs/types.db";
import {
  ASSUMPTION_REGISTER_FLAG,
  ASSUMPTION_REGISTER_GENERATION_FLAG,
  approvedAssumptionsFromRegister,
} from "./model";
import { listAssumptions } from "./store";

/** Does the register govern generation for this tenant? */
export function assumptionRegisterGovernsGeneration(
  ctx: Pick<TenancyCtx, "clientKey"> | null | undefined,
): boolean {
  // Both: the register exists for the tenant, and generation is enrolled.
  return (
    isFeatureEnabled(ctx ?? null, ASSUMPTION_REGISTER_FLAG) &&
    isFeatureEnabled(ctx ?? null, ASSUMPTION_REGISTER_GENERATION_FLAG)
  );
}

/**
 * The register rows a generation for this Move may cite, or null when the
 * register does not govern generation for this tenant. Throws when the
 * register cannot be read.
 */
export async function loadAssumptionRegisterForGeneration(
  ctx: TenancyCtx,
  programId: string,
): Promise<ApprovedAssumption[] | null> {
  if (!assumptionRegisterGovernsGeneration(ctx)) return null;
  const records = await listAssumptions(ctx, programId);
  return approvedAssumptionsFromRegister(records, { tenantId: ctx.clientId });
}

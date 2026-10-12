import { evaluateGate } from "./governance";
import type { TenancyCtx } from "./types.db";

/** One request shares pending gate reads; no result survives the request. */
export function createPhasePageGateReads(
  ctx: TenancyCtx,
  moveId: string,
  read: typeof evaluateGate = evaluateGate,
): typeof evaluateGate {
  const pending = new Map<string, ReturnType<typeof evaluateGate>>();
  return async (readCtx, readMoveId, fromPhase, toPhase, opts = {}) => {
    if (readCtx !== ctx || readMoveId !== moveId) {
      throw new Error("Phase page gate read scope mismatch");
    }
    if (opts.supabase)
      return read(readCtx, readMoveId, fromPhase, toPhase, opts);
    const key = `${fromPhase}:${toPhase}:${opts.allowHistoricalPhase === true}`;
    let result = pending.get(key);
    if (!result) {
      result = read(readCtx, readMoveId, fromPhase, toPhase, opts);
      pending.set(key, result);
    }
    return result;
  };
}

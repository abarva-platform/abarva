import { evaluateGate } from "./governance";
import type { TenancyCtx } from "./types.db";

export type PhasePageReadSet = <T>(
  ctx: TenancyCtx,
  moveId: string,
  source: string,
  load: () => Promise<T>,
) => Promise<T>;

/** Share canonical source reads only within this authenticated page request. */
export function createPhasePageReadSet(
  ctx: TenancyCtx,
  moveId: string,
): PhasePageReadSet {
  const pending = new Map<string, Promise<unknown>>();
  return async (readCtx, readMoveId, source, load) => {
    if (readCtx !== ctx || readMoveId !== moveId) {
      throw new Error("Phase page source read scope mismatch");
    }
    let result = pending.get(source);
    if (!result) {
      result = Promise.resolve().then(load);
      pending.set(source, result);
    }
    return result as ReturnType<typeof load>;
  };
}

/** One request shares pending gate reads; no result survives the request. */
export function createPhasePageGateReads(
  ctx: TenancyCtx,
  moveId: string,
  read: typeof evaluateGate = evaluateGate,
  readSet?: PhasePageReadSet,
): typeof evaluateGate {
  const pending = new Map<string, ReturnType<typeof evaluateGate>>();
  return async (readCtx, readMoveId, fromPhase, toPhase, opts = {}) => {
    if (readCtx !== ctx || readMoveId !== moveId) {
      throw new Error("Phase page gate read scope mismatch");
    }
    if (opts.supabase)
      return read(readCtx, readMoveId, fromPhase, toPhase, opts);
    const key = [
      fromPhase,
      toPhase,
      opts.allowHistoricalPhase === true,
      opts.skipP5Publication === true,
    ].join(":");
    let result = pending.get(key);
    if (!result) {
      result = read(readCtx, readMoveId, fromPhase, toPhase, {
        ...opts,
        ...(readSet ? { readSet } : {}),
      });
      pending.set(key, result);
    }
    return result;
  };
}

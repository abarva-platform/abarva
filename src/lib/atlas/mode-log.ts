import type { AtlasExecutionMode } from "@/lib/atlas/types";

/**
 * Atlas execution-mode log payload (T-462).
 *
 * `atlas_model_mode` is the only structured signal that says an answer was not
 * the model's. It was previously built inline inside a module-private logger in
 * `llm.ts`, so the only assertion available against it was a source-text grep —
 * and a grep passes just as happily on a module that deletes the log and leaves
 * the event name in a comment. Measured: gutting the logger to a no-op with the
 * names left in comments kept all three greps matching and the suite at 7/7.
 *
 * The payload is therefore built here, as a pure function with no logging in
 * it, so its contract can be asserted by calling it. The logger in `llm.ts`
 * stays module-private: the fix is to give the test something real to call, not
 * to export internals so a test can reach them.
 */

export const ATLAS_MODE_LOG_EVENT = "atlas_model_mode";

export type AtlasModeLogPayload = {
  event: typeof ATLAS_MODE_LOG_EVENT;
  tenantId: string;
  mode: AtlasExecutionMode;
  reason: string | null;
  model: string;
  workflow: string;
};

export function buildAtlasModeLogPayload(args: {
  tenantId: string;
  mode: AtlasExecutionMode;
  reason: string | null;
  model: string;
  workflow: string;
}): AtlasModeLogPayload {
  return {
    event: ATLAS_MODE_LOG_EVENT,
    tenantId: args.tenantId,
    mode: args.mode,
    reason: args.reason,
    model: args.model,
    workflow: args.workflow,
  };
}

/**
 * A fallback is a degraded answer and must be legible as one in the log stream;
 * every other mode is routine. Returned rather than branched at the call site so
 * the choice is assertable without capturing console output.
 */
export function atlasModeLogLevel(mode: AtlasExecutionMode): "warn" | "info" {
  return mode === "fallback" ? "warn" : "info";
}

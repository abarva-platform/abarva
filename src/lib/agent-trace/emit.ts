import 'server-only';

import { redactTrace, redactedModeDefault } from './redaction';
import { isTraceEmitEnabled, isTraceStorageEnabled, saveAgentContextTrace } from './repository';
import type { AgentContextTrace } from './types';

/**
 * Emit one governed-response trace. NEVER throws and NEVER blocks the response
 * path — failures are swallowed so observability can never break an answer.
 *
 * Storage strategy:
 *  - DB configured  → persist to public.agent_context_traces.
 *  - lab / no DB     → structured log line (single JSON, redacted) so traces
 *                      are still captured in local/CI runs.
 *
 * Returns the (possibly redacted) trace that was emitted, for callers that
 * want to attach it to an API payload.
 */
export async function emitAgentContextTrace(
  trace: AgentContextTrace,
): Promise<AgentContextTrace> {
  const finalTrace = redactedModeDefault() ? redactTrace(trace) : trace;
  if (!isTraceEmitEnabled()) return finalTrace;

  try {
    if (isTraceStorageEnabled()) {
      await saveAgentContextTrace(finalTrace);
    } else {
      logTrace(finalTrace);
    }
  } catch {
    // Storage failed (e.g. private DB unreachable from this runtime). Fall
    // back to a structured log so the trace is not lost, and never surface
    // the error to the response path.
    try {
      logTrace(finalTrace);
    } catch {
      /* give up silently */
    }
  }
  return finalTrace;
}

/**
 * Fire-and-forget wrapper: schedules emission without awaiting, so route
 * handlers can call it on the response path with zero added latency.
 */
export function emitAgentContextTraceAsync(trace: AgentContextTrace): void {
  void emitAgentContextTrace(trace).catch(() => void 0);
}

function logTrace(trace: AgentContextTrace): void {
  if (process.env.AGENT_TRACE_LOG === 'false') return;
  // Redacted trace carries no raw prompt/source text — safe to log.
  console.info(`[agent-trace] ${JSON.stringify({ kind: 'agent_context_trace', ...trace })}`);
}

// Agent Context-Bundle Trace · public surface.
//
// The trace is the audit spine proving every governed Moves/aVa response
// assembled its context bundle BEFORE Claude reasoning, what it included vs
// excluded (and why), and the post-response validation verdicts.

export * from './types';
export { hashModelInput, redactTrace, redactedModeDefault } from './redaction';
export {
  buildNexusTrace,
  buildAvaTrace,
  buildSentinelTrace,
  computeConfidenceDistribution,
  nexusConfidenceToNumeric,
  type BuildTraceCommon,
  type RawNexusSource,
  type RawAskSource,
} from './build';
export { emitAgentContextTrace, emitAgentContextTraceAsync } from './emit';
export {
  isTraceEmitEnabled,
  isTraceStorageEnabled,
  saveAgentContextTrace,
} from './repository';

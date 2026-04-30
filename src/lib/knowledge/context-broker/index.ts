import 'server-only';

/**
 * Public surface for the context broker. Slice CB-1.
 *
 * App-tier code (routes, surfaces, panel) consumes the
 * `ContextBundle` JSON shape. CB-4 lands the
 * `POST /api/context/demo` endpoint that returns this bundle as JSON;
 * CB-5 lands the panel; CB-6 wires the agent route. Until those land
 * the broker has no app-tier callers.
 *
 * Boundary note: a parallel `no-restricted-imports` rule banning
 * `@/lib/knowledge/context-broker` imports outside
 * `src/lib/knowledge/**` and `src/app/api/**` lands in CB-4 once the
 * first app-tier consumer exists. For CB-1 there is no consumer to
 * police, so the rule would be inert — see
 * `eslint.config.mjs` for the pattern lifted from TD-1.
 */

export type {
  BrokerMode,
  ContextProvenance,
  SemanticChunkHit,
  CorpusPatternHit,
  ContextBundle,
  ContextAssembleInput,
  // Tenant-data shapes the bundle composes — re-exported so
  // app-tier consumers don't need to reach into tenant-data
  // directly (which is blocked by the broker-boundary rule).
  ContextChunk,
  GraphEdge,
  GraphNeighborhood,
  GraphNode,
  GraphPath,
  TenantRecord,
} from './types';

export { MissingTenantKeyError } from './types';

export type { ContextBroker } from './broker';

export {
  DefaultContextBroker,
  getContextBroker,
  WARNING_VECTOR_PENDING,
  WARNING_CORPUS_PENDING,
  vectorRetrievalInfoTag,
  extractKeywords,
} from './broker';

// CB-4 · demo-endpoint request/response contract. Re-exported from
// the package so client fetchers can type their calls without
// reaching into the route file.
export type {
  ContextDemoRequest,
  ContextDemoResponse,
  ContextDemoErrorResponse,
} from './demo-contract';

export { CONTEXT_DEMO_QUERY_MAX_LENGTH } from './demo-contract';

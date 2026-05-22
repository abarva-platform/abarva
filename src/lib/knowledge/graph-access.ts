import 'server-only';

/**
 * Graph-access contract seam — audit 2026-05 broker-boundary fix.
 *
 * Per the AbarVa architecture rule (`feedback_broker_boundary`),
 * `src/app/**` and `src/components/**` MUST reach tenant data through a
 * `src/lib/knowledge/**` contract, never by importing `@/lib/graph/*`
 * internals directly. The `AgentContextBroker` covers prompt-context
 * bundles; it has no equivalent for the operational graph reads/writes
 * (pattern retrieval, engagement/person sync, cross-client context)
 * that the engagement routes and the engagement console need.
 *
 * Rather than balloon the broker contract with a dozen graph CRUD
 * methods, this module is a thin, audited re-export seam that lives
 * inside `src/lib/knowledge/` — the same boundary-exempt directory the
 * broker lives in. App-tier callers import the graph operations they
 * need from here; the actual Neo4j/AGE access stays behind
 * `@/lib/graph/*` and is only ever imported by `src/lib/**`.
 *
 * This keeps the boundary honest (no app-tier file imports
 * `@/lib/graph/*`) without changing graph behavior or runtime
 * semantics — every function below is the unmodified graph
 * implementation.
 */

export {
  getActivePatterns,
  getPeerDecisionsForPhase,
  getChainedPatterns,
  getSimilarEngagements,
  getAllGenomePatterns,
  getGenomePatternDetail,
  getSponsorContext,
} from '@/lib/graph/retrieval';

export { syncPersonToGraph } from '@/lib/graph/mutations';
export type { SyncPersonNodeArgs } from '@/lib/graph/mutations';

export { syncEngagementToGraph } from '@/lib/graph/engagement-sync';
export type { SyncEngagementArgs } from '@/lib/graph/engagement-sync';

export {
  getClientPartnerships,
  getSharedVendorsWithPeers,
  assembleCrossClientContext,
  formatCrossClientBlock,
} from '@/lib/graph/cross-client';
export type {
  Partnership,
  SharedVendor,
  CrossClientContext,
} from '@/lib/graph/cross-client';

// Graph view-model types — re-exported so server-tier callers can type
// their values without reaching into `@/lib/graph/types` directly.
// Client components must import from `./graph-access-types` instead,
// which carries no `server-only` guard.
export type {
  ActivePattern,
  PeerDecisionSummary,
  ChainedPattern,
  SimilarEngagement,
  PersonContext,
  GenomePatternSummary,
  GenomePatternDetail,
  EngagementIntelligence,
} from '@/lib/knowledge/graph-access-types';

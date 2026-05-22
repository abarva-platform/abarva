/**
 * Graph view-model types — audit 2026-05 broker-boundary fix.
 *
 * Type-only companion to `graph-access.ts`. Per the AbarVa architecture
 * rule (`feedback_broker_boundary`), `src/app/**` and `src/components/**`
 * must not import `@/lib/graph/*` internals directly. `graph-access.ts`
 * carries an `import 'server-only'` guard because it re-exports runtime
 * graph functions; client components (e.g. the engagement console) only
 * need the *types* and must not pull in a server-only module.
 *
 * This module re-exports the graph view-model types alone and carries
 * no `server-only` guard, so client components can type their props
 * through a `src/lib/knowledge/**` contract without a runtime coupling.
 */

export type {
  ActivePattern,
  PeerDecisionSummary,
  ChainedPattern,
  SimilarEngagement,
  PersonContext,
  GenomePatternSummary,
  GenomePatternDetail,
  EngagementIntelligence,
} from '@/lib/graph/types';

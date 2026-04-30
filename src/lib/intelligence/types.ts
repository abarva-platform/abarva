// Shared TypeScript contracts for the Intelligence layer.
// Source-of-record for the data shapes defined in Packet 7 of the
// Intelligence design spec (docs/design/abarva-intelligence-design-spec.md).

import type { ContradictionSeed } from './seed-contradictions';
import type { SignalSeed } from './seed-signals-manual';
import type { SolutionSeed } from './seed-solutions';
import type { PatternDomain, PatternSeed, PatternTier } from './seed-types';

export type NexusMode = 'research' | 'grounded' | 'pivot';
export type NexusFormat =
  | 'one_sentence'
  | 'matrix'
  | 'crux'
  | 'ranked_list'
  | 'artifact'
  | 'clarification'
  | 'counter_pair'
  | 'idk';
export type NexusConfidence = 'high' | 'medium' | 'low';
export type IntelligenceReasoningMode =
  | 'generic'
  | 'corpus_grounded'
  | 'tenant_grounded'
  | 'cross_corpus';
export type IntelligenceAuthState =
  | 'cold'
  | 'authenticated_no_programs'
  | 'authenticated_with_programs';
export type IntelligenceEngagementState =
  | 'landing'
  | 'topic_open'
  | 'conversation_active'
  | 'synthesis_validation';
export type IntelligenceProvenanceSourceType =
  | 'pattern'
  | 'evidence'
  | 'contradiction'
  | 'signal'
  | 'tenant_program'
  | 'tenant_evidence';
export type IntelligenceProvenanceSourceBasis =
  | 'source_code_seed'
  | 'database_graph'
  | 'tenant_data_room'
  | 'live_signal'
  | 'vector_index'
  | 'composite_seed';
export type IntelligenceSurfaceContentEntryType =
  | 'failure_mode_card'
  | 'topic_entry'
  | 'demo_robustness_question';
export type IntelligenceSurfaceContentStatus =
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'archived';
export type ThreadState = 'A' | 'B' | 'C';
export type GovernanceState = 'ephemeral' | 'persistent';
export type TurnRole = 'user' | 'nexus' | 'system';
export type ArtifactKind = 'brief' | 'memo' | 'chart' | 'one_pager' | 'custom_html';
export type SignalCategory =
  | 'contradiction'
  | 'vendor_overlap'
  | 'pattern_emerging'
  | 'shadow_ai'
  | 'portfolio_risk'
  | 'benchmark_drift';
export type SignalSeverity = 'critical' | 'warning' | 'info';
export type CapabilityKey =
  | 'clarifying'
  | 'multimodal'
  | 'cross_client'
  | 'persona'
  | 'deep_dive'
  | 'counter';

export interface TenancyCtx {
  clientId: string;
  userId: string;
}

export interface Source {
  id: string;
  type: 'pattern' | 'benchmark' | 'vendor' | 'regulation' | 'framework' | 'research' | 'news' | 'engagement' | 'emergent' | 'client_fact';
  name: string;
  detail?: string;
  confidence?: NexusConfidence;
  url?: string;
  asOf?: string;
}

export interface IntelligenceProvenanceGrounding {
  sourceType: IntelligenceProvenanceSourceType;
  sourceId: string;
  sourceTitle: string;
  confidence: number;
  sourceBasis: IntelligenceProvenanceSourceBasis;
  lastUpdated: string;
}

export interface IntelligenceProvenanceTrail {
  claimText: string;
  groundingChain: IntelligenceProvenanceGrounding[];
}

export interface IntelligenceModeAnswer {
  mode: IntelligenceReasoningMode;
  answer: string;
  distinctiveContent: string;
  provenanceCount: number;
}

export interface IntelligenceSessionLog {
  id: string;
  tenantKey: string | null;
  clientId: string | null;
  userId: string | null;
  sessionId: string;
  threadId: string | null;
  queryText: string;
  responseMode: IntelligenceReasoningMode;
  availableModes: IntelligenceReasoningMode[];
  retrievedPatternIds: string[];
  retrievedEvidenceIds: string[];
  retrievedContradictionIds: string[];
  retrievedSignalIds: string[];
  provenanceRendered: IntelligenceProvenanceTrail[];
  tenantDataUsed: boolean;
  authState: IntelligenceAuthState;
  engagementState: IntelligenceEngagementState;
  latencyMs: number | null;
  toolNames: string[];
  errorCode: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface IntelligenceModeToggleEvent {
  id: string;
  sessionLogId: string | null;
  sessionId: string;
  clientId: string | null;
  userId: string | null;
  previousMode: IntelligenceReasoningMode | null;
  nextMode: IntelligenceReasoningMode;
  dwellMs: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface IntelligenceSurfaceContentEntry {
  id: string;
  registryKey: string;
  entryType: IntelligenceSurfaceContentEntryType;
  title: string;
  body: Record<string, unknown>;
  citedPatternIds: string[];
  citedContradictionIds: string[];
  citedSignalIds: string[];
  citedResearchAnchors: Array<Record<string, unknown>>;
  status: IntelligenceSurfaceContentStatus;
  version: number;
  lastReviewedBy: string | null;
  lastReviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContradictionFlag {
  prior_turn_id: string;
  prior_summary: string;
  current_departure: string;
  reconciliation_paths: string[];
}

export interface NexusTurnPayload {
  hero?: string;
  answer?: string;
  framing?: string;
  crux?: string;
  branches?: Array<{ verdict: string; condition: string; confidence: NexusConfidence }>;
  dimensions?: Array<{ name: string; values: Array<{ option: string; value: string; winner?: boolean; confidence?: NexusConfidence }> }>;
  items?: Array<{ title: string; rationale: string; source?: Source; confidence?: NexusConfidence }>;
  artifact_type?: ArtifactKind;
  artifact_html?: string;
  artifact_metadata?: Record<string, unknown>;
  question?: string;
  options?: Array<{ label: string; context?: string }>;
  counter_card?: NexusTurnPayload;
  tiebreaker?: { question: string; resolver: string; effort?: string };
  why_dont_know?: string;
  who_would_know?: string;
}

export interface NexusTurnData {
  id: string;
  threadId: string;
  index: number;
  role: TurnRole;
  mode: NexusMode | null;
  format: NexusFormat | null;
  confidence: NexusConfidence | null;
  payload: NexusTurnPayload;
  sources: Source[];
  capabilitiesActive: CapabilityKey[];
  counterOfTurnId: string | null;
  contradictionSelfCheck: ContradictionFlag | null;
  personaKey: string | null;
  latencyMs: number | null;
  firstTokenMs: number | null;
  createdAt: string;
}

export interface IntelligenceThread {
  id: string;
  userId: string;
  clientId: string;
  conversationId: string | null;
  title: string | null;
  state: ThreadState;
  attachedEngagementId: string | null;
  createdAt: string;
  lastTurnAt: string | null;
  archivedAt: string | null;
}

export interface IntelligenceArtifact {
  id: string;
  threadId: string | null;
  turnId: string | null;
  userId: string;
  clientId: string;
  kind: ArtifactKind;
  title: string;
  htmlContent: string;
  metadata: Record<string, unknown>;
  governanceState: GovernanceState;
  sessionId: string | null;
  promotedToDeliverableId: string | null;
  promotedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface PortfolioSignal {
  id: string;
  clientId: string;
  category: SignalCategory;
  severity: SignalSeverity;
  headline: string;
  context: Record<string, unknown>;
  sourceContradictionId: string | null;
  affectedEngagementIds: string[];
  sponsorNotified: boolean;
  firedAt: string;
  resolvedAt: string | null;
  dismissedAt: string | null;
  dismissedByUserId: string | null;
}

export interface EmergentPattern {
  id: string;
  patternKey: string;
  industry: string;
  tier: string;
  cohortSize: number;
  aggregateOutcomes: Record<string, unknown>;
  lastAggregatedAt: string;
}

export interface UserBookmark {
  id: string;
  userId: string;
  clientId: string;
  bookmarkType: 'turn' | 'artifact' | 'thread' | 'library_entry' | 'signal';
  targetId: string;
  targetKind: string | null;
  note: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface FoundationReadout {
  client: { id: string; name: string; industry: string | null };
  user: { id: string; role: string | null; name: string | null };
  layers: Array<{ key: 'L1' | 'L2' | 'L3' | 'L4'; label: string; count: number; asOf?: string }>;
  metrics: {
    useCases: number;
    vendors: number;
    contradictions: number;
    patterns: number;
    benchmarks: number;
    engagements: number;
  };
  asOf: string;
}

export interface RetrievalResult {
  dimension: 'graph' | 'vector' | 'structured' | 'emergent';
  claims: Array<{ text: string; source: Source; confidence: NexusConfidence }>;
  latencyMs: number;
  partial: boolean;
  error?: string;
}

export interface RetrievalPlan {
  mode: NexusMode;
  entities: string[];
  layerHints: Array<'L1' | 'L2' | 'L3' | 'L4'>;
  dimensions: Array<'graph' | 'vector' | 'structured' | 'emergent'>;
  query: string;
  tenancy: TenancyCtx;
}

export type CorpusEntity = PatternSeed | SignalSeed | SolutionSeed | ContradictionSeed;

export interface LoadedCorpus {
  patterns: readonly PatternSeed[];
  signals: readonly SignalSeed[];
  solutions: readonly SolutionSeed[];
  contradictions: readonly ContradictionSeed[];
  byId: ReadonlyMap<string, CorpusEntity>;
  byDomain: ReadonlyMap<PatternDomain, readonly PatternSeed[]>;
  byTier: ReadonlyMap<PatternTier, readonly PatternSeed[]>;
  patternsById: ReadonlyMap<string, PatternSeed>;
  signalsById: ReadonlyMap<string, SignalSeed>;
  solutionsById: ReadonlyMap<string, SolutionSeed>;
  contradictionsById: ReadonlyMap<string, ContradictionSeed>;
  loadedAt: string;
}

export interface LoaderConfig {
  patterns?: readonly PatternSeed[];
  signals?: readonly SignalSeed[];
  solutions?: readonly SolutionSeed[];
  contradictions?: readonly ContradictionSeed[];
  validate?: boolean;
  loadedAt?: string;
}

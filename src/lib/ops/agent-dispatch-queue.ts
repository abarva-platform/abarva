// OPS2 - Multi-Agent Dispatch Queue Automation Read Model.
//
// Deterministic, file-pure read model over docs/build/agent-dispatch-queue.json.
// This module:
//   * Parses the canonical dispatch queue file synchronously.
//   * Normalizes the on-disk shape into a stable view-model (DispatchQueueItem).
//   * Exposes lifecycle constants, summaries, and a deterministic batch
//     recommendation helper.
//
// Strict guardrails (enforced by the companion integration test):
//   * No model providers, agents, or networked callers are imported.
//   * No Date.now / Math.random / new Date / fetch / shell exec.
//   * No agent spawning - we are a read model, not a runtime.
//
// createdFrom: 'deterministic_dispatch_queue_read_model'

import { readFileSync } from 'fs';
import { join } from 'path';

// ---------------------------------------------------------------------
// Canonical lifecycle vocabulary
// ---------------------------------------------------------------------

export const DISPATCH_QUEUE_STATES = [
  'proposed',
  'ready',
  'blocked',
  'in_progress',
  'completed',
  'failed',
  'deferred',
] as const;

export type DispatchQueueState = (typeof DISPATCH_QUEUE_STATES)[number];

export const DISPATCH_QUEUE_LANE_TYPES = [
  'ui',
  'read_model',
  'qa',
  'integration',
  'runtime_stub',
  'docs',
  'unknown',
] as const;

export type DispatchQueueLaneType = (typeof DISPATCH_QUEUE_LANE_TYPES)[number];

export const DISPATCH_QUEUE_PRIORITIES = ['high', 'medium', 'low'] as const;
export type DispatchQueuePriority = (typeof DISPATCH_QUEUE_PRIORITIES)[number];

// Reasons a queued item can be blocked. Kept as a discriminated string union so
// callers can switch on it deterministically without arbitrary free text.
export const DISPATCH_QUEUE_BLOCK_REASONS = [
  'unmet_dependency',
  'awaiting_review',
  'awaiting_founder_decision',
  'conflict_risk',
  'resource_unavailable',
  'unspecified',
] as const;

export type DispatchQueueBlockReason = (typeof DISPATCH_QUEUE_BLOCK_REASONS)[number];

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

export interface DispatchQueueItem {
  /** Stable slice identifier (matches build-slices.json id when applicable). */
  id: string;
  /** Human-readable slice title. */
  title: string;
  /** Canonical lifecycle state (normalized from the on-disk status). */
  state: DispatchQueueState;
  /** Originating lane / pack type for routing decisions. */
  sourceLane: DispatchQueueLaneType;
  /** Recommended target agent label (always documentary, never spawned). */
  targetAgent: string;
  /** Slices that must reach a usable state before this one can dispatch. */
  dependencies: ReadonlyArray<string>;
  /** Conflict risk hint inherited from the source manifest. */
  conflictRisk: 'low' | 'medium' | 'high' | 'unknown';
  /** Priority hint inherited from the source manifest. */
  priority: DispatchQueuePriority;
  /** Reason this item is blocked, if state === 'blocked'. */
  blockReason?: DispatchQueueBlockReason;
  /** Optional batch label to group items recommended together. */
  recommendedBatch?: string;
  /** Provenance tag - this item was synthesized by the read model. */
  createdFrom: 'deterministic_dispatch_queue_read_model';
}

export interface DispatchQueueSummary {
  totalItems: number;
  byState: Record<DispatchQueueState, number>;
  byLane: Record<DispatchQueueLaneType, number>;
  byPriority: Record<DispatchQueuePriority, number>;
  blockedReasonCounts: Record<DispatchQueueBlockReason, number>;
  readyCount: number;
  blockedCount: number;
  inProgressCount: number;
  completedCount: number;
  failedCount: number;
  deferredCount: number;
  proposedCount: number;
}

export interface DispatchQueueRecommendation {
  /** Stable batch label, e.g. 'batch-2026-04-26-01'. */
  batchId: string;
  /** Items recommended for the batch, in deterministic dispatch order. */
  items: ReadonlyArray<DispatchQueueItem>;
  /** Reason this batch is being recommended. */
  rationale: string;
  /** Always documentary - no agent runtime is invoked. */
  createdFrom: 'deterministic_dispatch_queue_read_model';
}

interface DispatchQueueFileItem {
  id: string;
  title: string;
  laneType?: string;
  priority?: string;
  status: string;
  dependsOn?: ReadonlyArray<string>;
  conflictRisk?: string;
  blockReason?: string;
  recommendedBatch?: string;
  recommendedWorktree?: string;
  recommendedBranch?: string;
}

interface DispatchQueueFile {
  schemaVersion: number;
  lastUpdated: string;
  source: string;
  lifecycle?: ReadonlyArray<string>;
  items: ReadonlyArray<DispatchQueueFileItem>;
}

// ---------------------------------------------------------------------
// File access
// ---------------------------------------------------------------------

const DISPATCH_QUEUE_PATH = join(
  process.cwd(),
  'docs/build/agent-dispatch-queue.json',
);

function loadDispatchQueueFile(): DispatchQueueFile {
  const raw = readFileSync(DISPATCH_QUEUE_PATH, 'utf8');
  return JSON.parse(raw) as DispatchQueueFile;
}

// ---------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------

const STATE_ALIASES: Record<string, DispatchQueueState> = {
  proposed: 'proposed',
  ready: 'ready',
  blocked: 'blocked',
  in_progress: 'in_progress',
  complete: 'completed',
  completed: 'completed',
  failed: 'failed',
  deferred: 'deferred',
};

function normalizeState(input: string): DispatchQueueState {
  const mapped = STATE_ALIASES[input];
  if (!mapped) {
    throw new Error(
      `agent-dispatch-queue.json: unknown lifecycle status '${input}'.`,
    );
  }
  return mapped;
}

function normalizeLane(input: string | undefined): DispatchQueueLaneType {
  if (!input) return 'unknown';
  if ((DISPATCH_QUEUE_LANE_TYPES as ReadonlyArray<string>).includes(input)) {
    return input as DispatchQueueLaneType;
  }
  return 'unknown';
}

function normalizePriority(input: string | undefined): DispatchQueuePriority {
  if (input === 'high' || input === 'medium' || input === 'low') return input;
  return 'medium';
}

function normalizeConflictRisk(
  input: string | undefined,
): 'low' | 'medium' | 'high' | 'unknown' {
  if (input === 'low' || input === 'medium' || input === 'high') return input;
  return 'unknown';
}

function normalizeBlockReason(
  input: string | undefined,
): DispatchQueueBlockReason | undefined {
  if (!input) return undefined;
  if (
    (DISPATCH_QUEUE_BLOCK_REASONS as ReadonlyArray<string>).includes(input)
  ) {
    return input as DispatchQueueBlockReason;
  }
  return 'unspecified';
}

// Deterministic mapping from lane to recommended target agent label. Documentary
// only - no agent runtime is invoked anywhere in this module.
const LANE_TO_TARGET_AGENT: Record<DispatchQueueLaneType, string> = {
  ui: 'lane_agent_ui',
  read_model: 'lane_agent_read_model',
  qa: 'lane_agent_qa',
  integration: 'lane_agent_integration',
  runtime_stub: 'lane_agent_runtime_stub',
  docs: 'lane_agent_docs',
  unknown: 'lane_agent_unspecified',
};

function deriveTargetAgent(lane: DispatchQueueLaneType): string {
  return LANE_TO_TARGET_AGENT[lane];
}

function normalizeItem(file: DispatchQueueFileItem): DispatchQueueItem {
  const state = normalizeState(file.status);
  const lane = normalizeLane(file.laneType);
  const dependencies: ReadonlyArray<string> = Array.isArray(file.dependsOn)
    ? [...file.dependsOn]
    : [];

  // For blocked items the source file may not always carry an explicit reason;
  // synthesize a deterministic one from the most likely cause (unmet deps,
  // otherwise unspecified). We never invent free text.
  let blockReason: DispatchQueueBlockReason | undefined;
  if (state === 'blocked') {
    const explicit = normalizeBlockReason(file.blockReason);
    blockReason =
      explicit ?? (dependencies.length > 0 ? 'unmet_dependency' : 'unspecified');
  }

  return {
    id: file.id,
    title: file.title,
    state,
    sourceLane: lane,
    targetAgent: deriveTargetAgent(lane),
    dependencies,
    conflictRisk: normalizeConflictRisk(file.conflictRisk),
    priority: normalizePriority(file.priority),
    blockReason,
    recommendedBatch: file.recommendedBatch,
    createdFrom: 'deterministic_dispatch_queue_read_model',
  };
}

// ---------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------

export function listDispatchQueueItems(): ReadonlyArray<DispatchQueueItem> {
  const file = loadDispatchQueueFile();
  return file.items.map(normalizeItem);
}

export function getDispatchQueueItemsByState(
  state: DispatchQueueState,
): ReadonlyArray<DispatchQueueItem> {
  return listDispatchQueueItems().filter((item) => item.state === state);
}

export function getReadyDispatchItems(): ReadonlyArray<DispatchQueueItem> {
  return getDispatchQueueItemsByState('ready');
}

export function getBlockedDispatchItems(): ReadonlyArray<DispatchQueueItem> {
  return getDispatchQueueItemsByState('blocked');
}

const PRIORITY_ORDER: Record<DispatchQueuePriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const CONFLICT_RISK_ORDER: Record<
  'low' | 'medium' | 'high' | 'unknown',
  number
> = {
  low: 0,
  medium: 1,
  high: 2,
  unknown: 3,
};

/**
 * Recommend the next deterministic dispatch batch from the ready pool.
 *
 * Ordering rules (stable):
 *   1. priority: high -> medium -> low
 *   2. conflictRisk: low -> medium -> high -> unknown
 *   3. fewer dependencies first (already-satisfied items dispatch first)
 *   4. id, lexicographic (final tiebreaker)
 *
 * The maxItems cap keeps batches reviewable. No agents are spawned.
 */
export function recommendNextBatch(
  maxItems: number = 5,
): DispatchQueueRecommendation {
  const ready = getReadyDispatchItems();
  const ordered = [...ready].sort((a, b) => {
    const priorityDelta = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (priorityDelta !== 0) return priorityDelta;

    const riskDelta =
      CONFLICT_RISK_ORDER[a.conflictRisk] - CONFLICT_RISK_ORDER[b.conflictRisk];
    if (riskDelta !== 0) return riskDelta;

    const depDelta = a.dependencies.length - b.dependencies.length;
    if (depDelta !== 0) return depDelta;

    return a.id.localeCompare(b.id);
  });

  const items = ordered.slice(0, Math.max(0, maxItems));
  const rationale =
    items.length === 0
      ? 'No ready items in queue; nothing to recommend.'
      : `Selected ${items.length} ready item${items.length === 1 ? '' : 's'} ordered by priority, conflict risk, dependency count, and id.`;

  return {
    batchId: `dispatch-batch-deterministic-${items.length.toString().padStart(2, '0')}`,
    items,
    rationale,
    createdFrom: 'deterministic_dispatch_queue_read_model',
  };
}

export function summarizeDispatchQueue(): DispatchQueueSummary {
  const items = listDispatchQueueItems();

  const byState: Record<DispatchQueueState, number> = {
    proposed: 0,
    ready: 0,
    blocked: 0,
    in_progress: 0,
    completed: 0,
    failed: 0,
    deferred: 0,
  };

  const byLane: Record<DispatchQueueLaneType, number> = {
    ui: 0,
    read_model: 0,
    qa: 0,
    integration: 0,
    runtime_stub: 0,
    docs: 0,
    unknown: 0,
  };

  const byPriority: Record<DispatchQueuePriority, number> = {
    high: 0,
    medium: 0,
    low: 0,
  };

  const blockedReasonCounts: Record<DispatchQueueBlockReason, number> = {
    unmet_dependency: 0,
    awaiting_review: 0,
    awaiting_founder_decision: 0,
    conflict_risk: 0,
    resource_unavailable: 0,
    unspecified: 0,
  };

  for (const item of items) {
    byState[item.state] += 1;
    byLane[item.sourceLane] += 1;
    byPriority[item.priority] += 1;
    if (item.state === 'blocked' && item.blockReason) {
      blockedReasonCounts[item.blockReason] += 1;
    }
  }

  return {
    totalItems: items.length,
    byState,
    byLane,
    byPriority,
    blockedReasonCounts,
    readyCount: byState.ready,
    blockedCount: byState.blocked,
    inProgressCount: byState.in_progress,
    completedCount: byState.completed,
    failedCount: byState.failed,
    deferredCount: byState.deferred,
    proposedCount: byState.proposed,
  };
}

// ---------------------------------------------------------------------
// Re-exports useful for callers that need the raw on-disk shape.
// ---------------------------------------------------------------------

export type { DispatchQueueFile, DispatchQueueFileItem };

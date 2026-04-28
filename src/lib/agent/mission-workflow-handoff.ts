// mission-workflow-handoff.ts — MW4
//
// Cross-agent handoff contract for mission workflows.
// Builds a deterministic view of all handoff edges in the AG10 mission queue:
// which missions are being handed off, from which agent to which, on which
// trigger, and what the recommended next step is for the receiving agent.
//
// This module formalises the handoff DAG so that the Nexus surface and any
// future cross-agent coordination layer can consume a typed structure rather
// than raw mission fields.
//
// Deterministic: no runtime clocks, no random(), no model calls.
// Pattern: mirrors agent-hidden-drawer-view.ts; deterministicSeed: true.
//
// This module does NOT import:
//   - src/lib/source/**, src/lib/auth/**, supabase/**
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/components/**
//   - Any fetch/Date.now/Math.random

import {
  buildAgentMissionQueue,
  getAgentMissionHandoffs,
  summarizeAgentMissionQueue,
  type AgentMission,
  type AgentMissionAgent,
  type AgentMissionHandoff,
  type AgentMissionHandoffTrigger,
  type AgentMissionPriority,
  type AgentMissionState,
} from '@/lib/agent/agent-mission-queue';

// ─── Re-exports ───────────────────────────────────────────────────────────────

export type {
  AgentMission,
  AgentMissionAgent,
  AgentMissionHandoff,
  AgentMissionHandoffTrigger,
  AgentMissionPriority,
  AgentMissionState,
};

// ─── Handoff view types ───────────────────────────────────────────────────────

/**
 * A resolved handoff edge in the mission workflow DAG.
 * Pairs a mission with its handoff target and context.
 */
export interface MissionHandoffEdge {
  /** The mission being handed off */
  mission: AgentMission;
  /** The sending agent (same as mission.agent) */
  fromAgent: AgentMissionAgent;
  /** The receiving agent */
  toAgent: AgentMissionAgent;
  /** Trigger condition that warranted the handoff */
  trigger: AgentMissionHandoffTrigger;
  /** Reason for the handoff (from mission.handoff.reason) */
  reason: string;
  /** Priority inherited from the originating mission */
  priority: AgentMissionPriority;
  /** State of the originating mission */
  state: AgentMissionState;
  /** Whether the handoff is considered blocking — true for blocked/escalated missions */
  isBlocking: boolean;
}

/**
 * Per-agent handoff summary in the workflow view.
 */
export interface AgentHandoffSummary {
  agent: AgentMissionAgent;
  /** Count of missions this agent is sending out */
  outboundCount: number;
  /** Count of missions this agent is receiving */
  inboundCount: number;
  /** Agents this agent is handing off to */
  handingOffTo: readonly AgentMissionAgent[];
  /** Agents handing off to this agent */
  receivingFrom: readonly AgentMissionAgent[];
}

/**
 * Full cross-agent handoff workflow view.
 */
export interface MissionWorkflowHandoffView {
  /** All handoff edges in the mission queue */
  handoffEdges: readonly MissionHandoffEdge[];
  /** Total number of handoff edges */
  totalHandoffs: number;
  /** Per-agent handoff summaries (canonical order) */
  agentSummaries: readonly AgentHandoffSummary[];
  /** Missions that are blocking (blocked or escalated state with a handoff) */
  blockingHandoffs: readonly MissionHandoffEdge[];
  /** Count of blocking handoffs */
  blockingHandoffCount: number;
  /** All unique trigger types present in the handoff set */
  activeTriggers: readonly AgentMissionHandoffTrigger[];
  /** Honest disclaimer (no live runtime) */
  honestDisclaimer: string;
  deterministicSeed: true;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CANONICAL_AGENTS: readonly AgentMissionAgent[] = [
  'nexus',
  'sentinel',
  'atlas',
  'steward',
];

const HONEST_DISCLAIMER =
  'Handoff workflow is deterministic seed; cross-agent runtime routing is deferred.';

// ─── Internal helpers ─────────────────────────────────────────────────────────

function buildHandoffEdge(mission: AgentMission): MissionHandoffEdge | null {
  if (!mission.handoff) return null;
  const handoff: AgentMissionHandoff = mission.handoff;
  const isBlocking = mission.state === 'blocked' || mission.state === 'escalated';
  return {
    mission,
    fromAgent: mission.agent,
    toAgent: handoff.toAgent,
    trigger: handoff.trigger,
    reason: handoff.reason,
    priority: mission.priority,
    state: mission.state,
    isBlocking,
  };
}

function buildAgentHandoffSummary(
  agent: AgentMissionAgent,
  edges: readonly MissionHandoffEdge[],
): AgentHandoffSummary {
  const outbound = edges.filter((e) => e.fromAgent === agent);
  const inbound = edges.filter((e) => e.toAgent === agent);

  const handingOffTo = [...new Set(outbound.map((e) => e.toAgent))];
  const receivingFrom = [...new Set(inbound.map((e) => e.fromAgent))];

  return {
    agent,
    outboundCount: outbound.length,
    inboundCount: inbound.length,
    handingOffTo,
    receivingFrom,
  };
}

// ─── Builder ──────────────────────────────────────────────────────────────────

/**
 * Build the cross-agent handoff workflow view from the AG10 mission queue.
 *
 * Produces a deterministic, byte-equal result on every call.
 */
export function buildMissionWorkflowHandoffView(): MissionWorkflowHandoffView {
  const allMissions = buildAgentMissionQueue();
  const missionsWithHandoffs = getAgentMissionHandoffs(allMissions);

  // Build typed handoff edges
  const handoffEdges: MissionHandoffEdge[] = [];
  for (const mission of missionsWithHandoffs) {
    const edge = buildHandoffEdge(mission);
    if (edge) handoffEdges.push(edge);
  }

  const blockingHandoffs = handoffEdges.filter((e) => e.isBlocking);

  // Per-agent summaries
  const agentSummaries = CANONICAL_AGENTS.map((agent) =>
    buildAgentHandoffSummary(agent, handoffEdges),
  );

  // Unique active trigger types (stable order via Set insertion order)
  const triggerSet = new Set<AgentMissionHandoffTrigger>();
  for (const edge of handoffEdges) {
    triggerSet.add(edge.trigger);
  }
  const activeTriggers = Array.from(triggerSet);

  return {
    handoffEdges,
    totalHandoffs: handoffEdges.length,
    agentSummaries,
    blockingHandoffs,
    blockingHandoffCount: blockingHandoffs.length,
    activeTriggers,
    honestDisclaimer: HONEST_DISCLAIMER,
    deterministicSeed: true,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns all handoff edges where the given agent is the sender.
 */
export function getOutboundHandoffs(
  view: MissionWorkflowHandoffView,
  agent: AgentMissionAgent,
): readonly MissionHandoffEdge[] {
  return view.handoffEdges.filter((e) => e.fromAgent === agent);
}

/**
 * Returns all handoff edges where the given agent is the receiver.
 */
export function getInboundHandoffs(
  view: MissionWorkflowHandoffView,
  agent: AgentMissionAgent,
): readonly MissionHandoffEdge[] {
  return view.handoffEdges.filter((e) => e.toAgent === agent);
}

/**
 * Returns all handoff edges for a specific trigger type.
 */
export function getHandoffsByTrigger(
  view: MissionWorkflowHandoffView,
  trigger: AgentMissionHandoffTrigger,
): readonly MissionHandoffEdge[] {
  return view.handoffEdges.filter((e) => e.trigger === trigger);
}

/**
 * Returns the AgentHandoffSummary for a specific agent, or null if not found.
 */
export function getAgentHandoffSummary(
  view: MissionWorkflowHandoffView,
  agent: AgentMissionAgent,
): AgentHandoffSummary | null {
  for (const s of view.agentSummaries) {
    if (s.agent === agent) return s;
  }
  return null;
}

/**
 * Returns a concise prose description of the handoff workflow.
 * e.g. "Handoff workflow · 8 edges · 2 blocking · 3 triggers"
 */
export function describeMissionWorkflowHandoff(
  view: MissionWorkflowHandoffView,
): string {
  const parts: string[] = ['Handoff workflow'];
  parts.push(`${view.totalHandoffs} edge${view.totalHandoffs !== 1 ? 's' : ''}`);
  if (view.blockingHandoffCount > 0) {
    parts.push(`${view.blockingHandoffCount} blocking`);
  }
  parts.push(`${view.activeTriggers.length} trigger${view.activeTriggers.length !== 1 ? 's' : ''}`);
  return parts.join(' · ');
}

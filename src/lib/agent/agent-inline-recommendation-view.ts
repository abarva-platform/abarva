// agent-inline-recommendation-view.ts — ACT2
//
// Dedicated view model for the Agent Activity Inline Recommendation variant.
// Surfaces the single highest-priority recommendation from the AG11 seed
// (inline_recommendation variant) in a compact form suitable for embedding
// inside a page body — e.g. next to a program card, inside a deliverable row,
// or above an evidence panel.
//
// Deterministic: no runtime clocks, no random(), no model calls.
// Pattern: mirrors agent-hidden-drawer-view.ts (ACT3); deterministicSeed: true.
//
// This module does NOT import:
//   - src/lib/source/**, src/lib/auth/**, supabase/**
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/components/**
//   - Any fetch/Date.now/Math.random

import {
  buildAgentMissionPanelSeedView,
  agentDisplayLabel,
  priorityChipLabel,
  stateChipLabel,
  type AgentMissionPanelAgent,
  type AgentMissionPanelMission,
  type AgentMissionPanelView,
} from '@/lib/agent/agent-mission-view';

// ─── Re-exports ───────────────────────────────────────────────────────────────

export type {
  AgentMissionPanelAgent,
  AgentMissionPanelMission,
  AgentMissionPanelView,
};

// ─── View types ───────────────────────────────────────────────────────────────

/**
 * Confidence level for the recommendation — derived deterministically from
 * the agent and mission type of the top recommendation.
 */
export type RecommendationConfidence = 'high' | 'medium' | 'low';

export interface InlineRecommendationItem {
  /** The underlying AG11 mission */
  mission: AgentMissionPanelMission;
  /** Human-readable agent name */
  agentDisplayLabel: string;
  /** Formatted priority label ("P2 · High") */
  priorityLabel: string;
  /** Formatted state label ("Active") */
  stateLabel: string;
  /** Mission type formatted for display ("Next action") */
  typeLabel: string;
  /** Confidence level derived from agent + priority */
  confidence: RecommendationConfidence;
  /** True when the recommendation is considered urgent (critical or high priority) */
  isUrgent: boolean;
}

export interface AgentInlineRecommendationView {
  /** The underlying AG11 panel view (always inline_recommendation variant) */
  panelView: AgentMissionPanelView;
  /** The top recommendation item, or null when the queue is empty */
  topRecommendation: InlineRecommendationItem | null;
  /** All recommendation items derived from the inline_recommendation seed */
  allRecommendations: readonly InlineRecommendationItem[];
  /** Count of recommendations */
  recommendationCount: number;
  /** True when the top recommendation is urgent (critical or high) */
  hasUrgentRecommendation: boolean;
  /** Honest disclaimer (from AG11 seed) */
  honestDisclaimer: string;
  /** Compact heading for the component */
  sectionLabel: string;
  deterministicSeed: true;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTION_LABEL = 'Agent recommendations';

// ─── Internal helpers ─────────────────────────────────────────────────────────

function formatTypeLabel(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function deriveConfidence(
  mission: AgentMissionPanelMission,
): RecommendationConfidence {
  if (mission.priority === 'critical' || mission.priority === 'high') return 'high';
  if (mission.priority === 'medium') return 'medium';
  return 'low';
}

function buildRecommendationItem(
  mission: AgentMissionPanelMission,
): InlineRecommendationItem {
  const confidence = deriveConfidence(mission);
  return {
    mission,
    agentDisplayLabel: agentDisplayLabel(mission.agent),
    priorityLabel: priorityChipLabel(mission.priority),
    stateLabel: stateChipLabel(mission.state),
    typeLabel: formatTypeLabel(mission.type),
    confidence,
    isUrgent: mission.priority === 'critical' || mission.priority === 'high',
  };
}

// ─── Builder ──────────────────────────────────────────────────────────────────

/**
 * Build the dedicated inline recommendation view.
 *
 * Produces a deterministic, byte-equal result on every call.
 * The inline_recommendation variant surfaces 4 missions (one per agent).
 */
export function buildAgentInlineRecommendationView(): AgentInlineRecommendationView {
  const panelView = buildAgentMissionPanelSeedView('inline_recommendation');

  const allRecommendations = panelView.missions.map(buildRecommendationItem);

  const topRecommendation = allRecommendations.length > 0
    ? allRecommendations[0]!
    : null;

  const hasUrgentRecommendation = allRecommendations.some((r) => r.isUrgent);

  return {
    panelView,
    topRecommendation,
    allRecommendations,
    recommendationCount: allRecommendations.length,
    hasUrgentRecommendation,
    honestDisclaimer: panelView.honestDisclaimer,
    sectionLabel: SECTION_LABEL,
    deterministicSeed: true,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the top recommendation, or null when the queue is empty.
 */
export function getTopRecommendation(
  view: AgentInlineRecommendationView,
): InlineRecommendationItem | null {
  return view.topRecommendation;
}

/**
 * Returns all recommendations filtered to a specific agent.
 */
export function getRecommendationsByAgent(
  view: AgentInlineRecommendationView,
  agent: AgentMissionPanelAgent,
): readonly InlineRecommendationItem[] {
  return view.allRecommendations.filter((r) => r.mission.agent === agent);
}

/**
 * Returns all urgent recommendations (critical or high priority).
 */
export function getUrgentRecommendations(
  view: AgentInlineRecommendationView,
): readonly InlineRecommendationItem[] {
  return view.allRecommendations.filter((r) => r.isUrgent);
}

/**
 * Returns a concise prose description of the inline recommendation view.
 * e.g. "Agent recommendations · 4 items · 2 urgent"
 */
export function describeInlineRecommendation(
  view: AgentInlineRecommendationView,
): string {
  const parts: string[] = [view.sectionLabel];
  parts.push(`${view.recommendationCount} item${view.recommendationCount !== 1 ? 's' : ''}`);
  const urgentCount = view.allRecommendations.filter((r) => r.isUrgent).length;
  if (urgentCount > 0) {
    parts.push(`${urgentCount} urgent`);
  }
  return parts.join(' · ');
}

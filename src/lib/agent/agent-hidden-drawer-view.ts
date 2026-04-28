// agent-hidden-drawer-view.ts — ACT3
//
// Dedicated view model for the Agent Activity Hidden Drawer variant.
// Layers a drawer-specific display layer on top of the AG11 agent mission
// panel seed (hidden_drawer variant) and enriches it with an AI portfolio
// context summary from ACT2. Consumed by AgentHiddenDrawer.tsx (the
// standalone server component for the collapsed drawer affordance).
//
// Deterministic: no runtime clocks, no random(), no model calls.
// Pattern: mirrors agent-mission-view.ts; deterministicSeed: true.
//
// This module does NOT import:
//   - src/lib/source/**, src/lib/auth/**, supabase/**
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/components/**
//   - Any fetch/Date.now/Math.random

import {
  buildAgentMissionPanelSeedView,
  summarizeAgentMissionPanelView,
  agentDisplayLabel,
  type AgentMissionPanelAgent,
  type AgentMissionPanelMission,
  type AgentMissionPanelView,
} from '@/lib/agent/agent-mission-view';
import {
  buildAiPortfolioInventory,
  summarizeAiPortfolioInventory,
} from '@/lib/tower/ai-portfolio-inventory';

// ─── Re-export types callers may need ────────────────────────────────────────

export type {
  AgentMissionPanelAgent,
  AgentMissionPanelMission,
  AgentMissionPanelView,
};

// ─── View types ───────────────────────────────────────────────────────────────

export interface DrawerAgentSummary {
  /** Canonical agent key */
  agent: AgentMissionPanelAgent;
  /** Human-readable agent name */
  displayLabel: string;
  /** Number of missions for this agent */
  missionCount: number;
  /** Whether any of this agent's missions are active or proposed */
  isActive: boolean;
}

export interface DrawerPortfolioContext {
  /** Total AI use cases in the portfolio inventory */
  totalInventory: number;
  /** Use cases in 'piloting' or 'scaling' stages (loosely "active") */
  activeUseCases: number;
  /** Use cases in 'evaluating' stage */
  evaluatingUseCases: number;
}

export interface AgentHiddenDrawerView {
  /** The underlying AG11 panel view (always hidden_drawer variant) */
  panelView: AgentMissionPanelView;
  /** Total mission count across all agents */
  totalMissions: number;
  /** Per-agent mission summaries (canonical order: nexus → sentinel → atlas → steward) */
  agentSummaries: readonly DrawerAgentSummary[];
  /** Agents that currently have active or proposed missions */
  activeAgents: readonly AgentMissionPanelAgent[];
  /** Priority breakdown */
  priorityCounts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  /** Compact label for the trigger button (e.g. "8 missions · 2 agents active") */
  triggerLabel: string;
  /** Portfolio context from ACT2 */
  portfolioContext: DrawerPortfolioContext;
  /** Highest-priority label present in the queue, or null if no missions */
  highestPriorityLabel: string | null;
  /** Honest disclaimer (from AG11 seed) */
  honestDisclaimer: string;
  /** Drawer render state — always collapsed in deterministic seed */
  drawerState: 'collapsed';
  deterministicSeed: true;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CANONICAL_AGENTS: readonly AgentMissionPanelAgent[] = [
  'nexus',
  'sentinel',
  'atlas',
  'steward',
];

// ─── Internal helpers ─────────────────────────────────────────────────────────

function buildAgentSummaries(
  missions: readonly AgentMissionPanelMission[],
): readonly DrawerAgentSummary[] {
  return CANONICAL_AGENTS.map((agent) => {
    const agentMissions = missions.filter((m) => m.agent === agent);
    const isActive = agentMissions.some(
      (m) => m.state === 'active' || m.state === 'proposed',
    );
    return {
      agent,
      displayLabel: agentDisplayLabel(agent),
      missionCount: agentMissions.length,
      isActive,
    };
  });
}

function buildTriggerLabel(
  totalMissions: number,
  activeAgentCount: number,
): string {
  const missionPart = `${totalMissions} mission${totalMissions !== 1 ? 's' : ''}`;
  const agentPart = `${activeAgentCount} agent${activeAgentCount !== 1 ? 's' : ''} active`;
  return `${missionPart} · ${agentPart}`;
}

function resolveHighestPriorityLabel(priorityCounts: {
  critical: number;
  high: number;
  medium: number;
  low: number;
}): string | null {
  if (priorityCounts.critical > 0) return 'P1 · Critical';
  if (priorityCounts.high > 0) return 'P2 · High';
  if (priorityCounts.medium > 0) return 'P3 · Medium';
  if (priorityCounts.low > 0) return 'P4 · Low';
  return null;
}

// ─── Builder ──────────────────────────────────────────────────────────────────

/**
 * Build the dedicated hidden drawer view.
 *
 * Produces a deterministic, byte-equal result on every call with no
 * arguments. The drawer is always in 'collapsed' state in the seed.
 */
export function buildAgentHiddenDrawerView(): AgentHiddenDrawerView {
  // Pull the AG11 hidden_drawer seed
  const panelView = buildAgentMissionPanelSeedView('hidden_drawer');
  const panelSummary = summarizeAgentMissionPanelView(panelView);

  // Per-agent summaries
  const agentSummaries = buildAgentSummaries(panelView.missions);
  const activeAgents = agentSummaries
    .filter((s) => s.isActive)
    .map((s) => s.agent);

  // Priority counts
  const priorityCounts = {
    critical: panelSummary.byPriority.critical,
    high: panelSummary.byPriority.high,
    medium: panelSummary.byPriority.medium,
    low: panelSummary.byPriority.low,
  };

  const triggerLabel = buildTriggerLabel(panelSummary.totalMissions, activeAgents.length);
  const highestPriorityLabel = resolveHighestPriorityLabel(priorityCounts);

  // Pull ACT2 portfolio context
  const inventory = buildAiPortfolioInventory();
  const inventorySummary = summarizeAiPortfolioInventory(inventory);
  // "active" = pilot + production + scaled; "evaluating" = discovery
  const activeUseCases =
    inventorySummary.byStage['pilot'] +
    inventorySummary.byStage['production'] +
    inventorySummary.byStage['scaled'];
  const evaluatingUseCases = inventorySummary.byStage['discovery'];

  const portfolioContext: DrawerPortfolioContext = {
    totalInventory: inventorySummary.totalUseCases,
    activeUseCases,
    evaluatingUseCases,
  };

  return {
    panelView,
    totalMissions: panelSummary.totalMissions,
    agentSummaries,
    activeAgents,
    priorityCounts,
    triggerLabel,
    portfolioContext,
    highestPriorityLabel,
    honestDisclaimer: panelView.honestDisclaimer,
    drawerState: 'collapsed',
    deterministicSeed: true,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the compact trigger label (already on the view, but exposed
 * as a standalone helper for callers that have a pre-built view).
 */
export function getDrawerTriggerLabel(view: AgentHiddenDrawerView): string {
  return view.triggerLabel;
}

/**
 * Returns a short label describing the current highest priority, or
 * 'No missions' when the queue is empty.
 */
export function getActivePriorityLabel(view: AgentHiddenDrawerView): string {
  return view.highestPriorityLabel ?? 'No missions';
}

/**
 * Returns a concise prose description of the drawer view.
 * e.g. "Hidden drawer · 8 missions · 3 agents active · P2 · High"
 */
export function describeAgentHiddenDrawer(view: AgentHiddenDrawerView): string {
  const parts: string[] = ['Hidden drawer'];
  parts.push(`${view.totalMissions} mission${view.totalMissions !== 1 ? 's' : ''}`);
  parts.push(`${view.activeAgents.length} agent${view.activeAgents.length !== 1 ? 's' : ''} active`);
  if (view.highestPriorityLabel) {
    parts.push(view.highestPriorityLabel);
  }
  return parts.join(' · ');
}

// F-SU-201: generalized agent thread + observation types
// Backed by atlas_threads / atlas_observations with agent_name discriminator
// (migration 20260506100000_agent_threads_observations_generalize.sql).
// Views agent_threads + agent_observations expose all four front agents through
// a single query surface. This module provides the TypeScript view-model layer.

export type FrontAgentName = 'atlas' | 'nexus' | 'sentinel' | 'steward';

export type AgentContextScope =
  | 'portfolio'
  | 'signal'
  | 'use_case'
  | 'cohort'
  | 'integration'
  | 'program'      // Nexus/Sentinel — sourcing program context
  | 'workspace'    // Nexus — strategic moves workspace
  | 'event';       // Sentinel — source event context

export type AgentObservationKind =
  | 'summary'
  | 'recommendation'
  | 'risk_callout'
  | 'cohort_context'
  | 'anomaly';

export type AgentObservationSeverity = 'critical' | 'warning' | 'info';

export type AgentObservationPillar =
  | 'inventory'
  | 'adoption'
  | 'value'
  | 'risk'
  | 'cost'
  | 'cross_pillar'
  | 'sourcing'     // Sentinel — sourcing-specific pillar
  | 'governance';  // Steward — governance pillar

export interface AgentThread {
  id: string;
  agentName: FrontAgentName;
  personId: string | null;
  clientId: string;
  title: string | null;
  contextScope: AgentContextScope;
  createdAt: string;
  lastMessageAt: string | null;
  archivedAt: string | null;
}

export interface AgentObservation {
  id: string;
  agentName: FrontAgentName;
  clientId: string;
  pillar: AgentObservationPillar | null;
  observationKind: AgentObservationKind;
  severity: AgentObservationSeverity | null;
  summary: string;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface AgentTenancyCtx {
  agentName: FrontAgentName;
  clientId: string;
  userId: string | null;
}

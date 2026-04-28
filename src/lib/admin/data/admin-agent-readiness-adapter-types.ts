/**
 * ADMIN-DATA2 — Admin agent-readiness adapter types.
 */

export type AdminAgentId = 'steward' | 'nexus' | 'sentinel' | 'atlas';

export type AdminAgentSurface =
  | 'programs'
  | 'source'
  | 'intelligence'
  | 'tower'
  | 'admin';

export type AdminAgentCoverageLevel =
  | 'decision_grade'
  | 'partial'
  | 'thin'
  | 'none'
  | 'full'
  | 'absent';

export interface AdminAgentTopGap {
  agentId: AdminAgentId;
  topGap: string;
}

export interface AdminAgentCoverageCell {
  surface: AdminAgentSurface;
  agent: AdminAgentId;
  level: AdminAgentCoverageLevel;
  note: string;
}

export interface AdminAgentReadinessSnapshot {
  tenantSlug: string;
  agents: ReadonlyArray<AdminAgentTopGap>;
  coverageMatrix: ReadonlyArray<AdminAgentCoverageCell>;
  generatedAt: string;
}

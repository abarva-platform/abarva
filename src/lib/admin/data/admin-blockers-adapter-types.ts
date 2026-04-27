/**
 * ADMIN-DATA2 — Admin blockers adapter types.
 */

export type AdminBlockerSeverity = 'critical' | 'high' | 'medium' | 'low';
export type AdminBlockerScope = 'demo' | 'pilot' | 'production';
export type AdminBlockerStatus = 'open' | 'in_progress' | 'resolved' | 'waived';
export type AdminBlockerOwnerAgent =
  | 'steward'
  | 'nexus'
  | 'sentinel'
  | 'atlas'
  | 'founder'
  | 'engineering';

export interface AdminBlockerRow {
  id: string;
  title: string;
  description: string;
  severity: AdminBlockerSeverity;
  affectedScope: AdminBlockerScope;
  status: AdminBlockerStatus;
  ownerAgent: AdminBlockerOwnerAgent;
  impactedComponent: string;
  evidenceBasis: string;
  blockerReason: string;
  unblockSteps: ReadonlyArray<string>;
  pilotImpact: boolean;
  productionImpact: boolean;
  openedAt: string;
  resolvedAt: string | null;
}

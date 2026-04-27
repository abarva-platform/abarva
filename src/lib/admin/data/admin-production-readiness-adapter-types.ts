/**
 * ADMIN-DATA2 — Admin production-readiness adapter types.
 */

import type { AdminBlockerRow } from './admin-blockers-adapter-types';

export type AdminReadinessTileStatus = 'ready' | 'partial' | 'blocked';

export type AdminReadinessScope = 'demo' | 'pilot' | 'production';

export interface AdminReadinessTile {
  scope: AdminReadinessScope;
  status: AdminReadinessTileStatus;
  failingCriteria: ReadonlyArray<string>;
}

export interface AdminReadinessHistoryEntry {
  at: string;
  scope: string;
  status: string;
  note: string;
}

export interface AdminProductionReadinessSnapshot {
  tenantSlug: string;
  tiles: ReadonlyArray<AdminReadinessTile>;
  blockers: ReadonlyArray<AdminBlockerRow>;
  history: ReadonlyArray<AdminReadinessHistoryEntry>;
  generatedAt: string;
}

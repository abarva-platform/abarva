// Tower-side display helper for the S9e Programs → Control Tower
// signal read model. S9f slice.
//
// Pure: imports the S9e helpers and produces a deterministic display
// shape the <ProgramPressureCards> component renders. This module
// does NOT re-derive signals from program seed data; the read model
// is the single source of truth (per the S9e contract).
//
// No model calls, no Date.now(), no mutation. Same tenant input →
// identical view object.

import {
  buildTenantProgramControlTowerSignals,
  summarizeProgramControlTowerSignals,
  type ProgramControlTowerSignal,
  type ProgramControlTowerSignalSummary,
} from '@/lib/programs/programs-control-tower-signals';
import type { TenantSeedPlan } from '@/lib/programs/enhancement-seed-planner';

export const TOWER_PROGRAM_PRESSURE_DEFAULT_TOP_N = 5;

export interface TowerProgramPressureView {
  tenant: TenantSeedPlan;
  signals: ReadonlyArray<ProgramControlTowerSignal>;
  summary: ProgramControlTowerSignalSummary;
  /** Top-N cards in canonical sort order (severity desc, type rank, id). */
  topCards: ReadonlyArray<ProgramControlTowerSignal>;
  /** Count of evidence_not_ready + value_not_ready signals. */
  evidenceValueGapCount: number;
  /** Human-friendly executive strip values. */
  strip: TowerProgramPressureStrip;
}

export interface TowerProgramPressureStrip {
  totalSignals: string;
  topSeverity: string;
  programsAffected: string;
  evidenceValueGaps: string;
}

/**
 * Build the deterministic view a Tower component renders. Pure.
 */
export function buildTowerProgramPressureView(
  tenant: TenantSeedPlan,
  topN: number = TOWER_PROGRAM_PRESSURE_DEFAULT_TOP_N,
): TowerProgramPressureView {
  const signals = buildTenantProgramControlTowerSignals(tenant);
  const summary = summarizeProgramControlTowerSignals(signals);
  const topCards = signals.slice(0, Math.max(0, Math.floor(topN)));
  const evidenceValueGapCount = signals.filter(
    (s) => s.type === 'evidence_not_ready' || s.type === 'value_not_ready',
  ).length;
  const strip: TowerProgramPressureStrip = {
    totalSignals: String(summary.totalCount),
    topSeverity: summary.topSeverity ? summary.topSeverity.toUpperCase() : 'NONE',
    programsAffected: String(summary.affectedProgramCodes.length),
    evidenceValueGaps: String(evidenceValueGapCount),
  };
  return { tenant, signals, summary, topCards, evidenceValueGapCount, strip };
}

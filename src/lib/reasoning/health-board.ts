/**
 * health-board — aggregate health data for every fixture instance.
 *
 * Builds a flat list of `InstanceHealthRow` records that can be consumed by
 * any admin page that needs a cross-instance health summary (e.g. the health
 * board and the scorecard).
 *
 * Pure: no IO, no Date.now(), no randomness beyond what the synthesis-context
 * builders produce.
 */

import { computeInstanceHealth } from './instance-health';
import { buildSourceSynthesisContext } from './synthesis-context-builder';
import { buildProgramSynthesisContext } from './program-synthesis-context-builder';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import type { SynthesisContext } from './types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type InstanceHealthLabel = 'healthy' | 'warning' | 'critical' | 'unknown';

export interface InstanceHealthRow {
  id: string;
  label: string;
  type: 'source' | 'program';
  /** Non-null for source instances, null for program instances. */
  stageLabel: string | null;
  /** Non-null for program instances, null for source instances. */
  phaseLabel: string | null;
  gatesMet: number;
  gatesTotal: number;
  activeContradictions: number;
  healthLabel: InstanceHealthLabel;
}

// ─── Grade → healthLabel mapping ─────────────────────────────────────────────

function toHealthLabel(grade: 'green' | 'amber' | 'red'): InstanceHealthLabel {
  if (grade === 'green') return 'healthy';
  if (grade === 'amber') return 'warning';
  return 'critical';
}

// ─── Row builder ─────────────────────────────────────────────────────────────

/**
 * Build an `InstanceHealthRow` array spanning all source-event and program
 * fixture instances. Rows are returned in insertion order; callers sort as
 * needed.
 */
export function buildHealthBoardRows(): InstanceHealthRow[] {
  const rows: InstanceHealthRow[] = [];

  // Source event instances
  for (const inst of SOURCE_EVENT_INSTANCES) {
    const pattern = SOURCE_LIFECYCLE_PATTERNS.find((p) => p.patternId === inst.patternId);
    let context: SynthesisContext;
    if (pattern !== undefined) {
      context = buildSourceSynthesisContext(inst, pattern);
    } else {
      continue;
    }
    const health = computeInstanceHealth(context);
    rows.push({
      id: inst.id,
      label: inst.name,
      type: 'source',
      stageLabel: context.currentStage,
      phaseLabel: null,
      gatesMet: context.gatesSummary.met,
      gatesTotal: context.gatesSummary.total,
      activeContradictions: context.activeContradictions.length,
      healthLabel: toHealthLabel(health.grade),
    });
  }

  // Program instances
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const pattern = PROGRAM_LIFECYCLE_PATTERNS.find((p) => p.patternId === inst.patternId);
    const context = buildProgramSynthesisContext(inst, pattern);
    const health = computeInstanceHealth(context);

    // currentStage for programs is formatted as "P{N} {Label}" by the builder
    const phase = inst.phases.find((p) => p.phaseId === inst.currentPhase);
    const builtPhaseLabel = phase
      ? `P${phase.phaseId} ${phase.phaseLabel}`
      : context.currentStage;

    rows.push({
      id: inst.id,
      label: inst.name,
      type: 'program',
      stageLabel: null,
      phaseLabel: builtPhaseLabel,
      gatesMet: context.gatesSummary.met,
      gatesTotal: context.gatesSummary.total,
      activeContradictions: context.activeContradictions.length,
      healthLabel: toHealthLabel(health.grade),
    });
  }

  return rows;
}

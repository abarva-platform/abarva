// Expert Kernel — value-and-effort roadmap.
//
// The Design & Plan depth deliverable: a PHASED, COSTED roadmap. Each phase is
// a set of workstream slices (AI build, integration, data, foundational, data
// governance, process redesign, change & adoption, run), each carrying a
// role-mix effort estimate from the effort-estimator, dependency arrows, an
// explicit foundational-capability flag, and a value milestone.
//
// The roadmap is what the business-case-compiler costs the case against. It
// also surfaces the AI-build-vs-business-change split per phase and overall,
// because a roadmap that under-budgets change is the dominant failure mode.
//
// Pure module: deterministic, no I/O.

import {
  BUSINESS_CHANGE_WORKSTREAMS,
  WORKSTREAM_LABELS,
  type EffortEstimate,
  type WorkstreamEstimate,
  type WorkstreamId,
} from './effort-estimator';
import { round2, sumRanges, type Range } from './types';

/** A value milestone a phase commits to — what Tower will later verify. */
export interface ValueMilestone {
  /** Plain statement of the milestone, e.g. "Containment +4 pts on pilot queues". */
  statement: string;
  /** The baseline metric key it moves, or null for an enablement milestone. */
  metricKey: string | null;
  /**
   * Fraction (0..1) of the Move's steady-state value this phase unlocks.
   * Enablement-only phases are 0 — honest, not hidden.
   */
  valueShare: number;
}

/** A phase of the roadmap. */
export interface RoadmapPhaseInput {
  /** Stable id, e.g. 'p0_foundation'. */
  id: string;
  /** Human label, e.g. 'Phase 0 — Foundation'. */
  label: string;
  /** Ordinal — 0-based; phase 0 is the foundation phase. */
  order: number;
  durationMonths: number;
  /** Workstream ids whose effort is delivered in this phase. */
  workstreamIds: WorkstreamId[];
  /** Phase ids this phase depends on (must complete or overlap-start first). */
  dependsOn: string[];
  /** The value milestone this phase commits to. */
  valueMilestone: ValueMilestone;
  /** True when this phase delivers a foundational capability the build needs. */
  isFoundational: boolean;
}

export interface RoadmapInput {
  moveName: string;
  /** The effort estimate — supplies per-workstream cost. */
  effort: EffortEstimate;
  /** Move steady-state annual value (point) — used to size phase value. */
  steadyStateAnnualValue: number;
  phases: RoadmapPhaseInput[];
}

export interface RoadmapPhase extends RoadmapPhaseInput {
  /** Base cost of the phase (sum of its workstream base costs). */
  baseCost: number;
  /** Phase cost as a base/conservative/upside range. */
  cost: Range;
  /** Per-workstream estimates that fall in this phase. */
  workstreams: WorkstreamEstimate[];
  /** AI-build base cost in this phase. */
  aiBuildCost: number;
  /** Business-change base cost in this phase. */
  businessChangeCost: number;
  /** Annual value this phase unlocks (steadyState * milestone.valueShare). */
  annualValueUnlocked: number;
}

/** A flagged risk in the roadmap structure — surfaced, never hidden. */
export interface RoadmapFlag {
  code: string;
  severity: 'blocker' | 'concern';
  message: string;
}

export interface Roadmap {
  moveName: string;
  phases: RoadmapPhase[];
  /** Total cost across phases as a base/conservative/upside range. */
  totalCost: Range;
  /** Total AI-build base cost across phases. */
  totalAiBuildCost: number;
  /** Total business-change base cost across phases. */
  totalBusinessChangeCost: number;
  /** Fraction (0..1) of roadmap effort that is business change. */
  businessChangeFraction: number;
  /** Foundational phases — the hard dependencies of value. */
  foundationalPhaseIds: string[];
  /** The first phase that unlocks non-zero value. */
  firstValuePhaseId: string | null;
  /** Structural flags from the roadmap validator. */
  flags: RoadmapFlag[];
}

/**
 * Build the value-and-effort roadmap. Allocates each workstream's estimate to
 * the phase that owns it, costs every phase, resolves dependencies, identifies
 * foundational phases, and runs the structural validator.
 *
 * Throws on structural input errors (unknown workstream, unknown dependency,
 * a workstream claimed by two phases, or a value-share sum above 1).
 */
export function buildRoadmap(input: RoadmapInput): Roadmap {
  if (input.phases.length === 0) {
    throw new Error('A roadmap needs at least one phase.');
  }

  const wsById = new Map<WorkstreamId, WorkstreamEstimate>();
  for (const w of input.effort.workstreams) wsById.set(w.id, w);

  const phaseIds = new Set(input.phases.map((p) => p.id));
  const claimedWorkstreams = new Set<WorkstreamId>();
  let valueShareSum = 0;

  const phases: RoadmapPhase[] = [...input.phases]
    .sort((a, b) => a.order - b.order)
    .map((p) => {
      for (const dep of p.dependsOn) {
        if (!phaseIds.has(dep)) {
          throw new Error(
            `Phase '${p.id}' depends on unknown phase '${dep}'.`,
          );
        }
      }
      const workstreams: WorkstreamEstimate[] = p.workstreamIds.map((id) => {
        const ws = wsById.get(id);
        if (!ws) {
          throw new Error(
            `Phase '${p.id}' references workstream '${id}' that is not in ` +
              'the effort estimate.',
          );
        }
        if (claimedWorkstreams.has(id)) {
          throw new Error(
            `Workstream '${id}' is claimed by more than one phase.`,
          );
        }
        claimedWorkstreams.add(id);
        return ws;
      });

      const baseCost = round2(
        workstreams.reduce((s, w) => s + w.baseCost, 0),
      );
      const cost = sumRanges(workstreams.map((w) => w.cost));
      cost.point = baseCost;

      const businessChangeCost = round2(
        workstreams
          .filter((w) => BUSINESS_CHANGE_WORKSTREAMS.has(w.id))
          .reduce((s, w) => s + w.baseCost, 0),
      );
      const aiBuildCost = round2(baseCost - businessChangeCost);

      if (p.valueMilestone.valueShare < 0 || p.valueMilestone.valueShare > 1) {
        throw new Error(
          `Phase '${p.id}' valueShare must be within 0..1.`,
        );
      }
      valueShareSum += p.valueMilestone.valueShare;

      return {
        ...p,
        baseCost,
        cost,
        workstreams,
        aiBuildCost,
        businessChangeCost,
        annualValueUnlocked: round2(
          input.steadyStateAnnualValue * p.valueMilestone.valueShare,
        ),
      };
    });

  if (valueShareSum > 1 + 1e-6) {
    throw new Error(
      `Roadmap phase value shares sum to ${round2(valueShareSum)} — cannot ` +
        'exceed 1 (a phase cannot unlock value the Move does not have).',
    );
  }

  const totalCost = sumRanges(phases.map((p) => p.cost));
  const totalBase = round2(phases.reduce((s, p) => s + p.baseCost, 0));
  totalCost.point = totalBase;
  const totalAiBuildCost = round2(
    phases.reduce((s, p) => s + p.aiBuildCost, 0),
  );
  const totalBusinessChangeCost = round2(
    phases.reduce((s, p) => s + p.businessChangeCost, 0),
  );
  const businessChangeFraction =
    totalBase > 0 ? round2(totalBusinessChangeCost / totalBase) : 0;

  const foundationalPhaseIds = phases
    .filter((p) => p.isFoundational)
    .map((p) => p.id);
  const firstValuePhase = phases.find(
    (p) => p.valueMilestone.valueShare > 0,
  );

  const flags = validateRoadmap(phases, businessChangeFraction);

  return {
    moveName: input.moveName,
    phases,
    totalCost,
    totalAiBuildCost,
    totalBusinessChangeCost,
    businessChangeFraction,
    foundationalPhaseIds,
    firstValuePhaseId: firstValuePhase?.id ?? null,
    flags,
  };
}

/**
 * Structural validator — encodes the Design & Plan playbook traps as
 * deterministic checks over the assembled roadmap.
 */
function validateRoadmap(
  phases: RoadmapPhase[],
  businessChangeFraction: number,
): RoadmapFlag[] {
  const flags: RoadmapFlag[] = [];

  // Trap: value only at the end. Find the first value-producing phase; if
  // every phase before it is pure cost, and that is more than one phase, flag.
  const firstValueIdx = phases.findIndex(
    (p) => p.valueMilestone.valueShare > 0,
  );
  if (firstValueIdx === -1) {
    flags.push({
      code: 'roadmap_no_value_milestone',
      severity: 'blocker',
      message:
        'No phase in the roadmap unlocks measurable value — the roadmap is ' +
        'all cost with no checkpoint to verify or kill on.',
    });
  } else {
    const costBeforeValue = phases
      .slice(0, firstValueIdx)
      .reduce((s, p) => s + p.baseCost, 0);
    const firstValueAnnual = phases[firstValueIdx].annualValueUnlocked;
    if (firstValueIdx >= 2 && costBeforeValue > firstValueAnnual) {
      flags.push({
        code: 'roadmap_value_lands_too_late',
        severity: 'concern',
        message:
          `The first value milestone is phase ${firstValueIdx + 1}; ` +
          `${round2(costBeforeValue)} of spend lands before any verifiable ` +
          'value. Consider an earlier value checkpoint.',
      });
    }
  }

  // Trap: foundational work scheduled after the build depends on it.
  for (const p of phases) {
    if (p.isFoundational) continue;
    for (const depId of p.dependsOn) {
      const dep = phases.find((d) => d.id === depId);
      if (dep?.isFoundational && dep.order > p.order) {
        flags.push({
          code: 'roadmap_foundational_after_dependent',
          severity: 'blocker',
          message:
            `Phase '${p.id}' depends on foundational phase '${depId}' but ` +
            'the foundational phase is sequenced later — value cannot land.',
        });
      }
    }
  }

  // Trap: business change under-budgeted.
  if (businessChangeFraction < 0.15) {
    flags.push({
      code: 'roadmap_change_underbudgeted',
      severity: 'concern',
      message:
        `Business change is only ${Math.round(businessChangeFraction * 100)}% ` +
        'of roadmap effort — value depends on changed work; this is the ' +
        'classic under-budgeting trap.',
    });
  }

  // Concern: a phase with cost but no value and not foundational.
  for (const p of phases) {
    if (
      p.baseCost > 0 &&
      p.valueMilestone.valueShare === 0 &&
      !p.isFoundational
    ) {
      flags.push({
        code: 'roadmap_cost_no_value_phase',
        severity: 'concern',
        message:
          `Phase '${p.id}' carries cost but unlocks no value and is not ` +
          'flagged foundational — justify why it is funded.',
      });
    }
  }

  return flags;
}

/** Human-readable workstream label passthrough for the roadmap view. */
export function workstreamLabel(id: WorkstreamId): string {
  return WORKSTREAM_LABELS[id];
}

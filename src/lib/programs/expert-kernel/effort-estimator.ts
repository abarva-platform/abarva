// Expert Kernel — effort-estimator.
//
// Decomposes a Move into workstreams (AI build, integration, data,
// foundational, data governance, process redesign, change & adoption, run),
// each estimated as a role-mix effort with base / conservative / upside
// ranges and a human/agent split.
//
// Reuses the should-cost role-mix engine (`src/lib/source/should-cost/`) — the
// same blended-rate, on/offshore math is the single source of truth for
// labour economics across Source and Moves.
//
// Pure module: deterministic, no I/O.

import {
  buildShouldCostEstimate,
  type RoleMixEntry,
  type RoleRateCard,
} from '@/lib/source/should-cost/should-cost-model';
import { rangeOf, round2, sumRanges, type Range } from './types';

/** The eight standard Move workstreams. */
export type WorkstreamId =
  | 'ai_build'
  | 'integration'
  | 'data'
  | 'foundational'
  | 'data_governance'
  | 'process_redesign'
  | 'change_adoption'
  | 'run';

export const WORKSTREAM_LABELS: Record<WorkstreamId, string> = {
  ai_build: 'AI build',
  integration: 'Integration',
  data: 'Data',
  foundational: 'Foundational',
  data_governance: 'Data governance',
  process_redesign: 'Process redesign',
  change_adoption: 'Change & adoption',
  run: 'Run (year-1 operations)',
};

export interface WorkstreamInput {
  id: WorkstreamId;
  /** Proposed role mix for this workstream. */
  roleMix: RoleMixEntry[];
  /** Duration of this workstream in months. */
  durationMonths: number;
  /**
   * Fraction (0..1) of the workstream's labour that an AI agent performs
   * rather than a human. 0 = fully human, e.g. change & adoption.
   */
  agentSplit: number;
  /** Conservative multiplier on base effort (>= 1). Default 1.4. */
  conservativeMultiplier?: number;
  /** Upside (best-case) multiplier on base effort (<= 1). Default 0.85. */
  upsideMultiplier?: number;
}

export interface EffortEstimatorInput {
  moveName: string;
  /** Shared fully-loaded rate card for every role used across workstreams. */
  rateCard: RoleRateCard[];
  /** Engagement-level default offshore fraction (0..1). */
  offshoreRatio: number;
  workstreams: WorkstreamInput[];
}

export interface WorkstreamEstimate {
  id: WorkstreamId;
  label: string;
  /** base / conservative / upside as a cost Range (low=upside, high=conservative). */
  cost: Range;
  /** Fully-loaded base labour cost (the role-mix point estimate). */
  baseCost: number;
  /** Cost attributable to human effort. */
  humanCost: number;
  /** Cost attributable to AI-agent effort. */
  agentCost: number;
  agentSplit: number;
  totalHeadcount: number;
  durationMonths: number;
}

export interface EffortEstimate {
  moveName: string;
  workstreams: WorkstreamEstimate[];
  /** Total cost across all workstreams as a base/conservative/upside range. */
  totalCost: Range;
  /** Total human-effort cost (base). */
  totalHumanCost: number;
  /** Total agent-effort cost (base). */
  totalAgentCost: number;
  /** Fraction (0..1) of base effort delivered by AI agents. */
  effectiveAgentSplit: number;
}

const DEFAULT_CONSERVATIVE = 1.4;
const DEFAULT_UPSIDE = 0.85;

/**
 * Build an effort estimate. The per-workstream base cost is the should-cost
 * role-mix labour base; conservative and upside scale it. Throws on invalid
 * input (e.g. agentSplit outside 0..1).
 */
export function buildEffortEstimate(
  input: EffortEstimatorInput,
): EffortEstimate {
  if (input.workstreams.length === 0) {
    throw new Error('Effort estimate needs at least one workstream.');
  }

  const workstreams: WorkstreamEstimate[] = input.workstreams.map((ws) => {
    if (ws.agentSplit < 0 || ws.agentSplit > 1) {
      throw new Error(
        `Workstream '${ws.id}' agentSplit must be within 0..1.`,
      );
    }
    const conservative = ws.conservativeMultiplier ?? DEFAULT_CONSERVATIVE;
    const upside = ws.upsideMultiplier ?? DEFAULT_UPSIDE;
    if (conservative < 1) {
      throw new Error(
        `Workstream '${ws.id}' conservativeMultiplier must be >= 1.`,
      );
    }
    if (upside > 1) {
      throw new Error(`Workstream '${ws.id}' upsideMultiplier must be <= 1.`);
    }

    // Reuse the should-cost engine purely for its role-mix labour base. The
    // hidden-layer / vendor layers are deliberately neutralised here — this
    // module estimates *delivery effort*, not vendor TCO.
    const estimate = buildShouldCostEstimate({
      estimateLabel: `${input.moveName}:${ws.id}`,
      vendorQuotedCost: 0,
      vendorMarginRatio: 0,
      roleMix: ws.roleMix,
      rateCard: input.rateCard,
      durationMonths: ws.durationMonths,
      offshoreRatio: input.offshoreRatio,
      transitionCost: 0,
      consumption: { monthlyCloudCost: 0, monthlyModelCost: 0 },
      hiddenLayerDrivers: {
        integration: 0,
        dataMigration: 0,
        changeManagement: 0,
        operationsPerYear: 0,
        exit: 0,
      },
    });

    const baseCost = estimate.roleMix.implementationLabourBase;
    const cost = rangeOf(
      round2(baseCost * upside),
      round2(baseCost * conservative),
    );
    // Override the auto-derived midpoint with the true base estimate.
    cost.point = baseCost;

    return {
      id: ws.id,
      label: WORKSTREAM_LABELS[ws.id],
      cost,
      baseCost,
      humanCost: round2(baseCost * (1 - ws.agentSplit)),
      agentCost: round2(baseCost * ws.agentSplit),
      agentSplit: ws.agentSplit,
      totalHeadcount: estimate.roleMix.totalHeadcount,
      durationMonths: ws.durationMonths,
    };
  });

  const totalCost = sumRanges(workstreams.map((w) => w.cost));
  const totalBase = round2(workstreams.reduce((s, w) => s + w.baseCost, 0));
  const totalHumanCost = round2(
    workstreams.reduce((s, w) => s + w.humanCost, 0),
  );
  const totalAgentCost = round2(
    workstreams.reduce((s, w) => s + w.agentCost, 0),
  );
  // Re-anchor the total point on the summed base, not the midpoint of the sum.
  totalCost.point = totalBase;

  return {
    moveName: input.moveName,
    workstreams,
    totalCost,
    totalHumanCost,
    totalAgentCost,
    effectiveAgentSplit:
      totalBase > 0 ? round2(totalAgentCost / totalBase) : 0,
  };
}

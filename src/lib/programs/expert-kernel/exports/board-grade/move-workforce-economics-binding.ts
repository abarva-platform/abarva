// Workforce Economics — Move board-grade business-case binding (WE-3).
//
// This is the WE-3 seam from `src/lib/workforce-economics/DESIGN_NOTE.md`: it
// derives a `WorkforceEstimateInput` from a REAL Move's compiled effort
// skeleton and runs the pure `computeWorkforceEstimate` engine, so the Costed
// Business-Case Pack can carry an honest "estimate-twice" view — TRADITIONAL
// (people-only) vs AI-NATIVE (people + agents on subscription), with the
// cost / timeline / headcount delta and the productivity gain.
//
// SOURCE-OF-TRUTH DISCIPLINE. The estimate-twice is NOT a parallel business
// case. Every input is DERIVED from the kernel's own effort estimate:
//
//   • Effort hours W — Σ over workstreams of headcount × durationMonths ×
//     hoursPerFteMonth. The kernel works in headcount × duration × annual rate
//     (not hours), so hours are reconstructed from those fields with the
//     workbook's planning basis (173 billable hrs/FTE/month).
//   • Blended $/hr — derived as `effort.totalCost.point / W` so the engine's
//     TRADITIONAL cost reconciles EXACTLY to the kernel's investment point.
//     The geo mix is fed as a single onshore lane at that derived rate, so the
//     engine reproduces the kernel number rather than inventing a second one.
//   • Traditional team — the kernel's total headcount (people-only).
//   • AI-native team — the SAME effort hours, but the kernel's effective agent
//     split is read as the share of capacity carried by agents; humans are
//     reduced by that share (rounded conservatively) and an agent fleet is
//     sized to carry the rest as parallel capacity. This is a CAPACITY model,
//     never effort compression with a team cut (the double-count the workbook
//     caught).
//
// HONESTY DISCIPLINE (mirrors `move-pack-model.ts` / `move-estimate-model.ts`):
// every figure is a PLANNING estimate, NOT a quote. The agent capacity is a
// planning range with a conservative haircut (carried by the engine). When the
// Move's scope is too thin to derive a credible estimate-twice — no effort
// hours, no agent capacity, or a degenerate team — this binding SKIPS rather
// than fabricate, returning `null`.
//
// Pure module: deterministic, no I/O, no model calls.

import {
  computeWorkforceEstimate,
  type EstimateCategory,
  type WbsLine,
  type WorkforceEstimateInput,
  type WorkforceEstimateTwice,
} from '@/lib/workforce-economics/workforce-economics';
import type { BusinessCaseSkeleton } from '../../business-case-compiler';
import type { WorkstreamId } from '../../effort-estimator';

/**
 * Billable hours per FTE per month — the workbook planning basis (173). Used
 * only to reconstruct effort hours from the kernel's headcount × duration; the
 * blended rate is back-derived from the kernel cost so the basis cancels out of
 * the TRADITIONAL total (it does not bias the reconciled figure).
 */
const HOURS_PER_FTE_MONTH = 173;

/**
 * The anonymized agent platform planning assumptions. Provider-neutral — never
 * a real firm. Equiv-FTE/agent and utilization are conservative planning
 * defaults; the engine applies a further conservative haircut on top.
 */
const AGENT_PLATFORM = {
  label: 'AbarVa Agents',
  /** One agent carries ~0.8 engineer-FTE of parallel capacity (planning). */
  equivFtePerAgent: 0.8,
  /** Sustained utilization of that capacity (planning). */
  utilization: 0.7,
} as const;

/**
 * Per-agent annual subscription cost, $ (planning). A fleet's annual cost is
 * this × the agent count. Deliberately modest relative to a loaded human FTE so
 * the estimate-twice shows the subscription-vs-salary economics honestly.
 */
const AGENT_ANNUAL_COST_PER_AGENT = 36_000;

/**
 * Map each of the eight kernel workstreams onto one of the ten WBS estimate
 * categories the Workforce Economics engine consumes. Every workstream maps —
 * a category with no contributing workstream simply contributes zero hours.
 */
const WORKSTREAM_TO_CATEGORY: Record<WorkstreamId, EstimateCategory> = {
  ai_build: 'engineering',
  integration: 'engineering',
  data: 'engineering',
  foundational: 'architecture',
  data_governance: 'governance',
  process_redesign: 'change_management',
  change_adoption: 'training',
  run: 'deployment',
};

/**
 * How amenable each workstream's work is to AI agents — honest metadata for the
 * engine's assumptions block (it documents where the capacity gain comes from;
 * the capacity model applies agents at the program level, not per line).
 */
const WORKSTREAM_AMENABILITY: Record<
  WorkstreamId,
  'high' | 'medium' | 'low'
> = {
  ai_build: 'high',
  integration: 'high',
  data: 'high',
  foundational: 'medium',
  data_governance: 'medium',
  process_redesign: 'low',
  change_adoption: 'low',
  run: 'medium',
};

/**
 * Derive a `WorkforceEstimateInput` from a compiled business-case skeleton, or
 * `null` when the Move's scope is too thin to derive a credible estimate-twice
 * (skip rather than fabricate).
 *
 * CONSERVATIVE ASSUMPTIONS made because the kernel skeleton does not carry
 * effort HOURS directly:
 *   • Effort hours are reconstructed as headcount × durationMonths ×
 *     `HOURS_PER_FTE_MONTH`. The kernel costs by headcount × duration × annual
 *     rate, so this is the consistent hours reconstruction.
 *   • The blended $/hr is back-derived from the kernel's total cost so the
 *     TRADITIONAL scenario reconciles to the kernel investment exactly; the geo
 *     mix is therefore fed as a single onshore lane (no second rate basis).
 *   • The AI-native team is the same effort with humans reduced by the kernel's
 *     effective agent split (rounded down, but never below one human), with an
 *     agent fleet sized to carry the displaced capacity.
 */
export function deriveWorkforceEstimateInput(
  skeleton: BusinessCaseSkeleton,
  scopeLabel: string,
): WorkforceEstimateInput | null {
  const effort = skeleton.effort;
  const workstreams = effort.workstreams;
  if (!workstreams || workstreams.length === 0) return null;

  // --- Effort hours per WBS category (reconstructed from headcount × months).
  // Walk the workstreams in order so the WBS is deterministic; fold each kernel
  // workstream into its mapped WBS category, summing the reconstructed hours and
  // the traditional people footprint.
  let totalHumans = 0;
  const wbs: WbsLine[] = workstreams.reduce<WbsLine[]>((acc, ws) => {
    const headcount = Number.isFinite(ws.totalHeadcount)
      ? ws.totalHeadcount
      : 0;
    const months = Number.isFinite(ws.durationMonths) ? ws.durationMonths : 0;
    const hours = headcount * months * HOURS_PER_FTE_MONTH;
    if (hours <= 0) return acc;
    // Headcount is per-workstream peak; sum as the traditional people footprint.
    totalHumans += headcount;
    const category = WORKSTREAM_TO_CATEGORY[ws.id];
    const existing = acc.find((l) => l.category === category);
    if (existing) {
      existing.effortHours += hours;
    } else {
      acc.push({
        category,
        effortHours: hours,
        agentAmenability: WORKSTREAM_AMENABILITY[ws.id],
      });
    }
    return acc;
  }, []);

  const totalHours = wbs.reduce((sum, l) => sum + l.effortHours, 0);
  // Too-thin scope: no reconstructable effort, or no people. Skip honestly.
  if (totalHours <= 0 || totalHumans <= 0) return null;

  // --- Blended $/hr — back-derived so TRADITIONAL reconciles to the kernel.
  const kernelTotalCost = effort.totalCost.point;
  if (!Number.isFinite(kernelTotalCost) || kernelTotalCost <= 0) return null;
  const blendedRatePerHour = kernelTotalCost / totalHours;

  // --- Team shapes. Traditional = the kernel headcount footprint.
  const traditionalHumans = Math.max(1, Math.round(totalHumans));

  // AI-native: the kernel's effective agent split is the share of capacity that
  // shifts from humans to agents. Reduce humans by that share (never below one)
  // and size an agent fleet to carry the displaced capacity as parallel work.
  const agentSplit = clamp01(effort.effectiveAgentSplit);
  const aiNativeHumans = Math.max(
    1,
    Math.round(traditionalHumans * (1 - agentSplit)),
  );
  const displacedHumans = traditionalHumans - aiNativeHumans;
  // Size the fleet so its modelled FTE-equiv capacity ≈ the displaced humans.
  const perAgentCapacity =
    AGENT_PLATFORM.equivFtePerAgent * AGENT_PLATFORM.utilization;
  const aiNativeAgents =
    perAgentCapacity > 0 && displacedHumans > 0
      ? Math.max(1, Math.round(displacedHumans / perAgentCapacity))
      : 0;

  // No agent capacity to model (split ~0 or a single-person team) — the
  // estimate-twice would have no AI-native story. Skip rather than show a
  // degenerate "identical" pair.
  if (aiNativeAgents <= 0) return null;

  return {
    scopeLabel,
    wbs,
    geoMix: {
      // Single onshore lane at the back-derived blended rate so the engine
      // reproduces the kernel cost exactly (no second rate basis invented).
      onshoreFraction: 1,
      offshoreFraction: 0,
      onshoreRatePerHour: blendedRatePerHour,
      offshoreRatePerHour: blendedRatePerHour,
    },
    agentPlatform: {
      label: AGENT_PLATFORM.label,
      equivFtePerAgent: AGENT_PLATFORM.equivFtePerAgent,
      utilization: AGENT_PLATFORM.utilization,
      annualCost: aiNativeAgents * AGENT_ANNUAL_COST_PER_AGENT,
    },
    team: {
      traditionalHumans,
      aiNativeHumans,
      aiNativeAgents,
    },
    hoursPerFteMonth: HOURS_PER_FTE_MONTH,
  };
}

/**
 * Build the Workforce Economics estimate-twice for a Move from its compiled
 * skeleton, or `null` when the scope is too thin (skip, never fabricate).
 *
 * This is the WE-3 entry point the board-grade business-case generator calls
 * when the `moves_workforce_economics` flag is ON for the tenant. Pure +
 * deterministic — same skeleton → same `WorkforceEstimateTwice`.
 */
export function buildMoveWorkforceEconomics(
  skeleton: BusinessCaseSkeleton,
  scopeLabel: string,
): WorkforceEstimateTwice | null {
  const input = deriveWorkforceEstimateInput(skeleton, scopeLabel);
  if (!input) return null;
  try {
    return computeWorkforceEstimate(input);
  } catch {
    // The engine throws RangeError on structurally invalid input. A derived
    // input that fails validation is a skip, not a fabricated number.
    return null;
  }
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

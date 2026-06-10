// =============================================================================
// Moves consulting engine — E4: recommendation → WorkPackages → roadmap → estimate.
// -----------------------------------------------------------------------------
// Closes the "estimates float free of the roadmap" break. Takes the E3
// recommendation (leverage ranking + two-gap CapabilityGap[]) and produces:
//   (a) WorkPackages, each closing specific capability gaps, tagged with a kernel
//       WorkstreamId + a swimlane;
//   (b) an EffortEstimate (reusing the kernel effort-estimator) whose workstreams
//       ARE the workpackage workstreams;
//   (c) a Roadmap (reusing the kernel roadmap builder) whose phases sequence the
//       swimlanes — foundation → data → consumption → value → adoption — so the
//       estimate is phased BY the roadmap, and the where-to-start area leads.
//
// Every figure is traceable to a capability gap; the rate-card provenance banner
// is surfaced (planning benchmark, not a quote). Pure/deterministic + defensive.
//
// Design: docs/build/moves-design/moves-consulting-engine-arc.md (E4) +
// strategy-content-model.md (WorkPackage continuity contract).
// =============================================================================

import "server-only";
import {
  buildEffortEstimate,
  DEFAULT_PLANNING_RATE_CARD,
  type WorkstreamId,
  type WorkstreamInput,
  type EffortEstimate,
} from "@/lib/programs/expert-kernel/effort-estimator";
import {
  buildRoadmap,
  type RoadmapInput,
  type RoadmapPhaseInput,
  type Roadmap,
} from "@/lib/programs/expert-kernel/roadmap";
import type { RoleMixEntry } from "@/lib/source/should-cost/should-cost-model";
import type {
  CapabilityGap,
  CurrentStateRecommendation,
  MaturityDimension,
} from "@/lib/programs/current-state-maturity";

export type Swimlane =
  | "foundation"
  | "data_architecture"
  | "consumption"
  | "value_activation"
  | "adoption";

export interface WorkPackage {
  id: string;
  label: string;
  swimlane: Swimlane;
  workstreamId: WorkstreamId;
  capabilityGapIds: string[];
  deliverable: string;
  outcome: string;
}

// Each maturity dimension's gap maps to a kernel workstream.
const DIM_WORKSTREAM: Record<MaturityDimension, WorkstreamId> = {
  platform_infrastructure: "foundational",
  operating_model_process: "process_redesign",
  analytics_ai: "ai_build",
  people_skills: "change_adoption",
  adoption_change_readiness: "change_adoption",
  data_architecture: "data",
  data_governance: "data_governance",
  data_management_quality: "data",
};

// Each workstream lands in exactly ONE roadmap phase (kernel requires this).
const WORKSTREAM_PHASE: Record<
  WorkstreamId,
  { swimlane: Swimlane; order: number }
> = {
  foundational: { swimlane: "foundation", order: 0 },
  data: { swimlane: "data_architecture", order: 1 },
  data_governance: { swimlane: "data_architecture", order: 1 },
  ai_build: { swimlane: "consumption", order: 2 },
  integration: { swimlane: "consumption", order: 2 },
  process_redesign: { swimlane: "value_activation", order: 3 },
  change_adoption: { swimlane: "adoption", order: 4 },
  run: { swimlane: "adoption", order: 4 },
};

const SWIMLANE_LABEL: Record<Swimlane, string> = {
  foundation: "Foundation",
  data_architecture: "Data architecture",
  consumption: "Consumption / AI build",
  value_activation: "Value activation",
  adoption: "Adoption & change",
};

// Deterministic role mix + agent split + base duration per workstream.
const WORKSTREAM_PROFILE: Record<
  WorkstreamId,
  { roleMix: RoleMixEntry[]; agentSplit: number; baseMonths: number }
> = {
  ai_build: {
    roleMix: [
      { role: "ai_ml_lead", headcount: 1 },
      { role: "full_stack_engineer", headcount: 2 },
      { role: "backend_engineer", headcount: 1 },
    ],
    agentSplit: 0.5,
    baseMonths: 3,
  },
  foundational: {
    roleMix: [
      { role: "solution_architect", headcount: 1 },
      { role: "devops_sre_lead", headcount: 1 },
    ],
    agentSplit: 0.3,
    baseMonths: 3,
  },
  data: {
    roleMix: [{ role: "data_engineer", headcount: 2 }],
    agentSplit: 0.3,
    baseMonths: 3,
  },
  data_governance: {
    roleMix: [{ role: "domain_sme", headcount: 1 }],
    agentSplit: 0.1,
    baseMonths: 2,
  },
  integration: {
    roleMix: [{ role: "full_stack_engineer", headcount: 1 }],
    agentSplit: 0.3,
    baseMonths: 2,
  },
  process_redesign: {
    roleMix: [
      { role: "domain_sme", headcount: 1 },
      { role: "product_owner", headcount: 1 },
    ],
    agentSplit: 0.15,
    baseMonths: 2,
  },
  change_adoption: {
    roleMix: [{ role: "domain_sme", headcount: 1 }],
    agentSplit: 0.0,
    baseMonths: 3,
  },
  run: {
    roleMix: [{ role: "devops_sre_lead", headcount: 1 }],
    agentSplit: 0.2,
    baseMonths: 4,
  },
};

/** Derive work packages from the recommendation's gaps + ranked leader. Pure. */
export function deriveWorkPackages(
  rec: CurrentStateRecommendation,
): WorkPackage[] {
  const packages: WorkPackage[] = [];

  // One package per capability gap, closing it via the mapped workstream.
  for (const gap of rec.gaps) {
    const ws = DIM_WORKSTREAM[gap.dimension];
    packages.push({
      id: `wp_${gap.dimension}`,
      label: `Close ${gap.capability} gap`,
      swimlane: WORKSTREAM_PHASE[ws].swimlane,
      workstreamId: ws,
      capabilityGapIds: [gap.id],
      deliverable: `${gap.capability} brought toward target ${gap.targetScore}/5`,
      outcome: gap.rationale,
    });
  }

  // The where-to-start AI build for the top-ranked area (the consumption play).
  const top = rec.ranking[0];
  if (top) {
    const ucGapIds = rec.gaps
      .filter((g) => g.gapType === "use_case")
      .map((g) => g.id);
    packages.push({
      id: "wp_ai_enablement",
      label: `AI enablement — ${top.label}`,
      swimlane: "consumption",
      workstreamId: "ai_build",
      capabilityGapIds: ucGapIds,
      deliverable: `AI-assisted delivery uplift for the ${top.label} area`,
      outcome: `Highest leverage (${top.score}); ${top.readinessBasis}`,
    });
  }

  return packages;
}

function uniqueWorkstreams(packages: WorkPackage[]): WorkstreamId[] {
  return Array.from(new Set(packages.map((p) => p.workstreamId)));
}

function buildWorkstreamInputs(packages: WorkPackage[]): WorkstreamInput[] {
  const counts = new Map<WorkstreamId, number>();
  for (const p of packages)
    counts.set(p.workstreamId, (counts.get(p.workstreamId) ?? 0) + 1);

  return uniqueWorkstreams(packages).map((ws) => {
    const prof = WORKSTREAM_PROFILE[ws];
    const n = counts.get(ws) ?? 1;
    return {
      id: ws,
      roleMix: prof.roleMix,
      // More packages on a workstream → slightly longer, capped.
      durationMonths: Math.min(prof.baseMonths + (n - 1), prof.baseMonths + 3),
      agentSplit: prof.agentSplit,
    };
  });
}

function buildRoadmapPhases(
  packages: WorkPackage[],
  estimateWorkstreams: WorkstreamId[],
): RoadmapPhaseInput[] {
  // Group workstreams by their phase order.
  const byOrder = new Map<number, { swimlane: Swimlane; ws: WorkstreamId[] }>();
  for (const ws of estimateWorkstreams) {
    const { swimlane, order } = WORKSTREAM_PHASE[ws];
    const e = byOrder.get(order) ?? { swimlane, ws: [] };
    e.ws.push(ws);
    byOrder.set(order, e);
  }
  const orders = Array.from(byOrder.keys()).sort((a, b) => a - b);

  // Value: enablement phases (foundation/data) carry 0; the rest split the value.
  const valueOrders = orders.filter((o) => o >= 2);
  const perValue = valueOrders.length > 0 ? 1 / valueOrders.length : 0;

  let prevId: string | null = null;
  const phases: RoadmapPhaseInput[] = orders.map((order, idx) => {
    const e = byOrder.get(order)!;
    const id = `p${order}_${e.swimlane}`;
    const isFoundational = order <= 1;
    const valueShare = order >= 2 ? Number(perValue.toFixed(3)) : 0;
    const phase: RoadmapPhaseInput = {
      id,
      label: `Phase ${idx} — ${SWIMLANE_LABEL[e.swimlane]}`,
      order: idx,
      durationMonths: 3,
      workstreamIds: e.ws,
      dependsOn: prevId ? [prevId] : [],
      valueMilestone: {
        statement: isFoundational
          ? `Enablement: ${SWIMLANE_LABEL[e.swimlane]} capability in place`
          : `Value: ${SWIMLANE_LABEL[e.swimlane]} outcomes realized`,
        metricKey: null, // not locked until the P1 ValueTree
        valueShare,
      },
      isFoundational,
    };
    prevId = id;
    return phase;
  });
  return phases;
}

export interface CurrentStatePlan {
  workPackages: WorkPackage[];
  estimate: EffortEstimate;
  roadmap: Roadmap;
  rateCardProvenance: string;
  valueRatified: boolean;
  note: string;
}

/**
 * Build the sequenced plan (work packages → estimate → roadmap) from the E3
 * recommendation. Reuses the kernel estimator + roadmap builder so the estimate
 * is phased by the roadmap's workpackages. `steadyStateAnnualValue` is a planning
 * input; until the P1 ValueTree ratifies value it stays 0 (honest, not hidden).
 */
export function buildCurrentStatePlan(
  rec: CurrentStateRecommendation,
  opts: {
    moveName: string;
    steadyStateAnnualValue?: number;
    offshoreRatio?: number;
  } = {
    moveName: "Move",
  },
): CurrentStatePlan {
  const workPackages = deriveWorkPackages(rec);
  const workstreams = buildWorkstreamInputs(workPackages);

  const estimate = buildEffortEstimate({
    moveName: opts.moveName,
    rateCard: DEFAULT_PLANNING_RATE_CARD,
    offshoreRatio: opts.offshoreRatio ?? 0.4,
    workstreams,
  });

  const phases = buildRoadmapPhases(
    workPackages,
    workstreams.map((w) => w.id),
  );

  const steadyStateAnnualValue = opts.steadyStateAnnualValue ?? 0;
  const roadmap = buildRoadmap({
    moveName: opts.moveName,
    effort: estimate,
    steadyStateAnnualValue,
    phases,
  });

  return {
    workPackages,
    estimate,
    roadmap,
    rateCardProvenance: DEFAULT_PLANNING_RATE_CARD.label,
    valueRatified: steadyStateAnnualValue > 0,
    note:
      steadyStateAnnualValue > 0
        ? "Cost and value both modeled."
        : "Cost modeled from work packages; value is not yet ratified (P1 ValueTree) — value milestones show share only.",
  };
}

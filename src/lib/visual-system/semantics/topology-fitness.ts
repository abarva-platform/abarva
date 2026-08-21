/**
 * Topology fitness — does the recorded data support a relationship view at all?
 *
 * Semantic correctness cannot rescue structurally poor source data. One tenant's integration
 * register holds 499 flows reaching 499 distinct destinations with a maximum inbound of one and
 * sequential opaque ids: the generator walked the application list. Every classification in that
 * view can be right and the picture still teaches nothing, because there is no topology in it.
 *
 * Rendering it anyway produces a polished artefact asserting a structure the record does not
 * contain. Refusing it, and saying why, is the more credible output — and it keeps the defect
 * visible instead of letting the renderer hide it.
 */

export interface TopologyFitness {
  flowCount: number;
  distinctSourceCount: number;
  distinctTargetCount: number;
  /** Share of destinations receiving more than one flow. Zero means no convergence exists. */
  targetConvergenceRatio: number;
  /** Share of destinations receiving exactly one flow. */
  oneToOneTargetRatio: number;
  /** Share of destinations whose identifier looks machine-generated and sequential. */
  opaqueSequentialTargetRatio: number;
  maxInbound: number;
  fitForExecutiveFlow: boolean;
  findings: string[];
}

/** Identifiers like APP-0001 that carry no meaning to a reader and, in sequence, indicate a
 * generated list rather than a recorded estate. */
const OPAQUE_ID = /^[A-Z]{2,6}[-_]?\d{3,6}$/;

export interface TopologyThresholds {
  /** Below this share of converging destinations the view is distribution, not topology. */
  minConvergenceRatio: number;
  /** Above this share of one-to-one destinations there is effectively no fan-in to show. */
  maxOneToOneRatio: number;
  /** Above this share of opaque sequential ids the endpoints are not defensible destinations. */
  maxOpaqueSequentialRatio: number;
  minFlows: number;
}

export const DEFAULT_TOPOLOGY_THRESHOLDS: TopologyThresholds = {
  minConvergenceRatio: 0.05,
  maxOneToOneRatio: 0.9,
  maxOpaqueSequentialRatio: 0.5,
  minFlows: 10,
};

export function assessTopologyFitness(
  flows: ReadonlyArray<{ source: string; target: string }>,
  thresholds: TopologyThresholds = DEFAULT_TOPOLOGY_THRESHOLDS,
): TopologyFitness {
  const sources = new Set<string>();
  const targetCounts = new Map<string, number>();
  for (const f of flows) {
    if (f.source) sources.add(f.source);
    if (f.target) targetCounts.set(f.target, (targetCounts.get(f.target) ?? 0) + 1);
  }

  const targets = [...targetCounts.keys()];
  const counts = [...targetCounts.values()];
  const distinctTargetCount = targets.length;
  const converging = counts.filter((c) => c > 1).length;
  const oneToOne = counts.filter((c) => c === 1).length;
  const opaque = targets.filter((t) => OPAQUE_ID.test(t.trim())).length;

  const targetConvergenceRatio = distinctTargetCount ? converging / distinctTargetCount : 0;
  const oneToOneTargetRatio = distinctTargetCount ? oneToOne / distinctTargetCount : 0;
  const opaqueSequentialTargetRatio = distinctTargetCount ? opaque / distinctTargetCount : 0;
  const maxInbound = counts.length ? Math.max(...counts) : 0;

  const findings: string[] = [];
  if (flows.length < thresholds.minFlows) {
    findings.push(`Only ${flows.length} recorded flows — too few to describe a topology.`);
  }
  if (targetConvergenceRatio < thresholds.minConvergenceRatio) {
    findings.push(
      `${converging} of ${distinctTargetCount} destinations receive more than one flow (max inbound ${maxInbound}). The record describes distribution, not convergence.`,
    );
  }
  if (oneToOneTargetRatio > thresholds.maxOneToOneRatio) {
    findings.push(
      `${Math.round(oneToOneTargetRatio * 100)}% of destinations receive exactly one flow, so no destination is materially more connected than another.`,
    );
  }
  if (opaqueSequentialTargetRatio > thresholds.maxOpaqueSequentialRatio) {
    findings.push(
      `${Math.round(opaqueSequentialTargetRatio * 100)}% of destinations are opaque sequential identifiers, which indicates generated rather than recorded endpoints.`,
    );
  }

  return {
    flowCount: flows.length,
    distinctSourceCount: sources.size,
    distinctTargetCount,
    targetConvergenceRatio,
    oneToOneTargetRatio,
    opaqueSequentialTargetRatio,
    maxInbound,
    fitForExecutiveFlow: findings.length === 0,
    findings,
  };
}

/** Copy shown in place of the diagram when the record cannot support one. Deliberately states the
 * remedy and what remains usable, so a reader is not simply told "no". */
export const TOPOLOGY_UNFIT_MESSAGE =
  "Current-state flow unavailable — the recorded target topology does not yet support a defensible relationship view. The estate landscape remains available while topology data is remediated.";

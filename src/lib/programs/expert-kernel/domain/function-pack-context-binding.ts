// Domain Function Pack — context binding (spec §5).
//
// This is the proof that the binding contract is real, not theoretical. Before
// a kernel or renderer reasons about a task in a known industry-function, it
// binds the pack: the deliverable outline drives the artifact's table of
// contents, and the operating-metrics list drives the baseline model — turning
// "metric absent" into a PRECISE, named seed gap (spec §5, §7).
//
// `bindFunctionPackForArtifact` is one concrete consumption point that
// demonstrates that contract. It is a pure function: given an industry, a
// function, the target Moves phase artifact, and the set of metric keys the
// tenant actually records, it returns the inherited TOC and a precise seed-gap
// list for every expected metric the tenant does not have.
//
// This deliberately wires ONE clean consumption point — it does not re-wire
// the whole kernel. It proves the contract; the broader wiring follows.
//
// Pure module: deterministic, no I/O.

import {
  type FunctionPackFunctionKey,
  type FunctionPackIndustryKey,
  type MovesPhaseArtifact,
  type OperatingMetric,
} from './function-pack-types';
import { resolveFunctionPack } from './function-pack-registry';

/**
 * A precise, named seed gap — an operating metric the function expects but the
 * tenant does not record. Per spec §7 this is far sharper than "we don't have
 * this number": the pack knows what the metric IS, where it is sourced, and
 * why its absence matters.
 */
export interface SeedGap {
  /** The metric key the function expects. */
  metricKey: string;
  /** The metric's human name. */
  metricName: string;
  /** What the metric measures — carried so the gap is self-describing. */
  definition: string;
  /** The system the metric should be sourced from. */
  expectedDataSource: string;
  /** A ready-to-render statement of the gap and what it blocks. */
  gapStatement: string;
}

/**
 * The result of binding a Function Pack for a specific phase artifact — the
 * inherited table of contents plus the precise seed gaps. This is what a
 * kernel/renderer consumes instead of improvising structure and instead of
 * reporting vague unknowns.
 */
export interface FunctionPackBinding {
  /** True when a pack was found and bound; false when none exists. */
  bound: boolean;
  /** The bound pack's function label, when bound. */
  functionLabel?: string;
  /** The artifact's label from the inherited outline, when bound. */
  artifactLabel?: string;
  /** The phase the artifact belongs to, when bound. */
  phase?: string;
  /** The inherited table of contents — the section headings, in order. */
  deliverableOutline: { heading: string; guidance: string }[];
  /** Every operating metric the function expects, in pack order. */
  expectedMetrics: OperatingMetric[];
  /** The precise seed gaps — expected metrics the tenant does not record. */
  seedGaps: SeedGap[];
  /**
   * When no pack exists: the honest fallback note the agent must surface
   * instead of silently faking depth (spec §5). Empty when bound.
   */
  fallbackNote: string;
}

/** Turn an expected-but-absent metric into a precise seed gap (spec §7). */
function toSeedGap(metric: OperatingMetric): SeedGap {
  return {
    metricKey: metric.key,
    metricName: metric.name,
    definition: metric.definition,
    expectedDataSource: metric.dataSource,
    gapStatement:
      `"${metric.name}" is not recorded — this function expects it; it is ` +
      `sourced from ${metric.dataSource}; its absence blocks the baseline ` +
      `and the value forecast.`,
  };
}

/**
 * Bind a Function Pack for a specific Moves phase artifact.
 *
 * The cleanest demonstration of the §5 binding contract: a kernel/renderer
 * passes the industry, the function, the artifact it is about to produce, and
 * the set of operating-metric keys the tenant actually records. It gets back:
 *
 *  - `deliverableOutline` — the canonical TOC for that artifact, to inherit
 *     instead of improvising structure;
 *  - `expectedMetrics` — every operating metric the function expects, to drive
 *     the baseline model;
 *  - `seedGaps` — for every expected metric the tenant does NOT record, a
 *     precise, named seed gap (spec §7) rather than a vague unknown.
 *
 * When no pack exists for the industry-function, `bound` is `false` and
 * `fallbackNote` carries the honest "no curated pack — general reasoning"
 * statement the agent must surface (spec §5). It never fabricates an outline.
 *
 * @param industryKey      The industry vertical of the task.
 * @param functionKey      The function of the task.
 * @param artifact         The Moves phase artifact about to be produced.
 * @param tenantMetricKeys The operating-metric keys the tenant actually records.
 */
export function bindFunctionPackForArtifact(
  industryKey: FunctionPackIndustryKey,
  functionKey: FunctionPackFunctionKey,
  artifact: MovesPhaseArtifact,
  tenantMetricKeys: readonly string[],
): FunctionPackBinding {
  const pack = resolveFunctionPack(industryKey, functionKey);

  if (!pack) {
    return {
      bound: false,
      deliverableOutline: [],
      expectedMetrics: [],
      seedGaps: [],
      fallbackNote:
        `No curated Domain Function Pack exists for ` +
        `(${industryKey}, ${functionKey}). The agent falls back to general ` +
        `reasoning for this task — this is a known curated-depth gap, not ` +
        `fabricated depth.`,
    };
  }

  const outline = pack.deliverableOutlines.find((o) => o.artifact === artifact);

  // A pack with no outline for the requested artifact is a depth gap of that
  // pack, surfaced honestly rather than papered over with an empty TOC.
  if (!outline) {
    return {
      bound: false,
      functionLabel: pack.functionLabel,
      deliverableOutline: [],
      expectedMetrics: pack.operatingMetrics,
      seedGaps: [],
      fallbackNote:
        `The Function Pack for (${industryKey}, ${functionKey}) does not yet ` +
        `carry a deliverable outline for "${artifact}". The agent inherits ` +
        `the operating metrics but must structure this artifact by general ` +
        `reasoning — a known pack gap.`,
    };
  }

  const recorded = new Set(tenantMetricKeys);
  const seedGaps = pack.operatingMetrics
    .filter((metric) => !recorded.has(metric.key))
    .map(toSeedGap);

  return {
    bound: true,
    functionLabel: pack.functionLabel,
    artifactLabel: outline.label,
    phase: outline.phase,
    deliverableOutline: outline.sections.map((section) => ({
      heading: section.heading,
      guidance: section.guidance,
    })),
    expectedMetrics: pack.operatingMetrics,
    seedGaps,
    fallbackNote: '',
  };
}

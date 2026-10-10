/**
 * Moves ROM service — release roll-up over the ROM engine core (ROM increment 3).
 *
 * Takes a typed rough-order-of-magnitude (ROM) structure — use cases with
 * component counts, caller-supplied unit hours, releases, one shared
 * foundation block, a pod, friction and productive share — and prices it:
 *
 *   line hours      = round4(count × unit hours × friction)      per driver
 *   use-case hours  = round4(Σ line hours)
 *   release hours   = round4(Σ use-case hours in the release)
 *   release / foundation cost = `pricePod` (whole pod-weeks, rates from the
 *                               cost foundation with provenance)
 *   range           = named 0.75 / 1.50 band for a not-designed block, the
 *                     existing score tiers for a designed one
 *   total           = `rollUpPortfolio` over the releases, with the
 *                     foundation's lines carried as a `shared_program` block
 *                     under one `sharedCostRef`, so it counts ONCE
 *
 * ## Engines compute, nobody guesses
 *
 * - Unit hours come from the caller, each with a source and a confidence.
 *   No reference unit hours exist yet, so a driver that is counted without
 *   unit hours is refused (`unit_hours_missing`) — never defaulted.
 * - Every hours line carries `FormulaTerm`s through the engine's own
 *   formula-terms contract (`closeHoursTerms`), so the workbook builder can
 *   write live formulas that reconcile to these numbers.
 * - Pod members are priced only through `createReferencePodRateResolver`
 *   (role × level × location × provider class from the cost foundation),
 *   each rate with its provenance. No bare hourly number is accepted.
 * - No AI productivity credit and no tool licence is applied here.
 *
 * Pure and deterministic: all reference data arrives through the injected
 * `RomReferenceLoaders`. Invalid input returns a typed refusal whose
 * `message` is a sentence a reader can act on — never NaN or a silent zero.
 */
import { closeHoursTerms } from "../effort-engine/formula-terms";
import { roundHours, sumCents } from "../effort-engine/money";
import {
  pricePod,
  type PodMember,
  type PodPricingResult,
  type PodRateBasis,
} from "../effort-engine/pod-pricer";
import {
  createReferencePodRateResolver,
  type PodRateReference,
} from "../effort-engine/pod-rate-adapter";
import {
  podMembersFromTemplate,
  type PodTemplateLibrary,
} from "../effort-engine/pod-templates";
import {
  rollUpPortfolio,
  type PortfolioRollup,
} from "../effort-engine/cost-engine";
import {
  applyNamedRangePolicy,
  computeRangeScore,
  NoMatchingRangePolicyError,
  applyRangePolicy,
} from "../effort-engine/range-policy";
import type {
  Cents,
  EffortEngineOutput,
  EffortLineItem,
  FormulaTerm,
  NamedRangePolicy,
  PricingRangePolicyRow,
  RangePolicyInputs,
} from "../effort-engine/types";
import { ROM_DRIVERS, ROM_DRIVER_LABELS, type RomDriver } from "./rom-drivers";

// ---------------------------------------------------------------------------
// Input structure
// ---------------------------------------------------------------------------

/** The component drivers and their labels live in `rom-drivers.ts`. */
export { ROM_DRIVERS, ROM_DRIVER_LABELS, type RomDriver };

export type RomConfidence = "low" | "medium" | "high";
const ROM_CONFIDENCES: readonly RomConfidence[] = ["low", "medium", "high"];

export type RomDesignStatus = "not_designed" | "designed";
const ROM_DESIGN_STATUSES: readonly RomDesignStatus[] = [
  "not_designed",
  "designed",
];

const POD_RATE_BASES: readonly PodRateBasis[] = [
  "loaded_cost",
  "scarcity_adjusted_cost",
  "bill_rate",
];

/** Hours per one unit of a driver, as the caller supplies it. */
export interface RomUnitHours {
  value: number;
  /** Where the number came from (non-blank). */
  source: string;
  confidence: RomConfidence;
}

/** A single program-level factor (friction, productive share, hours per FTE-week). */
export interface RomSourcedFactor {
  value: number;
  /** Where the number came from (non-blank). */
  source: string;
}

export type RomComponentCounts = Partial<Record<RomDriver, number>>;

export interface RomUseCase {
  code: string;
  name: string;
  counts: RomComponentCounts;
}

export interface RomRelease {
  code: string;
  name: string;
  designStatus: RomDesignStatus;
  useCaseCodes: readonly string[];
  /** Required when `designStatus === 'designed'`: the five score-tier inputs. */
  rangeInputs?: RangePolicyInputs;
}

export interface RomFoundation {
  code: string;
  name: string;
  counts: RomComponentCounts;
  designStatus: RomDesignStatus;
  rangeInputs?: RangePolicyInputs;
  /** Releases that depend on the foundation. Absent = every release. Its cost counts once in the total either way. */
  sharedByReleaseCodes?: readonly string[];
}

export interface RomExplicitMember {
  roleCode: string;
  levelCode: string;
  fte: number;
  /** Set when the role code was proposed rather than confirmed. Shown as "proposed mapping, unapproved". */
  proposedMapping?: boolean;
}

export interface RomPodSpec {
  /** A pod template code from the pod library. Exactly one of `templateCode` / `members`. */
  templateCode?: string;
  members?: readonly RomExplicitMember[];
  locationCode: string;
  providerClassCode?: string | null;
  rateBasis: PodRateBasis;
}

export interface RomStructure {
  useCases: readonly RomUseCase[];
  unitHours: Partial<Record<RomDriver, RomUnitHours>>;
  releases: readonly RomRelease[];
  foundation?: RomFoundation | null;
  pod: RomPodSpec;
  friction: RomSourcedFactor;
  productiveShare: RomSourcedFactor;
  hoursPerFteWeek: RomSourcedFactor;
}

/** Reference data the service reads. Synchronous and side-effect free for a given call. */
export interface RomReferenceLoaders {
  loadRateReference(): Omit<PodRateReference, "basis">;
  loadPodLibrary(): PodTemplateLibrary;
  loadRangePolicies(): readonly Pick<
    PricingRangePolicyRow,
    | "policy_code"
    | "policy_name"
    | "min_score"
    | "max_score"
    | "low_multiplier"
    | "high_multiplier"
  >[];
}

/** The band every not-designed block carries. */
export const ROM_NOT_DESIGNED_RANGE: NamedRangePolicy = {
  code: "ROM-NOT-DESIGNED",
  low: 0.75,
  high: 1.5,
};

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

export type RomBlockKind = "use_case" | "foundation";

export interface RomHoursLine {
  blockKind: RomBlockKind;
  blockCode: string;
  driver: RomDriver;
  count: number;
  unitHours: RomUnitHours;
  friction: number;
  hours: number;
  /** count × unit hours × friction = hours (reconciles via `evaluateFormulaTerms`). */
  formulaTerms: readonly FormulaTerm[];
}

export interface RomHoursBlock {
  kind: RomBlockKind;
  code: string;
  name: string;
  /** For a use case: its release. For the foundation: null. */
  releaseCode: string | null;
  lines: readonly RomHoursLine[];
  hours: number;
}

export interface RomRange {
  basis: "named" | "score";
  policyCode: string;
  /** The five-dimension score, for `basis: 'score'` only. */
  score: number | null;
  lowMultiplier: number;
  highMultiplier: number;
  lowCents: Cents;
  planCents: Cents;
  highCents: Cents;
}

/** The mapping status of one pod member, for the workbook's rate tab. */
export type RomMemberMappingStatus =
  | "confirmed"
  | "caller_specified"
  | "proposed_unapproved";

export interface RomPricedBlock {
  kind: "release" | "foundation";
  code: string;
  name: string;
  designStatus: RomDesignStatus;
  hours: number;
  weeks: number;
  pod: PodPricingResult;
  range: RomRange;
}

export interface RomReleaseResult {
  code: string;
  name: string;
  designStatus: RomDesignStatus;
  useCases: readonly RomHoursBlock[];
  /** The release's own use cases, priced with the pod. */
  own: RomPricedBlock;
  sharesFoundation: boolean;
  /** Own + the foundation when this release depends on it — what the release costs on its own. */
  standalone: { lowCents: Cents; planCents: Cents; highCents: Cents };
}

export interface RomPodSummary {
  podCode: string;
  source: string;
  locationCode: string;
  providerClassCode: string | null;
  rateBasis: PodRateBasis;
  members: readonly PodMember[];
  memberMappingStatus: readonly RomMemberMappingStatus[];
}

export interface RomTotal {
  /** Σ release hours + foundation hours, once. */
  hours: number;
  /**
   * Σ release weeks + foundation weeks, once: one pod delivers the blocks one
   * after another, so their whole pod-weeks add up.
   */
  weeks: number;
  lowCents: Cents;
  planCents: Cents;
  highCents: Cents;
  /** What counting the foundation inside every release that shares it would have summed to. */
  naiveSumCents: Cents;
  rollup: PortfolioRollup;
}

export interface RomResult {
  ok: true;
  structure: RomStructure;
  pod: RomPodSummary;
  releases: readonly RomReleaseResult[];
  foundation: {
    hours: RomHoursBlock;
    priced: RomPricedBlock;
    sharedByReleaseCodes: readonly string[];
  } | null;
  total: RomTotal;
  /** No AI productivity credit is applied anywhere in a ROM. */
  productivityCreditApplied: false;
}

export type RomRefusalCode =
  | "invalid_structure"
  | "duplicate_code"
  | "unknown_use_case"
  | "unknown_release"
  | "use_case_unassigned"
  | "use_case_in_two_releases"
  | "empty_release"
  | "empty_block"
  | "invalid_count"
  | "unit_hours_missing"
  | "invalid_unit_hours"
  | "invalid_factor"
  | "range_inputs_missing"
  | "no_matching_range_policy"
  | "invalid_pod"
  | "pod_template_refused"
  | "pod_pricing_refused";

export interface RomRefusal {
  ok: false;
  code: RomRefusalCode;
  /** A sentence naming what is wrong and what would fix it. */
  message: string;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function refuse(code: RomRefusalCode, message: string): RomRefusal {
  return { ok: false, code, message };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonBlank(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function checkCounts(owner: string, counts: unknown): RomRefusal | null {
  if (!isRecord(counts)) {
    return refuse(
      "invalid_structure",
      `${owner} needs a counts object keyed by component driver.`,
    );
  }
  for (const [key, value] of Object.entries(counts)) {
    if (!(ROM_DRIVERS as readonly string[]).includes(key)) {
      return refuse(
        "invalid_structure",
        `${owner} counts an unknown driver '${key}'. Use one of: ${ROM_DRIVERS.join(", ")}.`,
      );
    }
    if (!isFiniteNumber(value) || value < 0 || !Number.isInteger(value)) {
      return refuse(
        "invalid_count",
        `${owner} has ${key} = ${String(value)}. A component count must be a whole number of 0 or more.`,
      );
    }
  }
  if (!ROM_DRIVERS.some((d) => ((counts as RomComponentCounts)[d] ?? 0) > 0)) {
    return refuse(
      "empty_block",
      `${owner} counts no components. Give it at least one count above zero.`,
    );
  }
  return null;
}

function checkFactor(
  name: string,
  factor: unknown,
  valid: (v: number) => boolean,
  rule: string,
): RomRefusal | null {
  if (
    !isRecord(factor) ||
    !isFiniteNumber(factor.value) ||
    !valid(factor.value)
  ) {
    const got = isRecord(factor) ? String(factor.value) : "nothing";
    return refuse(
      "invalid_factor",
      `${name} must be ${rule}, with a source; got ${got}.`,
    );
  }
  if (!isNonBlank(factor.source)) {
    return refuse(
      "invalid_factor",
      `${name} needs a source saying where the value came from.`,
    );
  }
  return null;
}

function checkRangeInputs(
  owner: string,
  block: Record<string, unknown>,
): RomRefusal | null {
  if (!ROM_DESIGN_STATUSES.includes(block.designStatus as RomDesignStatus)) {
    return refuse(
      "invalid_structure",
      `${owner} has design status '${String(block.designStatus)}'. Use 'not_designed' or 'designed'.`,
    );
  }
  if (block.designStatus !== "designed") return null;
  const inputs = block.rangeInputs;
  const tier = (v: unknown) => v === "low" || v === "medium" || v === "high";
  if (
    !isRecord(inputs) ||
    !tier(inputs.scopeMaturity) ||
    !tier(inputs.evidenceQuality) ||
    !tier(inputs.deliveryNovelty) ||
    !tier(inputs.quantityUncertainty) ||
    !isFiniteNumber(inputs.rateCardCoveragePct) ||
    inputs.rateCardCoveragePct < 0 ||
    inputs.rateCardCoveragePct > 100
  ) {
    return refuse(
      "range_inputs_missing",
      `${owner} is designed, so it needs the five range inputs (scope maturity, evidence quality, delivery novelty and quantity uncertainty as low, medium or high, and rate-card coverage from 0 to 100).`,
    );
  }
  return null;
}

/** Shape and semantic checks. Returns the input typed as a structure, or the first refusal. */
export function validateRomStructure(
  input: unknown,
): { ok: true; structure: RomStructure } | RomRefusal {
  if (!isRecord(input))
    return refuse(
      "invalid_structure",
      "The ROM structure must be a JSON object.",
    );
  const { useCases, unitHours, releases, foundation, pod } = input;
  if (!Array.isArray(useCases) || useCases.length === 0) {
    return refuse(
      "invalid_structure",
      "The ROM structure needs at least one use case.",
    );
  }
  if (!Array.isArray(releases) || releases.length === 0) {
    return refuse(
      "invalid_structure",
      "The ROM structure needs at least one release.",
    );
  }
  if (!isRecord(unitHours)) {
    return refuse(
      "invalid_structure",
      "The ROM structure needs a unitHours object keyed by component driver.",
    );
  }

  const codes = new Set<string>();
  const claim = (code: unknown, what: string): RomRefusal | null => {
    if (!isNonBlank(code))
      return refuse(
        "invalid_structure",
        `Every ${what} needs a non-blank code.`,
      );
    if (codes.has(code)) {
      return refuse(
        "duplicate_code",
        `The code '${code}' is used more than once. Give every use case, release and the foundation its own code.`,
      );
    }
    codes.add(code);
    return null;
  };

  const useCaseCodes = new Set<string>();
  for (const uc of useCases) {
    if (!isRecord(uc))
      return refuse("invalid_structure", "Every use case must be an object.");
    const err =
      claim(uc.code, "use case") ??
      (isNonBlank(uc.name)
        ? null
        : refuse(
            "invalid_structure",
            `Use case '${String(uc.code)}' needs a name.`,
          )) ??
      checkCounts(`Use case '${String(uc.code)}'`, uc.counts);
    if (err) return err;
    useCaseCodes.add(uc.code as string);
  }

  const releaseOf = new Map<string, string>();
  const releaseCodes = new Set<string>();
  for (const release of releases) {
    if (!isRecord(release))
      return refuse("invalid_structure", "Every release must be an object.");
    const owner = `Release '${String(release.code)}'`;
    const err =
      claim(release.code, "release") ??
      (isNonBlank(release.name)
        ? null
        : refuse("invalid_structure", `${owner} needs a name.`)) ??
      checkRangeInputs(owner, release);
    if (err) return err;
    releaseCodes.add(release.code as string);
    if (
      !Array.isArray(release.useCaseCodes) ||
      release.useCaseCodes.length === 0
    ) {
      return refuse(
        "empty_release",
        `${owner} groups no use cases. List at least one use case code in it.`,
      );
    }
    for (const ucCode of release.useCaseCodes) {
      if (!useCaseCodes.has(ucCode)) {
        return refuse(
          "unknown_use_case",
          `${owner} lists use case '${String(ucCode)}', which is not in the structure.`,
        );
      }
      const prior = releaseOf.get(ucCode);
      if (prior !== undefined) {
        return refuse(
          "use_case_in_two_releases",
          `Use case '${ucCode}' is in both '${prior}' and '${release.code as string}'. Put each use case in exactly one release.`,
        );
      }
      releaseOf.set(ucCode, release.code as string);
    }
  }
  for (const ucCode of useCaseCodes) {
    if (!releaseOf.has(ucCode)) {
      return refuse(
        "use_case_unassigned",
        `Use case '${ucCode}' is not in any release. Add it to one release.`,
      );
    }
  }

  if (foundation !== undefined && foundation !== null) {
    if (!isRecord(foundation))
      return refuse(
        "invalid_structure",
        "The foundation must be an object or null.",
      );
    const owner = `The foundation '${String(foundation.code)}'`;
    const err =
      claim(foundation.code, "foundation") ??
      (isNonBlank(foundation.name)
        ? null
        : refuse("invalid_structure", `${owner} needs a name.`)) ??
      checkCounts(owner, foundation.counts) ??
      checkRangeInputs(owner, foundation);
    if (err) return err;
    if (foundation.sharedByReleaseCodes !== undefined) {
      if (
        !Array.isArray(foundation.sharedByReleaseCodes) ||
        foundation.sharedByReleaseCodes.length === 0
      ) {
        return refuse(
          "invalid_structure",
          `${owner} lists no releases in sharedByReleaseCodes. Omit it to share with every release.`,
        );
      }
      for (const code of foundation.sharedByReleaseCodes) {
        if (!releaseCodes.has(code)) {
          return refuse(
            "unknown_release",
            `${owner} is shared with release '${String(code)}', which is not in the structure.`,
          );
        }
      }
    }
  }

  // Unit hours: every driver anything counts must have caller-supplied unit hours.
  const blocks: { owner: string; counts: RomComponentCounts }[] = [
    ...(useCases as RomUseCase[]).map((uc) => ({
      owner: `use case '${uc.code}'`,
      counts: uc.counts,
    })),
    ...(isRecord(foundation)
      ? [
          {
            owner: `the foundation '${String(foundation.code)}'`,
            counts: foundation.counts as RomComponentCounts,
          },
        ]
      : []),
  ];
  for (const key of Object.keys(unitHours)) {
    if (!(ROM_DRIVERS as readonly string[]).includes(key)) {
      return refuse(
        "invalid_structure",
        `unitHours names an unknown driver '${key}'. Use one of: ${ROM_DRIVERS.join(", ")}.`,
      );
    }
  }
  for (const driver of ROM_DRIVERS) {
    const user = blocks.find((b) => (b.counts[driver] ?? 0) > 0);
    const uh = unitHours[driver];
    if (uh === undefined || uh === null) {
      if (user) {
        return refuse(
          "unit_hours_missing",
          `No unit hours were given for ${driver}, which ${user.owner} counts. There is no reference default; supply the unit hours with a source and a confidence.`,
        );
      }
      continue;
    }
    if (!isRecord(uh) || !isFiniteNumber(uh.value) || uh.value < 0) {
      return refuse(
        "invalid_unit_hours",
        `Unit hours for ${driver} must be a number of 0 or more.`,
      );
    }
    if (!isNonBlank(uh.source)) {
      return refuse(
        "invalid_unit_hours",
        `Unit hours for ${driver} need a source saying where the number came from.`,
      );
    }
    if (!ROM_CONFIDENCES.includes(uh.confidence as RomConfidence)) {
      return refuse(
        "invalid_unit_hours",
        `Unit hours for ${driver} need a confidence of low, medium or high.`,
      );
    }
  }

  const factorErr =
    checkFactor("Friction", input.friction, (v) => v > 0, "a number above 0") ??
    checkFactor(
      "Productive share",
      input.productiveShare,
      (v) => v > 0 && v <= 1,
      "a number above 0 and at most 1",
    ) ??
    checkFactor(
      "Hours per FTE-week",
      input.hoursPerFteWeek,
      (v) => v > 0,
      "a number above 0",
    );
  if (factorErr) return factorErr;

  if (!isRecord(pod))
    return refuse("invalid_pod", "The ROM structure needs a pod.");
  if (!isNonBlank(pod.locationCode)) {
    return refuse(
      "invalid_pod",
      "The pod needs a delivery location code from the cost foundation.",
    );
  }
  if (!POD_RATE_BASES.includes(pod.rateBasis as PodRateBasis)) {
    return refuse(
      "invalid_pod",
      `The pod needs a rate basis: ${POD_RATE_BASES.join(", ")}.`,
    );
  }
  const hasTemplate = pod.templateCode !== undefined;
  const hasMembers = pod.members !== undefined;
  if (hasTemplate === hasMembers) {
    return refuse(
      "invalid_pod",
      "The pod needs exactly one of a pod template code or a list of members.",
    );
  }
  if (hasTemplate && !isNonBlank(pod.templateCode)) {
    return refuse("invalid_pod", "The pod template code must not be blank.");
  }
  if (hasMembers) {
    if (!Array.isArray(pod.members) || pod.members.length === 0) {
      return refuse(
        "invalid_pod",
        "The pod's member list is empty. List at least one role, level and FTE.",
      );
    }
    for (const m of pod.members) {
      if (
        !isRecord(m) ||
        !isNonBlank(m.roleCode) ||
        !isNonBlank(m.levelCode) ||
        !isFiniteNumber(m.fte) ||
        m.fte < 0
      ) {
        return refuse(
          "invalid_pod",
          "Every pod member needs a role code, a level code and an FTE of 0 or more.",
        );
      }
    }
  }
  return { ok: true, structure: input as unknown as RomStructure };
}

// ---------------------------------------------------------------------------
// Computation
// ---------------------------------------------------------------------------

function hoursBlock(
  kind: RomBlockKind,
  code: string,
  name: string,
  releaseCode: string | null,
  counts: RomComponentCounts,
  structure: RomStructure,
): RomHoursBlock {
  const friction = structure.friction.value;
  const lines: RomHoursLine[] = [];
  for (const driver of ROM_DRIVERS) {
    const count = counts[driver] ?? 0;
    if (count === 0) continue;
    const unitHours = structure.unitHours[driver] as RomUnitHours;
    const hours = roundHours(count * unitHours.value * friction);
    const formulaTerms = closeHoursTerms(
      [
        {
          label: `${ROM_DRIVER_LABELS[driver]} (count)`,
          value: count,
          source: `rom:${code}:${driver}`,
          cellRole: "count",
        },
        {
          label: `${ROM_DRIVER_LABELS[driver]} unit hours`,
          value: unitHours.value,
          source: unitHours.source,
          cellRole: "unit_hours",
        },
        {
          label: "friction",
          value: friction,
          source: structure.friction.source,
          cellRole: "factor",
        },
      ],
      hours,
      `${ROM_DRIVER_LABELS[driver]} hours`,
    );
    lines.push({
      blockKind: kind,
      blockCode: code,
      driver,
      count,
      unitHours,
      friction,
      hours,
      formulaTerms,
    });
  }
  return {
    kind,
    code,
    name,
    releaseCode,
    lines,
    hours: roundHours(lines.reduce((acc, l) => acc + l.hours, 0)),
  };
}

function rangeFor(
  block: { designStatus: RomDesignStatus; rangeInputs?: RangePolicyInputs },
  planCents: Cents,
  loaders: RomReferenceLoaders,
): RomRange {
  if (block.designStatus === "not_designed") {
    const r = applyNamedRangePolicy(planCents, ROM_NOT_DESIGNED_RANGE);
    return {
      basis: "named",
      policyCode: r.policyCode,
      score: null,
      lowMultiplier: r.lowMultiplier,
      highMultiplier: r.highMultiplier,
      lowCents: r.lowCents,
      planCents,
      highCents: r.highCents,
    };
  }
  const score = computeRangeScore(block.rangeInputs as RangePolicyInputs);
  const r = applyRangePolicy(score, planCents, loaders.loadRangePolicies());
  return {
    basis: "score",
    policyCode: r.policyCode,
    score,
    lowMultiplier: r.lowMultiplier,
    highMultiplier: r.highMultiplier,
    lowCents: r.lowCents,
    planCents,
    highCents: r.highCents,
  };
}

/** Read a member's role-mapping provenance structurally, so a later pod-template provenance field is honoured without a type dependency. */
export function romMemberMappingStatus(
  member: PodMember,
): RomMemberMappingStatus {
  const provenance = (
    member as unknown as { provenance?: { roleMapping?: unknown } }
  ).provenance;
  return provenance?.roleMapping === "proposed_unapproved"
    ? "proposed_unapproved"
    : "confirmed";
}

function resolvePod(
  structure: RomStructure,
  loaders: RomReferenceLoaders,
): RomPodSummary | RomRefusal {
  const spec = structure.pod;
  const providerClassCode = spec.providerClassCode ?? null;
  if (spec.templateCode !== undefined) {
    const result = podMembersFromTemplate(spec.templateCode, {
      library: loaders.loadPodLibrary(),
      locationCode: spec.locationCode,
      providerClassCode,
    });
    if (!result.ok) {
      return refuse(
        "pod_template_refused",
        `Pod template '${spec.templateCode}' cannot be priced: ${result.message}.`,
      );
    }
    return {
      podCode: result.podCode,
      source: result.source,
      locationCode: spec.locationCode,
      providerClassCode,
      rateBasis: spec.rateBasis,
      members: result.members,
      memberMappingStatus: result.members.map(romMemberMappingStatus),
    };
  }
  const explicit = spec.members as readonly RomExplicitMember[];
  return {
    podCode: "ROM-EXPLICIT-POD",
    source: "ROM structure (caller-specified members)",
    locationCode: spec.locationCode,
    providerClassCode,
    rateBasis: spec.rateBasis,
    members: explicit.map((m) => ({
      roleCode: m.roleCode,
      levelCode: m.levelCode,
      locationCode: spec.locationCode,
      providerClassCode,
      fte: m.fte,
    })),
    memberMappingStatus: explicit.map((m) =>
      m.proposedMapping === true ? "proposed_unapproved" : "caller_specified",
    ),
  };
}

function priceBlock(
  kind: "release" | "foundation",
  code: string,
  name: string,
  block: { designStatus: RomDesignStatus; rangeInputs?: RangePolicyInputs },
  hours: number,
  pod: RomPodSummary,
  structure: RomStructure,
  loaders: RomReferenceLoaders,
  rateResolver: ReturnType<typeof createReferencePodRateResolver>,
): RomPricedBlock | RomRefusal {
  const priced = pricePod({
    adjustedHours: hours,
    pod: { podCode: pod.podCode, members: pod.members },
    hoursPerFteWeek: structure.hoursPerFteWeek.value,
    productiveShare: structure.productiveShare.value,
    rateResolver,
  });
  if (!priced.ok) {
    return refuse(
      "pod_pricing_refused",
      `The ${kind} '${code}' could not be priced with the pod: ${priced.message}.`,
    );
  }
  let range: RomRange;
  try {
    range = rangeFor(block, priced.totalCostCents, loaders);
  } catch (err) {
    if (err instanceof NoMatchingRangePolicyError) {
      return refuse(
        "no_matching_range_policy",
        `The ${kind} '${code}' has a range score no range policy covers: ${err.message}.`,
      );
    }
    throw err;
  }
  return {
    kind,
    code,
    name,
    designStatus: block.designStatus,
    hours,
    weeks: priced.weeks,
    pod: priced,
    range,
  };
}

/** A pod's member cost lines as engine line items, so `rollUpPortfolio` can dedup the shared foundation by its ref. */
function rollupLines(
  block: RomPricedBlock,
  sharedCostRef: string | null,
): EffortLineItem[] {
  return block.pod.memberLines.map((line, i) => ({
    archetypeCode: "rom",
    activityPackCode: `${block.kind}:${block.code}`,
    activityPackName: block.name,
    category: "technical",
    ruleCode: `member-${i + 1}`,
    operation: "per_unit_hours",
    driverCode: null,
    driverQuantity: null,
    modelVersion: 0,
    scenarioKey: "custom",
    classification: sharedCostRef ? "shared_program" : "initiative_specific",
    sharedCostRef,
    roleCode: line.member.roleCode,
    allocationPct: null,
    moduleHours: null,
    roleHours: line.paidHours,
    rate: null,
    laborCostCents: line.costCents,
    manualCostCents: null,
    gapReason: null,
    overrideRationale: null,
    formulaTrace: block.pod.formulaTrace,
    formulaTerms: line.formulaTerms,
  }));
}

export function foundationSharedCostRef(code: string): string {
  return `rom-foundation:${code}`;
}

/**
 * Price a ROM structure. `input` is validated first (it may come straight
 * from a request body); the first problem found is returned as a refusal.
 */
export function computeRom(
  input: unknown,
  loaders: RomReferenceLoaders,
): RomResult | RomRefusal {
  const validated = validateRomStructure(input);
  if (!validated.ok) return validated;
  const structure = validated.structure;

  const pod = resolvePod(structure, loaders);
  if ("ok" in pod) return pod;
  const rateResolver = createReferencePodRateResolver({
    ...loaders.loadRateReference(),
    basis: structure.pod.rateBasis,
  });

  const useCaseByCode = new Map(
    structure.useCases.map((uc) => [uc.code, uc] as const),
  );
  const releases: RomReleaseResult[] = [];
  const foundationSpec = structure.foundation ?? null;
  const sharedBy = foundationSpec
    ? new Set(
        foundationSpec.sharedByReleaseCodes ??
          structure.releases.map((r) => r.code),
      )
    : new Set<string>();

  let foundation: RomResult["foundation"] = null;
  if (foundationSpec) {
    const hours = hoursBlock(
      "foundation",
      foundationSpec.code,
      foundationSpec.name,
      null,
      foundationSpec.counts,
      structure,
    );
    const priced = priceBlock(
      "foundation",
      foundationSpec.code,
      foundationSpec.name,
      foundationSpec,
      hours.hours,
      pod,
      structure,
      loaders,
      rateResolver,
    );
    if ("ok" in priced) return priced;
    foundation = {
      hours,
      priced,
      sharedByReleaseCodes: structure.releases
        .map((r) => r.code)
        .filter((c) => sharedBy.has(c)),
    };
  }

  for (const release of structure.releases) {
    const useCases = release.useCaseCodes.map((ucCode) => {
      const uc = useCaseByCode.get(ucCode) as RomUseCase;
      return hoursBlock(
        "use_case",
        uc.code,
        uc.name,
        release.code,
        uc.counts,
        structure,
      );
    });
    const hours = roundHours(useCases.reduce((acc, b) => acc + b.hours, 0));
    const own = priceBlock(
      "release",
      release.code,
      release.name,
      release,
      hours,
      pod,
      structure,
      loaders,
      rateResolver,
    );
    if ("ok" in own) return own;
    const sharesFoundation = foundation !== null && sharedBy.has(release.code);
    const add = (
      ownCents: Cents,
      key: "lowCents" | "planCents" | "highCents",
    ) =>
      sharesFoundation && foundation
        ? sumCents(ownCents, foundation.priced.range[key])
        : ownCents;
    releases.push({
      code: release.code,
      name: release.name,
      designStatus: release.designStatus,
      useCases,
      own,
      sharesFoundation,
      standalone: {
        lowCents: add(own.range.lowCents, "lowCents"),
        planCents: add(own.range.planCents, "planCents"),
        highCents: add(own.range.highCents, "highCents"),
      },
    });
  }

  // Each release is one "Move" to the portfolio roll-up: its own lines are
  // initiative-specific; the foundation's lines ride along as one shared block.
  const outputs: EffortEngineOutput[] = releases.map((r) => {
    const lineItems = [
      ...rollupLines(r.own, null),
      ...(r.sharesFoundation && foundation
        ? rollupLines(
            foundation.priced,
            foundationSharedCostRef(foundation.priced.code),
          )
        : []),
    ];
    return {
      archetypeCode: "rom",
      modelVersion: 0,
      scenarioKey: "custom",
      tenantKey: "rom-preview",
      pricingBasis: "pod",
      lineItems,
      totals: {
        totalRawHours: 0,
        totalExpectedHours: 0,
        totalLaborCostCents: sumCents(
          ...lineItems.map((l) => l.laborCostCents ?? 0),
        ),
        totalManualCostCents: 0,
        totalCostCents: sumCents(
          ...lineItems.map((l) => l.laborCostCents ?? 0),
        ),
        gapCount: 0,
      },
    };
  });
  const rollup = rollUpPortfolio(outputs);

  const ownSum = (key: "lowCents" | "planCents" | "highCents") =>
    sumCents(
      ...releases.map((r) => r.own.range[key]),
      foundation ? foundation.priced.range[key] : 0,
    );
  const planCents = ownSum("planCents");
  if (rollup.totalCostCents !== planCents) {
    // A defect in this module, never a data condition: the roll-up and the
    // per-block sum describe the same lines.
    throw new Error(
      `rom_rollup_mismatch: portfolio roll-up ${rollup.totalCostCents} cents, releases + foundation ${planCents} cents`,
    );
  }

  return {
    ok: true,
    structure,
    pod,
    releases,
    foundation,
    total: {
      hours: roundHours(
        releases.reduce((acc, r) => acc + r.own.hours, 0) +
          (foundation ? foundation.priced.hours : 0),
      ),
      weeks:
        releases.reduce((acc, r) => acc + r.own.weeks, 0) +
        (foundation ? foundation.priced.weeks : 0),
      lowCents: ownSum("lowCents"),
      planCents: rollup.totalCostCents,
      highCents: ownSum("highCents"),
      naiveSumCents: rollup.naiveSumCents,
      rollup,
    },
    productivityCreditApplied: false,
  };
}

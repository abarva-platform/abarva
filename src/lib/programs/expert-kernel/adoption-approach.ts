// Expert Kernel — adoption & change approach.
//
// Mobilize must take a position on the business-change work — but Moves does
// NOT design the operating model (spec §4). This module is the honest middle:
// a structured *approach* at decision-brief depth, not a designed change
// programme. It ESTIMATES and RECOMMENDS across the seven change dimensions
// the spec names (§5.3): impacted roles, process variance, training load,
// incentive change, manager adoption, communications, hypercare.
//
// The output feeds two things: the value-forecast adoption assumption (an
// adoption ramp is only credible if the change approach supports it) and the
// go-decision pack.
//
// Pure module: deterministic, no I/O.

import type { Confidence } from './types';

/** The seven change dimensions a decision-brief change approach must cover. */
export type ChangeDimension =
  | 'impacted_roles'
  | 'process_variance'
  | 'training_load'
  | 'incentive_change'
  | 'manager_adoption'
  | 'communications'
  | 'hypercare';

export const CHANGE_DIMENSION_LABELS: Record<ChangeDimension, string> = {
  impacted_roles: 'Impacted roles',
  process_variance: 'Process variance',
  training_load: 'Training load',
  incentive_change: 'Incentive change',
  manager_adoption: 'Manager adoption',
  communications: 'Communications',
  hypercare: 'Hypercare',
};

/** How big the change is for a given dimension. */
export type ChangeMagnitude = 'low' | 'moderate' | 'high';

/** A role whose way of working changes when the Move lands. */
export interface ImpactedRole {
  /** Role label, e.g. 'Customer Care agent'. */
  role: string;
  /** Approximate headcount affected, or null when not recorded. */
  headcount: number | null;
  /** How large the behaviour change is for this role. */
  changeMagnitude: ChangeMagnitude;
  /** What concretely changes for this role. */
  whatChanges: string;
  /** True when the headcount rests on a benchmark proxy, not tenant data. */
  headcountIsProxy?: boolean;
}

/** The structured assessment of one change dimension. */
export interface ChangeDimensionAssessment {
  dimension: ChangeDimension;
  magnitude: ChangeMagnitude;
  /** The expert recommendation for this dimension — an approach, not a design. */
  recommendation: string;
  /** Named owner role accountable for this dimension of the change. */
  ownerRole: string;
  confidence: Confidence;
  /** True when the assessment rests on a seed gap / benchmark proxy. */
  restsOnSeedGap?: boolean;
}

export interface AdoptionApproachInput {
  moveName: string;
  /** Roles whose work changes. */
  impactedRoles: ImpactedRole[];
  /** The seven-dimension assessment. Each dimension must appear exactly once. */
  dimensions: ChangeDimensionAssessment[];
  /**
   * The operating-model owner who has accepted accountability post-go-live,
   * or null when nobody has — which fires the Mobilize kill trigger.
   */
  operatingModelOwner: string | null;
  /** Hypercare window length in weeks. 0 means none is planned. */
  hypercareWeeks: number;
}

/** A risk the change approach surfaces for the go-decision pack. */
export interface AdoptionRisk {
  code: string;
  severity: 'blocker' | 'concern' | 'note';
  message: string;
}

export interface AdoptionApproach {
  moveName: string;
  impactedRoles: ImpactedRole[];
  dimensions: ChangeDimensionAssessment[];
  operatingModelOwner: string | null;
  hypercareWeeks: number;
  /** Total approximate headcount across recorded impacted roles. */
  totalImpactedHeadcount: number | null;
  /**
   * The overall change load — the worst magnitude across dimensions. A coarse
   * signal the value forecast can read to sanity-check the adoption curve.
   */
  overallChangeLoad: ChangeMagnitude;
  /**
   * An adoption-confidence score (0..1). 1 = the change approach fully
   * supports an aggressive adoption ramp; low = the ramp is unsupported.
   * Computed deterministically from magnitudes, owner presence, hypercare.
   */
  adoptionConfidence: number;
  /** Risks surfaced for the go-decision pack — never hidden. */
  risks: AdoptionRisk[];
  /**
   * True when no operating-model owner is named. The go-pack reads this to
   * fire the `no_operating_model_owner` kill trigger.
   */
  ownerGap: boolean;
}

const ALL_DIMENSIONS: ChangeDimension[] = [
  'impacted_roles',
  'process_variance',
  'training_load',
  'incentive_change',
  'manager_adoption',
  'communications',
  'hypercare',
];

const MAGNITUDE_RANK: Record<ChangeMagnitude, number> = {
  low: 1,
  moderate: 2,
  high: 3,
};

/**
 * Build a structured adoption & change approach. Deterministic. Throws when a
 * change dimension is missing or duplicated — the approach must be complete.
 */
export function buildAdoptionApproach(
  input: AdoptionApproachInput,
): AdoptionApproach {
  // Every dimension must be assessed exactly once.
  const seen = new Set<ChangeDimension>();
  for (const d of input.dimensions) {
    if (seen.has(d.dimension)) {
      throw new Error(`Duplicate change dimension: ${d.dimension}`);
    }
    seen.add(d.dimension);
    if (!d.ownerRole.trim()) {
      throw new Error(`Change dimension '${d.dimension}' has no owner role.`);
    }
  }
  for (const d of ALL_DIMENSIONS) {
    if (!seen.has(d)) {
      throw new Error(
        `Change dimension '${d}' is not assessed — the adoption approach ` +
          'must cover all seven dimensions at decision-brief depth.',
      );
    }
  }
  if (input.hypercareWeeks < 0) {
    throw new Error('hypercareWeeks cannot be negative.');
  }

  const recordedHeadcounts = input.impactedRoles
    .map((r) => r.headcount)
    .filter((h): h is number => h !== null);
  const totalImpactedHeadcount =
    recordedHeadcounts.length === 0
      ? null
      : recordedHeadcounts.reduce((s, h) => s + h, 0);

  // Overall change load = the worst dimension magnitude.
  const overallChangeLoad: ChangeMagnitude = input.dimensions.reduce(
    (worst, d) =>
      MAGNITUDE_RANK[d.magnitude] > MAGNITUDE_RANK[worst] ? d.magnitude : worst,
    'low' as ChangeMagnitude,
  );

  // Adoption confidence — deterministic. Start at 1.0, subtract for change
  // load, for a missing owner, for absent hypercare, and for a weak manager
  // adoption assessment (the layer adoption fails at most often).
  let adoptionConfidence = 1;
  const loadPenalty: Record<ChangeMagnitude, number> = {
    low: 0,
    moderate: 0.15,
    high: 0.3,
  };
  adoptionConfidence -= loadPenalty[overallChangeLoad];
  if (input.operatingModelOwner === null) adoptionConfidence -= 0.25;
  if (input.hypercareWeeks === 0) adoptionConfidence -= 0.15;
  const managerDim = input.dimensions.find(
    (d) => d.dimension === 'manager_adoption',
  );
  if (managerDim && managerDim.magnitude === 'high') {
    adoptionConfidence -= 0.1;
  }
  if (managerDim && managerDim.confidence === 'low') {
    adoptionConfidence -= 0.1;
  }
  adoptionConfidence = Math.max(
    0,
    Math.round(adoptionConfidence * 100) / 100,
  );

  // Risks — surfaced for the go-decision pack.
  const risks: AdoptionRisk[] = [];
  const ownerGap = input.operatingModelOwner === null;
  if (ownerGap) {
    risks.push({
      code: 'adoption_no_operating_model_owner',
      severity: 'blocker',
      message:
        'No operating-model owner has accepted accountability for running ' +
        'the Move after go-live. Moves does not design the operating model, ' +
        'but it cannot hand off a Move nobody owns. This fires the ' +
        'no_operating_model_owner kill trigger.',
    });
  }
  if (input.hypercareWeeks === 0) {
    risks.push({
      code: 'adoption_no_hypercare',
      severity: 'concern',
      message:
        'No hypercare window is planned. The weeks after go-live are when ' +
        'adoption is won or lost; dropping support there routinely loses ' +
        'the adoption curve the value forecast assumes.',
    });
  }
  if (managerDim && managerDim.magnitude === 'high') {
    risks.push({
      code: 'adoption_manager_layer_heavy',
      severity: 'concern',
      message:
        'Manager adoption is a high-magnitude change. Adoption fails at the ' +
        'manager layer more than anywhere else — manager reinforcement must ' +
        'be explicitly resourced, not assumed.',
    });
  }
  for (const r of input.impactedRoles) {
    if (r.headcount === null) {
      risks.push({
        code: `adoption_headcount_gap_${r.role
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')}`,
        severity: 'note',
        message:
          `Impacted headcount for '${r.role}' is not recorded — training ` +
          'load and communications scale cannot be sized precisely.',
      });
    }
  }
  for (const d of input.dimensions) {
    if (d.restsOnSeedGap) {
      risks.push({
        code: `adoption_seed_gap_${d.dimension}`,
        severity: 'note',
        message:
          `The '${CHANGE_DIMENSION_LABELS[d.dimension]}' assessment rests ` +
          'on a benchmark proxy / seed gap, not tenant data — validate it ' +
          'before the gate.',
      });
    }
  }

  return {
    moveName: input.moveName,
    impactedRoles: input.impactedRoles,
    dimensions: input.dimensions,
    operatingModelOwner: input.operatingModelOwner,
    hypercareWeeks: input.hypercareWeeks,
    totalImpactedHeadcount,
    overallChangeLoad,
    adoptionConfidence,
    risks,
    ownerGap,
  };
}

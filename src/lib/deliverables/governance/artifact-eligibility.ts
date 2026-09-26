/**
 * Artifact eligibility, resolved from governed Move state.
 *
 * The defect this inverts: a P3 target-state architecture was requested over a
 * Move whose governed state said initiative_status `context_only`,
 * value_claim_status `baseline_only`, `baseline_required_before_value_claim`, no
 * baseline loaded, and four open discovery gaps. Nothing refused it. The
 * pipeline produced a competent P3 for a decision nobody could take, and a human
 * had to notice.
 *
 * So the request never leads. The resolver reads governed state only, and cannot
 * be argued with because it never sees the ask.
 */

import type { ClaimConstraint } from './claim-constraints';

export interface MoveGovernedState {
  moveId: string;
  initiativeStatus: string;
  valueClaimStatus: string;
  metricBoundary?: string;
  baselineLoaded: boolean;
  openDiscoveryGaps: string[];
  towerClaimAllowed?: 'yes' | 'no' | 'partial';
}

export type EligibilityState = 'allowed' | 'blocked';

export interface EligibilityReason {
  field: string;
  value: string;
  requirement: string;
  /** What would clear it, in the operator's words rather than the schema's. */
  unblockedBy: string;
}

export interface ArtifactEligibility {
  artifactKey: string;
  state: EligibilityState;
  reasons: EligibilityReason[];
  /** One line for a client surface. No governed vocabulary, no field names. */
  surfaceLabel: string;
}

/** What an artifact type demands of Move state before it may be produced. */
export interface ArtifactPrecondition {
  artifactKey: string;
  requiresBaseline?: boolean;
  /** Initiative statuses that are sufficient; any other blocks. */
  allowedInitiativeStatuses?: string[];
  /** Value-claim statuses that are sufficient; any other blocks. */
  allowedValueClaimStatuses?: string[];
  maxOpenDiscoveryGaps?: number;
  /** Claim subjects that must not be prohibited for this artifact to make sense. */
  requiresClaimSubjects?: string[];
}

export const P3_PRECONDITIONS: ArtifactPrecondition[] = [
  {
    artifactKey: 'target_state_architecture',
    requiresBaseline: true,
    allowedInitiativeStatuses: ['approved', 'active_funded', 'in_delivery'],
    allowedValueClaimStatuses: ['measured_partial', 'measured', 'claimable'],
    maxOpenDiscoveryGaps: 0,
    requiresClaimSubjects: ['target_state'],
  },
  {
    artifactKey: 'solution_approach_options',
    requiresBaseline: true,
    allowedInitiativeStatuses: ['approved', 'active_funded', 'in_delivery'],
    maxOpenDiscoveryGaps: 0,
  },
  {
    artifactKey: 'solution_design',
    requiresBaseline: true,
    allowedInitiativeStatuses: ['approved', 'active_funded', 'in_delivery'],
    maxOpenDiscoveryGaps: 0,
    requiresClaimSubjects: ['target_state'],
  },
];

export const P2_PRECONDITIONS: ArtifactPrecondition[] = [
  // A discovery assessment exists precisely to establish what is not yet known,
  // so it demands nothing of the state it is assessing.
  { artifactKey: 'discovery_report' },
  { artifactKey: 'root_cause_worksheet' },
];

export function resolveArtifactEligibility(
  state: MoveGovernedState,
  preconditions: ArtifactPrecondition[],
  constraints: ClaimConstraint[] = [],
): ArtifactEligibility[] {
  return preconditions.map((pre) => {
    const reasons: EligibilityReason[] = [];

    if (pre.requiresBaseline && !state.baselineLoaded) {
      reasons.push({
        field: 'baselineLoaded',
        value: 'false',
        requirement: 'a measurement baseline must be loaded',
        unblockedBy: 'load the baseline this decision is measured against',
      });
    }
    if (pre.allowedInitiativeStatuses && !pre.allowedInitiativeStatuses.includes(state.initiativeStatus)) {
      reasons.push({
        field: 'initiativeStatus',
        value: state.initiativeStatus,
        requirement: `one of ${pre.allowedInitiativeStatuses.join(', ')}`,
        unblockedBy: 'the initiative is approved and funded',
      });
    }
    if (pre.allowedValueClaimStatuses && !pre.allowedValueClaimStatuses.includes(state.valueClaimStatus)) {
      reasons.push({
        field: 'valueClaimStatus',
        value: state.valueClaimStatus,
        requirement: `one of ${pre.allowedValueClaimStatuses.join(', ')}`,
        unblockedBy: 'a value claim becomes supportable',
      });
    }
    if (pre.maxOpenDiscoveryGaps !== undefined && state.openDiscoveryGaps.length > pre.maxOpenDiscoveryGaps) {
      reasons.push({
        field: 'openDiscoveryGaps',
        value: String(state.openDiscoveryGaps.length),
        requirement: `at most ${pre.maxOpenDiscoveryGaps}`,
        unblockedBy: `${state.openDiscoveryGaps.length} Discovery condition${state.openDiscoveryGaps.length === 1 ? '' : 's'} close`,
      });
    }
    for (const subject of pre.requiresClaimSubjects ?? []) {
      const constraint = constraints.find((k) => k.subject === subject);
      if (constraint && constraint.state === 'prohibited') {
        reasons.push({
          field: `claimConstraint:${subject}`,
          value: 'prohibited',
          requirement: 'the claim this artifact makes must not be prohibited',
          unblockedBy: constraint.reason,
        });
      }
    }

    const blocked = reasons.length > 0;
    // The client surface says what is missing and how much of it. It never
    // explains the resolver and never leaks a governed field name.
    const gapCount = state.openDiscoveryGaps.length;
    return {
      artifactKey: pre.artifactKey,
      state: blocked ? 'blocked' : 'allowed',
      reasons,
      surfaceLabel: blocked
        ? gapCount > 0
          ? `Not ready — ${gapCount} Discovery condition${gapCount === 1 ? '' : 's'} remain.`
          : 'Not ready — prerequisites outstanding.'
        : 'Ready',
    };
  });
}

/** The allowed set, for a caller that must not see the blocked ones at all. */
export function allowedArtifactKeys(eligibility: ArtifactEligibility[]): string[] {
  return eligibility.filter((e) => e.state === 'allowed').map((e) => e.artifactKey);
}

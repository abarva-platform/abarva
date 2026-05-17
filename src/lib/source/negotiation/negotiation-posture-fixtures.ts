// Slice 1.5 — Fixtures for the negotiation posture generator tests.
//
// Tenant-grounded example: Apex Retail — AMS Vendor Consolidation 2026. The
// proposal matrix reuses the Slice 1.4 fixture so the should-cost estimate and
// the normalized matrix describe the same deal. The should-cost input below is
// shaped so the modelled total carries a meaningful hidden-iceberg tail.

import { buildProposalNormalizationMatrix } from '../proposal-normalization/proposal-normalization';
import { APEX_AMS_PROPOSAL_FIXTURE } from '../proposal-normalization/proposal-normalization-fixtures';
import { buildShouldCostEstimate } from '../should-cost/should-cost-model';
import type { ShouldCostModelInput } from '../should-cost/should-cost-model';
import type { NegotiationPostureInput } from './negotiation-posture-types';

/** Should-cost input for the Apex AMS deal — a 24-month managed-ops engagement. */
export const APEX_AMS_SHOULD_COST_INPUT: ShouldCostModelInput = {
  estimateLabel: 'Apex Retail — AMS Vendor Consolidation 2026',
  vendorQuotedCost: 2_400_000,
  vendorMarginRatio: 0.28,
  durationMonths: 24,
  offshoreRatio: 0.6,
  transitionCost: 180_000,
  roleMix: [
    { role: 'engagement_lead', headcount: 1, offshoreRatio: 0 },
    { role: 'solution_architect', headcount: 2 },
    { role: 'senior_engineer', headcount: 4 },
    { role: 'engineer', headcount: 8 },
    { role: 'analyst', headcount: 3 },
    { role: 'project_manager', headcount: 1, offshoreRatio: 0.2 },
  ],
  rateCard: [
    { role: 'engagement_lead', onshoreAnnualRate: 320_000, offshoreAnnualRate: 150_000 },
    { role: 'solution_architect', onshoreAnnualRate: 280_000, offshoreAnnualRate: 130_000 },
    { role: 'senior_engineer', onshoreAnnualRate: 220_000, offshoreAnnualRate: 95_000 },
    { role: 'engineer', onshoreAnnualRate: 170_000, offshoreAnnualRate: 70_000 },
    { role: 'analyst', onshoreAnnualRate: 130_000, offshoreAnnualRate: 55_000 },
    { role: 'project_manager', onshoreAnnualRate: 190_000, offshoreAnnualRate: 85_000 },
  ],
  consumption: {
    monthlyCloudCost: 18_000,
    monthlyModelCost: 26_000,
    highScalingMultiplier: 1.8,
  },
};

/** The should-cost estimate the negotiation posture reasons over. */
export const APEX_AMS_SHOULD_COST_ESTIMATE = buildShouldCostEstimate(
  APEX_AMS_SHOULD_COST_INPUT,
);

/** The proposal-normalization matrix the negotiation posture reasons over. */
export const APEX_AMS_PROPOSAL_MATRIX = buildProposalNormalizationMatrix(
  APEX_AMS_PROPOSAL_FIXTURE,
);

/**
 * The headline fixture — Apex re-competing its AMS estate with the incumbent
 * (BlueMaster) in the field, a credible alternative (Summit) deal-ready, and a
 * preferred award to Summit. Exercises every branch with strong leverage.
 */
export const APEX_AMS_NEGOTIATION_INPUT: NegotiationPostureInput = {
  dealLabel: 'Apex Retail — AMS Vendor Consolidation 2026',
  shouldCost: APEX_AMS_SHOULD_COST_ESTIMATE,
  proposalMatrix: APEX_AMS_PROPOSAL_MATRIX,
  generatedAt: '2026-05-16T00:00:00.000Z',
  context: {
    preferredVendorId: 'vendor-summit',
    incumbentVendorId: 'vendor-bluemaster',
    hasCredibleAlternative: true,
    budgetCeilingUsd: 24_000_000,
    decisionWindowMonths: 5,
    multiYearCommitmentPossible: true,
    referenceValueHigh: true,
  },
};

/**
 * A weak-position variant — incumbent re-compete with no credible alternative,
 * preferred award to the incumbent, a tight decision window, and a budget
 * ceiling the modelled should-cost breaches. Exercises the walk-away and
 * vendor-leverage branches.
 */
export const APEX_AMS_WEAK_POSITION_INPUT: NegotiationPostureInput = {
  dealLabel: 'Apex Retail — AMS Renewal (sole-source pressure)',
  shouldCost: APEX_AMS_SHOULD_COST_ESTIMATE,
  proposalMatrix: APEX_AMS_PROPOSAL_MATRIX,
  generatedAt: '2026-05-16T00:00:00.000Z',
  context: {
    preferredVendorId: 'vendor-bluemaster',
    incumbentVendorId: 'vendor-bluemaster',
    hasCredibleAlternative: false,
    budgetCeilingUsd: 3_000_000,
    decisionWindowMonths: 1,
  },
};

/**
 * A bare-context variant — no commercial framing supplied at all. Confirms the
 * generator degrades gracefully and still produces grounded advice from the
 * two artifacts alone.
 */
export const APEX_AMS_NO_CONTEXT_INPUT: NegotiationPostureInput = {
  dealLabel: 'Apex Retail — AMS (artifacts only)',
  shouldCost: APEX_AMS_SHOULD_COST_ESTIMATE,
  proposalMatrix: APEX_AMS_PROPOSAL_MATRIX,
  generatedAt: '2026-05-16T00:00:00.000Z',
};

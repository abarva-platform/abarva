// Moves Expert Kernel — scenario regeneration sign-off.
//
// A regeneration preview should not promote itself. This module builds a
// deterministic reviewer sign-off packet over the preview so the case can move
// to the next safe state: ready for full recompute, or blocked.

import type { BusinessCaseSkeleton } from './business-case-compiler';
import {
  calibrateBusinessCaseWithExpertReviews,
  type ExpertCalibrationResult,
  type ExpertReviewInput,
  type ExpertReviewerRole,
} from './expert-review-calibration';
import type { ScenarioRegenerationPreview } from './scenario-regeneration-preview';

export interface RegenerationSignoffReview extends ExpertReviewInput {
  approvedChangeKeys: string[];
}

export interface ScenarioRegenerationSignoff {
  verdict: 'ready_for_full_recompute' | 'blocked';
  reviewCount: number;
  rolesCovered: ExpertReviewerRole[];
  approvedChangeKeys: string[];
  unapprovedChangeKeys: string[];
  requiredActions: string[];
  calibration: ExpertCalibrationResult;
  reviews: RegenerationSignoffReview[];
  auditSummary: string;
}

export function buildDefaultRegenerationSignoff(
  skeleton: BusinessCaseSkeleton,
  preview: ScenarioRegenerationPreview,
): ScenarioRegenerationSignoff {
  const financialChangeKeys = preview.appliedChanges
    .filter((change) =>
      change.affectedArtifacts.some((artifact) =>
        ['business_case_pack', 'financial_model', 'cfo_pack'].includes(artifact),
      ),
    )
    .map((change) => change.updateKey);
  const mobilizeChangeKeys = preview.appliedChanges
    .filter((change) => change.affectedArtifacts.includes('mobilize_pack'))
    .map((change) => change.updateKey);

  const reviews: RegenerationSignoffReview[] = [
    {
      reviewerId: 'scenario-lab:cfo',
      role: 'cfo',
      verdict: 'credible_with_conditions',
      note:
        'Finance signs off that the accepted changes are material and must flow through the full estimator before promotion.',
      assumptionKeys: preview.challengedAssumptions,
      requiredActions: preview.fullRecomputeReasons,
      approvedChangeKeys: unique(financialChangeKeys),
    },
    {
      reviewerId: 'scenario-lab:delivery-lead',
      role: 'delivery_lead',
      verdict: 'credible_with_conditions',
      note:
        'Delivery signs off that workshop actions and challenged assumptions are suitable for regeneration, not final approval.',
      assumptionKeys: preview.challengedAssumptions,
      requiredActions: preview.mobilizeActions,
      approvedChangeKeys: unique([...mobilizeChangeKeys, ...preview.challengedAssumptions]),
    },
    {
      reviewerId: 'scenario-lab:domain-operator',
      role: 'domain_operator',
      verdict: 'credible_with_conditions',
      note:
        'Domain owner signs off the watched-session baseline updates as stated evidence requiring verification before the gate.',
      assumptionKeys: [],
      requiredActions: preview.baselineAfter.resolvedSeedGaps.map(
        (key) => `Verify updated baseline metric before promotion: ${key}.`,
      ),
      approvedChangeKeys: preview.baselineAfter.resolvedSeedGaps,
    },
  ];

  const calibration = calibrateBusinessCaseWithExpertReviews(skeleton, reviews);
  const approvedChangeKeys = unique(reviews.flatMap((review) => review.approvedChangeKeys)).sort();
  const appliedKeys = preview.appliedChanges.map((change) => change.updateKey);
  const unapprovedChangeKeys = appliedKeys
    .filter((key) => !approvedChangeKeys.includes(key))
    .sort();
  const blocked =
    calibration.verdict === 'not_ready' ||
    unapprovedChangeKeys.length > 0 ||
    preview.blockedChanges.length > preview.appliedChanges.length;

  return {
    verdict: blocked ? 'blocked' : 'ready_for_full_recompute',
    reviewCount: reviews.length,
    rolesCovered: calibration.rolesCovered,
    approvedChangeKeys,
    unapprovedChangeKeys,
    requiredActions: calibration.requiredActions,
    calibration,
    reviews,
    auditSummary:
      `${reviews.length} reviewer sign-off(s), ` +
      `${approvedChangeKeys.length} approved change key(s), ` +
      `${unapprovedChangeKeys.length} unapproved change key(s), ` +
      `verdict ${blocked ? 'blocked' : 'ready_for_full_recompute'}.`,
  };
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

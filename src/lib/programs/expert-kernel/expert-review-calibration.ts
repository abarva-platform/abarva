// Moves Expert Kernel — external expert review calibration.
//
// This module closes the "expert calibration" gap: the kernel can be internally
// coherent, but it is not accepted until finance, delivery, sourcing, or domain
// practitioners have reviewed the actual generated case. The function is pure
// and deterministic so the review gate can run in tests, CI, and the UI.

import type { BusinessCaseSkeleton } from './business-case-compiler';

export type ExpertReviewerRole =
  | 'cfo'
  | 'transformation_partner'
  | 'sourcing_vp'
  | 'delivery_lead'
  | 'domain_operator'
  | 'risk_compliance';

export type ExpertReviewVerdict = 'credible' | 'credible_with_conditions' | 'weak' | 'wrong';

export interface ExpertReviewInput {
  reviewerId: string;
  role: ExpertReviewerRole;
  verdict: ExpertReviewVerdict;
  /** What the reviewer challenged or blessed. */
  note: string;
  /** Stable assumption keys this review touches. */
  assumptionKeys?: string[];
  /** Required fixes before the business case can be promoted. */
  requiredActions?: string[];
}

export interface ExpertReviewFinding {
  code: string;
  severity: 'blocker' | 'condition' | 'note';
  message: string;
}

export interface ExpertCalibrationResult {
  reviewCount: number;
  rolesCovered: ExpertReviewerRole[];
  accepted: boolean;
  verdict: 'accepted' | 'conditional' | 'not_ready';
  findings: ExpertReviewFinding[];
  requiredActions: string[];
  reviewerNotes: ExpertReviewInput[];
}

const REQUIRED_ROLE_GROUPS: Array<ExpertReviewerRole[]> = [
  ['cfo'],
  ['transformation_partner', 'delivery_lead'],
];

function roleGroupCovered(
  roles: Set<ExpertReviewerRole>,
  group: ExpertReviewerRole[],
): boolean {
  return group.some((role) => roles.has(role));
}

export function calibrateBusinessCaseWithExpertReviews(
  skeleton: BusinessCaseSkeleton,
  reviews: ExpertReviewInput[],
): ExpertCalibrationResult {
  const roles = new Set(reviews.map((review) => review.role));
  const findings: ExpertReviewFinding[] = [];
  const requiredActions = new Set<string>();

  if (reviews.length < 2) {
    findings.push({
      code: 'review_minimum_not_met',
      severity: 'blocker',
      message: 'At least two expert reviews are required before promotion.',
    });
  }

  for (const group of REQUIRED_ROLE_GROUPS) {
    if (!roleGroupCovered(roles, group)) {
      findings.push({
        code: `missing_${group.join('_or_')}`,
        severity: 'blocker',
        message: `Missing required expert lens: ${group.join(' or ')}.`,
      });
    }
  }

  if (skeleton.recommendation === 'fund' && skeleton.critic.hasBlocker) {
    findings.push({
      code: 'critic_blocker_unresolved',
      severity: 'blocker',
      message: 'The case cannot be accepted while a critic blocker remains.',
    });
  }

  for (const review of reviews) {
    if (!review.note.trim()) {
      findings.push({
        code: `empty_review_note_${review.reviewerId}`,
        severity: 'condition',
        message: `${review.role} review must include a written rationale.`,
      });
    }
    if (review.verdict === 'wrong') {
      findings.push({
        code: `reviewer_rejected_${review.reviewerId}`,
        severity: 'blocker',
        message: `${review.role} marked the business case wrong.`,
      });
    } else if (review.verdict === 'weak') {
      findings.push({
        code: `reviewer_weak_${review.reviewerId}`,
        severity: 'condition',
        message: `${review.role} marked the business case weak.`,
      });
    } else if (review.verdict === 'credible_with_conditions') {
      findings.push({
        code: `reviewer_conditions_${review.reviewerId}`,
        severity: 'condition',
        message: `${review.role} accepted with conditions.`,
      });
    }

    for (const action of review.requiredActions ?? []) {
      if (action.trim()) requiredActions.add(action.trim());
    }
  }

  const hasBlocker = findings.some((finding) => finding.severity === 'blocker');
  const hasCondition =
    findings.some((finding) => finding.severity === 'condition') ||
    requiredActions.size > 0;
  const verdict = hasBlocker ? 'not_ready' : hasCondition ? 'conditional' : 'accepted';

  return {
    reviewCount: reviews.length,
    rolesCovered: [...roles].sort(),
    accepted: verdict !== 'not_ready',
    verdict,
    findings,
    requiredActions: [...requiredActions].sort(),
    reviewerNotes: reviews,
  };
}

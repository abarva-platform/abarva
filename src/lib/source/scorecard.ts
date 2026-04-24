import type {
  ScorecardApprovalState,
  ScorecardCriterion,
  ScorecardGovernance,
} from './types';

export function countRequiredCriteria(criteria: ScorecardCriterion[]): number {
  return criteria.filter((criterion) => criterion.required).length;
}

export function countApprovedCriteria(criteria: ScorecardCriterion[]): number {
  return criteria.filter((criterion) => criterion.status === 'approved').length;
}

export function summarizeApprovalState(scorecard: ScorecardGovernance): {
  label: string;
  approved: number;
  required: number;
} {
  const required = countRequiredCriteria(scorecard.criteria);
  const approved = countApprovedCriteria(scorecard.criteria);
  return {
    label: approvalStateLabel(scorecard.approvalState),
    approved,
    required,
  };
}

export function approvalStateLabel(state: ScorecardApprovalState): string {
  switch (state) {
    case 'approved':
      return 'Approved';
    case 'in_review':
      return 'In Review';
    default:
      return 'Not Started';
  }
}

import type { ExtractedContextFact } from './types';

export type ContextApprovalState = 'awaiting_approval' | 'approved' | 'rejected' | 'insufficient_evidence';

export interface ContextApprovalItem {
  approvalId: string;
  fact: ExtractedContextFact;
  state: ContextApprovalState;
  reviewerRole: string;
  reason?: string;
}

export function stageFactsForApproval(facts: ExtractedContextFact[]): ContextApprovalItem[] {
  return facts.map((fact) => ({
    approvalId: `approval:${fact.id}`,
    fact,
    state: 'awaiting_approval',
    reviewerRole: fact.approvalRole,
  }));
}

export function approveValidFacts(items: ContextApprovalItem[]): ContextApprovalItem[] {
  return items.map((item) => {
    const hasBlockingError = item.fact.validationFindings.some((finding) => finding.severity === 'error');
    return {
      ...item,
      state: hasBlockingError ? 'insufficient_evidence' : 'approved',
      reason: hasBlockingError ? 'Validation errors must be corrected before commit.' : undefined,
    };
  });
}

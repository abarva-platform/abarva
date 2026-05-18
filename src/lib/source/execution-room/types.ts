// Source Execution Room — typed view model.
//
// The Renewal Cockpit diagnoses the sourcing decision. The Execution Room is
// the operating surface that lets a sourcing VP run the decision to outcome.
// Pure types only: no DB, no network, no React.

import type { RenewalPosture } from '@/lib/source/renewal-cockpit/cockpit';
import type { RenewalNegotiationBrief } from '@/lib/source/renewal-cockpit/negotiation-brief';
import type { VendorEmailDraft } from '@/lib/source/renewal-cockpit/vendor-email-draft';

export type ExecutionStatus = 'on_track' | 'at_risk' | 'blocked';

export type ExecutionActionStatus =
  | 'not_started'
  | 'in_progress'
  | 'blocked'
  | 'complete'
  | 'pending_external';

export type ExecutionActionKind =
  | 'serve_notice'
  | 'assign_owner'
  | 'open_negotiation'
  | 'decide_rebid'
  | 'finance_approval'
  | 'legal_review'
  | 'security_review'
  | 'vendor_communication'
  | 'final_decision';

export type ExecutionApprovalRole =
  | 'finance'
  | 'legal'
  | 'security'
  | 'business_sponsor'
  | 'it_owner';

export interface ExecutionMilestone {
  milestoneId: string;
  title: string;
  dueDate: string | null;
  daysUntilDue: number | null;
  status: ExecutionActionStatus;
  whyItMatters: string;
  evidenceRefs: string[];
}

export interface ExecutionAction {
  actionId: string;
  kind: ExecutionActionKind;
  title: string;
  owner: string;
  dueDate: string | null;
  daysUntilDue: number | null;
  status: ExecutionActionStatus;
  evidenceBasis: string;
  linkedAction:
    | { type: 'route'; label: string; href: string }
    | { type: 'draft'; label: string; body: string }
    | { type: 'pending'; label: string; reason: string };
  evidenceRefs: string[];
}

export interface ExecutionApproval {
  role: ExecutionApprovalRole;
  label: string;
  owner: string;
  status: ExecutionActionStatus;
  decisionNeeded: string;
  dueDate: string | null;
}

export interface ExecutionEvidenceRef {
  label: string;
  claim: string;
  evidenceRefs: string[];
}

export interface ExecutionOutcomeTarget {
  targetId: string;
  title: string;
  targetValue: string;
  measurementDate: string | null;
  evidenceRefs: string[];
}

export interface ExecutionRebidReadiness {
  recommended: boolean;
  verdict: 'start_rebid' | 'market_test_first' | 'do_not_rebid_yet';
  rationale: string;
  blockers: string[];
  nextAction: string;
}

export interface ExecutionRoom {
  clientKey: string;
  contractId: string;
  vendorName: string;
  product: string;
  generatedAt: string;
  title: string;
  status: ExecutionStatus;
  statusLabel: string;
  statusRationale: string;
  recommendedPosture: RenewalPosture;
  postureLabel: string;
  nextBestAction: string;
  noticeDeadlineDate: string | null;
  daysToNoticeDeadline: number | null;
  termEndDate: string | null;
  currentAnnualSpendUsd: number | null;
  accountableOwner: string;
  criticalPath: ExecutionMilestone[];
  actions: ExecutionAction[];
  approvals: ExecutionApproval[];
  negotiationBrief: RenewalNegotiationBrief;
  vendorEmailDraft: VendorEmailDraft;
  rebidReadiness: ExecutionRebidReadiness;
  evidencePack: ExecutionEvidenceRef[];
  outcomeTargets: ExecutionOutcomeTarget[];
}

// Source Execution Room builder.
//
// Pure deterministic composer: takes an already-grounded Renewal Cockpit and
// returns the VP operating room for the renewal. It never writes tasks, sends
// mail, serves notice, or fabricates owners. Unknown owners remain
// "not recorded" so the surface can be honest about operational gaps.

import type { RenewalCockpit } from '@/lib/source/renewal-cockpit/cockpit';
import { buildRenewalNegotiationBrief } from '@/lib/source/renewal-cockpit/negotiation-brief';
import { buildVendorEmailDraft } from '@/lib/source/renewal-cockpit/vendor-email-draft';
import type {
  ExecutionAction,
  ExecutionActionStatus,
  ExecutionApproval,
  ExecutionMilestone,
  ExecutionOutcomeTarget,
  ExecutionRebidReadiness,
  ExecutionRoom,
  ExecutionStatus,
} from './types';

export const NOT_RECORDED = 'not recorded';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function formatUsd(value: number | null): string {
  if (value === null) return 'not priced';
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

function addDays(asOf: Date, days: number): string {
  const d = new Date(asOf);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysUntilDate(date: string | null, asOf: Date): number | null {
  if (!date) return null;
  const target = new Date(`${date}T00:00:00Z`).getTime();
  if (!Number.isFinite(target)) return null;
  return Math.floor((target - asOf.getTime()) / MS_PER_DAY);
}

function noticeDeadlineDate(cockpit: RenewalCockpit): string | null {
  const termEnd = cockpit.timing.termEndDate;
  const noticeDays = cockpit.timing.noticePeriodDays;
  if (!termEnd || noticeDays === null) return null;
  const d = new Date(`${termEnd}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() - noticeDays);
  return d.toISOString().slice(0, 10);
}

function deriveStatus(cockpit: RenewalCockpit): {
  status: ExecutionStatus;
  label: string;
  rationale: string;
} {
  if (cockpit.timing.autoRenew && cockpit.timing.daysToNoticeDeadline === null) {
    return {
      status: 'blocked',
      label: 'Blocked',
      rationale:
        'This contract auto-renews but the notice period is not recorded. The team cannot safely protect optionality until the clause is verified.',
    };
  }

  if (
    cockpit.timing.noticeWindowAtRisk ||
    (cockpit.timing.daysToNoticeDeadline !== null &&
      cockpit.timing.daysToNoticeDeadline <= 14)
  ) {
    return {
      status: 'at_risk',
      label: 'At risk',
      rationale:
        'The notice window is inside the execution danger zone. Protect optionality first, then negotiate.',
    };
  }

  if (cockpit.leverage.leverageHolder === 'vendor') {
    return {
      status: 'at_risk',
      label: 'At risk',
      rationale:
        'The incumbent holds leverage because no credible alternative is ready. Market-test before committing term or price.',
    };
  }

  return {
    status: 'on_track',
    label: 'On track',
    rationale:
      'The renewal has enough runway and evidence to proceed through negotiation and approvals without an immediate deadline trap.',
  };
}

function statusForDueDate(daysUntilDue: number | null): ExecutionActionStatus {
  if (daysUntilDue === null) return 'not_started';
  if (daysUntilDue < 0) return 'blocked';
  if (daysUntilDue <= 14) return 'not_started';
  return 'not_started';
}

function buildMilestones(cockpit: RenewalCockpit, asOf: Date): ExecutionMilestone[] {
  const evidenceRefs = [cockpit.contractId, 'vendor_contracts'];
  const noticeDate = noticeDeadlineDate(cockpit);
  const noticeDays = cockpit.timing.daysToNoticeDeadline;
  const negotiationDue = noticeDays !== null ? addDays(asOf, Math.max(1, Math.min(7, noticeDays - 3))) : null;
  const approvalDue = noticeDays !== null ? addDays(asOf, Math.max(2, noticeDays - 2)) : null;
  const finalDecisionDue =
    cockpit.timing.daysToTermEnd !== null
      ? addDays(asOf, Math.max(7, cockpit.timing.daysToTermEnd - 14))
      : null;

  return [
    {
      milestoneId: 'serve-notice',
      title: 'Protect optionality: serve or consciously waive notice',
      dueDate: noticeDate,
      daysUntilDue: noticeDays,
      status: statusForDueDate(noticeDays),
      whyItMatters:
        'If the notice window is missed, the renewal can lock before commercial leverage is created.',
      evidenceRefs,
    },
    {
      milestoneId: 'open-negotiation',
      title: 'Open negotiation with posture and walk-away aligned',
      dueDate: negotiationDue,
      daysUntilDue: negotiationDue ? daysUntilDate(negotiationDue, asOf) : null,
      status: 'not_started',
      whyItMatters:
        'The vendor conversation should start from a benchmarked posture, not last-year pricing.',
      evidenceRefs: [cockpit.contractId, 'vendor_contracts', 'it_financials'],
    },
    {
      milestoneId: 'approval-lock',
      title: 'Lock finance, legal, security and business approval path',
      dueDate: approvalDue,
      daysUntilDue: approvalDue ? daysUntilDate(approvalDue, asOf) : null,
      status: 'not_started',
      whyItMatters:
        'Renewals stall when approval rights are discovered late. The room needs an owner for each sign-off.',
      evidenceRefs,
    },
    {
      milestoneId: 'final-decision',
      title: 'Commit final renewal / rebid / exit decision',
      dueDate: finalDecisionDue,
      daysUntilDue: finalDecisionDue ? daysUntilDate(finalDecisionDue, asOf) : null,
      status: 'not_started',
      whyItMatters:
        'The final decision should happen before vendor pressure turns the renewal into a default.',
      evidenceRefs,
    },
  ];
}

function ownerFromCockpit(cockpit: RenewalCockpit): string {
  return cockpit.ownerRef?.trim() || NOT_RECORDED;
}

function buildRebidReadiness(cockpit: RenewalCockpit): ExecutionRebidReadiness {
  if (cockpit.recommendedPosture === 'rebid') {
    return {
      recommended: true,
      verdict: 'start_rebid',
      rationale:
        'The cockpit recommends a rebid because spend pressure and a credible alternative make competitive tension real.',
      blockers: [],
      nextAction: 'Create the rebid Source event and attach proposal-normalization requirements.',
    };
  }

  if (cockpit.alternatives.length === 0 && cockpit.recommendedPosture !== 'renew') {
    return {
      recommended: false,
      verdict: 'market_test_first',
      rationale:
        'A rebid may be useful, but there is no deal-ready alternative yet. Build market tension before threatening a full process.',
      blockers: ['No credible alternative recorded', 'No proposal comparison baseline yet'],
      nextAction: 'Create a market-test Source event before committing to a full rebid.',
    };
  }

  return {
    recommended: false,
    verdict: 'do_not_rebid_yet',
    rationale:
      'The current posture can proceed without a full rebid; keep the rebid path as leverage if the vendor misses the commercial ask.',
    blockers: [],
    nextAction: 'Use the negotiation brief first; escalate to rebid only if the vendor will not move.',
  };
}

function buildActions(
  cockpit: RenewalCockpit,
  asOf: Date,
  emailBody: string,
): ExecutionAction[] {
  const owner = ownerFromCockpit(cockpit);
  const noticeDate = noticeDeadlineDate(cockpit);
  const noticeDays = cockpit.timing.daysToNoticeDeadline;
  const negotiationDue = noticeDays !== null ? addDays(asOf, Math.max(1, Math.min(7, noticeDays - 3))) : null;
  const approvalDue = noticeDays !== null ? addDays(asOf, Math.max(2, noticeDays - 2)) : null;
  const finalDue =
    cockpit.timing.daysToTermEnd !== null
      ? addDays(asOf, Math.max(7, cockpit.timing.daysToTermEnd - 14))
      : null;
  const refs = [cockpit.contractId, 'vendor_contracts'];

  return [
    {
      actionId: 'serve-notice',
      kind: 'serve_notice',
      title: 'Serve notice or formally waive the notice right',
      owner,
      dueDate: noticeDate,
      daysUntilDue: noticeDays,
      status: statusForDueDate(noticeDays),
      evidenceBasis: cockpit.timing.summary,
      linkedAction: {
        type: 'pending',
        label: 'Notice workflow pending',
        reason:
          'AbarVa can record the intent today; formal legal notice service still needs the persistent notice workflow.',
      },
      evidenceRefs: refs,
    },
    {
      actionId: 'assign-owner',
      kind: 'assign_owner',
      title: 'Assign accountable renewal owner',
      owner,
      dueDate: addDays(asOf, 1),
      daysUntilDue: 1,
      status: owner === NOT_RECORDED ? 'not_started' : 'in_progress',
      evidenceBasis:
        owner === NOT_RECORDED
          ? 'No accountable renewal owner is recorded in the cockpit substrate.'
          : `Owner ${owner} is recorded in the contract substrate.`,
      linkedAction: {
        type: 'pending',
        label: 'Owner persistence pending',
        reason:
          'Owner assignment is visible here but needs the persistent execution-action table before it becomes reporting-grade.',
      },
      evidenceRefs: refs,
    },
    {
      actionId: 'open-negotiation',
      kind: 'open_negotiation',
      title: 'Open negotiation from posture, BATNA and walk-away',
      owner,
      dueDate: negotiationDue,
      daysUntilDue: negotiationDue ? daysUntilDate(negotiationDue, asOf) : null,
      status: 'not_started',
      evidenceBasis: cockpit.postureRationale,
      linkedAction: {
        type: 'route',
        label: 'Use negotiation brief below',
        href: '#negotiation-room',
      },
      evidenceRefs: [cockpit.contractId, 'vendor_contracts', 'it_financials'],
    },
    {
      actionId: 'decide-rebid',
      kind: 'decide_rebid',
      title: 'Decide rebid, market test or incumbent renegotiation',
      owner,
      dueDate: negotiationDue,
      daysUntilDue: negotiationDue ? daysUntilDate(negotiationDue, asOf) : null,
      status: 'not_started',
      evidenceBasis: cockpit.leverage.recommendedPlay,
      linkedAction: {
        type: 'route',
        label: 'Review rebid readiness',
        href: '#rebid-market-test',
      },
      evidenceRefs: [cockpit.contractId, 'vendor_contracts'],
    },
    {
      actionId: 'finance-approval',
      kind: 'finance_approval',
      title: 'Secure finance approval on spend, savings and concessions',
      owner: NOT_RECORDED,
      dueDate: approvalDue,
      daysUntilDue: approvalDue ? daysUntilDate(approvalDue, asOf) : null,
      status: 'not_started',
      evidenceBasis: `Current annual spend is ${formatUsd(cockpit.currentAnnualSpendUsd)}.`,
      linkedAction: {
        type: 'pending',
        label: 'Approval workflow pending',
        reason: 'Approval rows are deterministic until execution approvals persist.',
      },
      evidenceRefs: [cockpit.contractId, 'vendor_contracts', 'it_financials'],
    },
    {
      actionId: 'legal-review',
      kind: 'legal_review',
      title: 'Confirm notice, termination and renewal clause treatment',
      owner: NOT_RECORDED,
      dueDate: approvalDue,
      daysUntilDue: approvalDue ? daysUntilDate(approvalDue, asOf) : null,
      status: 'not_started',
      evidenceBasis:
        cockpit.timing.autoRenew
          ? 'Auto-renewal clause exists; legal needs to verify notice language before service.'
          : 'No auto-renewal exposure is recorded, but legal should still confirm renewal mechanics.',
      linkedAction: {
        type: 'pending',
        label: 'Legal approval pending',
        reason: 'Legal approval is displayed but not yet persisted as an execution approval.',
      },
      evidenceRefs: refs,
    },
    {
      actionId: 'vendor-communication',
      kind: 'vendor_communication',
      title: 'Send vendor posture email after internal alignment',
      owner,
      dueDate: negotiationDue,
      daysUntilDue: negotiationDue ? daysUntilDate(negotiationDue, asOf) : null,
      status: 'not_started',
      evidenceBasis:
        'The draft is generated from the cockpit posture and evidence; AbarVa does not send mail.',
      linkedAction: {
        type: 'draft',
        label: 'Vendor email draft',
        body: emailBody,
      },
      evidenceRefs: refs,
    },
    {
      actionId: 'final-decision',
      kind: 'final_decision',
      title: 'Record final commercial decision and outcome target',
      owner,
      dueDate: finalDue,
      daysUntilDue: finalDue ? daysUntilDate(finalDue, asOf) : null,
      status: 'not_started',
      evidenceBasis:
        'Final decision should capture posture, economics, risk retired and next measurement date.',
      linkedAction: {
        type: 'pending',
        label: 'Outcome ledger write-back pending',
        reason:
          'The execution room defines the final-decision record; persistence comes with the action-table migration.',
      },
      evidenceRefs: refs,
    },
  ];
}

function buildApprovals(cockpit: RenewalCockpit, asOf: Date): ExecutionApproval[] {
  const dueDate =
    cockpit.timing.daysToNoticeDeadline !== null
      ? addDays(asOf, Math.max(2, cockpit.timing.daysToNoticeDeadline - 2))
      : null;

  return [
    {
      role: 'finance',
      label: 'Finance',
      owner: NOT_RECORDED,
      status: 'not_started',
      decisionNeeded: `Approve renewal economics against ${formatUsd(
        cockpit.currentAnnualSpendUsd,
      )} current annual spend.`,
      dueDate,
    },
    {
      role: 'legal',
      label: 'Legal',
      owner: NOT_RECORDED,
      status: 'not_started',
      decisionNeeded:
        'Verify notice rights, renewal language, termination rights and any price-escalator clause.',
      dueDate,
    },
    {
      role: 'security',
      label: 'Security',
      owner: NOT_RECORDED,
      status: 'not_started',
      decisionNeeded:
        'Confirm no new security, privacy or data-processing exposure is introduced by the renewal or rebid path.',
      dueDate,
    },
    {
      role: 'business_sponsor',
      label: 'Business sponsor',
      owner: NOT_RECORDED,
      status: 'not_started',
      decisionNeeded:
        'Confirm business need, usage expectations and any disruption tolerance before posture is finalized.',
      dueDate,
    },
    {
      role: 'it_owner',
      label: 'IT owner',
      owner: NOT_RECORDED,
      status: 'not_started',
      decisionNeeded:
        'Validate operational dependency, integration risk and transition feasibility.',
      dueDate,
    },
  ];
}

function buildOutcomeTargets(cockpit: RenewalCockpit, asOf: Date): ExecutionOutcomeTarget[] {
  const measurementDate =
    cockpit.timing.termEndDate ?? addDays(asOf, 90);
  const targets: ExecutionOutcomeTarget[] = [
    {
      targetId: 'protect-optionality',
      title: 'Avoid silent renewal',
      targetValue:
        cockpit.timing.autoRenew && cockpit.timing.daysToNoticeDeadline !== null
          ? `Notice decision complete before ${cockpit.timing.daysToNoticeDeadline} day deadline`
          : 'Renewal optionality explicitly recorded',
      measurementDate,
      evidenceRefs: [cockpit.contractId, 'vendor_contracts'],
    },
    {
      targetId: 'commercial-outcome',
      title: 'Capture commercial value',
      targetValue:
        cockpit.shouldCost.overspendVsBenchmarkUsd !== null &&
        cockpit.shouldCost.overspendVsBenchmarkUsd > 0
          ? `Close at least ${formatUsd(cockpit.shouldCost.overspendVsBenchmarkUsd)} annual benchmark gap`
          : 'Preserve price certainty and avoid unnecessary scope expansion',
      measurementDate,
      evidenceRefs: [cockpit.contractId, 'vendor_contracts', 'it_financials'],
    },
    {
      targetId: 'risk-retired',
      title: 'Retire sourcing risk',
      targetValue:
        cockpit.leverage.leverageHolder === 'vendor'
          ? 'Create credible alternative or documented walk-away before committing'
          : 'Use current leverage without creating transition risk',
      measurementDate,
      evidenceRefs: [cockpit.contractId, 'vendor_contracts'],
    },
  ];
  return targets;
}

/**
 * Build the Source Execution Room from a Renewal Cockpit.
 */
export function buildExecutionRoom(
  cockpit: RenewalCockpit,
  asOf: Date = new Date(cockpit.generatedAt),
): ExecutionRoom {
  const status = deriveStatus(cockpit);
  const negotiationBrief = buildRenewalNegotiationBrief(cockpit);
  const vendorEmailDraft = buildVendorEmailDraft(cockpit);
  const rebidReadiness = buildRebidReadiness(cockpit);
  const noticeDate = noticeDeadlineDate(cockpit);

  const nextBestAction =
    status.status === 'blocked'
      ? 'Verify the notice clause and assign an accountable renewal owner.'
      : cockpit.timing.noticeWindowAtRisk
        ? 'Serve notice or consciously waive it, then open the negotiation brief.'
        : cockpit.leverage.leverageHolder === 'vendor'
          ? 'Create market tension before entering the vendor call.'
          : 'Open the negotiation brief and lock stakeholder approvals.';

  return {
    clientKey: cockpit.clientKey,
    contractId: cockpit.contractId,
    vendorName: cockpit.vendorName,
    product: cockpit.product,
    generatedAt: asOf.toISOString(),
    title: `${cockpit.vendorName} ${cockpit.product} execution room`,
    status: status.status,
    statusLabel: status.label,
    statusRationale: status.rationale,
    recommendedPosture: cockpit.recommendedPosture,
    postureLabel: cockpit.postureLabel,
    nextBestAction,
    noticeDeadlineDate: noticeDate,
    daysToNoticeDeadline: cockpit.timing.daysToNoticeDeadline,
    termEndDate: cockpit.timing.termEndDate,
    currentAnnualSpendUsd: cockpit.currentAnnualSpendUsd,
    accountableOwner: ownerFromCockpit(cockpit),
    criticalPath: buildMilestones(cockpit, asOf),
    actions: buildActions(cockpit, asOf, vendorEmailDraft.body),
    approvals: buildApprovals(cockpit, asOf),
    negotiationBrief,
    vendorEmailDraft,
    rebidReadiness,
    evidencePack: [
      {
        label: 'Current spend',
        claim: `Current annual spend is ${formatUsd(cockpit.currentAnnualSpendUsd)}.`,
        evidenceRefs: [cockpit.contractId, 'vendor_contracts'],
      },
      {
        label: 'Should-cost / benchmark',
        claim: cockpit.shouldCost.summary,
        evidenceRefs: [cockpit.contractId, 'vendor_contracts', 'it_financials'],
      },
      {
        label: 'Notice period',
        claim: cockpit.timing.summary,
        evidenceRefs: [cockpit.contractId, 'vendor_contracts'],
      },
      {
        label: 'Usage',
        claim: cockpit.usage.summary,
        evidenceRefs: [cockpit.contractId, 'vendor_contracts'],
      },
      {
        label: 'Leverage',
        claim: cockpit.leverage.assessment,
        evidenceRefs: [cockpit.contractId, 'vendor_contracts'],
      },
    ],
    outcomeTargets: buildOutcomeTargets(cockpit, asOf),
  };
}

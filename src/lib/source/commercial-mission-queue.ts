// Source commercial mission queue.
// Provides a stage-aware, prioritized queue of commercial actions for the Source module.
// Deterministic — no model calls, no network calls, no scheduler.

export type CommercialMissionType =
  | 'price_benchmark'
  | 'scope_clarification'
  | 'evidence_collection'
  | 'bafo_preparation'
  | 'governance_review'
  | 'vendor_negotiation'
  | 'risk_mitigation'
  | 'contract_review'
  | 'award_recommendation'
  | 'transition_planning';

export type CommercialMissionPriority = 'critical' | 'high' | 'medium' | 'low';

export type CommercialMissionStatus =
  | 'queued'
  | 'in_progress'
  | 'blocked'
  | 'complete'
  | 'skipped';

export type CommercialMissionOwner =
  | 'nexus'       // AI agent
  | 'sentinel'    // Evidence/data agent
  | 'atlas'       // Market intelligence agent
  | 'steward'     // Governance agent
  | 'buyer_team'; // Human team

export interface CommercialMissionQueueItem {
  missionId: string;
  missionType: CommercialMissionType;
  priority: CommercialMissionPriority;
  status: CommercialMissionStatus;
  owner: CommercialMissionOwner;
  title: string;
  objective: string;
  inputs: string[];           // required inputs
  outputs: string[];          // expected outputs
  blockedBy: string[];        // missionIds blocking this
  estimatedDurationDays: number;
  eventId: string;
  vendorId: string | null;    // null = event-level
  stage: string;
  createdAt: string;
}

export interface CommercialMissionQueue {
  eventId: string;
  eventName: string;
  stage: string;
  generatedAt: string;
  items: CommercialMissionQueueItem[];
  criticalCount: number;
  highCount: number;
  queuedCount: number;
  blockedCount: number;
  totalCount: number;
  nextMission: CommercialMissionQueueItem | null;
  summaryNarrative: string;
}

export interface CommercialMissionQueueInput {
  eventId: string;
  eventName: string;
  stage: string;
  vendorIds: string[];
  needsPriceBenchmark: boolean;
  needsScopeClarification: boolean;
  needsEvidenceCollection: boolean;
  needsGovernanceReview: boolean;
  isBafoPhase: boolean;
}

export function buildCommercialMissionQueue(
  input: CommercialMissionQueueInput,
): CommercialMissionQueue {
  const items: CommercialMissionQueueItem[] = [];

  if (input.needsEvidenceCollection) {
    items.push({
      missionId: `mission-${input.eventId}-evidence`,
      missionType: 'evidence_collection',
      priority: 'critical',
      status: 'queued',
      owner: 'sentinel',
      title: 'Collect missing evidence',
      objective: 'Achieve >80% evidence coverage across required data categories.',
      inputs: ['data-category-list', 'current-evidence-register'],
      outputs: ['evidence-collection-plan', 'updated-evidence-register'],
      blockedBy: [],
      estimatedDurationDays: 3,
      eventId: input.eventId,
      vendorId: null,
      stage: input.stage,
      createdAt: '2026-04-26',
    });
  }

  if (input.needsPriceBenchmark) {
    items.push({
      missionId: `mission-${input.eventId}-benchmark`,
      missionType: 'price_benchmark',
      priority: 'high',
      status: 'queued',
      owner: 'atlas',
      title: 'Run pricing benchmark analysis',
      objective: 'Benchmark all vendor quotes against market median and peer data.',
      inputs: ['vendor-pricing-submissions', 'market-benchmark-data'],
      outputs: ['benchmark-comparison-report', 'anomaly-flags'],
      blockedBy: input.needsEvidenceCollection ? [`mission-${input.eventId}-evidence`] : [],
      estimatedDurationDays: 2,
      eventId: input.eventId,
      vendorId: null,
      stage: input.stage,
      createdAt: '2026-04-26',
    });
  }

  if (input.needsScopeClarification) {
    items.push({
      missionId: `mission-${input.eventId}-scope`,
      missionType: 'scope_clarification',
      priority: 'high',
      status: 'queued',
      owner: 'nexus',
      title: 'Issue scope clarification RFI',
      objective: 'Obtain explicit exclusion lists and assumption bundles from all vendors.',
      inputs: ['vendor-sow-submissions', 'baseline-scope-document'],
      outputs: ['scope-clarification-rfi', 'vendor-scope-responses'],
      blockedBy: [],
      estimatedDurationDays: 5,
      eventId: input.eventId,
      vendorId: null,
      stage: input.stage,
      createdAt: '2026-04-26',
    });
  }

  if (input.needsGovernanceReview) {
    items.push({
      missionId: `mission-${input.eventId}-governance`,
      missionType: 'governance_review',
      priority: 'medium',
      status: 'queued',
      owner: 'steward',
      title: 'Review governance terms',
      objective: 'Verify SLA, escalation path, and performance penalty terms are acceptable.',
      inputs: ['vendor-contract-drafts', 'governance-policy'],
      outputs: ['governance-review-report', 'required-changes-list'],
      blockedBy: [],
      estimatedDurationDays: 2,
      eventId: input.eventId,
      vendorId: null,
      stage: input.stage,
      createdAt: '2026-04-26',
    });
  }

  if (input.isBafoPhase) {
    const blockers: string[] = [];
    if (input.needsPriceBenchmark) blockers.push(`mission-${input.eventId}-benchmark`);
    if (input.needsScopeClarification) blockers.push(`mission-${input.eventId}-scope`);

    items.push({
      missionId: `mission-${input.eventId}-bafo`,
      missionType: 'bafo_preparation',
      priority: 'high',
      status: blockers.length > 0 ? 'blocked' : 'queued',
      owner: 'nexus',
      title: 'Prepare BAFO requirements pack',
      objective: 'Compile pricing requirements, scope constraints, and governance terms into BAFO pack.',
      inputs: ['benchmark-comparison-report', 'scope-clarification-responses', 'governance-review-report'],
      outputs: ['bafo-requirements-pack', 'vendor-bafo-invitations'],
      blockedBy: blockers,
      estimatedDurationDays: 2,
      eventId: input.eventId,
      vendorId: null,
      stage: input.stage,
      createdAt: '2026-04-26',
    });
  }

  const criticalCount = items.filter((i) => i.priority === 'critical').length;
  const highCount = items.filter((i) => i.priority === 'high').length;
  const queuedCount = items.filter((i) => i.status === 'queued').length;
  const blockedCount = items.filter((i) => i.status === 'blocked').length;

  // Next mission = highest priority non-blocked queued item
  const nextMission = items
    .filter((i) => i.status === 'queued')
    .sort((a, b) => {
      const order: CommercialMissionPriority[] = ['critical', 'high', 'medium', 'low'];
      return order.indexOf(a.priority) - order.indexOf(b.priority);
    })[0] ?? null;

  return {
    eventId: input.eventId,
    eventName: input.eventName,
    stage: input.stage,
    generatedAt: '2026-04-26',
    items,
    criticalCount,
    highCount,
    queuedCount,
    blockedCount,
    totalCount: items.length,
    nextMission,
    summaryNarrative: items.length === 0
      ? 'No commercial missions required.'
      : `${items.length} mission(s) in queue: ${criticalCount} critical, ${highCount} high priority. Next: ${nextMission?.title ?? 'none'}.`,
  };
}

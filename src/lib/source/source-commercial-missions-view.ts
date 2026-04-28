// Source commercial missions view-model.
// Transforms the deterministic commercial mission queue into a display-ready view-model.
// Pure TypeScript — no React imports, no model calls, no network calls.

import {
  buildCommercialMissionQueue,
  CommercialMissionPriority,
} from './commercial-mission-queue';

export interface SourceMissionDisplayItem {
  missionId: string;
  missionType: string;
  agentOwner: string;
  label: string;
  priority: 'high' | 'medium' | 'low';
  statusLabel: string;
  actionRequired: boolean;
}

export interface SourceCommercialMissionsViewModel {
  rfpId: string;
  missions: SourceMissionDisplayItem[];       // max visibleCount (default 5)
  totalMissionCount: number;
  hasMore: boolean;
  highPriorityCount: number;
  agentSummary: Record<string, number>;       // agent name → mission count
  generatedAt: string;
  caveat: string;
}

// Maps the raw priority to the display union (collapses 'critical' → 'high').
function toDisplayPriority(p: CommercialMissionPriority): 'high' | 'medium' | 'low' {
  if (p === 'critical' || p === 'high') return 'high';
  if (p === 'medium') return 'medium';
  return 'low';
}

function toStatusLabel(status: string): string {
  switch (status) {
    case 'queued':      return 'Queued';
    case 'in_progress': return 'In Progress';
    case 'blocked':     return 'Blocked';
    case 'complete':    return 'Complete';
    case 'skipped':     return 'Skipped';
    default:            return status;
  }
}

function capitaliseOwner(owner: string): string {
  if (owner === 'buyer_team') return 'Buyer Team';
  return owner.charAt(0).toUpperCase() + owner.slice(1);
}

export function buildCommercialMissionsViewModel(
  rfpId: string,
  vendorList: string[],
  visibleCount: number = 5,
): SourceCommercialMissionsViewModel {
  // Build a comprehensive queue: enable all mission types so we get a rich queue
  // for any RFP. Caller-supplied vendorList drives vendor scoping.
  const queue = buildCommercialMissionQueue({
    eventId: rfpId,
    eventName: `RFP ${rfpId}`,
    stage: 'evaluation',
    vendorIds: vendorList,
    needsPriceBenchmark: true,
    needsScopeClarification: true,
    needsEvidenceCollection: true,
    needsGovernanceReview: true,
    isBafoPhase: true,
  });

  const allItems = queue.items;
  const totalMissionCount = allItems.length;

  // High-priority count = critical + high from raw queue
  const highPriorityCount = allItems.filter(
    (i) => i.priority === 'critical' || i.priority === 'high',
  ).length;

  // Agent summary over ALL items (not capped)
  const agentSummary: Record<string, number> = {};
  for (const item of allItems) {
    const owner = capitaliseOwner(item.owner);
    agentSummary[owner] = (agentSummary[owner] ?? 0) + 1;
  }

  // Slice to visibleCount for the missions array
  const visibleItems = allItems.slice(0, visibleCount);

  const missions: SourceMissionDisplayItem[] = visibleItems.map((item) => ({
    missionId: item.missionId,
    missionType: item.missionType,
    agentOwner: capitaliseOwner(item.owner),
    label: item.title,
    priority: toDisplayPriority(item.priority),
    statusLabel: toStatusLabel(item.status),
    actionRequired: item.status === 'queued' || item.status === 'in_progress',
  }));

  return {
    rfpId,
    missions,
    totalMissionCount,
    hasMore: totalMissionCount > visibleCount,
    highPriorityCount,
    agentSummary,
    generatedAt: '2026-04-26',
    caveat:
      'Mission queue reflects intelligence priorities as of event date. Agent assignments are indicative and subject to workflow orchestration.',
  };
}

/**
 * overview-composer — assembles the 4 Overview block payloads
 * (Setup Redesign Package PR A).
 *
 * Pure server-side composition: takes the snapshot + authored
 * fallback (already merged in the page) plus the program-approval
 * queue and returns block-shaped data. No LLM at runtime — all
 * "Steward orientation" copy is template-filled deterministically
 * from substrate per `DATA_BINDING_CATALOG.md` §1 Block 1.2.
 */

import type { InventorySegmentRollup, SetupActsContent } from '@/lib/admin/setup-acts-registry';
import {
  agentLevelFromReadiness,
  blockedCapabilityTrackCount,
  bucketHealthFromStates,
  buildPlainLanguageBuckets,
  impactFromScore,
  impactScoreForSegment,
  industryPhraseForClient,
  readinessPercent,
  unlocksCopy,
  type ActionImpact,
  type AgentLevel,
  type HealthState,
} from '@/lib/admin/setup-vocab';
import type { ActionQueueItem } from '@/components/admin/overview/ActionQueue';
import type { RecentActivityItem } from '@/components/admin/overview/RecentActivity';

export interface OverviewBlocks {
  status: {
    tenantName: string;
    readinessPercent: number | null;
    agentLevel: AgentLevel;
    blockedCapabilityTracks: number;
  };
  orientation: {
    tenantName: string;
    industryPhrase: string | null;
    loadedSummary: string;
    missingSummary: string;
    nextLoadName: string | null;
    nextLoadConsequence: string | null;
  };
  actionQueue: {
    items: ActionQueueItem[];
    totalPending: number;
  };
  recentActivity: {
    items: RecentActivityItem[];
  };
}

export interface ComposeOverviewInput {
  tenantName: string;
  industryCode?: string | null;
  clientKey: string;
  segments: InventorySegmentRollup[];
  /** Authored content for fallback prose / tenant-richness signal. */
  content: SetupActsContent;
  /** Tenant-admin queue: pending program briefs for Steward review. */
  programApprovalPendingCount: number;
  /** Cross-program signal counts (Atlas surface). */
  atlasSignalCount: number;
  atlasHighSeverityCount: number;
  /** SSO configured? Falls back to false (Fix Package shipped state). */
  ssoConfigured?: boolean;
  /** Recent activity from snapshot — empty array if none. */
  recentSnapshotActivity: ReadonlyArray<{
    actor: string;
    what: string;
    timestamp: string;
  }>;
  /** Now reference for "is this within last 7 days" filtering. */
  now?: Date;
}

export function composeOverviewBlocks(input: ComposeOverviewInput): OverviewBlocks {
  const segments = input.segments;
  const segmentsLoaded = segments.length > 0;
  const readiness = segmentsLoaded ? readinessPercent(segments) : null;
  const blockedTracks = blockedCapabilityTrackCount(segments);
  const agentLevel: AgentLevel = readiness === null ? 'blank' : agentLevelFromReadiness(readiness);

  const buckets = buildPlainLanguageBuckets(segments);
  const greenAndAmber = buckets.filter((b) => b.health === 'green' || b.health === 'amber');
  const red = buckets.filter((b) => b.health === 'red');

  const loadedSummary = greenAndAmber.length === 0
    ? 'No categories are loaded yet'
    : greenAndAmber.length <= 2
      ? `${greenAndAmber.map((b) => b.label).join(' and ')} ${greenAndAmber.length === 1 ? 'is' : 'are'} loaded`
      : `${greenAndAmber.length} categories — including ${greenAndAmber[0].label} — are loaded`;

  const missingSummary = red.length === 0
    ? 'every category has at least partial data'
    : red.length <= 2
      ? `${red.map((b) => b.label).join(' and ')} ${red.length === 1 ? 'is' : 'are'} empty`
      : `${red.length} categories — including ${red[0].label} — are empty`;

  // Highest-impact next load.
  const emptyOrThin = segments.filter(
    (s) => (s.healthState as HealthState) === 'not_started'
      || (s.healthState as HealthState) === 'critical'
      || (s.healthState as HealthState) === 'sparse',
  );
  const ranked = [...emptyOrThin].sort(
    (a, b) => impactScoreForSegment(b.familyNumber) - impactScoreForSegment(a.familyNumber),
  );
  const next = ranked[0];
  const nextLoadName = next?.segmentName ?? null;
  const nextLoadConsequence = next ? unlocksCopy(next.familyNumber, next.segmentName) : null;

  const orientation: OverviewBlocks['orientation'] = {
    tenantName: input.tenantName,
    industryPhrase: industryPhraseForClient({
      industryCode: input.industryCode,
      clientKey: input.clientKey,
    }),
    loadedSummary,
    missingSummary,
    nextLoadName,
    nextLoadConsequence,
  };

  // Action queue: top 5 by impact + SSO if not configured + program approvals if pending.
  // Connector decision_pending omitted per DATA_BINDING_CATALOG fallback (substrate not present).
  const actionQueueItems: ActionQueueItem[] = [];
  if (input.programApprovalPendingCount > 0) {
    actionQueueItems.push({
      id: 'approve-program-briefs',
      severity: 'high',
      label: `Approve ${input.programApprovalPendingCount} program brief${input.programApprovalPendingCount === 1 ? '' : 's'}`,
      consequence: 'unlocks Phase 0 for the submitted programs',
      href: '/admin/programs/approvals',
      panelLabel: 'Approvals',
    });
  }
  if (input.ssoConfigured === false) {
    actionQueueItems.push({
      id: 'configure-sso',
      severity: 'medium',
      label: 'Configure SSO to invite users',
      consequence: 'unlocks the invite pipeline + audit-ready user provisioning',
      href: '/admin/users-access/sso-configuration',
      panelLabel: 'Users & Access',
    });
  }
  for (const seg of ranked) {
    if (actionQueueItems.length >= 5) break;
    const score = impactScoreForSegment(seg.familyNumber);
    actionQueueItems.push({
      id: `load-${seg.segmentId}`,
      severity: impactFromScore(score) as ActionImpact,
      label: `Load ${seg.segmentName}`,
      consequence: unlocksCopy(seg.familyNumber, seg.segmentName),
      href: '/admin/data-trust',
      panelLabel: 'Data Trust',
    });
  }
  if (input.atlasHighSeverityCount > 0) {
    // Highest-severity Atlas signals are admin-actionable through the cross-program signals page.
    actionQueueItems.push({
      id: 'review-cross-program-signals',
      severity: 'high',
      label: `Review ${input.atlasHighSeverityCount} HIGH cross-program signal${input.atlasHighSeverityCount === 1 ? '' : 's'}`,
      consequence: 'unblocks Atlas reasoning across the active portfolio',
      href: '/admin/cross-program-signals',
      panelLabel: 'Signals',
    });
  }

  const totalPending = actionQueueItems.length;

  // Recent activity: filter to "real" changes only (ingested or reviewed in last 7 days).
  const now = input.now ?? new Date();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const realActivity = input.recentSnapshotActivity
    .filter((evt) => {
      // Heuristic: filter out platform-administrative / setup-posture entries.
      const lower = evt.what.toLowerCase();
      if (lower.includes('authored') && lower.includes('setup posture')) return false;
      if (lower.includes('prioritized') && lower.includes('enterprise profile')) return false;
      return true;
    })
    .slice(0, 5)
    .map((evt, idx) => ({
      id: `activity-${idx}`,
      summary: `${evt.actor}: ${evt.what}`,
      relativeTimestamp: evt.timestamp,
    }));

  // If no snapshot activity, derive from segments where last_reviewed/last_ingested is within 7 days.
  if (realActivity.length === 0) {
    for (const s of segments) {
      const ts = s.lastIngestedAt ?? s.lastReviewedAt;
      if (!ts) continue;
      const at = new Date(ts);
      if (Number.isNaN(at.getTime())) continue;
      if (now.getTime() - at.getTime() > sevenDaysMs) continue;
      realActivity.push({
        id: `seg-${s.segmentId}`,
        summary: `${s.segmentName} ${s.lastIngestedAt ? 'ingested' : 'reviewed'}`,
        relativeTimestamp: relativeFromIso(ts, now),
      });
      if (realActivity.length >= 5) break;
    }
  }

  return {
    status: {
      tenantName: input.tenantName,
      readinessPercent: readiness,
      agentLevel,
      blockedCapabilityTracks: blockedTracks,
    },
    orientation,
    actionQueue: {
      items: actionQueueItems,
      totalPending,
    },
    recentActivity: {
      items: realActivity,
    },
  };
}

function relativeFromIso(iso: string, now: Date): string {
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const diffDay = Math.round(diffMs / (24 * 60 * 60 * 1000));
  if (diffDay <= 1) return 'Today';
  return `${diffDay}d ago`;
}

// Re-export for convenience in tests.
export { bucketHealthFromStates };

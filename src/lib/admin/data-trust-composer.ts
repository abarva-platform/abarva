/**
 * data-trust-composer — Block payloads for the redesigned
 * Data Trust panel (Setup Redesign Package PR B).
 *
 * Single source of truth for all 4 blocks:
 *   2.1 State header (4 metrics)
 *   2.2 What's loaded (plain-language buckets)
 *   2.3 Action queue (ranked next loads)
 *   2.4 Trust ladder per segment (collapsible)
 *
 * Reads from the same segment source the Overview composer uses
 * (live snapshot or authored fallback) — so the two panels never
 * disagree on substrate state.
 */

import type { InventorySegmentRollup } from '@/lib/admin/setup-acts-registry';
import {
  buildPlainLanguageBuckets,
  impactFromScore,
  impactScoreForSegment,
  trustRungFromHealth,
  unlocksCopy,
  type ActionImpact,
  type BucketRow,
  type HealthState,
  type TrustRung,
} from '@/lib/admin/setup-vocab';

export interface DataTrustStateMetrics {
  segmentsLoaded: number;
  totalSegments: number;
  records: number;
  decisionGrade: number;
  emptyBlocking: number;
}

export interface DataTrustActionQueueItem {
  id: string;
  severity: ActionImpact;
  segmentName: string;
  consequence: string;
  /** Path to the template file in /public/setup-templates, or null if no template exists. */
  templateHref: string | null;
  templateLabel: 'YAML' | 'CSV' | null;
  uploadHref: string;
}

export interface TrustLadderRow {
  segmentId: string;
  segmentName: string;
  familyNumber: number;
  records: number;
  trustRung: TrustRung;
  unlocks: string;
  nextAction: 'Load' | 'Promote' | '—';
}

export interface DataTrustBlocks {
  state: DataTrustStateMetrics;
  buckets: BucketRow[];
  actionQueue: DataTrustActionQueueItem[];
  ladder: TrustLadderRow[];
}

const TOTAL_SEGMENTS = 14;

const CRITICAL_PATH_FAMILIES = new Set([1, 2, 3, 4, 5, 6, 9, 12]);

const TEMPLATE_BY_FAMILY: Record<
  number,
  { href: string; label: 'YAML' | 'CSV' }
> = {
  1: { href: '/setup-templates/enterprise-profile.yaml', label: 'YAML' },
  3: { href: '/setup-templates/it-system-landscape.csv', label: 'CSV' },
  6: { href: '/setup-templates/program-inventory.csv', label: 'CSV' },
  12: { href: '/setup-templates/compliance-and-regulatory.csv', label: 'CSV' },
};

export function composeDataTrustBlocks(
  segments: InventorySegmentRollup[],
): DataTrustBlocks {
  const segmentsLoaded = segments.filter(
    (s) => (s.healthState as HealthState) !== 'not_started',
  ).length;
  const records = segments.reduce((n, s) => n + s.recordCount, 0);
  const decisionGrade = segments.filter(
    (s) => (s.healthState as HealthState) === 'complete',
  ).length;

  // empty/blocking = critical-path segments that are not loaded.
  // Counts both segments missing from the rollup AND those present
  // but in not_started / critical / sparse health.
  const presentCriticalFamilies = new Set(
    segments
      .filter((s) => CRITICAL_PATH_FAMILIES.has(s.familyNumber))
      .map((s) => s.familyNumber),
  );
  const emptyOrCriticalFamilies = new Set<number>();
  for (const f of CRITICAL_PATH_FAMILIES) {
    if (!presentCriticalFamilies.has(f)) {
      emptyOrCriticalFamilies.add(f);
      continue;
    }
    const seg = segments.find((s) => s.familyNumber === f);
    if (!seg) continue;
    const state = seg.healthState as HealthState;
    if (state === 'not_started' || state === 'critical' || state === 'sparse') {
      emptyOrCriticalFamilies.add(f);
    }
  }

  const state: DataTrustStateMetrics = {
    segmentsLoaded,
    totalSegments: TOTAL_SEGMENTS,
    records,
    decisionGrade,
    emptyBlocking: emptyOrCriticalFamilies.size,
  };

  const buckets = buildPlainLanguageBuckets(segments);

  // Action queue: rank empty/thin segments by impact score, top 5.
  const emptyOrThin = segments.filter((s) => {
    const st = s.healthState as HealthState;
    return st === 'not_started' || st === 'critical' || st === 'sparse';
  });
  const ranked = [...emptyOrThin]
    .sort((a, b) => impactScoreForSegment(b.familyNumber) - impactScoreForSegment(a.familyNumber))
    .slice(0, 5);

  const actionQueue: DataTrustActionQueueItem[] = ranked.map((seg) => {
    const score = impactScoreForSegment(seg.familyNumber);
    const tpl = TEMPLATE_BY_FAMILY[seg.familyNumber];
    return {
      id: `next-${seg.segmentId}`,
      severity: impactFromScore(score) as ActionImpact,
      segmentName: seg.segmentName,
      consequence: unlocksCopy(seg.familyNumber, seg.segmentName),
      templateHref: tpl?.href ?? null,
      templateLabel: tpl?.label ?? null,
      // Upload destination is the segment detail page (or a
      // future upload flow); points to /admin/segments/<id> per
      // existing route from Setup Fix Package.
      uploadHref: `/admin/segments/${seg.segmentId}`,
    };
  });

  // Trust ladder: 14 rows ordered by family number.
  const byFamily = new Map<number, InventorySegmentRollup>();
  for (const s of segments) byFamily.set(s.familyNumber, s);

  const ladder: TrustLadderRow[] = [];
  for (let f = 1; f <= TOTAL_SEGMENTS; f += 1) {
    const seg = byFamily.get(f);
    if (seg) {
      const rung = trustRungFromHealth(seg.healthState as HealthState, seg.recordCount);
      const nextAction: TrustLadderRow['nextAction'] =
        rung === 'Decision-grade' ? '—' : rung === 'Empty' ? 'Load' : 'Promote';
      ladder.push({
        segmentId: seg.segmentId,
        segmentName: seg.segmentName,
        familyNumber: seg.familyNumber,
        records: seg.recordCount,
        trustRung: rung,
        unlocks: unlocksCopy(seg.familyNumber, seg.segmentName),
        nextAction,
      });
    } else {
      // Segment not in snapshot — render as Empty / Load.
      const segmentName = SEGMENT_NAME_BY_FAMILY[f] ?? `Segment ${f}`;
      ladder.push({
        segmentId: SEGMENT_KEY_BY_FAMILY[f] ?? `seg_${f}`,
        segmentName,
        familyNumber: f,
        records: 0,
        trustRung: 'Empty',
        unlocks: unlocksCopy(f, segmentName),
        nextAction: 'Load',
      });
    }
  }

  return { state, buckets, actionQueue, ladder };
}

const SEGMENT_NAME_BY_FAMILY: Record<number, string> = {
  1: 'Enterprise profile',
  2: 'Org structure',
  3: 'IT system landscape',
  4: 'IT financials',
  5: 'KPI dictionary',
  6: 'Program inventory',
  7: 'Sourcing artifacts',
  8: 'Program deliverables',
  9: 'Evidence ledger',
  10: 'Operating telemetry',
  11: 'Vendor and contract',
  12: 'Compliance and regulatory',
  13: 'Industry context',
  14: 'Cross-program signals',
};

const SEGMENT_KEY_BY_FAMILY: Record<number, string> = {
  1: 'enterprise_profile',
  2: 'org_structure',
  3: 'it_landscape',
  4: 'it_financials',
  5: 'kpi_dictionary',
  6: 'program_inventory',
  7: 'sourcing_artifacts',
  8: 'program_deliverables',
  9: 'evidence_ledger',
  10: 'operating_telemetry',
  11: 'vendor_contracts',
  12: 'compliance',
  13: 'industry_context',
  14: 'cross_program_signals',
};

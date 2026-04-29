// sentinel-evidence-gap-queue-view.ts — INT3
//
// Deterministic view model for the Sentinel Evidence Gap Queue.
// Aggregates all open evidence gaps across active/candidate/monitoring patterns
// in the Apex Retail engagement into a single prioritized close-out queue.
//
// Rendered as a section within IntelligenceLensTabs (gap_queue tab).
//
// The gap queue answers: "What evidence is still missing — who needs to
// provide it, and how urgent is it to close each gap?"
//
// Deterministic: no live clocks, no randomness, no network IO.
// Does NOT import from src/lib/source/**, src/lib/programs/mock,
// src/lib/auth/**, or supabase.

// ─── Output types ───────────────────────────────────────────────────────��─────

export type GapUrgency = 'critical' | 'high' | 'medium' | 'low';

export type PatternApplicationStatus = 'active' | 'candidate' | 'monitoring';

export interface EvidenceGapQueueItem {
  /** Stable queue position ID (q-01, q-02, …). */
  queueId: string;
  /** Original gap ID from the pattern evidence definition. */
  gapId: string;
  /** Short gap label. */
  label: string;
  /** What evidence is needed to close this gap. */
  needed: string;
  /** Which team or data source should provide it. */
  responsibleParty: string;
  /** Parent pattern ID. */
  patternId: string;
  /** Parent pattern display title. */
  patternTitle: string;
  /** Application status of the parent pattern in this engagement. */
  patternApplicationStatus: PatternApplicationStatus;
  /** Urgency classification for queue ordering. */
  urgency: GapUrgency;
  /** Human-readable deadline hint (may reference a gate or calendar date). */
  deadlineHint: string | null;
  /** Cross-surface context link text (Source / Programs). */
  contextLink: string | null;
}

export interface EvidenceGapQueueSummary {
  totalGaps: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

export interface EvidenceGapQueueView {
  /** Total count of gaps in the queue. */
  totalGaps: number;
  /** Prioritized queue items — critical first. */
  items: EvidenceGapQueueItem[];
  summary: EvidenceGapQueueSummary;
  /** Short Atlas synthesis of what the gap queue represents. */
  atlasSummary: string;
  honestDisclaimer: string;
  deterministicSeed: true;
}

// ─── Gap queue fixture ────────────────────────────────────────────────────────

const GAP_QUEUE_ITEMS: EvidenceGapQueueItem[] = [
  // ── Critical ────────────────────────────────────────────────────────────────
  {
    queueId: 'q-01',
    gapId: 'bg-001-soc2',
    label: 'Vendor B SOC-2 Type II certification',
    needed: 'SOC-2 Type II report from Vendor B to complete full evaluation',
    responsibleParty: 'Vendor B / InfoSec',
    patternId: 'BAFO-GOVERNANCE-001',
    patternTitle: 'BAFO as governed evidence sequence',
    patternApplicationStatus: 'active',
    urgency: 'critical',
    deadlineHint: 'Before May 2 2026 to preserve BAFO timeline',
    contextLink: 'Source · SRC-AMS-2026 · BAFO tab · Vendor B evaluation',
  },
  {
    queueId: 'q-02',
    gapId: 'ca-001-gate',
    label: 'CDP P3 Design gate clearance',
    needed:
      'CDP P3 Design gate must clear before AMS vendor can be selected without integration risk',
    responsibleParty: 'CDP Programme Lead / architecture review',
    patternId: 'CDP-AMS-ARCH-001',
    patternTitle: 'AMS vendor selection constrains CDP architecture',
    patternApplicationStatus: 'active',
    urgency: 'critical',
    deadlineHint: 'Before AMS vendor selection (May 5 2026)',
    contextLink: 'Programs · APX-CDP-2026 · P3 Design gate criteria',
  },

  // ── High ─────────────────────────��──────────────────────────────────────────
  {
    queueId: 'q-03',
    gapId: 'bg-001-vc-scope',
    label: 'Vendor C scope confirmation',
    needed: 'Scope confirmation from Vendor C before BAFO close',
    responsibleParty: 'Vendor C / Procurement Lead',
    patternId: 'BAFO-GOVERNANCE-001',
    patternTitle: 'BAFO as governed evidence sequence',
    patternApplicationStatus: 'active',
    urgency: 'high',
    deadlineHint: 'Before BAFO close (May 5 2026)',
    contextLink: 'Source · SRC-AMS-2026 · BAFO tab · Vendor C scope validation',
  },
  {
    queueId: 'q-04',
    gapId: 'pq-001-tier2',
    label: 'Vendor A itemised cost split (YR1 steady-state vs. transition)',
    needed: 'Itemised YR1 steady-state vs. transition cost split from Vendor A',
    responsibleParty: 'Vendor A via BAFO clarification round',
    patternId: 'PROPOSAL-QUALITY-001',
    patternTitle: 'Proposal completeness as decision input',
    patternApplicationStatus: 'active',
    urgency: 'high',
    deadlineHint: 'Before BAFO close (May 5 2026)',
    contextLink: 'Source · SRC-AMS-2026 · BAFO tab · Vendor A evaluation',
  },
  {
    queueId: 'q-05',
    gapId: 'av-001-exit-clause',
    label: 'AI vendor exit clause terms in AMS BAFO submissions',
    needed: 'Exit clause terms for AI tooling — must be explicit in vendor BAFO responses',
    responsibleParty: 'Legal / Procurement Lead',
    patternId: 'AI-VENDOR-LOCK-001',
    patternTitle: 'AI vendor lock-in risk in AMS contracts',
    patternApplicationStatus: 'candidate',
    urgency: 'high',
    deadlineHint: 'Before BAFO close (May 5 2026)',
    contextLink: 'Source · SRC-AMS-2026 · BAFO tab · Contract terms',
  },

  // ── Medium ─────────────────────────────────��───────────────��─────────────────
  {
    queueId: 'q-06',
    gapId: 'av-001-scope',
    label: 'Explicit AI tooling commitment per AMS vendor',
    needed: 'Explicit mapping of AI tooling commitment per vendor in BAFO submissions',
    responsibleParty: 'Procurement Lead — BAFO review',
    patternId: 'AI-VENDOR-LOCK-001',
    patternTitle: 'AI vendor lock-in risk in AMS contracts',
    patternApplicationStatus: 'candidate',
    urgency: 'medium',
    deadlineHint: 'Before vendor selection decision',
    contextLink: null,
  },
  {
    queueId: 'q-07',
    gapId: 'tr-001-phase2-ktp',
    label: 'Phase 2 KTP milestone schedule from incumbent',
    needed: 'Knowledge transfer plan Phase 2 milestone schedule from incumbent vendor',
    responsibleParty: 'Incumbent AMS Vendor / Programme Lead',
    patternId: 'TRANSITION-RISK-001',
    patternTitle: 'AMS transition risk — incumbent knowledge gap',
    patternApplicationStatus: 'monitoring',
    urgency: 'medium',
    deadlineHint: 'Before contract award (June 2026)',
    contextLink: null,
  },
  {
    queueId: 'q-08',
    gapId: 'tr-001-incumbent-expiry',
    label: 'Incumbent contract expiry / extension terms',
    needed: 'Formal documentation of incumbent contract expiry and extension option terms',
    responsibleParty: 'Legal / Contract Management',
    patternId: 'TRANSITION-RISK-001',
    patternTitle: 'AMS transition risk — incumbent knowledge gap',
    patternApplicationStatus: 'monitoring',
    urgency: 'medium',
    deadlineHint: 'Before contract award (June 2026)',
    contextLink: null,
  },
];

// ─── Main builder ─────────────────────────────────────────────────────────────

/**
 * Build the evidence gap queue view for the Apex Retail engagement.
 *
 * Returns all open evidence gaps across active, candidate, and monitoring
 * patterns, prioritized critical → high → medium → low.
 *
 * Deterministic: derives from fixture data only.
 */
export function buildEvidenceGapQueueView(): EvidenceGapQueueView {
  const items = GAP_QUEUE_ITEMS;
  const criticalCount = items.filter((i) => i.urgency === 'critical').length;
  const highCount = items.filter((i) => i.urgency === 'high').length;
  const mediumCount = items.filter((i) => i.urgency === 'medium').length;
  const lowCount = items.filter((i) => i.urgency === 'low').length;

  return {
    totalGaps: items.length,
    items,
    summary: {
      totalGaps: items.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
    },
    atlasSummary:
      'Eight evidence gaps remain open across 5 patterns. Two critical gaps ' +
      '(Vendor B SOC-2 and CDP P3 Design gate) block the AMS vendor selection decision — ' +
      'both must close before May 5. Three high-urgency gaps close with BAFO submissions. ' +
      'Three medium-urgency gaps are monitoring items for post-selection transition planning.',
    honestDisclaimer:
      'Deterministic seed · Gap queue reflects fixture evidence gaps for the Apex Retail engagement. ' +
      'Live gap tracking, assignment, and evidence upload are handled by the ' +
      'intelligence fabric evidence management module.',
    deterministicSeed: true,
  };
}

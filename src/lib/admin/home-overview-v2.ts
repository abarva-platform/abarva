// View-builder for the v2 Admin overview · adds the two
// sections the wireframe introduces beyond the existing
// `composeOverviewBlocks` output: Readiness across modules
// (Section 01) and Admin action surfaces (Section 05).
//
// Section 02 (Steward orientation), 03 (Action queue), and 04
// (Recent activity) reuse OverviewBlocks unchanged.
//
// Per founder approval 2026-05-08 · ships in PR-H12.

import type { InventorySegmentRollup } from '@/lib/admin/setup-acts-registry';
import {
  panelFootFromGrounding,
  panelStatusFromGrounding,
  type CapabilityGrounding,
} from '@/lib/admin/broker/capability-grounding-broker';

export type ReadinessBucket = 'teal' | 'amber' | 'red';

export interface ModuleReadinessV2 {
  name: string;
  modulePrefix: string;          // e.g. "Module 01" — the mono eyebrow
  pct: number;                   // 0–100
  bucket: ReadinessBucket;
  note: string;
  href: string;
}

export interface PanelStatusCardCta {
  /** Short verb label rendered as a ghost button in the card foot. */
  label: string;
  /** Destination href (typically a `?param=value` deep-link). */
  href: string;
  /** PostHog event name fired by the panel-card client wrapper on click. */
  telemetryEvent?: string;
}

export interface PanelStatusCard {
  num: string;                   // "01"
  name: string;
  status: 'ready' | 'attn' | 'locked';
  desc: string;
  foot: string;
  href: string;
  /**
   * Optional inline call-to-action rendered alongside the foot text.
   * Introduced in Wave 2 PR-6 so the Connectors panel can offer
   * "Add connector" directly from the Setup landing — verdict §4
   * Persona A friction (no upload affordance from the landing).
   * Kept optional so other panels stay pure status-cards.
   */
  cta?: PanelStatusCardCta;
}

export interface HomeOverviewV2Extras {
  readiness: ReadonlyArray<ModuleReadinessV2>;
  panels: ReadonlyArray<PanelStatusCard>;
  /** Compact derived counters for the masthead tag pill row. */
  masthead: {
    segmentsLoaded: number;
    totalRecords: number;
    panelsAttention: number;
    refreshedLabel: string | null;
  };
}

export interface ComposeHomeV2Input {
  segments: ReadonlyArray<InventorySegmentRollup>;
  programsCount: number;
  programsP6Count: number;
  sourceEventsCount: number;
  sourceEventsAtRiskCount: number;
  initiativesCount: number;
  initiativesAtRiskCount: number;
  lastIngestedAt?: string | null;
  /**
   * Wave 3 PR-1 · Optional live capability grounding rollup.  When
   * present, the Section 05 Agent Readiness panel renders honest
   * per-agent levels derived from substrate (and, eventually,
   * evaluator scores).  When omitted, the panel falls back to a
   * conservative substrate-only heuristic so older call sites and
   * tests don't break.
   */
  capabilityGrounding?: CapabilityGrounding | null;
  /**
   * PRE-W4-PR-5 fix #7 (persona report §9 fix #7).
   *
   * When true, the tenant has no substrate loaded yet. The four
   * Module readiness percentages would all evaluate to ≤30% (red
   * bucket) — punishing a brand-new tenant with an all-red
   * "Readiness across modules" section. In this case we emit an
   * empty `readiness` array so HomeOverviewV2 can render an
   * editorial placeholder ("Readiness will compute when your first
   * dataset lands.") instead of four red bars.
   */
  emptyTenant?: boolean;
}

function bucketFor(pct: number): ReadinessBucket {
  if (pct >= 80) return 'teal';
  if (pct >= 50) return 'amber';
  return 'red';
}

function relativeTimeLabel(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  const ms = Date.now() - t;
  const min = Math.round(ms / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  if (d < 7) return `${d}d ago`;
  return `${Math.round(d / 7)}w ago`;
}

export function composeHomeV2Extras(input: ComposeHomeV2Input): HomeOverviewV2Extras {
  const { segments } = input;
  const segMature = segments.filter((s) => s.healthState === 'complete' || s.healthState === 'mature').length;
  const segTotal = segments.length;
  const segPct = segTotal > 0 ? Math.round((segMature / segTotal) * 100) : 0;

  // Tower readiness — count of programs in flight, gated to <=95
  const towerPct = input.programsCount > 0
    ? Math.min(95, 50 + Math.round((input.programsCount / 25) * 30))
    : 0;
  // Source readiness — events count + at-risk penalty
  const sourcePct = input.sourceEventsCount > 0
    ? Math.max(45, 80 - input.sourceEventsAtRiskCount * 8)
    : 30;
  // Intelligence readiness — substrate maturity proxy
  const intelPct = segPct;
  // Strategic Moves — initiatives + at-risk penalty
  const movesPct = input.initiativesCount > 0
    ? Math.max(40, 75 - input.initiativesAtRiskCount * 6)
    : 30;

  // PRE-W4-PR-5 fix #7: empty tenants get an empty readiness array
  // so HomeOverviewV2 renders an editorial placeholder instead of
  // four red bars. Non-empty tenants get the live module rollups.
  const readiness: ModuleReadinessV2[] = input.emptyTenant
    ? []
    : [
        {
          name: 'Tower',
          modulePrefix: 'Module 01',
          pct: towerPct,
          bucket: bucketFor(towerPct),
          note: `${input.programsCount} programs observed${input.programsP6Count > 0 ? ` · ${input.programsP6Count} in P6 handoff` : ''}. Atlas synthesis grounded.`,
          href: '/tower',
        },
        {
          name: 'Source',
          modulePrefix: 'Module 02',
          pct: sourcePct,
          bucket: bucketFor(sourcePct),
          note: `${input.sourceEventsCount} source events live${input.sourceEventsAtRiskCount > 0 ? ` · ${input.sourceEventsAtRiskCount} at risk` : ''}. Vendor and contract substrate available.`,
          href: '/source',
        },
        {
          name: 'Intelligence',
          modulePrefix: 'Module 03',
          pct: intelPct,
          bucket: bucketFor(intelPct),
          note: `${segMature} of ${segTotal} segments mature. Pattern-to-Move funnel ready for origination.`,
          href: '/intelligence',
        },
        {
          name: 'Strategic Moves',
          modulePrefix: 'Module 04',
          pct: movesPct,
          bucket: bucketFor(movesPct),
          note: `${input.initiativesCount} initiatives in registry${input.initiativesAtRiskCount > 0 ? ` · ${input.initiativesAtRiskCount} at risk` : ''}. Gate criteria coverage informed.`,
          href: '/strategic-moves',
        },
      ];

  const sparseOrPartial = segments.filter((s) => s.healthState !== 'complete' && s.healthState !== 'mature').length;
  const totalRecords = segments.reduce((acc, s) => acc + (s.recordCount ?? 0), 0);

  const panels: PanelStatusCard[] = [
    { num: '01', name: 'Data Trust',           status: sparseOrPartial > 5 ? 'attn' : 'ready',                                 desc: 'Substrate inventory, segment health, provenance of every record.',   foot: `${segments.length} segments · ${totalRecords.toLocaleString()} records`, href: '/admin/data-trust' },
    // PRE-W4-PR-5 fix #2 (persona report §9 fix #2 + audit verdict
    // §5.5): panel #02 ("AI Initiatives") used to link at
    // /home/ai-initiatives, which moved out of the Admin setup
    // overview. The Intelligence wave owns that Home insight surface;
    // this Admin overview keeps only setup, access, readiness, and
    // audit actions. The two following panels keep their original
    // numbers (03 Connectors, 04 Users & Access) so historical deep
    // links and design vocabulary remain stable.
    {
      num: '03',
      name: 'Connectors',
      status: 'attn',
      desc: 'Live integrations: ServiceNow, Workday, Slack, vendor systems.',
      foot: 'Live state in panel · audit shows recent ingest',
      href: '/admin/connectors',
      // Wave 2 PR-6 · onboarding entry point. First-time tenant
      // admin can add a connector without navigating away from the
      // landing — opens the AddConnectorPanel drawer on the
      // Connectors page via the `?add=open` query.
      cta: {
        label: 'Add connector',
        href: '/admin/connectors?add=open',
        telemetryEvent: 'connector_onboarding_landing_cta_clicked',
      },
    },
    { num: '04', name: 'Users & Access',       status: 'ready',                                                                 desc: 'RLS-enforced policy, role assignments, SME write permissions.',         foot: 'Roles wired · per-user RLS pilot ready', href: '/admin/users-access' },
    // Section 05 · Agent Readiness — verdict §3 Wave 3 PR-1.
    // When the capability-grounding broker is wired in, the foot
    // and status come from live per-(agent, family) grounding.
    // When it isn't, fall back to the conservative segment-maturity
    // heuristic and label the fallback `· estimated` so the surface
    // stays honest (memory · feedback_no_demo_thinking.md).
    {
      num: '05',
      name: 'Agent Readiness',
      status: input.capabilityGrounding
        ? panelStatusFromGrounding(input.capabilityGrounding)
        : segMature < 18 ? 'attn' : 'ready',
      desc: 'Per-agent grounding scores: Sentinel, Atlas, Nexus, Steward.',
      foot: input.capabilityGrounding
        ? panelFootFromGrounding(input.capabilityGrounding)
        : `Sentinel ${segMature >= 18 ? 'L3' : 'L2'} · 3 others avg L2 · estimated`,
      href: '/admin/agent-readiness',
    },
    { num: '06', name: 'Production Readiness', status: 'attn',                                                                  desc: 'SSO, audit trail, change-control posture, pen-test status.',            foot: '4 / 6 gates clear', href: '/admin/production-readiness' },
    // Wave 3 PR-4 (2026-05-30) · panel-07 wired to /admin/compliance
    // (posture digest: SOC 2 · GDPR · DPA · Breach SLA). Status is
    // 'attn' — most cards are in_progress / committed; nothing is
    // certified yet. Honest, not 'ready'. Per verdict §3 + §7 W3-PR-4.
    { num: '07', name: 'Compliance',           status: 'attn',                                                                  desc: 'SOC 2, GDPR, DPA, breach-notification SLA — pilot-stage posture.',     foot: 'In progress · readiness underway', href: '/admin/compliance' },
    { num: '08', name: 'Activity Log',         status: 'ready',                                                                 desc: 'Full audit trail: who did what, when, on which substrate.',             foot: '30-day rolling · /admin/audit', href: '/admin/audit' },
    { num: '09', name: 'Ops Console',          status: 'attn',                                                                  desc: 'Governed re-index, migration dry-run, backfill, quarantine, and audit-export paths.', foot: 'Approval gated · no raw execution', href: '/admin/ops' },
  ];

  return {
    readiness,
    panels,
    masthead: {
      segmentsLoaded: segments.length,
      totalRecords,
      panelsAttention: panels.filter((p) => p.status === 'attn').length,
      refreshedLabel: relativeTimeLabel(input.lastIngestedAt),
    },
  };
}

// View-builder for the v2 Setup/Home overview · adds the two
// sections the wireframe introduces beyond the existing
// `composeOverviewBlocks` output: Readiness across modules
// (Section 01) and Setup panels (Section 05).
//
// Section 02 (Steward orientation), 03 (Action queue), and 04
// (Recent activity) reuse OverviewBlocks unchanged.
//
// Per founder approval 2026-05-08 · ships in PR-H12.

import type { InventorySegmentRollup } from '@/lib/admin/setup-acts-registry';

export type ReadinessBucket = 'teal' | 'amber' | 'red';

export interface ModuleReadinessV2 {
  name: string;
  modulePrefix: string;          // e.g. "Module 01" — the mono eyebrow
  pct: number;                   // 0–100
  bucket: ReadinessBucket;
  note: string;
  href: string;
}

export interface PanelStatusCard {
  num: string;                   // "01"
  name: string;
  status: 'ready' | 'attn' | 'locked';
  desc: string;
  foot: string;
  href: string;
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

  const readiness: ModuleReadinessV2[] = [
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
    { num: '01', name: 'Data Trust',           status: sparseOrPartial > 5 ? 'attn' : 'ready',                                 desc: 'Substrate inventory, segment health, provenance of every record.',   foot: `${segments.length} segments · ${totalRecords.toLocaleString()} records`, href: '/home/data-trust' },
    { num: '02', name: 'AI Initiatives',       status: input.initiativesAtRiskCount > 0 ? 'attn' : 'ready',                    desc: 'Registry of every AI bet — stage, owner, confidence, value posture.',  foot: `${input.initiativesCount} initiatives${input.initiativesAtRiskCount > 0 ? ` · ${input.initiativesAtRiskCount} at risk` : ''}`, href: '/home/ai-initiatives' },
    { num: '03', name: 'Connectors',           status: 'attn',                                                                  desc: 'Live integrations: ServiceNow, Workday, Slack, vendor systems.',        foot: 'Live state in panel · audit shows recent ingest', href: '/home/connectors' },
    { num: '04', name: 'Users & Access',       status: 'ready',                                                                 desc: 'RLS-enforced policy, role assignments, SME write permissions.',         foot: 'Roles wired · per-user RLS pilot ready', href: '/home/users-access' },
    { num: '05', name: 'Agent Readiness',      status: segMature < 18 ? 'attn' : 'ready',                                       desc: 'Per-agent grounding scores: Sentinel, Atlas, Nexus, Steward.',          foot: `Sentinel ${segMature >= 18 ? 'L3' : 'L2'} · others L2`, href: '/home/agent-readiness' },
    { num: '06', name: 'Production Readiness', status: 'attn',                                                                  desc: 'SSO, audit trail, change-control posture, pen-test status.',            foot: '4 / 6 gates clear', href: '/home/production-readiness' },
    { num: '07', name: 'Compliance',           status: 'locked',                                                                desc: 'SOC 2, GDPR, industry frameworks. Locked behind Production gate 5.',    foot: 'Prereq: Pen-test signed', href: '#' },
    { num: '08', name: 'Activity Log',         status: 'ready',                                                                 desc: 'Full audit trail: who did what, when, on which substrate.',             foot: '30-day rolling · /admin/audit', href: '/admin/audit' },
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

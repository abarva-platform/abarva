'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import type { ProgramFullState } from '@/lib/programs/types.ui';
import { getAllPrograms } from '@/lib/programs/mock';
import { DataGrid, type DataGridColumn, type DataGridFilter, type SavedView } from '@/components/grid/DataGrid';
import { COLORS } from '@/lib/design-system';

// Fix Spec v4 §4 · ProgramsGrid · first consumer of the DataGrid primitive.
// Replaces the existing scrolling PortfolioIndex row for the scan-many
// use case (tenant manager asks "show me everything"). Preserves the
// PortfolioIndex per-segment inbox layout · this grid is additive.

// Phase labels match the canonical spec-phase vocabulary used by every
// program detail page — so the home card and detail page agree (C2-06).
// The input `currentPhase` is app-phase (0-4) per SPEC_PHASE_TO_APP_PHASE;
// we map to spec-phase (1-5) for display. Labels mirror the seed plan's
// phase names (Intake / Diagnosis / Design & Decision / Build & Deliver /
// Outcome) rather than the legacy Start/Diagnose/Design/Execute/Verify set
// that only existed on this one surface.
const PHASE_LABELS: Record<number, string> = {
  0: 'P1 · Intake',
  1: 'P2 · Diagnosis',
  2: 'P3 · Design & Decision',
  3: 'P4 · Build & Deliver',
  4: 'P5 · Outcome',
};

const STATUS_TO_LABEL: Record<string, string> = {
  active: 'Active',
  at_risk: 'At risk',
  pilot_gate_pending: 'Pilot gate pending',
  complete: 'Complete',
  settlement_ready: 'Settlement-ready',
  in_progress: 'Active',
  not_started: 'Not started',
};

const STATUS_TO_TONE: Record<string, 'teal' | 'amber' | 'red' | 'muted'> = {
  active: 'teal',
  complete: 'teal',
  settlement_ready: 'teal',
  at_risk: 'amber',
  pilot_gate_pending: 'amber',
  blocked: 'red',
  not_started: 'muted',
};

function fmtUsd(usd: number | null | undefined): string {
  if (usd == null || !Number.isFinite(usd)) return '—';
  if (usd >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(1)}B`;
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1_000) return `$${Math.round(usd / 1_000)}K`;
  return `$${usd}`;
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
}

function relTime(d: Date | null | undefined): string {
  if (!d) return '—';
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) {
    const hours = Math.floor(diff / 3_600_000);
    return hours < 1 ? 'just now' : `${hours}h ago`;
  }
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

interface ProgramRow {
  id: string;
  name: string;
  tenant: string;
  phase: number;
  phaseLabel: string;
  status: string;
  statusLabel: string;
  statusTone: 'teal' | 'amber' | 'red' | 'muted';
  sponsor: string | null;
  sponsorTitle: string | null;
  patterns: string[];
  lastUpdated: Date;
  outcomeBaseline: number | null;
  outcomeCurrent: number | null;
  budget: number | null;
  pilotGateDate: Date | null;
  archetype: string;
}

function toRow(p: ProgramFullState): ProgramRow {
  // Derive a status signal from gateStatus + currentPhase + phaseStatus.
  // ProgramFullState.phaseStatus = 'active' | 'complete' | 'blocked' |
  // 'awaiting_gate' (see src/lib/programs/types.ts). Map to the grid's
  // demo-facing status vocabulary.
  let status = 'active';
  if (p.gateStatus === 'blocked' || p.phaseStatus === 'blocked') status = 'at_risk';
  else if (p.gateStatus === 'cleared' && p.currentPhase >= 4) status = 'complete';
  else if (p.gateStatus === 'pending' && p.phaseStatus === 'awaiting_gate') status = 'pilot_gate_pending';

  const lastActivity = p.activity.length > 0
    ? new Date(Math.max(...p.activity.map((a) => a.at.getTime())))
    : new Date();

  return {
    id: p.id,
    name: p.name,
    tenant: p.clientName,
    phase: p.currentPhase,
    phaseLabel: PHASE_LABELS[p.currentPhase] ?? `Phase ${p.currentPhase}`,
    status,
    statusLabel: STATUS_TO_LABEL[status] ?? status,
    statusTone: STATUS_TO_TONE[status] ?? 'muted',
    sponsor: p.sponsorPerson?.name ?? null,
    sponsorTitle: p.sponsorPerson?.title ?? null,
    patterns: p.patternName ? [p.patternName] : [],
    lastUpdated: lastActivity,
    outcomeBaseline: null, // no baseline field in ProgramFullState yet · placeholder for Outcome Intelligence wiring
    outcomeCurrent: null,
    budget: null, // Business Case budget comes from per-phase deliverables · surfaced when Fix #5 lands
    pilotGateDate: null,
    archetype: p.archetype,
  };
}

function PhaseChip({ phase, label }: { phase: number; label: string }) {
  // Simple chip · teal when active, muted for queued, amber when blocked.
  const tone = phase >= 3 ? COLORS.teal : phase >= 1 ? 'rgba(45,212,200,0.85)' : 'rgba(245,245,240,0.65)';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '5px 12px',
        background: 'rgba(45,212,200,0.1)',
        border: '0.5px solid rgba(45,212,200,0.35)',
        borderRadius: 999,
        color: tone,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
  );
}

function StatusBadge({ row }: { row: ProgramRow }) {
  const tone =
    row.statusTone === 'teal' ? COLORS.teal
      : row.statusTone === 'amber' ? COLORS.amber
      : row.statusTone === 'red' ? COLORS.red
      : 'rgba(245,245,240,0.55)';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 12,
        fontWeight: 600,
        color: tone,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: tone }} />
      {row.statusLabel}
    </span>
  );
}

function TenantBadge({ tenant }: { tenant: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        background: 'rgba(255,255,255,0.05)',
        border: '0.5px solid rgba(255,255,255,0.12)',
        borderRadius: 6,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 11,
        color: 'rgba(245,245,240,0.7)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}
    >
      {tenant}
    </span>
  );
}

function PatternChips({ patterns }: { patterns: string[] }) {
  if (patterns.length === 0) return <span style={{ color: 'rgba(245,245,240,0.4)' }}>—</span>;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {patterns.slice(0, 2).map((p) => (
        <span
          key={p}
          style={{
            padding: '2px 6px',
            background: 'rgba(155,109,255,0.08)',
            border: '0.5px solid rgba(155,109,255,0.25)',
            borderRadius: 4,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            color: '#B49BFF',
            letterSpacing: '0.05em',
          }}
        >
          {p.slice(0, 28)}
        </span>
      ))}
      {patterns.length > 2 ? <span style={{ fontSize: 12, color: 'rgba(245,245,240,0.5)' }}>+{patterns.length - 2}</span> : null}
    </div>
  );
}

function OutcomeSparkline({ baseline, current }: { baseline: number | null; current: number | null }) {
  if (baseline == null || current == null) {
    return <span style={{ fontSize: 13, color: 'rgba(245,245,240,0.45)', fontStyle: 'italic' }}>baseline pending</span>;
  }
  const pct = baseline !== 0 ? Math.round(((current - baseline) / baseline) * 100) : 0;
  const sign = pct >= 0 ? '+' : '';
  const tone = pct >= 10 ? COLORS.teal : pct >= 0 ? COLORS.amber : COLORS.red;
  return (
    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: tone, fontWeight: 600 }}>
      {sign}{pct}%
    </span>
  );
}

export function ProgramsGrid() {
  const router = useRouter();

  const data: ProgramRow[] = useMemo(() => getAllPrograms().map(toRow), []);

  // Derive distinct-value option lists from data so filters stay in sync.
  const tenantOptions = useMemo(
    () => Array.from(new Set(data.map((d) => d.tenant))).map((t) => ({ value: t, label: t })),
    [data],
  );

  const columns: DataGridColumn<ProgramRow>[] = [
    {
      key: 'name',
      label: 'Program',
      sortable: true,
      defaultVisible: true,
      render: (_v, row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <span style={{ fontWeight: 600, fontSize: 19, lineHeight: 1.2, color: COLORS.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {row.name}
          </span>
          <TenantBadge tenant={row.tenant} />
        </div>
      ),
    },
    {
      key: 'phase',
      label: 'Phase',
      sortable: true,
      defaultVisible: true,
      accessor: (r) => r.phase,
      render: (_v, row) => <PhaseChip phase={row.phase} label={row.phaseLabel} />,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      defaultVisible: true,
      accessor: (r) => r.statusLabel,
      render: (_v, row) => <StatusBadge row={row} />,
    },
    {
      key: 'sponsor',
      label: 'Sponsor',
      defaultVisible: true,
      render: (_v, row) =>
        row.sponsor ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 15 }}>{row.sponsor}</span>
            {row.sponsorTitle ? (
              <span style={{ fontSize: 13, color: 'rgba(245,245,240,0.55)' }}>{row.sponsorTitle}</span>
            ) : null}
          </div>
        ) : (
          <span style={{ color: 'rgba(245,245,240,0.4)' }}>—</span>
        ),
    },
    {
      key: 'patterns',
      label: 'Active patterns',
      defaultVisible: true,
      render: (_v, row) => <PatternChips patterns={row.patterns} />,
    },
    {
      key: 'lastUpdated',
      label: 'Last updated',
      sortable: true,
      defaultVisible: true,
      accessor: (r) => r.lastUpdated.getTime(),
      render: (_v, row) => (
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'rgba(245,245,240,0.65)' }}>
          {relTime(row.lastUpdated)}
        </span>
      ),
    },
    {
      key: 'outcomeMetric',
      label: 'Outcome vs. baseline',
      defaultVisible: true,
      render: (_v, row) => <OutcomeSparkline baseline={row.outcomeBaseline} current={row.outcomeCurrent} />,
    },
    {
      key: 'budget',
      label: 'Budget Y1',
      sortable: true,
      defaultVisible: false,
      toggleable: true,
      accessor: (r) => r.budget ?? -1,
      render: (_v, row) => (
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
          {fmtUsd(row.budget)}
        </span>
      ),
      align: 'right',
    },
    {
      key: 'pilotGateDate',
      label: 'Pilot gate',
      sortable: true,
      defaultVisible: false,
      toggleable: true,
      accessor: (r) => (r.pilotGateDate ? r.pilotGateDate.getTime() : Number.MAX_SAFE_INTEGER),
      render: (_v, row) => (
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
          {fmtDate(row.pilotGateDate)}
        </span>
      ),
    },
  ];

  const filters: DataGridFilter<ProgramRow>[] = [
    {
      key: 'phase',
      label: 'Phase',
      type: 'multiselect',
      options: [
        { value: '0', label: 'P1 · Intake' },
        { value: '1', label: 'P2 · Diagnosis' },
        { value: '2', label: 'P3 · Design & Decision' },
        { value: '3', label: 'P4 · Build & Deliver' },
        { value: '4', label: 'P5 · Outcome' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      type: 'multiselect',
      options: [
        { value: 'Active', label: 'Active' },
        { value: 'At risk', label: 'At risk' },
        { value: 'Pilot gate pending', label: 'Pilot gate pending' },
        { value: 'Complete', label: 'Complete' },
        { value: 'Settlement-ready', label: 'Settlement-ready' },
      ],
    },
    {
      key: 'tenant',
      label: 'Tenant',
      type: 'multiselect',
      options: tenantOptions,
    },
    {
      key: 'name',
      label: 'Search',
      type: 'search',
    },
    {
      key: '_atRisk',
      label: 'At risk only',
      type: 'toggle',
      predicate: (row, active) => (active ? row.statusTone !== 'teal' : true),
    },
  ];

  const savedViews: SavedView[] = [
    { name: 'All programs', filterState: {} },
    { name: 'At risk', filterState: { status: ['At risk'] } },
    { name: 'Pilot gate pending', filterState: { status: ['Pilot gate pending'] } },
    { name: 'Settlement-ready', filterState: { status: ['Settlement-ready'] } },
    {
      name: 'Recently updated',
      filterState: {},
      sortKey: 'lastUpdated',
      sortDir: 'desc',
    },
  ];

  return (
    <DataGrid
      data={data}
      columns={columns}
      filters={filters}
      savedViews={savedViews}
      rowKey={(r) => r.id}
      ariaLabel="All programs"
      onRowClick={(r) => router.push(`/programs/${r.id}`)}
      pageSize={25}
      emptyMessage="No programs match the current filters."
      mobileCard={(r) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontWeight: 600, fontSize: 18 }}>{r.name}</span>
            <StatusBadge row={r} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <PhaseChip phase={r.phase} label={r.phaseLabel} />
            <TenantBadge tenant={r.tenant} />
          </div>
          <div style={{ fontSize: 14, color: 'rgba(245,245,240,0.7)' }}>
            {r.sponsor ?? 'No sponsor'}{r.sponsorTitle ? ` · ${r.sponsorTitle}` : ''}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(245,245,240,0.55)' }}>
            Updated {relTime(r.lastUpdated)}
          </div>
        </div>
      )}
    />
  );
}

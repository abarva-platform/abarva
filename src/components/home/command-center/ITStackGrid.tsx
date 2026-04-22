'use client';

import { DataGrid, type DataGridColumn, type DataGridFilter, type SavedView } from '@/components/grid/DataGrid';
import { getITStack, type ITStackRow, type SystemHealth } from '@/lib/home/tenant-inventory';
import { COLORS } from '@/lib/design-system';

// Fix Spec v4 §10 · IT Stack snapshot grid · authenticated home.

interface Props {
  tenantKey: string | null;
  limit?: number;
}

function fmtUsd(usd: number): string {
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1_000) return `$${Math.round(usd / 1_000)}K`;
  return `$${usd}`;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
}

const HEALTH_TONE: Record<SystemHealth, string> = {
  Healthy: COLORS.teal,
  Underutilized: 'rgba(245,245,240,0.6)',
  Overutilized: COLORS.amber,
  'At risk': COLORS.red,
};

function HealthChip({ health }: { health: SystemHealth }) {
  const tone = HEALTH_TONE[health];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: tone,
      }}
    >
      <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: tone }} />
      {health}
    </span>
  );
}

export function ITStackGrid({ tenantKey, limit }: Props) {
  const all = getITStack(tenantKey);
  const data = typeof limit === 'number' ? all.slice(0, limit) : all;

  const columns: DataGridColumn<ITStackRow>[] = [
    { key: 'name', label: 'System', sortable: true, defaultVisible: true, render: (v, row) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontWeight: 500 }}>{row.name}</span>
        <span style={{ fontSize: 11, color: 'rgba(245,245,240,0.55)' }}>{row.vendor}</span>
      </div>
    ) },
    { key: 'category', label: 'Category', sortable: true, defaultVisible: true },
    { key: 'segment', label: 'Segment', defaultVisible: true, render: (v) => (
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(245,245,240,0.8)', letterSpacing: '0.04em' }}>{String(v)}</span>
    ) },
    { key: 'budgetAnnual', label: 'Budget (Y1)', sortable: true, defaultVisible: true, align: 'right', render: (v) => (
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{fmtUsd(Number(v))}</span>
    ) },
    { key: 'renewalDate', label: 'Renewal', sortable: true, defaultVisible: true, accessor: (r) => r.renewalDate.getTime(), render: (v, row) => (
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(245,245,240,0.75)' }}>{fmtDate(row.renewalDate)}</span>
    ) },
    { key: 'health', label: 'Health', defaultVisible: true, render: (v) => <HealthChip health={v as SystemHealth} /> },
    { key: 'aiCapability', label: 'AI', defaultVisible: false, toggleable: true, render: (v) => (
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: String(v) === 'None' ? 'rgba(245,245,240,0.5)' : COLORS.teal }}>{String(v)}</span>
    ) },
    { key: 'integrations', label: 'Integrations', defaultVisible: false, toggleable: true, sortable: true, align: 'right' },
  ];

  const filters: DataGridFilter<ITStackRow>[] = [
    { key: 'category', label: 'Category', type: 'multiselect',
      options: ['Data','Analytics','AI/ML','CRM','ERP','Finance','HR','IT Ops','Security','Marketing','Commerce','Supply Chain'].map((v) => ({ value: v, label: v })) },
    { key: 'segment', label: 'Segment', type: 'multiselect',
      options: ['Tier 1 · Strategic','Tier 2 · Operational','Tier 3 · Tactical','Sunset candidate'].map((v) => ({ value: v, label: v })) },
    { key: 'health', label: 'Health', type: 'multiselect',
      options: ['Healthy','Underutilized','Overutilized','At risk'].map((v) => ({ value: v, label: v })) },
    { key: 'aiCapability', label: 'AI capability', type: 'multiselect',
      options: ['Native','Extension','None'].map((v) => ({ value: v, label: v })) },
    { key: '_atRisk', label: 'At risk only', type: 'toggle',
      predicate: (row, active) => (active ? row.health === 'At risk' : true) },
  ];

  const savedViews: SavedView[] = [
    { name: 'All systems', filterState: {} },
    { name: 'All Tier 1', filterState: { segment: ['Tier 1 · Strategic'] } },
    { name: 'Up for renewal · 90d', filterState: {}, sortKey: 'renewalDate', sortDir: 'asc' },
    { name: 'AI-capable systems', filterState: { aiCapability: ['Native', 'Extension'] } },
    { name: 'Underutilized · sunset candidates', filterState: { segment: ['Sunset candidate'], health: ['Underutilized'] } },
    { name: 'At-risk systems', filterState: { health: ['At risk'] } },
  ];

  return (
    <DataGrid
      data={data}
      columns={columns}
      filters={filters}
      savedViews={savedViews}
      rowKey={(r) => r.id}
      ariaLabel="IT Stack snapshot"
      pageSize={20}
      mobileCard={(row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontWeight: 500, fontSize: 14 }}>{row.name}</span>
            <HealthChip health={row.health} />
          </div>
          <div style={{ fontSize: 12, color: 'rgba(245,245,240,0.7)' }}>
            {row.vendor} · {row.category}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(245,245,240,0.55)', letterSpacing: '0.05em' }}>
            {fmtUsd(row.budgetAnnual)} · renews {fmtDate(row.renewalDate)}
          </div>
        </div>
      )}
    />
  );
}

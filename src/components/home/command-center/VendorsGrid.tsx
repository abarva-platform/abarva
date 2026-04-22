'use client';

import { DataGrid, type DataGridColumn, type DataGridFilter, type SavedView } from '@/components/grid/DataGrid';
import { getVendors, type VendorRow, type VendorRisk, type AIExposure } from '@/lib/home/tenant-inventory';
import { COLORS } from '@/lib/design-system';

// Fix Spec v4 §11 · Vendors snapshot grid · authenticated home.

interface Props {
  tenantKey: string | null;
  limit?: number;
}

function fmtUsd(usd: number): string {
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1_000) return `$${Math.round(usd / 1_000)}K`;
  if (usd === 0) return '—';
  return `$${usd}`;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
}

const RISK_TONE: Record<VendorRisk, string> = {
  Low: COLORS.teal,
  Medium: COLORS.amber,
  High: '#FF6B4A',
  Critical: COLORS.red,
};

const AI_TONE: Record<AIExposure, string> = {
  None: 'rgba(245,245,240,0.55)',
  Indirect: 'rgba(245,245,240,0.8)',
  'Direct · sanctioned': COLORS.teal,
  'Direct · unsanctioned': COLORS.red,
};

function RiskChip({ risk }: { risk: VendorRisk }) {
  const tone = RISK_TONE[risk];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: tone }}>
      <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: tone }} />
      {risk}
    </span>
  );
}

export function VendorsGrid({ tenantKey, limit }: Props) {
  const all = getVendors(tenantKey);
  const data = typeof limit === 'number' ? all.slice(0, limit) : all;

  const columns: DataGridColumn<VendorRow>[] = [
    { key: 'name', label: 'Vendor', sortable: true, defaultVisible: true, render: (v) => (
      <span style={{ fontWeight: 500 }}>{String(v)}</span>
    ) },
    { key: 'category', label: 'Category', sortable: true, defaultVisible: true },
    { key: 'relationshipTier', label: 'Tier', defaultVisible: true, render: (v) => (
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(245,245,240,0.85)', letterSpacing: '0.04em' }}>{String(v)}</span>
    ) },
    { key: 'annualSpend', label: 'Annual spend', sortable: true, defaultVisible: true, align: 'right', render: (v) => (
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{fmtUsd(Number(v))}</span>
    ) },
    { key: 'contractEnd', label: 'Contract end', sortable: true, defaultVisible: true, accessor: (r) => r.contractEnd.getTime(), render: (v, row) => (
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(245,245,240,0.75)' }}>{fmtDate(row.contractEnd)}</span>
    ) },
    { key: 'relationshipOwner', label: 'Owner', defaultVisible: true, render: (v) => (
      <span style={{ fontSize: 12 }}>{String(v)}</span>
    ) },
    { key: 'riskScore', label: 'Risk', defaultVisible: true, render: (v) => <RiskChip risk={v as VendorRisk} /> },
    { key: 'aiExposure', label: 'AI exposure', defaultVisible: false, toggleable: true, render: (v) => (
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.08em', color: AI_TONE[v as AIExposure] }}>{String(v)}</span>
    ) },
  ];

  const filters: DataGridFilter<VendorRow>[] = [
    { key: 'category', label: 'Category', type: 'multiselect',
      options: ['Technology','Consulting','Agency','Supplier','Logistics','Legal','Finance','HR services'].map((v) => ({ value: v, label: v })) },
    { key: 'relationshipTier', label: 'Tier', type: 'multiselect',
      options: ['Strategic partner','Preferred','Standard','Transactional','Under review'].map((v) => ({ value: v, label: v })) },
    { key: 'riskScore', label: 'Risk', type: 'multiselect',
      options: ['Low','Medium','High','Critical'].map((v) => ({ value: v, label: v })) },
    { key: 'aiExposure', label: 'AI exposure', type: 'multiselect',
      options: ['None','Indirect','Direct · sanctioned','Direct · unsanctioned'].map((v) => ({ value: v, label: v })) },
  ];

  const savedViews: SavedView[] = [
    { name: 'All vendors', filterState: {} },
    { name: 'Strategic partners', filterState: { relationshipTier: ['Strategic partner'] } },
    { name: 'Up for renewal · 180d', filterState: {}, sortKey: 'contractEnd', sortDir: 'asc' },
    { name: 'High + Critical risk', filterState: { riskScore: ['High', 'Critical'] } },
    { name: 'Direct AI exposure', filterState: { aiExposure: ['Direct · sanctioned', 'Direct · unsanctioned'] } },
    { name: 'Under review', filterState: { relationshipTier: ['Under review'] } },
  ];

  return (
    <DataGrid
      data={data}
      columns={columns}
      filters={filters}
      savedViews={savedViews}
      rowKey={(r) => r.id}
      ariaLabel="Vendors snapshot"
      pageSize={20}
      mobileCard={(row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontWeight: 500, fontSize: 14 }}>{row.name}</span>
            <RiskChip risk={row.riskScore} />
          </div>
          <div style={{ fontSize: 12, color: 'rgba(245,245,240,0.7)' }}>
            {row.category} · {row.relationshipTier}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(245,245,240,0.55)' }}>
            {fmtUsd(row.annualSpend)} · ends {fmtDate(row.contractEnd)}
          </div>
        </div>
      )}
    />
  );
}

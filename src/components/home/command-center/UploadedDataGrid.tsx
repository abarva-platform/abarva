'use client';

import { DataGrid, type DataGridColumn, type DataGridFilter, type SavedView } from '@/components/grid/DataGrid';
import { getUploadedData, type UploadedDataRow, type DataQuality, type DataSensitivity, type DataCurrency } from '@/lib/home/tenant-inventory';
import { COLORS } from '@/lib/design-system';

// Fix Spec v4 §12 · Uploaded Data grid · authenticated home.

interface Props {
  tenantKey: string | null;
  limit?: number;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
}

const QUALITY_TONE: Record<DataQuality, string> = {
  'Audit-grade': COLORS.teal,
  High: 'rgba(45,212,200,0.75)',
  Medium: COLORS.amber,
  Low: '#FF6B4A',
  Unverified: 'rgba(245,245,240,0.55)',
};

const SENSITIVITY_TONE: Record<DataSensitivity, string> = {
  Public: 'rgba(245,245,240,0.55)',
  Internal: 'rgba(245,245,240,0.85)',
  Confidential: COLORS.amber,
  Restricted: COLORS.red,
};

const CURRENCY_TONE: Record<DataCurrency, string> = {
  Current: COLORS.teal,
  Stale: COLORS.amber,
  'Refresh required': COLORS.red,
};

export function UploadedDataGrid({ tenantKey, limit }: Props) {
  const all = getUploadedData(tenantKey);
  const data = typeof limit === 'number' ? all.slice(0, limit) : all;

  const columns: DataGridColumn<UploadedDataRow>[] = [
    { key: 'name', label: 'Asset', sortable: true, defaultVisible: true, render: (v) => (
      <span style={{ fontWeight: 500, fontSize: 13 }}>{String(v)}</span>
    ) },
    { key: 'type', label: 'Type', sortable: true, defaultVisible: true, render: (v) => (
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.08em', color: 'rgba(245,245,240,0.8)' }}>{String(v)}</span>
    ) },
    { key: 'sourceSystem', label: 'Source', defaultVisible: true, render: (v) => (
      <span style={{ fontSize: 12, color: 'rgba(245,245,240,0.8)' }}>{String(v)}</span>
    ) },
    { key: 'sourceOwner', label: 'Owner', defaultVisible: true, render: (v) => (
      <span style={{ fontSize: 12 }}>{String(v)}</span>
    ) },
    { key: 'qualityRating', label: 'Quality', defaultVisible: true, render: (v) => (
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: QUALITY_TONE[v as DataQuality] }}>{String(v)}</span>
    ) },
    { key: 'sensitivityMarking', label: 'Sensitivity', defaultVisible: true, render: (v) => (
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: SENSITIVITY_TONE[v as DataSensitivity] }}>{String(v)}</span>
    ) },
    { key: 'uploadedDate', label: 'Uploaded', sortable: true, defaultVisible: true, accessor: (r) => r.uploadedDate.getTime(), render: (v, row) => (
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(245,245,240,0.65)' }}>{fmtDate(row.uploadedDate)}</span>
    ) },
    { key: 'currencyStatus', label: 'Currency', defaultVisible: true, render: (v) => (
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.08em', color: CURRENCY_TONE[v as DataCurrency] }}>{String(v)}</span>
    ) },
    { key: 'citedByCount', label: 'Cited by', sortable: true, defaultVisible: true, align: 'right', render: (v) => (
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{Number(v) > 0 ? String(v) : '—'}</span>
    ) },
    { key: 'chainOfCustody', label: 'Custody', defaultVisible: false, toggleable: true, render: (v) => (
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.08em', color: v === 'Complete' ? COLORS.teal : COLORS.red }}>{String(v)}</span>
    ) },
  ];

  const filters: DataGridFilter<UploadedDataRow>[] = [
    { key: 'type', label: 'Type', type: 'multiselect',
      options: ['Financial record','Contract','Communication','System export','Document','Interview','Model output','Meeting notes'].map((v) => ({ value: v, label: v })) },
    { key: 'qualityRating', label: 'Quality', type: 'multiselect',
      options: ['Audit-grade','High','Medium','Low','Unverified'].map((v) => ({ value: v, label: v })) },
    { key: 'sensitivityMarking', label: 'Sensitivity', type: 'multiselect',
      options: ['Public','Internal','Confidential','Restricted'].map((v) => ({ value: v, label: v })) },
    { key: 'currencyStatus', label: 'Currency', type: 'multiselect',
      options: ['Current','Stale','Refresh required'].map((v) => ({ value: v, label: v })) },
    { key: 'chainOfCustody', label: 'Chain of custody incomplete only', type: 'toggle',
      predicate: (row, active) => (active ? row.chainOfCustody === 'Incomplete' : true) },
  ];

  const savedViews: SavedView[] = [
    { name: 'All data', filterState: {} },
    { name: 'Audit-grade only', filterState: { qualityRating: ['Audit-grade'] } },
    { name: 'Restricted sensitivity', filterState: { sensitivityMarking: ['Restricted'] } },
    { name: 'Refresh required', filterState: { currencyStatus: ['Refresh required', 'Stale'] } },
    { name: 'Most cited', filterState: {}, sortKey: 'citedByCount', sortDir: 'desc' },
    { name: 'Recently uploaded', filterState: {}, sortKey: 'uploadedDate', sortDir: 'desc' },
  ];

  return (
    <DataGrid
      data={data}
      columns={columns}
      filters={filters}
      savedViews={savedViews}
      rowKey={(r) => r.id}
      ariaLabel="Uploaded data snapshot"
      pageSize={20}
      mobileCard={(row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontWeight: 500, fontSize: 14 }}>{row.name}</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: QUALITY_TONE[row.qualityRating], letterSpacing: '0.08em', textTransform: 'uppercase' }}>{row.qualityRating}</span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(245,245,240,0.7)' }}>
            {row.type} · {row.sourceSystem}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(245,245,240,0.55)' }}>
            {row.sensitivityMarking} · uploaded {fmtDate(row.uploadedDate)} · cited {row.citedByCount}×
          </div>
        </div>
      )}
    />
  );
}

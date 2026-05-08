'use client';

// VendorPortfolioSurface · File 04 Z1-B
//
// Replaces the scheduled-stub Tower Vendors subsurface with a real
// concentration + rationalization view. Renders spend summary,
// vendor inventory table with risk-level chips, and surfaces critical
// /high-risk items at the top.
//
// Data comes from the seeded vendor adapter (loadVendorPortfolio).
// Empty state is explicit — no fabricated content when a tenant has
// no seed.

import { useMemo, useState } from 'react';
import type { VendorPortfolioVM, VendorRiskLevel, VendorRow } from '@/lib/tower/vendor-portfolio';
import { summarizePortfolio } from '@/lib/tower/vendor-portfolio';

interface Props {
  vm: VendorPortfolioVM;
}

const RISK_META: Record<VendorRiskLevel, { label: string; color: string; bg: string }> = {
  Critical: { label: 'Critical', color: '#E04444', bg: 'rgba(224,68,68,0.12)' },
  High: { label: 'High', color: '#D97706', bg: 'rgba(217,119,6,0.12)' },
  Medium: { label: 'Medium', color: '#8a7e72', bg: 'rgba(138,126,114,0.12)' },
  Low: { label: 'Low', color: '#0E9F8C', bg: 'rgba(14,159,140,0.12)' },
  Unknown: { label: '—', color: '#8a7e72', bg: 'rgba(138,126,114,0.08)' },
};

type RiskFilter = 'all' | VendorRiskLevel;
type SortKey = 'spend' | 'risk' | 'name';

export function VendorPortfolioSurface({ vm }: Props) {
  const summary = useMemo(() => summarizePortfolio(vm), [vm]);
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('spend');

  const rows = useMemo(() => {
    const filtered = riskFilter === 'all' ? vm.vendors : vm.vendors.filter((v) => v.riskLevel === riskFilter);
    const sorted = [...filtered];
    if (sortKey === 'spend') sorted.sort((a, b) => b.annualSpendMillions - a.annualSpendMillions);
    if (sortKey === 'risk') sorted.sort((a, b) => riskRank(a.riskLevel) - riskRank(b.riskLevel));
    if (sortKey === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [vm.vendors, riskFilter, sortKey]);

  return (
    <article style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'DM Sans, -apple-system, sans-serif' }}>
      <header>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#D97706', fontWeight: 700 }}>
          {vm.tenantDisplay} · Control Tower · Vendors
        </div>
        <h1 style={{ margin: '6px 0 0', fontFamily: 'Fraunces, Georgia, serif', fontSize: 32, letterSpacing: '-0.02em', color: '#1a1612' }}>
          Vendor concentration & rationalization
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.6, color: '#544b42', maxWidth: 720 }}>
          {vm.sourceNote} · Spend, contract status, and named risk per vendor.
          Tenant isolation applies at the data plane — this surface only shows {vm.tenantDisplay} vendors.
        </p>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <Metric label="Total IT budget" value={`$${vm.totalITBudgetMillions}M`} detail="annual" />
        {vm.mappedSpendMillions !== null ? <Metric label="Mapped spend" value={`$${vm.mappedSpendMillions}M`} detail={`${Math.round((vm.mappedSpendMillions / vm.totalITBudgetMillions) * 100)}% of budget`} /> : null}
        {vm.shadowITMillions !== null ? <Metric label="Shadow IT" value={`$${vm.shadowITMillions}M`} detail="unmanaged" tone="warning" /> : null}
        <Metric label="Critical-risk vendors" value={String(summary.criticalCount)} detail={`${summary.highCount} high-risk`} tone={summary.criticalCount > 0 ? 'critical' : 'default'} />
        <Metric label="Top 3 vendor concentration" value={`${summary.topSpendPct}%`} detail="of vendor spend" tone={summary.topSpendPct > 50 ? 'warning' : 'default'} />
        <Metric label="Total vendor spend" value={`$${summary.totalVendorSpend.toFixed(0)}M`} detail={`${vm.vendors.length} vendors`} />
      </section>

      {summary.largestVendor ? (
        <section
          style={{
            padding: 16,
            borderRadius: 12,
            background: RISK_META[summary.largestVendor.riskLevel].bg,
            border: `1px solid ${RISK_META[summary.largestVendor.riskLevel].color}40`,
          }}
        >
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: RISK_META[summary.largestVendor.riskLevel].color, fontWeight: 700 }}>
            Largest single-vendor exposure · {summary.largestVendor.riskLevel}
          </div>
          <h3 style={{ margin: '6px 0 4px', fontFamily: 'Fraunces, Georgia, serif', fontSize: 20, color: '#1a1612' }}>
            {summary.largestVendor.name} · ${summary.largestVendor.annualSpendMillions}M/year
          </h3>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: '#3d342d' }}>{summary.largestVendor.keyRisk}</p>
        </section>
      ) : null}

      <section style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid rgba(26,22,18,0.08)' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#8a7e72', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
            Filter risk
          </span>
          {(['all', 'Critical', 'High', 'Medium', 'Low'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setRiskFilter(f)}
              style={chipStyle(riskFilter === f)}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 'auto' }}>
          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#8a7e72', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
            Sort
          </span>
          {(['spend', 'risk', 'name'] as const).map((s) => (
            <button key={s} type="button" onClick={() => setSortKey(s)} style={chipStyle(sortKey === s)}>
              {s}
            </button>
          ))}
        </div>
      </section>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
        <thead>
          <tr>
            <Th>Vendor</Th>
            <Th>Category</Th>
            <Th align="right">Spend</Th>
            <Th>Risk</Th>
            <Th>Contract</Th>
            <Th>Key risk</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((v) => (
            <Row key={v.name} v={v} />
          ))}
        </tbody>
      </table>

      {rows.length === 0 ? (
        <div style={{ padding: 20, borderRadius: 12, background: '#FFFDF8', border: '1px dashed rgba(26,22,18,0.15)', fontSize: 13, color: '#6d625a', textAlign: 'center' }}>
          No vendors match the current filter. Relax the risk filter to see more rows.
        </div>
      ) : null}
    </article>
  );
}

function riskRank(r: VendorRiskLevel): number {
  switch (r) {
    case 'Critical': return 0;
    case 'High': return 1;
    case 'Medium': return 2;
    case 'Low': return 3;
    default: return 4;
  }
}

function Metric({ label, value, detail, tone = 'default' }: { label: string; value: string; detail?: string; tone?: 'default' | 'critical' | 'warning' }) {
  const color = tone === 'critical' ? '#E04444' : tone === 'warning' ? '#D97706' : '#1a1612';
  return (
    <div style={{ padding: 14, borderRadius: 10, background: '#FFFDF8', border: '1px solid rgba(26,22,18,0.08)' }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8a7e72', fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
      {detail ? <div style={{ fontSize: 12, color: '#6d625a', marginTop: 2 }}>{detail}</div> : null}
    </div>
  );
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      style={{
        textAlign: align,
        padding: '10px 12px',
        borderBottom: '1px solid rgba(26,22,18,0.15)',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: '#8a7e72',
        fontWeight: 700,
      }}
    >
      {children}
    </th>
  );
}

function Row({ v }: { v: VendorRow }) {
  const risk = RISK_META[v.riskLevel];
  return (
    <tr>
      <td style={tdStyle}>
        <div style={{ fontWeight: 600, color: '#1a1612' }}>{v.name}</div>
        <div style={{ fontSize: 11, color: '#8a7e72' }}>{v.product}</div>
      </td>
      <td style={tdStyle}>{v.category}</td>
      <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>${v.annualSpendMillions}M</td>
      <td style={tdStyle}>
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 999,
            background: risk.bg,
            color: risk.color,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          {risk.label}
        </span>
      </td>
      <td style={{ ...tdStyle, fontSize: 12, color: '#544b42' }}>{v.contractStatus}</td>
      <td style={{ ...tdStyle, fontSize: 12, color: '#3d342d', maxWidth: 380 }}>{v.keyRisk}</td>
    </tr>
  );
}

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid rgba(26,22,18,0.06)',
  verticalAlign: 'top',
};

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '4px 10px',
    borderRadius: 999,
    border: `1px solid ${active ? '#D97706' : 'rgba(26,22,18,0.15)'}`,
    background: active ? '#D97706' : 'transparent',
    color: active ? '#FFFFFF' : '#544b42',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 10,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontWeight: 700,
    cursor: 'pointer',
  };
}

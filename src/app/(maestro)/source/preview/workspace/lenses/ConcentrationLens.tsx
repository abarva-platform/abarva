'use client';

import { DataTable } from '../DataTable';
import type { SourceWorkspaceVM } from '../buildViewModel';

export function ConcentrationLens({ vm }: { vm: SourceWorkspaceVM }) {
  const p = vm.pareto;
  const activeStrip = vm.concStrips.find((s) => s.selected);
  const dim = (key: string) => (activeStrip && !activeStrip.vendors.some((v) => v.ref === key) ? 0.22 : 1);
  return (
    <>
      <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, padding: '18px 24px 14px', borderBottom: '1px solid rgba(10,10,11,.12)' }}>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: '#0a0a0b' }}>Vendor concentration</div>
            <div style={{ fontSize: 12.5, color: '#5f5e5a', marginTop: 3 }}>Bars: annual contract value · line: cumulative portfolio share (computeVendorConcentration)</div>
          </div>
        </div>
        <div style={{ padding: '16px 20px 6px', overflowX: 'auto' }}>
          <svg viewBox={`0 0 ${p.w} ${p.h}`} style={{ width: '100%', minWidth: 900, height: 'auto', display: 'block' }}>
            {p.gridY.map((g, i) => (
              <line key={i} x1={p.left} x2={p.right} y1={g.y} y2={g.y} stroke="rgba(10,10,11,.07)" strokeWidth={1} />
            ))}
            {p.bars.map((b, i) => (
              <g key={i} onMouseEnter={b.onEnter} onMouseLeave={b.onLeave} onClick={b.onClick ?? undefined} style={{ cursor: b.onClick ? 'pointer' : 'default' }} opacity={dim(b.key)}>
                <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={b.fill} rx={2} />
              </g>
            ))}
            <polyline points={p.line} fill="none" stroke="#0f6e56" strokeWidth={1.6} />
            {p.bars.map((b, i) => (
              <circle key={i} cx={b.cx} cy={b.cy} r={2.6} fill="#0f6e56" />
            ))}
            <line x1={p.left} x2={p.right} y1={p.axisY} y2={p.axisY} stroke="rgba(10,10,11,.25)" />
            <g>{p.labels}</g>
          </svg>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 22, alignItems: 'center', padding: '6px 24px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#5f5e5a' }}><span style={{ width: 11, height: 11, background: '#0a0a0b', borderRadius: 2 }} />Top five · {vm.top5Pct}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#5f5e5a' }}><span style={{ width: 11, height: 11, background: '#1d9e75', borderRadius: 2 }} />Ranks six to ten · cumulative {vm.top10Pct}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#5f5e5a' }}><span style={{ width: 16, height: 2, background: '#0f6e56' }} />Cumulative portfolio share</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#5f5e5a' }}><span style={{ width: 11, height: 11, background: '#d3d1c7', borderRadius: 2 }} />Remaining vendors, aggregated</div>
        </div>
        <div style={{ borderTop: '1px solid rgba(10,10,11,.12)', background: '#fbfaf7', padding: '16px 24px', display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'flex-start' }}>
          <div style={{ fontSize: 13.5, lineHeight: 1.6, color: '#2c2c2a', maxWidth: '92ch' }}><b>What this says.</b> {vm.concTake}</div>
        </div>
        <div style={{ borderTop: '1px solid rgba(10,10,11,.12)', padding: '12px 24px', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', color: '#b4b2a9' }}>
          <span>computeVendorConcentration(source.contract_360)</span><span>·</span><span>grain: vendor</span><span>·</span><span>drill: vendor_ref → Vendor 360</span>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px 12px', borderBottom: '1px solid rgba(10,10,11,.12)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0a0a0b' }}>Where concentration is compounded by risk</div>
          <div style={{ fontSize: 12.5, color: '#5f5e5a', marginTop: 3 }}>Select a strip to highlight those vendors in the chart above.</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {vm.concStrips.map((s) => (
            <div
              key={s.id}
              onClick={s.onClick}
              style={{ flex: '1 1 260px', background: s.bg, color: s.fg, padding: '14px 20px', borderRight: '1px solid rgba(10,10,11,.09)', cursor: 'pointer' }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>{s.note}</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5 }}>
                <span>{s.vendorCount} vendors</span>
                <span>·</span>
                <span>{s.contractCount} contracts</span>
                <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{s.value}</span>
              </div>
            </div>
          ))}
        </div>
        {activeStrip ? (
          <div style={{ borderTop: '1px solid rgba(10,10,11,.12)', background: '#fbfaf7', padding: '14px 24px', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12.5, color: '#5f5e5a' }}>Flagged vendors:</span>
            {activeStrip.vendors.map((v) => (
              <button
                key={v.ref}
                onClick={v.onClick}
                className="sw-hover-ink-border"
                style={{ border: '1px solid rgba(10,10,11,.16)', background: '#fff', color: '#2c2c2a', borderRadius: 999, padding: '4px 11px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                {v.name}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <DataTable
        title="Top ten vendors"
        note="Supporting drill-down, not the primary visual. Row click opens Vendor 360."
        binding="SourceVendorConcentration"
        columns={vm.topCols}
        rows={vm.topRows}
        footnote="Portfolio share and cumulative share are returned by the Cube view. The page does not compute them."
      />
    </>
  );
}

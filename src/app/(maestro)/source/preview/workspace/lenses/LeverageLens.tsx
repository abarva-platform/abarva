'use client';

import type { SourceWorkspaceVM } from '../buildViewModel';
import { DataTable } from '../DataTable';

export function LeverageLens({ vm }: { vm: SourceWorkspaceVM }) {
  const mx = vm.mx;
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(420px,1fr))', gap: 16, alignItems: 'start' }}>
        <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px 12px', borderBottom: '1px solid rgba(10,10,11,.12)' }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: '#0a0a0b' }}>Sourcing leverage matrix</div>
            <div style={{ fontSize: 12.5, color: '#5f5e5a', marginTop: 3 }}>
              Find contracts where the dollars are material and the negotiation position is weak. X: weak-leverage flags · Y: annual value · size: actual spend · colour: renewal timing · outline: auto-renew.
            </div>
          </div>
          <div style={{ padding: '14px 18px 4px' }}>
            <svg viewBox={`0 0 ${mx.w} ${mx.h}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
              {mx.quads.map((q) => (
                <g key={q.id} onClick={q.onClick} style={{ cursor: 'pointer' }}>
                  <rect x={q.qx} y={q.qy} width={q.qw} height={q.qh} fill={q.fill} stroke={q.stroke} />
                </g>
              ))}
              <line x1={mx.qx} x2={mx.qx} y1={mx.top} y2={mx.bottom} stroke="rgba(10,10,11,.16)" strokeDasharray="4 3" />
              <line x1={mx.left} x2={mx.right} y1={mx.qy} y2={mx.qy} stroke="rgba(10,10,11,.16)" strokeDasharray="4 3" />
              {mx.pts.map((p) => (
                <g key={p.key} onMouseEnter={p.onEnter} onMouseLeave={p.onLeave} onClick={p.onClick} style={{ cursor: 'pointer' }}>
                  <circle cx={p.cx} cy={p.cy} r={p.r} fill={p.fill} fillOpacity={0.78} stroke={p.stroke} strokeWidth={p.sw} strokeDasharray={p.dash} />
                </g>
              ))}
              <line x1={mx.left} x2={mx.right} y1={mx.bottom} y2={mx.bottom} stroke="rgba(10,10,11,.25)" />
              <line x1={mx.left} x2={mx.left} y1={mx.top} y2={mx.bottom} stroke="rgba(10,10,11,.25)" />
              <g>{mx.labels}</g>
            </svg>
          </div>
          <div style={{ borderTop: '1px solid rgba(10,10,11,.12)', padding: '14px 24px' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888780', marginBottom: 10 }}>
              What the weak-leverage axis means — four named flags, no savings claim
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {vm.signalDefs.map((s) => (
                <div key={s.id} style={{ display: 'flex', gap: 12, alignItems: 'baseline', fontSize: 12.5 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: '#0f6e56', minWidth: 250 }}>{s.id}</span>
                  <span style={{ color: '#2c2c2a' }}>{s.label}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#5f5e5a' }}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(10,10,11,.12)', padding: '12px 24px', display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', color: '#b4b2a9' }}>
            <span>computeContractLeverageSignals(source.contract_360)</span><span>·</span><span>drill: contract_id</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, color: '#5f5e5a', lineHeight: 1.55 }}>
            This matrix is a shortlist tool. It does not prove recoverable value; it tells Procurement which contracts deserve a negotiation packet, benchmark, alternative scan, or routine renewal posture.
          </div>
          {vm.quadPanel.map((q) => (
            <div key={q.id} onClick={q.onClick} className="sw-quad" style={{ background: q.bg, color: q.fg, border: '1px solid rgba(10,10,11,.14)', borderRadius: 8, padding: '15px 18px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{q.action}</div>
                <div style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, opacity: 0.75 }}>{q.count} · {q.value}</div>
              </div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{q.label}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10 }}>
                {q.items.map((i, idx) => (
                  <div
                    key={idx}
                    className="sw-quad-item"
                    onClick={(e) => { e.stopPropagation(); i.onClick(); }}
                    style={{ display: 'flex', gap: 10, fontSize: 12, opacity: 0.85, cursor: 'pointer' }}
                  >
                    <span>{i.label}</span>
                    <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace" }}>{i.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <DataTable
        title={vm.leverageRowsTitle}
        note="Click a row to open Contract 360. The table is the same governed contract register filtered by the selected quadrant; no separate dataset is used."
        binding="computeContractLeverageSignals(source.contract_360)"
        columns={vm.leverageCols}
        rows={vm.leverageRows}
      />
    </>
  );
}

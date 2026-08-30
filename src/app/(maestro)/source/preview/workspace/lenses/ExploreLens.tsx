'use client';

import { useState } from 'react';
import type { SourceWorkspaceVM } from '../buildViewModel';

export function ExploreLens({ vm }: { vm: SourceWorkspaceVM }) {
  const ex = vm.ex;
  const [showQuery, setShowQuery] = useState(false);
  const [showQuality, setShowQuality] = useState(false);

  return (
    <section
      aria-label="Source portfolio explorer"
      style={{
        flex: '1 1 auto',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'nowrap', minHeight: 34 }}>
        <div style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 1 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 700, letterSpacing: '.11em', textTransform: 'uppercase', color: '#888780', whiteSpace: 'nowrap' }}>
            Group by
          </span>
          {ex.dimBtns.map((dd, i) => (
            <button key={i} onClick={dd.onClick} style={{ border: `1px solid ${dd.border}`, background: dd.bg, color: dd.fg, borderRadius: 999, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {dd.label}
            </button>
          ))}
        </div>
        <div style={{ flex: '0 0 auto', display: 'flex', gap: 6 }}>
          {ex.modeBtns.map((mode, i) => (
            <button key={i} onClick={mode.onClick} style={{ border: `1px solid ${mode.border}`, background: mode.bg, color: mode.fg, borderRadius: 999, padding: '5px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {ex.quality.showBanner ? (
        <div style={{ flex: '0 0 auto' }}>
          <button
            onClick={() => setShowQuality((s) => !s)}
            style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, background: '#fff7ec', border: '1px solid rgba(186,117,23,.34)', borderRadius: 7, padding: '6px 10px', cursor: 'pointer' }}
          >
            <span style={{ fontSize: 12, fontWeight: 800, color: '#0a0a0b', whiteSpace: 'nowrap' }}>Category analysis provisional</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: '#5f5e5a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ex.quality.affectedRows} rows · {ex.quality.affectedValue} value · <span style={{ color: '#a32d2d' }}>{ex.quality.conflictedRows} conflicts</span>
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#ba7517', whiteSpace: 'nowrap' }}>{showQuality ? 'hide' : 'detail'}</span>
          </button>
          {showQuality ? (
            <div style={{ background: '#fff7ec', border: '1px solid rgba(186,117,23,.34)', borderTop: 'none', borderRadius: '0 0 7px 7px', padding: '8px 10px', fontSize: 12, lineHeight: 1.4, color: '#5f5e5a' }}>
              {ex.quality.message} <b style={{ color: '#0a0a0b' }}>{ex.quality.cleanValuePct}</b> clean value.
            </div>
          ) : null}
        </div>
      ) : null}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0a0a0b', borderRadius: 8, padding: '8px 11px', flex: '0 0 auto', minHeight: 40 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', whiteSpace: 'nowrap' }}>Selection</span>
        {ex.hasFilters ? (
          <span style={{ display: 'flex', gap: 6, alignItems: 'center', minWidth: 0, overflowX: 'auto' }}>
            {ex.chips.map((c, i) => (
              <button key={i} onClick={c.onClick} style={{ border: '1px solid rgba(255,255,255,.28)', background: 'rgba(255,255,255,.1)', color: '#fff', borderRadius: 999, padding: '4px 9px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {c.label} ×
              </button>
            ))}
            <button onClick={ex.clearAll} style={{ border: 'none', background: 'transparent', color: '#8fb8ff', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Clear all
            </button>
          </span>
        ) : (
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.72)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.emptySelectionCopy}</span>
        )}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'baseline', flexShrink: 0 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 800, color: '#fff' }}>{ex.totalVal}</span>
          <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,.64)' }}>{ex.contractCount} contract records</span>
        </span>
      </div>

      <div
        style={{
          flex: '0 0 auto',
          height: 'clamp(330px, calc(100dvh - 338px), 560px)',
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: 'minmax(260px,330px) minmax(0,1fr)',
          gridTemplateRows: 'minmax(150px,.92fr) minmax(140px,.72fr)',
          gap: 10,
          overflow: 'hidden',
        }}
      >
        <aside style={{ gridRow: '1 / span 2', minHeight: 0, overflow: 'auto', display: 'grid', gridTemplateColumns: '1fr', alignContent: 'start', gap: 8 }}>
          {ex.boxes.map((b) => (
            <div key={b.id} style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderBottom: '1px solid rgba(10,10,11,.08)', background: '#fbfaf7' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8.5, fontWeight: 800, letterSpacing: '.11em', textTransform: 'uppercase', color: '#888780' }}>{b.label}</span>
                <button onClick={b.onClear} className="sw-hover-ink-text" style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: '#b4b2a9', fontSize: 10.5, fontWeight: 700, cursor: 'pointer' }}>
                  clear
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: 6 }}>
                {b.values.slice(0, 4).map((v, i) => (
                  <button key={i} onClick={v.onClick} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto auto', alignItems: 'baseline', gap: 7, textAlign: 'left', border: `1px solid ${v.border}`, background: v.bg, color: v.fg, borderRadius: 5, padding: '6px 8px', cursor: 'pointer', width: '100%' }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.label}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: v.sub, whiteSpace: 'nowrap' }}>{v.value}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: v.sub }}>{v.count}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>

        <section style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '10px 14px', borderBottom: '1px solid rgba(10,10,11,.1)', flex: '0 0 auto' }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0a0a0b' }}>Value by {ex.dimLabel}</div>
            <div style={{ fontSize: 11.5, color: '#5f5e5a' }}>{ex.chartSubtitle}</div>
            <div style={{ marginLeft: 'auto', fontSize: 11.5, color: '#0f6e56', fontWeight: 700, whiteSpace: 'nowrap' }}>{ex.chartInstruction}</div>
          </div>
          <div style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}>
            {ex.groups.map((g) => (
              <button
                key={g.key}
                onClick={g.onClick}
                onMouseEnter={g.onEnter}
                onMouseLeave={g.onLeave}
                className="sw-hover-cream"
                style={{ width: '100%', display: 'grid', gridTemplateColumns: 'minmax(0,175px) minmax(0,1fr) 84px 54px', gap: 11, alignItems: 'center', padding: '8px 14px', border: 'none', borderBottom: '1px solid rgba(10,10,11,.06)', cursor: 'pointer', background: g.rowBg, textAlign: 'left' }}
              >
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 12, fontWeight: 800, color: g.labelColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.label}</span>
                  <span style={{ display: 'block', fontSize: 10.5, color: g.subColor, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.count} · worst {g.weak}{g.taxonomy.flagged ? ' · taxonomy ' + g.taxonomy.states : ''}</span>
                </span>
                <span style={{ height: 18, background: g.track, borderRadius: 3, overflow: 'hidden' }}>
                  <span style={{ display: 'block', height: '100%', width: `${g.pct}%`, background: g.fill }} />
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 800, color: g.valueColor, textAlign: 'right' }}>{g.value}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: g.subColor, textAlign: 'right' }}>{g.share}</span>
              </button>
            ))}
          </div>
        </section>

        <section style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '9px 14px', borderBottom: '1px solid rgba(10,10,11,.1)', flex: '0 0 auto' }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0a0a0b' }}>Contract line items</div>
            <div style={{ fontSize: 11.5, color: '#5f5e5a' }}>Filtered by the current selection. Click a row for Contract 360.</div>
            <button
              onClick={() => setShowQuery((s) => !s)}
              style={{ marginLeft: 'auto', border: '1px solid rgba(10,10,11,.14)', background: '#fff', color: '#5f5e5a', borderRadius: 5, padding: '4px 8px', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {showQuery ? 'hide query' : 'query'}
            </button>
          </div>
          {showQuery ? (
            <pre style={{ margin: 0, padding: '8px 14px', background: '#0a0a0b', color: '#a9c7ee', fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, lineHeight: 1.45, whiteSpace: 'pre-wrap', overflow: 'auto', maxHeight: 104 }}>
              {ex.query}
            </pre>
          ) : null}
          <div style={{ flex: '1 1 auto', minHeight: 0, overflow: 'auto' }}>
            <div style={{ minWidth: 820 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '150px minmax(180px,1fr) 86px 86px 82px 92px 88px 74px', gap: 10, padding: '7px 14px', borderBottom: '1px solid rgba(10,10,11,.08)', background: '#fbfaf7', fontFamily: "'JetBrains Mono', monospace", fontSize: 8.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888780' }}>
                <span>Vendor</span><span>Contract</span><span>Value</span><span>Actual</span><span>Renewal</span><span>Benchmark</span><span>Alternatives</span><span>Signals</span>
              </div>
              {ex.selectedContracts.slice(0, 24).map((c) => (
                <button key={c.id} onClick={c.onClick} className="sw-hover-cream" style={{ width: '100%', display: 'grid', gridTemplateColumns: '150px minmax(180px,1fr) 86px 86px 82px 92px 88px 74px', gap: 10, alignItems: 'center', padding: '7px 14px', border: 'none', borderBottom: '1px solid rgba(10,10,11,.06)', background: '#fff', textAlign: 'left', cursor: 'pointer' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0a0a0b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.vendor}</span>
                  <span style={{ fontSize: 11.5, color: '#5f5e5a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 800, color: '#0a0a0b' }}>{c.value}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#5f5e5a' }}>{c.actual}</span>
                  <span style={{ fontSize: 11, color: c.renewal === 'Auto-renew' ? '#ba7517' : '#5f5e5a' }}>{c.renewal}</span>
                  <span style={{ fontSize: 11, color: '#5f5e5a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.benchmark}</span>
                  <span style={{ fontSize: 11, color: '#5f5e5a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.alternatives}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 800, color: c.weak >= 2 ? '#a32d2d' : '#5f5e5a' }}>{c.weakSignals}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

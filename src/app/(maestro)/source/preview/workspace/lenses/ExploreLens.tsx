'use client';

import type { SourceWorkspaceVM } from '../buildViewModel';

export function ExploreLens({ vm }: { vm: SourceWorkspaceVM }) {
  const ex = vm.ex;
  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888780' }}>Group by</span>
        {ex.dimBtns.map((dd, i) => (
          <button key={i} onClick={dd.onClick} style={{ border: `1px solid ${dd.border}`, background: dd.bg, color: dd.fg, borderRadius: 999, padding: '6px 12px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {dd.label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {ex.modeBtns.map((mode, i) => (
            <button key={i} onClick={mode.onClick} style={{ border: `1px solid ${mode.border}`, background: mode.bg, color: mode.fg, borderRadius: 999, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {mode.label}
            </button>
          ))}
        </span>
      </div>

      {ex.quality.state !== 'available' ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', background: ex.quality.state === 'blocked' ? '#fff3e6' : '#fbfaf7', border: '1px solid rgba(186,117,23,.34)', borderRadius: 8, padding: '13px 16px' }}>
          <div style={{ flex: '1 1 360px', minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0a0a0b', marginBottom: 4 }}>Category analysis is provisional</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.45, color: '#5f5e5a' }}>{ex.quality.message}</div>
          </div>
          <div style={{ flex: '0 1 112px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#5f5e5a' }}><b style={{ display: 'block', color: '#0a0a0b', fontSize: 15 }}>{ex.quality.affectedRows}</b> affected rows</div>
          <div style={{ flex: '0 1 132px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#5f5e5a' }}><b style={{ display: 'block', color: '#0a0a0b', fontSize: 15 }}>{ex.quality.affectedValue}</b> affected value</div>
          <div style={{ flex: '0 1 96px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#5f5e5a' }}><b style={{ display: 'block', color: '#a32d2d', fontSize: 15 }}>{ex.quality.conflictedRows}</b> conflicts</div>
          <div style={{ flex: '0 1 118px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#5f5e5a' }}><b style={{ display: 'block', color: '#0a0a0b', fontSize: 15 }}>{ex.quality.cleanValuePct}</b> clean value</div>
          <div style={{ flex: '0 1 180px', fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: '#888780', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ex.quality.ruleVersion}</div>
        </div>
      ) : null}

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, background: '#0a0a0b', borderRadius: 8, padding: '12px 16px' }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>Current selection</span>
        {ex.hasFilters ? (
          <span style={{ display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'center' }}>
            {ex.chips.map((c, i) => (
              <button key={i} onClick={c.onClick} style={{ border: '1px solid rgba(255,255,255,.3)', background: 'rgba(255,255,255,.1)', color: '#fff', borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {c.label} ×
              </button>
            ))}
            <button onClick={ex.clearAll} style={{ border: 'none', background: 'transparent', color: '#8fb8ff', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginLeft: 6 }}>
              Clear all
            </button>
          </span>
        ) : null}
        {ex.noFilters ? (
          <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,.62)' }}>Nothing selected — the whole governed portfolio. Click any value to narrow it.</span>
        ) : null}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'baseline' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 600, color: '#fff' }}>{ex.totalVal}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.6)' }}>{ex.contractCount} contracts in selection</span>
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(380px,1fr))', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {ex.boxes.map((b) => (
            <div key={b.id} style={{ flex: '1 1 210px', background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 13px 9px', borderBottom: '1px solid rgba(10,10,11,.09)', background: '#fbfaf7' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888780' }}>{b.label}</span>
                <button onClick={b.onClear} className="sw-hover-ink-text" style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: '#b4b2a9', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  clear
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: 8 }}>
                {b.values.map((v, i) => (
                  <button key={i} onClick={v.onClick} style={{ display: 'flex', alignItems: 'baseline', gap: 8, textAlign: 'left', border: `1px solid ${v.border}`, background: v.bg, color: v.fg, borderRadius: 5, padding: '7px 10px', cursor: 'pointer', width: '100%' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.label}</span>
                    <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: v.sub, whiteSpace: 'nowrap' }}>{v.value}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: v.sub }}>{v.count}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 12, padding: '15px 20px 13px', borderBottom: '1px solid rgba(10,10,11,.12)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0a0a0b' }}>Annual contract value by {ex.dimLabel}</div>
            <div style={{ fontSize: 12, color: '#5f5e5a' }}>{ex.chartSubtitle}</div>
            <div style={{ marginLeft: 'auto', fontSize: 12, color: '#0066CC', fontWeight: 600 }}>Click any value to select it. Click again to release it.</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 520, overflowY: 'auto' }}>
            {ex.groups.map((g) => (
              <div
                key={g.key}
                onClick={g.onClick}
                onMouseEnter={g.onEnter}
                onMouseLeave={g.onLeave}
                className="sw-hover-cream"
                style={{ display: 'grid', gridTemplateColumns: 'minmax(0,168px) minmax(0,1fr) 92px 62px', gap: 14, alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid rgba(10,10,11,.06)', cursor: 'pointer', background: g.rowBg }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: g.labelColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.label}</div>
                  <div style={{ fontSize: 11, color: g.subColor, marginTop: 2 }}>{g.count} · worst {g.weak}{g.taxonomy.flagged ? ' · taxonomy ' + g.taxonomy.states : ''}</div>
                  {g.taxonomy.flagged ? (
                    <div style={{ fontSize: 10.5, color: '#ba7517', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>source: {g.taxonomy.sourceCategories}</div>
                  ) : null}
                </div>
                <div style={{ height: 20, background: g.track, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${g.pct}%`, background: g.fill }} />
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, fontWeight: 600, color: g.valueColor, textAlign: 'right' }}>{g.value}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: g.subColor, textAlign: 'right' }}>{g.share}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', padding: '12px 20px', background: '#fbfaf7', borderTop: '1px solid rgba(10,10,11,.12)', fontSize: 11.5, color: '#5f5e5a' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ width: 11, height: 11, borderRadius: 2, background: '#a32d2d' }} />Passed notice deadline inside the group</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ width: 11, height: 11, borderRadius: 2, background: '#1d9e75' }} />No weak leverage signal</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ width: 11, height: 11, borderRadius: 2, background: '#3d6ea8' }} />Mixed</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ width: 11, height: 11, borderRadius: 2, background: '#e4e1d8' }} />Excluded by the selection</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(400px,1fr))', gap: 16, alignItems: 'stretch' }}>
        <div style={{ background: '#0a0a0b', borderRadius: 8, padding: '20px 22px' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', marginBottom: 12 }}>
            The query behind this view
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, lineHeight: 1.65, color: '#a9c7ee', whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{ex.query}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: '#888780', marginBottom: 10 }}>Why this matters</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.65, color: '#2c2c2a' }}>This is the exact query the native canvas executes against source.contract_360 — re-grouped live, no separate calculation.</div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 'auto' }}>
            <button onClick={vm.pinSlice} style={{ border: '1px solid #0a0a0b', background: '#0a0a0b', color: '#fff', borderRadius: 6, padding: '10px 17px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Pin this cut
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

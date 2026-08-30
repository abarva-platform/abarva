'use client';

import type { SourceWorkspaceVM } from '../buildViewModel';

export function OpportunityCanvas({ vm }: { vm: SourceWorkspaceVM }) {
  const o = vm.o;
  if (!o) return null;
  return (
    <>
      <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, padding: '22px 26px' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888780', marginBottom: 12 }}>
          Why it surfaced
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {o.reasons.map((r, i) => (
            <span key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: '#0f6e56', border: '1px solid rgba(15,110,86,.28)', borderRadius: 3, padding: '2px 7px' }}>{r}</span>
          ))}
        </div>
        <div style={{ fontSize: 14.5, lineHeight: 1.65, color: '#2c2c2a', maxWidth: '88ch' }}>{o.why}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
          <button onClick={vm.goActions} style={{ border: '1px solid #0a0a0b', background: '#0a0a0b', color: '#fff', borderRadius: 6, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Open Contract 360 · {o.ref}
          </button>
        </div>
      </div>

      {vm.oppLevers.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 14 }}>
          {vm.oppLevers.map((l, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, padding: '18px 22px' }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#0f6e56', marginBottom: 12 }}>{l.label} levers</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {l.items.map((it, j) => (
                  <div key={j} style={{ fontSize: 13, color: '#2c2c2a', lineHeight: 1.55, paddingLeft: 14, borderLeft: '2px solid rgba(10,10,11,.12)' }}>{it}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {vm.oppScenarios.length ? (
        <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid rgba(10,10,11,.12)' }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: '#0a0a0b' }}>Scenario comparison</div>
            <div style={{ fontSize: 12.5, color: '#5f5e5a', marginTop: 3 }}>Structural positions, not sized until real evidence backs a number.</div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', background: '#fff' }}>
            {vm.oppScenarios.map((s, i) => (
              <div key={i} style={{ flex: '1 1 290px', background: '#fff', padding: '18px 22px', borderTop: `3px solid ${s.tone}`, borderRight: '1px solid rgba(10,10,11,.09)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0a0a0b' }}>{s.name}</div>
                  {s.rec ? (
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#0f6e56', background: '#e1f5ee', borderRadius: 3, padding: '3px 7px' }}>
                      Recommended
                    </span>
                  ) : null}
                </div>
                <div style={{ fontSize: 13, color: '#2c2c2a', lineHeight: 1.6, marginBottom: 12 }}>{s.pos}</div>
                <div style={{ fontSize: 12.5, color: '#5f5e5a', lineHeight: 1.55 }}><b style={{ color: '#2c2c2a' }}>Risk.</b> {s.risk}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

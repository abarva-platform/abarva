'use client';

import { DataTable } from '../DataTable';
import type { SourceWorkspaceVM } from '../buildViewModel';

const SECTION: React.CSSProperties = { background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, padding: '20px 24px' };
const EYEBROW: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888780', marginBottom: 12 };

// aVa's answer takes over the center canvas. This is the "full analysis"
// mode from the design review: the same governed measures the native
// lenses read, assembled into one narrative — not a second data source.
export function AvaOptimizationCanvas({ vm }: { vm: SourceWorkspaceVM }) {
  const r = vm.avaResult;
  if (!r) return null;
  const isContract = vm.isContract;

  const actionBar = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      <button onClick={vm.pinResult} style={{ border: '1px solid #0a0a0b', background: '#0a0a0b', color: '#fff', borderRadius: 6, padding: '10px 16px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
        Pin analysis
      </button>
      {['Save to contract', 'Build negotiation brief', 'Create decision', 'Launch sourcing event', 'Hand to Moves'].map((label) => (
        <button
          key={label}
          onClick={() => vm.pin(label + ' · ' + r.title, 'Action', 'From aVa full analysis')}
          className="sw-hover-ink-border"
          style={{ border: '1px solid rgba(10,10,11,.16)', background: '#fff', color: '#2c2c2a', borderRadius: 6, padding: '10px 16px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
        >
          {label}
        </button>
      ))}
      <span style={{ marginLeft: 'auto', fontSize: 12, color: '#5f5e5a' }}>aVa reads the same Cube views as the canvas. It cannot create a value, a date or a priority.</span>
    </div>
  );

  return (
    <>
      <div style={{ ...SECTION, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0066CC' }} />
          <span style={EYEBROW as React.CSSProperties}>Optimisation analysis · from Ask aVa</span>
          <button onClick={vm.closeAvaCanvas} style={{ marginLeft: 'auto', border: '1px solid rgba(10,10,11,.16)', background: '#fff', color: '#5f5e5a', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Back to canvas
          </button>
        </div>
        <h2 style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 500, fontSize: 22, letterSpacing: '-0.02em', color: '#0a0a0b', margin: 0 }}>{r.title}</h2>
        <p style={{ fontSize: 14, lineHeight: 1.65, color: '#2c2c2a', margin: 0, maxWidth: '100ch' }}>{r.answer}</p>
      </div>

      {isContract ? (
        <div style={SECTION}>
          <div style={EYEBROW as React.CSSProperties}>Economics waterfall</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {vm.econBars.map((b, i) => (
              <div key={i}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: '#2c2c2a' }}>{b.label}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 13.5, fontWeight: 600, color: '#0a0a0b' }}>{b.value}</span>
                </div>
                <div style={{ height: 14, background: '#f1efe8', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${b.pct}%`, background: b.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <DataTable columns={r.table.cols} rows={r.table.rows} />
      )}

      {isContract && vm.hasScope ? (
        <div style={SECTION}>
          <div style={EYEBROW as React.CSSProperties}>Scope rationalisation</div>
          <div style={{ fontSize: 13, color: '#5f5e5a', lineHeight: 1.6, marginBottom: 14 }}>{vm.scopeSummary}</div>
          <DataTable columns={vm.scopeCols} rows={vm.scopeRows} />
        </div>
      ) : null}

      {isContract ? (
        <div style={SECTION}>
          <div style={EYEBROW as React.CSSProperties}>Renewal leverage · {vm.weakCount} weak signals</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
            {vm.weakFlags.map((f, i) => (
              <div key={i} style={{ border: '1px solid rgba(10,10,11,.12)', borderLeft: `3px solid ${f.color}`, borderRadius: 6, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0b' }}>{f.label}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: f.color }}>{f.mark}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {isContract ? (
        <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px 12px', borderBottom: '1px solid rgba(10,10,11,.12)', fontSize: 14, fontWeight: 600, color: '#0a0a0b' }}>Scenario comparison</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {vm.optScenarios.map((s, i) => (
              <div key={i} style={{ flex: '1 1 260px', padding: '16px 20px', borderTop: `3px solid ${s.tone}`, borderRight: '1px solid rgba(10,10,11,.09)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0a0a0b' }}>{s.name}</div>
                  {s.rec ? <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#0f6e56', background: '#e1f5ee', borderRadius: 3, padding: '3px 7px' }}>Recommended</span> : null}
                </div>
                <div style={{ fontSize: 12.5, color: '#2c2c2a', lineHeight: 1.55 }}>{s.pos}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16 }}>
        <div style={SECTION}>
          <div style={EYEBROW as React.CSSProperties}>Evidence gaps</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {r.gaps.length ? r.gaps.map((g, i) => (
              <div key={i} style={{ fontSize: 13, color: '#5f5e5a', lineHeight: 1.5, paddingLeft: 12, borderLeft: '2px solid #ba7517' }}>{g}</div>
            )) : <div style={{ fontSize: 13, color: '#5f5e5a' }}>No open evidence gaps for this analysis.</div>}
          </div>
        </div>
        <div style={SECTION}>
          <div style={EYEBROW as React.CSSProperties}>Evidence</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {r.evidence.map((e, i) => (
              <div key={i} style={{ fontSize: 13, color: '#2c2c2a', lineHeight: 1.5, paddingLeft: 12, borderLeft: '2px solid #1d9e75' }}>{e}</div>
            ))}
          </div>
        </div>
      </div>

      <div style={SECTION}>
        <div style={EYEBROW as React.CSSProperties}>Recommended actions</div>
        {actionBar}
      </div>
    </>
  );
}

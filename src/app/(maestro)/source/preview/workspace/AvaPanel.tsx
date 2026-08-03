'use client';

import { DataTable } from './DataTable';
import type { SourceWorkspaceVM } from './buildViewModel';

export function AvaPanel({ vm }: { vm: SourceWorkspaceVM }) {
  if (vm.avaClosed) {
    return (
      <div
        onClick={vm.openAva}
        style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '18px 0', cursor: 'pointer' }}
        className="sw-hover-cream"
      >
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#0066CC' }} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: '#5f5e5a', writingMode: 'vertical-rl' }}>
          Ask aVa
        </span>
      </div>
    );
  }

  const r = vm.avaResult;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: '1px solid rgba(10,10,11,.1)', position: 'sticky', top: 0, background: '#fff', zIndex: 5 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0066CC' }} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: '#0a0a0b' }}>Ask aVa</span>
        <button
          onClick={vm.closeAva}
          style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: '#888780', fontSize: 15, cursor: 'pointer' }}
        >
          ×
        </button>
      </div>

      <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(10,10,11,.08)', background: '#fbfaf7' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888780', marginBottom: 10 }}>
          Context received automatically
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {vm.avaCtx.map((x, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, fontSize: 12 }}>
              <span style={{ color: '#888780' }}>{x.k}</span>
              <span style={{ marginLeft: 'auto', textAlign: 'right', color: '#2c2c2a', fontWeight: 500 }}>{x.v}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(10,10,11,.08)' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888780', marginBottom: 10 }}>
          Ask about this selection
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {vm.avaSuggestions.map((s, i) => (
            <button
              key={i}
              onClick={s.onClick}
              className="sw-hover-cream sw-hover-ink-border"
              style={{ textAlign: 'left', border: '1px solid rgba(10,10,11,.14)', background: '#fff', color: '#2c2c2a', borderRadius: 6, padding: '10px 13px', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', lineHeight: 1.45 }}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, border: '1px solid rgba(10,10,11,.14)', borderRadius: 6, padding: '10px 12px', marginTop: 10 }}>
          <input
            placeholder="Ask anything about this context"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12.5, fontFamily: 'inherit', color: '#2c2c2a', background: 'transparent' }}
          />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#b4b2a9' }}>⏎</span>
        </div>
      </div>

      {r && vm.avaCanvas ? (
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fbfaf7', border: '1px solid rgba(10,10,11,.1)', borderRadius: 6, padding: '12px 14px' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#0066CC', flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: '#2c2c2a', lineHeight: 1.5 }}>
              Full analysis open in the canvas — <b>{r.title}</b>
            </span>
          </div>
          <button onClick={vm.closeAvaCanvas} className="sw-hover-ink-border" style={{ border: '1px solid rgba(10,10,11,.16)', background: '#fff', color: '#2c2c2a', borderRadius: 6, padding: '9px 13px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
            Close analysis, keep chatting here
          </button>
        </div>
      ) : null}

      {r && !vm.avaCanvas ? (
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#0066CC', marginBottom: 8 }}>
              Executive answer
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0a0a0b', lineHeight: 1.4, marginBottom: 10 }}>{r.title}</div>
            <div style={{ fontSize: 13, color: '#2c2c2a', lineHeight: 1.65 }}>{r.answer}</div>
            <button
              onClick={vm.openAvaCanvas}
              style={{ marginTop: 12, border: '1px solid #0a0a0b', background: '#0a0a0b', color: '#fff', borderRadius: 6, padding: '9px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
            >
              Open full analysis in canvas →
            </button>
          </div>
          <DataTable columns={r.table.cols} rows={r.table.rows} />
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888780', marginBottom: 8 }}>Evidence</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {r.evidence.map((e, i) => (
                <div key={i} style={{ fontSize: 12.5, color: '#2c2c2a', lineHeight: 1.5, paddingLeft: 12, borderLeft: '2px solid #1d9e75' }}>{e}</div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888780', marginBottom: 8 }}>Evidence gaps</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {r.gaps.map((g, i) => (
                <div key={i} style={{ fontSize: 12.5, color: '#5f5e5a', lineHeight: 1.5, paddingLeft: 12, borderLeft: '2px solid #ba7517' }}>{g}</div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(10,10,11,.1)', paddingTop: 14 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888780', marginBottom: 9 }}>Do something with this</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <button onClick={vm.pinResult} style={{ border: '1px solid #0a0a0b', background: '#0a0a0b', color: '#fff', borderRadius: 6, padding: '8px 13px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Pin to canvas
              </button>
              {r.actions.map((a, i) => (
                <button key={i} onClick={vm.pinResult} className="sw-hover-ink-border" style={{ border: '1px solid rgba(10,10,11,.16)', background: '#fff', color: '#2c2c2a', borderRadius: 6, padding: '8px 13px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888780', marginBottom: 8 }}>Follow up</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {r.followUps.map((f, i) => (
                <div key={i} style={{ fontSize: 12.5, color: '#0066CC', lineHeight: 1.5, cursor: 'pointer' }}>{f} →</div>
              ))}
            </div>
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', color: '#b4b2a9', lineHeight: 1.6 }}>
            {r.dataset} · same governed data plane as the canvas
          </div>
        </div>
      ) : null}
    </div>
  );
}

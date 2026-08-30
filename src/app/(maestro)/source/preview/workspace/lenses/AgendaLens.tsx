'use client';

import type { SourceWorkspaceVM } from '../buildViewModel';

export function AgendaLens({ vm }: { vm: SourceWorkspaceVM }) {
  return (
    <>
      <div style={{ background: '#fff', border: '1px solid rgba(10,10,11,.12)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '20px 26px 16px', borderBottom: '1px solid rgba(10,10,11,.12)' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: '#0f6e56', marginBottom: 9 }}>
            What the governed data says
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.6, color: '#2c2c2a', maxWidth: '100ch' }}>
            Generated live from the same aggregates the lenses show — never a separately hand-authored finding.
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {vm.findings.map((f) => (
            <div key={f.ref} style={{ padding: '22px 26px', borderBottom: '1px solid rgba(10,10,11,.08)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: f.dot, flexShrink: 0 }} />
                <h3 style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 500, fontSize: 19, letterSpacing: '-0.015em', color: '#0a0a0b', margin: 0, maxWidth: '70ch', lineHeight: 1.28 }}>{f.headline}</h3>
                <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', color: '#b4b2a9' }}>{f.ref}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
                <div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888780', marginBottom: 6 }}>Observed</div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.6, color: '#2c2c2a' }}>{f.observed}</div>
                </div>
                <div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888780', marginBottom: 6 }}>Why it matters</div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.6, color: '#2c2c2a' }}>{f.why}</div>
                </div>
                <div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888780', marginBottom: 6 }}>Recommended response</div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.6, color: '#2c2c2a' }}>{f.response}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {vm.journeys.map((j) => (
        <div key={j.id} style={{ background: '#fff', border: '1px solid rgba(10,10,11,.14)', borderRadius: 8, padding: '26px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: '#0f6e56', marginBottom: 11 }}>{j.eyebrow}</div>
            <h3 style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 500, fontSize: 24, lineHeight: 1.2, letterSpacing: '-0.02em', color: '#0a0a0b', margin: '0 0 10px', maxWidth: '26ch' }}>{j.title}</h3>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: '#5f5e5a', margin: 0, maxWidth: '56ch' }}>{j.narrative}</p>
          </div>
          <button onClick={j.onClick} style={{ alignSelf: 'flex-start', border: '1px solid #0a0a0b', background: '#0a0a0b', color: '#fff', borderRadius: 6, padding: '12px 22px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
            {j.cta} →
          </button>
        </div>
      ))}
    </>
  );
}

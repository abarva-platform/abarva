'use client';

import { useState } from 'react';
import type { CatalogSystem } from '@/lib/tower/onboarding-catalog';

const INK = '#F5F5F0';
const TEAL = '#2DD4C8';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const BORDER = '0.5px solid rgba(255,255,255,0.08)';
const PANEL_BG = 'rgba(255,255,255,0.02)';

export function SystemAccordion({ system }: { system: CatalogSystem }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ border: BORDER, borderRadius: 10, background: PANEL_BG, overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 20px',
          background: 'transparent',
          border: 'none',
          color: INK,
          fontFamily: 'Inter, sans-serif',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>{system.name}</div>
          <div style={{ fontSize: 13, color: MUTE, marginTop: 4, lineHeight: 1.5 }}>{system.tagline}</div>
        </div>
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            color: TEAL,
            letterSpacing: '0.14em',
            flexShrink: 0,
            marginLeft: 16,
            transform: open ? 'rotate(90deg)' : 'none',
            transition: 'transform 120ms ease',
          }}
        >
          ▸
        </span>
      </button>

      {open && (
        <div style={{ padding: '0 20px 24px', borderTop: BORDER }}>
          <section style={{ marginTop: 20 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.14em', color: TEAL, textTransform: 'uppercase', marginBottom: 8 }}>
              What to export
            </div>
            <div style={{ fontSize: 14, color: INK, lineHeight: 1.6 }}>{system.whatToExport}</div>
          </section>

          <section style={{ marginTop: 20 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.14em', color: TEAL, textTransform: 'uppercase', marginBottom: 8 }}>
              Steps
            </div>
            <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.7, color: INK }}>
              {system.steps.map((step, i) => (
                <li key={i} style={{ marginBottom: 2 }}>{step}</li>
              ))}
            </ol>
          </section>

          <section style={{ marginTop: 20 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.14em', color: TEAL, textTransform: 'uppercase', marginBottom: 8 }}>
              Fields we use
            </div>
            <table style={{ width: '100%', fontSize: 13, color: INK, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '6px 0', color: MUTE, fontWeight: 600, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: BORDER }}>
                    source column
                  </th>
                  <th style={{ textAlign: 'left', padding: '6px 0', color: MUTE, fontWeight: 600, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: BORDER }}>
                    maps to
                  </th>
                </tr>
              </thead>
              <tbody>
                {system.fields.map((f, i) => (
                  <tr key={i}>
                    <td style={{ padding: '6px 8px 6px 0', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{f.source}</td>
                    <td style={{ padding: '6px 0', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: TEAL }}>{f.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {system.tip && (
            <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(45,212,200,0.05)', border: `0.5px solid rgba(45,212,200,0.25)`, borderRadius: 6, fontSize: 13, color: INK, lineHeight: 1.5 }}>
              <span style={{ color: TEAL, fontWeight: 600 }}>Tip · </span>
              {system.tip}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

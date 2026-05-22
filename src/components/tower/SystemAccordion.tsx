'use client';

import { useState } from 'react';
import type { CatalogSystem } from '@/lib/tower/onboarding-catalog';

// AbarVa locked light design system — cream surface, Fraunces serif,
// Inter body, mono eyebrows, black/ghost controls. Re-skinned from the
// prior dark teal theme in the 2026-05 audit pass.
const INK = '#1A1A18';
const INK_SOFT = '#5b5148';
const RULE = 'rgba(10,10,11,0.12)';
const CARD_BG = '#ffffff';
const TINT_BG = '#F8F7F4';
const SERIF = 'var(--font-fraunces), "Fraunces", Georgia, serif';
const MONO = 'var(--font-body-mono), ui-monospace, SFMono-Regular, Menlo, monospace';
const BODY = 'var(--font-body-sans), "Inter", -apple-system, system-ui, sans-serif';

export function SystemAccordion({ system }: { system: CatalogSystem }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ border: `1px solid ${RULE}`, borderRadius: 10, background: CARD_BG, overflow: 'hidden' }}>
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
          fontFamily: BODY,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div>
          <div style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 400, letterSpacing: '-0.01em' }}>{system.name}</div>
          <div style={{ fontSize: 13, color: INK_SOFT, marginTop: 4, lineHeight: 1.5 }}>{system.tagline}</div>
        </div>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 11,
            color: INK_SOFT,
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
        <div style={{ padding: '0 20px 24px', borderTop: `1px solid ${RULE}` }}>
          <section style={{ marginTop: 20 }}>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', color: INK_SOFT, textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
              What to export
            </div>
            <div style={{ fontSize: 14, color: INK, lineHeight: 1.6 }}>{system.whatToExport}</div>
          </section>

          <section style={{ marginTop: 20 }}>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', color: INK_SOFT, textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
              Steps
            </div>
            <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.7, color: INK }}>
              {system.steps.map((step, i) => (
                <li key={i} style={{ marginBottom: 2 }}>{step}</li>
              ))}
            </ol>
          </section>

          <section style={{ marginTop: 20 }}>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', color: INK_SOFT, textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
              Fields we use
            </div>
            <table style={{ width: '100%', fontSize: 13, color: INK, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '6px 0', color: INK_SOFT, fontWeight: 700, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: `1px solid ${RULE}` }}>
                    source column
                  </th>
                  <th style={{ textAlign: 'left', padding: '6px 0', color: INK_SOFT, fontWeight: 700, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: `1px solid ${RULE}` }}>
                    maps to
                  </th>
                </tr>
              </thead>
              <tbody>
                {system.fields.map((f, i) => (
                  <tr key={i}>
                    <td style={{ padding: '6px 8px 6px 0', fontFamily: MONO, fontSize: 12 }}>{f.source}</td>
                    <td style={{ padding: '6px 0', fontFamily: MONO, fontSize: 12, color: INK_SOFT }}>{f.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {system.tip && (
            <div style={{ marginTop: 20, padding: '12px 16px', background: TINT_BG, border: `1px solid ${RULE}`, borderRadius: 6, fontSize: 13, color: INK, lineHeight: 1.5 }}>
              <span style={{ color: INK, fontWeight: 700 }}>Tip · </span>
              {system.tip}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

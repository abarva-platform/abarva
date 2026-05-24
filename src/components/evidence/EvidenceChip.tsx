'use client';

import { useState } from 'react';
import Link from 'next/link';

export interface EvidenceChipViewModel {
  ledgerId: string;
  humanText: string;
  deepLink: string;
  sourceQuote?: string | null;
  freshness: string;
  confidenceLabel: 'high' | 'medium' | 'low' | 'insufficient';
}

export function EvidenceChip({ citation }: { citation: EvidenceChipViewModel }) {
  const [open, setOpen] = useState(false);
  const tone = toneFor(citation.confidenceLabel);
  const isStale = isOlderThan30Days(citation.freshness);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          border: `1px solid ${tone.border}`,
          background: tone.bg,
          color: tone.fg,
          borderRadius: 999,
          padding: '4px 9px',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
        }}
        aria-label={`Open evidence ${citation.ledgerId}`}
      >
        <span>{citation.confidenceLabel === 'insufficient' ? 'Insufficient evidence' : 'Evidence'}</span>
        <span>{confidenceText(citation.confidenceLabel)}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Evidence ledger detail"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            background: 'rgba(15, 23, 42, 0.35)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setOpen(false)}
        >
          <aside
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(520px, 100vw)',
              height: '100%',
              background: '#fff',
              borderLeft: '1px solid #d0d5dd',
              boxShadow: '-24px 0 48px rgba(15, 23, 42, 0.22)',
              padding: 24,
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#667085' }}>
                  Evidence ledger row
                </div>
                <h2 style={{ margin: '6px 0 0', fontSize: 22, lineHeight: 1.15 }}>Citation detail</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} style={closeStyle}>Close</button>
            </div>

            <section style={sectionStyle}>
              <div style={labelStyle}>Ledger ID</div>
              <code>{citation.ledgerId}</code>
            </section>

            <section style={sectionStyle}>
              <div style={labelStyle}>Source</div>
              <p style={{ margin: 0 }}>{citation.humanText}</p>
            </section>

            {citation.sourceQuote && (
              <section style={sectionStyle}>
                <div style={labelStyle}>Source quote</div>
                <blockquote style={{ margin: 0, borderLeft: '3px solid #2e90fa', paddingLeft: 12, color: '#344054' }}>
                  {citation.sourceQuote}
                </blockquote>
              </section>
            )}

            <section style={sectionStyle}>
              <div style={labelStyle}>Freshness</div>
              <p style={{ margin: 0 }}>{citation.freshness.slice(0, 10)} {isStale ? '· refresh recommended' : '· current'}</p>
            </section>

            {isStale && (
              <button type="button" style={refreshStyle}>
                Refresh evidence
              </button>
            )}

            <Link href={citation.deepLink} style={deepLinkStyle}>
              Open full ledger list
            </Link>
          </aside>
        </div>
      )}
    </>
  );
}

function toneFor(label: EvidenceChipViewModel['confidenceLabel']) {
  if (label === 'high') return { bg: '#ecfdf3', fg: '#067647', border: '#abefc6' };
  if (label === 'medium') return { bg: '#fffaeb', fg: '#b54708', border: '#fedf89' };
  if (label === 'low') return { bg: '#fef3f2', fg: '#b42318', border: '#fecdca' };
  return { bg: '#f2f4f7', fg: '#475467', border: '#d0d5dd' };
}

function confidenceText(label: EvidenceChipViewModel['confidenceLabel']): string {
  if (label === 'high') return 'High';
  if (label === 'medium') return 'Medium';
  if (label === 'low') return 'Low';
  return 'Inferred';
}

function isOlderThan30Days(value: string): boolean {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() > 30 * 24 * 60 * 60 * 1000;
}

const sectionStyle = { marginTop: 24 } as const;
const labelStyle = {
  marginBottom: 6,
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#667085',
} as const;
const closeStyle = {
  border: '1px solid #d0d5dd',
  background: '#fff',
  borderRadius: 8,
  padding: '8px 10px',
  height: 38,
  cursor: 'pointer',
} as const;
const refreshStyle = {
  marginTop: 18,
  width: '100%',
  border: '1px solid #b54708',
  background: '#fffaeb',
  color: '#b54708',
  borderRadius: 8,
  padding: '10px 12px',
  fontWeight: 800,
  cursor: 'pointer',
} as const;
const deepLinkStyle = {
  display: 'block',
  marginTop: 14,
  border: '1px solid #175cd3',
  background: '#eff8ff',
  color: '#175cd3',
  borderRadius: 8,
  padding: '10px 12px',
  fontWeight: 800,
  textAlign: 'center',
  textDecoration: 'none',
} as const;

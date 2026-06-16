'use client';

// ContextChangeLogTab · Change Log tab
//
// Filter chips: All / Strategy / Vendor / Ops
// Table: When | Change | Handling | Surface

import { useState } from 'react';

const C = {
  panel: '#FFFFFF',
  ink: '#1B1A17',
  muted: '#6F6A61',
  line: '#E6E2DA',
  line2: '#EFECE5',
  chip: '#F1EEE7',
  fresh: '#3F7A5B',
  freshBg: '#3F7A5B14',
  attention: '#B5852A',
  attentionBg: '#B5852A18',
  stale: '#B4513C',
  staleBg: '#B4513C16',
  review: '#7A5BA8',
  reviewBg: '#7A5BA814',
};

type ChangeTag = 'all' | 'strategy' | 'vendor' | 'ops';
type ReviewType = 'review' | 'auto';

interface ChangeEntry {
  t: string;
  src: string;
  ty: string;
  mat: 'high' | 'medium';
  sf: string;
  rev: ReviewType;
  tag: Exclude<ChangeTag, 'all'>;
  txt: string;
}

const CHANGES: ChangeEntry[] = [
  { t: 'Jun 15', src: 'AMS Board Memo', ty: 'new claim', mat: 'high', sf: 'Insights', rev: 'review', tag: 'strategy', txt: 'CIO names AMS consolidation top-3 FY27 priority.' },
  { t: 'Jun 12', src: 'AI Initiative Register', ty: 'updated', mat: 'medium', sf: 'Insights', rev: 'auto', tag: 'strategy', txt: 'Dev Productivity AI moved Pilot → Scaling.' },
  { t: 'Jun 03', src: 'Operating telemetry', ty: 'updated', mat: 'medium', sf: 'Tower', rev: 'auto', tag: 'vendor', txt: 'Copilot active users 31% (was 27%) — period preserved.' },
  { t: 'May 28', src: 'Vendor Contracts', ty: 'changed', mat: 'high', sf: 'Insights', rev: 'review', tag: 'vendor', txt: 'Kyndryl AMS renewal risk raised to High.' },
  { t: 'Apr 30', src: 'Operating telemetry', ty: 'updated', mat: 'medium', sf: 'Insights', rev: 'auto', tag: 'ops', txt: 'MTTR worsened 22% QoQ, breaching P2 SLA on 3 services.' },
];

const FILTER_TABS: { key: ChangeTag; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'strategy', label: 'Strategy' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'ops', label: 'Ops' },
];

export function ContextChangeLogTab() {
  const [filter, setFilter] = useState<ChangeTag>('all');

  const rows = filter === 'all' ? CHANGES : CHANGES.filter((c) => c.tag === filter);

  return (
    <div>
      <h2
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 21,
          fontWeight: 400,
          margin: '0 0 2px',
          color: C.ink,
        }}
      >
        Change Log
      </h2>
      <p style={{ color: C.muted, fontSize: 12.5, margin: '0 0 14px', maxWidth: 720 }}>
        What changed this period and what needs review before it&apos;s trusted.
      </p>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 16, alignItems: 'center' }}>
        <span
          style={{
            fontSize: 10.5,
            color: C.muted,
            alignSelf: 'center',
            marginRight: 2,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.4px',
          }}
        >
          Filter
        </span>
        {FILTER_TABS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            style={{
              fontSize: 11.5,
              border: `1px solid ${filter === f.key ? C.ink : C.line}`,
              background: filter === f.key ? C.ink : '#fff',
              borderRadius: 20,
              padding: '4px 10px',
              color: filter === f.key ? '#fff' : C.muted,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Change table */}
      <div
        style={{
          background: C.panel,
          border: `1px solid ${C.line}`,
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead>
            <tr>
              {['When', 'Change', 'Handling', '→ Surface'].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: 'left',
                    fontSize: 10,
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.5px',
                    color: C.muted,
                    fontWeight: 600,
                    padding: '0 10px 8px',
                    borderBottom: `1px solid ${C.line}`,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((ch, idx) => (
              <tr key={idx}>
                <td
                  style={{
                    padding: '9px 10px',
                    borderBottom: idx < rows.length - 1 ? `1px solid ${C.line2}` : 'none',
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap' as const,
                    color: C.muted,
                    fontSize: 12,
                  }}
                >
                  {ch.t}
                </td>
                <td style={{ padding: '9px 10px', borderBottom: idx < rows.length - 1 ? `1px solid ${C.line2}` : 'none' }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: ch.mat === 'high' ? C.stale : C.attention,
                      display: 'inline-block',
                      verticalAlign: 'middle',
                      marginRight: 6,
                    }}
                  />
                  {ch.txt}
                  <br />
                  <span style={{ fontSize: 10.5, color: C.muted }}>
                    {ch.src} · {ch.ty}
                  </span>
                </td>
                <td style={{ padding: '9px 10px', borderBottom: idx < rows.length - 1 ? `1px solid ${C.line2}` : 'none' }}>
                  <span
                    style={{
                      fontSize: 10.5,
                      padding: '2px 7px',
                      borderRadius: 20,
                      background: ch.rev === 'review' ? C.reviewBg : C.freshBg,
                      color: ch.rev === 'review' ? C.review : C.fresh,
                    }}
                  >
                    {ch.rev}
                  </span>
                </td>
                <td
                  style={{
                    padding: '9px 10px',
                    borderBottom: idx < rows.length - 1 ? `1px solid ${C.line2}` : 'none',
                    color: C.muted,
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap' as const,
                    fontSize: 12,
                  }}
                >
                  {ch.sf}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '24px 10px', color: C.muted, textAlign: 'center' }}>
                  No changes match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div
        style={{
          fontSize: 11.5,
          color: C.muted,
          marginTop: 10,
        }}
      >
        <strong>2 changes</strong> awaiting review this month → Context Inbox.
      </div>
    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import { RADIUS, SPACING } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';

// ─── Serialized types (JSON-safe, passed from server) ─────────────────────────

export interface SerializedPatternDoc {
  id: string;
  title: string;
  domain: string;
  tier: string;
  thesis: string;
  applicability: string;
  body: string;
  version: string;
  createdAt: string;
}

export interface PatternDocsClientProps {
  patterns: SerializedPatternDoc[];
}

// ─── Style constants ──────────────────────────────────────────────────────────

const CARD: React.CSSProperties = {
  background: SHELL.CARD_WHITE,
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: RADIUS.lg,
  overflow: 'hidden',
};

const LABEL_UPPER: React.CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: SHELL.INK_MUTED,
  fontWeight: 600,
};

const BADGE_BASE: React.CSSProperties = {
  display: 'inline-block',
  borderRadius: RADIUS.pill,
  padding: '2px 10px',
  fontFamily: SHELL.SANS,
  fontSize: 11,
  fontWeight: 600,
};

function TierBadge({ tier }: { tier: string }) {
  const style: React.CSSProperties =
    tier === 'M'
      ? { ...BADGE_BASE, background: SHELL.BLUE_BG, color: SHELL.INK_MID }
      : tier === 'authoritative'
        ? { ...BADGE_BASE, background: SHELL.MINT_BG, color: SHELL.MINT_TEXT }
        : { ...BADGE_BASE, background: SHELL.GRAY_BG, color: SHELL.GRAY_TEXT };
  return <span style={style}>{tier}</span>;
}

function DomainBadge({ domain }: { domain: string }) {
  return (
    <span
      style={{
        ...BADGE_BASE,
        background: SHELL.PEACH_BG,
        color: SHELL.PEACH_TEXT,
        textTransform: 'none',
        fontFamily: SHELL.MONO,
        fontSize: 11,
      }}
    >
      {domain}
    </span>
  );
}

// ─── Minimal Markdown renderer ────────────────────────────────────────────────
// Handles ## headings and bullet lines. No library dependency.

function renderBodyLine(line: string, idx: number): React.ReactNode {
  if (line.startsWith('## ')) {
    return (
      <div
        key={idx}
        style={{
          fontFamily: SHELL.SERIF,
          fontSize: 17,
          fontWeight: 600,
          color: SHELL.INK,
          marginTop: 20,
          marginBottom: 4,
          letterSpacing: '-0.01em',
        }}
      >
        {line.slice(3)}
      </div>
    );
  }
  if (line.startsWith('# ')) {
    return (
      <div
        key={idx}
        style={{
          fontFamily: SHELL.SERIF,
          fontSize: 20,
          fontWeight: 700,
          color: SHELL.INK,
          marginTop: 24,
          marginBottom: 6,
          letterSpacing: '-0.01em',
        }}
      >
        {line.slice(2)}
      </div>
    );
  }
  if (line.startsWith('- ') || line.startsWith('* ')) {
    return (
      <div
        key={idx}
        style={{
          display: 'flex',
          gap: 8,
          fontFamily: SHELL.SANS,
          fontSize: 14,
          color: SHELL.INK_MID,
          lineHeight: 1.6,
          marginLeft: 8,
        }}
      >
        <span style={{ flexShrink: 0, color: SHELL.INK_MUTED }}>·</span>
        <span>{line.slice(2)}</span>
      </div>
    );
  }
  if (line.trim() === '') {
    return <div key={idx} style={{ height: 8 }} />;
  }
  return (
    <p
      key={idx}
      style={{
        fontFamily: SHELL.SANS,
        fontSize: 14,
        color: SHELL.INK_MID,
        lineHeight: 1.65,
        margin: '4px 0',
      }}
    >
      {line}
    </p>
  );
}

function PatternBodyRenderer({ body }: { body: string }) {
  const lines = body.split('\n');
  return (
    <div style={{ padding: `${SPACING.lg} ${SPACING.lg}` }}>
      {lines.map((line, idx) => renderBodyLine(line, idx))}
    </div>
  );
}

// ─── Domain grouping helper ───────────────────────────────────────────────────

function groupByDomain(patterns: SerializedPatternDoc[]): Map<string, SerializedPatternDoc[]> {
  const map = new Map<string, SerializedPatternDoc[]>();
  for (const p of patterns) {
    const list = map.get(p.domain) ?? [];
    list.push(p);
    map.set(p.domain, list);
  }
  return map;
}

// ─── Main client component ────────────────────────────────────────────────────

export function PatternDocsClient({ patterns }: PatternDocsClientProps) {
  const [selectedId, setSelectedId] = useState<string>('');

  const grouped = useMemo(() => groupByDomain(patterns), [patterns]);
  const selected = useMemo(
    () => patterns.find((p) => p.id === selectedId) ?? null,
    [patterns, selectedId],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
      {/* Pattern selector */}
      <div style={{ ...CARD }}>
        <div
          style={{
            padding: `${SPACING.md} ${SPACING.lg}`,
            borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
            background: SHELL.PAPER_SOFT,
          }}
        >
          <div style={LABEL_UPPER}>Select pattern</div>
        </div>
        <div style={{ padding: `${SPACING.md} ${SPACING.lg}` }}>
          <select
            value={selectedId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedId(e.target.value)}
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 14,
              color: SHELL.INK,
              background: SHELL.CARD_WHITE,
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: RADIUS.md,
              padding: '8px 12px',
              width: '100%',
              maxWidth: 640,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="">— choose a pattern —</option>
            {Array.from(grouped.entries()).map((entry) => {
              const [domain, domainPatterns] = entry as [string, SerializedPatternDoc[]];
              return (
                <optgroup key={domain} label={domain}>
                  {domainPatterns.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
          {patterns.length > 0 && (
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 11,
                color: SHELL.INK_MUTED,
                marginTop: 6,
              }}
            >
              {patterns.length} patterns across {grouped.size} domains
            </div>
          )}
        </div>
      </div>

      {/* Documentation pane */}
      {selected ? (
        <div style={{ ...CARD }}>
          {/* Header */}
          <div
            style={{
              padding: `${SPACING.lg} ${SPACING.lg} ${SPACING.md}`,
              borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
              background: SHELL.PAPER_SOFT,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {/* Badges row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <TierBadge tier={selected.tier} />
              <DomainBadge domain={selected.domain} />
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 11,
                  color: SHELL.INK_MUTED,
                  marginLeft: 4,
                }}
              >
                v{selected.version}
              </span>
            </div>
            {/* Title */}
            <div
              style={{
                fontFamily: SHELL.SERIF,
                fontSize: 28,
                color: SHELL.INK,
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                fontWeight: 600,
              }}
            >
              {selected.title}
            </div>
            {/* Thesis */}
            <div
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 14,
                color: SHELL.INK_MID,
                fontStyle: 'italic',
                lineHeight: 1.5,
                maxWidth: 720,
              }}
            >
              {selected.thesis}
            </div>
          </div>

          {/* Applicability section */}
          <div
            style={{
              padding: `${SPACING.md} ${SPACING.lg}`,
              borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
            }}
          >
            <div
              style={{
                ...LABEL_UPPER,
                marginBottom: 8,
              }}
            >
              When to apply
            </div>
            <div
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 14,
                color: SHELL.INK_MID,
                lineHeight: 1.6,
                maxWidth: 720,
              }}
            >
              {selected.applicability}
            </div>
          </div>

          {/* Body section */}
          <div style={{ borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}` }}>
            <div
              style={{
                padding: `${SPACING.md} ${SPACING.lg} 0`,
              }}
            >
              <div style={LABEL_UPPER}>Documentation</div>
            </div>
            <PatternBodyRenderer body={selected.body} />
          </div>

          {/* Footer */}
          <div
            style={{
              padding: `${SPACING.sm} ${SPACING.lg}`,
              background: SHELL.PAPER_SOFT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: SPACING.md,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 11,
                color: SHELL.INK_MUTED,
              }}
            >
              {selected.id}
            </span>
            <span
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 11,
                color: SHELL.INK_MUTED,
              }}
            >
              created {selected.createdAt}
            </span>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: SHELL.CARD_WHITE,
            border: `1px dashed ${SHELL.CARD_LINE}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.xl,
            textAlign: 'center',
            fontFamily: SHELL.SANS,
            fontSize: 14,
            color: SHELL.INK_MUTED,
            lineHeight: 1.5,
          }}
        >
          Select a pattern to view its documentation
        </div>
      )}
    </div>
  );
}

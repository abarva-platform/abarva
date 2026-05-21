'use client';

/**
 * FunctionVitalsStrip — block 3 of the function-aware decision home (§4.3).
 *
 * The depth gradient made literal. The 1–3 VBC operating metrics that are
 * *off* are rendered open, each with its read. The rest — in-range metrics
 * and seed gaps — are collapsed behind one deliberate gesture, so the surface
 * never opens as a twelve-tile dashboard (the §4 hard fail).
 *
 * The data is resolved server-side; this component only owns the one piece of
 * interactivity the depth gradient needs: the expand. Locked design system.
 */

import { useState } from 'react';
import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { FunctionVital } from '@/lib/programs/expert-kernel/domain/meridian-vbc-decision-home';

const STATE_META: Record<
  FunctionVital['state'],
  { label: string; bg: string; line: string; text: string }
> = {
  off: { label: 'Off benchmark', bg: SHELL.RUST_BG, line: SHELL.PEACH_LINE, text: SHELL.RUST_TEXT },
  in_range: { label: 'In range', bg: SHELL.MINT_BG, line: SHELL.MINT_LINE, text: SHELL.MINT_TEXT },
  seed_gap: { label: 'Seed gap', bg: SHELL.GRAY_BG, line: SHELL.GRAY_LINE, text: SHELL.GRAY_TEXT },
};

function formatValue(value: number, unit: string): string {
  // Unit strings are descriptive ("% of premium / benchmark revenue"); show
  // a clean numeric and the leading unit token so the figure reads at a glance.
  const compact = unit.trim().startsWith('%') || unit.includes('%') ? '%' : '';
  return compact ? `${value}${compact}` : `${value}`;
}

function VitalCard({ vital, dim }: { vital: FunctionVital; dim: boolean }) {
  const meta = STATE_META[vital.state];
  const card: CSSProperties = {
    background: SHELL.CARD_WHITE,
    border: `1px solid ${vital.state === 'off' ? SHELL.PEACH_LINE : SHELL.CARD_LINE}`,
    borderRadius: 10,
    padding: '16px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    opacity: dim ? 0.92 : 1,
  };
  return (
    <div style={card}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 13,
            fontWeight: 600,
            color: SHELL.INK,
            lineHeight: 1.3,
          }}
        >
          {vital.name}
        </span>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            background: meta.bg,
            border: `1px solid ${meta.line}`,
            color: meta.text,
            borderRadius: 5,
            padding: '3px 7px',
            whiteSpace: 'nowrap',
          }}
        >
          {meta.label}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        {vital.meridianValue !== null ? (
          <span
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 28,
              fontWeight: 400,
              color: SHELL.INK,
              lineHeight: 1,
            }}
          >
            {formatValue(vital.meridianValue, vital.unit)}
          </span>
        ) : (
          <span
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 20,
              fontStyle: 'italic',
              color: SHELL.GRAY_TEXT,
              lineHeight: 1,
            }}
          >
            not measured
          </span>
        )}
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            color: SHELL.INK_MUTED,
          }}
        >
          benchmark {vital.benchmarkLow}–{vital.benchmarkHigh}
        </span>
      </div>

      <p
        style={{
          margin: 0,
          fontFamily: SHELL.SANS,
          fontSize: 12.5,
          lineHeight: 1.55,
          color: vital.state === 'seed_gap' ? SHELL.GRAY_TEXT : SHELL.INK_SOFT,
        }}
      >
        {vital.read}
      </p>

      <p
        style={{
          margin: 0,
          fontFamily: SHELL.MONO,
          fontSize: 9.5,
          lineHeight: 1.5,
          color: SHELL.INK_MUTED,
        }}
      >
        {vital.source}
      </p>
    </div>
  );
}

interface FunctionVitalsStripProps {
  off: FunctionVital[];
  rest: FunctionVital[];
  groundedCount: number;
  expectedCount: number;
}

export function FunctionVitalsStrip({
  off,
  rest,
  groundedCount,
  expectedCount,
}: FunctionVitalsStripProps) {
  const [expanded, setExpanded] = useState(false);
  const seedGapCount = rest.filter((v) => v.state === 'seed_gap').length;

  return (
    <section
      aria-label="The function's vitals"
      style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h2
          style={{
            margin: 0,
            fontFamily: SHELL.SERIF,
            fontSize: 20,
            fontWeight: 400,
            color: SHELL.INK,
          }}
        >
          The function&rsquo;s vitals
        </h2>
        <p
          style={{
            margin: 0,
            fontFamily: SHELL.SANS,
            fontSize: 12.5,
            color: SHELL.INK_SOFT,
            lineHeight: 1.5,
          }}
        >
          {`The Population-Health / VBC operating metrics. ${off.length} of ` +
            `${expectedCount} are off benchmark and surfaced here. Meridian’s ` +
            `audited substrate grounds ${groundedCount} of ${expectedCount}; ` +
            `the remaining ${seedGapCount} are honest seed gaps, collapsed ` +
            `below.`}
        </p>
      </div>

      {/* The off-benchmark vitals — always open. */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 12,
        }}
      >
        {off.map((v) => (
          <VitalCard key={v.key} vital={v} dim={false} />
        ))}
      </div>

      {/* One gesture into the rest — the depth gradient. */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        style={{
          alignSelf: 'flex-start',
          fontFamily: SHELL.MONO,
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: SHELL.INK_MID,
          background: SHELL.PAPER_SOFT,
          border: `1px solid ${SHELL.CARD_LINE}`,
          borderRadius: 6,
          padding: '7px 12px',
          cursor: 'pointer',
        }}
      >
        {expanded
          ? '— Collapse the rest'
          : `+ Show the remaining ${rest.length} vitals (${seedGapCount} seed gaps)`}
      </button>

      {expanded ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 12,
          }}
        >
          {rest.map((v) => (
            <VitalCard key={v.key} vital={v} dim />
          ))}
        </div>
      ) : null}
    </section>
  );
}

// Source Decision Queue surface — the triggered-decision inbox for Source.
//
// Renders the assembled `SourceDecisionQueue`: a deterministically ordered
// list of typed decision cards, grouped by urgency band, each deep-linking
// into a pre-loaded workflow. Never empty-and-silent — an empty queue renders
// the `emptyState` line. Locked design system (cream paper, serif headings).

import Link from 'next/link';
import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import type {
  DecisionTriggerKind,
  DecisionUrgency,
  SourceDecisionItem,
  SourceDecisionQueue,
} from '@/lib/source/decision-queue/types';

const CARD: CSSProperties = {
  background: SHELL.CARD_WHITE,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const URGENCY_META: Record<
  DecisionUrgency,
  { label: string; bg: string; line: string; text: string }
> = {
  today: { label: 'Today', bg: SHELL.RUST_BG, line: SHELL.PEACH_LINE, text: SHELL.RUST_TEXT },
  this_week: { label: 'This week', bg: SHELL.PEACH_BG, line: SHELL.PEACH_LINE, text: SHELL.PEACH_TEXT },
  this_month: { label: 'This month', bg: SHELL.BLUE_BG, line: SHELL.BLUE_LINE, text: SHELL.INK_MID },
  watch: { label: 'Watch', bg: SHELL.GRAY_BG, line: SHELL.GRAY_LINE, text: SHELL.GRAY_TEXT },
};

const KIND_LABEL: Record<DecisionTriggerKind, string> = {
  renewal: 'Renewal',
  notice_window: 'Auto-renewal trap',
  overlap_shelfware: 'Overlap / shelfware',
  savings_opportunity: 'Savings opportunity',
  blocked_missing_evidence: 'Blocked — context gap',
};

const BAND_ORDER: DecisionUrgency[] = ['today', 'this_week', 'this_month', 'watch'];

function formatUsd(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

function Pill({
  text,
  bg,
  line,
  color,
}: {
  text: string;
  bg: string;
  line: string;
  color: string;
}) {
  return (
    <span
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 9,
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        background: bg,
        border: '1px solid ' + line,
        color,
        borderRadius: 5,
        padding: '3px 7px',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  );
}

function DecisionCard({ item }: { item: SourceDecisionItem }) {
  const urgency = URGENCY_META[item.urgency];
  return (
    <article style={CARD}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <Pill text={KIND_LABEL[item.kind]} bg={SHELL.PAPER_DEEP} line={SHELL.CARD_LINE} color={SHELL.INK_SOFT} />
        <Pill text={urgency.label} bg={urgency.bg} line={urgency.line} color={urgency.text} />
        {item.valueAtStakeUsd !== null ? (
          <Pill
            text={`${formatUsd(item.valueAtStakeUsd)} at stake`}
            bg={SHELL.MINT_BG}
            line={SHELL.MINT_LINE}
            color={SHELL.MINT_TEXT}
          />
        ) : null}
      </div>
      <h3
        style={{
          fontFamily: SHELL.SERIF,
          fontWeight: 'normal',
          fontSize: 17,
          color: SHELL.INK,
          margin: 0,
          lineHeight: 1.3,
        }}
      >
        {item.headline}
      </h3>
      <p style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_SOFT, margin: 0, lineHeight: 1.5 }}>
        {item.whyItMatters}
      </p>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginTop: 4,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_MUTED }}>
          {item.recommendedAction}
        </span>
        <Link
          href={item.deepLink}
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12,
            fontWeight: 600,
            color: SHELL.PAPER,
            background: SHELL.INK,
            border: '1px solid ' + SHELL.INK,
            borderRadius: 6,
            padding: '7px 14px',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Open decision →
        </Link>
      </div>
      <span style={{ fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED }}>
        Evidence: {item.evidenceRefs.join(' · ')}
      </span>
    </article>
  );
}

export function SourceDecisionQueueView({ queue }: { queue: SourceDecisionQueue }) {
  const total = queue.items.length;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 860 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: SHELL.INK_MUTED,
          }}
        >
          Source · Decision Queue
        </span>
        <h1
          style={{
            fontFamily: SHELL.SERIF,
            fontWeight: 'normal',
            fontSize: 26,
            color: SHELL.INK,
            margin: 0,
          }}
        >
          {total > 0
            ? `${total} decision${total === 1 ? '' : 's'} need your attention`
            : 'Nothing needs a decision today'}
        </h1>
        <p style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_SOFT, margin: 0 }}>
          What the sourcing function should decide today — renewals, auto-renewal traps,
          overlapping spend and should-cost gaps, sorted by urgency then value at stake.
        </p>
        {total > 0 ? (
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            {BAND_ORDER.filter((b) => queue.bandCounts[b] > 0).map((band) => {
              const meta = URGENCY_META[band];
              return (
                <Pill
                  key={band}
                  text={`${meta.label}: ${queue.bandCounts[band]}`}
                  bg={meta.bg}
                  line={meta.line}
                  color={meta.text}
                />
              );
            })}
          </div>
        ) : null}
      </header>

      {queue.emptyState ? (
        <div
          style={{
            ...CARD,
            alignItems: 'flex-start',
            background: SHELL.PAPER_SOFT,
          }}
        >
          <p style={{ fontFamily: SHELL.SANS, fontSize: 14, color: SHELL.INK_MID, margin: 0 }}>
            {queue.emptyState}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {queue.items.map((item) => (
            <DecisionCard key={item.itemId} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

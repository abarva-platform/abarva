// BetSelectionView — the function-aware Intelligence surface (bet-selection facet).
//
// Renders, top to bottom, exactly the three blocks of the experience spec §3
// bar (docs/strategy/ABARVA-EXPERIENCE-DESIGN-SPEC.md), for the "which AI bet
// should we make" surface:
//
//   1. The answer            — one confident headline: the VBC AI bet to make
//                              first, in VBC's language, honest where the data
//                              to assert it is a seed gap.
//   2. The ranked bets       — the Function Pack's AI use-case archetypes as
//                              candidate bets, ranked by what the function +
//                              Meridian's substrate make most fundable now.
//   3. What gates the ranking — the evidence / seed gaps that would move the
//                              order if closed.
//
// The answer (block 1) renders FIRST and is legible in seconds — no navigation
// to reach it. That is the §3 "answer renders first" bar.
//
// Pure server presentation: the data is the bound Function Pack + Meridian
// substrate from `meridian-vbc-bet-selection.ts`. No client island is needed —
// the depth gradient is "one gesture into the costed Move", a Link. Locked
// design system — no new palette, no decoration.

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { SHELL } from '@/lib/shell/shell-tokens';
import type {
  BetRead,
  CandidateBet,
  MeridianVbcBetSelection,
} from '@/lib/programs/expert-kernel/domain/meridian-vbc-bet-selection';

// ─────────────────────────────────────────────────────────────────────────────
// Shared chrome
// ─────────────────────────────────────────────────────────────────────────────

const READ_META: Record<
  BetRead,
  { label: string; bg: string; line: string; text: string }
> = {
  fund_first: {
    label: 'Fund first',
    bg: SHELL.MINT_BG,
    line: SHELL.MINT_LINE,
    text: SHELL.MINT_TEXT,
  },
  shape: {
    label: 'Shape',
    bg: SHELL.PEACH_BG,
    line: SHELL.PEACH_LINE,
    text: SHELL.PEACH_TEXT,
  },
  hold_for_evidence: {
    label: 'Hold for evidence',
    bg: SHELL.GRAY_BG,
    line: SHELL.GRAY_LINE,
    text: SHELL.GRAY_TEXT,
  },
};

const ADOPTION_LABEL: Record<string, string> = {
  mainstream: 'Mainstream',
  emerging: 'Emerging',
  experimenting: 'Experimenting',
  early: 'Early',
};

const POSTURE_LABEL: Record<string, string> = {
  'human-in-the-loop': 'Human in the loop',
  'human-on-the-loop': 'Human on the loop',
  'human-approval-required': 'Human approval required',
  'autonomous-with-audit': 'Autonomous with audit',
};

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
        border: `1px solid ${line}`,
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

function SectionHeading({ title, sub }: { title: string; sub: string }) {
  return (
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
        {title}
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
        {sub}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Block 1 — the answer
// ─────────────────────────────────────────────────────────────────────────────

function TheAnswer({ selection }: { selection: MeridianVbcBetSelection }) {
  const card: CSSProperties = {
    background: SHELL.CARD_WHITE,
    border: `1px solid ${SHELL.CARD_LINE}`,
    borderRadius: 14,
    padding: '28px 30px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  };
  const { headline } = selection;
  return (
    // data-testid lets the test assert this answer precedes the ranked-bets
    // list in document order — the §3 "answer renders first" bar.
    <section
      data-testid="bet-selection-headline"
      aria-label="The answer"
      style={card}
    >
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: SHELL.INK_MUTED,
        }}
      >
        {headline.eyebrow}
      </span>

      {/* The question, stated as the user would ask it. */}
      <p
        style={{
          margin: 0,
          fontFamily: SHELL.SANS,
          fontSize: 12.5,
          fontWeight: 600,
          letterSpacing: '0.01em',
          color: SHELL.INK_SOFT,
        }}
      >
        {headline.question}
      </p>

      {/* The answer — one confident line. */}
      <h1
        style={{
          margin: 0,
          fontFamily: SHELL.SERIF,
          fontSize: 30,
          fontWeight: 400,
          lineHeight: 1.32,
          color: SHELL.INK,
          letterSpacing: '-0.01em',
          maxWidth: '52ch',
        }}
      >
        {headline.answer}
      </h1>

      {/* Why this bet — grounded in Meridian's audited substrate. */}
      <p
        style={{
          margin: 0,
          fontFamily: SHELL.SANS,
          fontSize: 13.5,
          lineHeight: 1.6,
          color: SHELL.INK_MID,
          maxWidth: '64ch',
        }}
      >
        {headline.rationale}
      </p>

      {/* The honesty clause — the §3 "honest by construction" bar made part of
          the answer itself, not buried. */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
          background: SHELL.PAPER_SOFT,
          border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
          borderRadius: 8,
          padding: '12px 14px',
          maxWidth: '64ch',
        }}
      >
        <span style={{ marginTop: 1 }}>
          <Pill
            text="Honest"
            bg={SHELL.GRAY_BG}
            line={SHELL.GRAY_LINE}
            color={SHELL.GRAY_TEXT}
          />
        </span>
        <p
          style={{
            margin: 0,
            fontFamily: SHELL.SANS,
            fontSize: 12.5,
            lineHeight: 1.6,
            color: SHELL.INK_SOFT,
          }}
        >
          {headline.honestyClause}
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Block 2 — the ranked bets
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A small, locked-style rank glyph — a serif numeral in a quiet disc. Reuses
 * the board-grade visual idiom: restrained, no decoration, no new palette.
 */
function RankGlyph({ rank, read }: { rank: number; read: BetRead }) {
  const meta = READ_META[read];
  return (
    <svg
      width={34}
      height={34}
      viewBox="0 0 34 34"
      aria-hidden
      style={{ flexShrink: 0 }}
    >
      <circle
        cx={17}
        cy={17}
        r={16}
        fill={meta.bg}
        stroke={meta.line}
        strokeWidth={1}
      />
      <text
        x={17}
        y={17}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily={SHELL.SERIF}
        fontSize={16}
        fill={meta.text}
      >
        {rank}
      </text>
    </svg>
  );
}

function MetricChips({ bet }: { bet: CandidateBet }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {bet.movesMetrics.map((m) => (
        <span
          key={m.metricName}
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            letterSpacing: '0.03em',
            background: m.grounded ? SHELL.MINT_BG : SHELL.GRAY_BG,
            border: `1px solid ${m.grounded ? SHELL.MINT_LINE : SHELL.GRAY_LINE}`,
            color: m.grounded ? SHELL.MINT_TEXT : SHELL.GRAY_TEXT,
            borderRadius: 5,
            padding: '3px 7px',
          }}
        >
          {m.metricName}
          {m.grounded ? ' · grounded' : ' · seed gap'}
        </span>
      ))}
    </div>
  );
}

function BetCard({ bet }: { bet: CandidateBet }) {
  const meta = READ_META[bet.read];
  const shell: CSSProperties = {
    background: SHELL.CARD_WHITE,
    border: `1px solid ${bet.read === 'fund_first' ? SHELL.MINT_LINE : SHELL.CARD_LINE}`,
    borderRadius: 12,
    padding: '20px 22px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  };
  const fieldLabel: CSSProperties = {
    fontFamily: SHELL.MONO,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: '0.09em',
    color: SHELL.INK_MUTED,
  };
  const fieldBody: CSSProperties = {
    margin: '3px 0 0',
    fontFamily: SHELL.SANS,
    fontSize: 12.5,
    lineHeight: 1.55,
    color: SHELL.INK_SOFT,
  };
  return (
    <article style={shell}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <RankGlyph rank={bet.rank} read={bet.read} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Pill
              text={meta.label}
              bg={meta.bg}
              line={meta.line}
              color={meta.text}
            />
            <Pill
              text={ADOPTION_LABEL[bet.adoptionProfile] ?? bet.adoptionProfile}
              bg={SHELL.BLUE_BG}
              line={SHELL.BLUE_LINE}
              color={SHELL.INK_MID}
            />
            {bet.restsOnSeedGap ? (
              <Pill
                text="Rests on a seed gap"
                bg={SHELL.GRAY_BG}
                line={SHELL.GRAY_LINE}
                color={SHELL.GRAY_TEXT}
              />
            ) : null}
          </div>
          {/* The bet, named — the answer for this card, stated first. */}
          <h3
            style={{
              margin: 0,
              fontFamily: SHELL.SERIF,
              fontSize: 18,
              fontWeight: 400,
              lineHeight: 1.36,
              color: SHELL.INK,
            }}
          >
            {bet.name}
          </h3>
        </div>
      </div>

      <div>
        <span style={fieldLabel}>Value mechanism</span>
        <p style={fieldBody}>{bet.valueMechanism}</p>
      </div>

      {/* The one piece of evidence — or the one seed gap — that gates the bet. */}
      <div
        style={{
          background: bet.restsOnSeedGap ? SHELL.GRAY_BG : SHELL.PAPER_SOFT,
          border: `1px solid ${bet.restsOnSeedGap ? SHELL.GRAY_LINE : SHELL.CARD_LINE_SOFT}`,
          borderRadius: 8,
          padding: '11px 13px',
        }}
      >
        <span style={fieldLabel}>
          {bet.restsOnSeedGap ? 'What gates it' : 'What makes it fundable'}
        </span>
        <p
          style={{
            ...fieldBody,
            color: bet.restsOnSeedGap ? SHELL.GRAY_TEXT : SHELL.INK_MID,
          }}
        >
          {bet.evidenceOrGate}
        </p>
      </div>

      <div>
        <span style={fieldLabel}>Metrics it moves</span>
        <div style={{ marginTop: 5 }}>
          <MetricChips bet={bet} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={fieldLabel}>Control posture</span>
        <span
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 11.5,
            color: SHELL.INK_SOFT,
          }}
        >
          {POSTURE_LABEL[bet.controlPosture] ?? bet.controlPosture}
        </span>
      </div>

      {/* One gesture deeper — into the bet's full, costed case. */}
      <Link
        href={bet.gestureHref}
        style={{
          alignSelf: 'flex-start',
          fontFamily: SHELL.SANS,
          fontSize: 12,
          fontWeight: 600,
          color: SHELL.PAPER,
          background: SHELL.INK,
          borderRadius: 7,
          padding: '8px 14px',
          textDecoration: 'none',
        }}
      >
        {bet.gestureLabel} →
      </Link>
    </article>
  );
}

function TheRankedBets({ selection }: { selection: MeridianVbcBetSelection }) {
  return (
    <section
      data-testid="bet-selection-ranked-bets"
      aria-label="The ranked bets"
      style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <SectionHeading
        title="The ranked bets"
        sub={
          `The value-based-care function’s ${selection.totalBetCount} AI ` +
          `use-case archetypes, ranked as candidate bets by what the function ` +
          `and Meridian’s audited substrate make most fundable now. ` +
          `${selection.groundedBetCount} of ${selection.totalBetCount} can be ` +
          `grounded against Meridian’s substrate today; the rest are held for ` +
          `evidence — honestly, not silently dropped.`
        }
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {selection.bets.map((bet) => (
          <BetCard key={bet.key} bet={bet} />
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Block 3 — what gates the ranking
// ─────────────────────────────────────────────────────────────────────────────

function WhatGatesTheRanking({
  selection,
}: {
  selection: MeridianVbcBetSelection;
}) {
  return (
    <section
      data-testid="bet-selection-gates"
      aria-label="What gates the ranking"
      style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <SectionHeading
        title="What gates the ranking"
        sub="The evidence and seed gaps that would move this order if closed. Shown plainly — the no-fabrication discipline made visible."
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {selection.gates.map((gate) => (
          <div
            key={gate.key}
            style={{
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start',
              background: SHELL.PAPER_SOFT,
              border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
              borderRadius: 10,
              padding: '14px 16px',
            }}
          >
            <span
              aria-hidden
              style={{
                marginTop: 4,
                flexShrink: 0,
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: SHELL.GRAY_BG,
                border: `1px solid ${SHELL.GRAY_LINE}`,
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 13,
                  fontWeight: 600,
                  color: SHELL.INK,
                }}
              >
                {gate.title}
              </span>
              <p
                style={{
                  margin: 0,
                  fontFamily: SHELL.SANS,
                  fontSize: 12.5,
                  lineHeight: 1.55,
                  color: SHELL.INK_SOFT,
                }}
              >
                {gate.description}
              </p>
              <p
                style={{
                  margin: 0,
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  lineHeight: 1.55,
                  letterSpacing: '0.01em',
                  color: SHELL.PEACH_TEXT,
                }}
              >
                If closed: {gate.whatItWouldMove}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The surface
// ─────────────────────────────────────────────────────────────────────────────

interface BetSelectionViewProps {
  /** The bound bet-selection data, or `null` when the VBC pack is uncatalogued. */
  selection: MeridianVbcBetSelection | null;
}

export function BetSelectionView({ selection }: BetSelectionViewProps) {
  // Honest fallback — the registry returned no pack. The surface says so
  // plainly rather than fabricating a frame (spec §3).
  if (!selection) {
    return (
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '48px 0',
          fontFamily: SHELL.SANS,
          fontSize: 14,
          color: SHELL.INK_SOFT,
          lineHeight: 1.6,
        }}
      >
        <p>
          No curated Population-Health / Value-Based-Care Function Pack is
          catalogued for this tenant. The function-aware bet-selection surface
          cannot be rendered without a bound pack — and it will not fabricate
          one.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 1080,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 36,
        paddingBottom: 56,
      }}
    >
      {/* Provenance line — the bound frame, named. Quiet, above the answer. */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
          paddingTop: 4,
        }}
      >
        <Pill
          text="Function-aware"
          bg={SHELL.BLUE_BG}
          line={SHELL.BLUE_LINE}
          color={SHELL.INK_MID}
        />
        <span
          style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED }}
        >
          {selection.tenantName} · {selection.functionLabel} ·{' '}
          {selection.packProvenance}
        </span>
      </div>

      {/* 1 — The answer. The recommended bet, first. */}
      <TheAnswer selection={selection} />

      {/* 2 — The ranked bets. */}
      <TheRankedBets selection={selection} />

      {/* 3 — What gates the ranking. */}
      <WhatGatesTheRanking selection={selection} />
    </div>
  );
}

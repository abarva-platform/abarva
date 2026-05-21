// DecisionHomeView — the function-aware decision home (reference surface v1).
//
// Renders, top to bottom, exactly the four blocks of the experience spec §4
// (docs/strategy/ABARVA-EXPERIENCE-DESIGN-SPEC.md):
//
//   1. The one thing            — a single confident, honest headline
//   2. Decisions that need you  — 2–3 answer-first cards
//   3. The function's vitals    — off-metrics surfaced, the rest collapsed
//   4. Where you are in the cadence — the VBC performance-year rhythm
//
// The answer (block 1) renders FIRST and is legible in seconds — no
// navigation to reach it. The metric strip (block 3) is below it, by design:
// the experience bar's "lead with the answer" law (§3).
//
// Pure server presentation: the data is the bound Function-Pack + Meridian
// substrate from `meridian-vbc-decision-home.ts`. Only block 3's expand is a
// client island. Locked design system — no new palette, no decoration.

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { SHELL } from '@/lib/shell/shell-tokens';
import type {
  DecisionCard,
  DecisionUrgency,
  MeridianVbcDecisionHome,
} from '@/lib/programs/expert-kernel/domain/meridian-vbc-decision-home';
import { FunctionVitalsStrip } from './FunctionVitalsStrip';

// ─────────────────────────────────────────────────────────────────────────────
// Shared chrome
// ─────────────────────────────────────────────────────────────────────────────

const URGENCY_META: Record<
  DecisionUrgency,
  { label: string; bg: string; line: string; text: string }
> = {
  decide_now: {
    label: 'Decide now',
    bg: SHELL.RUST_BG,
    line: SHELL.PEACH_LINE,
    text: SHELL.RUST_TEXT,
  },
  this_cycle: {
    label: 'This cycle',
    bg: SHELL.PEACH_BG,
    line: SHELL.PEACH_LINE,
    text: SHELL.PEACH_TEXT,
  },
  before_settlement: {
    label: 'Before settlement',
    bg: SHELL.BLUE_BG,
    line: SHELL.BLUE_LINE,
    text: SHELL.INK_MID,
  },
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

function SectionHeading({
  title,
  sub,
}: {
  title: string;
  sub: string;
}) {
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
// Block 1 — the one thing
// ─────────────────────────────────────────────────────────────────────────────

function TheOneThing({ home }: { home: MeridianVbcDecisionHome }) {
  const card: CSSProperties = {
    background: SHELL.CARD_WHITE,
    border: `1px solid ${SHELL.CARD_LINE}`,
    borderRadius: 14,
    padding: '28px 30px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  };
  return (
    // data-testid lets the test assert this answer precedes the metric strip
    // in document order — the §3 "answer renders first" bar.
    <section data-testid="decision-home-headline" aria-label="The one thing" style={card}>
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: SHELL.INK_MUTED,
        }}
      >
        {home.headline.eyebrow}
      </span>

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
        {home.headline.statement}
      </h1>

      {/* The honesty clause — the spec's §3 "honest by construction" bar made
          part of the headline itself, not buried. */}
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
          {home.headline.honestyClause}
        </p>
      </div>

      <p
        style={{
          margin: 0,
          fontFamily: SHELL.MONO,
          fontSize: 10,
          letterSpacing: '0.02em',
          color: SHELL.INK_MUTED,
        }}
      >
        {home.headline.cadenceAnchor}
      </p>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Block 2 — decisions that need you
// ─────────────────────────────────────────────────────────────────────────────

function DecisionCardView({ card }: { card: DecisionCard }) {
  const meta = URGENCY_META[card.urgency];
  const shell: CSSProperties = {
    background: SHELL.CARD_WHITE,
    border: `1px solid ${SHELL.CARD_LINE}`,
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
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Pill text={meta.label} bg={meta.bg} line={meta.line} color={meta.text} />
        {card.evidenceRestsOnSeedGap ? (
          <Pill
            text="Rests on a seed gap"
            bg={SHELL.GRAY_BG}
            line={SHELL.GRAY_LINE}
            color={SHELL.GRAY_TEXT}
          />
        ) : null}
      </div>

      {/* The answer — stated first, in the function's own language. */}
      <p
        style={{
          margin: 0,
          fontFamily: SHELL.SERIF,
          fontSize: 17,
          fontWeight: 400,
          lineHeight: 1.4,
          color: SHELL.INK,
        }}
      >
        {card.recommendedAction}
      </p>

      <div>
        <span style={fieldLabel}>The stake</span>
        <p style={fieldBody}>{card.stake}</p>
      </div>

      <div>
        <span style={fieldLabel}>Evidence</span>
        <p style={fieldBody}>{card.evidence}</p>
      </div>

      {/* One gesture into the full, costed decision. */}
      <Link
        href={card.gestureHref}
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
        {card.gestureLabel} →
      </Link>
    </article>
  );
}

function DecisionsThatNeedYou({ home }: { home: MeridianVbcDecisionHome }) {
  return (
    <section
      data-testid="decision-home-decisions"
      aria-label="Decisions that need you"
      style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <SectionHeading
        title="Decisions that need you"
        sub="Answer-first. Each card carries the recommended action, the stake, one piece of evidence, and one gesture into the full decision — ordered by what the VBC cadence makes matter now."
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
          gap: 12,
        }}
      >
        {home.decisions.map((card) => (
          <DecisionCardView key={card.key} card={card} />
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Block 4 — where you are in the cadence
// ─────────────────────────────────────────────────────────────────────────────

function WhereYouAreInTheCadence({ home }: { home: MeridianVbcDecisionHome }) {
  const { cadence } = home;
  return (
    <section
      data-testid="decision-home-cadence"
      aria-label="Where you are in the cadence"
      style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <SectionHeading
        title="Where you are in the cadence"
        sub={`The ${cadence.frameName} performance-year rhythm — and what this point in it demands.`}
      />

      {/* The current demand — surfaced above the timeline. */}
      <div
        style={{
          background: SHELL.PEACH_BG,
          border: `1px solid ${SHELL.PEACH_LINE}`,
          borderRadius: 10,
          padding: '14px 16px',
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: '0.09em',
            color: SHELL.PEACH_TEXT,
          }}
        >
          What this point in the cycle demands
        </span>
        <p
          style={{
            margin: '5px 0 0',
            fontFamily: SHELL.SANS,
            fontSize: 13,
            lineHeight: 1.55,
            color: SHELL.INK_MID,
          }}
        >
          {cadence.currentDemand}
        </p>
      </div>

      {/* The performance-year stages. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cadence.stages.map((stage) => {
          const current = stage.isCurrent;
          return (
            <div
              key={stage.key}
              style={{
                display: 'flex',
                gap: 14,
                alignItems: 'flex-start',
                background: current ? SHELL.CARD_WHITE : SHELL.PAPER_SOFT,
                border: `1px solid ${current ? SHELL.PEACH_LINE : SHELL.CARD_LINE_SOFT}`,
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
                  background: current ? SHELL.AMBER_DOT : SHELL.GRAY_LINE,
                  border: `1px solid ${current ? SHELL.PEACH_TEXT : SHELL.GRAY_LINE}`,
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span
                    style={{
                      fontFamily: SHELL.SANS,
                      fontSize: 13,
                      fontWeight: 600,
                      color: SHELL.INK,
                    }}
                  >
                    {stage.label}
                  </span>
                  {current ? (
                    <Pill
                      text="You are here"
                      bg={SHELL.PEACH_BG}
                      line={SHELL.PEACH_LINE}
                      color={SHELL.PEACH_TEXT}
                    />
                  ) : null}
                </div>
                <p
                  style={{
                    margin: 0,
                    fontFamily: SHELL.SANS,
                    fontSize: 12.5,
                    lineHeight: 1.55,
                    color: SHELL.INK_SOFT,
                  }}
                >
                  {stage.demands}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The surface
// ─────────────────────────────────────────────────────────────────────────────

interface DecisionHomeViewProps {
  /** The bound decision-home data, or `null` when the VBC pack is uncatalogued. */
  home: MeridianVbcDecisionHome | null;
}

export function DecisionHomeView({ home }: DecisionHomeViewProps) {
  // Honest fallback — the registry returned no pack. The surface says so
  // plainly rather than fabricating a frame (spec §3, §5).
  if (!home) {
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
          catalogued for this tenant. The function-aware decision home cannot
          be rendered without a bound pack — and it will not fabricate one.
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
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            color: SHELL.INK_MUTED,
          }}
        >
          {home.tenantName} · {home.functionLabel} · {home.packProvenance}
        </span>
      </div>

      {/* 1 — The one thing. The answer, first. */}
      <TheOneThing home={home} />

      {/* 2 — Decisions that need you. */}
      <DecisionsThatNeedYou home={home} />

      {/* 3 — The function's vitals. Below the answer, by the §3 law. */}
      <FunctionVitalsStrip
        off={home.vitals.off}
        rest={home.vitals.rest}
        groundedCount={home.vitals.groundedCount}
        expectedCount={home.vitals.expectedCount}
      />

      {/* 4 — Where you are in the cadence. */}
      <WhereYouAreInTheCadence home={home} />
    </div>
  );
}

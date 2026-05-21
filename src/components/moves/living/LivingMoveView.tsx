'use client';

// LivingMoveView — the living Move (experience spec §6, "the model alive
// under your finger").
//
// The board-grade Costed Business-Case Pack is a STATIC render of the Apex
// "Contact Center AI Routing" case. This surface is the SAME case made
// interactive: a CXO touches the highest-leverage assumptions and the kernel
// recompiles live — verdict, investment, net value, payback and the three
// board-grade exhibits all move.
//
// The recompute runs CLIENT-SIDE. Every module on the kernel compile path
// (`buildBaselineModel → buildEffortEstimate → buildValueForecast →
// compileBusinessCase`) is pure TypeScript with no `server-only` import, and
// the board-grade SVG exhibit builders in `svg-charts.ts` are pure string
// producers. So `buildLivingMoveCase()` runs in this client component on
// every control change — instant, no round-trip.
//
// The recompute is the REAL kernel, not a reimplementation. The honesty
// discipline holds under every setting: with the cost-per-contact seed gap
// unfilled the value forecast is proxy-anchored and payback is BLOCKED; the
// critic's blocker downgrades the verdict to "shape". Supplying the seed-gap
// input un-blocks payback live; clearing it reverts to blocked.
//
// Answer-first: the verdict + headline economics sit at the top and visibly
// move. Locked design system — calm, restrained; the case is the hero, the
// controls are quiet.

import { useMemo, useState } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import {
  buildLivingMoveCase,
  LIVING_MOVE_DEFAULTS,
  type LivingMoveControls,
  type LivingMoveCase,
} from '@/lib/programs/expert-kernel/apex-living-move';
import {
  investmentWaterfall,
  valueBridge,
  sensitivityTornado,
  compactUsd,
} from '@/lib/programs/expert-kernel/exports/board-grade/svg-charts';
import type { Recommendation } from '@/lib/programs/expert-kernel/business-case-compiler';

// ─────────────────────────────────────────────────────────────────────────────
// Verdict chrome
// ─────────────────────────────────────────────────────────────────────────────

const VERDICT_META: Record<
  Recommendation,
  { label: string; bg: string; line: string; text: string }
> = {
  fund: {
    label: 'Fund',
    bg: SHELL.MINT_BG,
    line: SHELL.MINT_LINE,
    text: SHELL.MINT_TEXT,
  },
  shape: {
    label: 'Shape, then fund',
    bg: SHELL.PEACH_BG,
    line: SHELL.PEACH_LINE,
    text: SHELL.PEACH_TEXT,
  },
  kill: {
    label: 'Kill or re-shape',
    bg: SHELL.RUST_BG,
    line: SHELL.PEACH_LINE,
    text: SHELL.RUST_TEXT,
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
// The answer — verdict + headline economics. Always at the top; moves live.
// ─────────────────────────────────────────────────────────────────────────────

function EconomicFigure({
  label,
  value,
  tone,
  sub,
}: {
  label: string;
  value: string;
  tone?: 'ink' | 'positive' | 'negative' | 'muted';
  sub?: string;
}) {
  const color =
    tone === 'positive'
      ? SHELL.MINT_TEXT
      : tone === 'negative'
        ? SHELL.RUST_TEXT
        : tone === 'muted'
          ? SHELL.INK_MUTED
          : SHELL.INK;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.09em',
          color: SHELL.INK_MUTED,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: SHELL.SERIF,
          fontSize: 26,
          fontWeight: 400,
          lineHeight: 1.05,
          color,
        }}
      >
        {value}
      </span>
      {sub ? (
        <span
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 11,
            color: SHELL.INK_SOFT,
            lineHeight: 1.4,
          }}
        >
          {sub}
        </span>
      ) : null}
    </div>
  );
}

function TheAnswer({ live }: { live: LivingMoveCase }) {
  const { skeleton } = live;
  const verdict = VERDICT_META[skeleton.recommendation];
  const econ = skeleton.economics;
  const netReturnPoint = econ.netReturn.point;

  return (
    <section
      data-testid="living-move-answer"
      aria-label="The answer"
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 14,
        padding: '26px 30px',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Pill
          text={verdict.label}
          bg={verdict.bg}
          line={verdict.line}
          color={verdict.text}
        />
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.11em',
            color: SHELL.INK_MUTED,
          }}
        >
          The kernel verdict — recompiled live
        </span>
      </div>

      <p
        style={{
          margin: 0,
          fontFamily: SHELL.SERIF,
          fontSize: 21,
          fontWeight: 400,
          lineHeight: 1.4,
          color: SHELL.INK,
          maxWidth: '64ch',
        }}
      >
        {skeleton.recommendationRationale}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 20,
          borderTop: `1px solid ${SHELL.CARD_LINE_SOFT}`,
          paddingTop: 18,
        }}
      >
        <EconomicFigure
          label="Investment (base)"
          value={compactUsd(econ.investment.point)}
          sub={`${compactUsd(econ.investment.low)}–${compactUsd(
            econ.investment.high,
          )} range`}
        />
        <EconomicFigure
          label="Net value (3-yr, post-haircut)"
          value={compactUsd(live.netValue)}
          sub={`${Math.round(live.haircut * 100)}% haircut on ${compactUsd(
            live.grossValue,
          )} gross`}
        />
        <EconomicFigure
          label="Net return (base)"
          value={compactUsd(netReturnPoint)}
          tone={netReturnPoint > 0 ? 'positive' : 'negative'}
          sub={
            netReturnPoint > 0
              ? 'Value clears the investment'
              : 'Underwater on current assumptions'
          }
        />
        <EconomicFigure
          label="Payback"
          value={
            econ.paybackMonths !== null
              ? `${Math.round(econ.paybackMonths)} mo`
              : 'Blocked'
          }
          tone={econ.paybackMonths !== null ? 'ink' : 'muted'}
          sub={
            econ.paybackMonths !== null
              ? 'Cost-per-contact baseline supplied'
              : 'Seed gap — supply cost-per-contact to compute'
          }
        />
      </div>

      {/* The honesty clause — the no-fabrication discipline made visible. */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
          background: SHELL.PAPER_SOFT,
          border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
          borderRadius: 8,
          padding: '12px 14px',
        }}
      >
        <span style={{ marginTop: 1 }}>
          <Pill
            text={live.seedGapFilled ? 'Monetisable' : 'Honest'}
            bg={live.seedGapFilled ? SHELL.MINT_BG : SHELL.GRAY_BG}
            line={live.seedGapFilled ? SHELL.MINT_LINE : SHELL.GRAY_LINE}
            color={live.seedGapFilled ? SHELL.MINT_TEXT : SHELL.GRAY_TEXT}
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
          {live.seedGapFilled
            ? 'You supplied the cost-per-contact baseline. The value forecast ' +
              'is no longer proxy-anchored, monetisation is un-blocked, and ' +
              'payback is a live number. Clear the input to return the case ' +
              'to its honest seed-gap state.'
            : skeleton.sensitivity.whatBreaksTheCase}
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The controls — the heart of the interaction. Quiet, crafted, not a form.
// ─────────────────────────────────────────────────────────────────────────────

function ScoreControl({
  label,
  hint,
  value,
  onChange,
  format,
  min,
  max,
  step,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (n: number) => void;
  format: (n: number) => string;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 10,
        padding: '14px 16px',
      }}
    >
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
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 13,
            fontWeight: 500,
            color: SHELL.INK,
          }}
        >
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          accentColor: SHELL.INK,
          cursor: 'pointer',
        }}
      />
      <span
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 11,
          lineHeight: 1.45,
          color: SHELL.INK_SOFT,
        }}
      >
        {hint}
      </span>
    </div>
  );
}

function SeedGapControl({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (n: number | null) => void;
}) {
  const filled = value !== null;
  return (
    <div
      data-testid="living-move-seed-gap-control"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        background: filled ? SHELL.MINT_BG : SHELL.GRAY_BG,
        border: `1px solid ${filled ? SHELL.MINT_LINE : SHELL.GRAY_LINE}`,
        borderRadius: 10,
        padding: '14px 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Pill
          text={filled ? 'Seed gap filled' : 'Declared seed gap'}
          bg={SHELL.CARD_WHITE}
          line={filled ? SHELL.MINT_LINE : SHELL.GRAY_LINE}
          color={filled ? SHELL.MINT_TEXT : SHELL.GRAY_TEXT}
        />
        <span
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 13,
            fontWeight: 600,
            color: SHELL.INK,
          }}
        >
          Cost per contact (labour)
        </span>
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: SHELL.SANS,
          fontSize: 11.5,
          lineHeight: 1.5,
          color: SHELL.INK_SOFT,
        }}
      >
        Apex has not recorded this — it is a declared seed gap (tenant action
        item, owner Brendan Fox, due 2026-05-15). Until it is supplied the
        value forecast is proxy-anchored and payback is{' '}
        <strong>blocked</strong>. Supply it here to see what closing the gap
        would do — the surface never fabricates it by default.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 14,
            color: SHELL.INK,
          }}
        >
          $
        </span>
        <input
          type="number"
          inputMode="decimal"
          aria-label="Cost per contact (USD)"
          placeholder="not supplied"
          min={0}
          step={0.5}
          value={value ?? ''}
          onChange={(e) => {
            const raw = e.target.value.trim();
            if (raw === '') {
              onChange(null);
              return;
            }
            const n = Number(raw);
            onChange(Number.isFinite(n) && n > 0 ? n : null);
          }}
          style={{
            flex: 1,
            fontFamily: SHELL.MONO,
            fontSize: 14,
            color: SHELL.INK,
            background: SHELL.CARD_WHITE,
            border: `1px solid ${SHELL.CARD_LINE}`,
            borderRadius: 7,
            padding: '8px 10px',
          }}
        />
        <button
          type="button"
          onClick={() => onChange(filled ? null : 6.5)}
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 11.5,
            fontWeight: 600,
            color: filled ? SHELL.INK_MID : SHELL.PAPER,
            background: filled ? SHELL.PAPER_SOFT : SHELL.INK,
            border: `1px solid ${filled ? SHELL.CARD_LINE : SHELL.INK}`,
            borderRadius: 7,
            padding: '8px 12px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {filled ? 'Clear — restore seed gap' : 'Use benchmark $6.50'}
        </button>
      </div>
    </div>
  );
}

function Controls({
  controls,
  setControls,
  onReset,
}: {
  controls: LivingMoveControls;
  setControls: (next: LivingMoveControls) => void;
  onReset: () => void;
}) {
  const set = <K extends keyof LivingMoveControls>(
    key: K,
    val: LivingMoveControls[K],
  ): void => setControls({ ...controls, [key]: val });

  const pct = (n: number): string => `${Math.round(n * 100)}%`;

  return (
    <section
      data-testid="living-move-controls"
      aria-label="Assumptions you can touch"
      style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <SectionHeading
          title="The assumptions you can touch"
          sub="The six highest-leverage inputs in the case. Move one and the kernel recompiles — verdict, economics and every exhibit follow."
        />
        <button
          type="button"
          onClick={onReset}
          style={{
            flexShrink: 0,
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
          Reset to the audited case
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 12,
        }}
      >
        <ScoreControl
          label="Adoption confidence"
          hint="How confident are we that Customer Care agents adopt AI routing? The single largest haircut driver."
          value={controls.adoptionRisk}
          onChange={(n) => set('adoptionRisk', n)}
          format={pct}
          min={0.1}
          max={1}
          step={0.05}
        />
        <ScoreControl
          label="Data readiness"
          hint="Is the intent / transcript data unified and instrumented? The CDP consolidation gap sits here."
          value={controls.dataReadiness}
          onChange={(n) => set('dataReadiness', n)}
          format={pct}
          min={0.1}
          max={1}
          step={0.05}
        />
        <ScoreControl
          label="Process independence"
          hint="How much of the value lands without the routing process redesign? Higher = less dependent."
          value={controls.processDependency}
          onChange={(n) => set('processDependency', n)}
          format={pct}
          min={0.1}
          max={1}
          step={0.05}
        />
        <ScoreControl
          label="Containment uplift"
          hint="Modelled lift in contact-centre containment. KPI kpi:apex:018 states a 12-point target (28% → 40%)."
          value={controls.containmentUpliftPts}
          onChange={(n) => set('containmentUpliftPts', n)}
          format={(n) => `+${n} pts`}
          min={4}
          max={20}
          step={1}
        />
        <ScoreControl
          label="Offshore delivery mix"
          hint="Share of delivery labour run offshore. A real cost driver — a higher mix lowers the blended rate."
          value={controls.offshoreRatio}
          onChange={(n) => set('offshoreRatio', n)}
          format={pct}
          min={0}
          max={0.8}
          step={0.05}
        />
        <div style={{ gridColumn: '1 / -1' }}>
          <SeedGapControl
            value={controls.costPerContactUsd}
            onChange={(n) => set('costPerContactUsd', n)}
          />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The exhibits — board-grade SVGs, re-rendered on each recompute.
// ─────────────────────────────────────────────────────────────────────────────

function Exhibit({
  title,
  note,
  svg,
}: {
  title: string;
  note: string;
  svg: string;
}) {
  return (
    <article
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 12,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 16,
            fontWeight: 400,
            color: SHELL.INK,
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 11.5,
            lineHeight: 1.45,
            color: SHELL.INK_SOFT,
          }}
        >
          {note}
        </span>
      </div>
      {/* The board-grade SVG exhibit — a pure string from svg-charts.ts,
          re-rendered on every recompute. */}
      <div
        style={{ width: '100%' }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </article>
  );
}

function Exhibits({ live }: { live: LivingMoveCase }) {
  const waterfallSvg = useMemo(
    () => investmentWaterfall(live.waterfall),
    [live.waterfall],
  );
  const bridgeSvg = useMemo(
    () => valueBridge(live.grossValue, live.bridgeSteps, live.netValue),
    [live.grossValue, live.bridgeSteps, live.netValue],
  );
  const tornadoSvg = useMemo(
    () => sensitivityTornado(live.tornado),
    [live.tornado],
  );

  return (
    <section
      aria-label="The exhibits"
      style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <SectionHeading
        title="The exhibits"
        sub="The board-grade financial exhibits — the same charts as the static Costed Business-Case Pack, re-rendered on every recompute."
      />
      <Exhibit
        title="Investment waterfall"
        note="The delivery lanes that build to the base investment. Shifting the offshore mix moves every lane."
        svg={waterfallSvg}
      />
      <Exhibit
        title="Gross-to-net value bridge"
        note="Gross value, then each haircut factor as a downward step, ending at the net the kernel will claim."
        svg={bridgeSvg}
      />
      <Exhibit
        title="Sensitivity tornado"
        note="The assumptions that move the case. A hatched bar is a seed-gap proxy — validating it is the highest-leverage next step."
        svg={tornadoSvg}
      />
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The surface
// ─────────────────────────────────────────────────────────────────────────────

export function LivingMoveView() {
  const [controls, setControls] = useState<LivingMoveControls>(
    LIVING_MOVE_DEFAULTS,
  );

  // The kernel recompute — runs client-side on every control change.
  const live = useMemo(() => buildLivingMoveCase(controls), [controls]);

  return (
    <div
      style={{
        maxWidth: 1080,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
        paddingBottom: 56,
      }}
    >
      {/* Provenance — the case being manipulated, named. Quiet, above the answer. */}
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
          text="Living Move"
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
          Apex Retail · Contact Center AI Routing · costed business case ·
          recompiled by the Expert Kernel
        </span>
      </div>

      {/* The answer — first, and it moves. */}
      <TheAnswer live={live} />

      {/* The controls — the heart of the interaction. */}
      <Controls
        controls={controls}
        setControls={setControls}
        onReset={() => setControls(LIVING_MOVE_DEFAULTS)}
      />

      {/* The exhibits — re-rendered on each recompute. */}
      <Exhibits live={live} />
    </div>
  );
}

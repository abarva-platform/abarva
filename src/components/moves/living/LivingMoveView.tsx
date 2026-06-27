'use client';

// LivingMoveView — the living Move (experience spec §6, "the model alive
// under your finger").
//
// The board-grade Costed Business-Case Pack is a STATIC render of a tenant
// case. This surface is the SAME case made interactive: a CXO touches the
// highest-leverage assumptions and the kernel recompiles live — verdict,
// investment, net value, payback and the three board-grade exhibits all move.
//
// The kernel is anchored on three real tenant cases — Apex Retail, Meridian
// Health System, First Capital Financial. The surface is case-switchable: a
// quiet switcher (and the route's `?case=` searchParam) selects which grounded
// case the kernel renders, resolved through the `living-move-cases` registry.
// The chrome is NOT forked — it is parameterised by the resolved case entry,
// which carries each tenant's own six highest-leverage control definitions.
//
// The recompute runs CLIENT-SIDE. Every module on the kernel compile path
// (`buildBaselineModel → buildEffortEstimate → buildValueForecast →
// compileBusinessCase`) is pure TypeScript with no `server-only` import, and
// the board-grade SVG exhibit builders in `svg-charts.ts` are pure string
// producers. So `buildLivingMoveCase()` runs in this client component on
// every control change — instant, no round-trip.
//
// The recompute is the REAL kernel, not a reimplementation. The honesty
// discipline holds for every case under every setting: with the seed gap
// unfilled the value forecast is proxy-anchored and payback is BLOCKED; the
// critic's blocker downgrades the verdict to "shape"; a negative net return
// downgrades it to "kill". Supplying the seed-gap input un-blocks payback
// live; clearing it reverts to blocked.
//
// Answer-first: the verdict + headline economics sit at the top and visibly
// move. Locked design system — calm, restrained; the case is the hero, the
// controls are quiet.

import { useMemo, useState } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import {
  buildLivingMoveCase,
  defaultsFor,
  type LivingControlDef,
  type LivingMoveCase,
  type LivingMoveCaseEntry,
  type LivingMoveControls,
} from '@/lib/programs/expert-kernel/living-move';
import {
  LIVING_MOVE_CASE_IDS,
  LIVING_MOVE_CASES,
  resolveLivingMoveCase,
  type LivingMoveCaseId,
} from '@/lib/programs/expert-kernel/living-move-cases';
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
// Value formatting — drives both the control read-out and the seed-gap input
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format a dollar figure — `compactUsd` for figures >= $1,000, the precise
 * value (with cents where needed) for small unit-economics figures like a
 * cost-per-contact baseline.
 */
function formatUsd(value: number): string {
  if (Math.abs(value) >= 1_000) return compactUsd(value);
  const rounded = Math.round(value * 100) / 100;
  return `$${Number.isInteger(rounded) ? rounded : rounded.toFixed(2)}`;
}

/** Format a control value for its read-out, per the control's `format`. */
function formatControlValue(def: LivingControlDef, value: number): string {
  switch (def.format) {
    case 'percent':
      return `${Math.round(value * 100)}%`;
    case 'points':
      return `+${value}${def.unitSuffix ?? ' pts'}`;
    case 'usd':
      return formatUsd(value);
    case 'plain':
    default:
      return `${value}${def.unitSuffix ?? ''}`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// The case switcher — three kernel-anchored cases. Quiet, locked tokens.
// ─────────────────────────────────────────────────────────────────────────────

function CaseSwitcher({
  activeId,
  onSelect,
}: {
  activeId: LivingMoveCaseId;
  onSelect: (id: LivingMoveCaseId) => void;
}) {
  return (
    <div
      data-testid="living-move-case-switcher"
      role="tablist"
      aria-label="Company case"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        alignItems: 'center',
      }}
    >
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.09em',
          color: SHELL.INK_MUTED,
          marginRight: 2,
        }}
      >
        Tenant case
      </span>
      {LIVING_MOVE_CASE_IDS.map((id) => {
        const entry = LIVING_MOVE_CASES[id];
        const active = id === activeId;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(id)}
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.02em',
              padding: '5px 11px',
              borderRadius: 6,
              border: `1px solid ${active ? SHELL.INK : SHELL.CARD_LINE}`,
              background: active ? SHELL.INK : SHELL.CARD_WHITE,
              color: active ? SHELL.PAPER : SHELL.INK_MID,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {entry.tenantLabel}
          </button>
        );
      })}
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

function TheAnswer({
  live,
  seedGapLabel,
}: {
  live: LivingMoveCase;
  seedGapLabel: string;
}) {
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
              ? `${seedGapLabel} supplied`
              : `Seed gap — supply ${seedGapLabel.toLowerCase()} to compute`
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
            ? `You supplied the ${seedGapLabel.toLowerCase()}. The value ` +
              'forecast is no longer proxy-anchored, monetisation is ' +
              'un-blocked, and payback is a live number. Clear the input to ' +
              'return the case to its honest seed-gap state.'
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
  def,
  value,
  onChange,
}: {
  def: LivingControlDef;
  value: number;
  onChange: (n: number) => void;
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
          {def.label}
        </span>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 13,
            fontWeight: 500,
            color: SHELL.INK,
          }}
        >
          {formatControlValue(def, value)}
        </span>
      </div>
      <input
        type="range"
        aria-label={def.label}
        min={def.min}
        max={def.max}
        step={def.step}
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
        {def.hint}
      </span>
    </div>
  );
}

function SeedGapControl({
  def,
  value,
  onChange,
}: {
  def: LivingControlDef;
  value: number | null;
  onChange: (n: number | null) => void;
}) {
  const filled = value !== null;
  const benchmark = def.seedGapBenchmark ?? 0;
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
          {def.seedGapMetricLabel ?? def.label}
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
        {def.seedGapNote}
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
          aria-label={`${def.label} (USD)`}
          placeholder="not supplied"
          min={0}
          step={def.step}
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
          onClick={() => onChange(filled ? null : benchmark)}
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
          {filled
            ? 'Clear — restore seed gap'
            : `Use benchmark ${formatUsd(benchmark)}`}
        </button>
      </div>
    </div>
  );
}

function Controls({
  entry,
  controls,
  setControls,
  onReset,
}: {
  entry: LivingMoveCaseEntry;
  controls: LivingMoveControls;
  setControls: (next: LivingMoveControls) => void;
  onReset: () => void;
}) {
  const set = (key: string, val: number | null): void =>
    setControls({ ...controls, [key]: val });

  const sliderDefs = entry.controls.filter((c) => c.kind !== 'seed-gap');
  const seedGapDef = entry.controls.find((c) => c.kind === 'seed-gap');

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
          sub="The six highest-leverage inputs in this case. Move one and the kernel recompiles — verdict, economics and every exhibit follow."
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
        {sliderDefs.map((def) => (
          <ScoreControl
            key={def.id}
            def={def}
            value={
              typeof controls[def.id] === 'number'
                ? (controls[def.id] as number)
                : (def.defaultValue ?? def.min)
            }
            onChange={(n) => set(def.id, n)}
          />
        ))}
        {seedGapDef ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <SeedGapControl
              def={seedGapDef}
              value={
                typeof controls[seedGapDef.id] === 'number'
                  ? (controls[seedGapDef.id] as number)
                  : null
              }
              onChange={(n) => set(seedGapDef.id, n)}
            />
          </div>
        ) : null}
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

export function LivingMoveView({
  caseId = 'apexretail',
  allowCaseSwitching = true,
}: {
  /** The kernel-anchored case to open on. Defaults to the proven Apex case. */
  caseId?: LivingMoveCaseId;
  /**
   * Tenant-scoped production sessions must not let one client switch into
   * another client's reference case. Internal reference/demo surfaces may keep
   * the switcher enabled.
   */
  allowCaseSwitching?: boolean;
}) {
  const [activeId, setActiveId] = useState<LivingMoveCaseId>(caseId);
  const entry = resolveLivingMoveCase(activeId);

  // The control state is per-case — switching cases resets to that case's
  // audited defaults, so the surface always opens honest.
  const [controls, setControls] = useState<LivingMoveControls>(() =>
    defaultsFor(entry),
  );

  const selectCase = (id: LivingMoveCaseId): void => {
    setActiveId(id);
    setControls(defaultsFor(resolveLivingMoveCase(id)));
  };

  // The kernel recompute — runs client-side on every control change.
  const live = useMemo(
    () => buildLivingMoveCase(entry, controls),
    [entry, controls],
  );

  const seedGapDef = entry.controls.find((c) => c.kind === 'seed-gap');
  const seedGapLabel = seedGapDef?.label ?? 'the seed-gap baseline';

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
      {/* Provenance + the case switcher — the case being manipulated, named. */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 4,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            alignItems: 'center',
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
            {entry.provenance}
          </span>
        </div>
        {allowCaseSwitching ? (
          <CaseSwitcher activeId={activeId} onSelect={selectCase} />
        ) : null}
      </div>

      {/* The answer — first, and it moves. */}
      <TheAnswer live={live} seedGapLabel={seedGapLabel} />

      {/* The controls — the heart of the interaction. */}
      <Controls
        entry={entry}
        controls={controls}
        setControls={setControls}
        onReset={() => setControls(defaultsFor(entry))}
      />

      {/* The exhibits — re-rendered on each recompute. */}
      <Exhibits live={live} />
    </div>
  );
}

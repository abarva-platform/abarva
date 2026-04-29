'use client';

// HealthSimulatorClient — What-if composite score projector.
//
// Receives serialized health rows from the server component. The user selects
// an instance, adjusts "additional gates met" and "contradictions removed"
// via +/- controls, and sees a live side-by-side current vs. projected score
// with a colored delta.
//
// No API calls — pure client-side JS arithmetic using the same formula as
// the server.

import React, { useState } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { SerializedRow } from './page';

// ─── Score helpers ────────────────────────────────────────────────────────────

function calcScore(gatesMet: number, gatesTotal: number, contradictions: number): number {
  return Math.round(
    (gatesMet / Math.max(gatesTotal, 1)) * 60 +
      (1 - Math.min(contradictions / 5, 1)) * 30 +
      10,
  );
}

function healthLabel(score: number): string {
  if (score >= 70) return 'healthy';
  if (score >= 40) return 'warning';
  return 'critical';
}

// ─── Style constants ──────────────────────────────────────────────────────────

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: `${COLORS.ink}99`,
  fontWeight: 600,
};

const VALUE_STYLE: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 40,
  color: COLORS.ink,
  letterSpacing: '-0.02em',
  lineHeight: 1.05,
};

const SUB_STYLE: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: `${COLORS.ink}88`,
  marginTop: 4,
};

const MONO_STYLE: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 12,
  color: `${COLORS.ink}cc`,
};

// ─── Health label palette ─────────────────────────────────────────────────────

function labelPalette(label: string): { bg: string; fg: string } {
  if (label === 'healthy') return { bg: COLORS.mintSoft, fg: COLORS.mintInk };
  if (label === 'warning') return { bg: COLORS.amberSoft, fg: COLORS.amberInk };
  return { bg: COLORS.coralSoft, fg: COLORS.coralInk };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function HealthPill({ label }: { label: string }) {
  const { bg, fg } = labelPalette(label);
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: fg,
        borderRadius: RADIUS.pill,
        padding: '3px 12px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 12,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}
    >
      {label}
    </span>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}) {
  const btnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    border: `1px solid ${COLORS.ink}22`,
    background: COLORS.white,
    cursor: 'pointer',
    fontFamily: TYPOGRAPHY.mono,
    fontSize: 16,
    color: COLORS.ink,
    userSelect: 'none',
    flexShrink: 0,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={LABEL_STYLE}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          style={{ ...btnStyle, opacity: value <= min ? 0.3 : 1 }}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <span
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 28,
            color: COLORS.ink,
            minWidth: 40,
            textAlign: 'center',
            letterSpacing: '-0.01em',
          }}
        >
          {value}
        </span>
        <button
          style={{ ...btnStyle, opacity: value >= max ? 0.3 : 1 }}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
        <span style={{ ...MONO_STYLE, color: `${COLORS.ink}66` }}>
          / {max} max
        </span>
      </div>
    </div>
  );
}

function ScoreCard({
  heading,
  score,
  label,
  gatesMet,
  gatesTotal,
  contradictions,
  delta,
}: {
  heading: string;
  score: number;
  label: string;
  gatesMet: number;
  gatesTotal: number;
  contradictions: number;
  delta?: number;
}) {
  let deltaEl: React.ReactNode = null;
  if (delta !== undefined) {
    const color =
      delta > 0 ? COLORS.mintInk : delta < 0 ? COLORS.coralInk : `${COLORS.ink}66`;
    const sign = delta > 0 ? '+' : '';
    deltaEl = (
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 22,
          color,
          letterSpacing: '-0.01em',
          marginTop: 2,
        }}
      >
        {sign}
        {delta} points
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
        minWidth: 0,
      }}
    >
      <div style={{ ...LABEL_STYLE }}>{heading}</div>
      <div style={VALUE_STYLE}>{score}</div>
      {deltaEl}
      <HealthPill label={label} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          marginTop: SPACING.xs,
        }}
      >
        <div style={MONO_STYLE}>
          Gates met: {gatesMet} / {gatesTotal}
        </div>
        <div style={MONO_STYLE}>Contradictions: {contradictions}</div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface SimState {
  additionalGatesMet: number;
  contradictionsRemoved: number;
}

export function HealthSimulatorClient({ rows }: { rows: SerializedRow[] }) {
  const [selectedId, setSelectedId] = useState<string>(rows[0]?.id ?? '');
  const [sim, setSim] = useState<SimState>({
    additionalGatesMet: 0,
    contradictionsRemoved: 0,
  });

  const selected = rows.find((r) => r.id === selectedId) ?? rows[0];

  // Reset simulation when instance changes
  function handleSelect(id: string) {
    setSelectedId(id);
    setSim({ additionalGatesMet: 0, contradictionsRemoved: 0 });
  }

  if (selected === undefined) {
    return (
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 14,
          color: `${COLORS.ink}99`,
          padding: SPACING.lg,
        }}
      >
        No instances available.
      </div>
    );
  }

  const currentScore = calcScore(
    selected.gatesMet,
    selected.gatesTotal,
    selected.activeContradictions,
  );
  const currentLabel = healthLabel(currentScore);

  const projGatesMet = selected.gatesMet + sim.additionalGatesMet;
  const projContradictions = selected.activeContradictions - sim.contradictionsRemoved;
  const projScore = calcScore(projGatesMet, selected.gatesTotal, projContradictions);
  const projLabel = healthLabel(projScore);
  const delta = projScore - currentScore;

  const maxAdditionalGates = Math.max(0, selected.gatesTotal - selected.gatesMet);
  const maxContradictionsRemovable = selected.activeContradictions;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
      {/* Instance selector */}
      <div
        style={{
          background: COLORS.white,
          border: `1px solid ${COLORS.ink}14`,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm,
        }}
      >
        <div style={LABEL_STYLE}>Instance</div>
        <select
          value={selectedId}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleSelect(e.target.value)}
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 14,
            color: COLORS.ink,
            background: COLORS.white,
            border: `1px solid ${COLORS.ink}22`,
            borderRadius: RADIUS.md,
            padding: `${SPACING.sm} ${SPACING.md}`,
            width: '100%',
            maxWidth: 480,
            cursor: 'pointer',
          }}
        >
          {rows.map((row) => {
            const score = calcScore(row.gatesMet, row.gatesTotal, row.activeContradictions);
            return (
              <option key={row.id} value={row.id}>
                [{row.type}] {row.label} — score {score} · {healthLabel(score)}
              </option>
            );
          })}
        </select>
        {selected !== undefined ? (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: SPACING.md,
              marginTop: 4,
            }}
          >
            <span style={MONO_STYLE}>Stage: {selected.currentStage}</span>
            <span style={MONO_STYLE}>
              Gates: {selected.gatesMet}/{selected.gatesTotal}
            </span>
            <span style={MONO_STYLE}>
              Contradictions: {selected.activeContradictions}
            </span>
          </div>
        ) : null}
      </div>

      {/* Adjustment controls */}
      <div
        style={{
          background: COLORS.white,
          border: `1px solid ${COLORS.ink}14`,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.lg,
        }}
      >
        <div style={{ ...LABEL_STYLE, fontSize: 13 }}>Adjust hypothetical state</div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: SPACING.lg,
          }}
        >
          <Stepper
            label="Additional gates met"
            value={sim.additionalGatesMet}
            min={0}
            max={maxAdditionalGates}
            onChange={(v: number) =>
              setSim((prev: SimState) => ({ ...prev, additionalGatesMet: v }))
            }
          />
          <Stepper
            label="Contradictions removed"
            value={sim.contradictionsRemoved}
            min={0}
            max={maxContradictionsRemovable}
            onChange={(v: number) =>
              setSim((prev: SimState) => ({ ...prev, contradictionsRemoved: v }))
            }
          />
        </div>

        {maxAdditionalGates === 0 && maxContradictionsRemovable === 0 ? (
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
              color: `${COLORS.ink}88`,
              fontStyle: 'italic',
            }}
          >
            All gates met and no active contradictions — no adjustments available for this
            instance.
          </div>
        ) : null}
      </div>

      {/* Score comparison */}
      <div
        style={{
          display: 'flex',
          gap: SPACING.md,
          flexWrap: 'wrap',
        }}
      >
        <ScoreCard
          heading="Current"
          score={currentScore}
          label={currentLabel}
          gatesMet={selected.gatesMet}
          gatesTotal={selected.gatesTotal}
          contradictions={selected.activeContradictions}
        />
        <ScoreCard
          heading="Projected"
          score={projScore}
          label={projLabel}
          gatesMet={projGatesMet}
          gatesTotal={selected.gatesTotal}
          contradictions={projContradictions}
          delta={delta}
        />
      </div>

      {/* Health label flip notice */}
      {currentLabel !== projLabel ? (
        <div
          style={{
            background: COLORS.skyPale,
            border: `1px solid ${COLORS.navy}33`,
            borderRadius: RADIUS.lg,
            padding: `${SPACING.sm} ${SPACING.lg}`,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: COLORS.navy,
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.sm,
          }}
        >
          <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, fontWeight: 700 }}>
            LABEL CHANGE
          </span>
          <span>
            Health label would flip:{' '}
            <strong style={{ textTransform: 'capitalize' }}>{currentLabel}</strong>
            {' → '}
            <strong style={{ textTransform: 'capitalize' }}>{projLabel}</strong>
          </span>
        </div>
      ) : null}

      {/* Amber simulation-only disclaimer */}
      <div
        style={{
          background: COLORS.amberSoft,
          border: `1px solid ${COLORS.amberInk}33`,
          borderRadius: RADIUS.lg,
          padding: `${SPACING.sm} ${SPACING.lg}`,
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: COLORS.amberInk,
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.sm,
        }}
      >
        <span style={{ fontWeight: 700 }}>Simulation only</span>
        <span style={SUB_STYLE}>
          — use{' '}
          <a
            href="/admin/reasoning/waiver-analysis"
            style={{ color: COLORS.amberInk, fontWeight: 600 }}
          >
            Bulk waiver
          </a>{' '}
          to apply actual changes.
        </span>
      </div>
    </div>
  );
}

'use client';

// InstanceCompareClient — interactive two-selector side-by-side health compare.
//
// Renders two dropdowns (grouped by type), then a comparison table showing
// health label, composite score, gates, coverage %, contradictions, stage, and
// instance type for each selected instance. All styling via SHELL tokens.

import { useState } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { InstanceHealthLabel } from '@/lib/reasoning/health-board';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface SerializedInstanceRow {
  id: string;
  label: string;
  type: 'source' | 'program';
  currentStage: string;
  gatesMet: number;
  gatesTotal: number;
  activeContradictions: number;
  healthLabel: InstanceHealthLabel;
  score: number;
}

// ─── Palette helpers ──────────────────────────────────────────────────────────

interface HealthPalette {
  bg: string;
  text: string;
}

function healthPalette(label: InstanceHealthLabel): HealthPalette {
  if (label === 'healthy') return { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT };
  if (label === 'warning') return { bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT };
  if (label === 'critical') return { bg: SHELL.RUST_BG, text: SHELL.RUST_TEXT };
  return { bg: SHELL.GRAY_BG, text: SHELL.GRAY_TEXT };
}

type ScoreBand = 'mint' | 'amber' | 'rust';

function scoreBand(score: number): ScoreBand {
  if (score >= 70) return 'mint';
  if (score >= 40) return 'amber';
  return 'rust';
}

interface BandPalette {
  bar: string;
  text: string;
  barBg: string;
}

function bandPalette(band: ScoreBand): BandPalette {
  if (band === 'mint') {
    return { bar: SHELL.MINT_TEXT, text: SHELL.MINT_TEXT, barBg: SHELL.MINT_BG };
  }
  if (band === 'amber') {
    return { bar: SHELL.AMBER_DOT, text: SHELL.AMBER_DOT, barBg: SHELL.PAPER_DEEP };
  }
  return { bar: SHELL.RUST_TEXT, text: SHELL.RUST_TEXT, barBg: SHELL.RUST_BG };
}

// ─── Small UI primitives ──────────────────────────────────────────────────────

function HealthBadge({ label }: { label: InstanceHealthLabel }) {
  const palette = healthPalette(label);
  const display = label.charAt(0).toUpperCase() + label.slice(1);
  return (
    <span
      style={{
        display: 'inline-block',
        background: palette.bg,
        color: palette.text,
        borderRadius: 999,
        padding: '3px 12px',
        fontFamily: SHELL.SANS,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {display}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const band = scoreBand(score);
  const palette = bandPalette(band);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 160 }}>
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 13,
          fontWeight: 700,
          color: palette.text,
          minWidth: 54,
          flexShrink: 0,
        }}
      >
        {score} / 100
      </span>
      <div
        aria-hidden="true"
        style={{
          flex: 1,
          height: 6,
          borderRadius: 999,
          background: palette.barBg,
          overflow: 'hidden',
          minWidth: 56,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${score}%`,
            background: palette.bar,
            borderRadius: 999,
          }}
        />
      </div>
    </div>
  );
}

function TypePill({ type }: { type: 'source' | 'program' }) {
  const isSource = type === 'source';
  return (
    <span
      style={{
        display: 'inline-block',
        background: isSource ? SHELL.PEACH_BG : SHELL.BLUE_BG,
        color: isSource ? SHELL.PEACH_TEXT : SHELL.INK_MID,
        border: `1px solid ${isSource ? SHELL.PEACH_LINE : SHELL.BLUE_LINE}`,
        borderRadius: 999,
        padding: '2px 10px',
        fontFamily: SHELL.SANS,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase' as const,
        whiteSpace: 'nowrap' as const,
      }}
    >
      {isSource ? 'Source event' : 'Program'}
    </span>
  );
}

// ─── Dropdown ─────────────────────────────────────────────────────────────────

function InstanceSelect({
  label,
  value,
  instances,
  onChange,
}: {
  label: string;
  value: string;
  instances: SerializedInstanceRow[];
  onChange: (id: string) => void;
}) {
  const sources = instances.filter((i) => i.type === 'source');
  const programs = instances.filter((i) => i.type === 'program');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 0 }}>
      <label
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: SHELL.INK_SOFT,
        }}
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { onChange(e.target.value); }}
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: SHELL.INK,
          background: SHELL.CARD_WHITE,
          border: `1px solid ${SHELL.CARD_LINE}`,
          borderRadius: 6,
          padding: '8px 10px',
          width: '100%',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        {sources.length > 0 && (
          <optgroup label="Source events">
            {sources.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.label}
              </option>
            ))}
          </optgroup>
        )}
        {programs.length > 0 && (
          <optgroup label="Programs">
            {programs.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.label}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  );
}

// ─── Comparison table ─────────────────────────────────────────────────────────

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  fontWeight: 600,
  color: SHELL.INK_SOFT,
  padding: '10px 16px',
  borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
  whiteSpace: 'nowrap',
  verticalAlign: 'middle',
  width: '28%',
};

const VALUE_STYLE: React.CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 13,
  color: SHELL.INK,
  padding: '10px 16px',
  borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
  verticalAlign: 'middle',
};

interface CompareRowProps {
  rowLabel: string;
  cellA: React.ReactNode;
  cellB: React.ReactNode;
}

function CompareRow({ rowLabel, cellA, cellB }: CompareRowProps) {
  return (
    <tr>
      <td style={LABEL_STYLE}>{rowLabel}</td>
      <td style={VALUE_STYLE}>{cellA}</td>
      <td
        style={{
          ...VALUE_STYLE,
          borderLeft: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        }}
      >
        {cellB}
      </td>
    </tr>
  );
}

function MonoText({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 13,
        fontWeight: 700,
        color: color ?? SHELL.INK,
      }}
    >
      {children}
    </span>
  );
}

function CompareTable({
  a,
  b,
}: {
  a: SerializedInstanceRow;
  b: SerializedInstanceRow;
}) {
  const coverageA =
    a.gatesTotal === 0 ? '—' : `${Math.round((a.gatesMet / a.gatesTotal) * 100)}%`;
  const coverageB =
    b.gatesTotal === 0 ? '—' : `${Math.round((b.gatesMet / b.gatesTotal) * 100)}%`;

  return (
    <section
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      {/* Column headers */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <colgroup>
          <col style={{ width: '28%' }} />
          <col style={{ width: '36%' }} />
          <col style={{ width: '36%' }} />
        </colgroup>
        <thead>
          <tr>
            <th
              style={{
                ...LABEL_STYLE,
                fontFamily: SHELL.SERIF,
                fontSize: 11,
                color: SHELL.INK_MUTED,
                background: SHELL.PAPER_SOFT,
                borderBottom: `1px solid ${SHELL.CARD_LINE}`,
              }}
            />
            <th
              style={{
                fontFamily: SHELL.SERIF,
                fontSize: 15,
                fontWeight: 600,
                color: SHELL.INK,
                padding: '12px 16px',
                textAlign: 'left',
                background: SHELL.PAPER_SOFT,
                borderBottom: `1px solid ${SHELL.CARD_LINE}`,
                letterSpacing: '-0.01em',
              }}
            >
              <div>{a.label}</div>
              <div
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  color: SHELL.INK_MUTED,
                  marginTop: 2,
                  fontWeight: 400,
                }}
              >
                {a.id}
              </div>
            </th>
            <th
              style={{
                fontFamily: SHELL.SERIF,
                fontSize: 15,
                fontWeight: 600,
                color: SHELL.INK,
                padding: '12px 16px',
                textAlign: 'left',
                background: SHELL.PAPER_SOFT,
                borderBottom: `1px solid ${SHELL.CARD_LINE}`,
                borderLeft: `1px solid ${SHELL.CARD_LINE_SOFT}`,
                letterSpacing: '-0.01em',
              }}
            >
              <div>{b.label}</div>
              <div
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  color: SHELL.INK_MUTED,
                  marginTop: 2,
                  fontWeight: 400,
                }}
              >
                {b.id}
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <CompareRow
            rowLabel="Health"
            cellA={<HealthBadge label={a.healthLabel} />}
            cellB={<HealthBadge label={b.healthLabel} />}
          />
          <CompareRow
            rowLabel="Composite score"
            cellA={<ScoreBar score={a.score} />}
            cellB={<ScoreBar score={b.score} />}
          />
          <CompareRow
            rowLabel="Gates met / total"
            cellA={
              <MonoText>
                {a.gatesMet} / {a.gatesTotal}
              </MonoText>
            }
            cellB={
              <MonoText>
                {b.gatesMet} / {b.gatesTotal}
              </MonoText>
            }
          />
          <CompareRow
            rowLabel="Gates coverage"
            cellA={<MonoText>{coverageA}</MonoText>}
            cellB={<MonoText>{coverageB}</MonoText>}
          />
          <CompareRow
            rowLabel="Active contradictions"
            cellA={
              <MonoText color={a.activeContradictions > 0 ? SHELL.RUST_TEXT : SHELL.MINT_TEXT}>
                {a.activeContradictions}
              </MonoText>
            }
            cellB={
              <MonoText color={b.activeContradictions > 0 ? SHELL.RUST_TEXT : SHELL.MINT_TEXT}>
                {b.activeContradictions}
              </MonoText>
            }
          />
          <CompareRow
            rowLabel="Current stage"
            cellA={
              <span
                style={{ fontFamily: SHELL.MONO, fontSize: 12, color: SHELL.INK_SOFT }}
              >
                {a.currentStage}
              </span>
            }
            cellB={
              <span
                style={{ fontFamily: SHELL.MONO, fontSize: 12, color: SHELL.INK_SOFT }}
              >
                {b.currentStage}
              </span>
            }
          />
          <CompareRow
            rowLabel="Instance type"
            cellA={<TypePill type={a.type} />}
            cellB={<TypePill type={b.type} />}
          />
        </tbody>
      </table>
    </section>
  );
}

// ─── Warning banner ───────────────────────────────────────────────────────────

function SameInstanceWarning() {
  return (
    <div
      role="alert"
      style={{
        background: SHELL.PEACH_BG,
        border: `1px solid ${SHELL.PEACH_LINE}`,
        borderRadius: 8,
        padding: '12px 18px',
        fontFamily: SHELL.SANS,
        fontSize: 13,
        color: SHELL.PEACH_TEXT,
        fontWeight: 600,
      }}
    >
      Select two different instances to compare.
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

export function InstanceCompareClient({
  instances,
}: {
  instances: SerializedInstanceRow[];
}) {
  const defaultA = instances[0]?.id ?? '';
  const defaultB = instances[1]?.id ?? '';
  const [idA, setIdA] = useState<string>(defaultA);
  const [idB, setIdB] = useState<string>(defaultB);

  const instA = instances.find((i) => i.id === idA);
  const instB = instances.find((i) => i.id === idB);
  const sameSelected = idA !== '' && idA === idB;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Selector row */}
      <div
        style={{
          background: SHELL.CARD_WHITE,
          border: `1px solid ${SHELL.CARD_LINE}`,
          borderRadius: 10,
          padding: '20px 24px',
          display: 'flex',
          gap: 24,
          flexWrap: 'wrap',
          alignItems: 'flex-end',
        }}
      >
        <InstanceSelect
          label="Instance A"
          value={idA}
          instances={instances}
          onChange={(id) => { setIdA(id); }}
        />
        <div
          aria-hidden="true"
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 18,
            color: SHELL.INK_MUTED,
            flexShrink: 0,
            paddingBottom: 6,
          }}
        >
          vs
        </div>
        <InstanceSelect
          label="Instance B"
          value={idB}
          instances={instances}
          onChange={(id) => { setIdB(id); }}
        />
      </div>

      {/* Warning or compare table */}
      {sameSelected ? (
        <SameInstanceWarning />
      ) : instA !== undefined && instB !== undefined ? (
        <CompareTable a={instA} b={instB} />
      ) : null}
    </div>
  );
}

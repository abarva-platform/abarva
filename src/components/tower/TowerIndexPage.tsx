'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { MetricProvenance } from '@/components/tower/MetricProvenance';
import { DeferredMetricsBlock } from '@/components/tower/DeferredMetricsBlock';
import {
  buildStrategicAlignment2x2View,
  dotsByQuadrant,
  type AlignmentDot,
  type AlignmentQuadrant,
  type StrategicAlignment2x2View,
} from '@/lib/tower/strategic-alignment-2x2-view';
import type { AIInitiative } from '@/lib/admin/ai-initiatives/queries';
import type {
  BandMetric,
  TowerBandMetricsView,
} from '@/lib/tower/band-metrics-view';

// ─── Tower-specific tokens (broadsheet feel) ───────────────────────────────────
const T = {
  PAGE_BG: '#f5f1eb',
  CREAM: '#efe9dd',
  CREAM_2: '#faf6ec',
  CREAM_DEEP: '#e8e1d2',
  RULE: 'rgba(10,10,11,0.14)',
  RULE_STRONG: 'rgba(10,10,11,0.32)',
  BORDER: 'rgba(10,10,11,0.10)',
  BORDER_STRONG: 'rgba(10,10,11,0.24)',
  INK: '#000000',
  INK_2: '#2c2c2a',
  GRAY: '#888780',
  GRAY_DK: '#5F5E5A',
  GOLD: '#9C7B3F',
  PURPLE: '#6b3fa0',
  PURPLE_BG: '#efe6f7',
  GREEN: '#1d9e75',
  GREEN_BG: '#e1f5ee',
  AMBER: '#ba7517',
  AMBER_BG: '#faeeda',
  RED: '#a32d2d',
  RED_BG: '#fceded',
  // Pressure-specific colors (each pressure type has its own ink)
  P_COST: '#8b3a3a',
  P_ADOPT: '#2d5f8a',
  P_DUPL: '#6b3fa0',
  P_VEND: '#9C7B3F',
  P_VALUE: '#1d6b4f',
  // Fonts
  SERIF: 'var(--font-fraunces), "Fraunces", Georgia, serif',
  SANS: 'var(--font-inter), "Inter", system-ui, sans-serif',
  MONO: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;

// ─── Confidence value (cval) — solid/dashed/dotted underline by confidence ────
type Confidence = 'high' | 'med' | 'low';
function cvalStyle(conf: Confidence): CSSProperties {
  if (conf === 'high') return { borderBottom: `2px solid ${T.INK}`, paddingBottom: 5 };
  if (conf === 'med') return { borderBottom: `2px dashed ${T.GRAY_DK}`, paddingBottom: 5 };
  return { borderBottom: `1.5px dotted ${T.GRAY}`, paddingBottom: 5 };
}

function ConfTag({ conf }: { conf: Confidence }) {
  const bg = conf === 'high' ? 'rgba(10,10,11,0.08)' : conf === 'med' ? 'rgba(186,117,23,0.14)' : 'rgba(136,135,128,0.16)';
  const color = conf === 'high' ? T.INK : conf === 'med' ? T.AMBER : T.GRAY_DK;
  return (
    <span
      style={{
        fontFamily: T.MONO,
        fontSize: 8,
        letterSpacing: '1.4px',
        fontWeight: 700,
        padding: '1px 5px',
        borderRadius: 3,
        verticalAlign: 'super',
        marginLeft: 4,
        textTransform: 'uppercase',
        background: bg,
        color,
      }}
    >
      {conf}
    </span>
  );
}

// ─── KPI cell · T-1 compression (Tower Fix Package) ───────────────────────────
//
// Compressed from 4-line (label / stat / delta / 3-line footnote / inline CTA)
// to 2-line (label / stat + one-line subtext) layout per
// `tower-fix-package/pr-t-1-dashboard-band-compression.md`.
//
// The displaced 3-line description goes into the native browser tooltip
// via `tooltip` prop (option 1 from spec §"Notes for implementer"). The two
// inline CTA bubbles ("+24% pending baseline →" and "Connect Okta + EntraID
// →") have been removed entirely; T-3 absorbs them as inline action chips on
// Atlas observations.
//
// Doctrine constraints preserved:
//   - confidence indicators (HIGH/MED/LOW tags) stay on the stat
//   - underline weight (solid HIGH · dashed MED · dotted LOW) preserved via
//     cvalStyle on the stat children
//   - delta arrows (▲ ▼ ●) preserved inline in the subtext
//   - "missing inputs as invitations" preserved ("2 sources missing" still
//     reads on the Adoption tile)
interface KpiProps {
  label: string;
  hero?: boolean;
  isFirst?: boolean;
  children: ReactNode;
  /** One-line subtext (~30 chars) shown directly below the stat. */
  subtext?: ReactNode;
  /** Full displaced description shown as native browser tooltip on hover. */
  tooltip?: string;
}

function Kpi({ label, hero, isFirst, children, subtext, tooltip }: KpiProps) {
  return (
    <div
      title={tooltip}
      style={{
        padding: isFirst ? '0 22px 0 0' : '0 22px',
        borderLeft: isFirst ? 'none' : `1px solid ${T.RULE}`,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        cursor: tooltip ? 'help' : 'default',
      }}
    >
      <div
        style={{
          fontFamily: T.MONO,
          fontSize: 9.5,
          letterSpacing: '1.6px',
          textTransform: 'uppercase',
          fontWeight: 700,
          color: T.GRAY_DK,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            fontFamily: T.SERIF,
            fontWeight: hero ? 800 : 700,
            letterSpacing: '-0.8px',
            lineHeight: 1,
            color: T.INK,
            fontSize: hero ? 38 : 32,
          }}
        >
          {children}
        </div>
        {subtext && (
          <div
            style={{
              fontFamily: T.MONO,
              fontSize: 10,
              letterSpacing: '1.0px',
              color: T.GRAY_DK,
              fontWeight: 600,
              lineHeight: 1.3,
            }}
          >
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── T-5 (Bind 1): Substrate-bound KPI tile ──────────────────────────────────
//
// Renders a band tile from a pre-computed `BandMetric` (substrate aggregation).
// Maps the view-model's confidence enum to the existing cvalStyle/ConfTag
// treatment so visual doctrine (solid HIGH · dashed MED · dotted LOW) holds
// across substrate-bound and legacy code paths.
function SubstrateKpi({
  metric,
  hero,
  isFirst,
}: {
  metric: BandMetric;
  hero?: boolean;
  isFirst?: boolean;
}) {
  // Map BandConfidence to the cvalStyle Confidence union; 'none' falls back
  // to 'low' so we still get the dotted-underline treatment for placeholders.
  const conf: Confidence =
    metric.confidence === 'high'
      ? 'high'
      : metric.confidence === 'med'
        ? 'med'
        : 'low';
  const showConfTag = metric.confidence === 'med' || metric.confidence === 'low';
  return (
    <Kpi
      label={metric.label}
      hero={hero}
      isFirst={isFirst}
      subtext={metric.subtext}
      tooltip={metric.tooltip}
    >
      <MetricProvenance metricKey={metric.key}>
        <span style={cvalStyle(conf)} data-band-confidence={metric.confidence}>
          {metric.value}
          {showConfTag && <ConfTag conf={conf} />}
        </span>
      </MetricProvenance>
    </Kpi>
  );
}

// ─── Pressure card ────────────────────────────────────────────────────────────
type PressureType = 'cost' | 'dupl' | 'vend' | 'adopt' | 'value';

interface PressureProps {
  type: PressureType;
  id: string;
  label: string; // e.g. "Cost\nOverrun"
  headline: string;
  lede: ReactNode;
  meta: { k: string; v: string }[];
  magnitude: ReactNode;
  magnitudeLabel: string;
  nextAction: ReactNode;
}

function pressureColor(type: PressureType): string {
  if (type === 'cost') return T.P_COST;
  if (type === 'dupl') return T.P_DUPL;
  if (type === 'vend') return T.P_VEND;
  if (type === 'adopt') return T.P_ADOPT;
  return T.P_VALUE;
}

function Pressure(props: PressureProps) {
  const labelColor = pressureColor(props.type);
  const labelLines = props.label.split('\n');
  return (
    <div
      style={{
        padding: '22px 0',
        borderTop: `1px solid ${T.RULE}`,
        display: 'grid',
        gridTemplateColumns: '110px 1fr 320px',
        gap: 24,
        alignItems: 'start',
        cursor: 'pointer',
      }}
    >
      {/* ptag */}
      <div
        style={{
          fontFamily: T.MONO,
          fontSize: 9.5,
          letterSpacing: '1.5px',
          fontWeight: 800,
          textTransform: 'uppercase',
          lineHeight: 1.4,
        }}
      >
        <span
          style={{
            display: 'block',
            color: T.GRAY_DK,
            marginBottom: 4,
            fontWeight: 600,
          }}
        >
          {props.id}
        </span>
        <span style={{ color: labelColor }}>
          {labelLines.map((line, i) => (
            <span key={i} style={{ display: 'block' }}>
              {line}
            </span>
          ))}
        </span>
      </div>

      {/* body */}
      <div>
        <h3
          style={{
            fontFamily: T.SERIF,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '-0.4px',
            lineHeight: 1.2,
            marginBottom: 6,
            margin: 0,
            color: T.INK,
          }}
        >
          {props.headline}
        </h3>
        <p
          style={{
            fontSize: 13,
            color: T.INK_2,
            lineHeight: 1.5,
            maxWidth: '60ch',
            margin: '6px 0 10px',
          }}
        >
          {props.lede}
        </p>
        <div
          style={{
            display: 'flex',
            gap: 14,
            flexWrap: 'wrap',
            fontFamily: T.MONO,
            fontSize: 9.5,
            letterSpacing: '1.2px',
            color: T.GRAY_DK,
            fontWeight: 600,
            textTransform: 'uppercase',
          }}
        >
          {props.meta.map((m, i) => (
            <span key={m.k} style={{ display: 'inline-flex', gap: 4 }}>
              {i > 0 && <span style={{ color: T.GRAY, marginRight: 10 }}>·</span>}
              <span>
                <strong style={{ color: T.INK, fontWeight: 700 }}>{m.k}:</strong> {m.v}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* panel-right */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div
          style={{
            fontFamily: T.SERIF,
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: '-0.7px',
            lineHeight: 1,
          }}
        >
          {props.magnitude}
        </div>
        <div
          style={{
            fontFamily: T.MONO,
            fontSize: 9,
            letterSpacing: '1.3px',
            color: T.GRAY_DK,
            fontWeight: 600,
            textTransform: 'uppercase',
          }}
        >
          {props.magnitudeLabel}
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: T.INK_2,
            marginTop: 6,
            lineHeight: 1.45,
          }}
        >
          {props.nextAction}
        </div>
      </div>
    </div>
  );
}

// ─── Strategic alignment matrix ───────────────────────────────────────────────
interface MatrixDot {
  name: string;
  amount: string;
  left: string;
  top: string;
  /** T-4: substrate-derived dots carry extra context for outline weight + ⭐ marker. */
  displayId?: string;
  alignedCallout?: boolean;
  confidenceLevel?: 'HIGH' | 'MED' | 'LOW';
}

// T-4b: legacy Strategic Bets fallback used when no substrate is loaded.
// Keeps the pre-substrate Tower visually intact for tests + screenshots.
interface StrategicBetCard {
  key: string;
  displayId?: string;
  name: string;
  meta: string;
  desc: ReactNode;
  cta: ReactNode;
}

const LEGACY_STRATEGIC_BETS: StrategicBetCard[] = [
  {
    key: 'agent-platform-foundation',
    name: 'Agent platform foundation',
    meta: 'Year 1 of 3 · $4.2M committed · attribution LOW',
    desc: "Building the Sentinel/Steward/Atlas substrate that the rest of the AbarVa stack runs on. Won't show measured value until programs migrate.",
    cta: null,
  },
  {
    key: 'data-sovereignty',
    name: 'Data sovereignty re-architecture',
    meta: 'Year 1 of 2 · $1.8M committed · attribution MED',
    desc: "Tied to EU operations. Compliance value is binary — either it lands by Q4 2026 or we're out of compliance, regardless of TCO.",
    cta: null,
  },
  {
    key: 'vendor-consolidation',
    name: 'Vendor consolidation thesis',
    meta: 'Year 0 · $0.9M committed · attribution LOW',
    desc: 'Hypothesis: 23 strategic suppliers can become 12 by 2027. Atlas is modeling. No measured value until first wave of consolidations.',
    cta: null,
  },
];

// T-4: legacy hardcoded 2×2 fallback used when no `initiatives` prop is passed.
// Keeps the pre-substrate Tower visually intact for tests + screenshots.
const LEGACY_2X2_DOTS: Record<AlignmentQuadrant, MatrixDot[]> = {
  tl: [
    { name: 'JOULE', amount: '$3.2M', left: '18%', top: '32%' },
    { name: 'DATABRICKS', amount: '$2.1M', left: '56%', top: '14%' },
    { name: 'FINOPS-CLI', amount: '$0.6M', left: '30%', top: '60%' },
  ],
  tr: [
    { name: 'M365-CORE', amount: '$8.4M', left: '22%', top: '22%' },
    { name: 'AZURE-PROD', amount: '$11.2M', left: '58%', top: '38%' },
    { name: 'SNOW-CMDB', amount: '$1.4M', left: '36%', top: '62%' },
  ],
  bl: [
    { name: 'LEGACY-VPN', amount: '$0.4M', left: '20%', top: '28%' },
    { name: 'ON-PREM-CRM', amount: '$1.1M', left: '56%', top: '56%' },
  ],
  br: [
    { name: 'COPILOT-E5', amount: '$2.8M', left: '28%', top: '18%' },
    { name: 'NOW-ASSIST', amount: '$0.9M', left: '60%', top: '42%' },
  ],
};

/** T-4: shorten an initiative name for the 2×2 dot label (~22 chars). */
function truncateName(name: string): string {
  if (name.length <= 22) return name;
  return `${name.slice(0, 21)}…`;
}

/**
 * T-4: resolve quadrant dots from substrate when present, fall back to the
 * legacy hardcoded list when the registry hasn't been loaded for this tenant.
 */
function resolveQuadrantDots(
  view: StrategicAlignment2x2View,
  quadrant: AlignmentQuadrant,
  fallback: MatrixDot[],
): MatrixDot[] {
  if (view.dots.length === 0) return fallback;
  const grouped = dotsByQuadrant(view);
  const live = grouped[quadrant] ?? [];
  return live.map((d: AlignmentDot) => ({
    name: d.name,
    amount: d.amount,
    left: d.positionLeft,
    top: d.positionTop,
    displayId: d.displayId,
    alignedCallout: d.alignedCallout,
    confidenceLevel: d.confidenceLevel,
  }));
}

function Quadrant({
  position,
  qlabel,
  qhead,
  dots,
}: {
  position: 'tl' | 'tr' | 'bl' | 'br';
  qlabel: string;
  qhead: ReactNode;
  dots: MatrixDot[];
}) {
  const styles: CSSProperties = {
    padding: '14px 16px',
    position: 'relative',
    background: T.CREAM_2,
    border: `1px solid ${T.RULE}`,
    minHeight: 220,
  };
  if (position === 'tl') {
    styles.gridColumn = 2;
    styles.gridRow = 1;
    styles.borderRight = 'none';
  } else if (position === 'tr') {
    styles.gridColumn = 3;
    styles.gridRow = 1;
  } else if (position === 'bl') {
    styles.gridColumn = 2;
    styles.gridRow = 2;
    styles.borderRight = 'none';
    styles.borderTop = 'none';
  } else {
    styles.gridColumn = 3;
    styles.gridRow = 2;
    styles.borderTop = 'none';
  }

  return (
    <div style={styles}>
      <div
        style={{
          fontFamily: T.MONO,
          fontSize: 9,
          letterSpacing: '1.4px',
          fontWeight: 700,
          color: T.GRAY_DK,
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        {qlabel}
      </div>
      <div
        style={{
          fontFamily: T.SERIF,
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: '-0.2px',
          marginBottom: 12,
          lineHeight: 1.25,
          maxWidth: '30ch',
        }}
      >
        {qhead}
      </div>
      <div style={{ position: 'relative', height: 130 }}>
        {dots.map((dot) => {
          // T-4: substrate-derived dots show displayId + ⭐ + confidence outline.
          // Legacy dots (no displayId) keep the original rendering.
          const isSubstrate = Boolean(dot.displayId);
          const conf = dot.confidenceLevel ?? 'HIGH';
          const borderStyle = conf === 'HIGH' ? 'solid' : conf === 'MED' ? 'dashed' : 'dotted';
          return (
            <div
              key={dot.displayId ?? dot.name}
              data-testid={isSubstrate ? `tower-2x2-dot-${dot.displayId}` : undefined}
              data-aligned-callout={dot.alignedCallout ? 'true' : undefined}
              style={{
                position: 'absolute',
                left: dot.left,
                top: dot.top,
                padding: '6px 10px',
                background: T.INK,
                color: T.CREAM,
                fontFamily: T.MONO,
                fontSize: 9.5,
                letterSpacing: '1px',
                fontWeight: 700,
                borderRadius: 5,
                cursor: 'pointer',
                lineHeight: 1.2,
                border: isSubstrate ? `1.5px ${borderStyle} ${T.CREAM}` : undefined,
                maxWidth: 180,
              }}
            >
              {isSubstrate && (
                <span
                  style={{
                    display: 'block',
                    fontSize: 8.5,
                    letterSpacing: '0.16em',
                    opacity: 0.7,
                    marginBottom: 1,
                  }}
                >
                  {dot.displayId}
                </span>
              )}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {isSubstrate ? truncateName(dot.name) : dot.name}
                {dot.alignedCallout && (
                  <span aria-label="aligned callout" style={{ fontSize: 10 }}>⭐</span>
                )}
              </span>
              <span
                style={{
                  display: 'block',
                  fontFamily: T.SERIF,
                  fontSize: 11,
                  fontWeight: 700,
                  marginTop: 1,
                  letterSpacing: 0,
                  opacity: 0.85,
                }}
              >
                {dot.amount}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Atlas synthesis (right column) ───────────────────────────────────────────
//
// T-3 (Tower Fix Package, 2026-05-07): observations gain inline action chips.
// The CTAs T-1 displaced from the dashboard band now land here, where the
// observation gives the action context.
//
// AtlasAction: a chip with a verb-leading label and a destination.
//   - primary chips render with `→` arrow flush-left.
//   - secondary chips render with `↳` indent prefix (for absorbed band CTAs).
//   - timeHint adds a "(5 min)" parenthetical.
//   - pending=true marks chips whose destination is a placeholder; useful
//     for the follow-up wave that wires real flows.
interface AtlasAction {
  label: string;
  timeHint?: string;
  href: string;
  pending?: boolean;
  secondary?: boolean;
}

interface SynthBlock {
  h: string;
  body: ReactNode;
  actions?: AtlasAction[];
}

function AtlasColumn({
  headline,
  meta,
  synth,
  prompts,
}: {
  headline: string;
  meta: string;
  synth: SynthBlock[];
  prompts: string[];
}) {
  const [input, setInput] = useState('');
  return (
    <aside
      style={{
        borderLeft: `1px solid ${T.RULE}`,
        background: T.CREAM_2,
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        minWidth: 0,
      }}
    >
      {/* atlas-head */}
      <div style={{ padding: '22px 22px 14px', borderBottom: `1px solid ${T.RULE}` }}>
        <div
          style={{
            fontFamily: T.MONO,
            fontSize: 10,
            letterSpacing: '1.6px',
            fontWeight: 700,
            color: T.PURPLE,
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          ✦ Atlas · Synthesis
        </div>
        <h3
          style={{
            fontFamily: T.SERIF,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '-0.3px',
            lineHeight: 1.25,
            marginBottom: 8,
            margin: 0,
            color: T.INK,
          }}
        >
          {headline}
        </h3>
        <div
          style={{
            fontFamily: T.MONO,
            fontSize: 9,
            letterSpacing: '1.2px',
            color: T.GRAY_DK,
            fontWeight: 600,
            marginTop: 6,
          }}
        >
          {meta}
        </div>
      </div>

      {/* atlas-synth */}
      <div
        style={{
          padding: '16px 22px',
          borderBottom: `1px solid ${T.RULE}`,
          flex: 1,
          overflowY: 'auto',
        }}
      >
        {synth.map((block, i) => (
          <div key={i} style={{ marginBottom: i === synth.length - 1 ? 0 : 18 }}>
            <div
              style={{
                fontFamily: T.MONO,
                fontSize: 9,
                letterSpacing: '1.5px',
                fontWeight: 700,
                color: T.GOLD,
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              {block.h}
            </div>
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.55,
                color: T.INK_2,
              }}
            >
              {block.body}
            </div>
            {block.actions?.map((action, j) => (
              <AtlasActionChip key={`${i}-${j}`} action={action} />
            ))}
          </div>
        ))}
      </div>

      {/* atlas-prompt */}
      <div style={{ padding: '14px 18px', borderTop: `1px solid ${T.RULE}` }}>
        <div
          style={{
            fontFamily: T.MONO,
            fontSize: 9,
            letterSpacing: '1.4px',
            color: T.GRAY_DK,
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          ↳ Suggested prompts
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
          {prompts.map((p) => (
            <button
              key={p}
              onClick={() => setInput(p)}
              style={{
                fontSize: 12,
                padding: '8px 11px',
                border: `1px solid ${T.BORDER}`,
                borderRadius: 7,
                cursor: 'pointer',
                background: T.CREAM,
                lineHeight: 1.4,
                color: T.INK_2,
                textAlign: 'left',
                fontFamily: 'inherit',
              }}
            >
              <span style={{ color: T.PURPLE, fontWeight: 700, marginRight: 5 }}>→</span>
              {p}
            </button>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            gap: 6,
            alignItems: 'center',
            padding: '8px 10px',
            border: `1px solid ${T.BORDER_STRONG}`,
            borderRadius: 7,
            background: T.CREAM,
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            type="text"
            placeholder="Ask Atlas about the portfolio…"
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: 12,
              fontFamily: 'inherit',
              color: T.INK,
            }}
          />
          <button
            style={{
              background: T.PURPLE,
              color: 'white',
              border: 'none',
              width: 24,
              height: 24,
              borderRadius: '50%',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            ↑
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── Atlas action chip (T-3) ──────────────────────────────────────────────────
//
// Action-direction (verb-leading) chip that lives below an observation's body.
// Primary chips ("→ Open EA brief in Source") sit flush-left; secondary chips
// ("↳ Set attribution baseline (5 min)") indent under the primary to show the
// CTA was absorbed from a tile T-1 removed.
function AtlasActionChip({ action }: { action: AtlasAction }) {
  const arrow = action.secondary ? '↳' : '→';
  const indent = action.secondary ? 12 : 0;
  return (
    <Link
      href={action.href}
      data-testid={`atlas-action-chip-${action.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`}
      data-attr-chip-pending={action.pending ? 'true' : undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        marginTop: 6,
        marginLeft: indent,
        padding: '5px 10px',
        fontFamily: T.MONO,
        fontSize: 10,
        letterSpacing: '0.06em',
        fontWeight: 700,
        color: T.PURPLE,
        background: 'transparent',
        border: `1px solid ${T.RULE}`,
        borderRadius: 6,
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'background 120ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = T.CREAM;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <span aria-hidden style={{ fontWeight: 700 }}>{arrow}</span>
      <span>
        {action.label}
        {action.timeHint && (
          <span style={{ color: T.GRAY_DK, fontWeight: 600, marginLeft: 4 }}>
            ({action.timeHint})
          </span>
        )}
      </span>
      <span aria-hidden style={{ marginLeft: 2 }}>→</span>
    </Link>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
interface TowerIndexPageProps {
  tenantName?: string;
  context?: string;
  /**
   * T-4 (AI Initiatives Substrate v1.1.0): real registry initiatives to plot
   * in the Strategic Alignment 2×2. When omitted or empty, the 2×2 falls back
   * to the legacy hardcoded display so the page still renders pre-substrate.
   */
  initiatives?: ReadonlyArray<AIInitiative>;
  /**
   * T-5 (Bind 1): pre-computed band tile aggregations from substrate.
   * When omitted or `isEmpty`, the band falls back to the legacy hardcoded
   * Apex Retail demo values so the page still renders pre-substrate.
   */
  bandMetrics?: TowerBandMetricsView;
  /** Slots are accepted for backward compatibility but not rendered in the broadsheet design. */
  provenanceSlot?: ReactNode;
  portfolioSummarySlot?: ReactNode;
  cascadeGraphSlot?: ReactNode;
  towerHandoffSlot?: ReactNode;
  towerSubmenuSlot?: ReactNode;
  towerLensSlot?: ReactNode;
}

export function TowerIndexPage({
  tenantName = 'Meridian Enterprises',
  context = 'Control Tower · Portfolio Index',
  initiatives,
  bandMetrics,
  provenanceSlot: _p1,
  portfolioSummarySlot: _p2,
  cascadeGraphSlot: _p3,
  towerHandoffSlot: _p4,
  towerSubmenuSlot,
  towerLensSlot: _p6,
}: TowerIndexPageProps = {}) {
  void _p1; void _p2; void _p3; void _p4; void _p6;
  const alignment2x2View = buildStrategicAlignment2x2View(initiatives ?? []);
  // T-5: render band from substrate when available; fall back to legacy hardcoded.
  const useSubstrateBand = Boolean(bandMetrics && !bandMetrics.isEmpty);
  const bandByKey = useSubstrateBand
    ? new Map(bandMetrics!.metrics.map((m) => [m.key, m] as const))
    : null;
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeLens = (searchParams?.get('lens') ?? 'value') as 'value' | 'risk' | 'contract' | 'adopt';

  const lensTabs: { key: typeof activeLens; label: string }[] = [
    { key: 'value', label: 'Value' },
    { key: 'risk', label: 'Risk' },
    { key: 'contract', label: 'Contract' },
    { key: 'adopt', label: 'Adoption' },
  ];

  // Date — use today's date (2026-05-06 per memory) but format for the masthead
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const timestamp = today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <AppShell
      surface="tower"
      topBarProps={{ tenantName, showLocked: true, context }}
      middleStrip={towerSubmenuSlot}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 320px',
          gap: 0,
          minHeight: '100%',
          background: T.PAGE_BG,
          color: T.INK,
          fontFamily: T.SANS,
          overflow: 'auto',
        }}
      >
        {/* ─── MAIN COLUMN ─── */}
        <div style={{ minWidth: 0, padding: 0 }}>
          {/* Masthead */}
          <div
            style={{
              padding: '22px 32px 18px',
              borderBottom: `1px solid ${T.RULE_STRONG}`,
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 18,
              alignItems: 'end',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: T.MONO,
                  fontSize: 10,
                  letterSpacing: '2px',
                  fontWeight: 700,
                  color: T.GOLD,
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                Tower · Portfolio Index · TWR-IDX-PORTFOLIO
              </div>
              <h1
                style={{
                  fontFamily: T.SERIF,
                  fontSize: 44,
                  fontWeight: 900,
                  letterSpacing: '-1.2px',
                  lineHeight: 1,
                  marginBottom: 6,
                  margin: 0,
                  color: T.INK,
                }}
              >
                The IT Portfolio{' '}
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 500,
                    fontStyle: 'italic',
                    color: T.GRAY_DK,
                    letterSpacing: '-0.5px',
                  }}
                >
                  — {dayName}, {monthDay}
                </span>
              </h1>
              <div
                style={{
                  fontFamily: T.MONO,
                  fontSize: 10,
                  letterSpacing: '1.4px',
                  color: T.GRAY_DK,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  marginTop: 6,
                }}
              >
                M. Castillo · CFO · {tenantName} · {timestamp} PT
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} role="tablist">
              {lensTabs.map((tab) => {
                const isCurrent = tab.key === activeLens;
                return (
                  <button
                    key={tab.key}
                    onClick={() => router.push(tab.key === 'value' ? '/tower' : `/tower?lens=${tab.key}`)}
                    style={{
                      fontFamily: T.MONO,
                      fontSize: 9.5,
                      letterSpacing: '1.4px',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      padding: '8px 14px',
                      border: `1px solid ${isCurrent ? T.INK : T.BORDER}`,
                      borderRadius: 999,
                      cursor: 'pointer',
                      background: isCurrent ? T.INK : 'transparent',
                      color: isCurrent ? T.CREAM : T.INK_2,
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: 1,
                        background: 'currentColor',
                        marginRight: 6,
                        verticalAlign: 'middle',
                        opacity: 0.7,
                      }}
                    />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* KPI band — T-1 compression: ~80px tall, 2-line tiles, no inline CTAs.
              Displaced detail (3-line descriptions) lives in hover tooltip;
              displaced CTAs ("+24% pending baseline →" and "Connect Okta +
              EntraID →") absorbed by Atlas observations in T-3. */}
          <section
            data-testid="tower-kpi-band"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr',
              padding: '14px 32px',
              borderBottom: `1px solid ${T.RULE_STRONG}`,
              gap: 0,
              alignItems: 'center',
            }}
          >
            {useSubstrateBand && bandByKey ? (
              <>
                <SubstrateKpi metric={bandByKey.get('portfolio_roi')!} hero isFirst />
                <SubstrateKpi metric={bandByKey.get('active_pressures')!} />
                <SubstrateKpi metric={bandByKey.get('spend_at_risk')!} />
                <SubstrateKpi metric={bandByKey.get('renewals_90d')!} />
                <SubstrateKpi metric={bandByKey.get('adoption_rate')!} />
              </>
            ) : (
              <>
                <Kpi
                  label="Portfolio ROI · 12-month rolling"
                  hero
                  isFirst
                  subtext={<>target 3.5× · <span style={{ color: T.RED, fontWeight: 700 }}>▼0.4×</span> vs Q1</>}
                  tooltip="35% of programs measured. 41% modeled. +24% pending baseline."
                >
                  <MetricProvenance metricKey="portfolio_roi">
                    <span style={cvalStyle('high')}>
                      2.8<span style={{ fontSize: '0.55em' }}>×</span>
                    </span>
                  </MetricProvenance>
                </Kpi>

                <Kpi
                  label="Active pressures"
                  subtext={<>3 high · 4 watch · <span style={{ color: T.GREEN, fontWeight: 700 }}>▲2</span></>}
                  tooltip="3 high-magnitude pressures and 4 on watch. ▲2 new this week."
                >
                  <MetricProvenance metricKey="active_pressures">
                    <span style={cvalStyle('high')}>7</span>
                  </MetricProvenance>
                </Kpi>

                <Kpi
                  label="Spend at risk"
                  subtext={<><span style={{ color: T.RED, fontWeight: 700 }}>▲$1.2M</span> MoM</>}
                  tooltip="Cost overrun and capability duplication exposure across the AI portfolio."
                >
                  <MetricProvenance metricKey="spend_at_risk">
                    <span style={cvalStyle('med')}>
                      $8.4<span style={{ fontSize: '0.55em' }}>M</span>
                      <ConfTag conf="med" />
                    </span>
                  </MetricProvenance>
                </Kpi>

                <Kpi
                  label="Renewals · 90d"
                  subtext={<>EA 47d · $48.2M</>}
                  tooltip="4 vendor renewals in the next 90 days totaling $48.2M aggregate. EA renewal due in 47 days; brief is open in Source."
                >
                  <MetricProvenance metricKey="renewals_90d">
                    <span style={cvalStyle('high')}>4</span>
                  </MetricProvenance>
                </Kpi>

                <Kpi
                  label="Adoption"
                  subtext={<>2 sources missing</>}
                  tooltip="2 identity sources (Okta, EntraID) not yet connected; until they land, adoption confidence is LOW. Connect identity sources from Atlas observations."
                >
                  <MetricProvenance metricKey="adoption_rate">
                    <span style={cvalStyle('low')}>
                      53<span style={{ fontSize: '0.55em' }}>%</span>
                      <ConfTag conf="low" />
                    </span>
                  </MetricProvenance>
                </Kpi>
              </>
            )}
          </section>

          {/* Section headline */}
          <div style={{ padding: '26px 32px 14px' }}>
            <div
              style={{
                fontFamily: T.MONO,
                fontSize: 10,
                letterSpacing: '2px',
                fontWeight: 700,
                color: T.GOLD,
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              Today&apos;s pressures · 7 active · 3 demanding decisions
            </div>
            <h2
              style={{
                fontFamily: T.SERIF,
                fontSize: 30,
                fontWeight: 800,
                letterSpacing: '-0.7px',
                lineHeight: 1.1,
                maxWidth: '32ch',
                margin: 0,
                color: T.INK,
              }}
            >
              Three pressures need a CFO posture before the EA renewal closes.
            </h2>
            <p
              style={{
                fontSize: 13.5,
                color: T.GRAY_DK,
                marginTop: 8,
                maxWidth: '64ch',
                lineHeight: 1.55,
              }}
            >
              In order of decision-pressure, not magnitude. Atlas has prepared one-page synthesis for each — open any to see the underlying programs, evidence, and recommended Move.
            </p>
          </div>

          {/* Pressures list */}
          <div style={{ padding: '0 32px 28px', display: 'flex', flexDirection: 'column' }}>
            <Pressure
              type="cost"
              id="P-COST-2026-04"
              label={'Cost\nOverrun'}
              headline="LLM inference burn is on pace to overrun the AI envelope by $2.4M before Q3."
              lede="Five programs share the budget pool. Joule and the internal Copilot pilot are 71% of token volume but 38% of measured value. Sentinel raised the flag 12 days ago; it's been trending faster since the Q1 model swap."
              meta={[
                { k: 'Programs affected', v: '5' },
                { k: 'First seen', v: '12 days ago' },
                { k: 'Owner', v: 'P. Iyer · CTO office' },
              ]}
              magnitude={
                <span style={cvalStyle('high')}>
                  $2.4<span style={{ fontSize: 13, fontWeight: 500, fontStyle: 'italic', color: T.GRAY_DK, marginLeft: 2, letterSpacing: 0 }}>M</span>
                </span>
              }
              magnitudeLabel="Q3 projected overrun · HIGH conf"
              nextAction={
                <>
                  Atlas suggests <strong style={{ color: T.INK }}>opening a Move on token-routing policy</strong> — would deflect ~$1.6M without touching the rate cards.
                </>
              }
            />
            <Pressure
              type="dupl"
              id="P-DUPL-2026-02"
              label={'Capability\nDuplication'}
              headline="Now Assist and M365 Copilot are converging on the same internal helpdesk use case."
              lede="Both tools are being adopted by IT support, with overlapping deflection metrics and conflicting analytics. ServiceNow renewal is Q4 ($4.1M ARR); the duplication is real but attribution to either tool is currently low-confidence."
              meta={[
                { k: 'Programs affected', v: '2' },
                { k: 'First seen', v: '28 days ago' },
                { k: 'Owner', v: 'J. Park · Steward' },
              ]}
              magnitude={
                <span style={cvalStyle('med')}>
                  $1.2<span style={{ fontSize: 13, fontWeight: 500, fontStyle: 'italic', color: T.GRAY_DK, marginLeft: 2, letterSpacing: 0 }}>M</span>
                  <ConfTag conf="med" />
                </span>
              }
              magnitudeLabel="Annual exposure · attribution loose"
              nextAction={
                <>
                  Atlas wants to <strong style={{ color: T.INK }}>run a 6-week clean attribution study</strong> before recommending consolidation.
                </>
              }
            />
            <Pressure
              type="vend"
              id="P-VEND-2026-01"
              label={'Vendor\nClock'}
              headline="Microsoft EA renewal closes in 47 days. Brief is open in Source. Decision posture undefined."
              lede="$31.4M aggregate spend. Three product lines in scope (M365, Azure consumption, Copilot E5). Atlas's pre-brief surfaced two negotiation levers tied to current pressures: tie EA volume to inference deflection (P-COST), and use the Now Assist overlap (P-DUPL) as a swap argument on Copilot quantity."
              meta={[
                { k: 'Programs touched', v: '11' },
                { k: 'Lead', v: 'M. Desai · Source' },
                { k: 'Brief', v: 'draft v2 in Source' },
              ]}
              magnitude={
                <span style={cvalStyle('high')}>
                  47<span style={{ fontSize: 13, fontWeight: 500, fontStyle: 'italic', color: T.GRAY_DK, marginLeft: 2, letterSpacing: 0 }}>d</span>
                </span>
              }
              magnitudeLabel="Until close · HIGH conf · CFO posture due"
              nextAction={
                <>
                  Atlas drafted a <strong style={{ color: T.INK }}>negotiation thesis</strong> tying the EA to two open pressures. Read in Source brief.
                </>
              }
            />
            <Pressure
              type="adopt"
              id="P-ADOPT-2026-03"
              label={'Adoption\nGap'}
              headline="M365 Copilot adoption is at 24% of seats licensed. Plan was 60% by month 6."
              lede={
                <>
                  Six months in. Two functions over 50% (Finance, Legal); IT and Sales under 15%. Steward is preparing a re-baseline proposal. <em>This is not a decision today — it&apos;s a watch item until the EA brief lands.</em>
                </>
              }
              meta={[
                { k: 'Seats licensed', v: '8,400' },
                { k: 'Active seats', v: '2,016' },
                { k: 'Watch since', v: '2 weeks' },
              ]}
              magnitude={
                <span style={cvalStyle('med')}>
                  24<span style={{ fontSize: 13, fontWeight: 500, fontStyle: 'italic', color: T.GRAY_DK, marginLeft: 2, letterSpacing: 0 }}>%</span>
                  <ConfTag conf="med" />
                </span>
              }
              magnitudeLabel="Active rate · vs 60% target"
              nextAction="Watch · re-baseline pending. Tied to EA brief."
            />
            <Pressure
              type="value"
              id="P-VALUE-2026-05"
              label={'Value\nLag'}
              headline="Joule rollout is under-realizing on the projected efficiency line."
              lede="Committed $3.2M annual; measured $1.4M after 9 months. Steward attributes 60% of the gap to slower-than-planned RPA pipeline migration. Re-baseline expected at next governance review."
              meta={[
                { k: 'Tied program', v: 'SAP Joule rollout' },
                { k: 'Owner', v: 'SAP COE' },
              ]}
              magnitude={
                <span style={cvalStyle('med')}>
                  $1.8<span style={{ fontSize: 13, fontWeight: 500, fontStyle: 'italic', color: T.GRAY_DK, marginLeft: 2, letterSpacing: 0 }}>M</span>
                  <ConfTag conf="med" />
                </span>
              }
              magnitudeLabel="Realization gap · 9 months in"
              nextAction="Re-baseline at next governance review."
            />
          </div>

          {/* Strategic alignment matrix */}
          <section style={{ padding: '30px 32px', borderTop: `1px solid ${T.RULE_STRONG}` }}>
            <div style={{ paddingBottom: 12 }}>
              <div
                style={{
                  fontFamily: T.MONO,
                  fontSize: 10,
                  letterSpacing: '2px',
                  fontWeight: 700,
                  color: T.GOLD,
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                Strategic alignment · {alignment2x2View.dots.length > 0 ? alignment2x2View.totalPlotted : 23} programs plotted · current Value lens
              </div>
              <h2
                style={{
                  fontFamily: T.SERIF,
                  fontSize: 30,
                  fontWeight: 800,
                  letterSpacing: '-0.7px',
                  lineHeight: 1.1,
                  maxWidth: '32ch',
                  margin: 0,
                }}
              >
                Where the portfolio is, against where the strategy says it should be.
              </h2>
              <p
                style={{
                  fontSize: 13.5,
                  color: T.GRAY_DK,
                  marginTop: 8,
                  maxWidth: '64ch',
                  lineHeight: 1.55,
                }}
              >
                Confidence shows up as outline weight: <strong>solid = HIGH</strong>, <strong>dashed = MEDIUM/LOW</strong>. Strategic bets (T-FOW) are pulled into a separate row below — they don&apos;t have measured ROI yet, and mixing them on the matrix would be dishonest.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr 1fr',
                gridTemplateRows: '1fr 1fr 60px',
                gap: 0,
                marginTop: 18,
              }}
            >
              {/* Y axis */}
              <div
                style={{
                  gridColumn: 1,
                  gridRow: '1 / 3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                    fontFamily: T.MONO,
                    fontSize: 9.5,
                    letterSpacing: '1.6px',
                    fontWeight: 700,
                    color: T.GRAY_DK,
                    textTransform: 'uppercase',
                  }}
                >
                  Strategic alignment →
                </span>
              </div>

              <Quadrant
                position="tl"
                qlabel="High value · Low alignment"
                qhead="Useful but off-strategy. Sustain or rationalize."
                dots={resolveQuadrantDots(alignment2x2View, 'tl', LEGACY_2X2_DOTS.tl)}
              />
              <Quadrant
                position="tr"
                qlabel="High value · High alignment · the prize"
                qhead="Defend, scale, lock baselines."
                dots={resolveQuadrantDots(alignment2x2View, 'tr', LEGACY_2X2_DOTS.tr)}
              />
              <Quadrant
                position="bl"
                qlabel="Low value · Low alignment"
                qhead={
                  <>
                    Sunset candidates.{' '}
                    <span style={{ color: T.RED, fontFamily: T.MONO, fontSize: 11 }}>3 flagged</span>
                  </>
                }
                dots={resolveQuadrantDots(alignment2x2View, 'bl', LEGACY_2X2_DOTS.bl)}
              />
              <Quadrant
                position="br"
                qlabel="Low value · High alignment"
                qhead="Strategic but not yet earning. Watch closely."
                dots={resolveQuadrantDots(alignment2x2View, 'br', LEGACY_2X2_DOTS.br)}
              />

              {/* X axis */}
              <div
                style={{
                  gridColumn: '2 / 4',
                  gridRow: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingTop: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: T.MONO,
                    fontSize: 9.5,
                    letterSpacing: '1.6px',
                    fontWeight: 700,
                    color: T.GRAY_DK,
                    textTransform: 'uppercase',
                  }}
                >
                  Realized portfolio value →
                </span>
              </div>
            </div>

            {/* T-FOW row */}
            <div
              style={{
                padding: '18px 0 28px',
                borderTop: `1px dashed ${T.RULE_STRONG}`,
                marginTop: 18,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontFamily: T.MONO,
                    fontSize: 10,
                    letterSpacing: '1.6px',
                    color: T.GOLD,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  Strategic bets · {alignment2x2View.strategicBets.length > 0 ? alignment2x2View.strategicBets.length : 3} programs · T-FOW lens
                </span>
                <span
                  style={{
                    fontFamily: T.MONO,
                    fontSize: 9,
                    letterSpacing: '1.2px',
                    color: T.GRAY_DK,
                    fontStyle: 'italic',
                  }}
                >
                  Plotted separately — attribution is too loose for the 2×2 today.
                </span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.max(alignment2x2View.strategicBets.length, 3)}, 1fr)`,
                  gap: 14,
                }}
              >
                {(alignment2x2View.strategicBets.length > 0
                  ? alignment2x2View.strategicBets.map((bet) => ({
                      key: bet.displayId,
                      displayId: bet.displayId,
                      name: bet.name,
                      meta: `${bet.stageDetail} · ${bet.amount} committed · attribution ${bet.confidenceLevel}`,
                      desc: null as ReactNode,
                      cta: null as ReactNode,
                    }))
                  : LEGACY_STRATEGIC_BETS
                ).map((card) => (
                  <div
                    key={card.key}
                    data-testid={
                      card.displayId
                        ? `tower-strategic-bet-${card.displayId}`
                        : undefined
                    }
                    style={{
                      padding: '14px 16px',
                      border: `1px dashed ${T.RULE_STRONG}`,
                      borderRadius: 8,
                      background: 'transparent',
                    }}
                  >
                    {card.displayId && (
                      <div
                        style={{
                          fontFamily: T.MONO,
                          fontSize: 9,
                          letterSpacing: '1.6px',
                          color: T.GRAY_DK,
                          fontWeight: 700,
                          marginBottom: 2,
                        }}
                      >
                        {card.displayId}
                      </div>
                    )}
                    <div
                      style={{
                        fontFamily: T.SERIF,
                        fontSize: 16,
                        fontWeight: 700,
                        letterSpacing: '-0.2px',
                        marginBottom: 4,
                      }}
                    >
                      {card.name}
                    </div>
                    <div
                      style={{
                        fontFamily: T.MONO,
                        fontSize: 9,
                        letterSpacing: '1.2px',
                        color: T.GRAY_DK,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                      }}
                    >
                      {card.meta}
                    </div>
                    {card.desc && (
                      <div
                        style={{
                          fontSize: 12.5,
                          color: T.INK_2,
                          lineHeight: 1.5,
                          margin: '8px 0',
                        }}
                      >
                        {card.desc}
                      </div>
                    )}
                    {card.cta && <div>{card.cta}</div>}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* T-4: "Coming next" block — deferred metrics roadmap signal,
              rendered above the doctrine line. Conditionally hides itself
              when the view has no deferred metrics. */}
          <div style={{ padding: '12px 0 0' }}>
            <DeferredMetricsBlock view="tower-cfo" />
          </div>

          {/* Footer signature */}
          <div
            style={{
              padding: '22px 32px 32px',
              borderTop: `1px dashed ${T.RULE}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: 24,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                fontFamily: T.MONO,
                fontSize: 9.5,
                letterSpacing: '1.4px',
                color: T.GRAY_DK,
                fontWeight: 600,
                lineHeight: 1.7,
                maxWidth: '60ch',
              }}
            >
              <strong style={{ color: T.INK }}>Tower is a decision instrument, not a dashboard.</strong> Every number on this page has a confidence level and an underlying calculation that&apos;s queryable. Underlines: solid HIGH · dashed MED · dotted LOW. Missing inputs read as invitations, not errors.<br />
              Next governance review: <strong style={{ color: T.INK }}>May 19 · 90-min board prep</strong>.
            </div>
            <div
              style={{
                fontFamily: T.MONO,
                fontSize: 9,
                letterSpacing: '1.3px',
                color: T.GRAY,
                fontStyle: 'italic',
                textAlign: 'right',
              }}
            >
              Generated {timestamp} PT · refreshes every 6h<br />
              v2 confidence bands · substrate v0.9
            </div>
          </div>
        </div>

        {/* ─── ATLAS COLUMN ─── */}
        <AtlasColumn
          headline="Three threads run through this morning's pressures."
          meta={`${timestamp} · Read time 90 sec · 3 observations · 4 prompts`}
          synth={[
            {
              h: 'Observation · 01',
              body: (
                <>
                  The <strong style={{ color: T.INK }}>EA renewal</strong> isn&apos;t separate from the{' '}
                  <strong style={{ color: T.INK }}>cost overrun</strong> and{' '}
                  <strong style={{ color: T.INK }}>capability duplication</strong> — they share root nodes. If you take a posture on the EA without resolving the overlap, you&apos;ll renew at the wrong volumes.
                </>
              ),
              actions: [
                {
                  label: 'Open EA brief in Source',
                  href: '/source',
                  pending: true,
                },
              ],
            },
            {
              h: 'Observation · 02',
              body: (
                <>
                  Your <strong style={{ color: T.INK }}>portfolio ROI is at 2.8×, target 3.5×</strong>. The shortfall is concentrated in three programs (Joule, Copilot E5, Now Assist) where measured value is lagging committed by <em>more than 40%</em>. Two of those three are in the 47-day EA window.
                </>
              ),
              actions: [
                {
                  label: 'See programs lagging on value',
                  href: '/programs?lens=value',
                },
                {
                  label: 'Set attribution baseline',
                  timeHint: '5 min',
                  href: '/tower/settings/attribution',
                  pending: true,
                  secondary: true,
                },
              ],
            },
            {
              h: 'Observation · 03',
              body: (
                <>
                  Adoption confidence is <strong style={{ color: T.INK }}>LOW</strong> because Okta and EntraID aren&apos;t connected. Until those land, the 24% Copilot number is directional, not auditable.
                </>
              ),
              actions: [
                {
                  label: 'Connect identity sources',
                  timeHint: '5 min',
                  href: '/admin/connectors',
                },
                {
                  label: 'Connect Okta + EntraID',
                  href: '/admin/connectors',
                  secondary: true,
                },
              ],
            },
            {
              h: 'If you only do one thing today',
              body: (
                <>
                  <em>Open the EA brief and read Atlas&apos;s negotiation thesis.</em> The other pressures route through it. Steward and Sentinel are both aligned on what the brief should ask for.
                </>
              ),
            },
          ]}
          prompts={[
            'Show me the 3 lagging programs',
            'What if I cut LLM tokens by 30%?',
            'Re-rank pressures by attribution confidence',
            'Brief me for the 9 AM staff meeting',
          ]}
        />
      </div>
    </AppShell>
  );
}

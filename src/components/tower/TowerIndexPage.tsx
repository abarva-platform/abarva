'use client';

import { useState } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import {
  BROADSHEET_KPIS,
  BROADSHEET_PRESSURES,
  BROADSHEET_MATRIX,
  BROADSHEET_TFOW,
  BROADSHEET_ATLAS,
  type BroadsheetKpi,
  type BroadsheetPressureRow,
  type ConfLevel,
  type MatrixDot,
  type TfowCard,
  type AtlasObservation,
} from '@/lib/tower/shell-tower-fixture';

// ---------------------------------------------------------------------------
// Design tokens (canon cream palette, Tower Portfolio design)
// ---------------------------------------------------------------------------
const C = {
  PAGE_BG: '#f5f1eb',
  CREAM: '#efe9dd',
  CREAM_2: '#faf6ec',
  CREAM_DEEP: '#e8e1d2',
  INK: '#000000',
  INK_2: '#2c2c2a',
  GRAY: '#888780',
  GRAY_DK: '#5F5E5A',
  BLUE: '#0066CC',
  GOLD: '#9C7B3F',
  GREEN: '#1d9e75',
  AMBER: '#ba7517',
  AMBER_BG: '#faeeda',
  RED: '#a32d2d',
  PURPLE: '#6b3fa0',
  RULE: 'rgba(10,10,11,0.14)',
  RULE_STRONG: 'rgba(10,10,11,0.32)',
  // Pressure type colors
  P_COST: '#8b3a3a',
  P_ADOPT: '#2d5f8a',
  P_DUPL: '#6b3fa0',
  P_VEND: '#9C7B3F',
  P_VALUE: '#1d6b4f',
  SERIF: 'Fraunces, Georgia, "Times New Roman", serif',
  SANS: 'Inter, -apple-system, system-ui, sans-serif',
  MONO: '"JetBrains Mono", ui-monospace, Menlo, monospace',
} as const;

const LENS_TABS = ['Value', 'Risk', 'Contract', 'Adoption'] as const;
type LensTab = (typeof LENS_TABS)[number];

// ---------------------------------------------------------------------------
// Confidence underline — the Tower differentiator
// ---------------------------------------------------------------------------
function confStyle(conf: ConfLevel): React.CSSProperties {
  if (conf === 'high') return { borderBottom: `2px solid ${C.INK}`, paddingBottom: 3 };
  if (conf === 'med') return { borderBottom: `2px dashed ${C.GRAY_DK}`, paddingBottom: 3 };
  return { borderBottom: `1.5px dotted ${C.GRAY}`, paddingBottom: 3 };
}

function pressureTypeColor(type: BroadsheetPressureRow['type']): string {
  if (type === 'cost') return C.P_COST;
  if (type === 'adopt') return C.P_ADOPT;
  if (type === 'dupl') return C.P_DUPL;
  if (type === 'vend') return C.P_VEND;
  return C.P_VALUE;
}

// ---------------------------------------------------------------------------
// KPI Band
// ---------------------------------------------------------------------------
function KpiBand({ kpis }: { kpis: BroadsheetKpi[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr',
        padding: '26px 32px',
        borderBottom: `1px solid ${C.RULE_STRONG}`,
      }}
    >
      {kpis.map((kpi, i) => (
        <div
          key={kpi.label}
          style={{
            padding: i === 0 ? '0 28px 0 0' : '0 28px',
            borderLeft: i === 0 ? 'none' : `1px solid ${C.RULE}`,
          }}
        >
          <div
            style={{
              fontFamily: C.MONO,
              fontSize: 9.5,
              letterSpacing: '0.16em',
              textTransform: 'uppercase' as const,
              fontWeight: 700,
              color: C.GRAY_DK,
              marginBottom: 10,
            }}
          >
            {kpi.label}
          </div>

          {/* The number with confidence underline */}
          <div
            style={{
              fontFamily: C.SERIF,
              fontWeight: kpi.hero ? 800 : 700,
              fontSize: kpi.hero ? 64 : 38,
              letterSpacing: '-0.03em',
              lineHeight: 0.95,
              color: C.INK,
            }}
          >
            <span style={confStyle(kpi.conf)}>
              {kpi.value}
              {kpi.unit && (
                <span style={{ fontSize: '0.55em', fontWeight: 500, color: C.INK_2 }}>
                  {kpi.unit}
                </span>
              )}
              {kpi.confTag && (
                <span
                  style={{
                    fontFamily: C.MONO,
                    fontSize: 8,
                    letterSpacing: '0.14em',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: 3,
                    verticalAlign: 'super',
                    marginLeft: 4,
                    textTransform: 'uppercase' as const,
                    background: kpi.conf === 'low' ? 'rgba(136,135,128,0.16)' : 'rgba(186,117,23,0.14)',
                    color: kpi.conf === 'low' ? C.GRAY_DK : C.AMBER,
                  }}
                >
                  {kpi.confTag}
                </span>
              )}
            </span>
          </div>

          {/* Delta */}
          <div
            style={{
              fontFamily: C.MONO,
              fontSize: 10,
              letterSpacing: '0.12em',
              fontWeight: 700,
              marginTop: 8,
              color:
                kpi.deltaDir === 'up'
                  ? C.GREEN
                  : kpi.deltaDir === 'down'
                    ? C.RED
                    : C.GRAY,
            }}
          >
            {kpi.deltaDir === 'up' && '▲ '}
            {kpi.deltaDir === 'down' && '▼ '}
            {kpi.deltaDir === 'flat' && '● '}
            {kpi.delta}
          </div>

          {/* Footnote */}
          <div
            style={{
              fontFamily: C.MONO,
              fontSize: 8.5,
              letterSpacing: '0.12em',
              color: C.GRAY,
              marginTop: 10,
              fontWeight: 600,
              lineHeight: 1.5,
              maxWidth: '18ch',
            }}
          >
            {kpi.footnote}
            {kpi.missingChip && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '3px 8px',
                  border: `1px dashed ${C.RULE_STRONG}`,
                  borderRadius: 999,
                  cursor: 'pointer',
                  marginTop: 6,
                  color: C.GRAY_DK,
                  transition: 'all 180ms',
                }}
              >
                {kpi.missingChip.label}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pressure rows
// ---------------------------------------------------------------------------
function PressureRow({ row }: { row: BroadsheetPressureRow }) {
  const [hovered, setHovered] = useState(false);
  const typeColor = pressureTypeColor(row.type);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: hovered ? '22px 16px' : '22px 0',
        borderTop: `1px solid ${hovered ? 'transparent' : C.RULE}`,
        display: 'grid',
        gridTemplateColumns: '110px 1fr 320px',
        gap: 24,
        alignItems: 'start',
        cursor: 'pointer',
        transition: 'all 200ms',
        background: hovered ? C.CREAM : 'transparent',
        margin: hovered ? '0 -16px' : '0',
        borderRadius: hovered ? 10 : 0,
      }}
    >
      {/* Type tag */}
      <div
        style={{
          fontFamily: C.MONO,
          fontSize: 9.5,
          letterSpacing: '0.15em',
          fontWeight: 800,
          textTransform: 'uppercase' as const,
          lineHeight: 1.4,
        }}
      >
        <div style={{ color: C.GRAY_DK, marginBottom: 4, fontWeight: 600 }}>{row.id}</div>
        <div style={{ color: typeColor, whiteSpace: 'pre-line' }}>{row.typeLabel}</div>
      </div>

      {/* Body */}
      <div>
        <h3
          style={{
            fontFamily: C.SERIF,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            marginBottom: 6,
            color: C.INK,
          }}
        >
          {row.headline}
        </h3>
        <p
          style={{
            fontSize: 13,
            color: C.INK_2,
            lineHeight: 1.5,
            maxWidth: '60ch',
            marginBottom: 10,
          }}
        >
          {row.lede}
        </p>
        <div
          style={{
            display: 'flex',
            gap: 14,
            fontFamily: C.MONO,
            fontSize: 9.5,
            letterSpacing: '0.12em',
            color: C.GRAY_DK,
            fontWeight: 600,
            textTransform: 'uppercase' as const,
            flexWrap: 'wrap' as const,
          }}
        >
          {row.meta.map((m, i) => (
            <span key={m.label}>
              {i > 0 && <span style={{ color: C.GRAY, marginRight: 14 }}>·</span>}
              <strong style={{ color: C.INK }}>{m.label}:</strong> {m.value}
            </span>
          ))}
        </div>
      </div>

      {/* Magnitude + next action */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div
          style={{
            fontFamily: C.SERIF,
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
        >
          <span style={confStyle(row.magnitudeConf)}>
            {row.magnitude}
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                fontStyle: 'italic',
                color: C.GRAY_DK,
                marginLeft: 2,
                letterSpacing: 0,
              }}
            >
              {row.magnitudeUnit}
            </span>
          </span>
        </div>
        <div
          style={{
            fontFamily: C.MONO,
            fontSize: 9,
            letterSpacing: '0.13em',
            color: C.GRAY_DK,
            fontWeight: 600,
            textTransform: 'uppercase' as const,
          }}
        >
          {row.magnitudeLabel}
        </div>
        <div style={{ fontSize: 12.5, color: C.INK_2, marginTop: 6, lineHeight: 1.45 }}>
          {row.nextAction}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2×2 Strategic Alignment Matrix
// ---------------------------------------------------------------------------
function MatrixQuadrant({
  label,
  head,
  dots,
  flagCount,
}: {
  label: string;
  head: string;
  dots: MatrixDot[];
  flagCount?: number;
}) {
  return (
    <div
      style={{
        border: `1px solid ${C.RULE}`,
        padding: '14px 16px',
        position: 'relative' as const,
        background: C.CREAM_2,
        minHeight: 220,
      }}
    >
      <div
        style={{
          fontFamily: C.MONO,
          fontSize: 9,
          letterSpacing: '0.14em',
          fontWeight: 700,
          color: C.GRAY_DK,
          textTransform: 'uppercase' as const,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: C.SERIF,
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          marginBottom: 12,
          lineHeight: 1.25,
          maxWidth: '30ch',
        }}
      >
        {head}
        {flagCount !== undefined && (
          <span
            style={{
              fontFamily: C.MONO,
              fontSize: 11,
              fontWeight: 700,
              color: C.RED,
              marginLeft: 6,
            }}
          >
            {flagCount} flagged
          </span>
        )}
      </div>

      {/* Program dots */}
      {dots.map((dot) => (
        <div
          key={dot.id}
          style={{
            position: 'absolute' as const,
            left: dot.left,
            top: dot.top,
            padding: '6px 10px',
            background: C.INK,
            color: C.CREAM_2,
            fontFamily: C.MONO,
            fontSize: 9.5,
            letterSpacing: '0.1em',
            fontWeight: 700,
            borderRadius: 5,
            cursor: 'pointer',
            lineHeight: 1.2,
            transition: 'transform 180ms',
          }}
        >
          {dot.name}
          <span
            style={{
              display: 'block',
              fontFamily: C.SERIF,
              fontSize: 11,
              fontWeight: 700,
              marginTop: 1,
              letterSpacing: 0,
              opacity: 0.85,
            }}
          >
            {dot.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function StrategicMatrix() {
  const { quadrants, dots } = BROADSHEET_MATRIX;
  const byQ = (key: MatrixDot['quadrant']) => dots.filter((d) => d.quadrant === key);

  return (
    <section style={{ padding: '30px 32px', borderTop: `1px solid ${C.RULE_STRONG}` }}>
      <div style={{ paddingBottom: 12 }}>
        <div
          style={{
            fontFamily: C.MONO,
            fontSize: 10,
            letterSpacing: '0.2em',
            fontWeight: 700,
            color: C.GOLD,
            textTransform: 'uppercase' as const,
            marginBottom: 8,
          }}
        >
          Strategic alignment · 23 programs plotted · current Value lens
        </div>
        <h2
          style={{
            fontFamily: C.SERIF,
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            maxWidth: '32ch',
          }}
        >
          Where the portfolio is, against where the strategy says it should be.
        </h2>
        <p style={{ fontSize: 13.5, color: C.GRAY_DK, marginTop: 8, maxWidth: '64ch', lineHeight: 1.55 }}>
          Confidence shows up as outline weight: <strong>solid = HIGH</strong>,{' '}
          <strong>dashed = MEDIUM/LOW</strong>. Strategic bets (T-FOW) are pulled into a separate row
          below — they don&apos;t have measured ROI yet, and mixing them on the matrix would be dishonest.
        </p>
      </div>

      {/* 2×2 grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '80px 1fr 1fr',
          gridTemplateRows: '1fr 1fr 72px',
          height: 520,
          marginTop: 18,
        }}
      >
        {/* Y-axis label */}
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
              writingMode: 'vertical-rl' as const,
              transform: 'rotate(180deg)',
              fontFamily: C.MONO,
              fontSize: 9.5,
              letterSpacing: '0.16em',
              fontWeight: 700,
              color: C.GRAY_DK,
              textTransform: 'uppercase' as const,
            }}
          >
            Strategic alignment →
          </span>
        </div>

        {/* TL: High value, Low alignment */}
        <div style={{ gridColumn: 2, gridRow: 1, borderRight: 'none' }}>
          <MatrixQuadrant
            label={quadrants[0].label}
            head={quadrants[0].head}
            dots={byQ('tl')}
          />
        </div>

        {/* TR: High value, High alignment */}
        <div style={{ gridColumn: 3, gridRow: 1 }}>
          <MatrixQuadrant
            label={quadrants[1].label}
            head={quadrants[1].head}
            dots={byQ('tr')}
          />
        </div>

        {/* BL: Low value, Low alignment */}
        <div style={{ gridColumn: 2, gridRow: 2 }}>
          <MatrixQuadrant
            label={quadrants[2].label}
            head={quadrants[2].head}
            dots={byQ('bl')}
            flagCount={3}
          />
        </div>

        {/* BR: Low value, High alignment */}
        <div style={{ gridColumn: 3, gridRow: 2 }}>
          <MatrixQuadrant
            label={quadrants[3].label}
            head={quadrants[3].head}
            dots={byQ('br')}
          />
        </div>

        {/* X-axis label */}
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
              fontFamily: C.MONO,
              fontSize: 9.5,
              letterSpacing: '0.16em',
              fontWeight: 700,
              color: C.GRAY_DK,
              textTransform: 'uppercase' as const,
            }}
          >
            Realized portfolio value →
          </span>
        </div>
      </div>

      {/* T-FOW separation row */}
      <div
        style={{
          padding: '18px 32px 28px',
          borderTop: `1px dashed ${C.RULE_STRONG}`,
          background: C.CREAM_2,
          margin: '0 -32px',
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
              fontFamily: C.MONO,
              fontSize: 10,
              letterSpacing: '0.16em',
              color: C.GOLD,
              fontWeight: 700,
              textTransform: 'uppercase' as const,
            }}
          >
            Strategic bets · 3 programs · T-FOW lens
          </span>
          <span
            style={{
              fontFamily: C.MONO,
              fontSize: 9,
              letterSpacing: '0.12em',
              color: C.GRAY_DK,
              fontStyle: 'italic',
            }}
          >
            Plotted separately — attribution is too loose for the 2×2 today.
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {BROADSHEET_TFOW.map((card) => (
            <TfowCardItem key={card.name} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TfowCardItem({ card }: { card: TfowCard }) {
  return (
    <div
      style={{
        padding: '14px 16px',
        border: `1px dashed ${C.RULE_STRONG}`,
        borderRadius: 8,
        background: 'transparent',
      }}
    >
      <div
        style={{
          fontFamily: C.SERIF,
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          marginBottom: 4,
        }}
      >
        {card.name}
      </div>
      <div
        style={{
          fontFamily: C.MONO,
          fontSize: 9,
          letterSpacing: '0.12em',
          color: C.GRAY_DK,
          fontWeight: 600,
          textTransform: 'uppercase' as const,
        }}
      >
        {card.meta}
      </div>
      <p style={{ fontSize: 12.5, color: C.INK_2, lineHeight: 1.5, margin: '8px 0' }}>
        {card.desc}
      </p>
      {card.chip && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 9px',
            border: `1px dashed ${C.RULE_STRONG}`,
            borderRadius: 999,
            fontFamily: C.MONO,
            fontSize: 9,
            letterSpacing: '0.12em',
            fontWeight: 700,
            textTransform: 'uppercase' as const,
            color: card.chip.warn ? C.AMBER : C.GRAY_DK,
            cursor: 'pointer',
          }}
        >
          {card.chip.label}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Atlas right column
// ---------------------------------------------------------------------------
function AtlasColumn() {
  const [input, setInput] = useState('');
  const atlas = BROADSHEET_ATLAS;

  return (
    <aside
      style={{
        borderLeft: `1px solid ${C.RULE}`,
        background: C.CREAM_2,
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky' as const,
        top: 0,
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Head */}
      <div
        style={{
          padding: '22px 22px 14px',
          borderBottom: `1px solid ${C.RULE}`,
        }}
      >
        <div
          style={{
            fontFamily: C.MONO,
            fontSize: 10,
            letterSpacing: '0.16em',
            fontWeight: 700,
            color: C.PURPLE,
            textTransform: 'uppercase' as const,
            marginBottom: 6,
          }}
        >
          ✦ Atlas · Synthesis
        </div>
        <h3
          style={{
            fontFamily: C.SERIF,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '-0.015em',
            lineHeight: 1.25,
            marginBottom: 8,
          }}
        >
          {atlas.headline}
        </h3>
        <div
          style={{
            fontFamily: C.MONO,
            fontSize: 9,
            letterSpacing: '0.12em',
            color: C.GRAY_DK,
            fontWeight: 600,
          }}
        >
          {atlas.meta}
        </div>
      </div>

      {/* Observations */}
      <div
        style={{
          padding: '16px 22px',
          borderBottom: `1px solid ${C.RULE}`,
          flex: 1,
          overflowY: 'auto' as const,
        }}
      >
        {atlas.observations.map((obs) => (
          <ObservationBlock key={obs.label} obs={obs} />
        ))}
      </div>

      {/* Prompts + Input */}
      <div style={{ padding: '14px 18px', borderTop: `1px solid ${C.RULE}` }}>
        <div
          style={{
            fontFamily: C.MONO,
            fontSize: 9,
            letterSpacing: '0.14em',
            color: C.GRAY_DK,
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          ↳ Suggested prompts
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
          {atlas.prompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => setInput(prompt)}
              style={{
                fontSize: 12,
                padding: '8px 11px',
                border: `1px solid ${C.RULE}`,
                borderRadius: 7,
                cursor: 'pointer',
                background: C.CREAM,
                transition: 'all 150ms',
                textAlign: 'left' as const,
                lineHeight: 1.4,
                color: C.INK_2,
                fontFamily: C.SANS,
              }}
            >
              <span style={{ color: C.PURPLE, fontWeight: 700, marginRight: 5 }}>→</span>
              {prompt}
            </button>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            gap: 6,
            alignItems: 'center',
            padding: '8px 10px',
            border: `1px solid ${C.RULE_STRONG}`,
            borderRadius: 7,
            background: C.CREAM,
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Atlas about the portfolio…"
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: 12,
              fontFamily: C.SANS,
              color: C.INK,
            }}
          />
          <button
            style={{
              background: C.PURPLE,
              color: 'white',
              border: 'none',
              width: 24,
              height: 24,
              borderRadius: '50%',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ↑
          </button>
        </div>
      </div>
    </aside>
  );
}

function ObservationBlock({ obs }: { obs: AtlasObservation }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          fontFamily: C.MONO,
          fontSize: 9,
          letterSpacing: '0.15em',
          fontWeight: 700,
          color: obs.special ? C.INK : C.GOLD,
          textTransform: 'uppercase' as const,
          marginBottom: 6,
        }}
      >
        {obs.label}
      </div>
      <div
        style={{ fontSize: 13, lineHeight: 1.55, color: C.INK_2 }}
        dangerouslySetInnerHTML={{ __html: obs.body }}
      />
      {obs.action && (
        <div
          style={{
            fontFamily: C.MONO,
            fontSize: 9,
            letterSpacing: '0.12em',
            fontWeight: 700,
            color: C.PURPLE,
            marginTop: 6,
            cursor: 'pointer',
          }}
        >
          {obs.action}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main TowerIndexPage
// ---------------------------------------------------------------------------
export interface TowerIndexPageProps {
  tenantName?: string;
}

export function TowerIndexPage({ tenantName = 'Meridian Enterprises' }: TowerIndexPageProps) {
  const [activeLens, setActiveLens] = useState<LensTab>('Value');

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const timeStr = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  return (
    <AppShell surface="tower" topBarProps={{ tenantName, context: 'Tower · Portfolio Index' }}>
      {/* Broadsheet 70/30 shell — full width below global nav */}
      <div
        data-testid="tower-main-lens-canvas"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          minHeight: 'calc(100vh - 64px)',
          background: C.PAGE_BG,
        }}
      >
        {/* ── MAIN COLUMN ── */}
        <div style={{ minWidth: 0 }}>

          {/* Masthead */}
          <div
            style={{
              padding: '22px 32px 18px',
              borderBottom: `1px solid ${C.RULE_STRONG}`,
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 18,
              alignItems: 'end',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: C.MONO,
                  fontSize: 10,
                  letterSpacing: '0.2em',
                  fontWeight: 700,
                  color: C.GOLD,
                  textTransform: 'uppercase' as const,
                  marginBottom: 8,
                }}
              >
                Tower · Portfolio Index · TWR-IDX-PORTFOLIO
              </div>
              <h1
                style={{
                  fontFamily: C.SERIF,
                  fontSize: 44,
                  fontWeight: 900,
                  letterSpacing: '-0.025em',
                  lineHeight: 1,
                  marginBottom: 6,
                }}
              >
                The IT Portfolio{' '}
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 500,
                    fontStyle: 'italic',
                    color: C.GRAY_DK,
                    letterSpacing: '-0.02em',
                  }}
                >
                  — {today}
                </span>
              </h1>
              <div
                style={{
                  fontFamily: C.MONO,
                  fontSize: 10,
                  letterSpacing: '0.14em',
                  color: C.GRAY_DK,
                  fontWeight: 600,
                  textTransform: 'uppercase' as const,
                }}
              >
                {tenantName} · CFO view · {timeStr}
              </div>
            </div>

            {/* Lens tabs */}
            <nav
              aria-label="Tower lens"
              data-testid="tower-main-submenu"
              style={{ display: 'flex', gap: 4, alignItems: 'center' }}
            >
              {LENS_TABS.map((lens) => (
                <button
                  key={lens}
                  onClick={() => setActiveLens(lens)}
                  style={{
                    fontFamily: C.MONO,
                    fontSize: 9.5,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase' as const,
                    fontWeight: 700,
                    padding: '8px 14px',
                    border: `1px solid ${activeLens === lens ? C.INK : C.RULE_STRONG}`,
                    borderRadius: 999,
                    cursor: 'pointer',
                    background: activeLens === lens ? C.INK : 'transparent',
                    color: activeLens === lens ? C.CREAM_2 : C.INK_2,
                    transition: 'all 200ms',
                  }}
                >
                  {lens}
                </button>
              ))}
            </nav>
          </div>

          {/* KPI band */}
          <KpiBand kpis={BROADSHEET_KPIS} />

          {/* Pressures section */}
          <div style={{ padding: '26px 32px 14px' }}>
            <div
              style={{
                fontFamily: C.MONO,
                fontSize: 10,
                letterSpacing: '0.2em',
                fontWeight: 700,
                color: C.GOLD,
                textTransform: 'uppercase' as const,
                marginBottom: 8,
              }}
            >
              Today&apos;s pressures · 7 active · 3 demanding decisions
            </div>
            <h2
              style={{
                fontFamily: C.SERIF,
                fontSize: 30,
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                maxWidth: '32ch',
              }}
            >
              Three pressures need a CFO posture before the EA renewal closes.
            </h2>
            <p
              style={{
                fontSize: 13.5,
                color: C.GRAY_DK,
                marginTop: 8,
                maxWidth: '64ch',
                lineHeight: 1.55,
              }}
            >
              In order of decision-pressure, not magnitude. Atlas has prepared one-page synthesis for
              each — open any to see the underlying programs, evidence, and recommended Move.
            </p>
          </div>

          <div style={{ padding: '0 32px 28px' }}>
            {BROADSHEET_PRESSURES.map((row) => (
              <PressureRow key={row.id} row={row} />
            ))}
          </div>

          {/* Strategic alignment matrix */}
          <StrategicMatrix />

          {/* Footer */}
          <div
            style={{
              padding: '22px 32px 32px',
              borderTop: `1px dashed ${C.RULE}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: 24,
            }}
          >
            <div
              style={{
                fontFamily: C.MONO,
                fontSize: 9.5,
                letterSpacing: '0.14em',
                color: C.GRAY_DK,
                fontWeight: 600,
                lineHeight: 1.7,
                maxWidth: '60ch',
              }}
            >
              <strong style={{ color: C.INK }}>Tower is a decision instrument, not a dashboard.</strong>{' '}
              Every number on this page has a confidence level and an underlying calculation that&apos;s
              queryable. Underlines: solid HIGH · dashed MED · dotted LOW. Missing inputs read as
              invitations, not errors.
              <br />
              Next governance review:{' '}
              <strong style={{ color: C.INK }}>May 19 · 90-min board prep</strong>.
            </div>
            <div
              style={{
                fontFamily: C.MONO,
                fontSize: 9,
                letterSpacing: '0.13em',
                color: C.GRAY,
                fontStyle: 'italic',
                textAlign: 'right' as const,
                whiteSpace: 'nowrap' as const,
              }}
            >
              Refreshes every 6h
              <br />
              v2 confidence bands · substrate v0.9
            </div>
          </div>
        </div>

        {/* ── ATLAS COLUMN ── */}
        <AtlasColumn />
      </div>
    </AppShell>
  );
}

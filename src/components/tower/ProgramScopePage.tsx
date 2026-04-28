'use client';

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { FilterPillStrip } from '@/components/shell/FilterPillStrip';
import { SHELL } from '@/lib/shell/shell-tokens';
import { APX_CDP_SCOPE, type KPICard, type TrendPoint } from '@/lib/tower/shell-program-scope-fixture';

// ---------------------------------------------------------------------------
// KPI card
// ---------------------------------------------------------------------------

function statusDotColor(status: KPICard['status']): string {
  if (status === 'on-track') return SHELL.MINT_TEXT;
  if (status === 'at-risk') return SHELL.AMBER_DOT;
  if (status === 'off-track') return SHELL.RUST_TEXT;
  return SHELL.INK_MUTED;
}

function KpiCard({ card }: { card: KPICard }) {
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 10,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: SHELL.INK_MUTED,
          }}
        >
          {card.label}
        </span>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: statusDotColor(card.status),
            flexShrink: 0,
            display: 'inline-block',
          }}
        />
      </div>

      {/* Value + unit */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
        <span
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 24,
            fontWeight: 700,
            color: SHELL.INK,
            lineHeight: 1,
          }}
        >
          {card.value}
        </span>
        {card.unit && (
          <span
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: SHELL.INK_SOFT,
            }}
          >
            {card.unit}
          </span>
        )}
      </div>

      {/* Trend note */}
      {card.trendNote && (
        <span
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 11,
            fontStyle: 'italic',
            color: SHELL.INK_MUTED,
            marginTop: 2,
          }}
        >
          {card.trendNote}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sparkline (inline SVG)
// ---------------------------------------------------------------------------

function EvidenceSparkline({ points }: { points: TrendPoint[] }) {
  const W = 600;
  const H = 120;
  const PAD_LEFT = 40;
  const PAD_RIGHT = 20;
  const PAD_TOP = 16;
  const PAD_BOTTOM = 28;

  const plotW = W - PAD_LEFT - PAD_RIGHT;
  const plotH = H - PAD_TOP - PAD_BOTTOM;

  const minVal = 0;
  const maxVal = 100;

  function xOf(i: number): number {
    return PAD_LEFT + (i / (points.length - 1)) * plotW;
  }
  function yOf(v: number): number {
    return PAD_TOP + plotH - ((v - minVal) / (maxVal - minVal)) * plotH;
  }

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xOf(i).toFixed(1)},${yOf(p.value).toFixed(1)}`)
    .join(' ');

  const areaPath =
    linePath +
    ` L ${xOf(points.length - 1).toFixed(1)},${(PAD_TOP + plotH).toFixed(1)}` +
    ` L ${xOf(0).toFixed(1)},${(PAD_TOP + plotH).toFixed(1)} Z`;

  const lastX = xOf(points.length - 1);
  const lastY = yOf(points[points.length - 1].value);

  // Y-axis grid lines at 0, 25, 50, 75, 100
  const yGridLines = [0, 25, 50, 75, 100];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: H, display: 'block' }}
      aria-label="Evidence coverage trend"
    >
      <defs>
        <linearGradient id="evidenceAreaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={SHELL.PEACH_BG} stopOpacity="0.8" />
          <stop offset="100%" stopColor={SHELL.PEACH_BG} stopOpacity="0.15" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yGridLines.map((v) => (
        <g key={v}>
          <line
            x1={PAD_LEFT}
            y1={yOf(v)}
            x2={W - PAD_RIGHT}
            y2={yOf(v)}
            stroke={SHELL.CARD_LINE}
            strokeWidth={0.5}
            strokeDasharray="3,3"
          />
          <text
            x={PAD_LEFT - 6}
            y={yOf(v) + 4}
            textAnchor="end"
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 8,
              fill: SHELL.INK_MUTED,
            }}
          >
            {v}%
          </text>
        </g>
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#evidenceAreaFill)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke={SHELL.AMBER_DOT} strokeWidth={2} strokeLinejoin="round" />

      {/* Data points */}
      {points.map((p, i) => {
        const isLast = i === points.length - 1;
        return (
          <circle
            key={p.month}
            cx={xOf(i)}
            cy={yOf(p.value)}
            r={isLast ? 5 : 3}
            fill={isLast ? SHELL.AMBER_DOT : SHELL.CARD_WHITE}
            stroke={SHELL.AMBER_DOT}
            strokeWidth={isLast ? 0 : 1.5}
          />
        );
      })}

      {/* Current value label */}
      <text
        x={lastX + 8}
        y={lastY + 4}
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          fill: SHELL.AMBER_DOT,
          fontWeight: 600,
        }}
      >
        36%
      </text>

      {/* X axis labels */}
      {points.map((p, i) => (
        <text
          key={`label-${p.month}`}
          x={xOf(i)}
          y={H - 6}
          textAnchor="middle"
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            fill: SHELL.INK_MUTED,
          }}
        >
          {p.month}
        </text>
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Phase timeline
// ---------------------------------------------------------------------------

type PhaseStatus = 'done' | 'current' | 'pending' | 'locked';

function phaseStatusColor(status: PhaseStatus): string {
  if (status === 'done') return SHELL.MINT_TEXT;
  if (status === 'current') return SHELL.INK;
  return SHELL.INK_MUTED;
}

function phaseBorderColor(status: PhaseStatus): string {
  if (status === 'done') return SHELL.MINT_LINE;
  if (status === 'current') return SHELL.AMBER_DOT;
  return SHELL.GRAY_LINE;
}

interface PhaseRow {
  phase: string;
  status: string;
  completedDate?: string;
  startDate?: string;
  note?: string;
  estDuration?: string;
}

function PhaseTimeline({ phases }: { phases: PhaseRow[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {phases.map((p, i) => {
        const status = p.status as PhaseStatus;
        const borderColor = phaseBorderColor(status);
        const nameColor = phaseStatusColor(status);
        const rightNote = p.completedDate ?? p.estDuration ?? p.startDate ?? '';
        return (
          <div
            key={p.phase}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              height: 40,
              paddingLeft: 12,
              borderLeft: `3px solid ${borderColor}`,
              borderBottom: i < phases.length - 1 ? `1px solid ${SHELL.CARD_LINE_SOFT}` : undefined,
            }}
          >
            {/* Status indicator */}
            {status === 'done' ? (
              <span style={{ fontFamily: SHELL.MONO, fontSize: 12, color: SHELL.MINT_TEXT, flexShrink: 0 }}>✓</span>
            ) : status === 'current' ? (
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: SHELL.AMBER_DOT,
                  flexShrink: 0,
                  display: 'inline-block',
                }}
              />
            ) : (
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: SHELL.GRAY_LINE,
                  flexShrink: 0,
                  display: 'inline-block',
                }}
              />
            )}

            {/* Phase name */}
            <span
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 13,
                color: nameColor,
                fontWeight: status === 'current' ? 600 : 400,
                flex: 1,
              }}
            >
              {p.phase}
              {p.note && (
                <span
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 10,
                    color: SHELL.PEACH_TEXT,
                    marginLeft: 10,
                    letterSpacing: '0.08em',
                  }}
                >
                  · {p.note}
                </span>
              )}
            </span>

            {/* Right date/duration */}
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                color: SHELL.INK_MUTED,
                flexShrink: 0,
                textAlign: 'right',
              }}
            >
              {rightNote}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          marginBottom: 12,
        }}
      >
        {eyebrow}
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const FILTER_PILLS = [
  { key: 'overview', label: 'Overview', active: true },
  { key: 'adoption', label: 'Adoption' },
  { key: 'value', label: 'Value' },
  { key: 'cost', label: 'Cost' },
  { key: 'risk', label: 'Risk' },
  { key: 'activity', label: 'Activity' },
];

export function ProgramScopePage() {
  const scope = APX_CDP_SCOPE;

  return (
    <AppShell
      surface="tower"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Tower · APX-CDP-2026 · program scope',
      }}
      middleStrip={<FilterPillStrip pills={FILTER_PILLS} />}
    >
      <AgentColumn
        agent={{ initials: 'At', name: 'Atlas', role: 'Cross-Program Synthesizer' }}
        quote={scope.agentQuote}
        agentContext={scope.agentContext}
        actions={scope.actions}
      />

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: SHELL.PAPER,
          padding: '24px 32px',
        }}
      >
        {/* ------------------------------------------------------------------ */}
        {/* Section 1: Program header */}
        {/* ------------------------------------------------------------------ */}
        <div style={{ marginBottom: 32 }}>
          {/* Back link */}
          <Link
            href="/tower"
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: SHELL.INK_SOFT,
              textDecoration: 'none',
              display: 'inline-block',
              marginBottom: 12,
            }}
          >
            ← Control Tower
          </Link>

          {/* Eyebrow */}
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
              marginBottom: 6,
            }}
          >
            {scope.displayId} · {scope.phase} · Gate Pending
          </div>

          {/* Title */}
          <h1
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 22,
              fontWeight: 700,
              color: SHELL.INK,
              margin: '0 0 12px 0',
              lineHeight: 1.2,
            }}
          >
            {scope.programName}
          </h1>

          {/* Gate status chip + evidence bar row */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            {/* Gate chip */}
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                background: SHELL.PEACH_BG,
                color: SHELL.PEACH_TEXT,
                padding: '4px 12px',
                borderRadius: 12,
                border: `1px solid ${SHELL.PEACH_LINE}`,
                flexShrink: 0,
              }}
            >
              Design gate pending · 6 days
            </span>

            {/* Evidence bar */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 9,
                  letterSpacing: '0.12em',
                  color: SHELL.INK_MUTED,
                  marginBottom: 5,
                }}
              >
                Evidence coverage · {scope.evidenceCoverage}%
              </div>
              <div
                style={{
                  width: '100%',
                  height: 6,
                  background: SHELL.GRAY_BG,
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${scope.evidenceCoverage}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${SHELL.PEACH_BG}, ${SHELL.AMBER_DOT})`,
                    borderRadius: 3,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Section 2: KPI cards */}
        {/* ------------------------------------------------------------------ */}
        <Section eyebrow="Key metrics">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
            }}
          >
            {scope.kpis.map((card) => (
              <KpiCard key={card.label} card={card} />
            ))}
          </div>
        </Section>

        {/* ------------------------------------------------------------------ */}
        {/* Section 3: Evidence coverage trend */}
        {/* ------------------------------------------------------------------ */}
        <Section eyebrow="Evidence coverage trend">
          <div
            style={{
              background: SHELL.CARD_WHITE,
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 10,
              padding: '16px 16px 8px',
            }}
          >
            <EvidenceSparkline points={scope.evidenceTrend} />
          </div>
        </Section>

        {/* ------------------------------------------------------------------ */}
        {/* Section 4: Phase timeline */}
        {/* ------------------------------------------------------------------ */}
        <Section eyebrow="Phase timeline · 7 phases">
          <div
            style={{
              background: SHELL.CARD_WHITE,
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            <PhaseTimeline phases={scope.phaseTimeline} />
          </div>
        </Section>

        {/* ------------------------------------------------------------------ */}
        {/* Section 5: Connected pressures */}
        {/* ------------------------------------------------------------------ */}
        <Section eyebrow={`Connected pressures · ${scope.connectedPressures.length}`}>
          <div
            style={{
              background: SHELL.CARD_WHITE,
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            {scope.connectedPressures.map((pressure) => {
              const severityColor =
                pressure.severity === 'high'
                  ? SHELL.RUST_TEXT
                  : pressure.severity === 'medium'
                  ? SHELL.AMBER_DOT
                  : SHELL.MINT_TEXT;
              const severityBg =
                pressure.severity === 'high'
                  ? SHELL.RUST_BG
                  : pressure.severity === 'medium'
                  ? SHELL.PEACH_BG
                  : SHELL.MINT_BG;
              return (
                <Link
                  key={pressure.id}
                  href="/tower"
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    padding: '12px 16px',
                    borderLeft: `3px solid ${severityColor}`,
                    textDecoration: 'none',
                  }}
                >
                  <span
                    style={{
                      fontFamily: SHELL.MONO,
                      fontSize: 9,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      background: severityBg,
                      color: severityColor,
                      padding: '3px 8px',
                      borderRadius: 8,
                      flexShrink: 0,
                    }}
                  >
                    {pressure.severity}
                  </span>
                  <span
                    style={{
                      fontFamily: SHELL.SANS,
                      fontSize: 13,
                      fontWeight: 600,
                      color: SHELL.INK,
                      flexShrink: 0,
                    }}
                  >
                    {pressure.title}
                  </span>
                  <span
                    style={{
                      fontFamily: SHELL.SANS,
                      fontSize: 12,
                      color: SHELL.INK_SOFT,
                      flex: 1,
                    }}
                  >
                    · {pressure.relevance}
                  </span>
                  <span
                    style={{
                      fontFamily: SHELL.MONO,
                      fontSize: 10,
                      color: SHELL.INK_MUTED,
                      flexShrink: 0,
                    }}
                  >
                    →
                  </span>
                </Link>
              );
            })}
          </div>
        </Section>

        {/* ------------------------------------------------------------------ */}
        {/* Section 6: Activity log */}
        {/* ------------------------------------------------------------------ */}
        <Section eyebrow="Activity log · 5 events">
          <div
            style={{
              background: SHELL.CARD_WHITE,
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            {scope.activityLog.map((entry, i) => {
              const actorInitials =
                entry.actor === 'Nexus' ? 'Nx' : entry.actor === 'Steward' ? 'St' : 'Sn';
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    height: 44,
                    padding: '0 16px',
                    borderBottom:
                      i < scope.activityLog.length - 1
                        ? `1px solid ${SHELL.CARD_LINE_SOFT}`
                        : undefined,
                  }}
                >
                  {/* Timestamp */}
                  <span
                    style={{
                      fontFamily: SHELL.MONO,
                      fontSize: 9,
                      color: SHELL.INK_MUTED,
                      flexShrink: 0,
                      minWidth: 60,
                    }}
                  >
                    {entry.timestamp}
                  </span>

                  {/* Actor glyph */}
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: SHELL.BLUE_BG,
                      border: `1px solid ${SHELL.BLUE_LINE}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: SHELL.MONO,
                        fontSize: 7,
                        fontWeight: 700,
                        color: SHELL.INK_MID,
                        lineHeight: 1,
                        letterSpacing: '0.02em',
                      }}
                    >
                      {actorInitials}
                    </span>
                  </div>

                  {/* Event text */}
                  <span
                    style={{
                      fontFamily: SHELL.SANS,
                      fontSize: 12,
                      color: SHELL.INK,
                      flex: 1,
                    }}
                  >
                    {entry.event}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
      </div>
    </AppShell>
  );
}

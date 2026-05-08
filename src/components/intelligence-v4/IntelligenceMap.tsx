'use client';

// IntelligenceMap · v1.1 corpus surface
// Translates docs/training/intelligence-map-wireframe.html — a 2D
// landscape (lifecycle × value-leverage) of every Use Case for the
// active tenant's industry, with engagement state encoded as color.

import { useState } from 'react';
import Link from 'next/link';
import type { MapData, MapNode } from '@/lib/knowledge-corpus/types';

const F_DISPLAY = 'var(--font-fraunces), Georgia, serif';
const F_BODY = 'var(--font-inter), -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const F_MONO = 'var(--font-jetbrains-mono), ui-monospace, "SF Mono", Menlo, monospace';

const C = {
  ink: '#0A0C12',
  body: '#1F2433',
  muted: '#3D4454',
  faint: '#6B7280',
  navy: '#1B2B5C',
  navySoft: 'rgba(27,43,92,0.06)',
  navyLine: 'rgba(27,43,92,0.15)',
  teal: '#0E8A65',
  tealSoft: 'rgba(14,138,101,0.09)',
  tealLine: 'rgba(14,138,101,0.25)',
  amber: '#92400E',
  amberSoft: 'rgba(146,64,14,0.08)',
  amberLine: 'rgba(146,64,14,0.25)',
  red: '#991B1B',
  redLine: 'rgba(153,27,27,0.25)',
  borderLight: '#E5E7EB',
  surface: '#FFFFFF',
  surface2: '#FBFAF7',
  surface3: '#F5F3EE',
};

interface Props {
  data: MapData;
}

const SVG_W = 760;
const SVG_H = 480;
const PAD_L = 60;
const PAD_R = 30;
const PAD_T = 40;
const PAD_B = 50;
const PLOT_W = SVG_W - PAD_L - PAD_R;
const PLOT_H = SVG_H - PAD_T - PAD_B;

function nodeX(node: MapNode): number {
  return PAD_L + (node.x / 100) * PLOT_W;
}
function nodeY(node: MapNode): number {
  // Y axis: 0 = very high (top), 100 = low (bottom)
  return PAD_T + (node.y / 100) * PLOT_H;
}

function nodeFill(node: MapNode): { fill: string; stroke?: string; opacity: number } {
  switch (node.engagementState) {
    case 'in_flight':
      return { fill: C.teal, opacity: 0.85 };
    case 'at_risk':
      return { fill: C.amber, opacity: 0.85 };
    case 'scaled':
      return { fill: C.navy, opacity: 0.9 };
    case 'failed':
      return { fill: C.surface, stroke: C.red, opacity: 1 };
    case 'not_started':
    default:
      return { fill: C.surface, stroke: C.navy, opacity: 1 };
  }
}

export function IntelligenceMap({ data }: Props) {
  const [selectedId, setSelectedId] = useState<string>(data.defaultSelectedId);
  const selected = data.nodes.find((n) => n.useCase.id === selectedId) ?? data.nodes[0];

  return (
    <div style={{ background: C.surface2, fontFamily: F_BODY, color: C.body, minHeight: '100%' }}>
      {/* Masthead */}
      <header style={{ background: C.surface, borderBottom: `1px solid ${C.borderLight}`, padding: '28px 64px 22px' }}>
        <div style={{ fontFamily: F_MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.faint, marginBottom: 6 }}>
          INTELLIGENCE · <span style={{ color: C.ink }}>WHERE YOU ARE IN THE UNIVERSE OF AI BETS</span>
        </div>
        <h1
          style={{
            fontFamily: F_DISPLAY,
            fontSize: 32,
            fontWeight: 400,
            color: C.ink,
            letterSpacing: '-0.012em',
            lineHeight: 1.05,
            margin: '0 0 6px 0',
          }}
        >
          The {data.industry === 'healthcare' ? 'healthcare' : data.industry} AI landscape — and where {data.tenantName} sits in it.
        </h1>
        <p style={{ fontSize: 14, color: C.muted, marginBottom: 14, maxWidth: '80ch' }}>
          {data.totalUseCases} use cases canonicalized. Position is lifecycle stage × value-leverage at your scale. Color is your engagement. Lines connect bets that succeed (or fail) together.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <Pill bg={`${data.tenantBrandColor}14`} fg={data.tenantBrandColor} border={`${data.tenantBrandColor}33`}>
            Industry: {data.industry === 'healthcare' ? 'Healthcare IDN' : data.industry}
          </Pill>
          <Pill>{data.totalUseCases} use cases canonical</Pill>
          <Pill bg={C.tealSoft} fg={C.teal} border={C.tealLine}>{data.inFlightCount} in flight</Pill>
          {data.atRiskCount > 0 && (
            <Pill bg={C.amberSoft} fg={C.amber} border={C.amberLine}>{data.atRiskCount} at risk</Pill>
          )}
          <Pill>{data.candidateCount} candidate bets</Pill>
          <Pill muted>Refreshed {data.refreshedLabel}</Pill>
        </div>
      </header>

      {/* What changed ticker */}
      <div
        style={{
          background: C.ink,
          color: 'rgba(255,255,255,0.85)',
          padding: '10px 64px',
          fontFamily: F_MONO,
          fontSize: 11,
          letterSpacing: '0.04em',
          display: 'flex',
          gap: 32,
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          What changed
        </span>
        {data.whatChanged.map((c) => (
          <span key={c.entityId}>
            · <span style={{ color: '#7BA8FF', fontWeight: 600 }}>{c.entityId}</span> ·{' '}
            <span style={{ color: '#fff' }}>{c.summary}</span>{' '}
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>[{c.source}]</span>
          </span>
        ))}
      </div>

      {/* Body: map left, panel right */}
      <main style={{ padding: '28px 36px 40px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28 }}>
        {/* Map card */}
        <div style={{ border: `1px solid ${C.borderLight}`, background: C.surface, borderRadius: 10, overflow: 'hidden' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 22px',
              borderBottom: `1px solid ${C.borderLight}`,
              background: '#FAFAF7',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ fontFamily: F_MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.faint }}>
              Landscape · click any node for the brief
            </div>
            <div style={{ display: 'flex', gap: 14, fontFamily: F_MONO, fontSize: 10, letterSpacing: '0.06em', color: C.faint, alignItems: 'center' }}>
              <LegendDot color={C.teal} label="In flight" />
              <LegendDot color={C.amber} label="At risk" />
              <LegendDot color={C.surface} stroke={C.navy} label="Candidate" />
              <LegendDot color={C.surface} stroke={C.red} label="Retired" />
            </div>
          </div>
          <div style={{ padding: '8px 12px 14px' }}>
            <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
              {/* Grid lines */}
              {[PAD_L, PAD_L + PLOT_W * 0.25, PAD_L + PLOT_W * 0.5, PAD_L + PLOT_W * 0.75, PAD_L + PLOT_W].map((x) => (
                <line key={`vx-${x}`} x1={x} y1={PAD_T} x2={x} y2={PAD_T + PLOT_H} stroke={C.borderLight} strokeWidth={1} strokeDasharray="2 4" />
              ))}
              {[PAD_T, PAD_T + PLOT_H * 0.33, PAD_T + PLOT_H * 0.66, PAD_T + PLOT_H].map((y) => (
                <line key={`hy-${y}`} x1={PAD_L} y1={y} x2={PAD_L + PLOT_W} y2={y} stroke={C.borderLight} strokeWidth={1} strokeDasharray="2 4" />
              ))}

              {/* Axis labels */}
              <text x={PAD_L + PLOT_W / 2} y={SVG_H - 15} fontFamily={F_MONO} fontSize={9.5} fill={C.faint} letterSpacing="0.14em" textAnchor="middle" fontWeight={700}>
                LIFECYCLE STAGE →
              </text>
              <text
                transform={`rotate(-90,18,${PAD_T + PLOT_H / 2})`}
                x={18}
                y={PAD_T + PLOT_H / 2}
                fontFamily={F_MONO}
                fontSize={9.5}
                fill={C.faint}
                letterSpacing="0.14em"
                textAnchor="middle"
                fontWeight={700}
              >
                VALUE-LEVERAGE →
              </text>

              {/* X tick labels */}
              {['EMERGING', 'SCALING', 'MATURE', 'DECLINING'].map((label, i) => (
                <text
                  key={label}
                  x={PAD_L + PLOT_W * (0.125 + i * 0.25)}
                  y={SVG_H - 32}
                  fontFamily={F_MONO}
                  fontSize={9}
                  fill={C.faint}
                  letterSpacing="0.06em"
                  textAnchor="middle"
                >
                  {label}
                </text>
              ))}

              {/* Y tick labels */}
              {[
                { y: PAD_T + 8, label: 'VERY HIGH' },
                { y: PAD_T + PLOT_H * 0.33 + 8, label: 'HIGH' },
                { y: PAD_T + PLOT_H * 0.66 + 8, label: 'MID' },
                { y: PAD_T + PLOT_H + 8, label: 'LOW' },
              ].map((t) => (
                <text key={t.label} x={PAD_L - 14} y={t.y} fontFamily={F_MONO} fontSize={9} fill={C.faint} letterSpacing="0.06em" textAnchor="end">
                  {t.label}
                </text>
              ))}

              {/* Edges */}
              {data.edges.map((e, i) => {
                const a = data.nodes.find((n) => n.useCase.id === e.fromUseCaseId);
                const b = data.nodes.find((n) => n.useCase.id === e.toUseCaseId);
                if (!a || !b) return null;
                const ax = nodeX(a);
                const ay = nodeY(a);
                const bx = nodeX(b);
                const by = nodeY(b);
                return (
                  <path
                    key={`e-${i}`}
                    d={`M ${ax} ${ay} Q ${(ax + bx) / 2} ${Math.min(ay, by) - 18} ${bx} ${by}`}
                    stroke="rgba(27,43,92,0.10)"
                    strokeWidth={1}
                    fill="none"
                  />
                );
              })}

              {/* Selection halo */}
              {selected && (() => {
                const cx = nodeX(selected);
                const cy = nodeY(selected);
                return (
                  <circle cx={cx} cy={cy} r={selected.r + 10} fill="none" stroke={C.navy} strokeWidth={1} strokeDasharray="3 3" opacity={0.6} />
                );
              })()}

              {/* Nodes */}
              {data.nodes.map((node) => {
                const cx = nodeX(node);
                const cy = nodeY(node);
                const fill = nodeFill(node);
                return (
                  <g
                    key={node.useCase.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedId(node.useCase.id)}
                    onMouseEnter={() => setSelectedId(node.useCase.id)}
                  >
                    <circle
                      cx={cx}
                      cy={cy}
                      r={node.r}
                      fill={fill.fill}
                      stroke={fill.stroke}
                      strokeWidth={fill.stroke ? 2.5 : 0}
                      opacity={fill.opacity}
                    />
                    {node.r >= 14 && (
                      <text
                        x={cx}
                        y={cy + node.r + 14}
                        fontFamily={F_BODY}
                        fontSize={9.5}
                        fill={node.engagementState === 'failed' ? C.faint : C.ink}
                        textAnchor="middle"
                        fontWeight={node.engagementState === 'in_flight' || node.engagementState === 'at_risk' ? 600 : 500}
                      >
                        {truncate(node.useCase.name, 22)}
                      </text>
                    )}
                    {node.r >= 14 && (
                      <text x={cx} y={cy + node.r + 24} fontFamily={F_MONO} fontSize={8} fill={C.faint} textAnchor="middle">
                        {node.useCase.id}
                        {node.initiativeDisplayId && ` · ${node.initiativeDisplayId}`}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right detail panel */}
        <aside style={{ display: 'grid', gap: 14 }}>
          {selected && <DetailCard node={selected} />}
        </aside>
      </main>
    </div>
  );
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + '…';
}

function DetailCard({ node }: { node: MapNode }) {
  const uc = node.useCase;
  const valueRange =
    uc.businessValueRanges.perCompanySize.mid ??
    uc.businessValueRanges.perCompanySize.large ??
    uc.businessValueRanges.perCompanySize.small ??
    '—';
  const stateLabel =
    node.engagementState === 'in_flight' ? 'IN PORTFOLIO' :
    node.engagementState === 'at_risk' ? 'AT RISK' :
    node.engagementState === 'failed' ? 'RETIRED' :
    'CANDIDATE';
  return (
    <div style={{ border: `1px solid ${C.borderLight}`, background: C.surface, borderRadius: 10, padding: 18 }}>
      <span
        style={{
          display: 'block',
          fontFamily: F_MONO,
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: '0.16em',
          color: node.engagementState === 'in_flight' ? C.teal : node.engagementState === 'at_risk' ? C.amber : C.navy,
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        {uc.id} · {stateLabel}
        {node.initiativeDisplayId && ` · ${node.initiativeDisplayId}`}
      </span>
      <h3 style={{ fontFamily: F_DISPLAY, fontSize: 18, fontWeight: 500, color: C.ink, letterSpacing: '-0.005em', marginBottom: 8 }}>
        {uc.name}
      </h3>
      <p style={{ fontSize: 13, color: C.body, lineHeight: 1.55, marginBottom: 10 }}>{uc.problemStatement}</p>

      <Row k="Lifecycle" v={`${uc.lifecycleStage}${uc.provenance.primarySources[0] ? ` · [per ${uc.provenance.primarySources[0].source}]` : ''}`} />
      <Row k="Value · IDN scale" v={`${valueRange}`} />
      <Row k="Time to value" v={`${uc.businessValueRanges.timeToValueMonths} months`} />

      {uc.successPatterns.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <BlockMini>Binding success patterns</BlockMini>
          {uc.successPatterns.map((p) => (
            <span key={p.patternId} style={chipStyle(C.navy, C.navyLine, C.surface)}>
              {p.patternId}
            </span>
          ))}
        </div>
      )}

      {uc.antiPatterns && uc.antiPatterns.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <BlockMini>Top failure modes</BlockMini>
          {uc.antiPatterns.map((ap) => (
            <span key={ap.apId} style={chipStyle(C.amber, C.amberLine, C.amberSoft)}>
              {ap.apId}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        <Link
          href="/intelligence/brief"
          style={{
            fontFamily: F_MONO,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '8px 12px',
            borderRadius: 4,
            textDecoration: 'none',
            background: C.ink,
            color: C.surface,
            border: `1px solid ${C.ink}`,
          }}
        >
          Open in Brief
        </Link>
        <Link
          href="/strategic-moves"
          style={{
            fontFamily: F_MONO,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '8px 12px',
            borderRadius: 4,
            textDecoration: 'none',
            background: C.surface,
            color: C.ink,
            border: `1px solid ${C.ink}`,
          }}
        >
          Shape as Move
        </Link>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: '6px 0',
        borderBottom: `1px solid ${C.borderLight}`,
        fontSize: 12.5,
      }}
    >
      <span style={{ fontFamily: F_MONO, fontSize: 9.5, letterSpacing: '0.1em', color: C.faint, textTransform: 'uppercase' }}>{k}</span>
      <span style={{ color: C.ink, fontWeight: 500, textAlign: 'right' }}>{v}</span>
    </div>
  );
}

function BlockMini({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: F_MONO, fontSize: 9.5, letterSpacing: '0.1em', color: C.faint, textTransform: 'uppercase', marginBottom: 6 }}>
      {children}
    </div>
  );
}

function chipStyle(fg: string, border: string, bg: string): React.CSSProperties {
  return {
    fontFamily: F_MONO,
    fontSize: 9.5,
    color: fg,
    padding: '1px 6px',
    border: `1px solid ${border}`,
    borderRadius: 3,
    marginRight: 4,
    marginBottom: 4,
    display: 'inline-block',
    background: bg,
  };
}

function Pill({ children, bg, fg, border, muted }: { children: React.ReactNode; bg?: string; fg?: string; border?: string; muted?: boolean }) {
  return (
    <span
      style={{
        fontFamily: F_MONO,
        fontSize: 9.5,
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding: '4px 9px',
        borderRadius: 3,
        border: `1px solid ${muted ? C.borderLight : (border ?? C.navyLine)}`,
        color: muted ? C.faint : (fg ?? C.navy),
        background: muted ? 'transparent' : (bg ?? C.surface),
      }}
    >
      {children}
    </span>
  );
}

function LegendDot({ color, stroke, label }: { color: string; stroke?: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          display: 'inline-block',
          width: stroke ? 7 : 9,
          height: stroke ? 7 : 9,
          borderRadius: '50%',
          background: color,
          border: stroke ? `2px solid ${stroke}` : undefined,
        }}
      />
      {label}
    </span>
  );
}

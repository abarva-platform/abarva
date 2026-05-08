'use client';

// IntelligenceMap · v1.1 corpus surface
// Translates docs/training/intelligence-map-wireframe.html — a 2D
// landscape (lifecycle × value-leverage) of every Use Case for the
// active tenant's industry, with engagement state encoded as color.

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { SentinelChat } from '@/components/intelligence-v3/SentinelChat';
import type { ChatMessage } from '@/components/intelligence-v3/types';
import type {
  EngagementState,
  LifecycleStage,
  MapData,
  MapNode,
  Office,
} from '@/lib/knowledge-corpus/types';

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
  /**
   * Tenant key forwarded to the Sentinel surfaceContext so the upload
   * route can scope attachments to the active client. Optional · falls
   * back to data.tenantName when omitted.
   */
  activeClient?: string;
}

const SVG_W = 760;
const SVG_H = 480;
const PAD_L = 78; // bumped so "VERY HIGH" tick label doesn't clip
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

type MapView = 'landscape' | 'kanban' | 'heatmap' | 'list';
type EngagementFilter = EngagementState | 'all';

const VIEW_OPTIONS: ReadonlyArray<{ key: MapView; label: string }> = [
  { key: 'landscape', label: 'Landscape' },
  { key: 'kanban', label: 'Kanban' },
  { key: 'heatmap', label: 'Heatmap' },
  { key: 'list', label: 'List' },
];

const ENGAGEMENT_FILTERS: ReadonlyArray<{ key: EngagementFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'in_flight', label: 'In flight' },
  { key: 'at_risk', label: 'At risk' },
  { key: 'not_started', label: 'Candidate' },
  { key: 'failed', label: 'Retired' },
  { key: 'scaled', label: 'Scaled' },
];

export function IntelligenceMap({ data, activeClient }: Props) {
  const [selectedId, setSelectedId] = useState<string>(data.defaultSelectedId);
  // Kanban is the default · the scatter chart has structural label
  // overlap when many bubbles cluster in the same value/lifecycle
  // region. Landscape stays available via the view toggle for the
  // visual-scan use case.
  const [view, setView] = useState<MapView>('kanban');
  const [engagement, setEngagement] = useState<EngagementFilter>('all');

  const visibleNodes = useMemo(() => {
    if (engagement === 'all') return data.nodes;
    return data.nodes.filter((n) => n.engagementState === engagement);
  }, [data.nodes, engagement]);

  const selected =
    visibleNodes.find((n) => n.useCase.id === selectedId) ?? visibleNodes[0] ?? data.nodes[0];

  return (
    <div style={{ background: C.surface, fontFamily: F_BODY, color: C.body, minHeight: '100%' }}>
      {/* What changed · top 3 only · compact treatment · pinned above the grid */}
      <div
        style={{
          background: C.ink,
          color: 'rgba(255,255,255,0.88)',
          padding: '10px 64px',
          fontFamily: F_BODY,
          fontSize: 12,
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          gap: 24,
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontFamily: F_MONO,
            fontSize: 9.5,
            color: 'rgba(255,255,255,0.5)',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          ⚡ Last 7 days
        </span>
        <ul
          style={{
            display: 'flex',
            gap: 28,
            margin: 0,
            padding: 0,
            listStyle: 'none',
            overflow: 'hidden',
          }}
        >
          {data.whatChanged.slice(0, 3).map((c) => (
            <li
              key={c.entityId}
              style={{
                display: 'inline-flex',
                gap: 8,
                alignItems: 'baseline',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <span
                style={{
                  fontFamily: F_MONO,
                  fontSize: 10,
                  color: '#7BA8FF',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}
              >
                {c.entityId}
              </span>
              <span style={{ color: '#fff' }}>{c.summary}</span>
            </li>
          ))}
        </ul>
        {data.whatChanged.length > 3 && (
          <span
            style={{
              fontFamily: F_MONO,
              fontSize: 9.5,
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            +{data.whatChanged.length - 3} more →
          </span>
        )}
      </div>

      {/* Body · the Sentinel chat dock owns the splitter; the workspace
          (right pane) hosts the masthead, toolbar, view, and detail. */}
      <div style={{ height: 'calc(100vh - 112px - 36px)', minHeight: 0 }}>
        <SentinelChat
          scopeLabel={`${data.tenantName} · The Map`}
          opener={mapSentinelOpener(data, selected)}
          conversation={MAP_SENTINEL_CONVERSATION}
          surfaceContext={{
            activeTab: 'map',
            activeClient: activeClient ?? data.tenantName,
          }}
          workspace={
        <main style={{ padding: '24px 36px 80px', display: 'grid', gap: 18, gridTemplateColumns: '1fr', minWidth: 0, overflowY: 'auto' }}>
          {/* Compact masthead — eyebrow + 1-line title + pills inline */}
          <div>
            <div
              style={{
                fontFamily: F_MONO,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: C.faint,
                marginBottom: 6,
              }}
            >
              INTELLIGENCE · <span style={{ color: C.ink }}>THE MAP</span>
            </div>
            <h1
              style={{
                fontFamily: F_DISPLAY,
                fontSize: 26,
                fontWeight: 400,
                color: C.ink,
                letterSpacing: '-0.014em',
                lineHeight: 1.15,
                margin: '0 0 10px 0',
                maxWidth: '52ch',
              }}
            >
              The {data.industry === 'healthcare' ? 'healthcare' : data.industry} AI landscape — where {data.tenantName} sits in it.
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <Pill bg={`${data.tenantBrandColor}14`} fg={data.tenantBrandColor} border={`${data.tenantBrandColor}33`}>
                {data.industry === 'healthcare' ? 'Healthcare IDN' : data.industry}
              </Pill>
              <Pill>{data.totalUseCases} use cases</Pill>
              <Pill bg={C.tealSoft} fg={C.teal} border={C.tealLine}>{data.inFlightCount} in flight</Pill>
              {data.atRiskCount > 0 && (
                <Pill bg={C.amberSoft} fg={C.amber} border={C.amberLine}>{data.atRiskCount} at risk</Pill>
              )}
              <Pill>{data.candidateCount} candidate</Pill>
            </div>
          </div>
        {/* Toolbar · filter chips left · view toggle right */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span
              style={{
                fontFamily: F_MONO,
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: '0.16em',
                color: C.faint,
                textTransform: 'uppercase',
                marginRight: 4,
              }}
            >
              Filter
            </span>
            {ENGAGEMENT_FILTERS.map((f) => {
              const isActive = engagement === f.key;
              const count = f.key === 'all'
                ? data.nodes.length
                : data.nodes.filter((n) => n.engagementState === f.key).length;
              if (count === 0 && f.key !== 'all') return null;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setEngagement(f.key)}
                  style={{
                    fontFamily: F_MONO,
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    padding: '4px 10px',
                    borderRadius: 4,
                    border: `1px solid ${isActive ? C.ink : C.borderLight}`,
                    background: isActive ? C.ink : C.surface,
                    color: isActive ? C.surface : C.body,
                    cursor: 'pointer',
                  }}
                >
                  {f.label} <span style={{ opacity: 0.6, marginLeft: 3 }}>{count}</span>
                </button>
              );
            })}
          </div>
          <div
            style={{
              display: 'inline-flex',
              gap: 0,
              border: `1px solid ${C.borderLight}`,
              borderRadius: 8,
              padding: 3,
              background: '#FAFAF7',
              alignItems: 'center',
            }}
          >
            {VIEW_OPTIONS.map((v) => {
              const isActive = view === v.key;
              return (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => setView(v.key)}
                  style={{
                    fontFamily: F_MONO,
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    padding: '6px 11px',
                    borderRadius: 5,
                    border: 0,
                    background: isActive ? C.ink : 'transparent',
                    color: isActive ? C.surface : C.muted,
                    cursor: 'pointer',
                  }}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* View body · conditional on `view` */}
        {view === 'landscape' && (
        <div style={{ border: `1px solid ${C.borderLight}`, background: C.surface, borderRadius: 10, overflow: 'hidden' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 22px',
              borderBottom: `1px solid ${C.borderLight}`,
              background: '#FAFAF7',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ fontFamily: F_MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.faint }}>
              {visibleNodes.length} of {data.nodes.length} bets · click any node for the brief
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

              {/* Nodes · filtered by engagement */}
              {visibleNodes.map((node) => {
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
                    {/* Native browser tooltip on hover · always-on. */}
                    <title>
                      {node.useCase.name} · {node.useCase.id}
                      {node.initiativeDisplayId ? ` · ${node.initiativeDisplayId}` : ''}
                    </title>
                    {/* Only the SELECTED bubble shows a full name label.
                        Big bubbles (r >= 16) get a small ID below; smaller
                        ones rely on the tooltip + the inline detail card. */}
                    {selected?.useCase.id === node.useCase.id ? (
                      <>
                        <text
                          x={cx}
                          y={cy + node.r + 16}
                          fontFamily={F_BODY}
                          fontSize={11}
                          fill={C.ink}
                          textAnchor="middle"
                          fontWeight={600}
                        >
                          {truncate(node.useCase.name, 28)}
                        </text>
                        <text
                          x={cx}
                          y={cy + node.r + 28}
                          fontFamily={F_MONO}
                          fontSize={9}
                          fill={C.faint}
                          textAnchor="middle"
                          letterSpacing="0.04em"
                        >
                          {node.useCase.id}
                          {node.initiativeDisplayId && ` · ${node.initiativeDisplayId}`}
                        </text>
                      </>
                    ) : node.r >= 16 ? (
                      <text
                        x={cx}
                        y={cy + node.r + 13}
                        fontFamily={F_MONO}
                        fontSize={8}
                        fill={C.faint}
                        textAnchor="middle"
                        letterSpacing="0.04em"
                      >
                        {node.useCase.id.replace(/^UC-HC-/, '')}
                        {node.initiativeDisplayId && ` · ${node.initiativeDisplayId}`}
                      </text>
                    ) : null}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
        )}

        {view === 'kanban' && (
          <KanbanView nodes={visibleNodes} onSelect={setSelectedId} selectedId={selected?.useCase.id} />
        )}
        {view === 'heatmap' && (
          <HeatmapView nodes={visibleNodes} onSelect={setSelectedId} />
        )}
        {view === 'list' && (
          <ListView nodes={visibleNodes} onSelect={setSelectedId} selectedId={selected?.useCase.id} />
        )}

          {/* Selected node detail — inline below the chart */}
          {selected && <DetailCard node={selected} />}
        </main>
          }
        />
      </div>
    </div>
  );
}

const MAP_SENTINEL_CONVERSATION: ReadonlyArray<ChatMessage> = [];

function mapSentinelOpener(data: MapData, selected: MapNode | undefined): string {
  if (selected) {
    return `Looking at ${selected.useCase.name} (${selected.useCase.id}). Lifecycle ${selected.useCase.lifecycleStage} · engagement ${selected.engagementState.replace('_', ' ')}. Ask me about cascade dependencies, evidence, or how this connects to the rest of your portfolio.`;
  }
  return `${data.totalUseCases} use cases on the landscape · ${data.inFlightCount} in flight · ${data.atRiskCount} at risk · ${data.candidateCount} candidate. Click any node to see how it fits — or ask me what's worth shaping into a Move next.`;
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

// ─── Kanban view · columns by engagement state ────────────────────

const KANBAN_COLUMNS: ReadonlyArray<{
  state: EngagementState;
  label: string;
  accent: string;
}> = [
  { state: 'in_flight', label: 'In flight', accent: C.teal },
  { state: 'at_risk', label: 'At risk', accent: C.amber },
  { state: 'not_started', label: 'Candidate', accent: C.navy },
  { state: 'failed', label: 'Retired', accent: C.red },
];

function KanbanView({
  nodes,
  selectedId,
  onSelect,
}: {
  nodes: ReadonlyArray<MapNode>;
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const visibleColumns = KANBAN_COLUMNS.filter((col) =>
    nodes.some((n) => n.engagementState === col.state),
  );
  const columnsToShow = visibleColumns.length > 0 ? visibleColumns : KANBAN_COLUMNS.slice(0, 3);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columnsToShow.length}, 1fr)`,
        gap: 10,
      }}
    >
      {columnsToShow.map((col) => {
        const colNodes = nodes.filter((n) => n.engagementState === col.state);
        return (
          <div
            key={col.state}
            style={{
              background: C.surface,
              border: `1px solid ${C.borderLight}`,
              borderTop: `3px solid ${col.accent}`,
              borderRadius: 8,
              minHeight: 360,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '10px 14px',
                borderBottom: `1px solid ${C.borderLight}`,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span
                aria-hidden="true"
                style={{ width: 8, height: 8, borderRadius: '50%', background: col.accent }}
              />
              <span
                style={{
                  fontFamily: F_MONO,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: col.accent,
                }}
              >
                {col.label}
              </span>
              <span
                style={{
                  fontFamily: F_MONO,
                  fontSize: 10,
                  color: C.faint,
                  marginLeft: 'auto',
                }}
              >
                {colNodes.length}
              </span>
            </div>
            <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              {colNodes.length === 0 ? (
                <div
                  style={{
                    fontFamily: F_MONO,
                    fontSize: 10,
                    color: C.faint,
                    letterSpacing: '0.06em',
                    textAlign: 'center',
                    padding: 16,
                    border: `1px dashed ${C.borderLight}`,
                    borderRadius: 6,
                  }}
                >
                  — empty —
                </div>
              ) : (
                colNodes.map((node) => (
                  <KanbanCard
                    key={node.useCase.id}
                    node={node}
                    accent={col.accent}
                    isSelected={node.useCase.id === selectedId}
                    onSelect={onSelect}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({
  node,
  accent,
  isSelected,
  onSelect,
}: {
  node: MapNode;
  accent: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const valueRange =
    node.useCase.businessValueRanges.perCompanySize.mid ??
    node.useCase.businessValueRanges.perCompanySize.large ??
    '—';
  return (
    <button
      type="button"
      onClick={() => onSelect(node.useCase.id)}
      style={{
        textAlign: 'left',
        background: isSelected ? `${accent}10` : C.surface,
        border: `1px solid ${isSelected ? accent : C.borderLight}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 6,
        padding: '10px 12px',
        cursor: 'pointer',
        fontFamily: F_BODY,
        color: 'inherit',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 4, lineHeight: 1.25 }}>
        {node.useCase.name}
      </div>
      <div
        style={{
          fontFamily: F_MONO,
          fontSize: 9,
          color: C.faint,
          letterSpacing: '0.04em',
          marginBottom: 6,
        }}
      >
        {node.useCase.id}
        {node.initiativeDisplayId && ` · ${node.initiativeDisplayId}`}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, fontSize: 11, color: C.muted }}>
        <span>{lifecycleLabel(node.useCase.lifecycleStage)}</span>
        <span style={{ color: C.ink, fontWeight: 600 }}>{valueRange}</span>
      </div>
    </button>
  );
}

function lifecycleLabel(s: LifecycleStage): string {
  if (s === 'emerging') return 'Emerging';
  if (s === 'scaling') return 'Scaling';
  if (s === 'mature') return 'Mature';
  return 'Declining';
}

// ─── Heatmap view · function rows × lifecycle cols ────────────────

const HEATMAP_OFFICES: ReadonlyArray<{ key: Office; label: string }> = [
  { key: 'front', label: 'Front office' },
  { key: 'middle', label: 'Middle office' },
  { key: 'back', label: 'Back office' },
];

const HEATMAP_STAGES: ReadonlyArray<{ key: LifecycleStage; label: string }> = [
  { key: 'emerging', label: 'Emerging' },
  { key: 'scaling', label: 'Scaling' },
  { key: 'mature', label: 'Mature' },
  { key: 'declining', label: 'Declining' },
];

function HeatmapView({
  nodes,
  onSelect,
}: {
  nodes: ReadonlyArray<MapNode>;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.borderLight}`,
        borderRadius: 10,
        padding: 18,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `160px repeat(${HEATMAP_STAGES.length}, 1fr)`,
          gap: 4,
          marginBottom: 4,
        }}
      >
        <div />
        {HEATMAP_STAGES.map((s) => (
          <div
            key={s.key}
            style={{
              fontFamily: F_MONO,
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: '0.14em',
              color: C.faint,
              textTransform: 'uppercase',
              textAlign: 'center',
              padding: '6px 0',
            }}
          >
            {s.label}
          </div>
        ))}
      </div>
      {HEATMAP_OFFICES.map((office) => (
        <div
          key={office.key}
          style={{
            display: 'grid',
            gridTemplateColumns: `160px repeat(${HEATMAP_STAGES.length}, 1fr)`,
            gap: 4,
            marginBottom: 4,
          }}
        >
          <div
            style={{
              fontFamily: F_BODY,
              fontSize: 12,
              fontWeight: 600,
              color: C.ink,
              padding: '8px 0',
              alignSelf: 'center',
            }}
          >
            {office.label}
          </div>
          {HEATMAP_STAGES.map((stage) => {
            const cellNodes = nodes.filter(
              (n) => n.useCase.office === office.key && n.useCase.lifecycleStage === stage.key,
            );
            return (
              <HeatmapCell
                key={stage.key}
                nodes={cellNodes}
                onSelect={onSelect}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function HeatmapCell({
  nodes,
  onSelect,
}: {
  nodes: ReadonlyArray<MapNode>;
  onSelect: (id: string) => void;
}) {
  const inFlight = nodes.filter((n) => n.engagementState === 'in_flight').length;
  const atRisk = nodes.filter((n) => n.engagementState === 'at_risk').length;
  const total = nodes.length;
  const intensity = total === 0 ? 0 : Math.min(1, total / 4);
  const baseColor =
    inFlight > 0 ? C.teal : atRisk > 0 ? C.amber : total > 0 ? C.navy : 'transparent';
  return (
    <div
      style={{
        background: total === 0 ? 'rgba(0,0,0,0.02)' : `${baseColor}${Math.round(20 + intensity * 60).toString(16).padStart(2, '0')}`,
        border: total === 0 ? `1px dashed ${C.borderLight}` : `1px solid ${baseColor}40`,
        borderRadius: 6,
        minHeight: 64,
        padding: 6,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {nodes.length === 0 ? (
        <span
          style={{
            fontFamily: F_MONO,
            fontSize: 9.5,
            color: C.faint,
            letterSpacing: '0.06em',
            margin: 'auto',
          }}
        >
          —
        </span>
      ) : (
        <>
          <div
            style={{
              fontFamily: F_MONO,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: baseColor,
              marginBottom: 2,
            }}
          >
            {total} {total === 1 ? 'BET' : 'BETS'}
            {inFlight > 0 && ` · ${inFlight} ACTIVE`}
            {atRisk > 0 && ` · ${atRisk} AT RISK`}
          </div>
          {nodes.slice(0, 3).map((n) => (
            <button
              key={n.useCase.id}
              type="button"
              onClick={() => onSelect(n.useCase.id)}
              style={{
                textAlign: 'left',
                background: 'transparent',
                border: 0,
                padding: 0,
                fontFamily: F_BODY,
                fontSize: 11,
                color: C.ink,
                cursor: 'pointer',
                lineHeight: 1.3,
              }}
            >
              {truncate(n.useCase.name, 28)}
            </button>
          ))}
          {nodes.length > 3 && (
            <span
              style={{
                fontFamily: F_MONO,
                fontSize: 9,
                color: C.faint,
                letterSpacing: '0.04em',
              }}
            >
              +{nodes.length - 3} more
            </span>
          )}
        </>
      )}
    </div>
  );
}

// ─── List view · sortable table ────────────────────────────────────

function ListView({
  nodes,
  selectedId,
  onSelect,
}: {
  nodes: ReadonlyArray<MapNode>;
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const sorted = [...nodes].sort((a, b) => {
    const order: Record<EngagementState, number> = {
      at_risk: 0,
      in_flight: 1,
      scaled: 2,
      not_started: 3,
      failed: 4,
    };
    return order[a.engagementState] - order[b.engagementState];
  });
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.borderLight}`,
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '120px 1fr 130px 130px 110px 110px',
          gap: 0,
          padding: '10px 16px',
          background: '#FAFAF7',
          borderBottom: `1px solid ${C.borderLight}`,
          fontFamily: F_MONO,
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: '0.14em',
          color: C.faint,
          textTransform: 'uppercase',
        }}
      >
        <span>State</span>
        <span>Name</span>
        <span>Office</span>
        <span>Lifecycle</span>
        <span style={{ textAlign: 'right' }}>Value</span>
        <span style={{ textAlign: 'right' }}>TTV</span>
      </div>
      {sorted.map((node) => {
        const isSelected = node.useCase.id === selectedId;
        const fill = nodeFill(node);
        const stateLabel =
          node.engagementState === 'in_flight' ? 'In flight' :
          node.engagementState === 'at_risk' ? 'At risk' :
          node.engagementState === 'failed' ? 'Retired' :
          node.engagementState === 'scaled' ? 'Scaled' : 'Candidate';
        const value =
          node.useCase.businessValueRanges.perCompanySize.mid ??
          node.useCase.businessValueRanges.perCompanySize.large ??
          '—';
        return (
          <button
            key={node.useCase.id}
            type="button"
            onClick={() => onSelect(node.useCase.id)}
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr 130px 130px 110px 110px',
              gap: 0,
              padding: '10px 16px',
              background: isSelected ? `${C.navy}06` : C.surface,
              borderBottom: `1px solid ${C.borderLight}`,
              fontFamily: F_BODY,
              fontSize: 12.5,
              color: 'inherit',
              cursor: 'pointer',
              textAlign: 'left',
              borderLeft: 0,
              borderRight: 0,
              borderTop: 0,
              alignItems: 'center',
              width: '100%',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: fill.fill,
                  border: fill.stroke ? `2px solid ${fill.stroke}` : 'none',
                }}
              />
              <span
                style={{
                  fontFamily: F_MONO,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: C.muted,
                }}
              >
                {stateLabel}
              </span>
            </span>
            <span>
              <span style={{ color: C.ink, fontWeight: 600 }}>{node.useCase.name}</span>
              <span
                style={{
                  fontFamily: F_MONO,
                  fontSize: 9.5,
                  color: C.faint,
                  letterSpacing: '0.04em',
                  marginLeft: 8,
                }}
              >
                {node.useCase.id}
                {node.initiativeDisplayId && ` · ${node.initiativeDisplayId}`}
              </span>
            </span>
            <span style={{ color: C.muted, fontSize: 12 }}>
              {node.useCase.office === 'front' ? 'Front office' :
                node.useCase.office === 'middle' ? 'Middle office' : 'Back office'}
            </span>
            <span style={{ color: C.muted, fontSize: 12 }}>
              {lifecycleLabel(node.useCase.lifecycleStage)}
            </span>
            <span style={{ textAlign: 'right', color: C.ink, fontWeight: 600 }}>
              {value}
            </span>
            <span
              style={{
                textAlign: 'right',
                fontFamily: F_MONO,
                fontSize: 11,
                color: C.faint,
                letterSpacing: '0.04em',
              }}
            >
              {node.useCase.businessValueRanges.timeToValueMonths}mo
            </span>
          </button>
        );
      })}
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import type { DependencyEdge, DependencyNode, MoveDAG } from '@/lib/dependencies';

type Props = {
  clientName: string;
  initialDag: MoveDAG;
};

type PositionedNode = DependencyNode & {
  x: number;
  y: number;
};

const STATUS_COLORS: Record<string, string> = {
  draft: '#8A8176',
  active: '#14532D',
  paused: '#9A3412',
  completed: '#0F766E',
  retired: '#6B7280',
};

const RELATION_COLORS: Record<string, string> = {
  depends_on: '#111827',
  triggers: '#0F766E',
  informs: '#2563EB',
  blocks: '#B91C1C',
};

function dollars(value: number | null): string {
  if (value === null) return 'No impact estimate';
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(value / 1_000)}K`;
}

function nodeHref(node: DependencyNode): string | null {
  if (node.engagementId) return `/programs/${node.engagementId}`;
  return null;
}

function layoutNodes(nodes: DependencyNode[], edges: DependencyEdge[]): PositionedNode[] {
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();
  for (const edge of edges) {
    incoming.set(edge.toNodeId, (incoming.get(edge.toNodeId) ?? 0) + 1);
    outgoing.set(edge.fromNodeId, (outgoing.get(edge.fromNodeId) ?? 0) + 1);
  }

  const sorted = [...nodes].sort((a, b) => {
    const scoreA = (incoming.get(a.id) ?? 0) * 2 + (outgoing.get(a.id) ?? 0);
    const scoreB = (incoming.get(b.id) ?? 0) * 2 + (outgoing.get(b.id) ?? 0);
    return scoreB - scoreA || a.templateName.localeCompare(b.templateName);
  });

  const columns = [
    sorted.filter((node) => (outgoing.get(node.id) ?? 0) > 0 && (incoming.get(node.id) ?? 0) === 0),
    sorted.filter((node) => (outgoing.get(node.id) ?? 0) > 0 && (incoming.get(node.id) ?? 0) > 0),
    sorted.filter((node) => (outgoing.get(node.id) ?? 0) === 0),
  ].filter((column) => column.length > 0);

  if (columns.length === 0) columns.push(sorted);

  const width = 1120;
  const height = Math.max(420, Math.max(...columns.map((column) => column.length), 1) * 118 + 120);
  const columnGap = columns.length === 1 ? 0 : (width - 220) / (columns.length - 1);

  return columns.flatMap((column, columnIndex) => {
    const x = columns.length === 1 ? width / 2 : 110 + columnIndex * columnGap;
    const yGap = height / (column.length + 1);
    return column.map((node, index) => ({
      ...node,
      x,
      y: yGap * (index + 1),
    }));
  });
}

function edgePath(from: PositionedNode, to: PositionedNode): string {
  const midX = (from.x + to.x) / 2;
  return `M ${from.x + 92} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x - 92} ${to.y}`;
}

export function PortfolioDagClient({ clientName, initialDag }: Props) {
  const [status, setStatus] = useState('all');
  const [sponsor, setSponsor] = useState('all');
  const [minImpact, setMinImpact] = useState(0);
  const [selectedNodeId, setSelectedNodeId] = useState(initialDag.nodes[0]?.id ?? '');

  const sponsors = useMemo(
    () => [...new Set(initialDag.nodes.map((node) => node.sponsor).filter((value): value is string => Boolean(value)))].sort(),
    [initialDag.nodes],
  );
  const statuses = useMemo(
    () => [...new Set(initialDag.nodes.map((node) => node.status))].sort(),
    [initialDag.nodes],
  );

  const dag = useMemo(() => {
    const nodes = initialDag.nodes.filter((node) => {
      if (status !== 'all' && node.status !== status) return false;
      if (sponsor !== 'all' && node.sponsor !== sponsor) return false;
      if ((node.dollarImpactUsd ?? 0) < minImpact) return false;
      return true;
    });
    const visible = new Set(nodes.map((node) => node.id));
    return {
      ...initialDag,
      nodes,
      edges: initialDag.edges.filter((edge) => visible.has(edge.fromNodeId) && visible.has(edge.toNodeId)),
    };
  }, [initialDag, minImpact, sponsor, status]);

  const positioned = useMemo(() => layoutNodes(dag.nodes, dag.edges), [dag.edges, dag.nodes]);
  const nodeMap = useMemo(() => new Map(positioned.map((node) => [node.id, node])), [positioned]);
  const selected = dag.nodes.find((node) => node.id === selectedNodeId) ?? dag.nodes[0] ?? null;

  return (
    <main style={{ minHeight: '100vh', background: '#F8F7F4', color: '#111827', padding: '34px 28px 56px' }}>
      <section style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'end', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'DM Sans, ui-sans-serif, system-ui, sans-serif', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#6B7280', fontWeight: 700 }}>
              Tower / Portfolio DAG
            </div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: 42, lineHeight: 1.05, margin: '10px 0 8px' }}>
              Cross-Move Dependency Graph
            </h1>
            <p style={{ margin: 0, maxWidth: 760, color: '#4B5563', fontFamily: 'DM Sans, ui-sans-serif, system-ui, sans-serif', fontSize: 15 }}>
              {clientName} portfolio moves and Source workflows, colored by status and connected by dependency relation.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontFamily: 'DM Sans, ui-sans-serif, system-ui, sans-serif' }}>
            <label style={filterLabel}>
              Status
              <select value={status} onChange={(event) => setStatus(event.target.value)} style={selectStyle}>
                <option value="all">All</option>
                {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label style={filterLabel}>
              Sponsor
              <select value={sponsor} onChange={(event) => setSponsor(event.target.value)} style={selectStyle}>
                <option value="all">All</option>
                {sponsors.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label style={filterLabel}>
              Dollar impact
              <input
                type="range"
                min={0}
                max={5_000_000}
                step={250_000}
                value={minImpact}
                onChange={(event) => setMinImpact(Number(event.target.value))}
                style={{ width: 160 }}
              />
              <span style={{ fontSize: 12, color: '#4B5563' }}>{dollars(minImpact)}</span>
            </label>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 310px', gap: 18, marginTop: 28 }}>
          <section style={{ border: '1px solid #D7D2C8', background: '#FBFAF7', minHeight: 500, overflowX: 'auto' }}>
            {positioned.length === 0 ? (
              <div style={{ padding: 32, fontFamily: 'DM Sans, ui-sans-serif, system-ui, sans-serif', color: '#4B5563' }}>
                No Move or Source workflow instances are available for this client.
              </div>
            ) : (
              <svg viewBox="0 0 1120 620" width="1120" height="620" role="img" aria-label="Portfolio dependency graph">
                <defs>
                  <marker id="dag-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,6 L9,3 z" fill="#111827" />
                  </marker>
                </defs>
                {dag.edges.map((edge) => {
                  const from = nodeMap.get(edge.fromNodeId);
                  const to = nodeMap.get(edge.toNodeId);
                  if (!from || !to) return null;
                  return (
                    <g key={edge.id}>
                      <path
                        d={edgePath(from, to)}
                        fill="none"
                        stroke={RELATION_COLORS[edge.relationType] ?? '#111827'}
                        strokeWidth={edge.relationType === 'blocks' ? 3 : 2}
                        markerEnd="url(#dag-arrow)"
                        opacity={0.82}
                      />
                      <text
                        x={(from.x + to.x) / 2}
                        y={(from.y + to.y) / 2 - 8}
                        textAnchor="middle"
                        style={{ font: '700 10px DM Sans, sans-serif', fill: RELATION_COLORS[edge.relationType] ?? '#111827', textTransform: 'uppercase' }}
                      >
                        {edge.relationType.replace('_', ' ')}
                      </text>
                    </g>
                  );
                })}
                {positioned.map((node) => (
                  <g
                    key={node.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedNodeId(node.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') setSelectedNodeId(node.id);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect
                      x={node.x - 92}
                      y={node.y - 36}
                      width={184}
                      height={72}
                      rx={8}
                      fill={selected?.id === node.id ? '#111827' : '#FFFFFF'}
                      stroke={STATUS_COLORS[node.status] ?? '#6B7280'}
                      strokeWidth={2}
                    />
                    <circle cx={node.x - 72} cy={node.y - 16} r={6} fill={STATUS_COLORS[node.status] ?? '#6B7280'} />
                    <text x={node.x - 56} y={node.y - 12} style={{ font: '700 10px DM Sans, sans-serif', fill: selected?.id === node.id ? '#FFFFFF' : '#4B5563', textTransform: 'uppercase' }}>
                      {node.templateKind === 'SourceWorkflow' ? 'Source' : 'Move'} · {node.status}
                    </text>
                    <text x={node.x - 72} y={node.y + 8} style={{ font: '700 12px DM Sans, sans-serif', fill: selected?.id === node.id ? '#FFFFFF' : '#111827' }}>
                      {node.templateName.length > 25 ? `${node.templateName.slice(0, 23)}...` : node.templateName}
                    </text>
                    <text x={node.x - 72} y={node.y + 26} style={{ font: '11px DM Sans, sans-serif', fill: selected?.id === node.id ? '#D1D5DB' : '#6B7280' }}>
                      {node.sponsor ?? 'Unassigned sponsor'} · {dollars(node.dollarImpactUsd)}
                    </text>
                  </g>
                ))}
              </svg>
            )}
          </section>

          <aside style={{ border: '1px solid #D7D2C8', background: '#FFFFFF', padding: 18, fontFamily: 'DM Sans, ui-sans-serif, system-ui, sans-serif' }}>
            {selected ? (
              <>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#6B7280', fontWeight: 800 }}>
                  Drill-in
                </div>
                <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: 25, lineHeight: 1.08, margin: '10px 0 12px' }}>
                  {selected.templateName}
                </h2>
                <dl style={{ display: 'grid', gap: 10, margin: 0 }}>
                  <Detail label="Type" value={selected.templateKind === 'SourceWorkflow' ? 'Source workflow instance' : 'Move instance'} />
                  <Detail label="Status" value={selected.status} />
                  <Detail label="Sponsor" value={selected.sponsor ?? 'Unassigned sponsor'} />
                  <Detail label="Dollar impact" value={dollars(selected.dollarImpactUsd)} />
                  <Detail label="Current gate" value={selected.currentGate ?? 'Gate not started'} />
                </dl>
                {nodeHref(selected) ? (
                  <a href={nodeHref(selected) ?? '#'} style={buttonStyle}>Open program</a>
                ) : (
                  <div style={{ ...buttonStyle, color: '#6B7280', borderColor: '#D1D5DB' }}>No program shell</div>
                )}
              </>
            ) : (
              <p style={{ margin: 0, color: '#4B5563' }}>Select a node to inspect its sponsor, gate, and impact state.</p>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6B7280', fontWeight: 800 }}>{label}</dt>
      <dd style={{ margin: '3px 0 0', fontSize: 14, color: '#111827' }}>{value}</dd>
    </div>
  );
}

const filterLabel = {
  display: 'grid',
  gap: 5,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: '#4B5563',
  fontWeight: 800,
} as const;

const selectStyle = {
  minWidth: 132,
  border: '1px solid #111827',
  borderRadius: 6,
  background: '#FFFFFF',
  color: '#111827',
  padding: '8px 10px',
  font: '600 13px DM Sans, ui-sans-serif, system-ui, sans-serif',
  textTransform: 'none',
  letterSpacing: 0,
} as const;

const buttonStyle = {
  display: 'block',
  marginTop: 18,
  border: '1px solid #111827',
  color: '#111827',
  textDecoration: 'none',
  textAlign: 'center',
  padding: '9px 12px',
  borderRadius: 6,
  fontWeight: 800,
  fontSize: 13,
} as const;

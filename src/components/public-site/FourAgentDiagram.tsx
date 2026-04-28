'use client';

interface AgentNode {
  id: string;
  name: string;
  voice: string;
  x: number;
  y: number;
}

// Diamond layout: top, right, bottom, left
const AGENTS: AgentNode[] = [
  { id: 'nexus',    name: 'Nexus',    voice: 'Operational, formal, high-stakes',     x: 300, y:  60 },
  { id: 'sentinel', name: 'Sentinel', voice: 'Technical, sharp, willing to disagree', x: 520, y: 200 },
  { id: 'atlas',    name: 'Atlas',    voice: 'Operational, terse, citation-rich',     x: 300, y: 340 },
  { id: 'steward',  name: 'Steward',  voice: 'Procedural, careful, cites rules',      x:  80, y: 200 },
];

interface DirectedEdge {
  from: number;
  to: number;
  label: string;
}

const EDGES: DirectedEdge[] = [
  { from: 0, to: 1, label: 'validate output' },
  { from: 1, to: 0, label: 'hold / approve' },
  { from: 0, to: 2, label: 'synthesis request' },
  { from: 2, to: 0, label: '150-word brief' },
  { from: 0, to: 3, label: 'escalate decision' },
  { from: 3, to: 0, label: 'rule citation' },
];

function arrowHead(x: number, y: number, angle: number) {
  const size = 7;
  const a1 = angle + (140 * Math.PI) / 180;
  const a2 = angle - (140 * Math.PI) / 180;
  return `${x},${y} ${x + size * Math.cos(a1)},${y + size * Math.sin(a1)} ${x + size * Math.cos(a2)},${y + size * Math.sin(a2)}`;
}

function edgePath(edge: DirectedEdge): { x1: number; y1: number; x2: number; y2: number; mx: number; my: number; angle: number } {
  const from = AGENTS[edge.from];
  const to = AGENTS[edge.to];
  const nodeR = 44;

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const nx = dx / dist;
  const ny = dy / dist;

  // Offset the line slightly to avoid overlap with reverse edge
  const perpX = -ny * 8;
  const perpY = nx * 8;

  const x1 = from.x + nx * nodeR + perpX;
  const y1 = from.y + ny * nodeR + perpY;
  const x2 = to.x - nx * nodeR + perpX;
  const y2 = to.y - ny * nodeR + perpY;

  const angle = Math.atan2(y2 - y1, x2 - x1);

  return { x1, y1, x2, y2, mx: (x1 + x2) / 2, my: (y1 + y2) / 2, angle };
}

export function FourAgentDiagram() {
  return (
    <svg
      viewBox="0 0 600 400"
      width="100%"
      style={{ display: 'block', maxWidth: '700px', margin: '0 auto' }}
      role="img"
      aria-labelledby="agent-title agent-desc"
    >
      <title id="agent-title">Four-agent architecture diagram</title>
      <desc id="agent-desc">
        Four agents arranged in a diamond: Nexus (orchestrator) at top, Sentinel (validator) at
        right, Atlas (synthesizer) at bottom, Steward (governor) at left. Directed edges show
        handoffs between agents.
      </desc>

      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#5F5E5A" />
        </marker>
      </defs>

      {/* Edges */}
      {EDGES.map((edge, i) => {
        const { x1, y1, x2, y2, mx, my, angle } = edgePath(edge);
        return (
          <g key={i}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#5F5E5A"
              strokeWidth={1.2}
              strokeOpacity={0.6}
              markerEnd="url(#arrowhead)"
            />
            <polygon
              points={arrowHead(x2, y2, angle)}
              fill="#5F5E5A"
              fillOpacity={0.6}
            />
            <text
              x={mx}
              y={my - 5}
              textAnchor="middle"
              fontFamily="var(--pub-font-mono, 'JetBrains Mono', monospace)"
              fontSize={9}
              fill="#888780"
            >
              {edge.label}
            </text>
          </g>
        );
      })}

      {/* Agent nodes */}
      {AGENTS.map((agent) => (
        <g key={agent.id}>
          <rect
            x={agent.x - 44}
            y={agent.y - 30}
            width={88}
            height={60}
            rx={8}
            ry={8}
            fill="#0c1a3a"
            stroke="#0066CC"
            strokeWidth={1.5}
          />
          <text
            x={agent.x}
            y={agent.y - 6}
            textAnchor="middle"
            fontFamily="var(--pub-font-serif, 'Fraunces', serif)"
            fontSize={14}
            fontWeight={600}
            fill="#faf7f1"
          >
            {agent.name}
          </text>
          <text
            x={agent.x}
            y={agent.y + 10}
            textAnchor="middle"
            fontFamily="var(--pub-font-mono, 'JetBrains Mono', monospace)"
            fontSize={8}
            fill="#a3cef4"
          >
            {/* Break voice register across two lines if long */}
            {agent.voice.length > 28
              ? agent.voice.substring(0, agent.voice.lastIndexOf(',', 28) + 1)
              : agent.voice}
          </text>
          {agent.voice.length > 28 && (
            <text
              x={agent.x}
              y={agent.y + 21}
              textAnchor="middle"
              fontFamily="var(--pub-font-mono, 'JetBrains Mono', monospace)"
              fontSize={8}
              fill="#a3cef4"
            >
              {agent.voice.substring(agent.voice.lastIndexOf(',', 28) + 2)}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

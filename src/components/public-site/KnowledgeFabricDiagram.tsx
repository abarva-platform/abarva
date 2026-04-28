'use client';

interface StoreNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

// Pentagon layout: 5 nodes evenly spaced
// Center: 300, 250. Radius: 170
const CX = 300;
const CY = 250;
const R = 170;

function pentagonPoint(index: number, total: number): { x: number; y: number } {
  // Start from top (-90 degrees)
  const angle = (index * 2 * Math.PI) / total - Math.PI / 2;
  return {
    x: CX + R * Math.cos(angle),
    y: CY + R * Math.sin(angle),
  };
}

const STORES: StoreNode[] = [
  { id: 'relational', label: 'Relational DB', ...pentagonPoint(0, 5) },
  { id: 'vector', label: 'Vector Store', ...pentagonPoint(1, 5) },
  { id: 'graph', label: 'Graph DB', ...pentagonPoint(2, 5) },
  { id: 'object', label: 'Object Store', ...pentagonPoint(3, 5) },
  { id: 'evidence', label: 'Evidence Ledger', ...pentagonPoint(4, 5) },
];

// All edges between the 5 nodes (complete graph = 10 edges)
const EDGES: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 4],
  [1, 2], [1, 3], [1, 4],
  [2, 3], [2, 4],
  [3, 4],
];

export function KnowledgeFabricDiagram() {
  return (
    <div>
      <style>{`
        @keyframes pub-flow {
          from { stroke-dashoffset: 24; }
          to   { stroke-dashoffset: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pub-kf-edge {
            animation: none !important;
          }
        }
      `}</style>
      <svg
        viewBox="0 0 600 500"
        width="100%"
        style={{ display: 'block', maxWidth: '700px', margin: '0 auto' }}
        role="img"
        aria-labelledby="kf-title kf-desc"
      >
        <title id="kf-title">Knowledge fabric — five-store diagram</title>
        <desc id="kf-desc">
          Five knowledge stores arranged in a pentagon: Relational DB, Vector Store, Graph DB,
          Object Store, and Evidence Ledger. Animated edges show data flowing between all stores.
        </desc>

        {/* Edges */}
        {EDGES.map(([a, b], i) => {
          const from = STORES[a];
          const to = STORES[b];
          // Stagger animation delay per edge
          const delay = `${(i * 0.3).toFixed(1)}s`;
          return (
            <line
              key={`${a}-${b}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="#0066CC"
              strokeWidth={1.5}
              strokeDasharray="6 6"
              strokeOpacity={0.5}
              className="pub-kf-edge"
              style={{
                animation: `pub-flow 2s linear infinite`,
                animationDelay: delay,
              }}
            />
          );
        })}

        {/* Nodes */}
        {STORES.map((store) => (
          <g key={store.id}>
            <circle
              cx={store.x}
              cy={store.y}
              r={36}
              fill="var(--pub-paper, #faf7f1)"
              stroke="#0066CC"
              strokeWidth={2}
            />
            {/* Label: split on space for two-line labels */}
            {store.label.split(' ').map((word, wi, arr) => (
              <text
                key={wi}
                x={store.x}
                y={store.y + (wi - (arr.length - 1) / 2) * 14 + 4}
                textAnchor="middle"
                fontFamily="var(--pub-font-mono, 'JetBrains Mono', monospace)"
                fontSize={11}
                fill="#0c1a3a"
              >
                {word}
              </text>
            ))}
          </g>
        ))}

        {/* Central label */}
        <text
          x={CX}
          y={CY - 8}
          textAnchor="middle"
          fontFamily="var(--pub-font-serif, 'Fraunces', serif)"
          fontSize={12}
          fill="#888780"
          opacity={0.7}
        >
          Knowledge
        </text>
        <text
          x={CX}
          y={CY + 8}
          textAnchor="middle"
          fontFamily="var(--pub-font-serif, 'Fraunces', serif)"
          fontSize={12}
          fill="#888780"
          opacity={0.7}
        >
          Fabric
        </text>
      </svg>
    </div>
  );
}

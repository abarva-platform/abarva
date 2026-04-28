'use client';

import { useState, KeyboardEvent } from 'react';
import Link from 'next/link';

interface PlaneDefinition {
  number: number;
  name: string;
  description: string;
  subPageHref?: string;
}

const PLANES: PlaneDefinition[] = [
  {
    number: 1,
    name: 'Identity plane',
    description: 'User identity, SSO, role resolution',
  },
  {
    number: 2,
    name: 'Tenant plane',
    description: 'Tenant isolation, data boundary enforcement',
  },
  {
    number: 3,
    name: 'Control plane',
    description: 'Orchestration, workflow, scheduling',
  },
  {
    number: 4,
    name: 'Workflow plane',
    description: 'Six-phase program lifecycle management',
  },
  {
    number: 5,
    name: 'Knowledge plane',
    description: '5-store corpus: relational, vector, graph, object, evidence',
    subPageHref: '/architecture/knowledge-fabric/',
  },
  {
    number: 6,
    name: 'Synthesis plane',
    description: 'Atlas reasoning, 150-word synthesis, citations',
    subPageHref: '/architecture/synthesis/',
  },
  {
    number: 7,
    name: 'Agent plane',
    description: 'Nexus, Sentinel, Atlas, Steward coordination',
    subPageHref: '/architecture/agents/',
  },
  {
    number: 8,
    name: 'UI plane',
    description: 'Tower, Programs, Source, Setup surfaces',
  },
  {
    number: 9,
    name: 'Data plane',
    description: 'Private tenant data, JWT-scoped access',
    subPageHref: '/architecture/data-plane/',
  },
  {
    number: 10,
    name: 'Integration plane',
    description: 'External connectors, webhook ingestion',
  },
  {
    number: 11,
    name: 'Audit plane',
    description: 'Immutable event log, compliance trail',
    subPageHref: '/architecture/governance/',
  },
];

// Color progression: outer = stone-tinted paper, inner = light signal blue
const FILL_COLORS = [
  '#faf7f1', // paper
  '#f5f2ec',
  '#eff0ee',
  '#e8edf2',
  '#e0eaf5',
  '#d8e6f8',
  '#cfe2f8',
  '#c6ddf7',
  '#bcd9f6',
  '#b0d4f5',
  '#a3cef4', // light signal blue
];

const STROKE_COLORS = [
  '#88877840', // rule-ish
  '#88877850',
  '#7a8a9a60',
  '#6a8aaa70',
  '#5a8aba80',
  '#4a8aca90',
  '#3a7cba',
  '#2a6caa',
  '#1a5c9a',
  '#0a4c8a',
  '#0066CC', // signal
];

const OUTER_X = 10;
const OUTER_Y = 10;
const OUTER_W = 780;
const OUTER_H = 580;
const SHRINK = 33; // per side shrink per plane

export function ElevenPlaneDiagram() {
  const [selectedPlane, setSelectedPlane] = useState<PlaneDefinition | null>(null);

  function handleSelect(plane: PlaneDefinition) {
    setSelectedPlane((prev) => (prev?.number === plane.number ? null : plane));
  }

  function handleKeyDown(e: KeyboardEvent<SVGRectElement>, plane: PlaneDefinition) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(plane);
    }
  }

  return (
    <div>
      <svg
        viewBox="0 0 800 600"
        width="100%"
        style={{ display: 'block', maxWidth: '900px', margin: '0 auto' }}
        role="img"
        aria-labelledby="eleven-plane-title eleven-plane-desc"
      >
        <title id="eleven-plane-title">Eleven-plane architecture diagram</title>
        <desc id="eleven-plane-desc">
          Eleven nested concentric planes representing AbarVa&apos;s architecture layers, from the
          outermost Identity plane to the innermost Audit plane. Click or press Enter on any plane
          to see its description.
        </desc>

        {/* Render planes from outermost (0) to innermost (10) */}
        {PLANES.map((plane, i) => {
          const x = OUTER_X + i * SHRINK;
          const y = OUTER_Y + i * SHRINK;
          const w = OUTER_W - i * SHRINK * 2;
          const h = OUTER_H - i * SHRINK * 2;
          const isSelected = selectedPlane?.number === plane.number;

          return (
            <g key={plane.number}>
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx={10}
                ry={10}
                fill={FILL_COLORS[i]}
                stroke={isSelected ? '#0066CC' : STROKE_COLORS[i]}
                strokeWidth={isSelected ? 2.5 : 1.5}
                tabIndex={0}
                role="button"
                aria-label={`Plane ${plane.number}: ${plane.name} — ${plane.description}`}
                aria-pressed={isSelected}
                style={{ cursor: 'pointer', outline: 'none' }}
                onClick={() => handleSelect(plane)}
                onKeyDown={(e) => handleKeyDown(e, plane)}
                onFocus={() => {}}
              />
              {/* Plane label: number + name along top-left inside rect */}
              <text
                x={x + 10}
                y={y + 16}
                fontFamily="var(--pub-font-mono, 'JetBrains Mono', monospace)"
                fontSize={10}
                fill={i >= 7 ? '#0066CC' : '#5F5E5A'}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                <tspan fontWeight="600">{plane.number}.</tspan>
                {' '}
                {plane.name}
              </text>
            </g>
          );
        })}

        {/* Center label */}
        <text
          x={400}
          y={305}
          textAnchor="middle"
          fontFamily="var(--pub-font-serif, 'Fraunces', serif)"
          fontSize={13}
          fill="#0c1a3a"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          AbarVa
        </text>
        <text
          x={400}
          y={320}
          textAnchor="middle"
          fontFamily="var(--pub-font-mono, 'JetBrains Mono', monospace)"
          fontSize={9}
          fill="#888780"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          11-plane architecture
        </text>
      </svg>

      {/* Description panel below diagram */}
      {selectedPlane && (
        <div
          style={{
            maxWidth: '900px',
            margin: '16px auto 0',
            background: 'var(--pub-paper, #faf7f1)',
            border: '1.5px solid var(--pub-signal, #0066CC)',
            borderRadius: '8px',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
          }}
          role="region"
          aria-live="polite"
          aria-label={`Details for ${selectedPlane.name}`}
        >
          <div>
            <p
              style={{
                fontFamily: 'var(--pub-font-mono, monospace)',
                fontSize: '11px',
                color: 'var(--pub-stone, #888780)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '6px',
              }}
            >
              Plane {selectedPlane.number}
            </p>
            <p
              style={{
                fontFamily: 'var(--pub-font-serif, serif)',
                fontSize: '18px',
                color: 'var(--pub-ink, #000)',
                fontWeight: 500,
                marginBottom: '6px',
              }}
            >
              {selectedPlane.name}
            </p>
            <p
              style={{
                fontFamily: 'var(--pub-font-sans, sans-serif)',
                fontSize: '15px',
                color: 'var(--pub-slate, #5F5E5A)',
                lineHeight: 1.5,
              }}
            >
              {selectedPlane.description}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
            {selectedPlane.subPageHref && (
              <Link
                href={selectedPlane.subPageHref}
                style={{
                  fontFamily: 'var(--pub-font-sans, sans-serif)',
                  fontSize: '14px',
                  color: 'var(--pub-signal, #0066CC)',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                View detail →
              </Link>
            )}
            <button
              onClick={() => setSelectedPlane(null)}
              style={{
                fontFamily: 'var(--pub-font-mono, monospace)',
                fontSize: '11px',
                color: 'var(--pub-stone, #888780)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                textAlign: 'right',
              }}
              aria-label="Close plane description"
            >
              ✕ close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { COLORS } from '@/lib/design-system';
import { EyebrowLabel } from '@/components/shared/typography/EyebrowLabel';
import { MetaLabel } from '@/components/shared/typography/MetaLabel';

// Fix Spec v4 §8 · PatternClusterGraph.
//
// Small SVG node-link diagram showing a pattern's cluster signature ·
// which other Genome patterns commonly co-occur. Center node = current
// pattern · surrounding nodes = cluster members · line thickness =
// relationship strength (0-1). Node size proportional to citation count.
//
// Layout is static (polar coordinates around center) so render stays
// deterministic and server-safe. Hover tooltip + click nav are the only
// interactive affordances.
//
// Mobile fallback · under 640px the SVG hides and a vertical list of
// cluster links renders instead.

export type ClusterRelationship =
  | 'parent_dynamic'
  | 'downstream_risk'
  | 'contributing_signal'
  | 'historical_co_occurrence';

export interface ClusterPattern {
  patternId: string;
  patternName: string;
  relationshipStrength: number; // 0-1
  relationshipType: ClusterRelationship;
  citationCount: number;
}

const RELATIONSHIP_LABELS: Record<ClusterRelationship, string> = {
  parent_dynamic: 'Parent dynamic',
  downstream_risk: 'Downstream risk',
  contributing_signal: 'Contributing signal',
  historical_co_occurrence: 'Historical co-occurrence',
};

const RELATIONSHIP_COLORS: Record<ClusterRelationship, string> = {
  parent_dynamic: '#F59E0B',              // amber · dynamic that precedes
  downstream_risk: '#FF6B4A',             // red · risk that follows
  contributing_signal: '#2DD4C8',         // teal · active contributor
  historical_co_occurrence: '#9B6DFF',    // purple · observed together
};

interface Props {
  centerPatternId: string;
  centerPatternName: string;
  cluster: ClusterPattern[];
  // Href builder · defaults to /intelligence/patterns/[patternId] lowercased.
  hrefFor?: (patternId: string) => string;
}

export function PatternClusterGraph({
  centerPatternId,
  centerPatternName,
  cluster,
  hrefFor = (id) => `/intelligence/patterns/${encodeURIComponent(id.toLowerCase())}`,
}: Props) {
  const layout = useMemo(() => computeLayout(cluster), [cluster]);

  return (
    <section
      aria-label={`${centerPatternName} pattern cluster`}
      style={{
        padding: 24,
        background: 'rgba(255,255,255,0.02)',
        border: '0.5px solid rgba(155,109,255,0.18)',
        borderRadius: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div>
        <EyebrowLabel tone="teal" size="sm">PATTERN CLUSTER</EyebrowLabel>
        <div style={{ marginTop: 6, fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 400, color: COLORS.textPrimary, letterSpacing: '-0.005em' }}>
          What commonly surrounds {centerPatternId}
        </div>
      </div>

      {/* Desktop · SVG node-link layout */}
      <div className="pcg-svg-wrap">
        <svg
          viewBox="0 0 560 360"
          width="100%"
          height={360}
          role="img"
          aria-label={`Pattern cluster for ${centerPatternName}`}
          style={{ maxWidth: 720 }}
        >
          {/* Edges first so nodes paint on top */}
          {layout.nodes.map((node) => {
            const strokeOpacity = 0.2 + node.pattern.relationshipStrength * 0.7;
            const strokeWidth = 1 + node.pattern.relationshipStrength * 3;
            return (
              <line
                key={`edge-${node.pattern.patternId}`}
                x1={280}
                y1={180}
                x2={node.x}
                y2={node.y}
                stroke={RELATIONSHIP_COLORS[node.pattern.relationshipType]}
                strokeOpacity={strokeOpacity}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
            );
          })}

          {/* Center node */}
          <g>
            <circle cx={280} cy={180} r={42} fill="rgba(45,212,200,0.18)" stroke={COLORS.teal} strokeWidth={1.5} />
            <text
              x={280}
              y={183}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize={13}
              fontWeight={600}
              fill={COLORS.textPrimary}
            >
              {centerPatternId}
            </text>
          </g>

          {/* Cluster nodes */}
          {layout.nodes.map((node) => {
            const radius = 18 + Math.min(14, Math.log2(Math.max(1, node.pattern.citationCount)) * 3);
            const color = RELATIONSHIP_COLORS[node.pattern.relationshipType];
            return (
              <g key={node.pattern.patternId}>
                <a href={hrefFor(node.pattern.patternId)}>
                  <title>
                    {node.pattern.patternId} · {node.pattern.patternName}
                    {'\n'}
                    {RELATIONSHIP_LABELS[node.pattern.relationshipType]} · strength {Math.round(node.pattern.relationshipStrength * 100)}% · n={node.pattern.citationCount}
                  </title>
                  <circle cx={node.x} cy={node.y} r={radius} fill={color} fillOpacity={0.22} stroke={color} strokeWidth={1.5} />
                  <text
                    x={node.x}
                    y={node.y + 3}
                    textAnchor="middle"
                    fontFamily="JetBrains Mono, monospace"
                    fontSize={11}
                    fontWeight={600}
                    fill={COLORS.textPrimary}
                  >
                    {node.pattern.patternId}
                  </text>
                </a>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(245,245,240,0.65)' }}>
        {(Object.keys(RELATIONSHIP_LABELS) as ClusterRelationship[]).map((type) => (
          <span key={type} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: RELATIONSHIP_COLORS[type], opacity: 0.8 }} />
            {RELATIONSHIP_LABELS[type]}
          </span>
        ))}
      </div>

      {/* Mobile fallback · vertical list · hidden on desktop */}
      <ul className="pcg-mobile" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'none', flexDirection: 'column', gap: 8 }}>
        {cluster.map((p) => (
          <li key={p.patternId}>
            <Link
              href={hrefFor(p.patternId)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.02)',
                border: '0.5px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                textDecoration: 'none',
                color: COLORS.textPrimary,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: RELATIONSHIP_COLORS[p.relationshipType],
                  flexShrink: 0,
                }}
              />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: COLORS.teal, letterSpacing: '0.08em' }}>{p.patternId}</span>
              <span style={{ fontSize: 13, flex: 1 }}>{p.patternName}</span>
              <MetaLabel>{Math.round(p.relationshipStrength * 100)}%</MetaLabel>
            </Link>
          </li>
        ))}
      </ul>

      <style jsx>{`
        @media (max-width: 640px) {
          .pcg-svg-wrap { display: none; }
          .pcg-mobile { display: flex !important; }
        }
      `}</style>
    </section>
  );
}

// ─── Layout ────────────────────────────────────────────────────────────

interface LaidOutNode {
  pattern: ClusterPattern;
  x: number;
  y: number;
}

function computeLayout(cluster: ClusterPattern[]): { nodes: LaidOutNode[] } {
  // Polar layout around (280, 180) at radius ~130. Strongest relationships
  // nearest to center for subtle depth cue.
  const centerX = 280;
  const centerY = 180;
  const baseRadius = 130;
  const nodes: LaidOutNode[] = cluster.map((p, i) => {
    // Evenly spaced angles starting at -90° (top) rotating clockwise.
    const angle = (-Math.PI / 2) + (i / cluster.length) * Math.PI * 2;
    // Pull stronger relationships slightly inward (12% range) so the
    // layout reads as weighted without being chaotic.
    const radius = baseRadius - (p.relationshipStrength - 0.5) * 20;
    return {
      pattern: p,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    };
  });
  return { nodes };
}

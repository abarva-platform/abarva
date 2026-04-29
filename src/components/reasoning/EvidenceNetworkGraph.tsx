'use client';

/**
 * EvidenceNetworkGraph — REASON-36
 *
 * SVG graph showing evidence items as nodes connected to the gate criteria
 * they support via keyword matching (same logic as EvidenceCoverageHeatmap).
 *
 * Layout:
 *   - Left column:  "Gate criteria" nodes — circles, mint if covered, rust if not
 *   - Right column: "Evidence" nodes — squares, sky-blue
 *   - Edges:        lines criterion←→evidence, mint if covered, gray if tenuous
 *
 * Pure SVG, no D3 or graph library. Responsive via viewBox.
 * Collapsible section wrapper matching the heatmap pattern.
 *
 * AbarVa palette only. Strict TypeScript — no `any`.
 */

import { useState } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { LifecyclePatternSeed, GateCriterion } from '@/lib/intelligence/seed-types';
import type { SourceEventInstance } from '@/lib/source/source-event-instance';
import type { ProgramInstance } from '@/lib/programs/program-instance';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EvidenceNetworkGraphProps {
  instance: SourceEventInstance | ProgramInstance;
  pattern: LifecyclePatternSeed;
  width?: number;
  height?: number;
}

interface CriterionNode {
  id: string;
  label: string;         // truncated to 30 chars
  fullLabel: string;
  covered: boolean;
  cx: number;
  cy: number;
}

interface EvidenceNode {
  id: string;
  label: string;         // truncated to 30 chars
  fullLabel: string;
  cx: number;
  cy: number;
}

interface Edge {
  criterionId: string;
  evidenceId: string;
  covered: boolean;     // true = mint, false = gray
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// ─── Layout constants ─────────────────────────────────────────────────────────

const NODE_R      = 10;   // circle radius for criteria
const SQUARE_HALF = 9;    // half-side for evidence squares
const PAD_X       = 80;   // horizontal padding inside SVG
const PAD_Y       = 36;   // vertical padding (top + bottom)
const LABEL_OFFSET_X = 14; // gap from node edge to label

// ─── Colour constants ─────────────────────────────────────────────────────────

const COLOR = {
  criteriaCovered:   { fill: SHELL.MINT_BG,   stroke: SHELL.MINT_LINE },
  criteriaUncovered: { fill: SHELL.RUST_BG,   stroke: '#d9957a'       },
  evidence:          { fill: '#ddeeff',        stroke: '#88aad0'       },  // sky blue
  edgeCovered:       SHELL.MINT_LINE,
  edgeGray:          SHELL.CARD_LINE,
} as const;

// ─── Text truncation ──────────────────────────────────────────────────────────

function trunc(s: string, max = 30): string {
  return s.length <= max ? s : s.slice(0, max - 1) + '…';
}

// ─── Evidence extraction (mirrors EvidenceCoverageHeatmap) ────────────────────

function extractEvidenceItems(
  instance: SourceEventInstance | ProgramInstance,
): Array<{ id: string; text: string }> {
  const ev = instance.evidence;
  if (ev.length === 0) return [];

  if ('field' in ev[0]) {
    // SourceEventInstance — combine field + value + source per item
    return (ev as SourceEventInstance['evidence']).map((item) => ({
      id: item.id,
      text: [item.field, item.value, item.source].join(' '),
    }));
  }

  // ProgramInstance
  return (ev as ProgramInstance['evidence']).map((item) => ({
    id: item.id,
    text: item.citation,
  }));
}

// ─── Keyword extraction (identical to EvidenceCoverageHeatmap) ───────────────

function extractKeywords(description: string): string[] {
  const STOP = new Set([
    'with', 'that', 'this', 'from', 'each', 'have', 'been', 'will',
    'must', 'when', 'than', 'also', 'more', 'than', 'into', 'only',
    'over', 'after', 'before', 'their', 'there', 'they', 'where',
    'which', 'while', 'other', 'about', 'every', 'does', 'complete',
    'completed', 'minimum', 'least', 'vendor', 'vendors',
  ]);
  return description
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP.has(w));
}

// ─── Coverage check ───────────────────────────────────────────────────────────

/**
 * Returns whether a single evidence string covers a criterion (≥1 keyword match).
 */
function evidenceCoversCriterion(criterionDesc: string, evidenceText: string): boolean {
  const keywords = extractKeywords(criterionDesc);
  if (keywords.length === 0) return false;
  const lower = evidenceText.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

/**
 * A criterion is "covered" if ≥1 evidence item matches it.
 */
function criterionIsCovered(
  criterion: GateCriterion,
  evidenceItems: Array<{ id: string; text: string }>,
): boolean {
  return evidenceItems.some((ev) => evidenceCoversCriterion(criterion.description, ev.text));
}

// ─── Graph data builder ───────────────────────────────────────────────────────

interface GraphData {
  criteriaNodes: CriterionNode[];
  evidenceNodes: EvidenceNode[];
  edges: Edge[];
}

function buildGraphData(
  instance: SourceEventInstance | ProgramInstance,
  pattern: LifecyclePatternSeed,
  svgWidth: number,
  svgHeight: number,
): GraphData {
  const MAX_CRITERIA = 15;
  const MAX_EVIDENCE = 8;

  const rawCriteria = pattern.gateCriteria.slice(0, MAX_CRITERIA);
  const rawEvidence = extractEvidenceItems(instance).slice(0, MAX_EVIDENCE);

  const critCount  = rawCriteria.length;
  const evCount    = rawEvidence.length;

  // X positions: criteria on left, evidence on right
  const criteriaX  = PAD_X;
  const evidenceX  = svgWidth - PAD_X;

  // Vertical spacing
  const critSpacing = critCount  > 1 ? (svgHeight - PAD_Y * 2) / (critCount  - 1) : 0;
  const evSpacing   = evCount    > 1 ? (svgHeight - PAD_Y * 2) / (evCount    - 1) : 0;

  // Build criterion nodes
  const criteriaNodes: CriterionNode[] = rawCriteria.map((c, i) => {
    const cy = critCount === 1
      ? svgHeight / 2
      : PAD_Y + i * critSpacing;
    const covered = criterionIsCovered(c, rawEvidence);
    return {
      id:        c.id,
      label:     trunc(c.description),
      fullLabel: c.description,
      covered,
      cx:        criteriaX,
      cy,
    };
  });

  // Build evidence nodes
  const evidenceNodes: EvidenceNode[] = rawEvidence.map((ev, i) => {
    const cy = evCount === 1
      ? svgHeight / 2
      : PAD_Y + i * evSpacing;
    return {
      id:        ev.id,
      label:     trunc(ev.text),
      fullLabel: ev.text,
      cx:        evidenceX,
      cy,
    };
  });

  // Build edges
  const edges: Edge[] = [];
  for (const cn of criteriaNodes) {
    const criterion = rawCriteria.find((c) => c.id === cn.id)!;
    for (const en of evidenceNodes) {
      const evidenceItem = rawEvidence.find((e) => e.id === en.id)!;
      if (evidenceCoversCriterion(criterion.description, evidenceItem.text)) {
        edges.push({
          criterionId: cn.id,
          evidenceId:  en.id,
          covered:     true,
          x1: cn.cx,
          y1: cn.cy,
          x2: en.cx,
          y2: en.cy,
        });
      }
    }
  }

  return { criteriaNodes, evidenceNodes, edges };
}

// ─── SVG node + edge components ──────────────────────────────────────────────

function CriterionCircle({ node }: { node: CriterionNode }) {
  const { fill, stroke } = node.covered
    ? COLOR.criteriaCovered
    : COLOR.criteriaUncovered;

  return (
    <g>
      <circle
        cx={node.cx}
        cy={node.cy}
        r={NODE_R}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
      >
        <title>{node.fullLabel}</title>
      </circle>
    </g>
  );
}

function EvidenceSquare({ node }: { node: EvidenceNode }) {
  const { fill, stroke } = COLOR.evidence;
  const s = SQUARE_HALF;
  return (
    <g>
      <rect
        x={node.cx - s}
        y={node.cy - s}
        width={s * 2}
        height={s * 2}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
        rx={2}
      >
        <title>{node.fullLabel}</title>
      </rect>
    </g>
  );
}

function GraphEdge({ edge }: { edge: Edge }) {
  const color = edge.covered ? COLOR.edgeCovered : COLOR.edgeGray;
  // Cubic bezier: control points pulled toward the horizontal centre
  const midX = (edge.x1 + edge.x2) / 2;
  const d = `M ${edge.x1} ${edge.y1} C ${midX} ${edge.y1}, ${midX} ${edge.y2}, ${edge.x2} ${edge.y2}`;
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={edge.covered ? 1.5 : 0.8}
      strokeOpacity={edge.covered ? 0.8 : 0.4}
    />
  );
}

// ─── Column header text ───────────────────────────────────────────────────────

function ColumnHeader({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontFamily={SHELL.MONO}
      fontSize={8}
      letterSpacing="0.12em"
      fill={SHELL.INK_MUTED}
    >
      {label.toUpperCase()}
    </text>
  );
}

// ─── Node label text ──────────────────────────────────────────────────────────

function NodeLabel({
  x,
  y,
  label,
  anchor,
}: {
  x: number;
  y: number;
  label: string;
  anchor: 'start' | 'end';
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      dominantBaseline="middle"
      fontFamily={SHELL.SANS}
      fontSize={9}
      fill={SHELL.INK_SOFT}
    >
      {label}
    </text>
  );
}

// ─── SVG graph canvas ─────────────────────────────────────────────────────────

function NetworkSVG({
  instance,
  pattern,
  width,
  height,
}: {
  instance: SourceEventInstance | ProgramInstance;
  pattern: LifecyclePatternSeed;
  width: number;
  height: number;
}) {
  const { criteriaNodes, evidenceNodes, edges } = buildGraphData(
    instance,
    pattern,
    width,
    height,
  );

  const criteriaX = PAD_X;
  const evidenceX = width - PAD_X;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{ display: 'block', maxHeight: height }}
      aria-label="Evidence network graph"
      role="img"
    >
      {/* Column headers */}
      <ColumnHeader x={criteriaX} y={16} label="Gate criteria" />
      <ColumnHeader x={evidenceX} y={16} label="Evidence" />

      {/* Edges — render below nodes so nodes appear on top */}
      {edges.map((e, i) => (
        <GraphEdge key={`edge-${i}`} edge={e} />
      ))}

      {/* Criteria nodes */}
      {criteriaNodes.map((cn) => (
        <g key={cn.id}>
          <CriterionCircle node={cn} />
          <NodeLabel
            x={cn.cx + NODE_R + LABEL_OFFSET_X}
            y={cn.cy}
            label={cn.label}
            anchor="start"
          />
        </g>
      ))}

      {/* Evidence nodes */}
      {evidenceNodes.map((en) => (
        <g key={en.id}>
          <EvidenceSquare node={en} />
          <NodeLabel
            x={en.cx - SQUARE_HALF - LABEL_OFFSET_X}
            y={en.cy}
            label={en.label}
            anchor="end"
          />
        </g>
      ))}
    </svg>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function NetworkLegend() {
  const items: Array<{
    shape: 'circle' | 'square';
    fill: string;
    stroke: string;
    label: string;
  }> = [
    { shape: 'circle', fill: SHELL.MINT_BG,    stroke: SHELL.MINT_LINE, label: 'Criterion — covered'   },
    { shape: 'circle', fill: SHELL.RUST_BG,    stroke: '#d9957a',       label: 'Criterion — no evidence' },
    { shape: 'square', fill: '#ddeeff',         stroke: '#88aad0',       label: 'Evidence item'          },
  ];
  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 10 }}>
      {items.map((item) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width={14} height={14} style={{ flexShrink: 0 }}>
            {item.shape === 'circle' ? (
              <circle cx={7} cy={7} r={5} fill={item.fill} stroke={item.stroke} strokeWidth={1.2} />
            ) : (
              <rect x={2} y={2} width={10} height={10} rx={1} fill={item.fill} stroke={item.stroke} strokeWidth={1.2} />
            )}
          </svg>
          <span style={{ fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED, letterSpacing: '0.06em' }}>
            {item.label}
          </span>
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <svg width={24} height={10} style={{ flexShrink: 0 }}>
          <line x1={0} y1={5} x2={24} y2={5} stroke={SHELL.MINT_LINE} strokeWidth={1.5} />
        </svg>
        <span style={{ fontFamily: SHELL.MONO, fontSize: 9, color: SHELL.INK_MUTED, letterSpacing: '0.06em' }}>
          Covered edge
        </span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function EvidenceNetworkGraph({
  instance,
  pattern,
  width  = 600,
  height = 400,
}: EvidenceNetworkGraphProps) {
  const [open, setOpen] = useState(false);

  // Enforce minimum canvas size
  const svgW = Math.max(width,  300);
  const svgH = Math.max(height, 200);

  const evidenceCount = instance.evidence.length;
  const criteriaCount = pattern.gateCriteria.length;

  // Summary counts for header chip
  const evidenceItems = extractEvidenceItems(instance).slice(0, 8);
  const coveredCount = pattern.gateCriteria
    .slice(0, 15)
    .filter((c) => criterionIsCovered(c, evidenceItems)).length;
  const displayedCriteria = Math.min(criteriaCount, 15);

  return (
    <div
      data-testid="evidence-network-graph"
      style={{
        marginTop: 16,
        border:       `1px solid ${SHELL.CARD_LINE_SOFT}`,
        borderRadius: 10,
        background:   SHELL.CARD_WHITE,
        overflow:     'hidden',
      }}
    >
      {/* Collapsible trigger */}
      <button
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          width:          '100%',
          padding:        '10px 14px',
          background:     'none',
          border:         'none',
          cursor:         'pointer',
          fontFamily:     SHELL.MONO,
          fontSize:       9,
          letterSpacing:  '0.14em',
          textTransform:  'uppercase',
          color:          SHELL.INK_MUTED,
          textAlign:      'left',
        }}
        aria-expanded={open}
        aria-controls="evidence-network-body"
        onClick={() => setOpen((v: boolean) => !v)}
      >
        <span>Evidence Network</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Quick summary chip */}
          <span
            style={{
              background:   SHELL.MINT_BG,
              color:        SHELL.MINT_TEXT,
              fontFamily:   SHELL.MONO,
              fontSize:     9,
              padding:      '1px 6px',
              borderRadius: 999,
              border:       `1px solid ${SHELL.MINT_LINE}`,
            }}
          >
            {coveredCount}/{displayedCriteria} criteria linked
          </span>
          <i
            style={{
              display:    'inline-block',
              transition: 'transform 0.18s ease',
              transform:  open ? 'rotate(90deg)' : 'rotate(0deg)',
              fontStyle:  'normal',
              fontSize:   11,
              color:      SHELL.INK_SOFT,
            }}
          >
            ›
          </i>
        </span>
      </button>

      {/* Body */}
      {open && (
        <div
          id="evidence-network-body"
          style={{
            padding:    '12px 14px 14px',
            borderTop:  `1px solid ${SHELL.CARD_LINE_SOFT}`,
          }}
        >
          {evidenceCount === 0 ? (
            <div
              style={{
                padding:    '20px 0',
                fontFamily: SHELL.SANS,
                fontSize:   13,
                color:      SHELL.INK_MUTED,
              }}
            >
              No evidence recorded
            </div>
          ) : (
            <>
              <NetworkSVG
                instance={instance}
                pattern={pattern}
                width={svgW}
                height={svgH}
              />
              <NetworkLegend />
              <div
                style={{
                  marginTop:    10,
                  fontFamily:   SHELL.MONO,
                  fontSize:     9,
                  color:        SHELL.INK_MUTED,
                  letterSpacing:'0.04em',
                  lineHeight:   1.5,
                }}
                data-honest-disclaimer="evidence-network-graph"
              >
                Edges are keyword-matched against evidence descriptions — deterministic
                approximation only. Up to 15 criteria and 8 evidence items shown.
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default EvidenceNetworkGraph;

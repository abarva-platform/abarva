// I4 · INT-IDX-GRAPH — Server-component Intelligence pattern graph browser.
//
// Knowledge graph browser surface for /intelligence/patterns.
// Consumes PatternGraphShellView (from pattern-graph-shell-view.ts) and
// PatternGraphView (from pattern-graph-read-model.ts) built server-side.
//
// Key I4 additions:
//   • IntelligenceProvenanceRibbon anchored below page header
//   • Graph node list with degree + lifecycle stage
//   • Edge table with kind + weight
//   • Hub pattern callout (degree ≥ threshold)
//   • Server component — no useState, no client hooks
//   • Client island: PatternGraphSentinel (AgentColumn only)
//
// No live model calls, no network requests, no Date.now, no Math.random.

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { IntelligenceProvenanceRibbon } from '@/components/intelligence/IntelligenceProvenanceRibbon';
import { PatternGraphSentinel } from '@/components/intelligence/PatternGraphSentinel';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { PatternGraphShellView } from '@/lib/sentinel/pattern-graph-shell-view';
import type { PatternGraphView, PatternGraphNode, PatternGraphEdge } from '@/lib/sentinel/pattern-graph-read-model';
import type { IntelligenceProvenanceRibbonView } from '@/lib/intelligence/intelligence-provenance-ribbon-view';

// ─── Edge kind color map ───────────────────────────────────────────────────────

const EDGE_KIND_COLOR = {
  implies:       { bg: SHELL.BLUE_BG,  text: '#2a4a7a',       border: SHELL.BLUE_LINE },
  contradicts:   { bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT, border: SHELL.PEACH_LINE },
  co_occurs:     { bg: SHELL.MINT_BG,  text: SHELL.MINT_TEXT,  border: SHELL.MINT_LINE },
  escalates_to:  { bg: SHELL.RUST_BG,  text: SHELL.RUST_TEXT,  border: SHELL.PEACH_LINE },
} as const;

// ─── Lifecycle stage color map ────────────────────────────────────────────────

const LIFECYCLE_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  active:      { bg: SHELL.MINT_BG,  text: SHELL.MINT_TEXT,  border: SHELL.MINT_LINE },
  watch:       { bg: SHELL.BLUE_BG,  text: '#2a4a7a',       border: SHELL.BLUE_LINE },
  deprecated:  { bg: SHELL.GRAY_BG,  text: SHELL.GRAY_TEXT,  border: SHELL.GRAY_LINE },
  candidate:   { bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT, border: SHELL.PEACH_LINE },
};
const defaultLifecycleColor = { bg: SHELL.GRAY_BG, text: SHELL.GRAY_TEXT, border: SHELL.GRAY_LINE };

// ─── Metric card ──────────────────────────────────────────────────────────────

function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 10,
        padding: '16px 20px',
        minWidth: 120,
        flex: '1 1 120px',
      }}
    >
      <div
        style={{
          fontSize: 24,
          fontFamily: SHELL.MONO,
          fontWeight: 700,
          color: SHELL.INK,
          marginBottom: 4,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 11,
          fontFamily: SHELL.SANS,
          fontWeight: 600,
          color: SHELL.INK_MUTED,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 11,
            fontFamily: SHELL.SANS,
            color: SHELL.INK_MUTED,
            marginTop: 2,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

// ─── Pattern node row ─────────────────────────────────────────────────────────

function NodeRow({ node, isHub }: { node: PatternGraphNode; isHub: boolean }) {
  const lifecycleColor = LIFECYCLE_COLOR[node.lifecycleStage] ?? defaultLifecycleColor;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: '10px 16px',
        borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        background: isHub ? SHELL.MINT_BG : 'transparent',
      }}
    >
      {/* Pattern key */}
      <span
        style={{
          flex: '0 0 auto',
          minWidth: 180,
          fontSize: 12,
          fontFamily: SHELL.MONO,
          color: SHELL.INK,
          fontWeight: isHub ? 700 : 400,
        }}
      >
        {node.patternKey}
        {isHub && (
          <span
            style={{
              marginLeft: 6,
              fontSize: 10,
              fontFamily: SHELL.SANS,
              fontWeight: 700,
              color: SHELL.MINT_TEXT,
              background: SHELL.MINT_BG,
              border: `1px solid ${SHELL.MINT_LINE}`,
              borderRadius: 8,
              padding: '1px 6px',
            }}
          >
            HUB
          </span>
        )}
      </span>

      {/* Name */}
      <span
        style={{
          flex: 1,
          fontSize: 13,
          fontFamily: SHELL.SANS,
          color: SHELL.INK_SOFT,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {node.name}
      </span>

      {/* Lifecycle stage pill */}
      <span
        style={{
          flex: '0 0 auto',
          fontSize: 10,
          fontFamily: SHELL.SANS,
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 10,
          background: lifecycleColor.bg,
          color: lifecycleColor.text,
          border: `1px solid ${lifecycleColor.border}`,
        }}
      >
        {node.lifecycleStage}
      </span>

      {/* Degree */}
      <span
        style={{
          flex: '0 0 auto',
          fontSize: 12,
          fontFamily: SHELL.MONO,
          color: isHub ? SHELL.MINT_TEXT : SHELL.INK_MUTED,
          fontWeight: isHub ? 700 : 400,
          minWidth: 36,
          textAlign: 'right',
        }}
      >
        {node.degree}↔
      </span>
    </div>
  );
}

// ─── Edge row ─────────────────────────────────────────────────────────────────

function EdgeRow({ edge }: { edge: PatternGraphEdge }) {
  const kindColor = EDGE_KIND_COLOR[edge.edgeKind];
  const weightPct = `${Math.round(edge.weight * 100)}%`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: '8px 16px',
        borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
      }}
    >
      {/* From */}
      <span
        style={{
          flex: '1 1 0',
          fontSize: 12,
          fontFamily: SHELL.MONO,
          color: SHELL.INK,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {edge.fromPatternKey}
      </span>

      {/* Edge kind pill */}
      <span
        style={{
          flex: '0 0 auto',
          fontSize: 10,
          fontFamily: SHELL.SANS,
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 10,
          background: kindColor.bg,
          color: kindColor.text,
          border: `1px solid ${kindColor.border}`,
          whiteSpace: 'nowrap',
        }}
      >
        {edge.edgeKind.replace(/_/g, ' ')}
      </span>

      {/* To */}
      <span
        style={{
          flex: '1 1 0',
          fontSize: 12,
          fontFamily: SHELL.MONO,
          color: SHELL.INK,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {edge.toPatternKey}
      </span>

      {/* Weight */}
      <span
        style={{
          flex: '0 0 36px',
          fontSize: 11,
          fontFamily: SHELL.MONO,
          color: SHELL.INK_MUTED,
          textAlign: 'right',
        }}
      >
        {weightPct}
      </span>
    </div>
  );
}

// ─── ProvenanceRibbon builder (for graph) ─────────────────────────────────────

function buildGraphProvenanceRibbon(
  totalNodes: number,
  totalEdges: number,
): IntelligenceProvenanceRibbonView {
  return {
    primitive: 'Pattern',
    sourceLabel: 'deterministic_seed',
    storeBinding: 'pattern-graph-read-model.ts · seed edges · no live graph store',
    signalCount: totalEdges,
    programCount: 0,
    citationReadinessLabel: 'not_yet_wired',
    runtimeLabel: 'no live Sentinel / no model invocation',
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PatternGraphShellProps {
  shell: PatternGraphShellView;
  graph: PatternGraphView;
}

export function PatternGraphShell({ shell, graph }: PatternGraphShellProps) {
  const hubPatternKeys = new Set(
    graph.nodes
      .filter((n) => n.degree >= graph.highDegreeThreshold)
      .map((n) => n.patternKey),
  );

  const provenanceRibbon = buildGraphProvenanceRibbon(graph.totalNodes, graph.totalEdges);

  return (
    <AppShell
      surface="intelligence"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Intelligence · Pattern Graph',
      }}
    >
      {/* Sentinel column — client island */}
      <PatternGraphSentinel
        agentQuote="Patterns that cluster together govern together. The graph reveals the hidden load-bearing structure of your intelligence layer — what touches what, what escalates to what."
        agentContext="Sentinel · Pattern Graph · Deterministic seed"
        totalNodes={graph.totalNodes}
        totalEdges={graph.totalEdges}
      />

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', background: SHELL.PAPER, padding: '32px 48px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 64 }}>

        {/* Breadcrumb */}
        <div
          style={{
            fontSize: 12,
            fontFamily: SHELL.SANS,
            color: SHELL.INK_MUTED,
            marginBottom: 16,
          }}
        >
          <Link href="/intelligence" style={{ color: SHELL.INK_MUTED, textDecoration: 'none' }}>
            Intelligence
          </Link>
          {' / '}
          <span style={{ color: SHELL.INK_SOFT }}>Pattern Graph</span>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 8 }}>
          <h1
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 28,
              fontWeight: 400,
              color: SHELL.INK,
              margin: 0,
              marginBottom: 6,
            }}
          >
            Pattern Graph
          </h1>
          <p
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 14,
              color: SHELL.INK_SOFT,
              margin: 0,
              marginBottom: 4,
            }}
          >
            {shell.totalPatterns} patterns · {graph.totalEdges} edges · {shell.highDegreeCount} hub node{shell.highDegreeCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* ProvenanceRibbon */}
        <div style={{ margin: '16px 0 24px' }}>
          <IntelligenceProvenanceRibbon view={provenanceRibbon} />
        </div>

        {/* Honest note */}
        <div
          style={{
            background: SHELL.GRAY_BG,
            border: `1px solid ${SHELL.GRAY_LINE}`,
            borderRadius: 8,
            padding: '10px 16px',
            marginBottom: 24,
            fontSize: 12,
            fontFamily: SHELL.SANS,
            color: SHELL.INK_SOFT,
          }}
        >
          {graph.honestNote}
        </div>

        {/* Summary metrics */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 32,
          }}
          data-testid="graph-metrics"
        >
          <MetricCard label="Patterns" value={graph.totalNodes} />
          <MetricCard label="Edges" value={graph.totalEdges} />
          <MetricCard label="Hub nodes" value={shell.highDegreeCount} sub={`degree ≥ ${graph.highDegreeThreshold}`} />
          <MetricCard label="Active" value={shell.activePatterns} />
        </div>

        {/* Pattern nodes */}
        <section style={{ marginBottom: 32 }}>
          <div
            style={{
              fontSize: 11,
              fontFamily: SHELL.SANS,
              fontWeight: 700,
              color: SHELL.INK_MUTED,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 12,
            }}
          >
            Pattern Nodes ({graph.totalNodes})
          </div>

          {/* Column headers */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 10,
              padding: '6px 16px',
              background: SHELL.PAPER_SOFT,
              borderRadius: '8px 8px 0 0',
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderBottom: 'none',
            }}
          >
            <span style={{ flex: '0 0 auto', minWidth: 180, fontSize: 10, fontFamily: SHELL.SANS, fontWeight: 700, color: SHELL.INK_MUTED, textTransform: 'uppercase' }}>Key</span>
            <span style={{ flex: 1, fontSize: 10, fontFamily: SHELL.SANS, fontWeight: 700, color: SHELL.INK_MUTED, textTransform: 'uppercase' }}>Name</span>
            <span style={{ flex: '0 0 auto', fontSize: 10, fontFamily: SHELL.SANS, fontWeight: 700, color: SHELL.INK_MUTED, textTransform: 'uppercase' }}>Stage</span>
            <span style={{ flex: '0 0 36px', fontSize: 10, fontFamily: SHELL.SANS, fontWeight: 700, color: SHELL.INK_MUTED, textTransform: 'uppercase', textAlign: 'right' }}>Deg</span>
          </div>

          <div
            style={{
              background: SHELL.CARD_WHITE,
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: '0 0 8px 8px',
              overflow: 'hidden',
            }}
            data-testid="pattern-nodes"
          >
            {graph.nodes.map((node) => (
              <NodeRow
                key={node.patternKey}
                node={node}
                isHub={hubPatternKeys.has(node.patternKey)}
              />
            ))}
          </div>
        </section>

        {/* Edge table */}
        <section style={{ marginBottom: 32 }}>
          <div
            style={{
              fontSize: 11,
              fontFamily: SHELL.SANS,
              fontWeight: 700,
              color: SHELL.INK_MUTED,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 12,
            }}
          >
            Edges ({graph.totalEdges})
          </div>

          {/* Edge kind legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {(Object.keys(EDGE_KIND_COLOR) as Array<keyof typeof EDGE_KIND_COLOR>).map((kind) => {
              const color = EDGE_KIND_COLOR[kind];
              return (
                <span
                  key={kind}
                  style={{
                    fontSize: 10,
                    fontFamily: SHELL.SANS,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: color.bg,
                    color: color.text,
                    border: `1px solid ${color.border}`,
                  }}
                >
                  {kind.replace(/_/g, ' ')}
                </span>
              );
            })}
          </div>

          {/* Column headers */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 10,
              padding: '6px 16px',
              background: SHELL.PAPER_SOFT,
              borderRadius: '8px 8px 0 0',
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderBottom: 'none',
            }}
          >
            <span style={{ flex: '1 1 0', fontSize: 10, fontFamily: SHELL.SANS, fontWeight: 700, color: SHELL.INK_MUTED, textTransform: 'uppercase' }}>From</span>
            <span style={{ flex: '0 0 auto', fontSize: 10, fontFamily: SHELL.SANS, fontWeight: 700, color: SHELL.INK_MUTED, textTransform: 'uppercase' }}>Kind</span>
            <span style={{ flex: '1 1 0', fontSize: 10, fontFamily: SHELL.SANS, fontWeight: 700, color: SHELL.INK_MUTED, textTransform: 'uppercase' }}>To</span>
            <span style={{ flex: '0 0 36px', fontSize: 10, fontFamily: SHELL.SANS, fontWeight: 700, color: SHELL.INK_MUTED, textTransform: 'uppercase', textAlign: 'right' }}>Wt</span>
          </div>

          <div
            style={{
              background: SHELL.CARD_WHITE,
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: '0 0 8px 8px',
              overflow: 'hidden',
            }}
            data-testid="pattern-edges"
          >
            {graph.edges.map((edge) => (
              <EdgeRow key={edge.edgeId} edge={edge} />
            ))}
          </div>
        </section>

        {/* Hub patterns callout */}
        {shell.highDegreeCount > 0 && (
          <section style={{ marginBottom: 24 }}>
            <div
              style={{
                background: SHELL.MINT_BG,
                border: `1px solid ${SHELL.MINT_LINE}`,
                borderRadius: 10,
                padding: '16px 20px',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontFamily: SHELL.SANS,
                  fontWeight: 700,
                  color: SHELL.MINT_TEXT,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 8,
                }}
              >
                Hub Patterns — degree ≥ {graph.highDegreeThreshold}
              </div>
              <p
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 13,
                  color: SHELL.INK_SOFT,
                  margin: 0,
                }}
              >
                {shell.highDegreeCount} pattern{shell.highDegreeCount !== 1 ? 's' : ''} with high connectivity.
                Hub patterns are load-bearing nodes in your intelligence layer — changes to these patterns
                propagate widely across the graph.
              </p>
            </div>
          </section>
        )}

      </div>
      </div>
    </AppShell>
  );
}

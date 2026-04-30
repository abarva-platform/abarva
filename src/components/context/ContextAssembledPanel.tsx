'use client';

// ContextAssembledPanel · CB-5
//
// Renders a `ContextBundle` (Postgres facts + graph paths +
// Pinecone semantic chunks + corpus pattern hits) BESIDE an
// agent answer. Per CONTEXT_BROKER_DESIGN.md PR #1249 §5 — the
// panel is the *receipt* for the agent's answer.
//
// This component is pure presentational. It does no fetching;
// callers (CB-4 demo client today, CB-6 chat surface later)
// supply the bundle. Type-only imports from
// `@/lib/knowledge/context-broker` keep the client boundary
// clean — the broker module is `'server-only'`, but the type
// re-exports erase at compile time.
//
// Sections (top to bottom):
//   1. Header (eyebrow with mode badge + serif query + subtitle)
//   2. Facts (TenantRecord cards, capped at 6 with "+N more")
//   3. Graph paths (one-line glyphic representation, Unicode →)
//   4. Semantic chunks (snippet + score badge or KEYWORD MATCH)
//   5. Corpus patterns (only when mode is corpus or full)
//   6. Warnings strip (when bundle.warnings is non-empty)
//   7. Footer (italic guardrail line)
//
// Empty / loading states:
//   - bundle === null  → muted "no context yet" cold-start card
//   - isLoading        → 3-line skeleton shimmer
//
// Brand tokens: only BrandColors / BrandTypography from
// `@/lib/shell/brand-tokens`. No new colors / fonts invented.

import type { CSSProperties, ReactNode } from 'react';
import type {
  BrokerMode,
  ContextBundle,
  ContextProvenance,
  CorpusPatternHit,
  GraphNeighborhood,
  GraphPath,
  SemanticChunkHit,
  TenantRecord,
} from '@/lib/knowledge/context-broker';
import { BrandColors, BrandTypography } from '@/lib/shell/brand-tokens';

// ── Visual tokens (composed from BrandColors only) ──────────────────────────

const PANEL_BG = BrandColors.paper; // #faf7f1 — locked AbarVa paper
const PANEL_BORDER = `1px solid rgba(12,26,58,0.12)`;
const PANEL_RADIUS = 10;

const SECTION_DIVIDER = `1px solid rgba(12,26,58,0.08)`;
const CARD_BG = '#FFFFFF';
const CARD_BORDER = `1px solid rgba(12,26,58,0.10)`;
const CARD_RADIUS = 8;

const QUERY_TRUNCATE_AT = 80;
const FACTS_DISPLAY_LIMIT = 6;
const CHUNKS_DISPLAY_LIMIT = 5;
const NEIGHBORHOOD_EDGE_LIMIT = 3;
const CHUNK_SNIPPET_LIMIT = 200;
const FACT_SUMMARY_LIMIT = 120;

// ── Props ────────────────────────────────────────────────────────────────────

export interface ContextAssembledPanelProps {
  /** The assembled bundle. `null` renders the cold-start empty state. */
  bundle: ContextBundle | null;
  /** When true, renders a 3-line skeleton shimmer instead of the bundle. */
  isLoading?: boolean;
  /**
   * Optional click-through handler for citations (fact cards,
   * chunk cards, pattern rows). Receives the matching
   * `ContextProvenance` entry (sourceId, sourceClass, etc.).
   */
  onCitationClick?: (provenance: ContextProvenance) => void;
}

// ── Mode palette (header eyebrow) ───────────────────────────────────────────

const MODE_TONE: Record<BrokerMode, { fg: string; bg: string; label: string }> = {
  generic: {
    fg: BrandColors.slate,
    bg: 'rgba(95,94,90,0.10)',
    label: 'GENERIC',
  },
  corpus: {
    fg: BrandColors.signalBlue,
    bg: 'rgba(0,102,204,0.10)',
    label: 'CORPUS',
  },
  tenant: {
    // Sage-green family per design doc §5.2 — derived from
    // a darker readable tone of the spec's tenant_admin_upload
    // sage-green; kept inside the slate/navy ink family so we
    // don't invent a new brand palette entry.
    fg: '#1f6f4a',
    bg: 'rgba(31,111,74,0.12)',
    label: 'TENANT',
  },
  full: {
    // Slate-purple — distinct from generic/corpus/tenant but
    // composed from the locked navy ink + signal blue family.
    fg: '#5b3a8a',
    bg: 'rgba(91,58,138,0.12)',
    label: 'FULL',
  },
};

// ── Source-class palette (left-border on cards) ─────────────────────────────

const SOURCE_CLASS_BORDER: Record<ContextProvenance['sourceClass'], string> = {
  tenant_admin_upload: '#7E9E7E', // sage green
  corpus: '#5C7191', // slate blue
  pattern_catalog: '#5C7191',
  synthetic: '#B89352', // warm ochre
  unknown: 'rgba(12,26,58,0.20)',
};

// ── Tiny UI primitives ───────────────────────────────────────────────────────

function Eyebrow({
  children,
  color,
  style,
  testid,
}: {
  children: ReactNode;
  color?: string;
  style?: CSSProperties;
  testid?: string;
}) {
  return (
    <div
      data-testid={testid}
      style={{
        fontFamily: BrandTypography.mono,
        fontSize: 10,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: color ?? BrandColors.slate,
        fontWeight: 600,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function MonoMeta({
  children,
  style,
  testid,
}: {
  children: ReactNode;
  style?: CSSProperties;
  testid?: string;
}) {
  return (
    <span
      data-testid={testid}
      style={{
        fontFamily: BrandTypography.mono,
        fontSize: 10.5,
        letterSpacing: '0.04em',
        color: BrandColors.slate,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function CountBadge({ n }: { n: number }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 20,
        padding: '0 6px',
        height: 16,
        borderRadius: 999,
        background: 'rgba(12,26,58,0.06)',
        color: BrandColors.navyInk,
        fontFamily: BrandTypography.mono,
        fontSize: 10,
        fontWeight: 700,
        lineHeight: '16px',
      }}
    >
      {n}
    </span>
  );
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
      }}
    >
      <Eyebrow style={{ color: BrandColors.navyInk }}>{label}</Eyebrow>
      <CountBadge n={count} />
    </div>
  );
}

function EmptyLine({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        margin: 0,
        fontFamily: BrandTypography.sans,
        fontSize: 12,
        fontStyle: 'italic',
        color: BrandColors.stone,
        lineHeight: 1.5,
      }}
    >
      {children}
    </p>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function truncate(input: string, max: number): string {
  if (input.length <= max) return input;
  const slice = input.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${cut}…`;
}

/**
 * Inlined relativeTime — `'just now'` / `Ns ago` / `Nm ago` /
 * `Nh ago` / `Nd ago`. The repo's existing helper
 * (`src/components/programs/common.tsx`) is a client-only
 * surface; pulling it would couple this panel to the programs
 * module. Per the spec: "If no relativeTime helper exists,
 * inline a small one."
 */
function relativeTime(iso: string, now: Date = new Date()): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return iso;
  const diffMs = now.getTime() - then;
  const sec = Math.max(0, Math.round(diffMs / 1000));
  if (sec < 5) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.round(hr / 24);
  return `${days}d ago`;
}

/** One-line summary for a TenantRecord, kind-aware where possible. */
function summarizeFact(record: TenantRecord): string {
  const payload = record.payload as Record<string, unknown>;
  if (record.recordKind === 'kpi_definition') {
    const cur = payload['current_value'] ?? payload['currentValue'];
    const tgt = payload['target_fy2026'] ?? payload['target'] ?? payload['targetValue'];
    if (cur !== undefined || tgt !== undefined) {
      const left = cur !== undefined ? `current ${String(cur)}` : '';
      const right = tgt !== undefined ? `target ${String(tgt)}` : '';
      return [left, right].filter(Boolean).join(' · ');
    }
  }
  if (record.recordKind === 'systems_inventory' || record.recordKind === 'system_record') {
    const vendor = payload['vendor'] ?? payload['vendor_name'];
    const status = payload['status'] ?? payload['lifecycle_status'];
    if (vendor !== undefined || status !== undefined) {
      const left = vendor !== undefined ? String(vendor) : '';
      const right = status !== undefined ? String(status) : '';
      return [left, right].filter(Boolean).join(' · ');
    }
  }
  // Fallback: stringify the payload and clip to FACT_SUMMARY_LIMIT.
  let stringified: string;
  try {
    stringified = JSON.stringify(payload);
  } catch {
    stringified = '[unserializable payload]';
  }
  if (stringified === '{}' || stringified === 'null') {
    return record.sourceBasis ?? record.recordId;
  }
  return truncate(stringified, FACT_SUMMARY_LIMIT);
}

/** Color a node id by its kind prefix (`person:`, `system:`, ...). */
function nodeColor(nodeId: string): string {
  const prefix = nodeId.split(':')[0];
  switch (prefix) {
    case 'person':
      return '#1f6f4a';
    case 'system':
      return BrandColors.signalBlue;
    case 'vendor':
      return '#B89352';
    case 'kpi':
      return '#5b3a8a';
    case 'program':
      return BrandColors.navyInk;
    case 'evidence':
      return '#5C7191';
    case 'enterprise':
      return BrandColors.inkBlack;
    default:
      return BrandColors.slate;
  }
}

function NodeChip({ nodeId, label }: { nodeId: string; label?: string }) {
  return (
    <span
      style={{
        fontFamily: BrandTypography.mono,
        fontSize: 11,
        fontWeight: 600,
        color: nodeColor(nodeId),
      }}
    >
      {label ?? nodeId}
    </span>
  );
}

function EdgeArrow({ kind }: { kind: string }) {
  return (
    <span
      style={{
        fontFamily: BrandTypography.mono,
        fontSize: 11,
        fontStyle: 'italic',
        color: BrandColors.slate,
        margin: '0 2px',
      }}
    >
      → <em style={{ fontStyle: 'italic' }}>{kind}</em> →
    </span>
  );
}

function isGraphPath(p: GraphNeighborhood | GraphPath): p is GraphPath {
  return 'fromId' in p && 'toId' in p;
}

// ── Header ───────────────────────────────────────────────────────────────────

function Header({ bundle }: { bundle: ContextBundle }) {
  const tone = MODE_TONE[bundle.mode];
  const subtitle = `${bundle.facts.length} facts · ${bundle.graphPaths.length} graph paths · ${bundle.semanticChunks.length} chunks · ${bundle.corpusPatterns.length} corpus patterns`;
  return (
    <header style={{ display: 'grid', gap: 6, marginBottom: 10 }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <Eyebrow style={{ color: BrandColors.slate }}>CONTEXT ASSEMBLED</Eyebrow>
        <span
          data-testid="context-panel-mode-badge"
          data-mode={bundle.mode}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '1px 8px',
            borderRadius: 999,
            background: tone.bg,
            color: tone.fg,
            fontFamily: BrandTypography.mono,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.10em',
          }}
        >
          MODE · {tone.label}
        </span>
      </div>
      <h2
        data-testid="context-panel-query"
        style={{
          margin: 0,
          fontFamily: BrandTypography.serif,
          fontSize: 18,
          fontWeight: 400,
          color: BrandColors.inkBlack,
          letterSpacing: '-0.005em',
          lineHeight: 1.3,
        }}
      >
        {truncate(bundle.query, QUERY_TRUNCATE_AT)}
      </h2>
      <MonoMeta>
        Assembled {relativeTime(bundle.assembledAt)} · {subtitle}
      </MonoMeta>
    </header>
  );
}

// ── Facts section ────────────────────────────────────────────────────────────

function FactCard({
  record,
  provenance,
  onClick,
}: {
  record: TenantRecord;
  provenance: ContextProvenance | undefined;
  onClick?: () => void;
}) {
  const sourceClass = provenance?.sourceClass ?? 'unknown';
  const borderColor = SOURCE_CLASS_BORDER[sourceClass];
  const summary = summarizeFact(record);
  const confidenceLabel =
    record.confidence !== undefined && record.confidence !== null
      ? record.confidence.toFixed(2)
      : 'unknown';
  const classification = record.classification ?? 'internal';
  const interactive = Boolean(onClick);
  const Element = interactive ? 'button' : 'div';
  return (
    <Element
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      data-testid={`context-panel-fact-${record.recordId}`}
      data-source-class={sourceClass}
      style={{
        appearance: 'none',
        textAlign: 'left',
        background: CARD_BG,
        border: CARD_BORDER,
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: CARD_RADIUS,
        padding: '8px 10px',
        display: 'grid',
        gap: 4,
        cursor: interactive ? 'pointer' : 'default',
        font: 'inherit',
        color: 'inherit',
        width: '100%',
      }}
    >
      <Eyebrow style={{ color: borderColor }}>{record.recordKind}</Eyebrow>
      <div
        style={{
          fontFamily: BrandTypography.serif,
          fontSize: 13.5,
          color: BrandColors.inkBlack,
          lineHeight: 1.35,
          fontWeight: 400,
        }}
      >
        {record.title || record.recordId}
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: BrandTypography.sans,
          fontSize: 12,
          color: BrandColors.slate,
          lineHeight: 1.45,
        }}
      >
        {summary}
      </p>
      <MonoMeta style={{ fontSize: 9.5, color: BrandColors.stone }}>
        confidence {confidenceLabel} · {classification}
      </MonoMeta>
    </Element>
  );
}

function FactsSection({
  facts,
  provenanceById,
  onCitationClick,
}: {
  facts: ReadonlyArray<TenantRecord>;
  provenanceById: Map<string, ContextProvenance>;
  onCitationClick?: (provenance: ContextProvenance) => void;
}) {
  return (
    <section data-testid="context-panel-section-facts" style={{ paddingBottom: 12 }}>
      <SectionHeader label="FACTS (POSTGRES)" count={facts.length} />
      {facts.length === 0 ? (
        <EmptyLine>No structured facts retrieved.</EmptyLine>
      ) : (
        <div style={{ display: 'grid', gap: 6 }}>
          {facts.slice(0, FACTS_DISPLAY_LIMIT).map((record) => {
            const prov = provenanceById.get(record.recordId);
            return (
              <FactCard
                key={record.recordId}
                record={record}
                provenance={prov}
                onClick={
                  prov && onCitationClick
                    ? () => onCitationClick(prov)
                    : undefined
                }
              />
            );
          })}
          {facts.length > FACTS_DISPLAY_LIMIT ? (
            <MonoMeta>+{facts.length - FACTS_DISPLAY_LIMIT} more not shown</MonoMeta>
          ) : null}
        </div>
      )}
    </section>
  );
}

// ── Graph paths section ──────────────────────────────────────────────────────

function NeighborhoodLine({ neighborhood }: { neighborhood: GraphNeighborhood }) {
  const rootNode = neighborhood.nodes.find((n) => n.nodeId === neighborhood.rootId);
  const rootLabel = rootNode?.title ?? neighborhood.rootId;
  const nodeLabelById = new Map(neighborhood.nodes.map((n) => [n.nodeId, n.title]));
  const edges = neighborhood.edges.filter(
    (e) => e.fromNodeId === neighborhood.rootId || e.toNodeId === neighborhood.rootId,
  );
  const visible = edges.slice(0, NEIGHBORHOOD_EDGE_LIMIT);
  const truncated = edges.length - visible.length;
  return (
    <div
      data-testid={`context-panel-graph-neighborhood-${neighborhood.rootId}`}
      style={{ display: 'grid', gap: 2 }}
    >
      {visible.map((edge, idx) => {
        const otherId = edge.fromNodeId === neighborhood.rootId ? edge.toNodeId : edge.fromNodeId;
        const otherLabel = nodeLabelById.get(otherId);
        return (
          <div
            key={`${edge.edgeId}-${idx}`}
            data-testid={`context-panel-graph-edge-${edge.edgeId}`}
            style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}
          >
            <NodeChip nodeId={neighborhood.rootId} label={rootLabel} />
            <EdgeArrow kind={edge.kind} />
            <NodeChip nodeId={otherId} label={otherLabel} />
          </div>
        );
      })}
      {truncated > 0 ? (
        <MonoMeta testid={`context-panel-graph-truncated-${neighborhood.rootId}`}>
          +{truncated} more
        </MonoMeta>
      ) : null}
    </div>
  );
}

function PathLine({ path, index }: { path: GraphPath; index: number }) {
  const nodeIds: string[] = [];
  if (path.edges.length === 0) {
    nodeIds.push(path.fromId, path.toId);
  } else {
    nodeIds.push(path.fromId);
    for (const edge of path.edges) {
      nodeIds.push(edge.toNodeId);
    }
  }
  return (
    <div
      data-testid={`context-panel-graph-path-${index}`}
      style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}
    >
      <NodeChip nodeId={path.fromId} />
      {path.edges.map((edge, edgeIdx) => (
        <span
          key={`${edge.edgeId}-${edgeIdx}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}
        >
          <EdgeArrow kind={edge.kind} />
          <NodeChip nodeId={edge.toNodeId} />
        </span>
      ))}
      {path.edges.length === 0 ? (
        <>
          <span
            style={{
              fontFamily: BrandTypography.mono,
              fontSize: 11,
              color: BrandColors.slate,
              margin: '0 4px',
            }}
          >
            →
          </span>
          <NodeChip nodeId={path.toId} />
        </>
      ) : null}
    </div>
  );
}

function GraphPathsSection({
  paths,
}: {
  paths: ReadonlyArray<GraphNeighborhood | GraphPath>;
}) {
  return (
    <section data-testid="context-panel-section-graph" style={{ paddingBottom: 12 }}>
      <SectionHeader label="GRAPH RELATIONSHIPS" count={paths.length} />
      {paths.length === 0 ? (
        <EmptyLine>No graph paths traversed.</EmptyLine>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {paths.map((p, i) =>
            isGraphPath(p) ? (
              <PathLine key={`path-${i}`} path={p} index={i} />
            ) : (
              <NeighborhoodLine key={`hood-${p.rootId}-${i}`} neighborhood={p} />
            ),
          )}
        </div>
      )}
    </section>
  );
}

// ── Semantic chunks section ──────────────────────────────────────────────────

function ChunkCard({
  hit,
  provenance,
  index,
  onClick,
}: {
  hit: SemanticChunkHit;
  provenance: ContextProvenance | undefined;
  index: number;
  onClick?: () => void;
}) {
  const sourceClass = provenance?.sourceClass ?? 'unknown';
  const borderColor = SOURCE_CLASS_BORDER[sourceClass];
  const eyebrowText =
    hit.score && hit.score > 0
      ? `${(hit.score * 100).toFixed(0)}%`
      : 'KEYWORD MATCH';
  const interactive = Boolean(onClick);
  const Element = interactive ? 'button' : 'div';
  return (
    <Element
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      data-testid={`context-panel-chunk-${index}`}
      data-source-class={sourceClass}
      data-score-mode={hit.score && hit.score > 0 ? 'vector' : 'keyword'}
      style={{
        appearance: 'none',
        textAlign: 'left',
        background: CARD_BG,
        border: CARD_BORDER,
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: CARD_RADIUS,
        padding: '8px 10px',
        display: 'grid',
        gap: 4,
        cursor: interactive ? 'pointer' : 'default',
        font: 'inherit',
        color: 'inherit',
        width: '100%',
      }}
    >
      <Eyebrow color={borderColor} testid={`context-panel-chunk-score-${index}`}>
        {eyebrowText}
      </Eyebrow>
      <p
        style={{
          margin: 0,
          fontFamily: BrandTypography.sans,
          fontSize: 12.5,
          color: BrandColors.inkBlack,
          lineHeight: 1.5,
        }}
      >
        {truncate(hit.chunk.text, CHUNK_SNIPPET_LIMIT)}
      </p>
      <MonoMeta style={{ fontSize: 9.5, color: BrandColors.stone }}>
        {hit.chunk.sourceBasis ?? 'unknown'} · {hit.chunk.classification ?? 'internal'} ·{' '}
        {hit.chunk.recordId ?? '—'}
      </MonoMeta>
    </Element>
  );
}

function ChunksSection({
  chunks,
  provenanceById,
  onCitationClick,
}: {
  chunks: ReadonlyArray<SemanticChunkHit>;
  provenanceById: Map<string, ContextProvenance>;
  onCitationClick?: (provenance: ContextProvenance) => void;
}) {
  return (
    <section data-testid="context-panel-section-chunks" style={{ paddingBottom: 12 }}>
      <SectionHeader label="SEMANTIC CHUNKS (PINECONE)" count={chunks.length} />
      {chunks.length === 0 ? (
        <EmptyLine>
          No semantic chunks retrieved (vector retrieval may not be live yet).
        </EmptyLine>
      ) : (
        <div style={{ display: 'grid', gap: 6 }}>
          {chunks.slice(0, CHUNKS_DISPLAY_LIMIT).map((hit, i) => {
            const prov = provenanceById.get(hit.chunk.chunkId);
            return (
              <ChunkCard
                key={hit.chunk.chunkId}
                hit={hit}
                provenance={prov}
                index={i}
                onClick={
                  prov && onCitationClick
                    ? () => onCitationClick(prov)
                    : undefined
                }
              />
            );
          })}
          {chunks.length > CHUNKS_DISPLAY_LIMIT ? (
            <MonoMeta>+{chunks.length - CHUNKS_DISPLAY_LIMIT} more not shown</MonoMeta>
          ) : null}
        </div>
      )}
    </section>
  );
}

// ── Corpus patterns section ──────────────────────────────────────────────────

function PatternRow({
  pattern,
  onClick,
}: {
  pattern: CorpusPatternHit;
  onClick?: () => void;
}) {
  const interactive = Boolean(onClick);
  const Element = interactive ? 'button' : 'div';
  return (
    <Element
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      data-testid={`context-panel-pattern-${pattern.patternId}`}
      style={{
        appearance: 'none',
        textAlign: 'left',
        background: 'transparent',
        border: 'none',
        padding: '6px 0',
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        flexWrap: 'wrap',
        font: 'inherit',
        color: 'inherit',
        cursor: interactive ? 'pointer' : 'default',
        width: '100%',
        borderBottom: SECTION_DIVIDER,
      }}
    >
      <span
        style={{
          fontFamily: BrandTypography.mono,
          fontSize: 11,
          fontWeight: 600,
          color: BrandColors.signalBlue,
          letterSpacing: '0.02em',
        }}
      >
        {pattern.patternId}
      </span>
      <span
        style={{
          fontFamily: BrandTypography.sans,
          fontSize: 12.5,
          color: BrandColors.inkBlack,
          flex: '1 1 auto',
          minWidth: 0,
        }}
      >
        {pattern.patternName}
      </span>
      {typeof pattern.score === 'number' ? (
        <span
          data-testid={`context-panel-pattern-score-${pattern.patternId}`}
          style={{
            fontFamily: BrandTypography.mono,
            fontSize: 10,
            color: BrandColors.slate,
            background: 'rgba(0,102,204,0.08)',
            padding: '0 6px',
            borderRadius: 999,
            fontWeight: 700,
          }}
        >
          {(pattern.score * 100).toFixed(0)}%
        </span>
      ) : null}
    </Element>
  );
}

function PatternsSection({
  patterns,
  mode,
  onCitationClick,
  provenanceById,
}: {
  patterns: ReadonlyArray<CorpusPatternHit>;
  mode: BrokerMode;
  onCitationClick?: (provenance: ContextProvenance) => void;
  provenanceById: Map<string, ContextProvenance>;
}) {
  // Spec: only when mode is corpus or full.
  if (mode !== 'corpus' && mode !== 'full') return null;
  return (
    <section data-testid="context-panel-section-patterns" style={{ paddingBottom: 12 }}>
      <SectionHeader label="CORPUS PATTERNS" count={patterns.length} />
      {patterns.length === 0 ? (
        <EmptyLine>No corpus patterns matched.</EmptyLine>
      ) : (
        <div style={{ display: 'grid' }}>
          {patterns.map((p) => {
            const prov = provenanceById.get(p.patternId);
            return (
              <PatternRow
                key={p.patternId}
                pattern={p}
                onClick={
                  prov && onCitationClick
                    ? () => onCitationClick(prov)
                    : undefined
                }
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

// ── Warnings strip + footer ─────────────────────────────────────────────────

function WarningsStrip({ warnings }: { warnings: ReadonlyArray<string> }) {
  if (warnings.length === 0) return null;
  return (
    <div
      data-testid="context-panel-warnings"
      style={{
        background: 'rgba(184,147,82,0.10)',
        border: '1px solid rgba(184,147,82,0.32)',
        borderRadius: CARD_RADIUS,
        padding: '8px 10px',
        display: 'grid',
        gap: 4,
        marginTop: 4,
      }}
    >
      <Eyebrow style={{ color: '#8a6a2e' }}>Warnings · {warnings.length}</Eyebrow>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {warnings.map((w, i) => (
          <li
            key={i}
            data-testid={`context-panel-warning-${i}`}
            style={{
              fontFamily: BrandTypography.sans,
              fontSize: 12,
              color: '#6b521e',
              lineHeight: 1.5,
            }}
          >
            {w}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Footer() {
  return (
    <footer
      style={{
        marginTop: 8,
        paddingTop: 8,
        borderTop: SECTION_DIVIDER,
      }}
    >
      <p
        data-testid="context-panel-guardrail"
        style={{
          margin: 0,
          fontFamily: BrandTypography.sans,
          fontSize: 11.5,
          fontStyle: 'italic',
          color: BrandColors.stone,
          lineHeight: 1.5,
        }}
      >
        Only claims supported by retrieved context are allowed.
      </p>
    </footer>
  );
}

// ── Empty / loading states ──────────────────────────────────────────────────

function ColdStart() {
  return (
    <aside
      data-testid="context-assembled-panel"
      data-state="empty"
      aria-live="polite"
      aria-label="Context Assembled"
      style={panelRootStyle}
    >
      <Eyebrow style={{ color: BrandColors.stone }}>CONTEXT ASSEMBLED · IDLE</Eyebrow>
      <p
        data-testid="context-panel-empty"
        style={{
          margin: '8px 0 0 0',
          fontFamily: BrandTypography.serif,
          fontSize: 16,
          fontWeight: 400,
          color: BrandColors.slate,
          lineHeight: 1.4,
        }}
      >
        No context assembled yet. Submit a query.
      </p>
    </aside>
  );
}

function LoadingSkeleton() {
  const lines = [70, 88, 56];
  return (
    <aside
      data-testid="context-assembled-panel"
      data-state="loading"
      aria-busy="true"
      aria-live="polite"
      aria-label="Context Assembled"
      style={panelRootStyle}
    >
      <Eyebrow style={{ color: BrandColors.stone }}>CONTEXT ASSEMBLED · LOADING</Eyebrow>
      <div
        data-testid="context-panel-skeleton"
        style={{ display: 'grid', gap: 10, marginTop: 12 }}
      >
        {lines.map((widthPct, i) => (
          <div
            key={i}
            data-testid={`context-panel-skeleton-line-${i}`}
            style={{
              height: 10,
              width: `${widthPct}%`,
              borderRadius: 4,
              background:
                'linear-gradient(90deg, rgba(12,26,58,0.06), rgba(12,26,58,0.10), rgba(12,26,58,0.06))',
            }}
          />
        ))}
      </div>
    </aside>
  );
}

// ── Root style ───────────────────────────────────────────────────────────────

const panelRootStyle: CSSProperties = {
  background: PANEL_BG,
  border: PANEL_BORDER,
  borderRadius: PANEL_RADIUS,
  padding: 16,
  maxWidth: 480,
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: BrandTypography.sans,
  color: BrandColors.inkBlack,
};

// ── Main component ──────────────────────────────────────────────────────────

export function ContextAssembledPanel({
  bundle,
  isLoading = false,
  onCitationClick,
}: ContextAssembledPanelProps) {
  if (isLoading) return <LoadingSkeleton />;
  if (bundle === null) return <ColdStart />;

  const provenanceById = new Map<string, ContextProvenance>(
    bundle.provenance.map((p) => [p.sourceId, p]),
  );

  return (
    <aside
      data-testid="context-assembled-panel"
      data-state="ready"
      data-mode={bundle.mode}
      aria-live="polite"
      aria-label="Context Assembled"
      style={panelRootStyle}
    >
      <Header bundle={bundle} />
      <div style={{ borderTop: SECTION_DIVIDER, paddingTop: 12 }}>
        <FactsSection
          facts={bundle.facts}
          provenanceById={provenanceById}
          onCitationClick={onCitationClick}
        />
      </div>
      <div style={{ borderTop: SECTION_DIVIDER, paddingTop: 12 }}>
        <GraphPathsSection paths={bundle.graphPaths} />
      </div>
      <div style={{ borderTop: SECTION_DIVIDER, paddingTop: 12 }}>
        <ChunksSection
          chunks={bundle.semanticChunks}
          provenanceById={provenanceById}
          onCitationClick={onCitationClick}
        />
      </div>
      {bundle.mode === 'corpus' || bundle.mode === 'full' ? (
        <div style={{ borderTop: SECTION_DIVIDER, paddingTop: 12 }}>
          <PatternsSection
            patterns={bundle.corpusPatterns}
            mode={bundle.mode}
            provenanceById={provenanceById}
            onCitationClick={onCitationClick}
          />
        </div>
      ) : null}
      <WarningsStrip warnings={bundle.warnings} />
      <Footer />
    </aside>
  );
}

export default ContextAssembledPanel;

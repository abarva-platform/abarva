/**
 * ContextAssembledPanel · CB-5
 *
 * Renders a `ContextBundle` beside an agent answer. The panel
 * is the *receipt* for the answer: per-section count, source-
 * class color coding, click-through provenance.
 *
 * Per CONTEXT_BROKER_DESIGN.md §5. Six sections:
 *   1. Header (query + mode badge + tenant + assembled-at)
 *   2. Facts
 *   3. Graph paths
 *   4. Semantic chunks
 *   5. Corpus patterns
 *   6. Footer (guardrail badge + telemetry summary)
 *
 * Design system:
 *   - Cream background, Georgia serif section titles, DM Sans
 *     body, mono for metadata (per AbarVa Design System v2)
 *   - Per-source-class left-border colors (sage-green for
 *     tenant_admin_upload, slate-blue for corpus/pattern,
 *     warm-ochre for synthetic)
 *   - Empty/partial states explicit per §5.4
 *
 * a11y:
 *   - aria-live="polite" on root so updates are announced
 *   - Each citation is a real button with sourceId as its name
 *   - Color is decorative only; every section also carries a
 *     text label
 */

import Link from 'next/link';

import type {
  ContextBundle,
  ContextProvenance,
  CorpusPatternHit,
  GraphNeighborhood,
  GraphPath,
  SemanticChunkHit,
  TenantRecord,
} from '@/lib/knowledge/context-broker';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

// Source-class palettes per design doc §5.2.
const SAGE_GREEN = '#7E9E7E';
const SLATE_BLUE = '#5C7191';
const WARM_OCHRE = '#B89352';
const NEUTRAL_BORDER = `${COLORS.ink}33`;

function sourceClassBorder(sourceClass: ContextProvenance['sourceClass'] | null): string {
  switch (sourceClass) {
    case 'tenant_admin_upload':
      return SAGE_GREEN;
    case 'corpus':
    case 'pattern_catalog':
      return SLATE_BLUE;
    case 'synthetic':
      return WARM_OCHRE;
    default:
      return NEUTRAL_BORDER;
  }
}

function sourceClassLabel(sourceClass: ContextProvenance['sourceClass'] | null): string {
  switch (sourceClass) {
    case 'tenant_admin_upload':
      return 'Tenant data';
    case 'corpus':
      return 'Corpus';
    case 'pattern_catalog':
      return 'Pattern catalog';
    case 'synthetic':
      return 'Synthetic';
    case 'unknown':
      return 'Source unknown';
    default:
      return 'Source unknown';
  }
}

export interface ContextAssembledPanelProps {
  bundle: ContextBundle;
  /**
   * When set, renders a "Last assembled X seconds ago" line
   * relative to this timestamp; otherwise renders the assembled-
   * at value verbatim.
   */
  now?: Date;
}

export function ContextAssembledPanel({ bundle, now }: ContextAssembledPanelProps) {
  // Generic mode collapses to a single line per design doc §5.4.
  if (bundle.mode === 'generic') {
    return (
      <aside
        data-testid="context-assembled-panel"
        data-mode="generic"
        aria-live="polite"
        aria-label="Context Assembled"
        style={panelRootStyle}
      >
        <p
          data-testid="context-assembled-empty-generic"
          style={{
            margin: 0,
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 16,
            color: `${COLORS.ink}cc`,
            lineHeight: 1.5,
          }}
        >
          No context assembled (generic mode).
        </p>
      </aside>
    );
  }

  const provenanceById = new Map(bundle.provenance.map((p) => [p.sourceId, p]));

  return (
    <aside
      data-testid="context-assembled-panel"
      data-mode={bundle.mode}
      data-tenant-key={bundle.tenantKey ?? ''}
      aria-live="polite"
      aria-label="Context Assembled"
      style={panelRootStyle}
    >
      <Header bundle={bundle} now={now} />
      {bundle.warnings.length > 0 ? <Warnings warnings={bundle.warnings} /> : null}
      <FactsSection facts={bundle.facts} provenanceById={provenanceById} />
      <GraphPathsSection paths={bundle.graphPaths} />
      <ChunksSection chunks={bundle.semanticChunks} provenanceById={provenanceById} />
      <PatternsSection patterns={bundle.corpusPatterns} />
      <Footer bundle={bundle} />
    </aside>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Header({ bundle, now }: { bundle: ContextBundle; now?: Date }) {
  const assembledAt = new Date(bundle.assembledAt);
  const display = now
    ? `${secondsAgo(assembledAt, now)} ago`
    : assembledAt.toISOString().slice(11, 19) + ' UTC';
  return (
    <header
      data-testid="context-panel-header"
      style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xs }}
    >
      <p style={sectionEyebrowStyle}>Context assembled</p>
      <p
        style={{
          margin: 0,
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 16,
          color: COLORS.ink,
          lineHeight: 1.4,
        }}
      >
        {bundle.query}
      </p>
      <div
        style={{
          display: 'flex',
          gap: SPACING.sm,
          alignItems: 'center',
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: `${COLORS.ink}99`,
          flexWrap: 'wrap',
        }}
      >
        <ModeBadge mode={bundle.mode} />
        <span data-testid="context-panel-assembled-at">{display}</span>
        {bundle.tenantKey ? (
          <span data-testid="context-panel-tenant-key">tenant {bundle.tenantKey}</span>
        ) : null}
      </div>
    </header>
  );
}

function ModeBadge({ mode }: { mode: ContextBundle['mode'] }) {
  const palette: Record<ContextBundle['mode'], { bg: string; fg: string }> = {
    generic: { bg: COLORS.cream, fg: `${COLORS.ink}99` },
    corpus: { bg: COLORS.skyPale, fg: COLORS.navy },
    tenant: { bg: COLORS.mintSoft, fg: COLORS.mintInk },
    full: { bg: COLORS.amberSoft, fg: COLORS.amberInk },
  };
  const tone = palette[mode];
  return (
    <span
      data-testid={`context-panel-mode-${mode}`}
      style={{
        display: 'inline-block',
        padding: `2px ${SPACING.sm}`,
        background: tone.bg,
        color: tone.fg,
        borderRadius: RADIUS.pill,
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      }}
    >
      {mode}
    </span>
  );
}

function Warnings({ warnings }: { warnings: string[] }) {
  return (
    <div
      data-testid="context-panel-warnings"
      style={{
        background: COLORS.amberSoft,
        border: `1px solid ${COLORS.amberInk}33`,
        borderRadius: RADIUS.sm,
        padding: SPACING.sm,
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: COLORS.amberInk,
          fontWeight: 700,
        }}
      >
        Warnings ({warnings.length})
      </p>
      <ul style={{ margin: `${SPACING.xs} 0 0`, padding: `0 0 0 ${SPACING.md}` }}>
        {warnings.map((w, i) => (
          <li
            key={i}
            data-testid={`context-panel-warning-${i}`}
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: COLORS.amberInk,
              lineHeight: 1.4,
            }}
          >
            {w}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FactsSection({
  facts,
  provenanceById,
}: {
  facts: ReadonlyArray<TenantRecord>;
  provenanceById: Map<string, ContextProvenance>;
}) {
  if (facts.length === 0) {
    return (
      <Section title={`Facts (0)`} testid="context-panel-section-facts" empty>
        <EmptyLine label="No tenant facts cited." testid="context-panel-facts-empty" />
      </Section>
    );
  }
  const sorted = [...facts].sort((a, b) => {
    const aConf = provenanceById.get(a.recordId)?.confidence ?? 0;
    const bConf = provenanceById.get(b.recordId)?.confidence ?? 0;
    return bConf - aConf;
  });
  return (
    <Section title={`Facts (${facts.length})`} testid="context-panel-section-facts">
      <ul role="list" style={listResetStyle}>
        {sorted.map((fact) => {
          const prov = provenanceById.get(fact.recordId) ?? null;
          return (
            <li
              key={fact.recordId}
              role="listitem"
              data-testid={`context-panel-fact-${fact.recordId}`}
              style={{
                ...itemCardStyle,
                borderLeft: `3px solid ${sourceClassBorder(prov?.sourceClass ?? null)}`,
              }}
            >
              <p style={itemTitleStyle}>{fact.title || fact.recordKind}</p>
              <div style={chipRowStyle}>
                <Chip label={fact.segmentId} testid={`context-panel-fact-segment-${fact.recordId}`} />
                <Chip label={fact.recordKind} testid={`context-panel-fact-kind-${fact.recordId}`} />
                {prov?.confidence !== undefined && prov.confidence !== null ? (
                  <ConfidenceDot confidence={prov.confidence} />
                ) : null}
                <SourceClassChip sourceClass={prov?.sourceClass ?? null} />
              </div>
              {prov?.sourceDoc ? (
                <p
                  style={metaLineStyle}
                  data-testid={`context-panel-fact-source-${fact.recordId}`}
                >
                  Source: {prov.sourceDoc}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

function GraphPathsSection({
  paths,
}: {
  paths: ReadonlyArray<GraphNeighborhood | GraphPath>;
}) {
  if (paths.length === 0) {
    return (
      <Section
        title={`Graph paths (0)`}
        testid="context-panel-section-graph"
        empty
      >
        <EmptyLine label="No graph paths traversed." testid="context-panel-graph-empty" />
      </Section>
    );
  }
  return (
    <Section title={`Graph paths (${paths.length})`} testid="context-panel-section-graph">
      <ul role="list" style={listResetStyle}>
        {paths.map((path, i) => (
          <li
            key={i}
            role="listitem"
            data-testid={`context-panel-graph-path-${i}`}
            style={{
              ...itemRowStyle,
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: COLORS.ink,
              wordBreak: 'break-word',
            }}
          >
            {renderGraphPath(path)}
          </li>
        ))}
      </ul>
    </Section>
  );
}

function renderGraphPath(path: GraphNeighborhood | GraphPath): string {
  if ('rootId' in path) {
    // GraphNeighborhood shape — root + spokes
    const edgeCount = path.edges.length;
    return `${path.rootId} (neighborhood, ${edgeCount} edge${edgeCount === 1 ? '' : 's'})`;
  }
  // GraphPath shape — edges chain
  if (path.edges.length === 0) return `${path.fromId} → ${path.toId} (no edges)`;
  const head = path.fromId;
  const segments = path.edges.map((e) => `→ ${e.kind} → ${e.toNodeId}`);
  return `${head} ${segments.join(' ')}`;
}

function ChunksSection({
  chunks,
  provenanceById,
}: {
  chunks: ReadonlyArray<SemanticChunkHit>;
  provenanceById: Map<string, ContextProvenance>;
}) {
  if (chunks.length === 0) {
    return (
      <Section title={`Chunks (0)`} testid="context-panel-section-chunks" empty>
        <EmptyLine label="No semantic chunks retrieved." testid="context-panel-chunks-empty" />
      </Section>
    );
  }
  return (
    <Section title={`Chunks (${chunks.length})`} testid="context-panel-section-chunks">
      <ul role="list" style={listResetStyle}>
        {chunks.map((hit, i) => {
          const prov = provenanceById.get(hit.chunk.chunkId) ?? null;
          return (
            <li
              key={hit.chunk.chunkId}
              role="listitem"
              data-testid={`context-panel-chunk-${i}`}
              style={{
                ...itemCardStyle,
                borderLeft: `3px solid ${sourceClassBorder(prov?.sourceClass ?? null)}`,
              }}
            >
              <p style={{ ...itemTitleStyle, fontSize: 13, fontFamily: TYPOGRAPHY.serif }}>
                {truncate(hit.chunk.text, 200)}
              </p>
              <div style={chipRowStyle}>
                <Chip
                  label={hit.score > 0 ? hit.score.toFixed(2) : 'keyword'}
                  testid={`context-panel-chunk-score-${i}`}
                />
                {prov?.classification ? (
                  <Chip
                    label={prov.classification}
                    testid={`context-panel-chunk-classification-${i}`}
                  />
                ) : null}
              </div>
              <p
                style={metaLineStyle}
                data-testid={`context-panel-chunk-source-${i}`}
              >
                {hit.chunk.recordId} · chunk {hit.chunk.chunkId}
              </p>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

function PatternsSection({ patterns }: { patterns: ReadonlyArray<CorpusPatternHit> }) {
  if (patterns.length === 0) {
    return (
      <Section
        title={`Patterns (0)`}
        testid="context-panel-section-patterns"
        empty
      >
        <EmptyLine label="No corpus patterns matched." testid="context-panel-patterns-empty" />
      </Section>
    );
  }
  return (
    <Section title={`Patterns (${patterns.length})`} testid="context-panel-section-patterns">
      <ul role="list" style={listResetStyle}>
        {patterns.map((p) => (
          <li
            key={p.patternId}
            role="listitem"
            data-testid={`context-panel-pattern-${p.patternId}`}
            style={{ ...itemCardStyle, borderLeft: `3px solid ${SLATE_BLUE}` }}
          >
            <Link
              href={`/intelligence/patterns/${p.patternId.toLowerCase()}`}
              data-testid={`context-panel-pattern-link-${p.patternId}`}
              style={{
                margin: 0,
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 13,
                color: COLORS.navy,
                fontWeight: 600,
                textDecoration: 'none',
                borderBottom: `1px dotted ${COLORS.navy}66`,
              }}
            >
              {p.patternId}
            </Link>
            <p style={{ ...itemTitleStyle, fontSize: 13 }}>{p.patternName}</p>
            {p.summary ? <p style={metaLineStyle}>{p.summary}</p> : null}
            {typeof p.score === 'number' ? (
              <Chip label={p.score.toFixed(2)} testid={`context-panel-pattern-score-${p.patternId}`} />
            ) : null}
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Footer({ bundle }: { bundle: ContextBundle }) {
  return (
    <footer
      data-testid="context-panel-footer"
      style={{
        borderTop: `1px solid ${COLORS.ink}11`,
        paddingTop: SPACING.sm,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.xs,
      }}
    >
      <p
        data-testid="context-panel-guardrail"
        style={{
          margin: 0,
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          fontStyle: 'italic',
          color: `${COLORS.ink}aa`,
        }}
      >
        Only claims supported by retrieved context are allowed.
      </p>
      <p
        style={{
          margin: 0,
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 10,
          color: `${COLORS.ink}88`,
        }}
      >
        {bundle.facts.length} facts · {bundle.graphPaths.length} paths ·{' '}
        {bundle.semanticChunks.length} chunks · {bundle.corpusPatterns.length} patterns ·{' '}
        {bundle.provenance.length} citations
      </p>
    </footer>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Section({
  title,
  testid,
  children,
  empty = false,
}: {
  title: string;
  testid: string;
  children: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <section
      data-testid={testid}
      data-empty={empty ? 'true' : 'false'}
      style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xs }}
    >
      <h3 style={sectionTitleStyle}>{title}</h3>
      {children}
    </section>
  );
}

function Chip({ label, testid }: { label: string; testid?: string }) {
  return (
    <span
      data-testid={testid}
      style={{
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 10,
        background: COLORS.cream,
        border: `1px solid ${COLORS.ink}11`,
        borderRadius: RADIUS.sm,
        padding: `0 ${SPACING.xs}`,
        color: `${COLORS.ink}99`,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

function ConfidenceDot({ confidence }: { confidence: number }) {
  const color =
    confidence >= 0.8 ? COLORS.mintInk : confidence >= 0.5 ? COLORS.amberInk : COLORS.coralInk;
  return (
    <span
      title={`Confidence ${(confidence * 100).toFixed(0)}%`}
      data-testid="context-panel-confidence-dot"
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: color,
      }}
      aria-label={`Confidence ${(confidence * 100).toFixed(0)} percent`}
    />
  );
}

function SourceClassChip({
  sourceClass,
}: {
  sourceClass: ContextProvenance['sourceClass'] | null;
}) {
  return (
    <span
      data-testid={`context-panel-source-class-${sourceClass ?? 'unknown'}`}
      style={{
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 10,
        background: 'transparent',
        border: `1px solid ${sourceClassBorder(sourceClass)}`,
        borderRadius: RADIUS.sm,
        padding: `0 ${SPACING.xs}`,
        color: `${COLORS.ink}aa`,
        whiteSpace: 'nowrap',
      }}
    >
      {sourceClassLabel(sourceClass)}
    </span>
  );
}

function EmptyLine({ label, testid }: { label: string; testid: string }) {
  return (
    <p
      data-testid={testid}
      style={{
        margin: 0,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 12,
        color: `${COLORS.ink}88`,
        fontStyle: 'italic',
      }}
    >
      {label}
    </p>
  );
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  // Truncate mid-word with ellipsis per design doc §5.1.4.
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  return (lastSpace > max * 0.5 ? slice.slice(0, lastSpace) : slice) + '…';
}

function secondsAgo(then: Date, now: Date): string {
  const sec = Math.max(0, Math.round((now.getTime() - then.getTime()) / 1000));
  if (sec < 60) return `${sec}s`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m`;
  return `${Math.round(min / 60)}h`;
}

// ── Styles ───────────────────────────────────────────────────────────────────

const panelRootStyle: React.CSSProperties = {
  background: COLORS.cream,
  border: `1px solid ${COLORS.ink}11`,
  borderRadius: RADIUS.lg,
  padding: SPACING.lg,
  display: 'flex',
  flexDirection: 'column',
  gap: SPACING.md,
  fontFamily: TYPOGRAPHY.sans,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 14,
  fontWeight: 400,
  color: COLORS.ink,
  letterSpacing: '-0.005em',
};

const sectionEyebrowStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 10,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: COLORS.navy,
  fontWeight: 700,
};

const listResetStyle: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: SPACING.xs,
};

const itemCardStyle: React.CSSProperties = {
  background: COLORS.white,
  border: `1px solid ${COLORS.ink}11`,
  borderRadius: RADIUS.sm,
  padding: SPACING.sm,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const itemRowStyle: React.CSSProperties = {
  background: COLORS.white,
  border: `1px solid ${COLORS.ink}11`,
  borderRadius: RADIUS.sm,
  padding: SPACING.sm,
};

const itemTitleStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 13,
  color: COLORS.ink,
  lineHeight: 1.4,
  fontWeight: 500,
};

const chipRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: SPACING.xs,
  flexWrap: 'wrap',
  alignItems: 'center',
  marginTop: 2,
};

const metaLineStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 10,
  color: `${COLORS.ink}88`,
  marginTop: 2,
};

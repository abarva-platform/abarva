// /admin/reasoning/citation-map — Source document citation map.
//
// Pure server component. Shows which source documents are cited in synthesis
// outputs: for each document referenced by at least one lifecycle pattern's
// `sourceDocuments`, shows how many patterns reference it and how many
// instances are affected.
//
// Renders:
//   - SummaryStrip: headline counts
//   - CitationTable: document → pattern count → instance count, with pattern chips
//   - UncitedPatterns: patterns with zero source documents

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Citation map · AbarVa Admin',
};

// ─── Types ────────────────────────────────────────────────────────────────────

type DocType =
  | 'RFC'
  | 'ISO'
  | 'Gartner'
  | 'Forrester'
  | 'URL'
  | 'Build spec'
  | 'Demo'
  | 'Architecture'
  | 'Source material'
  | 'Other';

interface CitationEntry {
  ref: string;
  type: DocType;
  patternIds: string[];
  patternTitles: string[];
  patternCount: number;
  instanceCount: number;
}

interface UncitedPattern {
  patternId: string;
  title: string;
  instanceCount: number;
}

// ─── Type inference ───────────────────────────────────────────────────────────

function inferDocType(ref: string): DocType {
  const lower = ref.toLowerCase();
  if (/^rfc\s*\d/i.test(ref)) return 'RFC';
  if (/^iso\s*\d/i.test(ref)) return 'ISO';
  if (/gartner/i.test(ref)) return 'Gartner';
  if (/forrester/i.test(ref)) return 'Forrester';
  if (/^https?:\/\//i.test(ref)) return 'URL';
  if (lower.includes('docs/build/') || lower.includes('build_spec') || lower.includes('backlog')) {
    return 'Build spec';
  }
  if (lower.includes('docs/demo/') || lower.includes('_demo')) return 'Demo';
  if (lower.includes('docs/architecture/') || lower.includes('architecture')) return 'Architecture';
  if (lower.includes('docs/source-material/') || lower.includes('source-material')) {
    return 'Source material';
  }
  return 'Other';
}

// ─── Data computation ─────────────────────────────────────────────────────────

function computeCitationData(): {
  citations: CitationEntry[];
  uncited: UncitedPattern[];
  totalDocs: number;
  patternsWithCitations: number;
  instancesCovered: number;
} {
  const allPatterns = getAllLifecyclePatterns();

  // Build a map from patternId → instance count (source + program)
  const instancesByPattern = new Map<string, number>();
  for (const inst of SOURCE_EVENT_INSTANCES) {
    instancesByPattern.set(inst.patternId, (instancesByPattern.get(inst.patternId) ?? 0) + 1);
  }
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    instancesByPattern.set(inst.patternId, (instancesByPattern.get(inst.patternId) ?? 0) + 1);
  }

  // ref → accumulator: which patterns reference each document
  const docMap = new Map<string, { patternIds: string[]; patternTitles: string[] }>();

  const patternsWithAnyDocs = new Set<string>();

  for (const pattern of allPatterns) {
    if (!pattern.sourceDocuments || pattern.sourceDocuments.length === 0) continue;
    patternsWithAnyDocs.add(pattern.patternId);
    for (const ref of pattern.sourceDocuments) {
      const trimmed = ref.trim();
      if (!trimmed) continue;
      const existing = docMap.get(trimmed) ?? { patternIds: [], patternTitles: [] };
      if (!existing.patternIds.includes(pattern.patternId)) {
        existing.patternIds.push(pattern.patternId);
        existing.patternTitles.push(pattern.title);
      }
      docMap.set(trimmed, existing);
    }
  }

  // Build citation entries with instance counts
  const citations: CitationEntry[] = [];
  for (const [ref, { patternIds, patternTitles }] of docMap.entries()) {
    // Sum instance counts across all patterns that cite this doc
    const instanceCount = patternIds.reduce(
      (sum, pid) => sum + (instancesByPattern.get(pid) ?? 0),
      0,
    );
    citations.push({
      ref,
      type: inferDocType(ref),
      patternIds,
      patternTitles,
      patternCount: patternIds.length,
      instanceCount,
    });
  }

  // Sort by instance count desc, then pattern count desc, then alphabetically
  citations.sort((a, b) => {
    if (b.instanceCount !== a.instanceCount) return b.instanceCount - a.instanceCount;
    if (b.patternCount !== a.patternCount) return b.patternCount - a.patternCount;
    return a.ref.localeCompare(b.ref);
  });

  // Uncited patterns: patterns with zero sourceDocuments
  const uncited: UncitedPattern[] = allPatterns
    .filter((p) => !patternsWithAnyDocs.has(p.patternId))
    .map((p) => ({
      patternId: p.patternId,
      title: p.title,
      instanceCount: instancesByPattern.get(p.patternId) ?? 0,
    }))
    .sort((a, b) => b.instanceCount - a.instanceCount);

  // instancesCovered: unique instance count across all patterns with any docs
  const coveredInstanceSet = new Set<string>();
  for (const inst of SOURCE_EVENT_INSTANCES) {
    if (patternsWithAnyDocs.has(inst.patternId)) coveredInstanceSet.add(inst.id);
  }
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    if (patternsWithAnyDocs.has(inst.patternId)) coveredInstanceSet.add(inst.id);
  }

  return {
    citations,
    uncited,
    totalDocs: citations.length,
    patternsWithCitations: patternsWithAnyDocs.size,
    instancesCovered: coveredInstanceSet.size,
  };
}

// ─── Type palette ─────────────────────────────────────────────────────────────

const TYPE_PALETTES: Record<DocType, { bg: string; line: string; text: string }> = {
  RFC: { bg: SHELL.BLUE_BG, line: SHELL.BLUE_LINE, text: SHELL.INK_MID },
  ISO: { bg: SHELL.PEACH_BG, line: SHELL.PEACH_LINE, text: SHELL.PEACH_TEXT },
  Gartner: { bg: SHELL.MINT_BG, line: SHELL.MINT_LINE, text: SHELL.MINT_TEXT },
  Forrester: { bg: SHELL.MINT_BG, line: SHELL.MINT_LINE, text: SHELL.MINT_TEXT },
  URL: { bg: SHELL.BLUE_BG, line: SHELL.BLUE_LINE, text: SHELL.INK_MID },
  'Build spec': { bg: SHELL.GRAY_BG, line: SHELL.GRAY_LINE, text: SHELL.GRAY_TEXT },
  Demo: { bg: SHELL.PEACH_BG, line: SHELL.PEACH_LINE, text: SHELL.PEACH_TEXT },
  Architecture: { bg: SHELL.BLUE_BG, line: SHELL.BLUE_LINE, text: SHELL.INK_MID },
  'Source material': { bg: SHELL.GRAY_BG, line: SHELL.GRAY_LINE, text: SHELL.GRAY_TEXT },
  Other: { bg: SHELL.GRAY_BG, line: SHELL.GRAY_LINE, text: SHELL.GRAY_TEXT },
};

// ─── Components ───────────────────────────────────────────────────────────────

const HEADER_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 13,
  fontWeight: 700,
  color: COLORS.ink,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}22`,
  letterSpacing: '0.01em',
};

const BODY_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'top',
};

const MONO_CELL: React.CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

function SummaryStrip({
  totalDocs,
  patternsWithCitations,
  instancesCovered,
}: {
  totalDocs: number;
  patternsWithCitations: number;
  instancesCovered: number;
}) {
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 6,
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 13,
        color: SHELL.INK_SOFT,
      }}
    >
      <span style={{ color: SHELL.INK, fontWeight: 700 }}>{totalDocs}</span>
      <span>source document{totalDocs === 1 ? '' : 's'}</span>
      <span style={{ color: SHELL.CARD_LINE, margin: '0 4px' }}>·</span>
      <span style={{ color: SHELL.INK, fontWeight: 700 }}>{patternsWithCitations}</span>
      <span>pattern{patternsWithCitations === 1 ? '' : 's'} with citations</span>
      <span style={{ color: SHELL.CARD_LINE, margin: '0 4px' }}>·</span>
      <span style={{ color: SHELL.INK, fontWeight: 700 }}>{instancesCovered}</span>
      <span>instance{instancesCovered === 1 ? '' : 's'} covered by documented patterns</span>
    </div>
  );
}

function TypeBadge({ type }: { type: DocType }) {
  const pal = TYPE_PALETTES[type];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: pal.bg,
        border: `1px solid ${pal.line}`,
        color: pal.text,
        borderRadius: RADIUS.pill,
        padding: '2px 9px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {type}
    </span>
  );
}


function EmptyDocState() {
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px dashed ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        textAlign: 'center',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 14,
        color: SHELL.INK_SOFT,
        lineHeight: 1.5,
      }}
    >
      No source documents found across any lifecycle patterns. Enrich patterns with
      sourceDocuments entries to populate this map.
    </div>
  );
}

function CitationTable({ citations }: { citations: CitationEntry[] }) {
  if (citations.length === 0) {
    return <EmptyDocState />;
  }

  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}10`,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: SPACING.md,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 20,
              color: COLORS.ink,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Citation map
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Sorted by instance coverage descending
          </div>
        </div>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}88` }}>
          {citations.length} document{citations.length === 1 ? '' : 's'}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Document</th>
              <th style={HEADER_CELL}>Type</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Patterns</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Instances</th>
              <th style={HEADER_CELL}>Pattern IDs</th>
            </tr>
          </thead>
          <tbody>
            {citations.map((entry) => (
              <tr key={entry.ref}>
                <td
                  style={{
                    ...MONO_CELL,
                    maxWidth: 340,
                    wordBreak: 'break-all',
                    fontSize: 11,
                  }}
                >
                  {entry.ref}
                </td>
                <td style={{ ...BODY_CELL, whiteSpace: 'nowrap' }}>
                  <TypeBadge type={entry.type} />
                </td>
                <td style={{ ...MONO_CELL, textAlign: 'right', fontWeight: 700 }}>
                  {entry.patternCount}
                </td>
                <td style={{ ...MONO_CELL, textAlign: 'right', fontWeight: 700 }}>
                  {entry.instanceCount}
                </td>
                <td style={{ ...BODY_CELL, minWidth: 200 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {entry.patternIds.map((pid, i) => {
                      const chipTitle = entry.patternTitles[i] ?? pid;
                      return (
                        <span
                          key={pid}
                          title={chipTitle}
                          style={{
                            display: 'inline-block',
                            background: COLORS.skyPale,
                            color: COLORS.navy,
                            borderRadius: RADIUS.pill,
                            padding: '2px 9px',
                            fontFamily: TYPOGRAPHY.mono,
                            fontSize: 10,
                            fontWeight: 600,
                            letterSpacing: '0.02em',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {pid}
                        </span>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function UncitedPatternsCard({ uncited }: { uncited: UncitedPattern[] }) {
  if (uncited.length === 0) {
    return (
      <section
        style={{
          background: COLORS.mintSoft,
          border: `1px solid ${COLORS.ink}14`,
          borderRadius: RADIUS.lg,
          padding: `${SPACING.md} ${SPACING.lg}`,
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: COLORS.mintInk,
        }}
      >
        All lifecycle patterns have at least one source document. Knowledge base coverage is
        complete.
      </section>
    );
  }

  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.amberSoft}`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.amberSoft}`,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: SPACING.md,
          background: COLORS.amberSoft,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 18,
              color: COLORS.amberInk,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Uncited patterns
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: COLORS.amberInk,
              opacity: 0.8,
              marginTop: 2,
            }}
          >
            Patterns with zero source documents — need knowledge base enrichment
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: COLORS.amberInk,
            opacity: 0.8,
          }}
        >
          {uncited.length} pattern{uncited.length === 1 ? '' : 's'}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Pattern ID</th>
              <th style={HEADER_CELL}>Title</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Instances</th>
            </tr>
          </thead>
          <tbody>
            {uncited.map((p) => (
              <tr key={p.patternId}>
                <td style={MONO_CELL}>{p.patternId}</td>
                <td style={BODY_CELL}>{p.title}</td>
                <td style={{ ...MONO_CELL, textAlign: 'right' }}>{p.instanceCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CitationMapPage() {
  const { citations, uncited, totalDocs, patternsWithCitations, instancesCovered } =
    computeCitationData();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Source documents"
          primaryActionHref="/admin/reasoning/source-documents"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Citation map"
        title="Source document citation map"
        subtitle="Which knowledge base documents back which patterns and instances. Documents are ranked by instance coverage — the number of active instances whose patterns cite each document."
      >
        {totalDocs === 0 ? (
          <EmptyDocState />
        ) : (
          <>
            <SummaryStrip
              totalDocs={totalDocs}
              patternsWithCitations={patternsWithCitations}
              instancesCovered={instancesCovered}
            />
            <CitationTable citations={citations} />
            <UncitedPatternsCard uncited={uncited} />
          </>
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

// /admin/reasoning/source-documents — Catalog of all source document
// references across lifecycle patterns.
//
// Pure server component. Collects unique `sourceDocuments` strings from all
// lifecycle patterns, maps each to the patterns that cite it, groups by
// inferred document type, and renders sorted by reference count descending.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Source documents · AbarVa Admin',
};

// ─── Data model ───────────────────────────────────────────────────────────────

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

interface SourceDocEntry {
  ref: string;
  type: DocType;
  patternIds: string[];
  patternTitles: string[];
  refCount: number;
}

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

const DOC_TYPE_ORDER: DocType[] = [
  'RFC',
  'ISO',
  'Gartner',
  'Forrester',
  'URL',
  'Architecture',
  'Build spec',
  'Demo',
  'Source material',
  'Other',
];

function buildSourceDocData(): {
  entries: SourceDocEntry[];
  byType: Map<DocType, SourceDocEntry[]>;
  uniqueDocCount: number;
  patternCount: number;
  totalRefs: number;
  hasGrouping: boolean;
} {
  const allPatterns = getAllLifecyclePatterns();

  // ref → accumulator
  const docMap = new Map<string, { patternIds: string[]; patternTitles: string[] }>();

  for (const pattern of allPatterns) {
    if (!pattern.sourceDocuments || pattern.sourceDocuments.length === 0) continue;
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

  // Build entries with type inference.
  const entries: SourceDocEntry[] = [];
  for (const [ref, { patternIds, patternTitles }] of docMap.entries()) {
    entries.push({
      ref,
      type: inferDocType(ref),
      patternIds,
      patternTitles,
      refCount: patternIds.length,
    });
  }

  // Sort: ref count desc, then alphabetically.
  entries.sort((a, b) => {
    if (b.refCount !== a.refCount) return b.refCount - a.refCount;
    return a.ref.localeCompare(b.ref);
  });

  // Group by type.
  const byType = new Map<DocType, SourceDocEntry[]>();
  for (const entry of entries) {
    const group = byType.get(entry.type) ?? [];
    group.push(entry);
    byType.set(entry.type, group);
  }

  // Check if there's any meaningful grouping (more than just "Other").
  const nonOtherTypes = [...byType.keys()].filter((t) => t !== 'Other');
  const hasGrouping = nonOtherTypes.length > 0;

  // Count patterns that have any source docs.
  const patternsWithDocs = new Set<string>();
  for (const entry of entries) {
    for (const pid of entry.patternIds) patternsWithDocs.add(pid);
  }

  const totalRefs = entries.reduce((sum, e) => sum + e.refCount, 0);

  return {
    entries,
    byType,
    uniqueDocCount: entries.length,
    patternCount: patternsWithDocs.size,
    totalRefs,
    hasGrouping,
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

// ─── Components ──────────────────────────────────────────────────────────────

function SummaryStrip({
  uniqueDocCount,
  patternCount,
  totalRefs,
}: {
  uniqueDocCount: number;
  patternCount: number;
  totalRefs: number;
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
        fontFamily: SHELL.MONO,
        fontSize: 13,
        color: SHELL.INK_SOFT,
      }}
    >
      <span style={{ color: SHELL.INK, fontWeight: 700 }}>{uniqueDocCount}</span>
      <span>unique document{uniqueDocCount === 1 ? '' : 's'}</span>
      <span style={{ color: SHELL.CARD_LINE, margin: '0 4px' }}>·</span>
      <span>across</span>
      <span style={{ color: SHELL.INK, fontWeight: 700 }}>{patternCount}</span>
      <span>pattern{patternCount === 1 ? '' : 's'}</span>
      <span style={{ color: SHELL.CARD_LINE, margin: '0 4px' }}>·</span>
      <span style={{ color: SHELL.INK, fontWeight: 700 }}>{totalRefs}</span>
      <span>total reference{totalRefs === 1 ? '' : 's'}</span>
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
        fontFamily: SHELL.MONO,
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

function CountBadge({ value }: { value: number }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: SHELL.GRAY_BG,
        border: `1px solid ${SHELL.GRAY_LINE}`,
        borderRadius: RADIUS.pill,
        padding: '2px 9px',
        fontFamily: SHELL.MONO,
        fontSize: 11,
        color: SHELL.INK_SOFT,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      <span style={{ fontWeight: 700, color: SHELL.INK }}>{value}</span>
      {' '}
      {value === 1 ? 'pattern' : 'patterns'}
    </span>
  );
}

function DocRow({ entry }: { entry: SourceDocEntry }) {
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {/* Primary row: ref + badges */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: SPACING.sm,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 13,
            color: SHELL.INK,
            fontWeight: 600,
            letterSpacing: '0.01em',
            flex: '1 1 auto',
            minWidth: 0,
            wordBreak: 'break-all',
          }}
        >
          {entry.ref}
        </span>
        <TypeBadge type={entry.type} />
        <CountBadge value={entry.refCount} />
      </div>

      {/* Pattern names */}
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 12,
          color: SHELL.INK_MUTED,
          lineHeight: 1.5,
        }}
      >
        {entry.patternTitles.join(', ')}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        background: SHELL.MINT_BG,
        border: `1px solid ${SHELL.MINT_LINE}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        textAlign: 'center',
        fontFamily: SHELL.SANS,
        fontSize: 14,
        color: SHELL.MINT_TEXT,
        fontWeight: 500,
      }}
    >
      No source documents are referenced by any pattern.
    </div>
  );
}

function GroupSection({
  type,
  entries,
}: {
  type: DocType;
  entries: SourceDocEntry[];
}) {
  return (
    <section
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: SPACING.md,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
          <h2
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 18,
              color: SHELL.INK,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {type}
          </h2>
          <TypeBadge type={type} />
        </div>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 11,
            color: SHELL.INK_MUTED,
          }}
        >
          {entries.length} doc{entries.length === 1 ? '' : 's'}
        </span>
      </header>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm,
          padding: SPACING.md,
        }}
      >
        {entries.map((entry) => (
          <DocRow key={entry.ref} entry={entry} />
        ))}
      </div>
    </section>
  );
}

function FlatSection({ entries }: { entries: SourceDocEntry[] }) {
  return (
    <section
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: SPACING.md,
        }}
      >
        <h2
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 20,
            color: SHELL.INK,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          All documents
        </h2>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 11,
            color: SHELL.INK_MUTED,
          }}
        >
          sorted by reference count
        </span>
      </header>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm,
          padding: SPACING.md,
        }}
      >
        {entries.map((entry) => (
          <DocRow key={entry.ref} entry={entry} />
        ))}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SourceDocumentsPage() {
  const { entries, byType, uniqueDocCount, patternCount, totalRefs, hasGrouping } =
    buildSourceDocData();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open Source detail"
          primaryActionHref="/source"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Source documents"
        subtitle="All source document references across lifecycle patterns — the knowledge base behind each pattern."
      >
        {uniqueDocCount === 0 ? (
          <EmptyState />
        ) : (
          <>
            <SummaryStrip
              uniqueDocCount={uniqueDocCount}
              patternCount={patternCount}
              totalRefs={totalRefs}
            />

            {hasGrouping ? (
              <>
                {DOC_TYPE_ORDER.filter((t) => byType.has(t)).map((type) => {
                  const typeEntries = byType.get(type);
                  if (!typeEntries || typeEntries.length === 0) return null;
                  return (
                    <GroupSection key={type} type={type} entries={typeEntries} />
                  );
                })}
              </>
            ) : (
              <FlatSection entries={entries} />
            )}
          </>
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

// /admin/reasoning/evidence-source-map — Evidence source document citation frequency.
//
// Pure server component, force-dynamic.
//
// Maps evidence items back to their source documents — showing which source
// documents are cited most frequently across instances and which are never cited.
//
// Sections:
//   1. Source citation KPIs — total unique sources, most-cited, never-cited count
//   2. Citation frequency chart — horizontal CSS bars per source
//   3. Source-to-instance matrix — top 10 sources × up to 8 instances
//   4. Never-cited sources — amber chips for uncited synthetic sources
//   5. Most evidence-rich instance — instance with most diverse source citations

import type { CSSProperties } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildHealthBoardRows } from '@/lib/reasoning/health-board';
import { getEvidenceFor } from '@/lib/reasoning/evidence-ingestion-store';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Evidence Source Map · AbarVa Admin',
};

// ─── Synthetic source names ───────────────────────────────────────────────────

const SYNTHETIC_SOURCES = [
  'Contract v2.1',
  'Compliance Report Q4',
  'Technical Spec 3.0',
  'Risk Assessment 2025',
  'Vendor Agreement',
  'Audit Log Extract',
  'Executive Brief',
  'IT Security Review',
  'Legal Opinion',
  'Financial Model v3',
  'Procurement Policy',
  'Change Request Log',
];

// ─── Data computation ─────────────────────────────────────────────────────────

interface SourceCitationEntry {
  source: string;
  totalCitations: number;
  instanceIds: string[];
  // map from instanceId → citation count
  perInstance: Record<string, number>;
}

interface EvidenceSourceMapData {
  entries: SourceCitationEntry[];
  instanceIds: string[];
  instanceLabels: Record<string, string>;
  neverCited: string[];
  totalUniqueSources: number;
  mostCited: SourceCitationEntry | null;
  neverCitedCount: number;
  richestInstance: { id: string; label: string; uniqueSources: number; totalItems: number } | null;
}

function buildSourceMapData(): EvidenceSourceMapData {
  const healthRows = buildHealthBoardRows();

  // Accumulate: source → { instanceId → count }
  const sourceMap = new Map<string, Record<string, number>>();

  // Track per-instance: unique sources and total evidence items
  const instanceSourceSets = new Map<string, Set<string>>();
  const instanceEvidenceCounts = new Map<string, number>();

  const allInstanceIds: string[] = [];
  const instanceLabels: Record<string, string> = {};

  for (const row of healthRows) {
    allInstanceIds.push(row.id);
    instanceLabels[row.id] = row.label;

    const evidenceItems = getEvidenceFor(row.id);
    instanceEvidenceCounts.set(row.id, evidenceItems.length);

    const sourceSet = new Set<string>();

    evidenceItems.forEach((item, idx) => {
      // Try to derive source from item fields, fall back to synthetic
      const itemRecord = item as Record<string, unknown>;
      let source: string;

      const rawSource =
        itemRecord.source ??
        itemRecord.sourceDocument ??
        itemRecord.document ??
        itemRecord.citation;

      if (typeof rawSource === 'string' && rawSource.trim().length > 0) {
        source = rawSource.trim();
      } else {
        source = SYNTHETIC_SOURCES[idx % SYNTHETIC_SOURCES.length];
      }

      // Update source map
      const existing = sourceMap.get(source) ?? {};
      existing[row.id] = (existing[row.id] ?? 0) + 1;
      sourceMap.set(source, existing);

      sourceSet.add(source);
    });

    instanceSourceSets.set(row.id, sourceSet);
  }

  // Build citation entries
  const entries: SourceCitationEntry[] = [];
  for (const [source, perInstance] of sourceMap.entries()) {
    const totalCitations = Object.values(perInstance).reduce((s, n) => s + n, 0);
    const instanceIds = Object.keys(perInstance);
    entries.push({ source, totalCitations, instanceIds, perInstance });
  }

  // Sort by total citations desc
  entries.sort((a, b) => {
    if (b.totalCitations !== a.totalCitations) return b.totalCitations - a.totalCitations;
    return a.source.localeCompare(b.source);
  });

  // Never-cited: synthetic sources that appear in SYNTHETIC_SOURCES but 0 citations
  const citedSources = new Set(entries.map((e) => e.source));
  const neverCited = SYNTHETIC_SOURCES.filter((s) => !citedSources.has(s));

  // Most-cited source
  const mostCited = entries.length > 0 ? entries[0] : null;

  // Richest instance: most unique source citations
  let richestInstance: EvidenceSourceMapData['richestInstance'] = null;
  for (const [id, sourceSet] of instanceSourceSets.entries()) {
    if (
      richestInstance === null ||
      sourceSet.size > richestInstance.uniqueSources
    ) {
      richestInstance = {
        id,
        label: instanceLabels[id] ?? id,
        uniqueSources: sourceSet.size,
        totalItems: instanceEvidenceCounts.get(id) ?? 0,
      };
    }
  }

  return {
    entries,
    instanceIds: allInstanceIds,
    instanceLabels,
    neverCited,
    totalUniqueSources: entries.length,
    mostCited,
    neverCitedCount: neverCited.length,
    richestInstance,
  };
}

// ─── Style constants ──────────────────────────────────────────────────────────

const HEADER_CELL: CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 13,
  fontWeight: 700,
  color: COLORS.ink,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}22`,
  letterSpacing: '0.01em',
  whiteSpace: 'nowrap',
};

const BODY_CELL: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'middle',
};

const MONO_CELL: CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

// ─── KPI cards ────────────────────────────────────────────────────────────────

function KpiCards({
  totalUniqueSources,
  mostCited,
  neverCitedCount,
}: {
  totalUniqueSources: number;
  mostCited: SourceCitationEntry | null;
  neverCitedCount: number;
}) {
  const cards = [
    {
      label: 'Unique sources',
      value: String(totalUniqueSources),
      sub: 'source documents across all instances',
      bg: SHELL.MINT_BG,
      border: SHELL.MINT_LINE,
      fg: SHELL.MINT_TEXT,
    },
    {
      label: 'Most-cited source',
      value: mostCited ? String(mostCited.totalCitations) : '—',
      sub: mostCited ? mostCited.source : 'No citations',
      bg: SHELL.BLUE_BG,
      border: SHELL.BLUE_LINE,
      fg: SHELL.INK_MID,
    },
    {
      label: 'Never-cited sources',
      value: String(neverCitedCount),
      sub: 'from the synthetic source corpus',
      bg: neverCitedCount > 0 ? SHELL.PEACH_BG : SHELL.MINT_BG,
      border: neverCitedCount > 0 ? SHELL.PEACH_LINE : SHELL.MINT_LINE,
      fg: neverCitedCount > 0 ? SHELL.PEACH_TEXT : SHELL.MINT_TEXT,
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: SPACING.md,
      }}
    >
      {cards.map((card) => (
        <div
          key={card.label}
          style={{
            background: card.bg,
            border: `1px solid ${card.border}`,
            borderRadius: RADIUS.lg,
            padding: `${SPACING.md} ${SPACING.lg}`,
          }}
        >
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: card.fg,
              opacity: 0.75,
              marginBottom: 4,
            }}
          >
            {card.label}
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 36,
              color: card.fg,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {card.value}
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: card.fg,
              opacity: 0.75,
              marginTop: 4,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={card.sub}
          >
            {card.sub}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Citation frequency chart ─────────────────────────────────────────────────

function citationBarColor(count: number): string {
  if (count >= 5) return SHELL.MINT_TEXT;   // deep mint
  if (count >= 2) return '#5aab80';          // medium mint
  return '#a8d5bc';                           // light mint
}

function CitationFrequencyChart({ entries }: { entries: SourceCitationEntry[] }) {
  if (entries.length === 0) {
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
        }}
      >
        No citation data — add evidence to instances to populate this chart.
      </div>
    );
  }

  const maxCount = entries[0].totalCitations;

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
            Citation frequency
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Deep mint ≥ 5 · Medium mint 2–4 · Light mint 1
          </div>
        </div>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}88` }}>
          {entries.length} source{entries.length === 1 ? '' : 's'}
        </span>
      </header>
      <div style={{ padding: `${SPACING.md} ${SPACING.lg}` }}>
        {entries.map((entry) => {
          const pct = maxCount > 0 ? (entry.totalCitations / maxCount) * 100 : 0;
          const barColor = citationBarColor(entry.totalCitations);
          return (
            <div
              key={entry.source}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.sm,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 200,
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: COLORS.ink,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
                title={entry.source}
              >
                {entry.source}
              </div>
              <div
                style={{
                  flex: 1,
                  height: 20,
                  background: `${COLORS.ink}08`,
                  borderRadius: RADIUS.pill,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.max(pct, 2)}%`,
                    background: barColor,
                    borderRadius: RADIUS.pill,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 12,
                  color: barColor,
                  fontWeight: 700,
                  width: 28,
                  textAlign: 'right',
                  flexShrink: 0,
                }}
              >
                {entry.totalCitations}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Source-to-instance matrix ────────────────────────────────────────────────

function SourceInstanceMatrix({
  entries,
  instanceIds,
  instanceLabels,
}: {
  entries: SourceCitationEntry[];
  instanceIds: string[];
  instanceLabels: Record<string, string>;
}) {
  const topSources = entries.slice(0, 10);
  const displayInstances = instanceIds.slice(0, 8);

  if (topSources.length === 0 || displayInstances.length === 0) {
    return null;
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
            Source-to-instance matrix
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Top 10 sources × up to 8 instances — cell = citation count
          </div>
        </div>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
          <thead>
            <tr>
              <th style={{ ...HEADER_CELL, minWidth: 180 }}>Source</th>
              {displayInstances.map((iid) => (
                <th
                  key={iid}
                  style={{ ...HEADER_CELL, textAlign: 'center', minWidth: 72, fontSize: 11 }}
                  title={instanceLabels[iid]}
                >
                  {(instanceLabels[iid] ?? iid).slice(0, 8)}
                </th>
              ))}
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {topSources.map((entry) => (
              <tr key={entry.source}>
                <td
                  style={{ ...BODY_CELL, fontFamily: TYPOGRAPHY.mono, fontSize: 11 }}
                  title={entry.source}
                >
                  {entry.source.length > 22 ? entry.source.slice(0, 22) + '…' : entry.source}
                </td>
                {displayInstances.map((iid) => {
                  const count = entry.perInstance[iid] ?? 0;
                  const isCited = count > 0;
                  return (
                    <td
                      key={iid}
                      style={{
                        ...MONO_CELL,
                        textAlign: 'center',
                        background: isCited ? SHELL.MINT_BG : `${COLORS.ink}04`,
                        color: isCited ? SHELL.MINT_TEXT : `${COLORS.ink}28`,
                        fontWeight: isCited ? 700 : 400,
                      }}
                    >
                      {isCited ? count : ''}
                    </td>
                  );
                })}
                <td
                  style={{
                    ...MONO_CELL,
                    textAlign: 'right',
                    fontWeight: 700,
                    color: SHELL.INK_MID,
                  }}
                >
                  {entry.totalCitations}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Never-cited sources ──────────────────────────────────────────────────────

function NeverCitedSources({ neverCited }: { neverCited: string[] }) {
  if (neverCited.length === 0) {
    return (
      <section
        style={{
          background: COLORS.mintSoft,
          border: `1px solid ${SHELL.MINT_LINE}`,
          borderRadius: RADIUS.lg,
          padding: `${SPACING.md} ${SPACING.lg}`,
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: COLORS.mintInk,
        }}
      >
        All synthetic source documents have at least one citation. Full coverage achieved.
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
          background: COLORS.amberSoft,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
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
            Never-cited sources
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
            These sources have no evidence mapped to them
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
          {neverCited.length} source{neverCited.length === 1 ? '' : 's'}
        </span>
      </header>
      <div
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        {neverCited.map((source) => (
          <span
            key={source}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: COLORS.amberSoft,
              border: `1px solid ${COLORS.amberInk}33`,
              color: COLORS.amberInk,
              borderRadius: RADIUS.pill,
              padding: '4px 12px',
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {source}
          </span>
        ))}
      </div>
    </section>
  );
}

// ─── Most evidence-rich instance ──────────────────────────────────────────────

function RichestInstanceCard({
  richest,
}: {
  richest: EvidenceSourceMapData['richestInstance'];
}) {
  if (!richest) return null;

  return (
    <section
      style={{
        background: SHELL.MINT_BG,
        border: `1px solid ${SHELL.MINT_LINE}`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.lg,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: SHELL.MINT_TEXT,
            opacity: 0.75,
            marginBottom: 4,
          }}
        >
          Most evidence-rich instance
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 22,
            color: SHELL.MINT_TEXT,
            letterSpacing: '-0.01em',
          }}
        >
          {richest.label}
        </div>
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 14,
          color: SHELL.MINT_TEXT,
          lineHeight: 1.5,
        }}
      >
        Instance{' '}
        <strong>{richest.label}</strong> cites{' '}
        <strong>{richest.uniqueSources}</strong> unique source
        {richest.uniqueSources === 1 ? '' : 's'} across{' '}
        <strong>{richest.totalItems}</strong> evidence item
        {richest.totalItems === 1 ? '' : 's'}
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: SPACING.md }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 32,
              color: SHELL.MINT_TEXT,
              lineHeight: 1,
            }}
          >
            {richest.uniqueSources}
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              color: SHELL.MINT_TEXT,
              opacity: 0.75,
              marginTop: 2,
            }}
          >
            unique sources
          </div>
        </div>
        <div
          style={{ width: 1, height: 48, background: SHELL.MINT_LINE, flexShrink: 0 }}
        />
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 32,
              color: SHELL.MINT_TEXT,
              lineHeight: 1,
            }}
          >
            {richest.totalItems}
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              color: SHELL.MINT_TEXT,
              opacity: 0.75,
              marginTop: 2,
            }}
          >
            evidence items
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EvidenceSourceMapPage() {
  const data = buildSourceMapData();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Citation map"
          primaryActionHref="/admin/reasoning/citation-map"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Evidence"
        title="Evidence Source Map"
        subtitle="Source document citation frequency — most-cited, never-cited, and citation distribution"
      >
        <KpiCards
          totalUniqueSources={data.totalUniqueSources}
          mostCited={data.mostCited}
          neverCitedCount={data.neverCitedCount}
        />

        <CitationFrequencyChart entries={data.entries} />

        <SourceInstanceMatrix
          entries={data.entries}
          instanceIds={data.instanceIds}
          instanceLabels={data.instanceLabels}
        />

        <NeverCitedSources neverCited={data.neverCited} />

        <RichestInstanceCard richest={data.richestInstance} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

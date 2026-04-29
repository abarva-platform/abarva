// /admin/reasoning/linked-instances — Cross-instance dependency map.
//
// Server component. Collects all cross-instance links from SOURCE_EVENT_INSTANCES
// and APEX_RETAIL_PROGRAM_INSTANCES, deduplicates bidirectional edges, and
// renders a per-instance view of all dependency relationships.
//
// Blocker links (where blockedAtStage or blockedAtPhase is set) are highlighted
// with a rust left border. No client JS needed.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import type { LinkType } from '@/lib/reasoning';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Linked instances · AbarVa Admin',
};

// ─── Edge model ───────────────────────────────────────────────────────────────

type InstanceType = 'Source' | 'Program';

interface Edge {
  /** Stable edge key for deduplication — always lowSortId|highSortId|linkType */
  key: string;
  sourceId: string;
  sourceName: string;
  sourceType: InstanceType;
  targetId: string;
  targetName: string;
  targetType: InstanceType;
  linkType: LinkType;
  description: string;
  /** Stage of the target blocked on the source (from ProgramLink.blockedAtStage) */
  blockedAtStage?: string;
  /** Phase number of the program blocked on the source event (from SourceEventLink.blockedAtPhase) */
  blockedAtPhase?: number;
}

/** Canonical label shown in the blocker pill */
function blockerLabel(edge: Edge): string | null {
  if (edge.blockedAtStage) return `Blocked at ${edge.blockedAtStage}`;
  if (edge.blockedAtPhase !== undefined) return `Blocked at P${edge.blockedAtPhase}`;
  return null;
}

function edgeKey(aId: string, bId: string, linkType: string): string {
  const [lo, hi] = [aId, bId].sort();
  return `${lo}|${hi}|${linkType}`;
}

// ─── Data collection ──────────────────────────────────────────────────────────

function collectEdges(): Edge[] {
  const seen = new Set<string>();
  const edges: Edge[] = [];

  function addEdge(e: Edge): void {
    if (seen.has(e.key)) return;
    seen.add(e.key);
    edges.push(e);
  }

  // Source event → program links
  for (const inst of SOURCE_EVENT_INSTANCES) {
    for (const link of inst.linkedPrograms) {
      addEdge({
        key: edgeKey(inst.id, link.programId, link.linkType),
        sourceId: inst.id,
        sourceName: inst.name,
        sourceType: 'Source',
        targetId: link.programId,
        targetName: link.programName,
        targetType: 'Program',
        linkType: link.linkType,
        description: link.description,
        blockedAtStage: link.blockedAtStage,
      });
    }
    for (const link of inst.linkedSourceEvents) {
      addEdge({
        key: edgeKey(inst.id, link.sourceEventId, link.linkType),
        sourceId: inst.id,
        sourceName: inst.name,
        sourceType: 'Source',
        targetId: link.sourceEventId,
        targetName: link.sourceEventName,
        targetType: 'Source',
        linkType: link.linkType,
        description: link.description,
      });
    }
  }

  // Program → source event links (reverse side — dedup handles overlap)
  for (const prog of APEX_RETAIL_PROGRAM_INSTANCES) {
    for (const link of prog.linkedSourceEvents) {
      addEdge({
        key: edgeKey(prog.id, link.sourceEventId, link.linkType),
        sourceId: prog.id,
        sourceName: prog.name,
        sourceType: 'Program',
        targetId: link.sourceEventId,
        targetName: link.sourceEventName,
        targetType: 'Source',
        linkType: link.linkType,
        description: link.description,
        blockedAtPhase: link.blockedAtPhase,
      });
    }
    for (const link of prog.linkedPrograms) {
      addEdge({
        key: edgeKey(prog.id, link.programId, link.linkType),
        sourceId: prog.id,
        sourceName: prog.name,
        sourceType: 'Program',
        targetId: link.programId,
        targetName: link.programName,
        targetType: 'Program',
        linkType: link.linkType,
        description: link.description,
      });
    }
  }

  return edges;
}

interface InstanceSection {
  id: string;
  name: string;
  type: InstanceType;
  edges: Edge[];
}

function buildSections(edges: Edge[]): InstanceSection[] {
  // Build a map of instanceId → section
  const map = new Map<string, InstanceSection>();

  function ensure(id: string, name: string, type: InstanceType): InstanceSection {
    if (!map.has(id)) {
      map.set(id, { id, name, type, edges: [] });
    }
    return map.get(id)!;
  }

  for (const edge of edges) {
    ensure(edge.sourceId, edge.sourceName, edge.sourceType).edges.push(edge);
    ensure(edge.targetId, edge.targetName, edge.targetType).edges.push(edge);
  }

  // Deduplicate edges within each section
  for (const section of map.values()) {
    const seen = new Set<string>();
    section.edges = section.edges.filter((e) => {
      if (seen.has(e.key)) return false;
      seen.add(e.key);
      return true;
    });
  }

  // Sort: Programs first, then Sources, alphabetically within type
  return Array.from(map.values()).sort((a, b) => {
    if (a.type !== b.type) return a.type === 'Program' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

// ─── Stats ────────────────────────────────────────────────────────────────────

interface LinkStats {
  total: number;
  programSource: number;
  sourceSource: number;
  blockers: number;
}

function computeStats(edges: Edge[]): LinkStats {
  let programSource = 0;
  let sourceSource = 0;
  let blockers = 0;
  for (const e of edges) {
    const types = [e.sourceType, e.targetType].sort().join('|');
    if (types === 'Program|Source' || types === 'Program|program') programSource++;
    if (types === 'Source|Source') sourceSource++;
    if (e.blockedAtStage !== undefined || e.blockedAtPhase !== undefined) blockers++;
  }
  // Recount: programSource = edges where one side is Program and other is Source
  programSource = edges.filter(
    (e) =>
      (e.sourceType === 'Program' && e.targetType === 'Source') ||
      (e.sourceType === 'Source' && e.targetType === 'Program'),
  ).length;
  sourceSource = edges.filter(
    (e) => e.sourceType === 'Source' && e.targetType === 'Source',
  ).length;
  return { total: edges.length, programSource, sourceSource, blockers };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Instance detail href — only source events have instance pages in the current routes. */
function instanceHref(id: string, type: InstanceType): string | null {
  // The instances route uses instanceId param
  return `/admin/reasoning/instances/${id}`;
}

function truncate(s: string, max = 90): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

// ─── Style constants ──────────────────────────────────────────────────────────

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

// ─── Components ───────────────────────────────────────────────────────────────

function SummaryStrip({ stats }: { stats: LinkStats }) {
  const items = [
    { label: 'total links', value: stats.total },
    { label: 'program ↔ source', value: stats.programSource },
    { label: 'source ↔ source', value: stats.sourceSource },
    { label: 'blocker links', value: stats.blockers },
  ];
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        gap: SPACING.xl,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      {items.map(({ label, value }, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: SPACING.sm }}>
          <span
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 28,
              color: COLORS.ink,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {value}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
            }}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function TypeBadge({ type }: { type: InstanceType }) {
  const isProgram = type === 'Program';
  return (
    <span
      style={{
        display: 'inline-block',
        background: isProgram ? COLORS.skyPale : COLORS.mintSoft,
        color: isProgram ? COLORS.navy : '#1B5E20',
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      {type}
    </span>
  );
}

function LinkTypePill({ linkType }: { linkType: LinkType }) {
  const palette: Record<LinkType, { bg: string; fg: string }> = {
    'unblocks': { bg: COLORS.mintSoft, fg: '#1B5E20' },
    'depends-on': { bg: COLORS.amberSoft, fg: '#7A4F01' },
    'feeds': { bg: COLORS.skyPale, fg: COLORS.navy },
    'shares-vendor': { bg: `${COLORS.ink}0d`, fg: `${COLORS.ink}cc` },
    'contradicts': { bg: COLORS.coralSoft, fg: COLORS.coralInk },
  };
  const { bg, fg } = palette[linkType] ?? { bg: `${COLORS.ink}0d`, fg: `${COLORS.ink}cc` };
  const label: Record<LinkType, string> = {
    'unblocks': 'unblocks',
    'depends-on': 'depends on',
    'feeds': 'feeds',
    'shares-vendor': 'shares vendor',
    'contradicts': 'contradicts',
  };
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: fg,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {label[linkType] ?? linkType}
    </span>
  );
}

function BlockerPill({ label }: { label: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: COLORS.coralSoft,
        color: COLORS.coralInk,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

function InstanceSectionCard({
  section,
}: {
  section: InstanceSection;
}) {
  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      {/* Section header */}
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}10`,
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.sm,
        }}
      >
        <TypeBadge type={section.type} />
        <a
          href={instanceHref(section.id, section.type) ?? '#'}
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 18,
            color: COLORS.ink,
            textDecoration: 'none',
            letterSpacing: '-0.01em',
          }}
        >
          {section.name}
        </a>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}66`,
          }}
        >
          {section.id}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {section.edges.length} link{section.edges.length === 1 ? '' : 's'}
        </span>
      </header>

      {/* Links table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Link type</th>
              <th style={HEADER_CELL}>Target</th>
              <th style={HEADER_CELL}>Description</th>
              <th style={HEADER_CELL}>Blocker</th>
            </tr>
          </thead>
          <tbody>
            {section.edges.map((edge) => {
              const isBlocker =
                edge.blockedAtStage !== undefined || edge.blockedAtPhase !== undefined;
              // Determine the "other" side of the edge
              const isSelf = edge.sourceId === section.id;
              const targetId = isSelf ? edge.targetId : edge.sourceId;
              const targetName = isSelf ? edge.targetName : edge.sourceName;
              const targetType = isSelf ? edge.targetType : edge.sourceType;
              const targetHref = instanceHref(targetId, targetType);
              const blocker = blockerLabel(edge);

              return (
                <tr
                  key={edge.key}
                  style={
                    isBlocker
                      ? {
                          borderLeft: `3px solid ${COLORS.coralInk}`,
                          background: `${COLORS.coralSoft}55`,
                        }
                      : {}
                  }
                >
                  <td style={BODY_CELL}>
                    <LinkTypePill linkType={edge.linkType} />
                  </td>
                  <td style={BODY_CELL}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {targetHref ? (
                        <a
                          href={targetHref}
                          style={{
                            fontFamily: TYPOGRAPHY.sans,
                            fontSize: 12,
                            color: COLORS.navy,
                            textDecoration: 'none',
                            fontWeight: 600,
                          }}
                        >
                          {targetName}
                        </a>
                      ) : (
                        <span
                          style={{
                            fontFamily: TYPOGRAPHY.sans,
                            fontSize: 12,
                            fontWeight: 600,
                            color: COLORS.ink,
                          }}
                        >
                          {targetName}
                        </span>
                      )}
                      <TypeBadge type={targetType} />
                    </div>
                  </td>
                  <td style={{ ...BODY_CELL, color: `${COLORS.ink}99`, maxWidth: 380 }}>
                    {truncate(edge.description)}
                  </td>
                  <td style={BODY_CELL}>
                    {blocker ? (
                      <BlockerPill label={blocker} />
                    ) : (
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 11,
                          color: `${COLORS.ink}44`,
                        }}
                      >
                        —
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LinkedInstancesPage() {
  const edges = collectEdges();
  const stats = computeStats(edges);
  const sections = buildSections(edges);

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Back to Reasoning"
          primaryActionHref="/admin/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Linked instances"
        subtitle="Cross-instance dependency relationships — program links, source event links, and blocking dependencies."
      >
        <SummaryStrip stats={stats} />

        {sections.length === 0 ? (
          <div
            style={{
              background: COLORS.white,
              border: `1px dashed ${COLORS.ink}33`,
              borderRadius: RADIUS.lg,
              padding: SPACING.xl,
              textAlign: 'center',
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 14,
              color: `${COLORS.ink}aa`,
            }}
          >
            No cross-instance links found in the fixture corpus.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
            {sections.map((section) => (
              <InstanceSectionCard
                key={section.id}
                section={section}
              />
            ))}
          </div>
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

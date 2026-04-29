// /admin/reasoning/co-application — Pattern co-application reference page.
//
// Server component. Reads all lifecycle patterns, builds a symmetric
// co-application relationship map from coAppliesWithPatternIds, then computes
// observed co-application from actual instance cross-links (linkedPrograms /
// linkedSourceEvents). Renders patterns sorted by relationship count descending.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import type { LifecyclePatternSeed } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pattern co-application · AbarVa Admin',
};

// ─── Data model ───────────────────────────────────────────────────────────────

/**
 * One edge in the co-application graph.
 * `defined` = appears in coAppliesWithPatternIds on either pattern.
 * `observed` = at least one instance with patternA is linked (directly or
 *   via its linked programs/sources) to an instance with patternB.
 */
interface CoAppEdge {
  patternIdA: string;
  patternIdB: string;
  defined: boolean;
  observed: boolean;
  /** Instance IDs that create the observed linkage (deduplicated). */
  observedVia: string[];
}

// ─── Build relationship map ───────────────────────────────────────────────────

/**
 * Build a stable edge key — always lexicographically ordered so A↔B and B↔A
 * resolve to the same key.
 */
function edgeKey(a: string, b: string): string {
  return [a, b].sort().join('||');
}

function buildCoAppMap(
  patterns: LifecyclePatternSeed[],
): Map<string, CoAppEdge> {
  const map = new Map<string, CoAppEdge>();

  function ensureEdge(a: string, b: string): CoAppEdge {
    const key = edgeKey(a, b);
    if (!map.has(key)) {
      map.set(key, {
        patternIdA: [a, b].sort()[0],
        patternIdB: [a, b].sort()[1],
        defined: false,
        observed: false,
        observedVia: [],
      });
    }
    return map.get(key)!;
  }

  // ── Defined relationships (from coAppliesWithPatternIds) ──────────────────
  for (const pattern of patterns) {
    for (const relId of pattern.coAppliesWithPatternIds) {
      if (relId === pattern.patternId) continue; // self-loop guard
      ensureEdge(pattern.patternId, relId).defined = true;
    }
  }

  // ── Observed relationships (from actual instance linkages) ────────────────
  //
  // Build a quick map: instanceId → patternId for all instances
  const instancePatternMap = new Map<string, string>();
  for (const inst of SOURCE_EVENT_INSTANCES) {
    instancePatternMap.set(inst.id, inst.patternId);
  }
  for (const prog of APEX_RETAIL_PROGRAM_INSTANCES) {
    instancePatternMap.set(prog.id, prog.patternId);
  }

  function recordObserved(
    instanceId: string,
    patternA: string,
    linkedId: string,
  ): void {
    const patternB = instancePatternMap.get(linkedId);
    if (!patternB || patternA === patternB) return;
    const edge = ensureEdge(patternA, patternB);
    edge.observed = true;
    if (!edge.observedVia.includes(instanceId)) {
      edge.observedVia.push(instanceId);
    }
  }

  for (const inst of SOURCE_EVENT_INSTANCES) {
    for (const link of inst.linkedPrograms) {
      recordObserved(inst.id, inst.patternId, link.programId);
    }
    for (const link of inst.linkedSourceEvents) {
      recordObserved(inst.id, inst.patternId, link.sourceEventId);
    }
  }
  for (const prog of APEX_RETAIL_PROGRAM_INSTANCES) {
    for (const link of prog.linkedSourceEvents) {
      recordObserved(prog.id, prog.patternId, link.sourceEventId);
    }
    for (const link of prog.linkedPrograms) {
      recordObserved(prog.id, prog.patternId, link.programId);
    }
  }

  return map;
}

// ─── Per-pattern view model ───────────────────────────────────────────────────

interface PatternCoAppEntry {
  pattern: LifecyclePatternSeed;
  /** Relationships this pattern is involved in, sorted by partner patternId */
  edges: Array<{
    partnerPattern: LifecyclePatternSeed | undefined;
    partnerId: string;
    defined: boolean;
    observed: boolean;
    observedVia: string[];
  }>;
}

function buildPatternEntries(
  patterns: LifecyclePatternSeed[],
  edgeMap: Map<string, CoAppEdge>,
): PatternCoAppEntry[] {
  const patternById = new Map<string, LifecyclePatternSeed>(
    patterns.map((p) => [p.patternId as string, p]),
  );

  const entries: PatternCoAppEntry[] = [];

  for (const pattern of patterns) {
    const edges: PatternCoAppEntry['edges'] = [];

    for (const [, edge] of edgeMap) {
      let partnerId: string | null = null;
      if (edge.patternIdA === pattern.patternId) partnerId = edge.patternIdB;
      else if (edge.patternIdB === pattern.patternId) partnerId = edge.patternIdA;
      if (partnerId === null) continue;

      edges.push({
        partnerPattern: patternById.get(partnerId),
        partnerId,
        defined: edge.defined,
        observed: edge.observed,
        observedVia: edge.observedVia,
      });
    }

    // Sort partner list: defined+observed first, then defined, then observed
    edges.sort((a, b) => {
      const scoreOf = (e: typeof a) => (e.defined ? 2 : 0) + (e.observed ? 1 : 0);
      const diff = scoreOf(b) - scoreOf(a);
      if (diff !== 0) return diff;
      return a.partnerId.localeCompare(b.partnerId);
    });

    entries.push({ pattern, edges });
  }

  // Sort patterns by relationship count descending, then by patternId
  entries.sort((a, b) => {
    const diff = b.edges.length - a.edges.length;
    if (diff !== 0) return diff;
    return a.pattern.patternId.localeCompare(b.pattern.patternId);
  });

  return entries;
}

// ─── Summary strip ────────────────────────────────────────────────────────────

function SummaryStrip({
  patternCount,
  definedCount,
  observedOnlyCount,
}: {
  patternCount: number;
  definedCount: number;
  observedOnlyCount: number;
}) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        gap: SPACING.lg,
      }}
    >
      <Stat label="Patterns" value={String(patternCount)} />
      <Stat label="Defined relationships" value={String(definedCount)} />
      <Stat label="Observed only" value={String(observedOnlyCount)} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: SPACING.sm }}>
      <span
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 28,
          color: COLORS.ink,
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          color: `${COLORS.ink}99`,
          letterSpacing: '0.02em',
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Status badge helpers ──────────────────────────────────────────────────────

function DefinedBadge() {
  return (
    <span
      style={{
        display: 'inline-block',
        background: COLORS.skyPale,
        color: COLORS.navy,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.03em',
      }}
    >
      defined
    </span>
  );
}

function ObservedBadge({ count }: { count: number }) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: COLORS.mintSoft,
        color: COLORS.mintInk,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.03em',
      }}
    >
      observed{count > 0 ? ` · ${count}` : ''}
    </span>
  );
}

function RelCountBadge({ count }: { count: number }) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: `${COLORS.ink}0c`,
        color: `${COLORS.ink}cc`,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {count} {count === 1 ? 'relationship' : 'relationships'}
    </span>
  );
}

// ─── Pattern card ─────────────────────────────────────────────────────────────

function PatternCard({ entry }: { entry: PatternCoAppEntry }) {
  const { pattern, edges } = entry;

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      {/* Pattern header */}
      <div
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}0e`,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: SPACING.md,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <span
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 18,
              fontWeight: 700,
              color: COLORS.ink,
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}
          >
            {pattern.title}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: `${COLORS.ink}88`,
            }}
          >
            {pattern.patternId}
          </span>
        </div>
        <RelCountBadge count={edges.length} />
      </div>

      {/* Relationship list */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {edges.map((edge, idx) => {
          const partnerTitle = edge.partnerPattern?.title ?? edge.partnerId;
          const isLast = idx === edges.length - 1;
          return (
            <div
              key={edge.partnerId}
              style={{
                padding: `${SPACING.sm} ${SPACING.lg}`,
                borderBottom: isLast ? 'none' : `1px solid ${COLORS.ink}08`,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: SPACING.md,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 13,
                    color: COLORS.ink,
                    fontWeight: 500,
                  }}
                >
                  {partnerTitle}
                </span>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 11,
                    color: `${COLORS.ink}77`,
                  }}
                >
                  {edge.partnerId}
                </span>
                {edge.observedVia.length > 0 ? (
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 11,
                      color: `${COLORS.ink}88`,
                    }}
                  >
                    via {edge.observedVia.join(', ')}
                  </span>
                ) : null}
              </div>
              <div style={{ display: 'flex', gap: SPACING.xs, flexWrap: 'wrap', flexShrink: 0 }}>
                {edge.defined ? <DefinedBadge /> : null}
                {edge.observed ? <ObservedBadge count={edge.observedVia.length} /> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── No-relationships section ─────────────────────────────────────────────────

function NoRelSection({ patterns }: { patterns: LifecyclePatternSeed[] }) {
  if (patterns.length === 0) return null;
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
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 18,
            color: `${COLORS.ink}99`,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          No co-application relationships defined
        </h2>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}66`,
          }}
        >
          {patterns.length} pattern{patterns.length === 1 ? '' : 's'}
        </span>
      </header>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {patterns.map((p, idx) => {
          const isLast = idx === patterns.length - 1;
          return (
            <div
              key={p.patternId}
              style={{
                padding: `${SPACING.sm} ${SPACING.lg}`,
                borderBottom: isLast ? 'none' : `1px solid ${COLORS.ink}08`,
                display: 'flex',
                alignItems: 'baseline',
                gap: SPACING.md,
              }}
            >
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 13,
                  color: `${COLORS.ink}bb`,
                  fontWeight: 500,
                  minWidth: 0,
                  flex: 1,
                }}
              >
                {p.title}
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  color: `${COLORS.ink}66`,
                  flexShrink: 0,
                }}
              >
                {p.patternId}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CoApplicationPage() {
  const patterns = getAllLifecyclePatterns();
  const edgeMap = buildCoAppMap(patterns);

  const allEdges = Array.from(edgeMap.values());
  const definedCount = allEdges.filter((e) => e.defined).length;
  const observedOnlyCount = allEdges.filter((e) => e.observed && !e.defined).length;

  const entries = buildPatternEntries(patterns, edgeMap);
  const withRel = entries.filter((e) => e.edges.length > 0);
  const withoutRel = entries
    .filter((e) => e.edges.length === 0)
    .map((e) => e.pattern);

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
        title="Pattern co-application"
        subtitle="Lifecycle patterns that commonly appear together, with defined and observed co-application relationships."
      >
        <SummaryStrip
          patternCount={patterns.length}
          definedCount={definedCount}
          observedOnlyCount={observedOnlyCount}
        />

        {withRel.map((entry) => (
          <PatternCard key={entry.pattern.patternId as string} entry={entry} />
        ))}

        <NoRelSection patterns={withoutRel} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

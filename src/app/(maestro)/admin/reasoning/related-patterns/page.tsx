// /admin/reasoning/related-patterns — Pattern relationship network.
//
// Server component. Reads all lifecycle patterns and builds:
//   1. A derivation tree (derivedFromPatternIds — directional lineage)
//   2. A related-patterns map (relatedPatternIds — bidirectional similarity)
//
// No client JS needed — data is static pattern metadata.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import type { LifecyclePatternSeed } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Related patterns · AbarVa Admin',
};

// ─── Edge key helper ──────────────────────────────────────────────────────────

/** Stable bidirectional key — always lexicographic order. */
function relEdgeKey(a: string, b: string): string {
  return [a, b].sort().join('||');
}

// ─── Data model ───────────────────────────────────────────────────────────────

interface RelatedEdge {
  patternIdA: string;
  patternIdB: string;
}

interface DerivedEdge {
  /** The pattern that derives from `parentId`. */
  childId: string;
  parentId: string;
}

interface RelationshipMaps {
  /** Deduplicated bidirectional related edges. */
  relatedEdges: RelatedEdge[];
  /** Directional derivation edges: child → parent. */
  derivedEdges: DerivedEdge[];
}

function buildRelationshipMaps(patterns: LifecyclePatternSeed[]): RelationshipMaps {
  // ── Related edges ───────────────────────────────────────────────────────────
  const relSeen = new Set<string>();
  const relatedEdges: RelatedEdge[] = [];

  for (const pattern of patterns) {
    for (const relId of pattern.relatedPatternIds) {
      if (relId === pattern.patternId) continue; // self-loop guard
      const key = relEdgeKey(pattern.patternId, relId);
      if (!relSeen.has(key)) {
        relSeen.add(key);
        const [a, b] = [pattern.patternId, relId].sort();
        relatedEdges.push({ patternIdA: a, patternIdB: b });
      }
    }
  }

  // ── Derivation edges ────────────────────────────────────────────────────────
  const derivedEdges: DerivedEdge[] = [];

  for (const pattern of patterns) {
    for (const parentId of pattern.derivedFromPatternIds) {
      if (parentId === pattern.patternId) continue; // self-loop guard
      derivedEdges.push({ childId: pattern.patternId, parentId });
    }
  }

  return { relatedEdges, derivedEdges };
}

// ─── Derivation tree view model ───────────────────────────────────────────────

interface DerivationNode {
  patternId: string;
  title: string;
  children: DerivationNode[];
}

/**
 * Build a forest of derivation trees.
 * Root nodes = patterns with no derivedFromPatternIds (that are known).
 * We only include roots that have at least one derived descendant.
 */
function buildDerivationForest(
  patterns: LifecyclePatternSeed[],
  derivedEdges: DerivedEdge[],
): DerivationNode[] {
  const patternById = new Map<string, LifecyclePatternSeed>(
    patterns.map((p) => [p.patternId, p]),
  );

  // Map: parentId → list of childIds
  const childrenOf = new Map<string, string[]>();
  for (const edge of derivedEdges) {
    const kids = childrenOf.get(edge.parentId) ?? [];
    kids.push(edge.childId);
    childrenOf.set(edge.parentId, kids);
  }

  // IDs that appear as children (have parents)
  const hasParent = new Set(derivedEdges.map((e) => e.childId));

  // Roots: have children but no parent listed in our edge list
  const rootIds = new Set<string>();
  for (const [parentId] of childrenOf) {
    if (!hasParent.has(parentId)) {
      rootIds.add(parentId);
    }
  }

  function buildNode(patternId: string, visited: Set<string>): DerivationNode {
    const title = patternById.get(patternId)?.title ?? patternId;
    if (visited.has(patternId)) {
      // Cycle guard
      return { patternId, title, children: [] };
    }
    const next = new Set(visited);
    next.add(patternId);
    const kids = (childrenOf.get(patternId) ?? []).map((kid) =>
      buildNode(kid, next),
    );
    return { patternId, title, children: kids };
  }

  return Array.from(rootIds)
    .sort()
    .map((rootId) => buildNode(rootId, new Set()));
}

// ─── Related patterns view model ──────────────────────────────────────────────

interface RelatedEntry {
  pattern: LifecyclePatternSeed;
  relatedTo: Array<{ pattern: LifecyclePatternSeed | undefined; patternId: string }>;
}

function buildRelatedEntries(
  patterns: LifecyclePatternSeed[],
  relatedEdges: RelatedEdge[],
): RelatedEntry[] {
  const patternById = new Map<string, LifecyclePatternSeed>(
    patterns.map((p) => [p.patternId, p]),
  );

  const entries: RelatedEntry[] = [];

  for (const pattern of patterns) {
    const relatedTo: RelatedEntry['relatedTo'] = [];

    for (const edge of relatedEdges) {
      let partnerId: string | null = null;
      if (edge.patternIdA === pattern.patternId) partnerId = edge.patternIdB;
      else if (edge.patternIdB === pattern.patternId) partnerId = edge.patternIdA;
      if (partnerId === null) continue;

      relatedTo.push({
        pattern: patternById.get(partnerId),
        patternId: partnerId,
      });
    }

    relatedTo.sort((a, b) => a.patternId.localeCompare(b.patternId));
    entries.push({ pattern, relatedTo });
  }

  // Sort: patterns with related links first (by count desc), then alphabetically
  entries.sort((a, b) => {
    const diff = b.relatedTo.length - a.relatedTo.length;
    if (diff !== 0) return diff;
    return a.pattern.patternId.localeCompare(b.pattern.patternId);
  });

  return entries;
}

// ─── Summary strip ────────────────────────────────────────────────────────────

function SummaryStrip({
  patternCount,
  relatedEdgeCount,
  derivedEdgeCount,
}: {
  patternCount: number;
  relatedEdgeCount: number;
  derivedEdgeCount: number;
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
      <Stat label="patterns" value={String(patternCount)} />
      <Stat label="related edges" value={String(relatedEdgeCount)} />
      <Stat label="derivation edges" value={String(derivedEdgeCount)} />
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

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
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
          {title}
        </h2>
        {sub ? (
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            {sub}
          </div>
        ) : null}
      </div>
    </header>
  );
}

// ─── Derivation tree ──────────────────────────────────────────────────────────

/** Flatten the derivation forest into an ordered list of { patternId, title, depth } rows. */
interface FlatDerivationRow {
  patternId: string;
  title: string;
  depth: number;
}

function flattenForest(nodes: DerivationNode[], depth: number, out: FlatDerivationRow[]): void {
  for (const node of nodes) {
    out.push({ patternId: node.patternId, title: node.title, depth });
    flattenForest(node.children, depth + 1, out);
  }
}

function DerivationTreeSection({ forest }: { forest: DerivationNode[] }) {
  const rows: FlatDerivationRow[] = [];
  flattenForest(forest, 0, rows);

  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <SectionHeader
        title="Derivation tree"
        sub="Parent → child lineage chains derived from derivedFromPatternIds. Root patterns have no parent."
      />
      {rows.length === 0 ? (
        <div
          style={{
            padding: SPACING.lg,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: COLORS.mintInk,
            background: COLORS.mintSoft,
            margin: SPACING.md,
            borderRadius: RADIUS.md,
          }}
        >
          No derivation relationships defined.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {rows.map((row) => (
            <div
              key={row.patternId}
              style={{
                padding: `${SPACING.sm} ${SPACING.lg}`,
                paddingLeft:
                  row.depth === 0 ? SPACING.lg : `calc(${SPACING.lg} + ${row.depth * 24}px)`,
                borderBottom: `1px solid ${COLORS.ink}08`,
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.sm,
                flexWrap: 'wrap',
              }}
            >
              {row.depth > 0 ? (
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 12,
                    color: `${COLORS.ink}77`,
                    flexShrink: 0,
                  }}
                >
                  ↳ derived from
                </span>
              ) : null}
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 13,
                  color: row.depth === 0 ? COLORS.ink : `${COLORS.ink}cc`,
                  fontWeight: row.depth === 0 ? 600 : 400,
                }}
              >
                {row.title}
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  color: `${COLORS.ink}77`,
                }}
              >
                {row.patternId}
              </span>
              {row.depth === 0 ? (
                <span
                  style={{
                    display: 'inline-block',
                    background: COLORS.skyPale,
                    color: COLORS.navy,
                    borderRadius: RADIUS.pill,
                    padding: '2px 8px',
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  root
                </span>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Related patterns section ─────────────────────────────────────────────────

function NoRelatedSection({ patterns }: { patterns: LifecyclePatternSeed[] }) {
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
          No related patterns defined
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
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

function RelatedPatternsSection({ entries }: { entries: RelatedEntry[] }) {
  const withRel = entries.filter((e) => e.relatedTo.length > 0);
  const withoutRel = entries.filter((e) => e.relatedTo.length === 0).map((e) => e.pattern);

  return (
    <>
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.md,
        }}
      >
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: `${COLORS.ink}77`,
            fontWeight: 600,
          }}
        >
          Related patterns
        </div>
        {withRel.length === 0 ? (
          <div
            style={{
              background: COLORS.mintSoft,
              borderRadius: RADIUS.md,
              padding: SPACING.md,
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
              color: COLORS.mintInk,
            }}
          >
            No related pattern links defined across any patterns.
          </div>
        ) : (
          withRel.map((entry) => {
            const { pattern, relatedTo } = entry;
            return (
              <div
                key={pattern.patternId as string}
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
                    {relatedTo.length} related
                  </span>
                </div>

                {/* Related list */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {relatedTo.map((rel, idx) => {
                    const partnerTitle = rel.pattern?.title ?? rel.patternId;
                    const isLast = idx === relatedTo.length - 1;
                    return (
                      <div
                        key={rel.patternId}
                        style={{
                          padding: `${SPACING.sm} ${SPACING.lg}`,
                          borderBottom: isLast ? 'none' : `1px solid ${COLORS.ink}08`,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: SPACING.md,
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: TYPOGRAPHY.mono,
                            fontSize: 11,
                            color: `${COLORS.ink}66`,
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                        >
                          ↔
                        </span>
                        <div
                          style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}
                        >
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
                            {rel.patternId}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </section>

      <NoRelatedSection patterns={withoutRel} />
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RelatedPatternsPage() {
  const patterns = getAllLifecyclePatterns();
  const { relatedEdges, derivedEdges } = buildRelationshipMaps(patterns);

  const forest = buildDerivationForest(patterns, derivedEdges);
  const relatedEntries = buildRelatedEntries(patterns, relatedEdges);

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
        title="Related patterns"
        subtitle="Pattern similarity and derivation lineage — related-to and derived-from relationships."
      >
        <SummaryStrip
          patternCount={patterns.length}
          relatedEdgeCount={relatedEdges.length}
          derivedEdgeCount={derivedEdges.length}
        />

        <DerivationTreeSection forest={forest} />

        <RelatedPatternsSection entries={relatedEntries} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

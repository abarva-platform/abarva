// /admin/reasoning/pattern-lineage — Pattern derivation tree.
//
// Pure server component. Reads all lifecycle patterns and builds:
//   1. A lineage tree — root patterns (no derivedFromPatternIds) at the top,
//      child patterns nested under their parents.
//   2. A co-application table — symmetric pairs from coAppliesWithPatternIds.
//   3. A related patterns section — relatedPatternIds (non-derived, non-co-app).

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import type { LifecyclePatternSeed } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pattern lineage · AbarVa Admin',
};

// ─── Data model ───────────────────────────────────────────────────────────────

interface TreeNode {
  pattern: LifecyclePatternSeed;
  children: TreeNode[];
}

interface CoAppPair {
  patternA: LifecyclePatternSeed;
  patternB: LifecyclePatternSeed;
}

interface RelatedPair {
  pattern: LifecyclePatternSeed;
  related: LifecyclePatternSeed;
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function buildLineageForest(patterns: LifecyclePatternSeed[]): TreeNode[] {
  const byId = new Map<string, LifecyclePatternSeed>(
    patterns.map((p) => [p.patternId, p]),
  );

  // Collect all IDs that appear as children (have a parent).
  const childIds = new Set<string>();
  for (const p of patterns) {
    for (const parentId of p.derivedFromPatternIds ?? []) {
      if (byId.has(parentId)) childIds.add(p.patternId);
    }
  }

  // Root patterns are those not listed as children of any other pattern.
  const roots = patterns.filter((p) => !childIds.has(p.patternId));

  // Recursively build a tree node.
  function buildNode(p: LifecyclePatternSeed, visited: Set<string>): TreeNode {
    if (visited.has(p.patternId)) return { pattern: p, children: [] };
    const next = new Set(visited);
    next.add(p.patternId);

    // Children = patterns whose derivedFromPatternIds includes this pattern's id.
    const children = patterns
      .filter((c) => (c.derivedFromPatternIds ?? []).includes(p.patternId))
      .map((c) => buildNode(c, next));

    return { pattern: p, children };
  }

  return roots.map((r) => buildNode(r, new Set()));
}

function buildCoAppPairs(patterns: LifecyclePatternSeed[]): CoAppPair[] {
  const byId = new Map<string, LifecyclePatternSeed>(
    patterns.map((p) => [p.patternId, p]),
  );

  // Use a stable edge key to deduplicate A↔B / B↔A.
  const seen = new Set<string>();
  const pairs: CoAppPair[] = [];

  for (const p of patterns) {
    for (const otherId of p.coAppliesWithPatternIds ?? []) {
      if (otherId === p.patternId) continue;
      const other = byId.get(otherId);
      if (!other) continue;
      const key = [p.patternId, otherId].sort().join('||');
      if (seen.has(key)) continue;
      seen.add(key);
      const [idA, idB] = [p.patternId, otherId].sort();
      pairs.push({ patternA: byId.get(idA)!, patternB: byId.get(idB)! });
    }
  }

  return pairs.sort((a, b) => a.patternA.patternId.localeCompare(b.patternA.patternId));
}

function buildRelatedPairs(
  patterns: LifecyclePatternSeed[],
  coAppPairs: CoAppPair[],
): RelatedPair[] {
  const byId = new Map<string, LifecyclePatternSeed>(
    patterns.map((p) => [p.patternId, p]),
  );

  // Build a set of already-covered pairs (derived + co-app) so we exclude them.
  const covered = new Set<string>();
  for (const p of patterns) {
    for (const parentId of p.derivedFromPatternIds ?? []) {
      covered.add([p.patternId, parentId].sort().join('||'));
    }
  }
  for (const { patternA, patternB } of coAppPairs) {
    covered.add([patternA.patternId, patternB.patternId].sort().join('||'));
  }

  const seen = new Set<string>();
  const pairs: RelatedPair[] = [];

  for (const p of patterns) {
    for (const relId of p.relatedPatternIds ?? []) {
      if (relId === p.patternId) continue;
      const related = byId.get(relId);
      if (!related) continue;
      const key = [p.patternId, relId].sort().join('||');
      if (seen.has(key)) continue;
      if (covered.has(key)) continue; // skip derived or co-app duplicates
      seen.add(key);
      pairs.push({ pattern: p, related });
    }
  }

  return pairs.sort((a, b) => a.pattern.patternId.localeCompare(b.pattern.patternId));
}

function countDerived(patterns: LifecyclePatternSeed[]): number {
  return patterns.filter((p) => (p.derivedFromPatternIds ?? []).length > 0).length;
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function DomainPill({ domain }: { domain: string }) {
  return (
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
        whiteSpace: 'nowrap',
      }}
    >
      {domain}
    </span>
  );
}

function SummaryStrip({
  totalPatterns,
  rootCount,
  derivedCount,
  coAppCount,
}: {
  totalPatterns: number;
  rootCount: number;
  derivedCount: number;
  coAppCount: number;
}) {
  const items = [
    { label: 'patterns', value: totalPatterns },
    { label: 'root', value: rootCount },
    { label: 'derived', value: derivedCount },
    { label: 'co-applies pairs', value: coAppCount },
  ];

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: SPACING.lg,
      }}
    >
      {items.map(({ label, value }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
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

// ─── Tree node rendering ──────────────────────────────────────────────────────

/**
 * Plain function (not a component) that renders a tree node and its children.
 * Using a plain function instead of a recursive component avoids the TS2322
 * `key` prop type error that arises when `key` is passed to a typed component.
 */
function renderTreeNode(node: TreeNode, depth: number, isLast: boolean): React.ReactNode {
  const { pattern } = node;
  const isRoot = depth === 0;
  const connector = isRoot ? '' : isLast ? '└── ' : '├── ';
  const indent = depth * 24;

  return (
    <div key={pattern.patternId as string}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.sm,
          paddingLeft: indent,
          paddingTop: 6,
          paddingBottom: 6,
          borderBottom: `1px solid ${COLORS.ink}08`,
        }}
      >
        {depth > 0 && (
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 12,
              color: `${COLORS.ink}55`,
              userSelect: 'none' as const,
              flexShrink: 0,
            }}
          >
            {connector}
          </span>
        )}
        <span
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 14,
            color: COLORS.ink,
            letterSpacing: '-0.01em',
            flex: '1 1 auto',
            minWidth: 0,
          }}
        >
          {pattern.title}
        </span>
        {isRoot && (
          <span
            style={{
              display: 'inline-block',
              background: COLORS.mintSoft,
              color: '#2d7a2d',
              borderRadius: RADIUS.pill,
              padding: '2px 8px',
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase' as const,
              flexShrink: 0,
            }}
          >
            root
          </span>
        )}
        <DomainPill domain={pattern.domain} />
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}77`,
            flexShrink: 0,
          }}
        >
          {pattern.patternId}
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}99`,
            background: `${COLORS.ink}08`,
            borderRadius: RADIUS.pill,
            padding: '2px 8px',
            flexShrink: 0,
          }}
        >
          {pattern.instanceCount} inst
        </span>
      </div>
      {node.children.map((child, idx) => renderTreeNode(child, depth + 1, idx === node.children.length - 1))}
    </div>
  );
}


function LineageTree({ forest }: { forest: TreeNode[] }) {
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
        }}
      >
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Derivation tree
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 4,
          }}
        >
          Root patterns at the top — derived patterns nested under their parents
        </div>
      </header>

      <div style={{ padding: `${SPACING.sm} ${SPACING.lg}` }}>
        {forest.map((node, idx) => (
          <div
            key={node.pattern.patternId as string}
            style={{
              marginBottom: idx < forest.length - 1 ? SPACING.md : 0,
              paddingBottom: idx < forest.length - 1 ? SPACING.md : 0,
              borderBottom: idx < forest.length - 1 ? `1px solid ${COLORS.ink}10` : 'none',
            }}
          >
            {renderTreeNode(node, 0, false)}
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Co-applications table ────────────────────────────────────────────────────

function CoApplicationsTable({ pairs }: { pairs: CoAppPair[] }) {
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
            Co-application pairs
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 4,
            }}
          >
            Patterns defined to co-apply — commonly active on the same instance
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {pairs.length} pair{pairs.length === 1 ? '' : 's'}
        </span>
      </header>

      {pairs.length === 0 ? (
        <div
          style={{
            padding: SPACING.lg,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: `${COLORS.ink}99`,
          }}
        >
          No co-application relationships defined.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr>
                <th style={HEADER_CELL}>Pattern A</th>
                <th style={{ ...HEADER_CELL, width: 40, textAlign: 'center' }}> </th>
                <th style={HEADER_CELL}>Pattern B</th>
                <th style={HEADER_CELL}>Domain A</th>
                <th style={HEADER_CELL}>Domain B</th>
              </tr>
            </thead>
            <tbody>
              {pairs.map(({ patternA, patternB }) => (
                <tr key={`${patternA.patternId}||${patternB.patternId}`}>
                  <td style={BODY_CELL}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontFamily: TYPOGRAPHY.serif, fontSize: 13 }}>
                        {patternA.title}
                      </span>
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 10,
                          color: `${COLORS.ink}77`,
                        }}
                      >
                        {patternA.patternId}
                      </span>
                    </div>
                  </td>
                  <td
                    style={{
                      ...BODY_CELL,
                      textAlign: 'center',
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 14,
                      color: COLORS.navy,
                    }}
                  >
                    ↔
                  </td>
                  <td style={BODY_CELL}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontFamily: TYPOGRAPHY.serif, fontSize: 13 }}>
                        {patternB.title}
                      </span>
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 10,
                          color: `${COLORS.ink}77`,
                        }}
                      >
                        {patternB.patternId}
                      </span>
                    </div>
                  </td>
                  <td style={MONO_CELL}>
                    <DomainPill domain={patternA.domain} />
                  </td>
                  <td style={MONO_CELL}>
                    <DomainPill domain={patternB.domain} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ─── Related patterns table ───────────────────────────────────────────────────

function RelatedPatternsTable({ pairs }: { pairs: RelatedPair[] }) {
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
            Related patterns
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 4,
            }}
          >
            Non-derived, non-co-applies relationships — conceptually related patterns
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {pairs.length} relationship{pairs.length === 1 ? '' : 's'}
        </span>
      </header>

      {pairs.length === 0 ? (
        <div
          style={{
            padding: SPACING.lg,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: `${COLORS.ink}99`,
          }}
        >
          No related-pattern relationships defined.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr>
                <th style={HEADER_CELL}>Pattern</th>
                <th style={HEADER_CELL}>Related to</th>
                <th style={HEADER_CELL}>Domain</th>
                <th style={HEADER_CELL}>Related domain</th>
              </tr>
            </thead>
            <tbody>
              {pairs.map(({ pattern, related }) => (
                <tr key={`${pattern.patternId}--${related.patternId}`}>
                  <td style={BODY_CELL}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontFamily: TYPOGRAPHY.serif, fontSize: 13 }}>
                        {pattern.title}
                      </span>
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 10,
                          color: `${COLORS.ink}77`,
                        }}
                      >
                        {pattern.patternId}
                      </span>
                    </div>
                  </td>
                  <td style={BODY_CELL}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontFamily: TYPOGRAPHY.serif, fontSize: 13 }}>
                        {related.title}
                      </span>
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 10,
                          color: `${COLORS.ink}77`,
                        }}
                      >
                        {related.patternId}
                      </span>
                    </div>
                  </td>
                  <td style={MONO_CELL}>
                    <DomainPill domain={pattern.domain} />
                  </td>
                  <td style={MONO_CELL}>
                    <DomainPill domain={related.domain} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PatternLineagePage() {
  const patterns = getAllLifecyclePatterns();
  const forest = buildLineageForest(patterns);
  const coAppPairs = buildCoAppPairs(patterns);
  const relatedPairs = buildRelatedPairs(patterns, coAppPairs);

  const rootCount = forest.length;
  const derivedCount = countDerived(patterns);

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Pattern explorer"
          primaryActionHref="/admin/reasoning/patterns"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Patterns"
        title="Pattern lineage"
        subtitle="Derivation tree of lifecycle patterns — which patterns are derived from others, co-application relationships, and the full inheritance chain."
      >
        <SummaryStrip
          totalPatterns={patterns.length}
          rootCount={rootCount}
          derivedCount={derivedCount}
          coAppCount={coAppPairs.length}
        />
        <LineageTree forest={forest} />
        <CoApplicationsTable pairs={coAppPairs} />
        <RelatedPatternsTable pairs={relatedPairs} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

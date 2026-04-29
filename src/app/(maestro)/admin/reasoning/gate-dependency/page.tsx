// /admin/reasoning/gate-dependency — Gate criterion dependency graph.
//
// Pure server component. For each lifecycle pattern, infers which hard gate
// criteria in later stages logically depend on hard gate criteria in earlier
// stages, using keyword-family matching on criterion descriptions.
//
// Keyword families:
//   legal:   legal, compliance, regulatory
//   finance: budget, financial, cost
//   tech:    technical, architecture, security
//   process: approval, sign-off, sign off, signoff, review
//
// A gate in stage N "depends on" a gate in stage N-1 when:
//   - both are hard gates
//   - both descriptions share at least one keyword family
//   - the predecessor stage has strictly lower order

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import type { GateCriterion, LifecyclePatternSeed, LifecycleStage } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gate dependency · AbarVa Admin',
};

// ─── Keyword families ─────────────────────────────────────────────────────────

type KeywordFamily = 'legal' | 'finance' | 'tech' | 'process';

const KEYWORD_FAMILIES: Record<KeywordFamily, string[]> = {
  legal:   ['legal', 'compliance', 'regulatory'],
  finance: ['budget', 'financial', 'cost'],
  tech:    ['technical', 'architecture', 'security'],
  process: ['approval', 'sign-off', 'sign off', 'signoff', 'review'],
};

function getFamiliesForDescription(description: string): Set<KeywordFamily> {
  const lower = description.toLowerCase();
  const families = new Set<KeywordFamily>();
  for (const [family, keywords] of Object.entries(KEYWORD_FAMILIES) as Array<[KeywordFamily, string[]]>) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        families.add(family);
        break;
      }
    }
  }
  return families;
}

function familiesOverlap(a: Set<KeywordFamily>, b: Set<KeywordFamily>): boolean {
  for (const f of a) {
    if (b.has(f)) return true;
  }
  return false;
}

// ─── Dependency model ─────────────────────────────────────────────────────────

interface GateNode {
  /** Criterion ID */
  id: string;
  criterion: GateCriterion;
  stage: LifecycleStage;
  /** IDs of gates in an immediately preceding stage that this gate depends on. */
  dependsOn: string[];
  /** IDs of gates in immediately succeeding stages that depend on this gate. */
  dependedOnBy: string[];
  /** Longest path from any root (stage-1) gate measured in stage hops. */
  depth: number;
  families: Set<KeywordFamily>;
}

interface PatternDependencyGraph {
  pattern: LifecyclePatternSeed;
  nodes: Map<string, GateNode>;
  /** Inferred dependency edge count. */
  edgeCount: number;
  /** Gates with no incoming edges (roots). */
  roots: string[];
  /** Longest critical path as an ordered array of gate IDs. */
  criticalPath: string[];
}

function buildDependencyGraph(pattern: LifecyclePatternSeed): PatternDependencyGraph {
  const stageMap = new Map<string, LifecycleStage>(pattern.stages.map((s) => [s.id, s]));

  // Only hard gates participate in dependency inference.
  const hardGates = (pattern.gateCriteria ?? []).filter((g) => g.gateType === 'hard');

  // Group hard gates by stage order so we can look at adjacent stages.
  const byOrder = new Map<number, GateCriterion[]>();
  for (const g of hardGates) {
    const stage = stageMap.get(g.stageId);
    if (!stage) continue;
    const list = byOrder.get(stage.order) ?? [];
    list.push(g);
    byOrder.set(stage.order, list);
  }

  const sortedOrders = [...byOrder.keys()].sort((a, b) => a - b);

  // Build initial nodes.
  const nodes = new Map<string, GateNode>();
  for (const g of hardGates) {
    const stage = stageMap.get(g.stageId);
    if (!stage) continue;
    nodes.set(g.id, {
      id: g.id,
      criterion: g,
      stage,
      dependsOn: [],
      dependedOnBy: [],
      depth: 0,
      families: getFamiliesForDescription(g.description),
    });
  }

  // Infer dependencies: for each stage order N, look at stage N-1.
  let edgeCount = 0;
  for (let i = 1; i < sortedOrders.length; i++) {
    const prevOrder = sortedOrders[i - 1];
    const currOrder = sortedOrders[i];
    const prevGates = byOrder.get(prevOrder) ?? [];
    const currGates = byOrder.get(currOrder) ?? [];

    for (const curr of currGates) {
      const currNode = nodes.get(curr.id);
      if (!currNode) continue;
      for (const prev of prevGates) {
        const prevNode = nodes.get(prev.id);
        if (!prevNode) continue;
        if (familiesOverlap(currNode.families, prevNode.families)) {
          currNode.dependsOn.push(prev.id);
          prevNode.dependedOnBy.push(curr.id);
          edgeCount++;
        }
      }
    }
  }

  // Compute depth (longest path from root measured in stages).
  // Process in stage order so predecessors are already computed.
  for (const order of sortedOrders) {
    const gatesAtOrder = byOrder.get(order) ?? [];
    for (const g of gatesAtOrder) {
      const node = nodes.get(g.id);
      if (!node) continue;
      if (node.dependsOn.length === 0) {
        node.depth = 0;
      } else {
        node.depth = Math.max(
          ...node.dependsOn.map((depId) => {
            const depNode = nodes.get(depId);
            return depNode ? depNode.depth + 1 : 0;
          }),
        );
      }
    }
  }

  // Roots: hard gates with no dependencies.
  const roots = [...nodes.values()]
    .filter((n) => n.dependsOn.length === 0)
    .map((n) => n.id);

  // Critical path: find the longest chain via depth-first traversal from deepest node.
  const allNodes = [...nodes.values()];
  let deepestNode: GateNode | undefined;
  for (const n of allNodes) {
    if (!deepestNode || n.depth > deepestNode.depth) {
      deepestNode = n;
    }
  }

  const criticalPath: string[] = [];
  if (deepestNode) {
    // Walk backwards through dependsOn choosing predecessor with max depth.
    let current: GateNode | undefined = deepestNode;
    while (current) {
      criticalPath.unshift(current.id);
      if (current.dependsOn.length === 0) break;
      let best: GateNode | undefined;
      for (const depId of current.dependsOn) {
        const dep = nodes.get(depId);
        if (!dep) continue;
        if (!best || dep.depth > best.depth) best = dep;
      }
      current = best;
    }
  }

  return { pattern, nodes, edgeCount, roots, criticalPath };
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

function SummaryStrip({
  patternCount,
  totalEdges,
  independentCount,
}: {
  patternCount: number;
  totalEdges: number;
  independentCount: number;
}) {
  const stats = [
    { label: 'Patterns', value: String(patternCount) },
    { label: 'Inferred dependencies', value: String(totalEdges) },
    { label: 'Independent gates', value: String(independentCount) },
  ];

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'stretch',
        gap: 0,
      }}
    >
      {stats.map((stat, idx) => (
        <div
          key={stat.label}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            flex: '1 1 160px',
            padding: `0 ${SPACING.lg}`,
            borderLeft: idx > 0 ? `1px solid ${COLORS.ink}14` : 'none',
          }}
        >
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: `${COLORS.ink}99`,
              fontWeight: 600,
            }}
          >
            {stat.label}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 32,
              color: COLORS.ink,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
            }}
          >
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function FamilyPill({ family }: { family: KeywordFamily | string }) {
  const palettes: Record<string, { bg: string; fg: string }> = {
    legal:   { bg: COLORS.skyPale, fg: COLORS.navy },
    finance: { bg: COLORS.mintSoft, fg: COLORS.mintInk },
    tech:    { bg: `${COLORS.ink}10`, fg: `${COLORS.ink}cc` },
    process: { bg: COLORS.coralSoft, fg: COLORS.coralInk },
  };
  const palette = palettes[family] ?? { bg: `${COLORS.ink}08`, fg: `${COLORS.ink}99` };
  return (
    <span
      style={{
        display: 'inline-block',
        background: palette.bg,
        color: palette.fg,
        borderRadius: RADIUS.pill,
        padding: '1px 8px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        marginRight: 3,
        marginBottom: 2,
      }}
    >
      {family}
    </span>
  );
}

function GateIdList({ ids, title }: { ids: string[]; title?: string }) {
  if (ids.length === 0) {
    return (
      <span
        style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}44` }}
      >
        —
      </span>
    );
  }
  return (
    <div
      title={title}
      style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}
    >
      {ids.map((id) => (
        <span
          key={id}
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 10,
            color: COLORS.navy,
            background: COLORS.skyPale,
            borderRadius: RADIUS.sm,
            padding: '1px 6px',
            whiteSpace: 'nowrap',
          }}
        >
          {id}
        </span>
      ))}
    </div>
  );
}

function DependencyTable({ graph }: { graph: PatternDependencyGraph }) {
  const sortedNodes = [...graph.nodes.values()].sort((a, b) => {
    if (a.stage.order !== b.stage.order) return a.stage.order - b.stage.order;
    return a.id.localeCompare(b.id);
  });

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
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: SPACING.sm }}>
            <h2
              style={{
                fontFamily: TYPOGRAPHY.serif,
                fontSize: 20,
                color: COLORS.ink,
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              {graph.pattern.title}
            </h2>
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: `${COLORS.ink}88`,
              }}
            >
              {graph.pattern.patternId}
            </span>
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
            }}
          >
            {graph.nodes.size} hard gate{graph.nodes.size === 1 ? '' : 's'} ·{' '}
            {graph.edgeCount} inferred dependenc{graph.edgeCount === 1 ? 'y' : 'ies'} ·{' '}
            {graph.roots.length} root{graph.roots.length === 1 ? '' : 's'}
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          critical path: {graph.criticalPath.length} hop{graph.criticalPath.length === 1 ? '' : 's'}
        </span>
      </header>

      {graph.nodes.size === 0 ? (
        <div
          style={{
            padding: SPACING.lg,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: `${COLORS.ink}88`,
          }}
        >
          No hard gate criteria — dependency analysis not applicable for this pattern.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
            <thead>
              <tr>
                <th style={{ ...HEADER_CELL, width: 180 }}>Gate ID</th>
                <th style={{ ...HEADER_CELL, width: 120 }}>Stage</th>
                <th style={HEADER_CELL}>Description</th>
                <th style={{ ...HEADER_CELL, width: 100 }}>Families</th>
                <th style={{ ...HEADER_CELL, width: 180 }}>Depends on</th>
                <th style={{ ...HEADER_CELL, width: 180 }}>Depended on by</th>
                <th style={{ ...HEADER_CELL, width: 60, textAlign: 'right' }}>Depth</th>
              </tr>
            </thead>
            <tbody>
              {sortedNodes.map((node) => {
                const isOnCriticalPath = graph.criticalPath.includes(node.id);
                return (
                  <tr
                    key={node.id}
                    style={{
                      background: isOnCriticalPath
                        ? `${COLORS.navy}07`
                        : 'transparent',
                    }}
                  >
                    <td style={MONO_CELL}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {isOnCriticalPath && (
                          <span
                            title="On critical path"
                            style={{
                              display: 'inline-block',
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: COLORS.navy,
                              flexShrink: 0,
                            }}
                          />
                        )}
                        {node.id}
                      </div>
                    </td>
                    <td style={BODY_CELL}>
                      <div
                        style={{
                          fontFamily: TYPOGRAPHY.sans,
                          fontSize: 12,
                          color: COLORS.ink,
                          fontWeight: 600,
                        }}
                      >
                        {node.stage.label}
                      </div>
                      <div
                        style={{
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 10,
                          color: `${COLORS.ink}88`,
                          marginTop: 1,
                        }}
                      >
                        order {node.stage.order}
                      </div>
                    </td>
                    <td
                      style={{
                        ...BODY_CELL,
                        maxWidth: 280,
                        lineHeight: 1.45,
                        fontSize: 12,
                      }}
                    >
                      {node.criterion.description}
                    </td>
                    <td style={BODY_CELL}>
                      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                        {([...node.families] as string[]).map((f) => {
                          const pill = <FamilyPill family={f} />;
                          return <span key={f}>{pill}</span>;
                        })}
                        {node.families.size === 0 && (
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
                      </div>
                    </td>
                    <td style={BODY_CELL}>
                      <GateIdList ids={node.dependsOn} />
                    </td>
                    <td style={BODY_CELL}>
                      <GateIdList ids={node.dependedOnBy} />
                    </td>
                    <td
                      style={{
                        ...MONO_CELL,
                        textAlign: 'right',
                        fontWeight: node.depth > 0 ? 700 : 400,
                        color: node.depth > 0 ? COLORS.navy : `${COLORS.ink}44`,
                      }}
                    >
                      {node.depth}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function CriticalPathCard({ graph }: { graph: PatternDependencyGraph }) {
  const { pattern, criticalPath, nodes } = graph;

  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.navy}22`,
        borderLeft: `3px solid ${COLORS.navy}`,
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
        <div style={{ display: 'flex', alignItems: 'baseline', gap: SPACING.sm }}>
          <h3
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 16,
              color: COLORS.ink,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Critical path
          </h3>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: `${COLORS.ink}88`,
            }}
          >
            {pattern.patternId} · {criticalPath.length} hop{criticalPath.length === 1 ? '' : 's'}
          </span>
        </div>
      </header>

      {criticalPath.length === 0 ? (
        <div
          style={{
            padding: SPACING.lg,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: `${COLORS.ink}88`,
          }}
        >
          No dependency chain found — all hard gates are independent.
        </div>
      ) : (
        <div
          style={{
            padding: SPACING.lg,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: SPACING.sm,
          }}
        >
          {criticalPath.map((id, idx) => {
            const node = nodes.get(id);
            return (
              <div
                key={id}
                style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    background: `${COLORS.navy}08`,
                    borderRadius: RADIUS.md,
                    padding: `${SPACING.xs} ${SPACING.md}`,
                    border: `1px solid ${COLORS.navy}22`,
                    minWidth: 120,
                  }}
                >
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 11,
                      color: COLORS.navy,
                      fontWeight: 700,
                    }}
                  >
                    {id}
                  </span>
                  {node && (
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 11,
                        color: `${COLORS.ink}99`,
                        lineHeight: 1.3,
                      }}
                    >
                      {node.stage.label}
                    </span>
                  )}
                </div>
                {idx < criticalPath.length - 1 && (
                  <span
                    aria-hidden="true"
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 14,
                      color: COLORS.navy,
                      flexShrink: 0,
                    }}
                  >
                    →
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GateDependencyPage() {
  const patterns = getAllLifecyclePatterns();
  const graphs = patterns
    .map((p) => buildDependencyGraph(p))
    .filter((g) => g.nodes.size > 0);

  const totalEdges = graphs.reduce((acc, g) => acc + g.edgeCount, 0);
  const independentCount = graphs.reduce(
    (acc, g) => acc + [...g.nodes.values()].filter((n) => n.dependsOn.length === 0 && n.dependedOnBy.length === 0).length,
    0,
  );

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Back to reasoning"
          primaryActionHref="/admin/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Gate dependency"
        title="Gate criterion dependencies"
        subtitle="Inferred dependency graph across hard gate criteria — which gates in later stages logically depend on gates in earlier stages, based on keyword-family matching. Critical path shows the longest dependency chain per pattern."
      >
        <SummaryStrip
          patternCount={graphs.length}
          totalEdges={totalEdges}
          independentCount={independentCount}
        />

        {graphs.map((graph) => (
          <div key={graph.pattern.patternId} style={{ display: 'contents' }}>
            <CriticalPathCard graph={graph} />
            <DependencyTable graph={graph} />
          </div>
        ))}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

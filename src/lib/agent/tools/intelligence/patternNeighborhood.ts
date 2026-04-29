// pattern_neighborhood tool · Surface 2 PR-INT-C.
//
// Graph-neighborhood query against the AbarVa pattern corpus. Returns
// the patterns that are referenced by, share dependencies with, or
// contradict the named pattern. Used by Sentinel on /intelligence
// when the user asks about precedent connections, co-applies, or
// contradictions.
//
// The pattern manifest carries `relatedPatternIds` per entry —
// undirected co-applies edges authored alongside the pattern body.
// This tool uses those edges as the neighborhood substrate until the
// graph store comes online (see GRAPH_VECTOR_READINESS.md). When the
// broker exposes a graph traversal contract, swap the manifest read
// for SentinelBrokerAdapter({ includeGraphNeighborhood: true }).
//
// PR-INT-D adds the `graph-neighborhood` artifact type. For now this
// tool emits one `pattern-match` per neighbor (existing type) so the
// reactive panel can render the relations. The neighborhood summary
// is returned in the tool's data payload for the agent to narrate.

import type { AgentTool, ToolResult } from '../registry';
import { registerTool } from '../registry';
import {
  getPatternManifestEntry,
  type PatternManifestEntry,
} from './_shared';
import { resolveSentinelTenant } from './_shared';

type NeighborhoodEdgeType = 'co_applies_with' | 'contradicts' | 'depends_on' | 'precedes';

interface PatternNeighborhoodInput {
  /** Pattern id (e.g. 'pattern_ai_use_case_portfolio') or slug. */
  patternId: string;
  /** Edge-traversal depth, default 1, max 3. */
  depth?: number;
  /** Optional edge-type filter. The manifest currently authors only co_applies_with. */
  edgeTypes?: NeighborhoodEdgeType[];
}

const DEFAULT_DEPTH = 1;
const MAX_DEPTH = 3;

export const patternNeighborhoodTool: AgentTool<PatternNeighborhoodInput> = {
  name: 'pattern_neighborhood',
  description:
    'Graph-neighborhood query: what patterns are referenced by, share dependencies with, or ' +
    'contradict the named pattern? Use when the user asks about precedent connections, co-applies, ' +
    'or contradictions. Emits one pattern-match artifact per neighbor so the right pane materializes ' +
    'them. The current corpus authors co_applies_with edges; explicit contradicts / depends_on edges ' +
    'land with PR-INT-D.',
  surfaces: ['/intelligence'],
  input_schema: {
    type: 'object',
    properties: {
      patternId: {
        type: 'string',
        description: "Pattern id (e.g. 'pattern_ai_use_case_portfolio') or slug.",
      },
      depth: {
        type: 'number',
        description: 'Edge-traversal depth, default 1, max 3.',
      },
      edgeTypes: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['co_applies_with', 'contradicts', 'depends_on', 'precedes'],
        },
        description:
          'Optional filter on edge types. Defaults to co_applies_with — the only family the manifest ' +
          'currently authors.',
      },
    },
    required: ['patternId'],
  },
  handler: async (input, ctx): Promise<ToolResult> => {
    const patternKey = typeof input.patternId === 'string' ? input.patternId.trim() : '';
    if (!patternKey) {
      return {
        success: false,
        error: 'invalid_pattern_id',
        recovery: 'Give me a pattern id or slug and I will fetch its neighborhood.',
      };
    }

    const root = getPatternManifestEntry(patternKey);
    if (!root) {
      return {
        success: false,
        error: 'pattern_not_found',
        recovery:
          `No pattern in the corpus matches '${patternKey}'. Use search_patterns to find the right one.`,
      };
    }

    const depth = Math.min(
      MAX_DEPTH,
      Math.max(1, typeof input.depth === 'number' ? Math.trunc(input.depth) : DEFAULT_DEPTH),
    );

    const tenant = await resolveSentinelTenant();
    if (!tenant) {
      return {
        success: false,
        error: 'no_active_client',
        recovery:
          "There's no active client on this session, so I can't scope a neighborhood traversal. " +
          'Set the active client and try again.',
      };
    }

    // BFS traversal over manifest co_applies_with edges. The edge-type
    // filter is recorded on the result envelope but not currently used
    // for selection — the manifest only authors co_applies_with today.
    const visited = new Set<string>([root.id]);
    const frontier: PatternManifestEntry[] = [root];
    const neighbors: Array<{
      pattern: PatternManifestEntry;
      depth: number;
      edgeType: NeighborhoodEdgeType;
    }> = [];

    for (let currentDepth = 1; currentDepth <= depth; currentDepth += 1) {
      const nextFrontier: PatternManifestEntry[] = [];
      for (const node of frontier) {
        for (const relatedId of node.relatedPatternIds) {
          if (visited.has(relatedId)) continue;
          const related = getPatternManifestEntry(relatedId);
          if (!related) continue;
          visited.add(relatedId);
          neighbors.push({ pattern: related, depth: currentDepth, edgeType: 'co_applies_with' });
          nextFrontier.push(related);
        }
      }
      if (nextFrontier.length === 0) break;
      frontier.length = 0;
      frontier.push(...nextFrontier);
    }

    for (const { pattern } of neighbors) {
      const summary =
        pattern.shortDescription ?? pattern.longDescription ?? `${pattern.category ?? ''}`.trim();
      const payload = {
        patternId: pattern.id,
        name: pattern.name,
        summary: summary.length > 0 ? summary : pattern.name,
      };
      ctx.writer?.write(
        `\n[[artifact:pattern-match]]${JSON.stringify(payload)}[[/artifact]]\n`,
      );
    }

    return {
      success: true,
      data: {
        root_id: root.id,
        root_name: root.name,
        depth_requested: depth,
        edge_types_requested: input.edgeTypes ?? ['co_applies_with'],
        tenant_key: tenant.tenantKey,
        neighbor_count: neighbors.length,
        neighbors: neighbors.map((entry) => ({
          pattern_id: entry.pattern.id,
          name: entry.pattern.name,
          edge_type: entry.edgeType,
          depth: entry.depth,
        })),
        retrieval_mode: 'manifest_co_applies_v1',
        retrieval_note:
          'Manifest co_applies_with traversal until the broker exposes graph traversal ' +
          '(see SESSION_BRIEF_INTELLIGENCE.md Open Decision #2 / GRAPH_VECTOR_READINESS.md §4).',
      },
    };
  },
};

registerTool(patternNeighborhoodTool);

import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { getServerSupabase } from '@/lib/supabase-server';
import { getPrivateDataPlaneResource } from '@/lib/knowledge/private-data-plane/registry';
import type {
  GraphEdge,
  GraphEdgeKind,
  GraphNeighborhood,
  GraphNode,
  GraphNodeKind,
  GraphPath,
} from './types';

/**
 * Graph traversal over `enterprise_graph_nodes` + `enterprise_graph_edges`
 * for the persisted tenant-data layer (TD-3).
 *
 * Implements the four read paths required by the {@link TenantDataAdapter}
 * contract:
 *
 *   1. `listGraphNodes(tenantKey, kind?)`
 *   2. `listGraphEdgesForNode(tenantKey, nodeId, direction?)`
 *   3. `getGraphNeighborhood(tenantKey, rootId, opts?)` — bounded BFS
 *   4. `pathBetween(tenantKey, fromId, toId, maxDepth?)` — undirected BFS
 *
 * BFS runs in JavaScript over batched edge lookups — no recursive CTEs,
 * no graph-DB. The persisted graph today is small (≈680 nodes / ≈859
 * edges across Apex + Meridian), so a naive multi-step expansion stays
 * well under any practical timing budget.
 *
 * **Result-size caps (silent truncation).** `getGraphNeighborhood`
 * stops expanding the frontier once the accumulated result reaches the
 * hard ceiling of 100 nodes / 200 edges. Callers receive whatever was
 * collected before the cap fired plus the depth at which expansion
 * halted. The TD-1 `GraphNeighborhood` type has no `warnings` field;
 * truncation is silent by design (per the spec note in TD-3).
 *
 * **Direction.** Edges are directed in the substrate. `listGraphEdgesForNode`
 * respects direction. `pathBetween` treats the graph as undirected
 * because the graph models relationships, not flow — design doc §4.1.
 *
 * **Boundary.** Server-only. Tenant-key is required on every call;
 * cross-tenant traversal is impossible because every Supabase query
 * filters by `tenant_key`.
 *
 * TD-2 will compose an instance of this class into
 * `SupabaseTenantDataAdapter` and delegate the four adapter methods to
 * it; both slices land in the same module after TD-2 merges. Living in
 * its own file means TD-3 lands cleanly even if TD-2 is still in flight.
 */

/** Default maximum BFS depth for neighborhood expansion. */
export const DEFAULT_NEIGHBORHOOD_DEPTH = 2;

/** Hard ceiling for BFS depth (caller cannot exceed). */
export const MAX_NEIGHBORHOOD_DEPTH = 4;

/** Default maximum BFS depth for `pathBetween`. */
export const DEFAULT_PATH_DEPTH = 4;

/** Hard ceiling on collected nodes inside a single neighborhood. */
export const MAX_NEIGHBORHOOD_NODES = 100;

/** Hard ceiling on collected edges inside a single neighborhood. */
export const MAX_NEIGHBORHOOD_EDGES = 200;

/** Default row cap on `listGraphNodes` to keep accidental full scans bounded. */
export const DEFAULT_NODE_LIST_LIMIT = 500;

/** Direction filter for {@link GraphTraversal.listEdgesForNode}. */
export type EdgeDirection = 'outgoing' | 'incoming' | 'both';

/** Wire shape for a single `enterprise_graph_nodes` row. */
interface GraphNodeRow {
  tenant_key: string;
  node_id: string;
  node_type: string;
  label: string;
  properties: Record<string, unknown> | null;
}

/** Wire shape for a single `enterprise_graph_edges` row. */
interface GraphEdgeRow {
  tenant_key: string;
  edge_id: string;
  from_node_id: string;
  to_node_id: string;
  edge_type: string;
  properties: Record<string, unknown> | null;
}

const NODE_COLUMNS = 'tenant_key, node_id, node_type, label, properties';
const EDGE_COLUMNS =
  'tenant_key, edge_id, from_node_id, to_node_id, edge_type, properties';

function mapNode(row: GraphNodeRow): GraphNode {
  return {
    tenantKey: row.tenant_key,
    nodeId: row.node_id,
    // The substrate stores arbitrary node_type strings (e.g. 'cross_program_signal')
    // that aren't members of the typed {@link GraphNodeKind} union. We surface
    // the raw value rather than throwing — callers that care about the typed
    // subset can narrow at the read site.
    kind: row.node_type as GraphNodeKind,
    title: row.label,
    payload: row.properties ?? {},
  };
}

function mapEdge(row: GraphEdgeRow): GraphEdge {
  return {
    tenantKey: row.tenant_key,
    edgeId: row.edge_id,
    fromNodeId: row.from_node_id,
    toNodeId: row.to_node_id,
    // Same widening as `node_type`: the substrate carries edge_type values
    // outside the typed union (e.g. 'USES_SYSTEM', 'TARGETS_KPI'); we hand
    // them through verbatim so callers see the truth on disk.
    kind: row.edge_type as GraphEdgeKind,
    payload: row.properties ?? {},
  };
}

/** Internal helper — uniqueness key for an edge inside a BFS run. */
function edgeKey(edge: GraphEdge): string {
  return edge.edgeId;
}

/** The Supabase getter we depend on. Defaulted; tests inject a mock. */
export type SupabaseClientGetter = () => SupabaseClient;
export type SupabaseTableResolver = (
  tenantKey: string,
  tableName: string,
) => ReturnType<SupabaseClient['from']>;

const defaultClientGetter: SupabaseClientGetter = () => getServerSupabase();

/**
 * Pure-data graph traversal. The class holds no per-call state — every
 * method receives `tenantKey` and runs through the injected Supabase
 * getter so cross-tenant leakage is structurally impossible.
 *
 * Construct without arguments in production; tests pass a mock getter.
 */
export class GraphTraversal {
  private readonly getClient: SupabaseClientGetter;
  private readonly getTable?: SupabaseTableResolver;

  constructor(
    getClient: SupabaseClientGetter = defaultClientGetter,
    getTable?: SupabaseTableResolver,
  ) {
    this.getClient = getClient;
    this.getTable = getTable;
  }

  private table(tenantKey: string, tableName: string): ReturnType<SupabaseClient['from']> {
    if (this.getTable) return this.getTable(tenantKey, tableName);
    const sb = this.getClient();
    const resource = getPrivateDataPlaneResource(tenantKey);
    const schemaClient =
      resource?.privateSchema && typeof (sb as { schema?: unknown }).schema === 'function'
        ? (sb as unknown as { schema(schemaName: string): SupabaseClient }).schema(
            resource.privateSchema,
          )
        : sb;
    return schemaClient.from(tableName);
  }

  /**
   * List nodes for `tenantKey`, optionally filtered by `kind`. Capped at
   * {@link DEFAULT_NODE_LIST_LIMIT} rows so casual callers can't trigger
   * a full scan.
   */
  async listNodes(tenantKey: string, kind?: GraphNodeKind): Promise<GraphNode[]> {
    let query = this.table(tenantKey, 'enterprise_graph_nodes')
      .select(NODE_COLUMNS)
      .eq('tenant_key', tenantKey)
      .limit(DEFAULT_NODE_LIST_LIMIT);
    if (kind) {
      query = query.eq('node_type', kind);
    }
    const { data, error } = await query;
    if (error || !data) return [];
    return (data as GraphNodeRow[]).map(mapNode);
  }

  /**
   * List edges incident on `nodeId` for `tenantKey` in the requested
   * direction. `'both'` is the default and matches the contract default.
   */
  async listEdgesForNode(
    tenantKey: string,
    nodeId: string,
    direction: EdgeDirection = 'both',
  ): Promise<GraphEdge[]> {
    const base = this.table(tenantKey, 'enterprise_graph_edges')
      .select(EDGE_COLUMNS)
      .eq('tenant_key', tenantKey);

    let query;
    if (direction === 'outgoing') {
      query = base.eq('from_node_id', nodeId);
    } else if (direction === 'incoming') {
      query = base.eq('to_node_id', nodeId);
    } else {
      query = base.or(
        `from_node_id.eq.${nodeId},to_node_id.eq.${nodeId}`,
      );
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return (data as GraphEdgeRow[]).map(mapEdge);
  }

  /**
   * Bounded BFS expansion around `rootId`.
   *
   * - `maxDepth` defaults to {@link DEFAULT_NEIGHBORHOOD_DEPTH} (2) and
   *   is clamped to {@link MAX_NEIGHBORHOOD_DEPTH} (4).
   * - `edgeKinds`, when set, restricts traversal to that whitelist; an
   *   empty array means "no edges traversable" (returns just the root
   *   node and no neighbors).
   * - Result is silently truncated at {@link MAX_NEIGHBORHOOD_NODES}
   *   nodes / {@link MAX_NEIGHBORHOOD_EDGES} edges; the returned `depth`
   *   is the depth at which expansion stopped.
   */
  async getNeighborhood(
    tenantKey: string,
    rootId: string,
    opts?: { maxDepth?: number; edgeKinds?: string[] },
  ): Promise<GraphNeighborhood> {
    const requestedDepth = Math.max(0, Math.floor(opts?.maxDepth ?? DEFAULT_NEIGHBORHOOD_DEPTH));
    const maxDepth = Math.min(requestedDepth, MAX_NEIGHBORHOOD_DEPTH);
    const edgeKinds = opts?.edgeKinds;
    const edgeKindFilter = edgeKinds ? new Set(edgeKinds) : null;

    // Fetch the root node. If it doesn't exist for this tenant, return an
    // empty neighborhood at depth 0.
    const rootResult = await this.table(tenantKey, 'enterprise_graph_nodes')
      .select(NODE_COLUMNS)
      .eq('tenant_key', tenantKey)
      .eq('node_id', rootId)
      .limit(1);
    if (rootResult.error || !rootResult.data || rootResult.data.length === 0) {
      return { rootId, nodes: [], edges: [], depth: 0 };
    }

    const rootNode = mapNode((rootResult.data as GraphNodeRow[])[0]);

    const nodesById = new Map<string, GraphNode>();
    nodesById.set(rootNode.nodeId, rootNode);
    const edgesById = new Map<string, GraphEdge>();

    let frontier: string[] = [rootId];
    let reachedDepth = 0;

    for (let depth = 0; depth < maxDepth; depth += 1) {
      if (frontier.length === 0) break;
      if (
        nodesById.size >= MAX_NEIGHBORHOOD_NODES ||
        edgesById.size >= MAX_NEIGHBORHOOD_EDGES
      ) {
        break;
      }

      // Fetch every edge incident on the current frontier in one round-trip.
      const edgeResult = await this.table(tenantKey, 'enterprise_graph_edges')
        .select(EDGE_COLUMNS)
        .eq('tenant_key', tenantKey)
        .or(
          `from_node_id.in.(${frontier.map(quoteForOrIn).join(',')}),to_node_id.in.(${frontier.map(quoteForOrIn).join(',')})`,
        );

      if (edgeResult.error || !edgeResult.data) {
        // Treat a query error as "no further expansion" — we still return
        // what we collected so callers get a partial answer instead of a
        // hard failure.
        break;
      }

      const newNeighborIds = new Set<string>();
      let stopForCap = false;

      for (const row of edgeResult.data as GraphEdgeRow[]) {
        const edge = mapEdge(row);
        if (edgeKindFilter && !edgeKindFilter.has(edge.kind)) continue;
        if (edgesById.has(edgeKey(edge))) continue;

        if (edgesById.size >= MAX_NEIGHBORHOOD_EDGES) {
          stopForCap = true;
          break;
        }
        edgesById.set(edgeKey(edge), edge);

        const otherIds: string[] = [];
        if (frontier.includes(edge.fromNodeId)) {
          if (!nodesById.has(edge.toNodeId)) otherIds.push(edge.toNodeId);
        }
        if (frontier.includes(edge.toNodeId)) {
          if (!nodesById.has(edge.fromNodeId)) otherIds.push(edge.fromNodeId);
        }
        for (const id of otherIds) newNeighborIds.add(id);
      }

      reachedDepth = depth + 1;

      if (newNeighborIds.size === 0) {
        // Frontier had no new neighbors (or filter removed everything).
        break;
      }

      // Hydrate the new neighbor nodes in one round-trip.
      const neighborIds = Array.from(newNeighborIds);
      const nodeResult = await this.table(tenantKey, 'enterprise_graph_nodes')
        .select(NODE_COLUMNS)
        .eq('tenant_key', tenantKey)
        .in('node_id', neighborIds);

      if (nodeResult.error || !nodeResult.data) {
        break;
      }

      const nextFrontier: string[] = [];
      for (const row of nodeResult.data as GraphNodeRow[]) {
        const node = mapNode(row);
        if (nodesById.has(node.nodeId)) continue;
        if (nodesById.size >= MAX_NEIGHBORHOOD_NODES) {
          stopForCap = true;
          break;
        }
        nodesById.set(node.nodeId, node);
        nextFrontier.push(node.nodeId);
      }

      frontier = nextFrontier;

      if (stopForCap) break;
    }

    return {
      rootId,
      nodes: Array.from(nodesById.values()),
      edges: Array.from(edgesById.values()),
      depth: reachedDepth,
    };
  }

  /**
   * Shortest path between `fromId` and `toId`, or `null` if no path is
   * found within `maxDepth` (default {@link DEFAULT_PATH_DEPTH}, hard
   * ceiling {@link MAX_NEIGHBORHOOD_DEPTH}).
   *
   * Treated as undirected — the substrate edges are directed but the
   * design doc §4.1 calls for relationship-style traversal where edge
   * direction is metadata, not flow.
   */
  async findPath(
    tenantKey: string,
    fromId: string,
    toId: string,
    maxDepth?: number,
  ): Promise<GraphPath | null> {
    if (fromId === toId) {
      return { fromId, toId, edges: [] };
    }

    const requested = Math.max(1, Math.floor(maxDepth ?? DEFAULT_PATH_DEPTH));
    const cap = Math.min(requested, MAX_NEIGHBORHOOD_DEPTH);

    const visited = new Set<string>([fromId]);
    /** parent[node] = [prevNode, edgeUsed] */
    const parent = new Map<string, { prev: string; edge: GraphEdge }>();

    let frontier: string[] = [fromId];

    for (let depth = 0; depth < cap; depth += 1) {
      if (frontier.length === 0) break;

      const edgeResult = await this.table(tenantKey, 'enterprise_graph_edges')
        .select(EDGE_COLUMNS)
        .eq('tenant_key', tenantKey)
        .or(
          `from_node_id.in.(${frontier.map(quoteForOrIn).join(',')}),to_node_id.in.(${frontier.map(quoteForOrIn).join(',')})`,
        );

      if (edgeResult.error || !edgeResult.data) return null;

      const nextFrontier: string[] = [];
      for (const row of edgeResult.data as GraphEdgeRow[]) {
        const edge = mapEdge(row);
        // For each edge incident on the frontier, identify which side is
        // the new node we may step into.
        const candidates: string[] = [];
        if (frontier.includes(edge.fromNodeId) && !visited.has(edge.toNodeId)) {
          candidates.push(edge.toNodeId);
        }
        if (frontier.includes(edge.toNodeId) && !visited.has(edge.fromNodeId)) {
          candidates.push(edge.fromNodeId);
        }
        for (const candidate of candidates) {
          if (visited.has(candidate)) continue;
          visited.add(candidate);
          const prev =
            edge.fromNodeId === candidate ? edge.toNodeId : edge.fromNodeId;
          parent.set(candidate, { prev, edge });
          if (candidate === toId) {
            return { fromId, toId, edges: reconstructEdges(parent, fromId, toId) };
          }
          nextFrontier.push(candidate);
        }
      }

      frontier = nextFrontier;
    }

    return null;
  }
}

/**
 * Walk the parent map back from `toId` to `fromId` and return the edges
 * in path order (from → to).
 */
function reconstructEdges(
  parent: Map<string, { prev: string; edge: GraphEdge }>,
  fromId: string,
  toId: string,
): GraphEdge[] {
  const edges: GraphEdge[] = [];
  let cursor = toId;
  while (cursor !== fromId) {
    const entry = parent.get(cursor);
    if (!entry) break;
    edges.push(entry.edge);
    cursor = entry.prev;
  }
  return edges.reverse();
}

/**
 * Quote a node id for use inside a Supabase `or()` filter's `in.(...)`
 * list. The PostgREST `or` syntax requires values containing reserved
 * characters (`,`, `(`, `)`, `.`) to be wrapped in double quotes; node
 * ids look like `program:apex-cdp-2026` and contain colons and dashes,
 * which are safe — but we still wrap defensively because tenant ids and
 * future node-id schemes may pick up reserved characters.
 *
 * Internal double quotes are escaped to `\"` per PostgREST conventions.
 */
function quoteForOrIn(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`;
}

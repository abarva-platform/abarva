/**
 * Graph traversal · unit tests · TD-3
 *
 * Verifies the four BFS read paths over `enterprise_graph_nodes` +
 * `enterprise_graph_edges` against a chainable in-memory Supabase
 * mock seeded with fixtures from both `apex-retail` and
 * `meridian-health`. The seed mirrors the real schema authored by
 * `src/scripts/setup-data/load-meridian-setup-data.ts`.
 */

import {
  GraphTraversal,
  MAX_NEIGHBORHOOD_DEPTH,
} from '../graph-traversal';

jest.mock('server-only', () => ({}));

interface NodeRow {
  tenant_key: string;
  node_id: string;
  node_type: string;
  label: string;
  properties: Record<string, unknown> | null;
}

interface EdgeRow {
  tenant_key: string;
  edge_id: string;
  from_node_id: string;
  to_node_id: string;
  edge_type: string;
  properties: Record<string, unknown> | null;
}

interface QueryResult {
  data: unknown[] | null;
  error: { message: string } | null;
}

/**
 * Tiny chainable Supabase query mock: supports `select`, `eq`, `in`,
 * `or`, `limit`, awaitable via `then`. Translates the chained filters
 * into a JS predicate and applies it to the seeded rows for the table.
 */
function buildClient(seed: { nodes: NodeRow[]; edges: EdgeRow[] }) {
  type Predicate = (row: Record<string, unknown>) => boolean;

  function makeQuery(table: string): unknown {
    const predicates: Predicate[] = [];
    let limitVal: number | null = null;

    const rows = (): Record<string, unknown>[] => {
      switch (table) {
        case 'enterprise_graph_nodes':
          return seed.nodes as unknown as Record<string, unknown>[];
        case 'enterprise_graph_edges':
          return seed.edges as unknown as Record<string, unknown>[];
        default:
          return [];
      }
    };

    const builder: Record<string, unknown> = {};
    builder.select = (_cols: string) => builder;
    builder.eq = (col: string, value: unknown) => {
      predicates.push((row) => row[col] === value);
      return builder;
    };
    builder.in = (col: string, values: unknown[]) => {
      const set = new Set(values);
      predicates.push((row) => set.has(row[col]));
      return builder;
    };
    builder.or = (filterStr: string) => {
      // Parse a small subset of PostgREST `or` syntax used by the
      // production code:
      //   from_node_id.eq.<value>,to_node_id.eq.<value>
      //   from_node_id.in.(<list>),to_node_id.in.(<list>)
      const parts = splitTopLevel(filterStr);
      const predicate: Predicate = (row) =>
        parts.some((part) => evaluatePart(part, row));
      predicates.push(predicate);
      return builder;
    };
    builder.limit = (n: number) => {
      limitVal = n;
      return builder;
    };
    builder.then = (resolve: (r: QueryResult) => unknown) => {
      const filtered = rows().filter((row) => predicates.every((p) => p(row)));
      const data = limitVal != null ? filtered.slice(0, limitVal) : filtered;
      return Promise.resolve({ data, error: null }).then(resolve);
    };
    return builder;
  }

  return {
    from: jest.fn((table: string) => makeQuery(table)),
  };
}

function splitTopLevel(filterStr: string): string[] {
  // Split on commas not nested in parentheses.
  const out: string[] = [];
  let depth = 0;
  let buf = '';
  for (const ch of filterStr) {
    if (ch === '(') {
      depth += 1;
      buf += ch;
    } else if (ch === ')') {
      depth -= 1;
      buf += ch;
    } else if (ch === ',' && depth === 0) {
      out.push(buf);
      buf = '';
    } else {
      buf += ch;
    }
  }
  if (buf.length > 0) out.push(buf);
  return out;
}

function evaluatePart(part: string, row: Record<string, unknown>): boolean {
  // `<col>.eq.<value>` or `<col>.in.(<v1>,<v2>,...)`
  const eqMatch = /^([\w_]+)\.eq\.(.+)$/.exec(part);
  if (eqMatch) {
    const [, col, rawVal] = eqMatch;
    return row[col] === unquote(rawVal);
  }
  const inMatch = /^([\w_]+)\.in\.\((.+)\)$/.exec(part);
  if (inMatch) {
    const [, col, list] = inMatch;
    const values = splitTopLevel(list).map(unquote);
    return values.includes(row[col] as string);
  }
  return false;
}

function unquote(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"');
  }
  return trimmed;
}

// --- Fixtures ----------------------------------------------------------

const APEX = 'apex-retail';
const MER = 'meridian-health';

const APEX_PROGRAM = 'program:apex-cdp-2026';
const APEX_LEAD = 'person:apex:priya-iyer';
const APEX_SPONSOR = 'person:apex:jennifer-park';
const APEX_KPI = 'kpi:apex:001';
const APEX_SYS = 'sys:apex:sap-s4';
const APEX_OWNER = 'person:apex:diana-lopez';
const APEX_VENDOR = 'vendor:apex:sap';

const APEX_ENT = 'enterprise:apex-retail';
const APEX_PERSON_OTHER = 'person:apex:other';

const MER_ENT = 'enterprise:meridian-health';
const MER_PERSON = 'person:meridian:alice-kim';
const MER_SYS = 'sys:meridian:epic-ehr';

function makeFixture(): { nodes: NodeRow[]; edges: EdgeRow[] } {
  const nodes: NodeRow[] = [
    // Apex
    { tenant_key: APEX, node_id: APEX_ENT, node_type: 'enterprise', label: 'Apex Retail', properties: {} },
    { tenant_key: APEX, node_id: APEX_PROGRAM, node_type: 'program', label: 'CDP 2026', properties: { id: 'apex-cdp-2026' } },
    { tenant_key: APEX, node_id: APEX_LEAD, node_type: 'person', label: 'Priya Iyer', properties: {} },
    { tenant_key: APEX, node_id: APEX_SPONSOR, node_type: 'person', label: 'Jennifer Park', properties: {} },
    { tenant_key: APEX, node_id: APEX_KPI, node_type: 'kpi', label: 'KPI 001', properties: {} },
    { tenant_key: APEX, node_id: APEX_SYS, node_type: 'system', label: 'SAP S/4', properties: {} },
    { tenant_key: APEX, node_id: APEX_OWNER, node_type: 'person', label: 'Diana Lopez', properties: {} },
    { tenant_key: APEX, node_id: APEX_VENDOR, node_type: 'vendor', label: 'SAP', properties: {} },
    { tenant_key: APEX, node_id: APEX_PERSON_OTHER, node_type: 'person', label: 'Other Person', properties: {} },
    // Meridian
    { tenant_key: MER, node_id: MER_ENT, node_type: 'enterprise', label: 'Meridian Health', properties: {} },
    { tenant_key: MER, node_id: MER_PERSON, node_type: 'person', label: 'Alice Kim', properties: {} },
    { tenant_key: MER, node_id: MER_SYS, node_type: 'system', label: 'Epic EHR', properties: {} },
  ];

  const edges: EdgeRow[] = [
    // Apex relationships:
    //   program → LED_BY → lead
    //   program → SPONSORED_BY → sponsor
    //   program → MEASURED_FROM → kpi (as a hop for path tests)
    //   kpi → MEASURED_FROM → system
    //   system → OWNED_BY → owner
    //   system → LICENSED_FROM → vendor
    //   enterprise → HAS_EXECUTIVE → sponsor
    { tenant_key: APEX, edge_id: 'e:apex:1', from_node_id: APEX_PROGRAM, to_node_id: APEX_LEAD, edge_type: 'LED_BY', properties: {} },
    { tenant_key: APEX, edge_id: 'e:apex:2', from_node_id: APEX_PROGRAM, to_node_id: APEX_SPONSOR, edge_type: 'SPONSORED_BY', properties: {} },
    { tenant_key: APEX, edge_id: 'e:apex:3', from_node_id: APEX_KPI, to_node_id: APEX_SYS, edge_type: 'MEASURED_FROM', properties: {} },
    { tenant_key: APEX, edge_id: 'e:apex:4', from_node_id: APEX_SYS, to_node_id: APEX_OWNER, edge_type: 'OWNED_BY', properties: {} },
    { tenant_key: APEX, edge_id: 'e:apex:5', from_node_id: APEX_SYS, to_node_id: APEX_VENDOR, edge_type: 'LICENSED_FROM', properties: {} },
    { tenant_key: APEX, edge_id: 'e:apex:6', from_node_id: APEX_ENT, to_node_id: APEX_SPONSOR, edge_type: 'HAS_EXECUTIVE', properties: {} },
    // Path: program → kpi → system → owner. Use a TARGETS_KPI to bridge
    // program ↔ kpi so program → owner is reachable in 3 hops (undirected).
    { tenant_key: APEX, edge_id: 'e:apex:7', from_node_id: APEX_PROGRAM, to_node_id: APEX_KPI, edge_type: 'TARGETS_KPI', properties: {} },
    // An isolated person not reachable from program within depth 4.
    // (APEX_PERSON_OTHER has no edges.)

    // Meridian — separate sub-graph; same node ids as Apex would NOT
    // exist here, so tenant isolation is verifiable.
    { tenant_key: MER, edge_id: 'e:mer:1', from_node_id: MER_ENT, to_node_id: MER_PERSON, edge_type: 'HAS_EXECUTIVE', properties: {} },
    { tenant_key: MER, edge_id: 'e:mer:2', from_node_id: MER_PERSON, to_node_id: MER_SYS, edge_type: 'OWNED_BY', properties: {} },
  ];

  return { nodes, edges };
}

// --- Tests -------------------------------------------------------------

describe('GraphTraversal · listNodes', () => {
  it('returns persons for apex-retail when filtered by kind=person', async () => {
    const client = buildClient(makeFixture());
    const traversal = new GraphTraversal(() => client as never);
    const persons = await traversal.listNodes(APEX, 'person');
    expect(persons.map((n) => n.nodeId).sort()).toEqual(
      [APEX_LEAD, APEX_OWNER, APEX_PERSON_OTHER, APEX_SPONSOR].sort(),
    );
    persons.forEach((p) => expect(p.kind).toBe('person'));
    persons.forEach((p) => expect(p.tenantKey).toBe(APEX));
  });

  it('returns systems for meridian-health when filtered by kind=system', async () => {
    const client = buildClient(makeFixture());
    const traversal = new GraphTraversal(() => client as never);
    const systems = await traversal.listNodes(MER, 'system');
    expect(systems.map((n) => n.nodeId)).toEqual([MER_SYS]);
    expect(systems[0].kind).toBe('system');
    expect(systems[0].title).toBe('Epic EHR');
  });

  it('does not bleed Apex nodes into a Meridian listing', async () => {
    const client = buildClient(makeFixture());
    const traversal = new GraphTraversal(() => client as never);
    const merNodes = await traversal.listNodes(MER);
    merNodes.forEach((n) => expect(n.tenantKey).toBe(MER));
    expect(merNodes.some((n) => n.nodeId.startsWith('person:apex:'))).toBe(false);
  });
});

describe('GraphTraversal · listEdgesForNode', () => {
  it('returns outgoing program edges (SPONSORED_BY, LED_BY, …)', async () => {
    const client = buildClient(makeFixture());
    const traversal = new GraphTraversal(() => client as never);
    const edges = await traversal.listEdgesForNode(APEX, APEX_PROGRAM, 'outgoing');
    const kinds = edges.map((e) => e.kind).sort();
    expect(kinds).toEqual(['LED_BY', 'SPONSORED_BY', 'TARGETS_KPI']);
    edges.forEach((e) => expect(e.fromNodeId).toBe(APEX_PROGRAM));
  });

  it('returns incoming edges only when direction=incoming', async () => {
    const client = buildClient(makeFixture());
    const traversal = new GraphTraversal(() => client as never);
    const edges = await traversal.listEdgesForNode(APEX, APEX_SPONSOR, 'incoming');
    const fromIds = edges.map((e) => e.fromNodeId).sort();
    expect(fromIds).toEqual([APEX_ENT, APEX_PROGRAM]);
  });

  it('returns both directions when direction is omitted', async () => {
    const client = buildClient(makeFixture());
    const traversal = new GraphTraversal(() => client as never);
    const edges = await traversal.listEdgesForNode(APEX, APEX_SYS);
    expect(edges.length).toBe(3); // KPI → MEASURED_FROM → SYS, SYS → OWNED_BY → owner, SYS → LICENSED_FROM → vendor
  });

  it('isolates by tenant — Apex node id returns no Meridian edges', async () => {
    const client = buildClient(makeFixture());
    const traversal = new GraphTraversal(() => client as never);
    // Use Apex's node id but ask under Meridian tenant: must return [].
    const edges = await traversal.listEdgesForNode(MER, APEX_PROGRAM, 'both');
    expect(edges).toEqual([]);
  });
});

describe('GraphTraversal · getNeighborhood', () => {
  it('returns root + direct neighbors at maxDepth=1', async () => {
    const client = buildClient(makeFixture());
    const traversal = new GraphTraversal(() => client as never);
    const nb = await traversal.getNeighborhood(APEX, APEX_PROGRAM, { maxDepth: 1 });
    expect(nb.rootId).toBe(APEX_PROGRAM);
    expect(nb.depth).toBe(1);
    const ids = nb.nodes.map((n) => n.nodeId).sort();
    // Root + LED_BY/SPONSORED_BY/TARGETS_KPI direct neighbors
    expect(ids).toEqual([APEX_KPI, APEX_LEAD, APEX_PROGRAM, APEX_SPONSOR].sort());
    expect(nb.edges.length).toBe(3);
  });

  it('expands a second level at maxDepth=2', async () => {
    const client = buildClient(makeFixture());
    const traversal = new GraphTraversal(() => client as never);
    const nb = await traversal.getNeighborhood(APEX, APEX_PROGRAM, { maxDepth: 2 });
    const ids = nb.nodes.map((n) => n.nodeId);
    // depth-1: lead, sponsor, kpi
    // depth-2 from kpi: APEX_SYS (via MEASURED_FROM)
    // depth-2 from sponsor: APEX_ENT (via HAS_EXECUTIVE)
    expect(ids).toContain(APEX_SYS);
    expect(ids).toContain(APEX_ENT);
    expect(nb.depth).toBe(2);
  });

  it('honors the edgeKinds whitelist when set', async () => {
    const client = buildClient(makeFixture());
    const traversal = new GraphTraversal(() => client as never);
    const nb = await traversal.getNeighborhood(APEX, APEX_PROGRAM, {
      maxDepth: 2,
      edgeKinds: ['LED_BY'],
    });
    // Only the program → lead edge survives the filter.
    const ids = nb.nodes.map((n) => n.nodeId).sort();
    expect(ids).toEqual([APEX_LEAD, APEX_PROGRAM].sort());
    expect(nb.edges.length).toBe(1);
    expect(nb.edges[0].kind).toBe('LED_BY');
  });

  it('clamps maxDepth above MAX_NEIGHBORHOOD_DEPTH', async () => {
    const client = buildClient(makeFixture());
    const traversal = new GraphTraversal(() => client as never);
    const nb = await traversal.getNeighborhood(APEX, APEX_PROGRAM, {
      maxDepth: MAX_NEIGHBORHOOD_DEPTH + 50,
    });
    expect(nb.depth).toBeLessThanOrEqual(MAX_NEIGHBORHOOD_DEPTH);
  });

  it('returns an empty neighborhood when the root does not exist for the tenant', async () => {
    const client = buildClient(makeFixture());
    const traversal = new GraphTraversal(() => client as never);
    // APEX_PROGRAM exists for apex-retail but NOT for meridian-health.
    const nb = await traversal.getNeighborhood(MER, APEX_PROGRAM);
    expect(nb).toEqual({ rootId: APEX_PROGRAM, nodes: [], edges: [], depth: 0 });
  });
});

describe('GraphTraversal · findPath', () => {
  it('returns a same-node zero-edge path when from === to', async () => {
    const client = buildClient(makeFixture());
    const traversal = new GraphTraversal(() => client as never);
    const path = await traversal.findPath(APEX, APEX_PROGRAM, APEX_PROGRAM);
    expect(path).toEqual({ fromId: APEX_PROGRAM, toId: APEX_PROGRAM, edges: [] });
  });

  it('finds a direct (1-hop) path program → lead', async () => {
    const client = buildClient(makeFixture());
    const traversal = new GraphTraversal(() => client as never);
    const path = await traversal.findPath(APEX, APEX_PROGRAM, APEX_LEAD);
    expect(path).not.toBeNull();
    expect(path!.edges.length).toBe(1);
    expect(path!.edges[0].kind).toBe('LED_BY');
  });

  it('finds a multi-hop path program → kpi → system → owner (undirected)', async () => {
    const client = buildClient(makeFixture());
    const traversal = new GraphTraversal(() => client as never);
    const path = await traversal.findPath(APEX, APEX_PROGRAM, APEX_OWNER, 4);
    expect(path).not.toBeNull();
    expect(path!.fromId).toBe(APEX_PROGRAM);
    expect(path!.toId).toBe(APEX_OWNER);
    // BFS should pick the shortest: program → kpi → system → owner = 3 hops
    expect(path!.edges.length).toBe(3);
  });

  it('returns null when no path exists within depth', async () => {
    const client = buildClient(makeFixture());
    const traversal = new GraphTraversal(() => client as never);
    const path = await traversal.findPath(APEX, APEX_PROGRAM, APEX_PERSON_OTHER, 4);
    expect(path).toBeNull();
  });

  it('respects tenant isolation — no path across tenant boundary', async () => {
    const client = buildClient(makeFixture());
    const traversal = new GraphTraversal(() => client as never);
    // Both ids exist in the fixture but in different tenants.
    const path = await traversal.findPath(APEX, APEX_PROGRAM, MER_PERSON, 4);
    expect(path).toBeNull();
  });
});

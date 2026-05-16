import 'server-only';

import { getAnthropicClient } from '@/lib/agent/stream';
import { assembleGenomeQueryPrompt } from '@/lib/agent/prompts/genome-query';
import { clientKeyToBrokerTenantKey } from '@/lib/agent/tools/intelligence/_shared';
import { getGraphDriverIfEnabled } from '@/lib/graph/driver';
import { logNeo4jSkipped } from '@/lib/graph/neo4j-gate';
import { buildSentinelContextBundle } from '@/lib/intelligence/sentinel-broker-adapter';

// `isInt` is dynamically imported inside the gated execution path so the
// `neo4j-driver` module is not loaded at boot when `graph_neo4j_enabled`
// is OFF. See `src/lib/graph/neo4j-gate.ts`.
async function lazyIsInt(): Promise<(v: unknown) => boolean> {
  const mod = await import('neo4j-driver');
  return mod.isInt as (v: unknown) => boolean;
}

const WRITE_OPS = /\b(CREATE|MERGE|SET|DELETE|REMOVE|DROP|DETACH)\b/i;
const TENANT_PROPERTY_SCOPE =
  /(?:\{\s*(?:`?client_id`?|`?clientId`?|`?tenant_key`?|`?tenantKey`?|`?client_key`?|`?clientKey`?)\s*:\s*\$callerClientId\b|(?:\.\s*(?:`?client_id`?|`?clientId`?|`?tenant_key`?|`?tenantKey`?|`?client_key`?|`?clientKey`?)\s*=\s*\$callerClientId\b|\$callerClientId\b\s*=\s*[^,\n\r)]*\.\s*(?:`?client_id`?|`?clientId`?|`?tenant_key`?|`?tenantKey`?|`?client_key`?|`?clientKey`?)))/i;
const MATCH_CLAUSE =
  /\bMATCH\s+([\s\S]*?)(?=\bOPTIONAL\s+MATCH\b|\bMATCH\b|\bWHERE\b|\bWITH\b|\bRETURN\b|\bORDER\b|\bLIMIT\b|$)/gi;
const GLOBAL_CATALOG_LABEL = /:\s*(?:`?GenomePattern`?|`?Industry`?|`?Function`?|`?Objective`?)\b/i;

export interface BrokeredGenomeQueryInput {
  query: string;
  clientId: string;
  clientKey: string;
}

export interface BrokeredGenomeQueryResponse {
  status: number;
  body: {
    cypher?: string | null;
    rows?: Record<string, unknown>[];
    explanation?: string;
    result_shape?: string;
    error?: string;
    broker?: {
      tenantKey: string;
      itemCount: number;
      warningCount: number;
      graphNodeCount: number;
      graphEdgeCount: number;
    };
  };
}

interface TranslatedGenomeQuery {
  cypher?: string | null;
  result_shape?: string;
  explanation?: string;
}

function makeUnwrap(isInt: (v: unknown) => boolean) {
  return function unwrap(val: unknown): unknown {
    if (val == null) return val;
    if (isInt(val)) return (val as unknown as { toNumber: () => number }).toNumber();
    if (Array.isArray(val)) return val.map(unwrap);
    if (typeof val === 'object' && val !== null) {
      const obj = val as Record<string, unknown>;
      if ('properties' in obj) return obj.properties;
      if ('low' in obj && 'high' in obj && typeof (obj as { toNumber?: unknown }).toNumber === 'function') {
        return (obj as unknown as { toNumber: () => number }).toNumber();
      }
    }
    return val;
  };
}

function brokerSummary(bundle: ReturnType<typeof buildSentinelContextBundle>) {
  return {
    tenantKey: bundle.tenantKey,
    itemCount: bundle.items.length,
    warningCount: bundle.warnings.length,
    graphNodeCount: bundle.graphNeighborhood.nodeCount,
    graphEdgeCount: bundle.graphNeighborhood.edgeCount,
  };
}

function hasDisconnectedGlobalCatalogScan(cypher: string): boolean {
  for (const match of cypher.matchAll(MATCH_CLAUSE)) {
    const clause = match[1] ?? '';
    if (!GLOBAL_CATALOG_LABEL.test(clause)) continue;
    if (TENANT_PROPERTY_SCOPE.test(clause)) continue;
    if (clause.includes('-')) continue;
    return true;
  }
  return false;
}

function tenantScopeError(cypher: string): string | null {
  if (!TENANT_PROPERTY_SCOPE.test(cypher)) {
    return 'query missing tenant property scope ($callerClientId)';
  }
  if (hasDisconnectedGlobalCatalogScan(cypher)) {
    return 'query missing tenant scope for global catalog scan';
  }
  return null;
}

async function translateGenomeQuery(
  query: string,
  broker: ReturnType<typeof brokerSummary>,
): Promise<TranslatedGenomeQuery> {
  const translation = await getAnthropicClient().messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    messages: [{ role: 'user', content: assembleGenomeQueryPrompt(query, broker) }],
  });
  const text = translation.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { text: string }).text)
    .join('');
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('could not parse translation');
  }
  return JSON.parse(match[0]) as TranslatedGenomeQuery;
}

export async function runBrokeredGenomeQuery(
  input: BrokeredGenomeQueryInput,
): Promise<BrokeredGenomeQueryResponse> {
  const brokerTenantKey = clientKeyToBrokerTenantKey(input.clientKey);
  const contextBundle = buildSentinelContextBundle({
    tenantKey: brokerTenantKey,
    agentName: 'Sentinel',
    surface: 'intelligence',
    includeGraphNeighborhood: true,
    requestedDomains: ['graph_readiness', 'program_lifecycle', 'people_org', 'evidence_provenance'],
  });
  const broker = brokerSummary(contextBundle);

  if (contextBundle.blockedItems.some((item) => item.reason === 'unknown_tenant')) {
    return {
      status: 403,
      body: {
        error: 'unknown tenant context',
        explanation: `AgentContextBroker could not resolve tenant '${brokerTenantKey}'.`,
        broker,
      },
    };
  }

  let translated: TranslatedGenomeQuery;
  try {
    translated = await translateGenomeQuery(input.query, broker);
  } catch (err) {
    console.error('[genome-query-translate]', err);
    return {
      status: 500,
      body: {
        error: err instanceof Error ? err.message : 'translation failed',
        broker,
      },
    };
  }

  if (!translated.cypher) {
    return {
      status: 200,
      body: {
        cypher: null,
        rows: [],
        explanation: translated.explanation ?? "Can't answer with current schema",
        broker,
      },
    };
  }

  if (WRITE_OPS.test(translated.cypher)) {
    console.warn('[genome-query-unsafe]', { cypher: translated.cypher });
    return {
      status: 400,
      body: {
        error: 'write operations not permitted',
        cypher: translated.cypher,
        broker,
      },
    };
  }

  const tenantScopeFailure = tenantScopeError(translated.cypher);
  if (tenantScopeFailure) {
    console.warn('[genome-query-unscoped]', { cypher: translated.cypher });
    return {
      status: 400,
      body: {
        error: tenantScopeFailure,
        cypher: translated.cypher,
        explanation:
          translated.explanation ??
          'The generated query did not keep returned graph data connected to a tenant-owned $callerClientId predicate. Rephrase to scope by tenant.',
        broker,
      },
    };
  }

  // graph_neo4j_enabled gate: when off, do not execute Cypher.
  // Postgres enterprise_graph_* tables are the system of record and
  // the broker tenant-context bundle already includes a graph
  // neighborhood summary. Return an empty rows[] and surface the
  // skip in the explanation so the caller knows the Cypher was not run.
  const driver = await getGraphDriverIfEnabled({
    clientKey: input.clientKey,
    clientId: input.clientId,
  });
  if (!driver) {
    logNeo4jSkipped('runBrokeredGenomeQuery');
    return {
      status: 200,
      body: {
        cypher: translated.cypher,
        rows: [],
        explanation:
          (translated.explanation ?? '') +
          ' (graph_neo4j_enabled is OFF — Cypher was not executed; broker summary stands in.)',
        result_shape: translated.result_shape,
        broker,
      },
    };
  }
  const session = driver.session({ defaultAccessMode: 'READ' });
  try {
    const isInt = await lazyIsInt();
    const unwrap = makeUnwrap(isInt);
    const result = await session.run(translated.cypher, { callerClientId: input.clientId });
    const rows = result.records.map((r) => {
      const obj: Record<string, unknown> = {};
      for (const key of r.keys) {
        obj[key as string] = unwrap(r.get(key));
      }
      return obj;
    });
    return {
      status: 200,
      body: {
        cypher: translated.cypher,
        explanation: translated.explanation,
        result_shape: translated.result_shape,
        rows,
        broker,
      },
    };
  } catch (err) {
    console.error('[genome-query-exec]', err);
    return {
      status: 500,
      body: {
        error: err instanceof Error ? err.message : 'unknown error',
        cypher: translated.cypher,
        broker,
      },
    };
  } finally {
    await session.close();
  }
}

import 'server-only';

import { azureRead } from '@/lib/data-plane/azureRead';
import { clientKeyToBrokerTenantKey } from '@/lib/agent/tools/intelligence/_shared';
import { buildSentinelContextBundle } from '@/lib/intelligence/sentinel-broker-adapter';

const GLOBAL_CATALOG_ENUMERATION_REQUEST =
  /\b(?:list|show|return|give\s+me|display)\s+(?:all|every)\s+(?:genome\s*patterns?|genomepattern|patterns?|industries|functions|objectives)\b/i;

export interface BrokeredGenomeQueryInput {
  query: string;
  clientId: string;
  clientKey: string;
}

export interface BrokeredGenomeQueryResponse {
  status: number;
  body: {
    sql?: string | null;
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

interface TenantPatternRow {
  edge_id: string | null;
  edge_type: string | null;
  from_node_id: string | null;
  to_node_id: string | null;
  source_segment_id: string | null;
  edge_properties: Record<string, unknown> | null;
  code: string | null;
  name: string | null;
  summary: string | null;
  description: string | null;
  vertical: string | null;
  office_category: string | null;
  failure_rate_pct: number | string | null;
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

function isGlobalCatalogEnumerationRequest(query: string): boolean {
  return GLOBAL_CATALOG_ENUMERATION_REQUEST.test(query);
}

function buildTerms(query: string): string[] {
  return [...new Set(
    query
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .map((term) => term.trim())
      .filter((term) => term.length >= 4)
      .slice(0, 16),
  )];
}

function termRegex(terms: readonly string[]): RegExp | null {
  if (!terms.length) return null;
  const escaped = terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(escaped.join('|'), 'i');
}

function explainResult(rows: readonly TenantPatternRow[]): string {
  if (rows.length === 0) {
    return 'No tenant-linked genome pattern rows were found in Azure Postgres for this question.';
  }
  return `Found ${rows.length} tenant-linked genome pattern row(s) from Azure Postgres enterprise graph tables.`;
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

  if (isGlobalCatalogEnumerationRequest(input.query)) {
    return {
      status: 400,
      body: {
        error: 'query missing tenant scope for global catalog enumeration',
        explanation:
          'Global catalog enumeration is not permitted from a tenant session. Ask for tenant-triggered patterns, tenant-linked chains, or a specific pattern code.',
        broker,
      },
    };
  }

  const sql = `
    WITH tenant_edges AS (
      SELECT edge_id, edge_type, from_node_id, to_node_id, source_segment_id, properties AS edge_properties
        FROM enterprise_graph_edges
       WHERE (client_id::text = $1 OR tenant_key = $2)
       ORDER BY confidence DESC NULLS LAST, edge_id ASC
       LIMIT 200
    )
    SELECT
      e.edge_id,
      e.edge_type,
      e.from_node_id,
      e.to_node_id,
      e.source_segment_id,
      e.edge_properties,
      gp.code,
      gp.name,
      gp.summary,
      gp.description,
      gp.vertical,
      gp.office_category,
      gp.failure_rate_pct
    FROM tenant_edges e
    LEFT JOIN genome_patterns gp
      ON gp.code = e.to_node_id OR gp.code = e.from_node_id
    WHERE gp.code IS NOT NULL
    LIMIT 50
  `;

  try {
    const terms = buildTerms(input.query);
    const regex = termRegex(terms);
    const rows = await azureRead.query<TenantPatternRow>(
      sql,
      [input.clientId, brokerTenantKey],
      { missingTable: 'empty' },
    );
    const filtered = regex
      ? rows.filter((row) => regex.test([
        row.edge_type,
        row.from_node_id,
        row.to_node_id,
        row.source_segment_id,
        row.code,
        row.name,
        row.summary,
        row.description,
        row.vertical,
        row.office_category,
        JSON.stringify(row.edge_properties ?? {}),
      ].filter(Boolean).join(' ')))
      : rows;
    const finalRows = (filtered.length ? filtered : rows).slice(0, 50).map((row) => ({
      code: row.code,
      name: row.name,
      summary: row.summary ?? row.description,
      edge_type: row.edge_type,
      from_node_id: row.from_node_id,
      to_node_id: row.to_node_id,
      source_segment_id: row.source_segment_id,
      vertical: row.vertical,
      office_category: row.office_category,
      failure_rate_pct: row.failure_rate_pct,
    }));

    return {
      status: 200,
      body: {
        sql,
        rows: finalRows,
        explanation: explainResult(rows),
        result_shape: 'patterns',
        broker,
      },
    };
  } catch (err) {
    console.error('[genome-query-azure]', err);
    return {
      status: 500,
      body: {
        error: err instanceof Error ? err.message : 'Azure graph query failed',
        sql,
        broker,
      },
    };
  }
}

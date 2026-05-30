export interface GenomeQueryPromptContext {
  tenantKey: string;
  itemCount: number;
  warningCount: number;
  graphNodeCount: number;
  graphEdgeCount: number;
}

export function assembleGenomeQueryPrompt(
  userQuery: string,
  context?: GenomeQueryPromptContext,
): string {
  const brokerContext = context
    ? `
BROKER CONTEXT
The request has already been resolved through AgentContextBroker for tenant "${context.tenantKey}".
Broker context items: ${context.itemCount}.
Broker warnings: ${context.warningCount}.
Azure graph readiness: ${context.graphNodeCount} nodes, ${context.graphEdgeCount} edges.
`
    : '';

  return `You translate natural-language questions about AbarVa's Transformation Genome into read-only Azure Postgres graph lookup plans.

SCHEMA
Tables:
- enterprise_graph_nodes {client_id, tenant_key, node_id, node_type, label, source_segment_id, source_record_id, properties}
- enterprise_graph_edges {client_id, tenant_key, edge_id, from_node_id, to_node_id, edge_type, source_segment_id, source_record_id, properties}
- genome_patterns {code, name, summary, description, vertical, office_category, failure_rate_pct, keywords}

USER QUESTION
"${userQuery}"
${brokerContext}

TASK
Return a compact JSON plan for a read-only Azure Postgres graph lookup. Do not write SQL that mutates data.

TENANT ISOLATION
Every executable lookup MUST filter enterprise_graph_nodes or enterprise_graph_edges with the caller's client_id or tenant_key. Global genome_patterns may be joined only through tenant-scoped graph edges.

OUTPUT
Return ONLY JSON:

{
  "intent": "patterns" | "relationships" | "entities" | "mixed",
  "search_terms": ["term"],
  "explanation": "1-sentence plain-English description of what this lookup should retrieve"
}

RULES
- Read-only only. Never emit INSERT, UPDATE, DELETE, ALTER, DROP, TRUNCATE, GRANT, REVOKE, CREATE, or write operations.
- Never request an unscoped global catalog scan.
- Always LIMIT 50 in any downstream lookup plan.
- If the question cannot be answered with tenant-scoped graph tables, return intent: "mixed" and explain the missing source.
- No commentary outside the JSON.`;
}

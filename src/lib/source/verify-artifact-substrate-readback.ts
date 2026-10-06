// Read-only schema contract for the Source parsed-evidence and reasoning
// substrate. The signed-in upload proof separately exercises real parsing.

import { createTxSession } from "@/lib/data-plane/read-adapters/azureSession";

const EXPECTED_COLUMNS: Record<string, readonly string[]> = {
  source_artifact_chunks: ["artifact_id", "tenant_key", "source_event_id", "chunk_id", "chunk_text", "provenance"],
  source_artifact_facts: ["artifact_id", "tenant_key", "source_event_id", "fact_type", "fact_key", "fact_value", "provenance"],
  source_pricing_components: ["artifact_id", "tenant_key", "source_event_id", "component_key", "amount_usd", "provenance"],
  source_commercial_exceptions: ["artifact_id", "tenant_key", "source_event_id", "exception_type", "description", "provenance"],
  source_vendor_commitments: ["artifact_id", "tenant_key", "source_event_id", "commitment_type", "commitment_text", "provenance"],
  source_requirements: ["artifact_id", "tenant_key", "source_event_id", "requirement_key", "requirement_text", "provenance"],
  source_meeting_outcomes: ["artifact_id", "tenant_key", "source_event_id", "outcome_type", "outcome_text", "provenance"],
  source_graph_edges: ["artifact_id", "tenant_key", "source_event_id", "from_node_id", "edge_type", "to_node_id", "provenance"],
  source_context_receipts: ["tenant_key", "source_event_id", "agent_name", "used_artifact_ids", "used_chunk_ids", "used_fact_ids"],
  source_reasoning_envelopes: ["envelope_id", "source_event_id", "artifact_code", "tenant_key", "stage", "status", "claims", "envelope"],
};

async function main() {
  const transaction = createTxSession("source-artifact-substrate-readback");
  const proof = await transaction(async (run) => {
    const rows = await run<{ table_name: string; column_name: string }>(
      `SELECT table_name, column_name
         FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = ANY($1::text[])
        ORDER BY table_name, ordinal_position`,
      [Object.keys(EXPECTED_COLUMNS)],
    );
    const actual = new Map<string, Set<string>>();
    for (const row of rows) {
      const columns = actual.get(row.table_name) ?? new Set<string>();
      columns.add(row.column_name);
      actual.set(row.table_name, columns);
    }

    const missing: string[] = [];
    for (const [table, columns] of Object.entries(EXPECTED_COLUMNS)) {
      const actualColumns = actual.get(table);
      if (!actualColumns) {
        missing.push(`${table} (table)`);
        continue;
      }
      for (const column of columns) {
        if (!actualColumns.has(column)) missing.push(`${table}.${column}`);
      }
    }
    if (missing.length > 0) {
      throw new Error(`missing Source artifact substrate objects: ${missing.join(", ")}`);
    }

    return {
      structured_event: "source_artifact_substrate_schema_readback",
      ok: true,
      tables: Object.keys(EXPECTED_COLUMNS).length,
      requiredColumns: Object.values(EXPECTED_COLUMNS).reduce((sum, columns) => sum + columns.length, 0),
      readOnly: true,
    };
  });
  console.log(JSON.stringify(proof, null, 2));
}

main().catch((error) => {
  console.error("x Source artifact substrate readback failed.");
  console.error(error);
  process.exit(1);
});

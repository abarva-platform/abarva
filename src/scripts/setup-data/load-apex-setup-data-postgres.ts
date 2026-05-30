import { Client } from "pg";
import { config as loadEnv } from "dotenv";
import path from "node:path";
import {
  SEGMENTS,
  SOURCE_BASIS,
  TENANT_KEY,
  UPLOADED_BY,
  buildGraph,
  chunkRecord,
  freshState,
  parseDataset,
  type SegmentConfig,
} from "./load-apex-setup-data";
import { postgresClientOptions } from "../postgres-client-options";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv({ path: "/Users/anand/Projects/nexus/.env.local", override: false });
loadEnv();

type JsonValue = Record<string, unknown> | unknown[];
type Row = Record<string, unknown>;

const SOURCE_LABEL = "Apex Retail synthetic setup dataset";
const DEFAULT_SOURCE_ROOT = "src/scripts/setup-data/apex-data";
const APPLICATION_NAME = "section-7-1-apex-setup-loader";
const jsonbColumns = new Set([
  "after_state",
  "baseline_payload",
  "before_state",
  "chunk_metadata",
  "embedding",
  "expected_baseline",
  "properties",
  "provenance",
  "provenance_summary",
  "record_payload",
  "summary",
]);

function parseArgs() {
  const args = process.argv.slice(2);
  const sourceIdx = args.indexOf("--source");
  return {
    apply: args.includes("--apply"),
    sourceRoot: path.resolve(
      process.cwd(),
      sourceIdx >= 0 ? args[sourceIdx + 1] : DEFAULT_SOURCE_ROOT,
    ),
  };
}

function asJsonb(value: unknown): string {
  return JSON.stringify((value ?? {}) as JsonValue);
}

function placeholder(column: string, index: number): string {
  return jsonbColumns.has(column) ? `$${index}::jsonb` : `$${index}`;
}

async function upsertRows(
  client: Client,
  table: string,
  rows: Row[],
  conflictColumns: string[],
  batchSize = 100,
) {
  if (!rows.length) return 0;
  const columns = Object.keys(rows[0]);
  const updateColumns = columns.filter(
    (column) => !conflictColumns.includes(column),
  );
  let affected = 0;

  for (let start = 0; start < rows.length; start += batchSize) {
    const batch = rows.slice(start, start + batchSize);
    const params: unknown[] = [];
    const values = batch.map((row, rowIndex) => {
      const rowPlaceholders = columns.map((column, columnIndex) => {
        const paramIndex = rowIndex * columns.length + columnIndex + 1;
        const value = row[column];
        params.push(jsonbColumns.has(column) ? asJsonb(value) : value);
        return placeholder(column, paramIndex);
      });
      return `(${rowPlaceholders.join(", ")})`;
    });

    const sql = `
      INSERT INTO public.${table} (${columns.map((column) => `"${column}"`).join(", ")})
      VALUES ${values.join(", ")}
      ON CONFLICT (${conflictColumns.map((column) => `"${column}"`).join(", ")})
      DO UPDATE SET ${updateColumns.map((column) => `"${column}" = EXCLUDED."${column}"`).join(", ")}
    `;
    const result = await client.query(sql, params);
    affected += result.rowCount ?? batch.length;
  }

  return affected;
}

async function insertRows(
  client: Client,
  table: string,
  rows: Row[],
  batchSize = 100,
) {
  if (!rows.length) return 0;
  const columns = Object.keys(rows[0]);
  let affected = 0;

  for (let start = 0; start < rows.length; start += batchSize) {
    const batch = rows.slice(start, start + batchSize);
    const params: unknown[] = [];
    const values = batch.map((row, rowIndex) => {
      const rowPlaceholders = columns.map((column, columnIndex) => {
        const paramIndex = rowIndex * columns.length + columnIndex + 1;
        params.push(
          jsonbColumns.has(column) ? asJsonb(row[column]) : row[column],
        );
        return placeholder(column, paramIndex);
      });
      return `(${rowPlaceholders.join(", ")})`;
    });
    const result = await client.query(
      `INSERT INTO public.${table} (${columns.map((column) => `"${column}"`).join(", ")})
       VALUES ${values.join(", ")}`,
      params,
    );
    affected += result.rowCount ?? batch.length;
  }

  return affected;
}

async function ensureClient(client: Client) {
  const existing = await client.query<{ id: string }>(
    `SELECT id FROM public.clients WHERE tenant_key = $1 LIMIT 1`,
    [TENANT_KEY],
  );
  if (existing.rows[0]?.id) return existing.rows[0].id;

  const inserted = await client.query<{ id: string }>(
    `INSERT INTO public.clients(name, legal_name, tenant_key, industry_code)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    ["Apex Retail", "Apex Retail Group", TENANT_KEY, "retail"],
  );
  return inserted.rows[0].id;
}

function coverageFor(segment: SegmentConfig, actualCount: number) {
  return Math.min(
    100,
    Math.round((actualCount / segment.expectedRecordCount) * 10000) / 100,
  );
}

async function main() {
  const { apply, sourceRoot } = parseArgs();
  const records = await parseDataset(sourceRoot);
  const graph = buildGraph(records);
  const bySegment = new Map(
    SEGMENTS.map((segment) => [
      segment.segmentId,
      records.filter((record) => record.segmentId === segment.segmentId),
    ]),
  );
  const chunks = records.flatMap((record) =>
    chunkRecord(record).map((chunk) => ({ record, chunk })),
  );
  const summary = {
    tenantKey: TENANT_KEY,
    sourceRoot,
    mode: apply ? "apply" : "dry-run",
    segments: SEGMENTS.map((segment) => ({
      familyNumber: segment.familyNumber,
      segmentId: segment.segmentId,
      expected: segment.expectedRecordCount,
      records: bySegment.get(segment.segmentId)?.length ?? 0,
    })),
    records: records.length,
    chunks: chunks.length,
    graphNodes: graph.nodes.length,
    graphEdges: graph.edges.length,
  };

  if (!apply) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error("DATABASE_URL is required.");
  const client = new Client(
    postgresClientOptions(databaseUrl, APPLICATION_NAME),
  );
  await client.connect();
  const clientId = await ensureClient(client);
  const now = new Date().toISOString();
  let runId: string | null = null;

  try {
    await client.query("BEGIN");
    const run = await client.query<{ id: string }>(
      `INSERT INTO public.data_ingestion_runs(client_id, tenant_key, source_label, source_root, status, summary)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       RETURNING id`,
      [
        clientId,
        TENANT_KEY,
        SOURCE_LABEL,
        sourceRoot,
        "started",
        asJsonb(summary),
      ],
    );
    runId = run.rows[0].id;

    const baselines = SEGMENTS.map((segment) => ({
      client_id: clientId,
      tenant_key: TENANT_KEY,
      tenant_archetype: "retail",
      segment_id: segment.segmentId,
      expected_record_count: segment.expectedRecordCount,
      expected_freshness_days: segment.expectedFreshnessDays,
      required_for_reasoning_modes: segment.reasoningModes,
      coverage_weight: 1,
      baseline_payload: {
        family_number: segment.familyNumber,
        segment_name: segment.segmentName,
        source_label: SOURCE_LABEL,
      },
    }));

    const segmentRows = SEGMENTS.map((segment) => {
      const segmentRecords = bySegment.get(segment.segmentId) ?? [];
      const coverage = coverageFor(segment, segmentRecords.length);
      return {
        client_id: clientId,
        tenant_key: TENANT_KEY,
        segment_id: segment.segmentId,
        segment_name: segment.segmentName,
        family_number: segment.familyNumber,
        expected_baseline: {
          expected_record_count: segment.expectedRecordCount,
          freshness_days: segment.expectedFreshnessDays,
          reasoning_modes: segment.reasoningModes,
        },
        coverage_score: coverage,
        health_state:
          coverage >= 95
            ? "complete"
            : coverage >= 50
              ? "partial"
              : coverage > 0
                ? "sparse"
                : "not_started",
        record_count: segmentRecords.length,
        stale_count: segmentRecords.filter(
          (record) => freshState(record.lastReviewed, segment) === "stale",
        ).length,
        missing_count: Math.max(
          0,
          segment.expectedRecordCount - segmentRecords.length,
        ),
        last_reviewed_at: "2026-04-29T00:00:00Z",
        last_ingested_at: now,
        provenance_summary: {
          source_basis: SOURCE_BASIS,
          uploaded_by: UPLOADED_BY,
          source_root: sourceRoot,
        },
      };
    });

    const recordRows = records.map((record) => {
      const segment = SEGMENTS.find(
        (candidate) => candidate.segmentId === record.segmentId,
      )!;
      return {
        client_id: clientId,
        tenant_key: TENANT_KEY,
        segment_id: record.segmentId,
        record_id: record.recordId,
        title: record.title,
        record_kind: record.recordKind,
        source_doc: record.sourceDoc,
        source_path: record.sourcePath,
        source_basis: record.sourceBasis,
        uploaded_by: UPLOADED_BY,
        data_classification: record.dataClassification,
        confidence: record.confidence,
        last_reviewed: record.lastReviewed,
        freshness_state: freshState(record.lastReviewed, segment),
        ingestion_status: "indexed",
        indexed_at: now,
        record_text: record.recordText,
        record_payload: record.recordPayload,
      };
    });

    const nodeRows = graph.nodes.map((node) => ({
      client_id: clientId,
      tenant_key: TENANT_KEY,
      node_id: node.node_id,
      node_type: node.node_type,
      label: node.label,
      source_segment_id: node.source_segment_id ?? null,
      source_record_id: node.source_record_id ?? null,
      source_doc: node.source_doc ?? null,
      source_basis: SOURCE_BASIS,
      data_classification: node.data_classification ?? "Internal",
      confidence: node.confidence ?? 0.82,
      last_reviewed: node.last_reviewed ?? "2026-04-29",
      properties: node.properties ?? {},
    }));

    const edgeRows = graph.edges.map((edge) => ({
      client_id: clientId,
      tenant_key: TENANT_KEY,
      edge_id: edge.edge_id,
      from_node_id: edge.from_node_id,
      to_node_id: edge.to_node_id,
      edge_type: edge.edge_type,
      source_segment_id: edge.source_segment_id ?? null,
      source_record_id: edge.source_record_id ?? null,
      source_doc: edge.source_doc ?? null,
      source_basis: SOURCE_BASIS,
      confidence: edge.confidence ?? 0.82,
      properties: edge.properties ?? {},
    }));

    const chunkRows = chunks.map(({ record, chunk }) => ({
      client_id: clientId,
      tenant_key: TENANT_KEY,
      chunk_id: chunk.chunkId,
      source_segment_id: record.segmentId,
      source_record_id: record.recordId,
      source_doc: record.sourceDoc,
      source_path: record.sourcePath,
      chunk_index: chunk.chunkIndex,
      chunk_text: chunk.text,
      token_count: chunk.tokenCount,
      embedding_status: "pending",
      embedding_model: null,
      embedded_at: null,
      embedding: null,
      embedding_dim: null,
      embedding_error: null,
      provenance: {
        source_basis: SOURCE_BASIS,
        uploaded_by: UPLOADED_BY,
        data_classification: record.dataClassification,
        confidence: record.confidence,
        last_reviewed: record.lastReviewed,
        source_label: SOURCE_LABEL,
      },
      chunk_metadata: {
        title: record.title,
        record_kind: record.recordKind,
        source_label: SOURCE_LABEL,
        setup_segment: record.segmentId,
      },
    }));

    const auditRows = SEGMENTS.map((segment) => ({
      client_id: clientId,
      tenant_key: TENANT_KEY,
      actor_role: "system_import",
      action: "segment_imported",
      segment_id: segment.segmentId,
      record_id: null,
      before_state: null,
      after_state: {
        record_count: bySegment.get(segment.segmentId)?.length ?? 0,
        source_label: SOURCE_LABEL,
        run_id: runId,
      },
      classification_at_action: "Mixed",
      source_doc: "apex-retail-setup-data",
    }));

    await upsertRows(client, "tenant_expected_baselines", baselines, [
      "tenant_key",
      "segment_id",
    ]);
    await upsertRows(client, "data_inventory_segments", segmentRows, [
      "tenant_key",
      "segment_id",
    ]);
    await upsertRows(client, "data_inventory_records", recordRows, [
      "tenant_key",
      "segment_id",
      "record_id",
    ]);
    await upsertRows(client, "enterprise_graph_nodes", nodeRows, [
      "tenant_key",
      "node_id",
    ]);
    await upsertRows(client, "enterprise_graph_edges", edgeRows, [
      "tenant_key",
      "edge_id",
    ]);
    await upsertRows(client, "enterprise_context_chunks", chunkRows, [
      "tenant_key",
      "chunk_id",
    ]);
    await insertRows(client, "data_inventory_audit_log", auditRows);

    await client.query(
      `UPDATE public.data_ingestion_runs
       SET status = $2,
           records_loaded = $3,
           chunks_loaded = $4,
           nodes_loaded = $5,
           edges_loaded = $6,
           summary = $7::jsonb,
           completed_at = now()
       WHERE id = $1`,
      [
        runId,
        "completed",
        records.length,
        chunks.length,
        graph.nodes.length,
        graph.edges.length,
        asJsonb(summary),
      ],
    );
    await client.query("COMMIT");
    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    await client.query("ROLLBACK");
    if (runId) {
      await client
        .query(
          `UPDATE public.data_ingestion_runs
         SET status = $2, error_message = $3, completed_at = now()
         WHERE id = $1`,
          [
            runId,
            "failed",
            error instanceof Error ? error.message : String(error),
          ],
        )
        .catch(() => undefined);
    }
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

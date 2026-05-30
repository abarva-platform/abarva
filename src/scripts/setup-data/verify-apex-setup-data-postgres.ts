import { Client } from "pg";
import { config as loadEnv } from "dotenv";
import path from "node:path";
import { SEGMENTS, TENANT_KEY } from "./load-apex-setup-data";
import { postgresClientOptions } from "../postgres-client-options";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv({ path: "/Users/anand/Projects/nexus/.env.local", override: false });
loadEnv();

const APPLICATION_NAME = "section-7-1-apex-setup-verifier";

async function count(client: Client, sql: string, params: unknown[] = []) {
  const result = await client.query<{ count: string }>(sql, params);
  return Number(result.rows[0]?.count ?? 0);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error("DATABASE_URL is required.");
  const client = new Client(
    postgresClientOptions(databaseUrl, APPLICATION_NAME),
  );
  await client.connect();
  try {
    const segments = await client.query<{
      family_number: number;
      segment_id: string;
      segment_name: string;
      record_count: number;
      coverage_score: number;
      health_state: string;
      stale_count: number;
      missing_count: number;
    }>(
      `SELECT family_number, segment_id, segment_name, record_count, coverage_score,
              health_state, stale_count, missing_count
       FROM public.data_inventory_segments
       WHERE tenant_key = $1
       ORDER BY family_number`,
      [TENANT_KEY],
    );

    const expectedIds = new Set(SEGMENTS.map((segment) => segment.segmentId));
    const foundIds = new Set(
      segments.rows.map((segment) => segment.segment_id),
    );
    const missingSegments = [...expectedIds].filter(
      (segmentId) => !foundIds.has(segmentId),
    );
    const zeroRecordSegments = segments.rows
      .filter((segment) => Number(segment.record_count) <= 0)
      .map((segment) => segment.segment_id);

    const setupChunkCounts = await client.query<{
      embedding_status: string;
      count: string;
    }>(
      `SELECT embedding_status, COUNT(*)::text AS count
       FROM public.enterprise_context_chunks
       WHERE tenant_key = $1
         AND chunk_metadata->>'source_label' = 'Apex Retail synthetic setup dataset'
       GROUP BY embedding_status
       ORDER BY embedding_status`,
      [TENANT_KEY],
    );

    const overlayChunks = await count(
      client,
      `SELECT COUNT(*)::text
       FROM public.enterprise_context_chunks
       WHERE tenant_key = $1
         AND chunk_metadata->>'overlay_namespace' = 'retail-v1'`,
      [TENANT_KEY],
    );

    const report = {
      tenantKey: TENANT_KEY,
      expectedSetupSegments: SEGMENTS.length,
      foundSetupSegments: segments.rows.length,
      setupSegmentsPlusRetailOverlayCapability:
        segments.rows.length + (overlayChunks > 0 ? 1 : 0),
      missingSegments,
      zeroRecordSegments,
      records: await count(
        client,
        "SELECT COUNT(*)::text FROM public.data_inventory_records WHERE tenant_key = $1",
        [TENANT_KEY],
      ),
      graphNodes: await count(
        client,
        "SELECT COUNT(*)::text FROM public.enterprise_graph_nodes WHERE tenant_key = $1",
        [TENANT_KEY],
      ),
      graphEdges: await count(
        client,
        "SELECT COUNT(*)::text FROM public.enterprise_graph_edges WHERE tenant_key = $1",
        [TENANT_KEY],
      ),
      setupChunksByEmbeddingStatus: setupChunkCounts.rows.map((row) => ({
        status: row.embedding_status,
        count: Number(row.count),
      })),
      retailOverlayChunks: overlayChunks,
      segments: segments.rows,
    };

    console.log(JSON.stringify(report, null, 2));

    if (segments.rows.length !== SEGMENTS.length) {
      throw new Error(
        `Expected ${SEGMENTS.length} setup segments, found ${segments.rows.length}.`,
      );
    }
    if (missingSegments.length)
      throw new Error(`Missing setup segments: ${missingSegments.join(", ")}`);
    if (zeroRecordSegments.length)
      throw new Error(
        `Zero-record setup segments: ${zeroRecordSegments.join(", ")}`,
      );
    if (overlayChunks <= 0)
      throw new Error(
        "retail-v1 overlay chunks are not present for Apex Retail.",
      );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

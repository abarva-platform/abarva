import { Client, type ClientConfig } from "pg";

import type { HomeV4Candidate } from "@/components/home/v4/homeV4Visual";

// Reads the book-mode Home Knowledge V4 pack persisted by
// scripts/knowledge/persist-home-knowledge-v4-book.mjs. Modeled directly on
// readHomeKnowledgeDesignContractForTenantFromPostgres (same table, same
// approved/effective_to query shape) -- the only material difference is the
// artifact_type filter, since home_knowledge_packs holds both V2's
// normalized read model and V4's book-mode render_pack under the same
// (tenant_key, pack_version) uniqueness. Never throws: any failure (no
// DATABASE_URL locally, connection error, malformed row) resolves to null so
// the live /home route can always fall through to the existing V2 read.
const V4_ARTIFACT_TYPE = "NexusHomeKnowledgePackV4Book";

function homeKnowledgeV4DatabaseUrl(): string | null {
  return (
    process.env.ABARVA_AZURE_DATABASE_URL ??
    process.env.AZURE_DATABASE_URL ??
    process.env.DATABASE_URL ??
    null
  );
}

function disablePostgresSsl(connectionString: string): boolean {
  try {
    const url = new URL(connectionString);
    if (url.searchParams.get("sslmode")?.toLowerCase() === "disable") {
      return true;
    }
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

function homeKnowledgeV4ClientConfig(connectionString: string): ClientConfig {
  return {
    connectionString,
    application_name: "home-knowledge-v4-book-read",
    ssl: disablePostgresSsl(connectionString)
      ? false
      : { rejectUnauthorized: false },
  };
}

export async function readHomeKnowledgeV4PackForTenantFromPostgres(
  tenantKey: string | null | undefined,
): Promise<HomeV4Candidate | null> {
  const normalizedTenant = tenantKey?.trim().toLowerCase();
  if (!normalizedTenant) return null;
  const connectionString = homeKnowledgeV4DatabaseUrl();
  if (!connectionString) return null;

  const client = new Client(homeKnowledgeV4ClientConfig(connectionString));
  try {
    await client.connect();
    const result = await client.query<{
      id: string;
      pack_version: string;
      render_pack: HomeV4Candidate;
    }>(
      `SELECT id, pack_version, render_pack
         FROM public.home_knowledge_packs
        WHERE tenant_key = $1
          AND artifact_type = $2
          AND status = 'approved'
          AND effective_to IS NULL
        ORDER BY effective_from DESC NULLS LAST, created_at DESC
        LIMIT 1`,
      [normalizedTenant, V4_ARTIFACT_TYPE],
    );
    const row = result.rows[0];
    if (!row?.render_pack?.dimensions) return null;
    return row.render_pack;
  } catch (error) {
    console.warn(
      `[home-v4-pack] failed to read Postgres pack for tenant "${normalizedTenant}"`,
      error,
    );
    return null;
  } finally {
    await client.end().catch(() => undefined);
  }
}

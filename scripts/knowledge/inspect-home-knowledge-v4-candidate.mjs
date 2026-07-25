#!/usr/bin/env node
// Read-only diagnostic: prints a persisted Home Knowledge V4 candidate row's
// quality_report/validation_issues (and other operator-relevant columns) to
// stdout as JSON. No writes, no Claude calls -- exists so a candidate_failed
// row's actual findings can be inspected without a direct psql session (this
// environment has no route to the private-VNet Postgres; the governed ACA
// operator job does).

import fs from "node:fs";
import path from "node:path";

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}
loadEnvFile(path.resolve(process.cwd(), ".env.local"));
loadEnvFile(path.resolve(process.cwd(), ".env"));

const argv = process.argv.slice(2);
const getArg = (name, fallback = null) => {
  const prefix = `${name}=`;
  const found = argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
};

const packId = getArg("--id", process.env.HOME_KNOWLEDGE_V4_INSPECT_ID ?? null);
const tenantKey = getArg("--tenant", process.env.HOME_KNOWLEDGE_V4_INSPECT_TENANT ?? null);
// --full additionally selects render_pack -- the actual generated narrative
// content (enterprise_book + dimensions), needed for a real qualitative
// content review, not just the quality-report/validation-issues diagnostic
// this script originally existed for.
const full = argv.includes("--full") || process.env.HOME_KNOWLEDGE_V4_INSPECT_FULL === "true";

function connectionString() {
  return process.env.ABARVA_AZURE_DATABASE_URL ?? process.env.AZURE_DATABASE_URL ?? process.env.DATABASE_URL ?? null;
}

function pgOptions(url) {
  const parsed = new URL(url);
  const ssl = parsed.searchParams.get("sslmode")?.toLowerCase() === "disable" ||
    ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname)
    ? false
    : { rejectUnauthorized: false };
  return { connectionString: url, ssl, application_name: "home-knowledge-v4-book-inspect" };
}

async function main() {
  if (!packId && !tenantKey) {
    throw new Error("Pass --id=<uuid> for one row, or --tenant=<key> for that tenant's most recent NexusHomeKnowledgePackV4Book row.");
  }
  const dbUrl = connectionString();
  if (!dbUrl) throw new Error("Missing ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL.");
  const pg = await import("pg");
  const { Client } = pg.default ?? pg;
  const client = new Client(pgOptions(dbUrl));
  await client.connect();
  try {
    const columns = `id, tenant_key, tenant_name, pack_version, status, artifact_type,
                  content_hash, generator_version, generated_model, claude_prompt_version,
                  claude_prompt_hash, validation_status, quality_report, validation_issues,
                  created_at, updated_at, approved_by, approved_at, effective_from, effective_to${full ? ", render_pack" : ""}`;
    const result = packId
      ? await client.query(
          `SELECT ${columns}
             FROM public.home_knowledge_packs
            WHERE id = $1`,
          [packId],
        )
      : await client.query(
          `SELECT ${columns}
             FROM public.home_knowledge_packs
            WHERE tenant_key = $1 AND artifact_type = 'NexusHomeKnowledgePackV4Book'
            ORDER BY created_at DESC LIMIT 1`,
          [tenantKey],
        );
    if (result.rows.length === 0) {
      console.log(JSON.stringify({ found: false, id: packId, tenant_key: tenantKey }, null, 2));
      return;
    }
    console.log(JSON.stringify({ found: true, row: result.rows[0] }, null, 2));
  } finally {
    await client.end().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

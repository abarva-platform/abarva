#!/usr/bin/env node
// Persists real book-mode Home Knowledge V4 candidates -- already generated
// by build-home-knowledge-v4-review-pack.mjs in a real (non-preflight) run,
// e.g. the tenants/<tenant>/candidate-home-knowledge-v4.json produced by the
// home:knowledge-v4:canary-job ACA job -- into public.home_knowledge_packs.
//
// Reuses the V2 table rather than adding a migration: pack_version is
// unconstrained free text, UNIQUE(tenant_key, pack_version) and the partial
// "one active approved" index already support a new version string
// coexisting with V2's own row for the same tenant. Unlike V2's 13-table
// normalization, the whole book-mode candidate (enterprise_book +
// dimensions[], including each dimension's resolved primary_visual) is one
// self-contained object, so it goes straight into the single render_pack
// JSONB column -- no child tables.
//
// This script's default write path NEVER writes status='approved'. Every
// persisted row starts life as 'candidate'. Flipping one tenant's row to
// 'approved' -- the actual "go live" moment for that tenant -- is a
// separate, explicit action via --approve=<tenantKey>, run only after a
// human has reviewed the real content (e.g. via /home/v4-preview).

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

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
const args = new Set(argv);
const getArg = (name, fallback = null) => {
  const prefix = `${name}=`;
  const found = argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
};

const candidateDir = getArg("--candidate-dir", process.env.HOME_KNOWLEDGE_V4_CANDIDATE_DIR ?? "/tmp/home-knowledge-v4-canary");
const requestedTenant = getArg("--tenant", process.env.HOME_KNOWLEDGE_V4_TENANT ?? "all");
const approveTenant = getArg("--approve", null);
const approvedBy = getArg("--approved-by", process.env.HOME_KNOWLEDGE_V4_APPROVER ?? null);
const writeDb = args.has("--write-db");
const dryRun = !writeDb;

const ARTIFACT_TYPE = "NexusHomeKnowledgePackV4Book";
const GENERATED_BY = "build-home-knowledge-v4-review-pack.mjs";

function requestedTenantSet() {
  if (requestedTenant === "all") return null;
  const tenants = requestedTenant
    .split(",")
    .map((tenant) => tenant.trim())
    .filter(Boolean);
  if (tenants.length === 0) {
    throw new Error("--tenant / HOME_KNOWLEDGE_V4_TENANT did not include any tenant keys.");
  }
  return new Set(tenants);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function connectionString() {
  return process.env.ABARVA_AZURE_DATABASE_URL ?? process.env.AZURE_DATABASE_URL ?? process.env.DATABASE_URL ?? null;
}

function pgOptions(url) {
  const parsed = new URL(url);
  const ssl = parsed.searchParams.get("sslmode")?.toLowerCase() === "disable" ||
    ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname)
    ? false
    : { rejectUnauthorized: false };
  return { connectionString: url, ssl, application_name: "home-knowledge-v4-book-persist" };
}

const JSON_COLUMNS = new Set(["source_context", "render_pack", "quality_report", "validation_issues"]);
function dbValue(column, value) {
  return JSON_COLUMNS.has(column) ? JSON.stringify(value ?? null) : value;
}

function discoverCandidateFiles() {
  const tenantsRoot = path.join(candidateDir, "tenants");
  if (!fs.existsSync(tenantsRoot)) {
    throw new Error(`No tenants/ directory found under --candidate-dir ${candidateDir}`);
  }
  const requested = requestedTenantSet();
  return fs.readdirSync(tenantsRoot)
    .filter((tenant) => !requested || requested.has(tenant))
    .map((tenant) => ({ tenant, file: path.join(tenantsRoot, tenant, "candidate-home-knowledge-v4.json") }))
    .filter((item) => fs.existsSync(item.file));
}

function buildPackRow(rawText, candidate) {
  const contentHash = sha256(rawText);
  const tenantKey = candidate.tenant?.canonical_key;
  if (!tenantKey) throw new Error("Candidate has no tenant.canonical_key -- refusing to persist an unidentified pack.");
  const violations = candidate.validation?.violations ?? [];
  return {
    tenant_key: tenantKey,
    tenant_name: candidate.tenant?.display_name ?? tenantKey,
    pack_version: `home-pack-v4-book-${tenantKey}-${contentHash.slice(0, 16)}`,
    status: "candidate",
    artifact_type: ARTIFACT_TYPE,
    source_pack_hash: candidate.tenant?.source_snapshot_hash ?? null,
    source_dataset_version: candidate.output_schema_version ?? null,
    source_context: { requested_dimensions: candidate.requested_dimensions ?? null, passes: candidate.passes ?? null },
    generator_version: candidate.prompt_contract_version ?? null,
    generated_by: GENERATED_BY,
    generated_model: candidate.model ?? null,
    claude_model: candidate.model ?? null,
    claude_prompt_version: candidate.prompt_contract_version ?? null,
    claude_prompt_hash: candidate.story_architecture_hash ?? null,
    content_hash: contentHash,
    render_pack: candidate,
    quality_score: null,
    quality_report: candidate.validation ?? {},
    validation_status: violations.length === 0 ? "pass" : "fail",
    validation_issues: violations,
    approved_by: null,
    approved_at: null,
    effective_from: null,
    effective_to: null,
  };
}

async function writeCandidateRow(client, pack) {
  const columns = Object.keys(pack);
  const values = columns.map((key) => dbValue(key, pack[key]));
  const sql = `
    INSERT INTO public.home_knowledge_packs (${columns.join(", ")})
    VALUES (${columns.map((_, i) => `$${i + 1}`).join(", ")})
    ON CONFLICT (tenant_key, pack_version) DO UPDATE SET
      tenant_name = EXCLUDED.tenant_name,
      source_context = EXCLUDED.source_context,
      quality_report = EXCLUDED.quality_report,
      validation_status = EXCLUDED.validation_status,
      validation_issues = EXCLUDED.validation_issues,
      render_pack = EXCLUDED.render_pack,
      updated_at = now()
    RETURNING id, status`;
  const result = await client.query(sql, values);
  return result.rows[0];
}

async function approveTenantPack(client, tenantKey, actor) {
  await client.query("BEGIN");
  try {
    const latest = await client.query(
      `SELECT id FROM public.home_knowledge_packs
        WHERE tenant_key = $1 AND artifact_type = $2 AND status = 'candidate'
        ORDER BY created_at DESC LIMIT 1`,
      [tenantKey, ARTIFACT_TYPE],
    );
    if (latest.rows.length === 0) {
      throw new Error(`No candidate ${ARTIFACT_TYPE} pack found for tenant "${tenantKey}" -- persist one first.`);
    }
    const packId = latest.rows[0].id;
    // Only one approved+active row may exist per tenant (partial unique
    // index home_knowledge_packs_one_active_approved, tenant-scoped across
    // ALL artifact types/pack_versions) -- this is the actual live-route
    // swap: approving a V4 book pack retires whatever V2 or prior-V4 row was
    // live for this tenant.
    await client.query(
      `UPDATE public.home_knowledge_packs
        SET effective_to = now(), status = 'retired', updated_at = now()
        WHERE tenant_key = $1 AND status = 'approved' AND effective_to IS NULL`,
      [tenantKey],
    );
    const approved = await client.query(
      `UPDATE public.home_knowledge_packs
        SET status = 'approved', approved_by = $2, approved_at = now(), effective_from = now(), updated_at = now()
        WHERE id = $1
        RETURNING id, tenant_key, pack_version`,
      [packId, actor],
    );
    await client.query("COMMIT");
    return approved.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function main() {
  if (approveTenant) {
    if (!writeDb) throw new Error("--approve requires --write-db (approval is never a dry-run).");
    if (!approvedBy) throw new Error("--approve requires --approved-by=<name> so the release record has a real accountable actor.");
    const dbUrl = connectionString();
    if (!dbUrl) throw new Error("Missing ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL.");
    const pg = await import("pg");
    const { Client } = pg.default ?? pg;
    const client = new Client(pgOptions(dbUrl));
    await client.connect();
    try {
      const result = await approveTenantPack(client, approveTenant, approvedBy);
      console.log(`[home-v4-persist] APPROVED ${result.tenant_key} -> pack ${result.pack_version} (id ${result.id}), by ${approvedBy}`);
    } finally {
      await client.end();
    }
    return;
  }

  const files = discoverCandidateFiles();
  if (!files.length) {
    throw new Error(`No candidate-home-knowledge-v4.json files found under ${candidateDir}/tenants for tenant=${requestedTenant}`);
  }

  let client = null;
  if (writeDb) {
    const dbUrl = connectionString();
    if (!dbUrl) throw new Error("Missing ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL for --write-db.");
    const pg = await import("pg");
    const { Client } = pg.default ?? pg;
    client = new Client(pgOptions(dbUrl));
    await client.connect();
  }

  const results = [];
  try {
    for (const { tenant, file } of files) {
      const rawText = fs.readFileSync(file, "utf8");
      const candidate = JSON.parse(rawText);
      const pack = buildPackRow(rawText, candidate);
      let dbStatus = dryRun ? "artifact-only (no --write-db)" : "pending";
      if (client) {
        const written = await writeCandidateRow(client, pack);
        dbStatus = `written:${written.id} (${written.status})`;
      }
      results.push({
        tenant_key: pack.tenant_key,
        tenant_name: pack.tenant_name,
        pack_version: pack.pack_version,
        validation_status: pack.validation_status,
        db_status: dbStatus,
      });
      console.log(`[home-v4-persist] ${tenant} -> ${pack.pack_version} (${pack.validation_status}) -- ${dbStatus}`);
    }
  } finally {
    if (client) await client.end();
  }

  const summaryPath = path.join(repoRoot, "docs/audits/artifacts", `home-knowledge-v4-persist-${dryRun ? "dry-run" : "write"}.json`);
  fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
  fs.writeFileSync(summaryPath, `${JSON.stringify(results, null, 2)}\n`);
  console.log(`[home-v4-persist] summary written to ${path.relative(repoRoot, summaryPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

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
const overrideReason = getArg("--override-reason", process.env.HOME_KNOWLEDGE_V4_OVERRIDE_REASON ?? null);
const summaryPathOverride = getArg("--summary-path", process.env.HOME_KNOWLEDGE_V4_PERSIST_SUMMARY_PATH ?? null);
const writeDb = args.has("--write-db");
const dryRun = !writeDb;
const jobExecutionName =
  process.env.CONTAINER_APP_JOB_EXECUTION_NAME ||
  process.env.ACA_JOB_EXECUTION_NAME ||
  process.env.GITHUB_RUN_ID ||
  `local-${new Date().toISOString().replace(/[-:.]/g, "")}`;

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

// Written by build-home-knowledge-v4-review-pack.mjs's per-tenant crash
// isolation when a tenant's generation throws. A generation failure has no
// candidate JSON to persist, but it must not disappear -- log it to
// home_knowledge_v4_job_runs so it's queryable the same as any other
// outcome, not just visible in a job log nobody re-reads.
function discoverGenerationFailures() {
  const tenantsRoot = path.join(candidateDir, "tenants");
  if (!fs.existsSync(tenantsRoot)) return [];
  const requested = requestedTenantSet();
  return fs.readdirSync(tenantsRoot)
    .filter((tenant) => !requested || requested.has(tenant))
    .map((tenant) => ({ tenant, file: path.join(tenantsRoot, tenant, "generation-failed.json") }))
    .filter((item) => fs.existsSync(item.file));
}

async function writeJobRun(client, row) {
  const columns = Object.keys(row).filter((key) => row[key] !== undefined);
  const values = columns.map((key) => dbValue(key, row[key]));
  const sql = `
    INSERT INTO public.home_knowledge_v4_job_runs (${columns.join(", ")})
    VALUES (${columns.map((_, i) => `$${i + 1}`).join(", ")})
    RETURNING id`;
  const result = await client.query(sql, values);
  return result.rows[0].id;
}

// Durable proof bundle: the full generation/persistence record for one
// tenant's candidate, written to Blob storage (not the job container's own
// filesystem, which is gone the moment the execution ends). Reuses the same
// shared object store account/container the rest of the operator tooling
// already writes to (see scripts/skyharbor/load-v2-substrate.mjs) -- no new
// infrastructure, just a new path prefix. Gracefully no-ops (never throws)
// when the storage env isn't configured, matching that same script's
// pattern -- a missing proof bundle should never be the reason a real
// candidate fails to persist.
const PROOF_BUNDLE_ACCOUNT = process.env.DATA_PLANE_OBJECT_STORE_ACCOUNT;
const PROOF_BUNDLE_CONTAINER = process.env.DATA_PLANE_OBJECT_STORE_CONTAINER;

async function uploadProofBundle(tenantKey, packVersion, payload) {
  if (!PROOF_BUNDLE_ACCOUNT || !PROOF_BUNDLE_CONTAINER) {
    return { uploaded: false, reason: "no storage env (DATA_PLANE_OBJECT_STORE_ACCOUNT/_CONTAINER not set)" };
  }
  try {
    const { BlobServiceClient } = await import("@azure/storage-blob");
    const { DefaultAzureCredential } = await import("@azure/identity");
    const credential = new DefaultAzureCredential({ managedIdentityClientId: process.env.AZURE_CLIENT_ID });
    const service = new BlobServiceClient(`https://${PROOF_BUNDLE_ACCOUNT}.blob.core.windows.net`, credential);
    const blobPath = `home-knowledge-v4-proof-bundles/${tenantKey}/${packVersion}.json`;
    const bytes = Buffer.from(JSON.stringify(payload, null, 2));
    await service.getContainerClient(PROOF_BUNDLE_CONTAINER).getBlockBlobClient(blobPath).uploadData(bytes, {
      blobHTTPHeaders: { blobContentType: "application/json" },
      metadata: { tenant_key: tenantKey, pack_version: packVersion, job_execution_name: jobExecutionName },
    });
    return { uploaded: true, uri: `https://${PROOF_BUNDLE_ACCOUNT}.blob.core.windows.net/${PROOF_BUNDLE_CONTAINER}/${blobPath}` };
  } catch (error) {
    return { uploaded: false, reason: String(error?.message ?? error).slice(0, 200) };
  }
}

function defaultSummaryPath() {
  return path.join(repoRoot, "docs/audits/artifacts", `home-knowledge-v4-persist-${dryRun ? "dry-run" : "write"}.json`);
}

function tmpSummaryPath() {
  return path.join("/tmp", `home-knowledge-v4-persist-${dryRun ? "dry-run" : "write"}.json`);
}

function writeSummary(results) {
  const preferredPath = summaryPathOverride ? path.resolve(summaryPathOverride) : defaultSummaryPath();
  const fallbackPath = tmpSummaryPath();
  const payload = `${JSON.stringify(results, null, 2)}\n`;
  for (const [index, summaryPath] of [preferredPath, fallbackPath].entries()) {
    try {
      fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
      fs.writeFileSync(summaryPath, payload);
      const label = summaryPath.startsWith(repoRoot) ? path.relative(repoRoot, summaryPath) : summaryPath;
      if (index > 0) {
        console.warn(`[home-v4-persist] preferred summary path was not writable; used ${label}`);
      } else {
        console.log(`[home-v4-persist] summary written to ${label}`);
      }
      return summaryPath;
    } catch (error) {
      if (index === 0) {
        console.warn(`[home-v4-persist] summary path not writable (${summaryPath}): ${error.message}`);
        continue;
      }
      throw error;
    }
  }
  return null;
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

async function approveTenantPack(client, tenantKey, actor, reason) {
  await client.query("BEGIN");
  try {
    const latest = await client.query(
      `SELECT id, validation_status, quality_report FROM public.home_knowledge_packs
        WHERE tenant_key = $1 AND artifact_type = $2 AND status = 'candidate'
        ORDER BY created_at DESC LIMIT 1`,
      [tenantKey, ARTIFACT_TYPE],
    );
    if (latest.rows.length === 0) {
      throw new Error(`No candidate ${ARTIFACT_TYPE} pack found for tenant "${tenantKey}" -- persist one first.`);
    }
    const row = latest.rows[0];
    const packId = row.id;
    // A candidate the validator flagged must never become live silently --
    // approving it is a distinct, audited action: a written reason, not
    // just the same --approved-by used for a clean candidate.
    const needsOverride = row.validation_status !== "pass";
    if (needsOverride && !reason) {
      throw new Error(
        `Candidate for "${tenantKey}" has validation_status "${row.validation_status}" -- approving it requires ` +
        `--override-reason=<text> from an authorized reviewer. Refusing to approve a flagged candidate silently.`,
      );
    }
    // Snapshot exactly what was acknowledged at override time -- not a
    // reference to the live quality_report, which could be overwritten by a
    // later regeneration under the same pack_version.
    const findingsAcknowledged = needsOverride ? (row.quality_report?.violations ?? []) : [];
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
        SET status = 'approved', approved_by = $2, approved_at = now(), effective_from = now(), updated_at = now(),
            override_reason = $3, overridden_by = $4, overridden_at = $5, findings_acknowledged = $6
        WHERE id = $1
        RETURNING id, tenant_key, pack_version`,
      [
        packId,
        actor,
        needsOverride ? reason : null,
        needsOverride ? actor : null,
        needsOverride ? new Date().toISOString() : null,
        JSON.stringify(findingsAcknowledged),
      ],
    );
    await client.query("COMMIT");
    return { ...approved.rows[0], overridden: needsOverride };
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
      const result = await approveTenantPack(client, approveTenant, approvedBy, overrideReason);
      console.log(
        `[home-v4-persist] APPROVED ${result.tenant_key} -> pack ${result.pack_version} (id ${result.id}), by ${approvedBy}` +
        (result.overridden ? ` [OVERRIDE: ${overrideReason}]` : ""),
      );
    } finally {
      await client.end();
    }
    return;
  }

  const candidateFiles = discoverCandidateFiles();
  const generationFailures = discoverGenerationFailures();
  if (!candidateFiles.length && !generationFailures.length) {
    throw new Error(`No candidate-home-knowledge-v4.json or generation-failed.json files found under ${candidateDir}/tenants for tenant=${requestedTenant}`);
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
  const counts = { generated_clean: 0, generated_with_quality_failure: 0, generation_failed: 0, persistence_failed: 0 };
  try {
    // Generation failures never reached candidate JSON, so there is nothing
    // to persist -- but they must still be queryable, not just visible in a
    // job log nobody re-reads.
    for (const { tenant, file } of generationFailures) {
      const marker = JSON.parse(fs.readFileSync(file, "utf8"));
      counts.generation_failed += 1;
      results.push({ tenant_key: tenant, outcome: "generation_failed", error: marker.error_message });
      console.error(`[home-v4-persist] ${tenant} -> GENERATION FAILED: ${marker.error_message}`);
      if (client) {
        await writeJobRun(client, {
          job_execution_name: jobExecutionName,
          tenant_key: tenant,
          outcome: "generation_failed",
          error_message: marker.error_message,
        });
      }
    }

    for (const { tenant, file } of candidateFiles) {
      try {
        const rawText = fs.readFileSync(file, "utf8");
        const candidate = JSON.parse(rawText);
        const pack = buildPackRow(rawText, candidate);
        // Hard invariant: a candidate must never reach the database without
        // its quality report -- buildPackRow always sets one from
        // candidate.validation, but this is asserted explicitly rather than
        // trusted silently. "Persisted without report" must be impossible,
        // not just usually true.
        if (!pack.quality_report || typeof pack.quality_report.status !== "string") {
          throw new Error(`Refusing to persist ${tenant}: candidate has no quality_report.status -- generation or validation did not complete correctly.`);
        }
        const outcome = pack.validation_status === "pass" ? "generated_clean" : "generated_with_quality_failure";
        let dbStatus = dryRun ? "artifact-only (no --write-db)" : "pending";
        let packId = null;
        if (client) {
          const written = await writeCandidateRow(client, pack);
          packId = written.id;
          dbStatus = `written:${written.id} (${written.status})`;
        }
        const persistedAt = new Date().toISOString();
        const proofBundle = await uploadProofBundle(tenant, pack.pack_version, {
          tenant_key: pack.tenant_key,
          pack_version: pack.pack_version,
          content_hash: pack.content_hash,
          claude_model: pack.claude_model,
          claude_prompt_version: pack.claude_prompt_version,
          claude_prompt_hash: pack.claude_prompt_hash,
          generator_version: pack.generator_version,
          validator_version: pack.generator_version,
          quality_report: pack.quality_report,
          job_execution_name: jobExecutionName,
          candidate_payload: candidate,
          generated_at: candidate.generated_at ?? null,
          persisted_at: persistedAt,
        });
        counts[outcome] += 1;
        results.push({
          tenant_key: pack.tenant_key,
          tenant_name: pack.tenant_name,
          pack_version: pack.pack_version,
          validation_status: pack.validation_status,
          db_status: dbStatus,
          proof_bundle: proofBundle.uploaded ? proofBundle.uri : `not uploaded (${proofBundle.reason})`,
        });
        console.log(
          `[home-v4-persist] ${tenant} -> ${pack.pack_version} (${pack.validation_status}) -- ${dbStatus} -- ` +
          `proof: ${proofBundle.uploaded ? proofBundle.uri : proofBundle.reason}`,
        );
        if (client) {
          await writeJobRun(client, {
            job_execution_name: jobExecutionName,
            tenant_key: pack.tenant_key,
            outcome,
            pack_id: packId,
            pack_version: pack.pack_version,
            validation_status: pack.validation_status,
            generator_version: pack.generator_version,
            claude_model: pack.claude_model,
            claude_prompt_hash: pack.claude_prompt_hash,
            content_hash: pack.content_hash,
            proof_bundle_uri: proofBundle.uploaded ? proofBundle.uri : null,
            persisted_at: persistedAt,
          });
        }
      } catch (error) {
        // One tenant's persistence failure must not take the rest of the
        // batch down with it.
        counts.persistence_failed += 1;
        const message = error instanceof Error ? error.message : String(error);
        results.push({ tenant_key: tenant, outcome: "persistence_failed", error: message });
        console.error(`[home-v4-persist] ${tenant} -> PERSISTENCE FAILED: ${message}`);
        if (client) {
          await writeJobRun(client, {
            job_execution_name: jobExecutionName,
            tenant_key: tenant,
            outcome: "persistence_failed",
            error_message: message,
          }).catch((jobRunError) => {
            console.error(`[home-v4-persist] ${tenant} -> also failed to log job_run: ${jobRunError.message}`);
          });
        }
      }
    }
  } finally {
    if (client) await client.end();
  }

  writeSummary(results);
  console.log(
    `[home-v4-persist] outcome counts: generated_clean=${counts.generated_clean} ` +
    `generated_with_quality_failure=${counts.generated_with_quality_failure} ` +
    `generation_failed=${counts.generation_failed} persistence_failed=${counts.persistence_failed}`,
  );
  if (counts.generation_failed > 0 || counts.persistence_failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

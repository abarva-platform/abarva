#!/usr/bin/env node
// Governed CLI for the reject/retire/rollback V4 pack-lifecycle actions
// added in src/lib/home/home-knowledge-v4-review.ts. That lib backs the
// retired V4 review admin UI (platform-admin Clerk session only); this
// script exists for the same actions to be taken from a governed ACA
// operator job when a live admin browser session isn't the vehicle --
// e.g. an agent-run qualitative review recording its decisions. Same
// transactional SQL as the TS lib, kept in sync by hand (script and
// Next.js lib run in different environments, so they don't share code --
// same reasoning as persist-home-knowledge-v4-book.mjs's approveTenantPack).
//
// Defaults to dry-run (prints what would happen, touches nothing). Pass
// --write-db to actually mutate. Every action requires --by=<actor> and
// --reason="..." -- there is no silent path.

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

const ARTIFACT_TYPE = "NexusHomeKnowledgePackV4Book";

const argv = process.argv.slice(2);
const args = new Set(argv);
const getArg = (name, fallback = null) => {
  const prefix = `${name}=`;
  const found = argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
};

function usage() {
  return `Usage:
  node scripts/knowledge/manage-home-knowledge-v4-lifecycle.mjs --reject --id=<packId> --by=<actor> --reason="..." [--write-db]
  node scripts/knowledge/manage-home-knowledge-v4-lifecycle.mjs --retire --tenant=<tenantKey> --by=<actor> --reason="..." [--write-db]
  node scripts/knowledge/manage-home-knowledge-v4-lifecycle.mjs --rollback --tenant=<tenantKey> --target-id=<packId> --by=<actor> --reason="..." [--write-db]

Defaults to dry-run. Pass --write-db to actually mutate. Requires DATABASE_URL
(or ABARVA_AZURE_DATABASE_URL / AZURE_DATABASE_URL).

Every flag also has an env-var equivalent, for invocation through the governed
ACA operator job (which only accepts a pinned npm script name, not ad-hoc
flags): HOME_KNOWLEDGE_V4_LIFECYCLE_MODE (reject|retire|rollback),
HOME_KNOWLEDGE_V4_LIFECYCLE_ID, HOME_KNOWLEDGE_V4_LIFECYCLE_TENANT,
HOME_KNOWLEDGE_V4_LIFECYCLE_TARGET_ID, HOME_KNOWLEDGE_V4_LIFECYCLE_BY,
HOME_KNOWLEDGE_V4_LIFECYCLE_REASON, HOME_KNOWLEDGE_V4_LIFECYCLE_WRITE_DB=true.
`;
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
  return { connectionString: url, ssl, application_name: "home-knowledge-v4-lifecycle-cli" };
}

async function reject(client, { packId, actor, reason }) {
  await client.query("BEGIN");
  try {
    const current = await client.query(
      `SELECT id, status FROM public.home_knowledge_packs WHERE id = $1 AND artifact_type = $2 FOR UPDATE`,
      [packId, ARTIFACT_TYPE],
    );
    if (current.rows.length === 0) throw new Error(`No V4 pack found with id "${packId}".`);
    if (current.rows[0].status !== "candidate") {
      throw new Error(`Only a pack with status "candidate" can be rejected (this one is "${current.rows[0].status}").`);
    }
    const rejected = await client.query(
      `UPDATE public.home_knowledge_packs
        SET status = 'rejected', rejected_by = $2, rejected_at = now(), reject_reason = $3, updated_at = now()
        WHERE id = $1
        RETURNING id, tenant_key, pack_version`,
      [packId, actor, reason],
    );
    await client.query("COMMIT");
    return rejected.rows[0];
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

async function retire(client, { tenantKey, actor, reason }) {
  await client.query("BEGIN");
  try {
    const active = await client.query(
      `SELECT id FROM public.home_knowledge_packs
        WHERE tenant_key = $1 AND artifact_type = $2 AND status = 'approved' AND effective_to IS NULL
        FOR UPDATE`,
      [tenantKey, ARTIFACT_TYPE],
    );
    if (active.rows.length === 0) throw new Error(`No active V4 pack found for tenant "${tenantKey}".`);
    const retired = await client.query(
      `UPDATE public.home_knowledge_packs
        SET status = 'retired', effective_to = now(), retired_by = $2, retire_reason = $3, updated_at = now()
        WHERE id = $1
        RETURNING id, tenant_key, pack_version`,
      [active.rows[0].id, actor, reason],
    );
    await client.query("COMMIT");
    return retired.rows[0];
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

async function rollback(client, { tenantKey, targetPackId, actor, reason }) {
  await client.query("BEGIN");
  try {
    const target = await client.query(
      `SELECT id, tenant_key, status FROM public.home_knowledge_packs
        WHERE id = $1 AND artifact_type = $2 AND tenant_key = $3
        FOR UPDATE`,
      [targetPackId, ARTIFACT_TYPE, tenantKey],
    );
    if (target.rows.length === 0) throw new Error(`No V4 pack with id "${targetPackId}" found for tenant "${tenantKey}".`);
    if (!["retired", "rejected"].includes(target.rows[0].status)) {
      throw new Error(`Rollback target must currently be "retired" or "rejected" (this one is "${target.rows[0].status}").`);
    }
    const displaced = await client.query(
      `UPDATE public.home_knowledge_packs
        SET status = 'retired', effective_to = now(), retired_by = $2,
            retire_reason = $3, updated_at = now()
        WHERE tenant_key = $1 AND status = 'approved' AND effective_to IS NULL
        RETURNING id`,
      [tenantKey, actor, `Displaced by rollback to pack ${targetPackId}: ${reason}`],
    );
    const reactivated = await client.query(
      `UPDATE public.home_knowledge_packs
        SET status = 'approved', approved_by = $2, approved_at = now(), effective_from = now(), effective_to = NULL,
            updated_at = now(), rollback_of_pack_id = $3,
            override_reason = $4, overridden_by = $2, overridden_at = now()
        WHERE id = $1
        RETURNING id, tenant_key, pack_version`,
      [targetPackId, actor, displaced.rows[0]?.id ?? null, `Rolled back: ${reason}`],
    );
    await client.query("COMMIT");
    return { ...reactivated.rows[0], displacedPackId: displaced.rows[0]?.id ?? null };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

async function main() {
  // The governed ACA operator job (scripts/ops/submit-aca-operator-job.mjs)
  // only accepts a pinned npm script name, not ad-hoc CLI flags -- tenant/
  // action selection has to travel as env-var overrides passed via --env,
  // same pattern as HOME_KNOWLEDGE_V4_TENANT on the persist script and
  // HOME_KNOWLEDGE_V4_INSPECT_ID on the inspect script.
  const envMode = process.env.HOME_KNOWLEDGE_V4_LIFECYCLE_MODE;
  const mode = args.has("--reject") ? "reject"
    : args.has("--retire") ? "retire"
    : args.has("--rollback") ? "rollback"
    : envMode === "reject" || envMode === "retire" || envMode === "rollback" ? envMode
    : null;
  if (!mode) {
    console.error(usage());
    throw new Error("One of --reject, --retire, --rollback (or HOME_KNOWLEDGE_V4_LIFECYCLE_MODE) is required.");
  }
  const actor = getArg("--by", process.env.HOME_KNOWLEDGE_V4_LIFECYCLE_BY ?? null);
  const reason = getArg("--reason", process.env.HOME_KNOWLEDGE_V4_LIFECYCLE_REASON ?? null);
  if (!actor || !reason) {
    console.error(usage());
    throw new Error("--by=<actor> and --reason=\"...\" are both required.");
  }
  const writeDb = args.has("--write-db") || process.env.HOME_KNOWLEDGE_V4_LIFECYCLE_WRITE_DB === "true";

  const options = {
    packId: getArg("--id", process.env.HOME_KNOWLEDGE_V4_LIFECYCLE_ID ?? null),
    tenantKey: getArg("--tenant", process.env.HOME_KNOWLEDGE_V4_LIFECYCLE_TENANT ?? null),
    targetPackId: getArg("--target-id", process.env.HOME_KNOWLEDGE_V4_LIFECYCLE_TARGET_ID ?? null),
    actor,
    reason,
  };

  if (mode === "reject" && !options.packId) throw new Error("--id=<packId> is required for --reject.");
  if (mode === "retire" && !options.tenantKey) throw new Error("--tenant=<tenantKey> is required for --retire.");
  if (mode === "rollback" && (!options.tenantKey || !options.targetPackId)) {
    throw new Error("--tenant=<tenantKey> and --target-id=<packId> are both required for --rollback.");
  }

  if (!writeDb) {
    console.log(JSON.stringify({ dryRun: true, mode, options }, null, 2));
    console.log("\nDry run only -- pass --write-db to actually mutate.");
    return;
  }

  const dbUrl = connectionString();
  if (!dbUrl) throw new Error("Missing ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL.");
  const pg = await import("pg");
  const { Client } = pg.default ?? pg;
  const client = new Client(pgOptions(dbUrl));
  await client.connect();
  try {
    let result;
    if (mode === "reject") result = await reject(client, options);
    else if (mode === "retire") result = await retire(client, options);
    else result = await rollback(client, options);
    console.log(JSON.stringify({ ok: true, mode, result }, null, 2));
  } finally {
    await client.end().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

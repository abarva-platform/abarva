#!/usr/bin/env tsx

/** Retire a synthetic Home declaration without deleting its governed evidence. */

import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { generatePack } from "./load_synthetic_enterprise_v1";

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  const image = process.env.ECL_SYNTHETIC_IMAGE_DIGEST;
  const runId = process.env.ECL_SYNTHETIC_RUN_ID;
  const projectionProofUri = process.env.ECL_SYNTHETIC_PROJECTION_PROOF_URI;
  if (
    !databaseUrl || !runId || !projectionProofUri ||
    process.env.ECL_SYNTHETIC_ROLLBACK_APPROVAL !== "retire_active_home" ||
    !image?.includes("@sha256:") ||
    image !== process.env.ABARVA_OPERATOR_IMAGE ||
    !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(runId)
  ) {
    throw new Error("Home retirement requires a pinned, explicitly approved private job");
  }
  const pack = await generatePack("v2");
  try {
    const { manifest } = pack;
    if (process.env.ECL_SYNTHETIC_INPUT_SOURCE_VERSION !== manifest.source_set_hash) {
      throw new Error("Home retirement source version is not pinned");
    }
    const db = new pg.Client({ connectionString: databaseUrl });
    await db.connect();
    try {
      await db.query("begin isolation level serializable");
      try {
        await db.query("select pg_advisory_xact_lock(hashtext($1))", [
          `home-assessment:${manifest.tenant_key}`,
        ]);
        const retired = await db.query<{ assessment_id: string }>(
          `update ecl_projection.home_active_assessment
           set state = 'retired', retired_at = now()
           where tenant_key = $1 and assessment_id = $2
             and source_set_hash = $3 and projection_proof_uri = $4
             and state = 'active'
           returning assessment_id`,
          [manifest.tenant_key, manifest.assessment_id,
            manifest.source_set_hash, projectionProofUri],
        );
        if (retired.rows.length !== 1) {
          throw new Error("No matching active Home declaration to retire");
        }
        await db.query("commit");
      } catch (error) {
        await db.query("rollback").catch(() => undefined);
        throw error;
      }
    } finally {
      await db.end();
    }
    process.stdout.write(`${JSON.stringify({
      job_name: "ecl-synthetic-enterprise-v2-retire-home",
      run_id: runId,
      tenant_scope: manifest.tenant_key,
      assessment_id: manifest.assessment_id,
      source_set_hash: manifest.source_set_hash,
      serving_state: "retired",
      status: "passed",
    })}\n`);
  } finally {
    await rm(pack.dir, { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

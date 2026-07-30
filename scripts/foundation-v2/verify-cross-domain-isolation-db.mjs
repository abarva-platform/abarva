#!/usr/bin/env node
import {
  DATABASE_SCHEMA,
  FOUNDATION_V2_CONTEXT,
  READER_ROLE,
  SOURCE_RELEASE_ID,
  TENANT_KEY,
  TEST_NAMESPACE,
  WRITER_ROLE,
  emitProofBundle,
  foundationPostgresClientOptions,
  proofRef,
  quoteIdent,
  writeJson,
} from "./golden-slice-support.mjs";

const args = parseArgs(process.argv.slice(2));

await main(args).catch((error) => {
  console.error(JSON.stringify({ status: "FOUNDATION_V2_CROSS_DOMAIN_ISOLATION_FAILED", error: error.message }, null, 2));
  process.exit(1);
});

async function main(options) {
  const { Client } = await import("pg");
  const client = new Client(await foundationPostgresClientOptions("foundation-v2-cross-domain-isolation"));
  await client.connect();
  try {
    const proof = await verifyIsolation(client, options);
    writeJson(proofRef(options.outDir, "FOUNDATION_V2_CROSS_DOMAIN_ISOLATION_PROOF.json"), proof);
    console.log(JSON.stringify(proof, null, 2));
    if (options.emitProofBundle) emitProofBundle(options.outDir);
    if (proof.status !== "FOUNDATION_V2_CROSS_DOMAIN_ISOLATION_PASSED") process.exitCode = 1;
  } finally {
    await client.end();
  }
}

async function verifyIsolation(client, options) {
  await client.query("BEGIN");
  const attempts = [];
  try {
    await client.query("SELECT set_config('app.tenant_key', $1, true)", [TENANT_KEY]);
    await client.query("SELECT set_config('app.foundation_v2_test_namespace', $1, true)", [TEST_NAMESPACE]);
    await client.query("SELECT set_config('app.foundation_v2_source_release_id', $1, true)", [SOURCE_RELEASE_ID]);
    await client.query("SELECT set_config('app.foundation_v2_release_alias', $1, true)", [
      FOUNDATION_V2_CONTEXT.release_alias,
    ]);
    await client.query(`SET LOCAL ROLE ${quoteIdent(options.roleKind === "reader" ? READER_ROLE : WRITER_ROLE)}`);
    attempts.push(await denied(client, "select_opposite_source_releases", `SELECT count(*) FROM ${opposite(options)}.source_releases`));
    attempts.push(
      await denied(
        client,
        "insert_opposite_candidates",
        `INSERT INTO ${opposite(options)}.knowledge_candidates
          (candidate_id, normalized_object_id, tenant_key, test_namespace, candidate_type, candidate_business_key,
           review_policy_class, evidence_count, candidate_state, content_hash, writer_job_id)
         VALUES ('cross-domain-negative-candidate','cross-domain-negative-normalized',$1,$2,'negative','negative',
                 'negative',0,'pending_review',$3,'cross-domain-negative')`,
        [TENANT_KEY, TEST_NAMESPACE, "0".repeat(64)],
      ),
    );
    attempts.push(await denied(client, "set_opposite_writer_role", `SET LOCAL ROLE ${quoteIdent(options.oppositeWriterRole)}`));
  } finally {
    await client.query("ROLLBACK").catch(() => {});
  }

  const defects = attempts.filter((attempt) => attempt.outcome !== "denied").map((attempt) => attempt.check);
  return {
    status: defects.length === 0 ? "FOUNDATION_V2_CROSS_DOMAIN_ISOLATION_PASSED" : "FOUNDATION_V2_CROSS_DOMAIN_ISOLATION_FAILED",
    generated_at: new Date().toISOString(),
    context: {
      domain: FOUNDATION_V2_CONTEXT.domain,
      database_schema: DATABASE_SCHEMA,
      writer_role: WRITER_ROLE,
      reader_role: READER_ROLE,
      opposite_schema: options.oppositeSchema,
      opposite_writer_role: options.oppositeWriterRole,
    },
    attempts,
    defects,
  };
}

async function denied(client, check, sql, values = []) {
  try {
    await client.query(sql, values);
    return { check, outcome: "permitted", sqlstate: "", error: "" };
  } catch (error) {
    return { check, outcome: "denied", sqlstate: error.code || "", error: error.message };
  }
}

function opposite(options) {
  return quoteIdent(options.oppositeSchema);
}

function parseArgs(argv) {
  const parsed = {
    oppositeSchema: process.env.FOUNDATION_V2_OPPOSITE_SCHEMA || "",
    oppositeWriterRole: process.env.FOUNDATION_V2_OPPOSITE_WRITER_ROLE || "",
    roleKind: process.env.FOUNDATION_V2_CROSS_DOMAIN_ROLE_KIND || "writer",
    outDir: process.env.FOUNDATION_V2_CROSS_DOMAIN_OUT_DIR || "/tmp/foundation-v2-cross-domain-isolation",
    emitProofBundle: process.env.EMIT_ACA_PROOF_BUNDLE === "true" || process.env.FOUNDATION_V2_EMIT_PROOF_BUNDLE === "true",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };
    if (arg === "--opposite-schema") parsed.oppositeSchema = next();
    else if (arg === "--opposite-writer-role") parsed.oppositeWriterRole = next();
    else if (arg === "--role-kind") parsed.roleKind = next();
    else if (arg === "--out-dir") parsed.outDir = next();
    else if (arg === "--emit-proof-bundle") parsed.emitProofBundle = true;
    else throw new Error(`Unknown argument ${arg}`);
  }
  if (!parsed.oppositeSchema) throw new Error("FOUNDATION_V2_OPPOSITE_SCHEMA or --opposite-schema is required");
  if (!parsed.oppositeWriterRole) {
    throw new Error("FOUNDATION_V2_OPPOSITE_WRITER_ROLE or --opposite-writer-role is required");
  }
  if (!["writer", "reader"].includes(parsed.roleKind)) throw new Error("--role-kind must be writer or reader");
  return parsed;
}

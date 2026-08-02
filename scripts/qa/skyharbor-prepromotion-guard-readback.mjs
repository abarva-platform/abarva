#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { Client } from "pg";

import { dbConnectionConfig, setTenantContext } from "../knowledge/build-review-decision-ledger.mjs";

const DEFAULT_TENANT_KEY = "skyharbor-air";
const DEFAULT_OUT_DIR = path.join(os.tmpdir(), "skyharbor-prepromotion-guard-readback");
const DEFAULT_POLICY_VERSION = "knowledge-review-decision-policy-v2";

const REGISTERED_QUERIES = Object.freeze({
  "qry-prepromotion-ghost-accepted-entities-v1": {
    sql: `
      SELECT count(*)::int
      FROM knowledge.entity
      WHERE tenant_key=$1
        AND authority_state='accepted'
        AND lower(trim(display_name)) = lower(trim($1))
    `.trim(),
    referencedRelations: ["knowledge.entity"],
    outputShape: { type: "scalar_count", nullable: false },
  },
  "qry-prepromotion-ghost-accepted-facts-v1": {
    sql: `
      SELECT count(*)::int
      FROM knowledge.fact_assertion f
      JOIN knowledge.entity e
        ON e.tenant_key=f.tenant_key
       AND e.entity_ref=f.entity_ref
      WHERE f.tenant_key=$1
        AND f.authority_state='accepted'
        AND e.authority_state='accepted'
        AND lower(trim(e.display_name)) = lower(trim($1))
    `.trim(),
    referencedRelations: ["knowledge.entity", "knowledge.fact_assertion"],
    outputShape: { type: "scalar_count", nullable: false },
  },
  "qry-prepromotion-stale-review-generation-v1": {
    sql: `
      WITH candidate_inventory AS (
        SELECT tenant_key, 'entity_candidate' AS candidate_type, candidate_ref, candidate_content_hash
        FROM working.entity_candidate
        WHERE tenant_key=$1
        UNION ALL
        SELECT tenant_key, 'fact_candidate' AS candidate_type, candidate_ref, candidate_content_hash
        FROM working.fact_candidate
        WHERE tenant_key=$1
        UNION ALL
        SELECT tenant_key, 'relationship_candidate' AS candidate_type, candidate_ref, candidate_content_hash
        FROM working.relationship_candidate
        WHERE tenant_key=$1
      )
      SELECT count(*)::int
      FROM governance.review_decision d
      JOIN candidate_inventory c
        ON c.tenant_key=d.tenant_key
       AND c.candidate_type=d.candidate_type
       AND c.candidate_ref=d.candidate_ref
      WHERE d.tenant_key=$1
        AND (
          d.policy_version IS DISTINCT FROM $2
          OR d.candidate_content_hash IS DISTINCT FROM c.candidate_content_hash
        )
    `.trim(),
    referencedRelations: [
      "governance.review_decision",
      "working.entity_candidate",
      "working.fact_candidate",
      "working.relationship_candidate",
    ],
    outputShape: { type: "scalar_count", nullable: false },
  },
  "qry-prepromotion-active-baseline-empty-validation-v1": {
    sql: `
      SELECT count(*)::int
      FROM publication.knowledge_baseline
      WHERE tenant_key=$1
        AND is_active
        AND baseline_state='passed'
        AND nullif(trim(coalesce(projection_validation_hash, '')), '') IS NULL
    `.trim(),
    referencedRelations: ["publication.knowledge_baseline"],
    outputShape: { type: "scalar_count", nullable: false },
  },
  "qry-prepromotion-active-zero-row-projections-v1": {
    sql: `
      SELECT count(*)::int
      FROM publication.projection_version pv
      JOIN publication.knowledge_baseline kb
        ON kb.tenant_key=pv.tenant_key
       AND kb.knowledge_baseline_ref=pv.knowledge_baseline_ref
      LEFT JOIN publication.projection_absence_assertion paa
        ON paa.tenant_key=pv.tenant_key
       AND paa.knowledge_baseline_ref=pv.knowledge_baseline_ref
       AND paa.projection_name=pv.projection_name
       AND (paa.projection_version_ref IS NULL OR paa.projection_version_ref=pv.projection_version_ref)
       AND paa.retired_at IS NULL
      WHERE pv.tenant_key=$1
        AND kb.is_active
        AND kb.baseline_state='passed'
        AND pv.is_active
        AND pv.row_count=0
        AND paa.absence_ref IS NULL
    `.trim(),
    referencedRelations: [
      "publication.knowledge_baseline",
      "publication.projection_version",
      "publication.projection_absence_assertion",
    ],
    outputShape: { type: "scalar_count", nullable: false },
  },
});

const GUARD_EXPECTATIONS = Object.freeze([
  {
    expectationRef: "exp-prepromotion-ghost-accepted-entities-zero-v1",
    stageName: "canonical-retirement-readiness",
    objectKind: "entity",
    objectScope: "accepted entities with tenant-key display name",
    basisQueryRef: "qry-prepromotion-ghost-accepted-entities-v1",
    basisSourceLayer: "knowledge",
    stageWriteLayer: "governance",
    stageWriteRelations: ["governance.authority_transition", "governance.review_decision"],
    expected: 0,
  },
  {
    expectationRef: "exp-prepromotion-ghost-accepted-facts-zero-v1",
    stageName: "canonical-retirement-readiness",
    objectKind: "fact",
    objectScope: "accepted facts attached to ghost entities",
    basisQueryRef: "qry-prepromotion-ghost-accepted-facts-v1",
    basisSourceLayer: "knowledge",
    stageWriteLayer: "governance",
    stageWriteRelations: ["governance.authority_transition", "governance.review_decision"],
    expected: 0,
  },
  {
    expectationRef: "exp-prepromotion-stale-review-generation-zero-v1",
    stageName: "knowledge-promote",
    objectKind: "review_decision",
    objectScope: "current candidates with stale review generation or hash",
    basisQueryRef: "qry-prepromotion-stale-review-generation-v1",
    basisSourceLayer: "governance",
    stageWriteLayer: "knowledge",
    stageWriteRelations: ["knowledge.entity", "knowledge.fact_assertion", "knowledge.relationship_assertion"],
    expected: 0,
  },
  {
    expectationRef: "exp-prepromotion-active-baseline-empty-validation-zero-v1",
    stageName: "baseline-activation-readiness",
    objectKind: "knowledge_baseline",
    objectScope: "active passed baselines with empty projection validation hash",
    basisQueryRef: "qry-prepromotion-active-baseline-empty-validation-v1",
    basisSourceLayer: "publication",
    stageWriteLayer: "operations",
    stageWriteRelations: ["operations.checkpoint"],
    expected: 0,
  },
  {
    expectationRef: "exp-prepromotion-active-zero-row-projections-zero-v1",
    stageName: "baseline-activation-readiness",
    objectKind: "projection_version",
    objectScope: "active passed baseline zero-row projections without active absence assertion",
    basisQueryRef: "qry-prepromotion-active-zero-row-projections-v1",
    basisSourceLayer: "publication",
    stageWriteLayer: "operations",
    stageWriteRelations: ["operations.checkpoint"],
    expected: 0,
  },
]);

function parseArgs(argv = process.argv.slice(2), env = process.env) {
  const parsed = {
    tenantKey: env.ABARVA_TENANT_KEY || env.SKAIR_PREPROMOTION_TENANT_KEY || DEFAULT_TENANT_KEY,
    policyVersion: env.SKAIR_REVIEW_POLICY_VERSION || DEFAULT_POLICY_VERSION,
    outDir: env.SKAIR_PREPROMOTION_GUARDS_OUT_DIR || DEFAULT_OUT_DIR,
    seedGuardExpectations: env.SKAIR_PREPROMOTION_GUARDS_SEED === "true",
    emitProofBundle:
      env.EMIT_ACA_PROOF_BUNDLE === "true" ||
      env.SKAIR_PREPROMOTION_EMIT_PROOF_BUNDLE === "true",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };
    if (arg === "--tenant") parsed.tenantKey = next();
    else if (arg === "--policy-version") parsed.policyVersion = next();
    else if (arg === "--out-dir") parsed.outDir = path.resolve(process.cwd(), next());
    else if (arg === "--seed-guard-expectations") parsed.seedGuardExpectations = true;
    else if (arg === "--emit-proof-bundle") parsed.emitProofBundle = true;
    else if (arg === "--no-emit-proof-bundle") parsed.emitProofBundle = false;
    else if (arg === "--help" || arg === "-h") {
      console.log(`Usage: node scripts/qa/skyharbor-prepromotion-guard-readback.mjs [options]

Build a live DB-backed pre-promotion guard report for the isolated synthetic lab lane.

Options:
  --tenant <key>                  Tenant key. Default: ${DEFAULT_TENANT_KEY}
  --policy-version <version>      Required fresh review policy. Default: ${DEFAULT_POLICY_VERSION}
  --out-dir <path>                Proof output directory. Default: ${DEFAULT_OUT_DIR}
  --seed-guard-expectations       Upsert warn-only guard expectations into operations.*
  --emit-proof-bundle             Emit proof.tgz markers for the ACA wrapper.
`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return parsed;
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function writeCsv(file, headers, rows) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(
    file,
    `${[
      headers.map(csvEscape).join(","),
      ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
    ].join("\n")}\n`,
  );
}

async function scalar(client, sql, params) {
  const result = await client.query(sql, params);
  return Number(Object.values(result.rows[0] ?? {})[0] ?? 0);
}

async function relationExists(client, relationName) {
  const result = await client.query("SELECT to_regclass($1)::text AS relation_name", [relationName]);
  return Boolean(result.rows[0]?.relation_name);
}

async function persistedExpectationPolicy(client, tenantKey, expectationRefs) {
  if (!(await relationExists(client, "operations.design_expectation"))) return new Map();
  const result = await client.query(
    `
      SELECT expectation_ref,
        on_breach,
        contract_version,
        implementation_scope,
        reviewed_by
      FROM operations.design_expectation
      WHERE tenant_key=$1
        AND expectation_ref = ANY($2::text[])
    `,
    [tenantKey, expectationRefs],
  );
  return new Map(result.rows.map((row) => [row.expectation_ref, row]));
}

function statusFor(row) {
  return row.actual === row.expected ? "pass" : row.on_breach;
}

async function seedGuardExpectations(client, args) {
  await client.query("BEGIN");
  try {
    for (const [queryRef, query] of Object.entries(REGISTERED_QUERIES)) {
      await client.query(
        `
          INSERT INTO operations.registered_query (
            query_ref,
            query_kind,
            query_version,
            query_sql,
            referenced_relations,
            output_shape,
            basis_mode,
            authored_by,
            reviewed_by,
            metadata
          )
          VALUES (
            $1,
            'expectation_basis',
            'v1',
            $2,
            $3::text[],
            $4::jsonb,
            'executable_sql',
            'qa:skair-prepromotion-guard-readback',
            'prepromotion-guard-review',
            jsonb_build_object('seeded_from_prepromotion_guard', true)
          )
          ON CONFLICT (query_ref, query_version)
          DO UPDATE SET query_sql=EXCLUDED.query_sql,
            referenced_relations=EXCLUDED.referenced_relations,
            output_shape=EXCLUDED.output_shape,
            reviewed_by=coalesce(operations.registered_query.reviewed_by, EXCLUDED.reviewed_by),
            metadata=coalesce(operations.registered_query.metadata, '{}'::jsonb) || EXCLUDED.metadata
        `,
        [queryRef, query.sql, query.referencedRelations, JSON.stringify(query.outputShape)],
      );
    }

    for (const expectation of GUARD_EXPECTATIONS) {
      const query = REGISTERED_QUERIES[expectation.basisQueryRef];
      await client.query(
        `
          INSERT INTO operations.design_expectation (
            tenant_key,
            expectation_ref,
            contract_version,
            stage_name,
            object_kind,
            object_scope,
            expectation_basis,
            expected_count,
            basis_mode,
            basis_query_ref,
            basis_query_version,
            basis_referenced_relations,
            stage_write_relations,
            basis_source_layer,
            stage_write_layer,
            on_breach,
            implementation_scope,
            authored_by,
            reviewed_by,
            metadata
          )
          VALUES (
            $1,
            $2,
            'foundation-v3-prepromotion-guard-v0',
            $3,
            $4,
            jsonb_build_object('label', $5::text),
            'design_constant',
            $6,
            'executable_sql',
            $7,
            'v1',
            $8::text[],
            $9::text[],
            $10,
            $11,
            'warn',
            'active',
            'qa:skair-prepromotion-guard-readback',
            'prepromotion-guard-review',
            jsonb_build_object(
              'seeded_from_prepromotion_guard', true,
              'policy_version_under_review', $12::text,
              'mutation_scope', 'none'
            )
          )
          ON CONFLICT (tenant_key, expectation_ref)
          DO UPDATE SET expected_count=EXCLUDED.expected_count,
            basis_query_ref=EXCLUDED.basis_query_ref,
            basis_referenced_relations=EXCLUDED.basis_referenced_relations,
            stage_write_relations=EXCLUDED.stage_write_relations,
            basis_source_layer=EXCLUDED.basis_source_layer,
            stage_write_layer=EXCLUDED.stage_write_layer,
            on_breach='warn',
            reviewed_by=coalesce(operations.design_expectation.reviewed_by, EXCLUDED.reviewed_by),
            metadata=coalesce(operations.design_expectation.metadata, '{}'::jsonb) || EXCLUDED.metadata
        `,
        [
          args.tenantKey,
          expectation.expectationRef,
          expectation.stageName,
          expectation.objectKind,
          expectation.objectScope,
          expectation.expected,
          expectation.basisQueryRef,
          query.referencedRelations,
          expectation.stageWriteRelations,
          expectation.basisSourceLayer,
          expectation.stageWriteLayer,
          args.policyVersion,
        ],
      );
    }

    await client.query("COMMIT");
    return { requested: true, status: "seeded_warn_only", expectationCount: GUARD_EXPECTATIONS.length };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function reviewDecisionBreakdown(client, tenantKey, policyVersion) {
  const result = await client.query(
    `
      WITH candidate_inventory AS (
        SELECT tenant_key, 'entity_candidate' AS candidate_type, candidate_ref, candidate_content_hash
        FROM working.entity_candidate
        WHERE tenant_key=$1
        UNION ALL
        SELECT tenant_key, 'fact_candidate' AS candidate_type, candidate_ref, candidate_content_hash
        FROM working.fact_candidate
        WHERE tenant_key=$1
        UNION ALL
        SELECT tenant_key, 'relationship_candidate' AS candidate_type, candidate_ref, candidate_content_hash
        FROM working.relationship_candidate
        WHERE tenant_key=$1
      ),
      joined AS (
        SELECT d.candidate_type,
          d.review_state,
          coalesce(d.decision, '') AS decision,
          coalesce(d.policy_version, '') AS policy_version,
          count(*)::int AS rows,
          count(*) FILTER (WHERE d.candidate_content_hash IS DISTINCT FROM c.candidate_content_hash)::int AS hash_mismatch_rows,
          count(*) FILTER (WHERE d.policy_version IS DISTINCT FROM $2)::int AS policy_mismatch_rows
        FROM governance.review_decision d
        JOIN candidate_inventory c
          ON c.tenant_key=d.tenant_key
         AND c.candidate_type=d.candidate_type
         AND c.candidate_ref=d.candidate_ref
        WHERE d.tenant_key=$1
        GROUP BY d.candidate_type, d.review_state, coalesce(d.decision, ''), coalesce(d.policy_version, '')
      )
      SELECT *
      FROM joined
      ORDER BY candidate_type, review_state, decision, policy_version
    `,
    [tenantKey, policyVersion],
  );
  return result.rows;
}

async function sampleGhostEntities(client, tenantKey) {
  const result = await client.query(
    `
      SELECT entity_ref, entity_type, display_name, authority_state, cardinality(accepted_evidence_refs)::int AS evidence_ref_count
      FROM knowledge.entity
      WHERE tenant_key=$1
        AND authority_state='accepted'
        AND lower(trim(display_name)) = lower(trim($1))
      ORDER BY entity_ref
      LIMIT 20
    `,
    [tenantKey],
  );
  return result.rows;
}

async function buildReport(client, args) {
  const policyBefore = await persistedExpectationPolicy(
    client,
    args.tenantKey,
    GUARD_EXPECTATIONS.map((row) => row.expectationRef),
  );
  const checks = [];
  for (const expectation of GUARD_EXPECTATIONS) {
    const query = REGISTERED_QUERIES[expectation.basisQueryRef];
    const params = expectation.basisQueryRef === "qry-prepromotion-stale-review-generation-v1"
      ? [args.tenantKey, args.policyVersion]
      : [args.tenantKey];
    const actual = await scalar(client, query.sql, params);
    const policy = policyBefore.get(expectation.expectationRef);
    const row = {
      tenant_key: args.tenantKey,
      expectation_ref: expectation.expectationRef,
      stage_name: expectation.stageName,
      object_kind: expectation.objectKind,
      object_scope: expectation.objectScope,
      expected: expectation.expected,
      actual,
      on_breach: policy?.on_breach ?? "warn",
      implementation_scope: policy?.implementation_scope ?? "active",
      policy_contract_version: policy?.contract_version ?? null,
      policy_reviewed_by: policy?.reviewed_by ?? null,
      policy_source: policy ? "operations.design_expectation" : "runner_default",
      recommended_next_action: recommendedAction(expectation.expectationRef, actual),
    };
    checks.push({ status: statusFor(row), ...row });
  }
  return {
    checks,
    reviewDecisionBreakdown: await reviewDecisionBreakdown(client, args.tenantKey, args.policyVersion),
    ghostEntitySamples: await sampleGhostEntities(client, args.tenantKey),
  };
}

function recommendedAction(expectationRef, actual) {
  if (actual === 0) return "none";
  if (expectationRef.includes("ghost-accepted-entities")) return "retire_with_review_event_before_promotion";
  if (expectationRef.includes("ghost-accepted-facts")) return "retire_or_repoint_with_recorded_reason_before_promotion";
  if (expectationRef.includes("stale-review-generation")) return "supersede_review_generation_and_rerun_review_policy_before_promotion";
  if (expectationRef.includes("baseline-empty-validation")) return "close_baseline_gate_before_any_republish";
  if (expectationRef.includes("zero-row-projections")) return "require_absence_assertions_or_rebuild_projection_before_passed_baseline";
  return "investigate";
}

function proofBundle(outDir) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "skair-prepromotion-guard-proof-"));
  const tarPath = path.join(tmp, "proof.tgz");
  const result = spawnSync("tar", ["-czf", tarPath, "-C", outDir, "."], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`tar proof bundle failed: ${result.stderr || result.stdout}`);
  process.stdout.write("__SEMANTIC2_PROOF_TGZ_BEGIN__\n");
  process.stdout.write(fs.readFileSync(tarPath).toString("base64"));
  process.stdout.write("\n__SEMANTIC2_PROOF_TGZ_END__\n");
}

async function main() {
  const args = parseArgs();
  fs.mkdirSync(args.outDir, { recursive: true });
  const client = new Client(await dbConnectionConfig(process.env));
  await client.connect();
  try {
    await setTenantContext(client, args.tenantKey);
    const seedResult = args.seedGuardExpectations
      ? await seedGuardExpectations(client, args)
      : { requested: false };
    const { checks, reviewDecisionBreakdown, ghostEntitySamples } = await buildReport(client, args);
    const summary = {
      status: "complete",
      tenantKey: args.tenantKey,
      policyVersion: args.policyVersion,
      checkedAt: new Date().toISOString(),
      mutationScope: "none",
      seedResult,
      promotionAuthorized: false,
      relationshipDerivationAuthorized: false,
      checks,
      reviewDecisionBreakdown,
      ghostEntitySamples,
      contentHash: "",
    };
    summary.contentHash = sha256(stableJson({ ...summary, checkedAt: null, contentHash: null }));
    writeJson(path.join(args.outDir, "prepromotion-guard-readback.json"), summary);
    writeCsv(path.join(args.outDir, "prepromotion-guard-readback.csv"), [
      "status",
      "stage_name",
      "object_kind",
      "object_scope",
      "expected",
      "actual",
      "on_breach",
      "implementation_scope",
      "policy_source",
      "policy_reviewed_by",
      "recommended_next_action",
      "expectation_ref",
    ], checks);
    writeCsv(path.join(args.outDir, "review-decision-generation-breakdown.csv"), [
      "candidate_type",
      "review_state",
      "decision",
      "policy_version",
      "rows",
      "hash_mismatch_rows",
      "policy_mismatch_rows",
    ], reviewDecisionBreakdown);
    writeJson(path.join(args.outDir, "README.json"), {
      purpose: "Live DB-backed pre-promotion guard report for the isolated synthetic lab lane.",
      contentHash: summary.contentHash,
      boundaries: [
        "No canonical retirement was performed.",
        "No review decisions were superseded.",
        "No canonical promotion, publication, baseline activation, relationship derivation, Cube build, or UI proof was performed.",
        "Seed mode upserts warn-only guard expectations into operations.* and does not mutate knowledge/publication data.",
      ],
    });
    console.log(JSON.stringify(summary, null, 2));
    if (args.emitProofBundle) proofBundle(args.outDir);
  } finally {
    await client.end();
  }
}

await main().catch((error) => {
  console.error(JSON.stringify({ status: "failed", error: error.message }, null, 2));
  process.exit(1);
});

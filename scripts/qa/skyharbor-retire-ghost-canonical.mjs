#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { Client } from "pg";

import { dbConnectionConfig, setTenantContext } from "../knowledge/build-review-decision-ledger.mjs";

const DEFAULT_TENANT_KEY = "skyharbor-air";
const DEFAULT_OUT_DIR = path.join(os.tmpdir(), "skyharbor-retire-ghost-canonical");
const CONFIRMATION = "retire-ghost-canonical";
const REASON_CODE = "phase_a_entity_collapse_defect";
const REVIEWER = "qa:skair-retire-ghost-canonical";
const REVIEW_DECISION = "rejected";

function parseArgs(argv = process.argv.slice(2), env = process.env) {
  const parsed = {
    tenantKey: env.ABARVA_TENANT_KEY || env.SKAIR_GHOST_RETIRE_TENANT_KEY || DEFAULT_TENANT_KEY,
    outDir: env.SKAIR_GHOST_RETIRE_OUT_DIR || DEFAULT_OUT_DIR,
    apply: env.SKAIR_GHOST_RETIRE_APPLY === "true",
    confirm: env.SKAIR_GHOST_RETIRE_CONFIRM || "",
    emitProofBundle:
      env.EMIT_ACA_PROOF_BUNDLE === "true" ||
      env.SKAIR_GHOST_RETIRE_EMIT_PROOF_BUNDLE === "true",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };
    if (arg === "--tenant") parsed.tenantKey = next();
    else if (arg === "--out-dir") parsed.outDir = path.resolve(process.cwd(), next());
    else if (arg === "--apply") parsed.apply = true;
    else if (arg === "--confirm-retire-ghost-canonical") parsed.confirm = next();
    else if (arg === "--emit-proof-bundle") parsed.emitProofBundle = true;
    else if (arg === "--no-emit-proof-bundle") parsed.emitProofBundle = false;
    else if (arg === "--help" || arg === "-h") {
      console.log(`Usage: node scripts/qa/skyharbor-retire-ghost-canonical.mjs [options]

Retire accepted tenant-key ghost canonical rows for the isolated synthetic lab lane.
Dry-run is the default. Apply mode requires both --apply and:
  --confirm-retire-ghost-canonical ${CONFIRMATION}

Options:
  --tenant <key>                         Tenant key. Default: ${DEFAULT_TENANT_KEY}
  --out-dir <path>                       Proof output directory. Default: ${DEFAULT_OUT_DIR}
  --apply                                Mutate canonical authority states.
  --confirm-retire-ghost-canonical <v>   Required confirmation for apply mode.
  --emit-proof-bundle                    Emit proof.tgz markers for the ACA wrapper.
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

function shortHash(value) {
  return sha256(value).slice(0, 16);
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

async function loadInventory(client, tenantKey) {
  const entities = await client.query(
    `
      SELECT entity_ref, entity_type, display_name, authority_state,
        accepted_evidence_refs, content_hash, effective_to
      FROM knowledge.entity
      WHERE tenant_key=$1
        AND authority_state='accepted'
        AND lower(trim(display_name)) = lower(trim($1))
      ORDER BY entity_ref
    `,
    [tenantKey],
  );
  const facts = await client.query(
    `
      SELECT f.fact_ref, f.entity_ref, f.fact_type, f.authority_state,
        f.evidence_refs, f.content_hash, f.effective_to,
        e.entity_type, e.display_name
      FROM knowledge.fact_assertion f
      JOIN knowledge.entity e
        ON e.tenant_key=f.tenant_key
       AND e.entity_ref=f.entity_ref
      WHERE f.tenant_key=$1
        AND f.authority_state='accepted'
        AND e.authority_state='accepted'
        AND lower(trim(e.display_name)) = lower(trim($1))
      ORDER BY f.fact_ref
    `,
    [tenantKey],
  );
  const candidateHints = await client.query(
    `
      SELECT f.candidate_ref AS fact_candidate_ref,
        f.subject_candidate_ref,
        e.entity_type AS target_entity_type,
        e.display_name AS target_display_name,
        e.natural_key AS target_natural_key,
        coalesce(
          nullif(e.candidate_payload->>'entity_ref',''),
          'entity:' || regexp_replace(
            lower(coalesce(nullif(e.natural_key, ''), nullif(e.candidate_payload->>'natural_key', ''), e.entity_type || ':' || e.display_name)),
            '[^a-z0-9]+',
            '-',
            'g'
          )
        ) AS target_entity_ref
      FROM working.fact_candidate f
      JOIN working.entity_candidate e
        ON e.tenant_key=f.tenant_key
       AND e.candidate_ref=f.subject_candidate_ref
      WHERE f.tenant_key=$1
        AND ('fact:' || f.candidate_ref) = ANY($2::text[])
      ORDER BY f.candidate_ref
    `,
    [tenantKey, facts.rows.map((row) => row.fact_ref)],
  );
  return { entities: entities.rows, facts: facts.rows, candidateHints: candidateHints.rows };
}

function reviewRefFor(objectSchema, objectRef) {
  return `review:ghost-retirement:${shortHash(`${objectSchema}:${objectRef}`)}:v1`;
}

function transitionRefFor(objectSchema, objectRef) {
  return `transition:ghost-retirement:${shortHash(`${objectSchema}:${objectRef}`)}:v1`;
}

function reasonDetail(objectSchema) {
  return `${objectSchema} retired before promotion because it was accepted under the pre-repair tenant-key display-name collapse.`;
}

async function writeReviewAndTransition(client, tenantKey, objectSchema, objectRef, evidenceRefs) {
  const reviewRef = reviewRefFor(objectSchema, objectRef);
  await client.query(
    `
      INSERT INTO governance.review_decision (
        tenant_key,
        review_ref,
        reviewed_object_schema,
        reviewed_object_ref,
        review_state,
        reviewer_ref,
        reason_code,
        reason_detail,
        decision,
        decision_basis,
        reviewer_identity,
        reviewed_at,
        evidence_refs,
        decision_metadata
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        'accepted',
        $5,
        $6,
        $7,
        $9,
        'prepromotion_guard_retirement',
        $5,
        now(),
        $8::text[],
        jsonb_build_object(
          'retirement_reason', $6::text,
          'retirement_decision', 'retired',
          'object_schema', $3::text,
          'object_ref', $4::text,
          'reversible_by_fresh_promotion', true
        )
      )
      ON CONFLICT (tenant_key, review_ref)
      DO UPDATE SET reason_code=EXCLUDED.reason_code,
        reason_detail=EXCLUDED.reason_detail,
        decision=EXCLUDED.decision,
        decision_basis=EXCLUDED.decision_basis,
        reviewer_identity=EXCLUDED.reviewer_identity,
        reviewed_at=now(),
        evidence_refs=EXCLUDED.evidence_refs,
        decision_metadata=coalesce(governance.review_decision.decision_metadata, '{}'::jsonb) || EXCLUDED.decision_metadata
    `,
    [
      tenantKey,
      reviewRef,
      objectSchema,
      objectRef,
      REVIEWER,
      REASON_CODE,
      reasonDetail(objectSchema),
      evidenceRefs,
      REVIEW_DECISION,
    ],
  );
  await client.query(
    `
      INSERT INTO governance.authority_transition (
        tenant_key,
        transition_ref,
        object_schema,
        object_ref,
        from_authority_state,
        to_authority_state,
        review_ref,
        evidence_refs
      )
      VALUES ($1, $2, $3, $4, 'accepted', 'retired', $5, $6::text[])
      ON CONFLICT (tenant_key, transition_ref)
      DO UPDATE SET to_authority_state=EXCLUDED.to_authority_state,
        review_ref=EXCLUDED.review_ref,
        evidence_refs=EXCLUDED.evidence_refs,
        transitioned_at=now()
    `,
    [tenantKey, transitionRefFor(objectSchema, objectRef), objectSchema, objectRef, reviewRef, evidenceRefs],
  );
}

async function applyRetirement(client, tenantKey, inventory) {
  if (inventory.entities.length === 0 && inventory.facts.length === 0) {
    return { status: "no_op", retiredEntities: 0, retiredFacts: 0, reviewEvents: 0, transitions: 0 };
  }
  await client.query("BEGIN");
  try {
    for (const fact of inventory.facts) {
      await writeReviewAndTransition(client, tenantKey, "knowledge.fact_assertion", fact.fact_ref, fact.evidence_refs ?? []);
    }
    for (const entity of inventory.entities) {
      await writeReviewAndTransition(client, tenantKey, "knowledge.entity", entity.entity_ref, entity.accepted_evidence_refs ?? []);
    }
    const retiredFacts = await client.query(
      `
        UPDATE knowledge.fact_assertion
        SET authority_state='retired',
          availability_state='superseded',
          freshness_state='stale',
          effective_to=coalesce(effective_to, now())
        WHERE tenant_key=$1
          AND fact_ref = ANY($2::text[])
          AND authority_state='accepted'
        RETURNING fact_ref
      `,
      [tenantKey, inventory.facts.map((row) => row.fact_ref)],
    );
    const retiredEntities = await client.query(
      `
        UPDATE knowledge.entity
        SET authority_state='retired',
          availability_state='superseded',
          freshness_state='stale',
          effective_to=coalesce(effective_to, now())
        WHERE tenant_key=$1
          AND entity_ref = ANY($2::text[])
          AND authority_state='accepted'
        RETURNING entity_ref
      `,
      [tenantKey, inventory.entities.map((row) => row.entity_ref)],
    );
    await client.query("COMMIT");
    return {
      status: "applied",
      retiredEntities: retiredEntities.rows.length,
      retiredFacts: retiredFacts.rows.length,
      reviewEvents: inventory.entities.length + inventory.facts.length,
      transitions: inventory.entities.length + inventory.facts.length,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function guardCounts(client, tenantKey) {
  return {
    acceptedGhostEntities: await scalar(
      client,
      `
        SELECT count(*)::int
        FROM knowledge.entity
        WHERE tenant_key=$1
          AND authority_state='accepted'
          AND lower(trim(display_name)) = lower(trim($1))
      `,
      [tenantKey],
    ),
    acceptedGhostFacts: await scalar(
      client,
      `
        SELECT count(*)::int
        FROM knowledge.fact_assertion f
        JOIN knowledge.entity e
          ON e.tenant_key=f.tenant_key
         AND e.entity_ref=f.entity_ref
        WHERE f.tenant_key=$1
          AND f.authority_state='accepted'
          AND e.authority_state='accepted'
          AND lower(trim(e.display_name)) = lower(trim($1))
      `,
      [tenantKey],
    ),
    acceptedFactsOnRetiredEntities: await scalar(
      client,
      `
        SELECT count(*)::int
        FROM knowledge.fact_assertion f
        JOIN knowledge.entity e
          ON e.tenant_key=f.tenant_key
         AND e.entity_ref=f.entity_ref
        WHERE f.tenant_key=$1
          AND f.authority_state='accepted'
          AND e.authority_state <> 'accepted'
      `,
      [tenantKey],
    ),
  };
}

function proofBundle(outDir) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "skair-ghost-retirement-proof-"));
  const tarPath = path.join(tmp, "proof.tgz");
  const result = spawnSync("tar", ["-czf", tarPath, "-C", outDir, "."], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`tar proof bundle failed: ${result.stderr || result.stdout}`);
  process.stdout.write("__SEMANTIC2_PROOF_TGZ_BEGIN__\n");
  process.stdout.write(fs.readFileSync(tarPath).toString("base64"));
  process.stdout.write("\n__SEMANTIC2_PROOF_TGZ_END__\n");
}

async function main() {
  const args = parseArgs();
  if (args.apply && args.confirm !== CONFIRMATION) {
    throw new Error(`Apply mode requires --confirm-retire-ghost-canonical ${CONFIRMATION}`);
  }
  fs.mkdirSync(args.outDir, { recursive: true });
  const client = new Client(await dbConnectionConfig(process.env));
  await client.connect();
  try {
    await setTenantContext(client, args.tenantKey);
    const before = await guardCounts(client, args.tenantKey);
    const inventory = await loadInventory(client, args.tenantKey);
    const applyResult = args.apply
      ? await applyRetirement(client, args.tenantKey, inventory)
      : { status: "dry_run", retiredEntities: 0, retiredFacts: 0, reviewEvents: 0, transitions: 0 };
    const after = await guardCounts(client, args.tenantKey);
    const summary = {
      status: "complete",
      tenantKey: args.tenantKey,
      mode: args.apply ? "apply" : "dry_run",
      checkedAt: new Date().toISOString(),
      reasonCode: REASON_CODE,
      before,
      after,
      applyResult,
      ghostEntities: inventory.entities,
      ghostFacts: inventory.facts,
      candidateRepointHints: inventory.candidateHints,
      boundaries: {
        canonicalPromotion: false,
        publication: false,
        baselineActivation: false,
        relationshipDerivation: false,
      },
      contentHash: "",
    };
    summary.contentHash = sha256(stableJson({ ...summary, checkedAt: null, contentHash: null }));
    writeJson(path.join(args.outDir, "ghost-retirement-readback.json"), summary);
    writeCsv(path.join(args.outDir, "ghost-entities.csv"), [
      "entity_ref",
      "entity_type",
      "display_name",
      "authority_state",
      "content_hash",
      "effective_to",
    ], inventory.entities);
    writeCsv(path.join(args.outDir, "ghost-facts.csv"), [
      "fact_ref",
      "entity_ref",
      "fact_type",
      "authority_state",
      "content_hash",
      "effective_to",
      "entity_type",
      "display_name",
    ], inventory.facts);
    writeCsv(path.join(args.outDir, "candidate-repoint-hints.csv"), [
      "fact_candidate_ref",
      "subject_candidate_ref",
      "target_entity_type",
      "target_display_name",
      "target_natural_key",
      "target_entity_ref",
    ], inventory.candidateHints);
    writeJson(path.join(args.outDir, "README.json"), {
      purpose: "Retire accepted tenant-key ghost canonical rows before canonical promotion.",
      contentHash: summary.contentHash,
      notes: [
        "Apply mode records governance.review_decision rows and governance.authority_transition rows before changing authority_state.",
        "Facts attached to ghost entities are retired with the ghosts; future fresh promotion can re-accept corrected fact rows because promotion upserts refresh entity_ref and authority_state.",
        "No promotion, publication, baseline activation, relationship derivation, Cube build, or product route proof is performed by this command.",
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

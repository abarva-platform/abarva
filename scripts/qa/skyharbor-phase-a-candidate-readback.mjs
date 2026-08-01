#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { Client } from "pg";

import { dbConnectionConfig, setTenantContext } from "../knowledge/build-review-decision-ledger.mjs";

const DEFAULT_TENANT_KEY = "skyharbor-air";
const DEFAULT_RELEASE_ID = "skyharbor-air-source-corpus-v1.0.0";
const DEFAULT_OUT_DIR = path.join(os.tmpdir(), "skyharbor-phase-a-candidate-readback");

const EXPECTED = Object.freeze({
  sourceVersions: 26,
  parsedRows: 5614,
  evidenceItems: 5614,
  distinctEvidenceSourceRows: 5614,
  entityCandidates: 5614,
  factCandidates: 5614,
  relationshipCandidates: 0,
  unresolvedEntities: 0,
  ambiguousEntities: 0,
  tenantKeyDisplayNames: 0,
  blankDisplayNames: 0,
  applicationPlatforms: 503,
  vendors: 65,
});

const REQUIRED_ENTITY_TYPES = Object.freeze({
  application_platform: 503,
  vendor: 65,
});

function parseArgs(argv = process.argv.slice(2), env = process.env) {
  const parsed = {
    tenantKey: env.ABARVA_TENANT_KEY || env.SKAIR_PHASE_A_TENANT_KEY || DEFAULT_TENANT_KEY,
    releaseId: env.ABARVA_RELEASE_ID || env.ABARVA_SOURCE_RELEASE_ID || env.SKAIR_PHASE_A_RELEASE_ID || DEFAULT_RELEASE_ID,
    outDir: env.SKAIR_PHASE_A_READBACK_OUT_DIR || DEFAULT_OUT_DIR,
    emitProofBundle:
      env.EMIT_ACA_PROOF_BUNDLE === "true" ||
      env.SKAIR_PHASE_A_EMIT_PROOF_BUNDLE === "true",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };
    if (arg === "--tenant") parsed.tenantKey = next();
    else if (arg === "--release-id") parsed.releaseId = next();
    else if (arg === "--out-dir") parsed.outDir = path.resolve(process.cwd(), next());
    else if (arg === "--emit-proof-bundle") parsed.emitProofBundle = true;
    else if (arg === "--no-emit-proof-bundle") parsed.emitProofBundle = false;
    else if (arg === "--help" || arg === "-h") {
      console.log(`Usage: node scripts/qa/skyharbor-phase-a-candidate-readback.mjs [options]

Read-only Phase A source/evidence/candidate readback for the isolated lab lane.

Options:
  --tenant <key>       Tenant key. Default: ${DEFAULT_TENANT_KEY}
  --release-id <id>    Source release id. Default: ${DEFAULT_RELEASE_ID}
  --out-dir <path>     Proof output directory. Default: ${DEFAULT_OUT_DIR}
  --emit-proof-bundle  Emit proof.tgz markers for the ACA wrapper.
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
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
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

async function tableExists(client, schemaName, tableName) {
  const result = await client.query(
    `
      SELECT to_regclass($1)::text AS table_name
    `,
    [`${schemaName}.${tableName}`],
  );
  return Boolean(result.rows[0]?.table_name);
}

function expectationRows(summary) {
  return [
    ["sourceVersions", EXPECTED.sourceVersions, summary.core.sourceVersions],
    ["parsedRows", EXPECTED.parsedRows, summary.core.parsedRows],
    ["evidenceItems", EXPECTED.evidenceItems, summary.core.evidenceItems],
    ["distinctEvidenceSourceRows", EXPECTED.distinctEvidenceSourceRows, summary.core.distinctEvidenceSourceRows],
    ["entityCandidates", EXPECTED.entityCandidates, summary.core.entityCandidates],
    ["factCandidates", EXPECTED.factCandidates, summary.core.factCandidates],
    ["relationshipCandidates", EXPECTED.relationshipCandidates, summary.core.relationshipCandidates],
    ["unresolvedEntities", EXPECTED.unresolvedEntities, summary.quality.unresolvedEntities],
    ["ambiguousEntities", EXPECTED.ambiguousEntities, summary.quality.ambiguousEntities],
    ["tenantKeyDisplayNames", EXPECTED.tenantKeyDisplayNames, summary.quality.tenantKeyDisplayNames],
    ["blankDisplayNames", EXPECTED.blankDisplayNames, summary.quality.blankDisplayNames],
    ["applicationPlatforms", EXPECTED.applicationPlatforms, summary.entityTypeCounts.application_platform ?? 0],
    ["vendors", EXPECTED.vendors, summary.entityTypeCounts.vendor ?? 0],
  ].map(([metric, expected, actual]) => ({
    metric,
    expected,
    actual,
    state: Number(expected) === Number(actual) ? "passed" : "failed",
  }));
}

function summarizeState(rows) {
  return rows.every((row) => row.state === "passed") ? "passed" : "failed";
}

function proofBundle(outDir) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "skair-phase-a-readback-proof-"));
  const tarPath = path.join(tmp, "proof.tgz");
  const result = spawnSync("tar", ["-czf", tarPath, "-C", outDir, "."], {
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(`tar proof bundle failed: ${result.stderr || result.stdout}`);
  }
  const encoded = fs.readFileSync(tarPath).toString("base64");
  process.stdout.write("__SEMANTIC2_PROOF_TGZ_BEGIN__\n");
  process.stdout.write(encoded);
  process.stdout.write("\n__SEMANTIC2_PROOF_TGZ_END__\n");
}

async function main() {
  const args = parseArgs();
  fs.mkdirSync(args.outDir, { recursive: true });

  const client = new Client(await dbConnectionConfig(process.env));
  await client.connect();
  try {
    await setTenantContext(client, args.tenantKey);

    const hasSourceRow = await tableExists(client, "evidence", "source_row_v1");
    const hasSourceField = await tableExists(client, "evidence", "source_field_v1");
    const hasSourceExploration = await tableExists(client, "consumption", "source_evidence_exploration_v1");
    const hasApplicationExploration = await tableExists(client, "consumption", "application_exploration_v1");
    const hasInterviewExploration = await tableExists(client, "consumption", "interview_exploration_v1");

    const params = [args.tenantKey, args.releaseId];
    const core = {
      sourceVersions: await scalar(
        client,
        `
          SELECT count(*)::int
          FROM source_registry.source s
          JOIN source_registry.source_version v
            ON v.tenant_key = s.tenant_key
           AND v.source_ref = s.source_ref
          WHERE s.tenant_key=$1
            AND s.source_visibility='client_visible'
            AND s.source_basis <> 'restricted_evaluator'
            AND s.metadata->>'releaseId'=$2
        `,
        params,
      ),
      parsedRows: await scalar(
        client,
        `
          SELECT coalesce(sum(nullif(l.event_payload->>'rowCount','')::int),0)::int
          FROM source_registry.source s
          JOIN source_registry.source_version v
            ON v.tenant_key = s.tenant_key
           AND v.source_ref = s.source_ref
          JOIN audit.lineage_event l
            ON l.tenant_key = s.tenant_key
           AND l.source_version_ref = v.source_version_ref
           AND l.lineage_ref LIKE 'parse:%'
          WHERE s.tenant_key=$1
            AND s.source_visibility='client_visible'
            AND s.source_basis <> 'restricted_evaluator'
            AND s.metadata->>'releaseId'=$2
        `,
        params,
      ),
      evidenceItems: await scalar(
        client,
        `
          SELECT count(*)::int
          FROM evidence.evidence_item e
          JOIN source_registry.source_version v
            ON v.tenant_key=e.tenant_key
           AND v.source_version_ref=e.source_version_ref
          JOIN source_registry.source s
            ON s.tenant_key=v.tenant_key
           AND s.source_ref=v.source_ref
          WHERE e.tenant_key=$1
            AND s.metadata->>'releaseId'=$2
        `,
        params,
      ),
      distinctEvidenceSourceRows: await scalar(
        client,
        `
          SELECT count(DISTINCT e.source_version_ref || ':' || coalesce(e.source_row_ref,''))::int
          FROM evidence.evidence_item e
          JOIN source_registry.source_version v
            ON v.tenant_key=e.tenant_key
           AND v.source_version_ref=e.source_version_ref
          JOIN source_registry.source s
            ON s.tenant_key=v.tenant_key
           AND s.source_ref=v.source_ref
          WHERE e.tenant_key=$1
            AND s.metadata->>'releaseId'=$2
            AND coalesce(e.source_row_ref,'') <> ''
        `,
        params,
      ),
      entityCandidates: await scalar(client, "SELECT count(*)::int FROM working.entity_candidate WHERE tenant_key=$1", [args.tenantKey]),
      factCandidates: await scalar(client, "SELECT count(*)::int FROM working.fact_candidate WHERE tenant_key=$1", [args.tenantKey]),
      relationshipCandidates: await scalar(client, "SELECT count(*)::int FROM working.relationship_candidate WHERE tenant_key=$1", [args.tenantKey]),
    };

    const entityTypeResult = await client.query(
      `
        SELECT entity_type, count(*)::int AS rows
        FROM working.entity_candidate
        WHERE tenant_key=$1
        GROUP BY entity_type
        ORDER BY entity_type
      `,
      [args.tenantKey],
    );
    const entityTypeCounts = Object.fromEntries(entityTypeResult.rows.map((row) => [row.entity_type, Number(row.rows)]));

    const sourceBreakdown = (
      await client.query(
        `
          WITH source_rows AS (
            SELECT
              s.source_name,
              s.source_family,
              v.source_version_ref,
              coalesce(max(nullif(l.event_payload->>'rowCount','')::int),0)::int AS parsed_rows
            FROM source_registry.source s
            JOIN source_registry.source_version v
              ON v.tenant_key=s.tenant_key
             AND v.source_ref=s.source_ref
            LEFT JOIN audit.lineage_event l
              ON l.tenant_key=s.tenant_key
             AND l.source_version_ref=v.source_version_ref
             AND l.lineage_ref LIKE 'parse:%'
            WHERE s.tenant_key=$1
              AND s.source_visibility='client_visible'
              AND s.source_basis <> 'restricted_evaluator'
              AND s.metadata->>'releaseId'=$2
            GROUP BY s.source_name, s.source_family, v.source_version_ref
          ),
          evidence_rows AS (
            SELECT source_version_ref, count(*)::int AS evidence_items,
              count(DISTINCT source_row_ref)::int AS evidence_source_rows
            FROM evidence.evidence_item
            WHERE tenant_key=$1
            GROUP BY source_version_ref
          ),
          candidate_rows AS (
            SELECT source_version_ref,
              count(*) FILTER (WHERE candidate_type='entity_candidate')::int AS entity_candidates,
              count(*) FILTER (WHERE candidate_type='fact_candidate')::int AS fact_candidates,
              count(*) FILTER (WHERE candidate_type='relationship_candidate')::int AS relationship_candidates
            FROM (
              SELECT source_version_ref, 'entity_candidate' AS candidate_type FROM working.entity_candidate WHERE tenant_key=$1
              UNION ALL
              SELECT source_version_ref, 'fact_candidate' FROM working.fact_candidate WHERE tenant_key=$1
              UNION ALL
              SELECT source_version_ref, 'relationship_candidate' FROM working.relationship_candidate WHERE tenant_key=$1
            ) c
            GROUP BY source_version_ref
          )
          SELECT
            sr.source_name AS "sourceName",
            sr.source_family AS "sourceFamily",
            sr.source_version_ref AS "sourceVersionRef",
            sr.parsed_rows AS "parsedRows",
            coalesce(er.evidence_items,0)::int AS "evidenceItems",
            coalesce(er.evidence_source_rows,0)::int AS "evidenceSourceRows",
            coalesce(cr.entity_candidates,0)::int AS "entityCandidates",
            coalesce(cr.fact_candidates,0)::int AS "factCandidates",
            coalesce(cr.relationship_candidates,0)::int AS "relationshipCandidates"
          FROM source_rows sr
          LEFT JOIN evidence_rows er ON er.source_version_ref=sr.source_version_ref
          LEFT JOIN candidate_rows cr ON cr.source_version_ref=sr.source_version_ref
          ORDER BY sr.source_name
        `,
        params,
      )
    ).rows;

    const qualityResult = await client.query(
      `
        WITH entity_refs AS (
          SELECT
            candidate_ref,
            display_name,
            coalesce(candidate_payload->>'entity_ref','') AS entity_ref
          FROM working.entity_candidate
          WHERE tenant_key=$1
        ),
        duplicate_refs AS (
          SELECT entity_ref
          FROM entity_refs
          WHERE entity_ref <> ''
          GROUP BY entity_ref
          HAVING count(*) > 1
        )
        SELECT
          count(*) FILTER (WHERE entity_ref='')::int AS "unresolvedEntities",
          coalesce((SELECT sum(ref_count - 1)::int FROM (
            SELECT entity_ref, count(*) AS ref_count
            FROM entity_refs
            WHERE entity_ref <> ''
            GROUP BY entity_ref
            HAVING count(*) > 1
          ) d),0)::int AS "ambiguousEntities",
          count(*) FILTER (WHERE display_name=$1)::int AS "tenantKeyDisplayNames",
          count(*) FILTER (WHERE coalesce(nullif(trim(display_name),''),'')='')::int AS "blankDisplayNames",
          coalesce((SELECT count(*)::int FROM duplicate_refs),0)::int AS "duplicateEntityRefs"
        FROM entity_refs
      `,
      [args.tenantKey],
    );
    const quality = {
      unresolvedEntities: Number(qualityResult.rows[0]?.unresolvedEntities ?? 0),
      ambiguousEntities: Number(qualityResult.rows[0]?.ambiguousEntities ?? 0),
      tenantKeyDisplayNames: Number(qualityResult.rows[0]?.tenantKeyDisplayNames ?? 0),
      blankDisplayNames: Number(qualityResult.rows[0]?.blankDisplayNames ?? 0),
      duplicateEntityRefs: Number(qualityResult.rows[0]?.duplicateEntityRefs ?? 0),
    };

    const optionalExploration = {
      sourceRows: hasSourceRow ? await scalar(client, "SELECT count(*)::int FROM evidence.source_row_v1 WHERE tenant_key=$1", [args.tenantKey]) : null,
      sourceFields: hasSourceField ? await scalar(client, "SELECT count(*)::int FROM evidence.source_field_v1 WHERE tenant_key=$1", [args.tenantKey]) : null,
      sourceExplorationRows: hasSourceExploration
        ? await scalar(client, "SELECT count(*)::int FROM consumption.source_evidence_exploration_v1 WHERE tenant_key=$1", [args.tenantKey])
        : null,
      applicationExplorationRows: hasApplicationExploration
        ? await scalar(client, "SELECT count(*)::int FROM consumption.application_exploration_v1 WHERE tenant_key=$1", [args.tenantKey])
        : null,
      interviewExplorationRows: hasInterviewExploration
        ? await scalar(client, "SELECT count(*)::int FROM consumption.interview_exploration_v1 WHERE tenant_key=$1", [args.tenantKey])
        : null,
    };

    const summary = {
      status: "pending",
      tenantKey: args.tenantKey,
      releaseId: args.releaseId,
      checkedAt: new Date().toISOString(),
      core,
      entityTypeCounts,
      quality,
      optionalExploration,
      requiredEntityTypes: REQUIRED_ENTITY_TYPES,
      sourceBreakdown,
    };
    const checks = expectationRows(summary);
    summary.checks = checks;
    summary.status = summarizeState(checks);
    summary.contentHash = sha256(stableJson({ ...summary, checkedAt: null, contentHash: null }));

    writeJson(path.join(args.outDir, "phase-a-candidate-readback.json"), summary);
    writeCsv(path.join(args.outDir, "phase-a-candidate-readback-checks.csv"), ["metric", "expected", "actual", "state"], checks);
    writeCsv(
      path.join(args.outDir, "phase-a-source-breakdown.csv"),
      [
        "sourceName",
        "sourceFamily",
        "sourceVersionRef",
        "parsedRows",
        "evidenceItems",
        "evidenceSourceRows",
        "entityCandidates",
        "factCandidates",
        "relationshipCandidates",
      ],
      sourceBreakdown,
    );
    writeCsv(
      path.join(args.outDir, "phase-a-entity-type-counts.csv"),
      ["entity_type", "rows"],
      entityTypeResult.rows.map((row) => ({ entity_type: row.entity_type, rows: row.rows })),
    );
    writeJson(path.join(args.outDir, "README.json"), {
      purpose: "Read-only Phase A post-apply source/evidence/candidate reconciliation.",
      status: summary.status,
      contentHash: summary.contentHash,
      notes: [
        "This proof reads source_registry, evidence, and working tables only.",
        "It does not create canonical records, publications, baselines, or product projections.",
        "Exploration table counts are reported as informational because they are governed by a separate track.",
      ],
    });

    console.log(JSON.stringify(summary, null, 2));
    if (args.emitProofBundle) proofBundle(args.outDir);
    if (summary.status !== "passed") process.exitCode = 1;
  } finally {
    await client.end();
  }
}

await main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        status: "failed",
        error: error.message,
      },
      null,
      2,
    ),
  );
  process.exit(1);
});

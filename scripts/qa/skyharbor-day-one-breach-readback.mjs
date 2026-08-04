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
const DEFAULT_OUT_DIR = path.join(os.tmpdir(), "skyharbor-day-one-breach-readback");
const EXPECTED_DECLARED_INTAKE_DATA_SOURCES = 33;
const APP_REF = "exp-entity-resolve-application-count-v1";
const VENDOR_REF = "exp-entity-resolve-vendor-count-v1";
const PROMOTABLE_REFS = Object.freeze([APP_REF, VENDOR_REF]);
const PROMOTABLE_QUERY_SQL = Object.freeze({
  [APP_REF]: `
    SELECT count(DISTINCT coalesce(nullif(trim(normalized_value_text), ''), nullif(trim(raw_value_text), '')))::int
    FROM evidence.source_field_v1
    WHERE tenant_key=$1
      AND source_name='04_applications_systems.csv'
      AND field_name='system_name'
  `.trim(),
  [VENDOR_REF]: `
    SELECT count(DISTINCT coalesce(nullif(trim(normalized_value_text), ''), nullif(trim(raw_value_text), '')))::int
    FROM evidence.source_field_v1
    WHERE tenant_key=$1
      AND source_name='07_vendors_contracts.csv'
      AND field_name='vendor_name'
  `.trim(),
});

function parseArgs(argv = process.argv.slice(2), env = process.env) {
  const parsed = {
    tenantKey: env.ABARVA_TENANT_KEY || env.SKAIR_DAY_ONE_TENANT_KEY || DEFAULT_TENANT_KEY,
    releaseId: env.ABARVA_RELEASE_ID || env.ABARVA_SOURCE_RELEASE_ID || env.SKAIR_DAY_ONE_RELEASE_ID || DEFAULT_RELEASE_ID,
    outDir: env.SKAIR_DAY_ONE_READBACK_OUT_DIR || DEFAULT_OUT_DIR,
    promotePassingAppVendor: env.SKAIR_DAY_ONE_PROMOTE_APP_VENDOR === "true",
    emitProofBundle:
      env.EMIT_ACA_PROOF_BUNDLE === "true" ||
      env.SKAIR_DAY_ONE_EMIT_PROOF_BUNDLE === "true",
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
    else if (arg === "--promote-passing-app-vendor") parsed.promotePassingAppVendor = true;
    else if (arg === "--emit-proof-bundle") parsed.emitProofBundle = true;
    else if (arg === "--no-emit-proof-bundle") parsed.emitProofBundle = false;
    else if (arg === "--help" || arg === "-h") {
      console.log(`Usage: node scripts/qa/skyharbor-day-one-breach-readback.mjs [options]

Build a live DB-backed day-one breach readback for the isolated synthetic lab lane.

Options:
  --tenant <key>                  Tenant key. Default: ${DEFAULT_TENANT_KEY}
  --release-id <id>               Source release id. Default: ${DEFAULT_RELEASE_ID}
  --out-dir <path>                Proof output directory. Default: ${DEFAULT_OUT_DIR}
  --promote-passing-app-vendor    Flip only app/vendor entity-resolve expectations to fail
                                  when the live checks pass and rows already exist.
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

async function columnExists(client, schemaName, tableName, columnName) {
  const result = await client.query(
    `
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema=$1
        AND table_name=$2
        AND column_name=$3
      LIMIT 1
    `,
    [schemaName, tableName, columnName],
  );
  return result.rows.length > 0;
}

async function sourceFieldRows(client, tenantKey) {
  const result = await client.query(
    `
      SELECT source_name, source_row_ref, field_name,
        coalesce(nullif(normalized_value_text, ''), raw_value_text, '') AS value_text
      FROM evidence.source_field_v1
      WHERE tenant_key=$1
        AND source_name = ANY($2::text[])
        AND field_name = ANY($3::text[])
    `,
    [
      tenantKey,
      [
        "01_business_functions.csv",
        "02_org_ownership.csv",
        "04_applications_systems.csv",
        "05_data_assets_integrations.csv",
        "07_vendors_contracts.csv",
        "10_ai_automation_use_cases.csv",
        "11_risks_controls.csv",
        "17_service_scope_managed_services.csv",
        "18_operational_process_evidence.csv",
        "20_itsm_ticket_sla_performance.csv",
        "SA08_AI_Benefits_Realization_Usage_Ledger.csv",
        "SA11_AI_KPI_Operational_Outcome_Feed.csv",
      ],
      [
        "business_function",
        "caveat",
        "function_name",
        "in_scope_functions",
        "in_scope_systems",
        "original_row_id",
        "owned_functions",
        "owned_systems",
        "required_systems",
        "source_system",
        "supported_functions",
        "supported_systems",
        "system_name",
        "systems_impacted",
        "systems_used",
        "target_system",
        "tower_claim_allowed",
        "vendor",
        "vendor_name",
      ],
    ],
  );
  return result.rows;
}

function normalizeKey(value) {
  return String(value ?? "").trim().toLowerCase();
}

function valuesFor(rows, sourceName, fieldName) {
  return rows
    .filter((row) => row.source_name === sourceName && row.field_name === fieldName)
    .map((row) => ({ rowRef: row.source_row_ref, value: normalizeKey(row.value_text) }))
    .filter((row) => row.value);
}

function distinctFieldCount(rows, sourceName, fieldName) {
  return new Set(valuesFor(rows, sourceName, fieldName).map((row) => row.value)).size;
}

function fieldValueSet(rows, sourceName, fieldName) {
  return new Set(valuesFor(rows, sourceName, fieldName).map((row) => row.value));
}

function exactReferenceStats(rows, fromSource, fromField, toSource, toField) {
  const targets = fieldValueSet(rows, toSource, toField);
  const elements = valuesFor(rows, fromSource, fromField);
  const edges = new Set();
  for (const row of elements) {
    if (targets.has(row.value)) edges.add(`${row.rowRef}|${row.value}`);
  }
  return { elements: elements.length, resolved: edges.size, unresolved: elements.length - edges.size };
}

function delimitedReferenceStats(rows, fromSource, fromField, toSource, toField) {
  const targets = fieldValueSet(rows, toSource, toField);
  const elements = new Set();
  const edges = new Set();
  for (const row of valuesFor(rows, fromSource, fromField)) {
    for (const token of row.value.split(/[;|]/).map((value) => value.trim()).filter(Boolean)) {
      elements.add(`${row.rowRef}|${token}`);
      if (targets.has(token)) edges.add(`${row.rowRef}|${token}`);
    }
  }
  return { elements: elements.size, resolved: edges.size, unresolved: elements.size - edges.size };
}

function referenceBreakdown(rows) {
  const exactRules = [
    ["R-05a", "T1", "05_data_assets_integrations.csv", "source_system", "04_applications_systems.csv", "original_row_id", 499],
    ["R-05b", "T1", "05_data_assets_integrations.csv", "target_system", "04_applications_systems.csv", "original_row_id", 499],
    ["R-20", "T2", "20_itsm_ticket_sla_performance.csv", "system_name", "04_applications_systems.csv", "system_name", 503],
    ["R-04f", "T2", "04_applications_systems.csv", "business_function", "01_business_functions.csv", "function_name", 503],
    ["R-04v", "T2", "04_applications_systems.csv", "vendor", "07_vendors_contracts.csv", "vendor_name", 265],
  ];
  const delimitedRules = [
    ["R-02f", "T3", "02_org_ownership.csv", "owned_functions", "01_business_functions.csv", "function_name", 174],
    ["R-02s", "T3", "02_org_ownership.csv", "owned_systems", "04_applications_systems.csv", "system_name", 128],
    ["R-18", "T3", "18_operational_process_evidence.csv", "systems_used", "04_applications_systems.csv", "system_name", 77],
    ["R-11", "T3", "11_risks_controls.csv", "systems_impacted", "04_applications_systems.csv", "system_name", 62],
    ["R-07f", "T3", "07_vendors_contracts.csv", "supported_functions", "01_business_functions.csv", "function_name", 74],
    ["R-07s", "T3", "07_vendors_contracts.csv", "supported_systems", "04_applications_systems.csv", "system_name", 43],
    ["R-10", "T3", "10_ai_automation_use_cases.csv", "required_systems", "04_applications_systems.csv", "system_name", 28],
    ["R-17s", "T3", "17_service_scope_managed_services.csv", "in_scope_systems", "04_applications_systems.csv", "system_name", 15],
    ["R-17f", "T3", "17_service_scope_managed_services.csv", "in_scope_functions", "01_business_functions.csv", "function_name", 11],
  ];
  return [
    ...exactRules.map(([ruleRef, tier, fromSource, fromField, toSource, toField, prior]) => ({
      rule_ref: ruleRef,
      tier,
      rule_shape: "exact",
      from_source: fromSource,
      from_field: fromField,
      to_source: toSource,
      to_field: toField,
      prior_expected_edges: prior,
      ...exactReferenceStats(rows, fromSource, fromField, toSource, toField),
    })),
    ...delimitedRules.map(([ruleRef, tier, fromSource, fromField, toSource, toField, prior]) => ({
      rule_ref: ruleRef,
      tier,
      rule_shape: "delimited",
      from_source: fromSource,
      from_field: fromField,
      to_source: toSource,
      to_field: toField,
      prior_expected_edges: prior,
      ...delimitedReferenceStats(rows, fromSource, fromField, toSource, toField),
    })),
  ].map((row) => ({ ...row, delta_vs_prior_expected: row.resolved - row.prior_expected_edges }));
}

function partialClaimRowsWithCaveat(rows) {
  const caveatRows = new Set(valuesFor(rows, "SA08_AI_Benefits_Realization_Usage_Ledger.csv", "caveat")
    .concat(valuesFor(rows, "SA11_AI_KPI_Operational_Outcome_Feed.csv", "caveat"))
    .map((row) => row.rowRef));
  return new Set(valuesFor(rows, "SA08_AI_Benefits_Realization_Usage_Ledger.csv", "tower_claim_allowed")
    .concat(valuesFor(rows, "SA11_AI_KPI_Operational_Outcome_Feed.csv", "tower_claim_allowed"))
    .filter((row) => row.value === "partial" && caveatRows.has(row.rowRef))
    .map((row) => row.rowRef)).size;
}

function statusFor(row) {
  if (row.expected_min !== undefined) return row.actual >= row.expected_min ? "pass" : row.on_breach;
  return row.actual === row.expected ? "pass" : row.on_breach;
}

async function projectionRows(client, tenantKey, projectionName) {
  if (!(await relationExists(client, "publication.projection_version"))) return 0;
  const hasRetiredAt = await columnExists(client, "publication", "projection_version", "retired_at");
  return scalar(
    client,
    `
      SELECT coalesce(max(row_count), 0)::int
      FROM publication.projection_version
      WHERE tenant_key=$1
        AND projection_name=$2
        ${hasRetiredAt ? "AND retired_at IS NULL" : ""}
    `,
    [tenantKey, projectionName],
  );
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

async function buildReport(client, args) {
  const sourceFields = await sourceFieldRows(client, args.tenantKey);
  const derivedRules = referenceBreakdown(sourceFields);
  const applicationExpected = distinctFieldCount(sourceFields, "04_applications_systems.csv", "system_name");
  const vendorExpected = distinctFieldCount(sourceFields, "07_vendors_contracts.csv", "vendor_name");
  const derivedExpected = derivedRules.reduce((total, row) => total + row.resolved, 0);
  const rows = [
    ["exp-source-register-file-count-v1", "source-register", "source_file", "declared intake data sources excluding workbook lineage companions", EXPECTED_DECLARED_INTAKE_DATA_SOURCES, undefined, await scalar(client, "SELECT count(*)::int FROM source_registry.source WHERE tenant_key=$1 AND source_visibility='client_visible' AND source_basis <> 'restricted_evaluator' AND metadata->>'releaseId'=$2", [args.tenantKey, args.releaseId])],
    ["exp-source-parse-evidence-row-count-v1", "source-parse", "evidence_row", "all declared parser-visible rows", 6362, undefined, await scalar(client, "SELECT count(*)::int FROM evidence.evidence_item WHERE tenant_key=$1", [args.tenantKey])],
    [APP_REF, "entity-resolve", "entity_candidate", "entity_type=application_platform", applicationExpected, undefined, await scalar(client, "SELECT count(*)::int FROM working.entity_candidate WHERE tenant_key=$1 AND entity_type='application_platform'", [args.tenantKey]), true],
    [VENDOR_REF, "entity-resolve", "entity_candidate", "entity_type=vendor", vendorExpected, undefined, await scalar(client, "SELECT count(*)::int FROM working.entity_candidate WHERE tenant_key=$1 AND entity_type='vendor'", [args.tenantKey]), true],
    ["exp-derive-references-t1-t3-v1", "derive-references", "relationship", "deterministic T1-T3 derivation catalogue", derivedExpected, undefined, await scalar(client, "SELECT count(*)::int FROM knowledge.relationship_assertion WHERE tenant_key=$1", [args.tenantKey])],
    ["exp-derive-conflict-crew-copilot-value-semantics-v1", "derive-references", "conflict", "Crew and Station Productivity Copilot value semantics", undefined, 1, await scalar(client, "SELECT count(*)::int FROM governance.conflict_assertion WHERE tenant_key=$1 AND conflict_ref='conflict:crew-station-productivity-copilot:value-semantics:v1'", [args.tenantKey])],
    ["exp-projection-application-inventory-v1", "projection-build", "projection_row", "consumption.application_inventory_v1", applicationExpected, undefined, await projectionRows(client, args.tenantKey, "application_inventory_v1")],
    ["exp-projection-evidence-gap-v1", "projection-build", "projection_row", "consumption.evidence_gap_v1", undefined, 1, await projectionRows(client, args.tenantKey, "evidence_gap_v1")],
    ["exp-projection-partial-claim-caveat-v1", "projection-build", "claim_caveat", "partial claim values carry caveat to consumption", partialClaimRowsWithCaveat(sourceFields), undefined, 0],
    ["exp-chunk-build-interview-qa-pair-v1", "chunk-build", "chunk", "chunk_kind=qa_pair", 510, undefined, await scalar(client, "SELECT count(*)::int FROM evidence.source_chunk_v1 WHERE tenant_key=$1 AND chunk_kind='qa_pair'", [args.tenantKey])],
    ["exp-metric-observation-template-change-pending-v1", "metric-build", "metric_observation", "all metric observations", 0, undefined, await scalar(client, "SELECT count(*)::int FROM metrics.metric_observation WHERE tenant_key=$1", [args.tenantKey])],
    ["exp-finding-f01-portfolio-conviction-inversion-blocked-v1", "finding-catalogue", "finding_rule_state", "F-01 portfolio conviction inversion", 1, undefined, 1, false, "blocked_declared"],
    ["exp-tower-application-inventory-v1", "tower-projection-build", "projection_row", "Tower application/estate dependency surface", applicationExpected, undefined, await projectionRows(client, args.tenantKey, "application_inventory_v1"), false, undefined, "out_of_scope"],
  ];
  const policies = await persistedExpectationPolicy(client, args.tenantKey, rows.map(([expectationRef]) => expectationRef));
  const checks = rows.map(([expectationRef, stageName, objectKind, objectScope, expected, expectedMin, actual, promotable, override, scope]) => {
    const policy = policies.get(expectationRef);
    const row = {
      tenant_key: args.tenantKey,
      expectation_ref: expectationRef,
      stage_name: stageName,
      object_kind: objectKind,
      object_scope: objectScope,
      expected,
      expected_min: expectedMin,
      actual,
      on_breach: policy?.on_breach ?? "warn",
      implementation_scope: policy?.implementation_scope ?? scope ?? "active",
      policy_contract_version: policy?.contract_version ?? null,
      policy_reviewed_by: policy?.reviewed_by ?? null,
      policy_source: policy ? "operations.design_expectation" : "runner_default",
      promotable_to_fail: Boolean(promotable),
    };
    return { status: override ?? statusFor(row), ...row };
  });
  return { checks, derivedRules };
}

async function promotePassingExpectations(client, args, checks) {
  const promotableChecks = checks.filter((row) => PROMOTABLE_REFS.includes(row.expectation_ref));
  const passingRefs = promotableChecks.filter((row) => row.status === "pass").map((row) => row.expectation_ref);
  if (passingRefs.length !== PROMOTABLE_REFS.length) {
    return { requested: true, status: "skipped_not_all_promotable_checks_passed", passingRefs, requiredRefs: PROMOTABLE_REFS };
  }
  await client.query("BEGIN");
  try {
    const existingBeforeSeed = await client.query(
      `
        SELECT expectation_ref, on_breach, reviewed_by
        FROM operations.design_expectation
        WHERE tenant_key=$1
          AND expectation_ref = ANY($2::text[])
        ORDER BY expectation_ref
      `,
      [args.tenantKey, PROMOTABLE_REFS],
    );
    for (const row of promotableChecks) {
      const queryRef = row.expectation_ref.replace(/^exp-/, "qry-exp-");
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
            ARRAY['evidence.source_field_v1'],
            '{"type":"scalar_count","nullable":false}'::jsonb,
            'executable_sql',
            'qa:skair-day-one-breach-readback',
            'phase-a-live-readback',
            jsonb_build_object('expectation_ref', $3::text, 'seeded_from_live_readback', true)
          )
          ON CONFLICT (query_ref, query_version)
          DO UPDATE SET query_sql=EXCLUDED.query_sql,
            referenced_relations=EXCLUDED.referenced_relations,
            reviewed_by=coalesce(operations.registered_query.reviewed_by, EXCLUDED.reviewed_by),
            metadata=coalesce(operations.registered_query.metadata, '{}'::jsonb) || EXCLUDED.metadata
        `,
        [queryRef, PROMOTABLE_QUERY_SQL[row.expectation_ref], row.expectation_ref],
      );
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
            'foundation-v3-conservation-warn-v0',
            $3,
            $4,
            jsonb_build_object('label', $5::text),
            'upstream_count',
            $6,
            'executable_sql',
            $7,
            'v1',
            ARRAY['evidence.source_field_v1'],
            ARRAY['working.entity_candidate'],
            'evidence',
            'working',
            'fail',
            'active',
            'qa:skair-day-one-breach-readback',
            'phase-a-live-readback',
            jsonb_build_object(
              'status', $8::text,
              'actual', $9::int,
              'seeded_from_live_readback', true,
              'graduated_by', 'qa:skair-day-one-breach-readback',
              'graduation_basis', 'live_db_readback_passed'
            )
          )
          ON CONFLICT (tenant_key, expectation_ref)
          DO UPDATE SET expected_count=EXCLUDED.expected_count,
            stage_write_relations=EXCLUDED.stage_write_relations,
            stage_write_layer=EXCLUDED.stage_write_layer,
            on_breach='fail',
            reviewed_by=coalesce(operations.design_expectation.reviewed_by, EXCLUDED.reviewed_by),
            metadata=coalesce(operations.design_expectation.metadata, '{}'::jsonb) || EXCLUDED.metadata
        `,
        [
          args.tenantKey,
          row.expectation_ref,
          row.stage_name,
          row.object_kind,
          row.object_scope,
          row.expected,
          queryRef,
          row.status,
          row.actual,
        ],
      );
    }
    await client.query(
      `
        SELECT expectation_ref, on_breach, reviewed_by
        FROM operations.design_expectation
        WHERE tenant_key=$1
          AND expectation_ref = ANY($2::text[])
        ORDER BY expectation_ref
        FOR UPDATE
      `,
      [args.tenantKey, PROMOTABLE_REFS],
    );
    const updated = await client.query(
      `
        UPDATE operations.design_expectation
        SET on_breach='fail',
          reviewed_by=coalesce(reviewed_by, 'phase-a-live-readback'),
          metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
            'graduated_by', 'qa:skair-day-one-breach-readback',
            'graduated_at_utc', now(),
            'graduation_basis', 'live_db_readback_passed'
          )
        WHERE tenant_key=$1
          AND expectation_ref = ANY($2::text[])
        RETURNING expectation_ref, on_breach, reviewed_by
      `,
      [args.tenantKey, PROMOTABLE_REFS],
    );
    await client.query("COMMIT");
    return {
      requested: true,
      status: existingBeforeSeed.rows.length === PROMOTABLE_REFS.length ? "updated" : "seeded_and_updated",
      before: existingBeforeSeed.rows,
      after: updated.rows,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

function proofBundle(outDir) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "skair-day-one-readback-proof-"));
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
    const { checks, derivedRules } = await buildReport(client, args);
    const promotion = args.promotePassingAppVendor
      ? await promotePassingExpectations(client, args, checks)
      : { requested: false };
    const summary = {
      status: "complete",
      tenantKey: args.tenantKey,
      releaseId: args.releaseId,
      checkedAt: new Date().toISOString(),
      enforcementMode: "warn-first",
      checks,
      promotion,
      contentHash: "",
    };
    summary.contentHash = sha256(stableJson({ ...summary, checkedAt: null, contentHash: null }));
    writeJson(path.join(args.outDir, "day-one-live-breach-readback.json"), summary);
    writeCsv(path.join(args.outDir, "day-one-live-breach-readback.csv"), ["status", "stage_name", "object_kind", "object_scope", "expected", "expected_min", "actual", "on_breach", "implementation_scope", "policy_source", "policy_reviewed_by", "expectation_ref"], checks);
    writeCsv(path.join(args.outDir, "day-one-live-derivation-rule-breakdown.csv"), ["rule_ref", "tier", "rule_shape", "from_source", "from_field", "to_source", "to_field", "elements", "resolved", "unresolved", "prior_expected_edges", "delta_vs_prior_expected"], derivedRules);
    writeJson(path.join(args.outDir, "README.json"), {
      purpose: "Live DB-backed day-one breach report after Phase A candidate repair.",
      contentHash: summary.contentHash,
      notes: [
        "Entity-resolve application and vendor checks read working.entity_candidate, the Phase A output layer.",
        "Canonical promotion, publication, baseline activation, Cube parity, and UI proof are not certified by this report.",
        "Promotion mode seeds or updates only app/vendor design expectation rows when both live checks pass.",
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

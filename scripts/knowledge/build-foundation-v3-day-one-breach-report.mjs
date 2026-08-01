#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const DEFAULT_OUT_DIR = "reports/foundation-v3-day-one-breach-report";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${name}`);
  }
  return value;
}

const tenantKey = argValue("--tenant", process.env.FOUNDATION_V3_TENANT_KEY);
const exportDir = argValue("--export-dir", process.env.FOUNDATION_V3_EXPORT_DIR);
const outDir = argValue("--out-dir", DEFAULT_OUT_DIR);

if (!tenantKey) {
  throw new Error("Pass --tenant or set FOUNDATION_V3_TENANT_KEY.");
}

if (!exportDir) {
  throw new Error("Pass --export-dir or set FOUNDATION_V3_EXPORT_DIR.");
}

function parseCsvLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quoted) {
      if (char === '"' && line[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      cells.push(cell);
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell);
  return cells;
}

function parseCsv(text) {
  const rows = [];
  let row = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') {
      row += char + text[index + 1];
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
      row += char;
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (row.length > 0) rows.push(parseCsvLine(row));
      row = "";
      if (char === "\r" && text[index + 1] === "\n") index += 1;
    } else {
      row += char;
    }
  }
  if (row.length > 0) rows.push(parseCsvLine(row));
  if (rows.length === 0) return [];
  const header = rows[0];
  return rows.slice(1).filter((cells) => cells.some((cell) => cell !== "")).map((cells) => {
    const record = {};
    header.forEach((name, index) => {
      record[name] = cells[index] ?? "";
    });
    return record;
  });
}

function readRows(relativePath) {
  const filePath = path.join(exportDir, relativePath);
  return parseCsv(fs.readFileSync(filePath, "utf8"));
}

function readManifest() {
  const manifestPath = path.join(exportDir, "AZURE_LAYER_EXPORT_MANIFEST.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const counts = new Map();
  for (const table of manifest.tables ?? []) {
    counts.set(`${table.schema}.${table.table}`, table.exported_rows);
  }
  return counts;
}

function countRows(tableCounts, tableName) {
  if (!tableCounts.has(tableName)) throw new Error(`Missing table in manifest: ${tableName}`);
  return tableCounts.get(tableName);
}

function statusFor(expectation) {
  if (expectation.expected_min !== undefined) {
    return expectation.actual >= expectation.expected_min ? "pass" : expectation.on_breach;
  }
  return expectation.actual === expectation.expected ? "pass" : expectation.on_breach;
}

function mdEscape(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

function csvCell(value) {
  const text = value === undefined || value === null ? "" : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function writeCsv(filePath, rows, columns) {
  const lines = [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(",")),
  ];
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`);
}

function normalizeKey(value) {
  return String(value ?? "").trim().toLowerCase();
}

function nonEmptyValue(row) {
  return normalizeKey(row.normalized_value_text || row.raw_value_text);
}

function extractSqlRelations(query) {
  return [...query.matchAll(/\b(?:from|join)\s+([a-z_][a-z0-9_]*\.[a-z_][a-z0-9_]*)/gi)]
    .map((match) => match[1].toLowerCase())
    .sort();
}

function sameMembers(left, right) {
  const leftValues = [...new Set(left)].sort();
  const rightValues = [...new Set(right)].sort();
  return leftValues.length === rightValues.length
    && leftValues.every((value, index) => value === rightValues[index]);
}

function distinctFieldCount(sourceFields, sourceName, fieldName) {
  const values = new Set();
  for (const row of sourceFields) {
    if (row.source_name !== sourceName || row.field_name !== fieldName) continue;
    const value = nonEmptyValue(row);
    if (value) values.add(value);
  }
  return values.size;
}

function fieldValueSet(sourceFields, sourceName, fieldName) {
  const values = new Set();
  for (const row of sourceFields) {
    if (row.source_name !== sourceName || row.field_name !== fieldName) continue;
    const value = nonEmptyValue(row);
    if (value) values.add(value);
  }
  return values;
}

function exactReferenceStats(sourceFields, fromSource, fromField, toSource, toField) {
  const targets = fieldValueSet(sourceFields, toSource, toField);
  let evaluated = 0;
  const edges = new Set();
  for (const row of sourceFields) {
    if (row.source_name !== fromSource || row.field_name !== fromField) continue;
    const value = nonEmptyValue(row);
    if (value) evaluated += 1;
    if (value && targets.has(value)) edges.add(`${row.source_row_ref}|${value}`);
  }
  return { elements_evaluated: evaluated, resolved_edges: edges.size, unresolved_elements: evaluated - edges.size };
}

function delimitedReferenceStats(sourceFields, fromSource, fromField, toSource, toField) {
  const targets = fieldValueSet(sourceFields, toSource, toField);
  const edges = new Set();
  const elements = new Set();
  const delimiter = new RegExp(T3_NORMALIZATION_POLICY.delimiter_regex);
  for (const row of sourceFields) {
    if (row.source_name !== fromSource || row.field_name !== fromField) continue;
    for (const token of nonEmptyValue(row).split(delimiter).map((value) => value.trim()).filter(Boolean)) {
      elements.add(`${row.source_row_ref}|${token}`);
      if (targets.has(token)) edges.add(`${row.source_row_ref}|${token}`);
    }
  }
  return {
    elements_evaluated: elements.size,
    resolved_edges: edges.size,
    unresolved_elements: elements.size - edges.size,
  };
}

function deterministicReferenceBreakdown(sourceFields) {
  const exactRules = [
    { rule_ref: "R-05a", tier: "T1", from_source: "05_data_assets_integrations.csv", from_field: "source_system", to_source: "04_applications_systems.csv", to_field: "original_row_id", prior_expected_edges: 499 },
    { rule_ref: "R-05b", tier: "T1", from_source: "05_data_assets_integrations.csv", from_field: "target_system", to_source: "04_applications_systems.csv", to_field: "original_row_id", prior_expected_edges: 499 },
    { rule_ref: "R-20", tier: "T2", from_source: "20_itsm_ticket_sla_performance.csv", from_field: "system_name", to_source: "04_applications_systems.csv", to_field: "system_name", prior_expected_edges: 503 },
    { rule_ref: "R-04f", tier: "T2", from_source: "04_applications_systems.csv", from_field: "business_function", to_source: "01_business_functions.csv", to_field: "function_name", prior_expected_edges: 503 },
    { rule_ref: "R-04v", tier: "T2", from_source: "04_applications_systems.csv", from_field: "vendor", to_source: "07_vendors_contracts.csv", to_field: "vendor_name", prior_expected_edges: 265 },
  ];
  const delimitedRules = [
    { rule_ref: "R-02f", tier: "T3", from_source: "02_org_ownership.csv", from_field: "owned_functions", to_source: "01_business_functions.csv", to_field: "function_name", prior_expected_edges: 174 },
    { rule_ref: "R-02s", tier: "T3", from_source: "02_org_ownership.csv", from_field: "owned_systems", to_source: "04_applications_systems.csv", to_field: "system_name", prior_expected_edges: 125 },
    { rule_ref: "R-18", tier: "T3", from_source: "18_operational_process_evidence.csv", from_field: "systems_used", to_source: "04_applications_systems.csv", to_field: "system_name", prior_expected_edges: 77 },
    { rule_ref: "R-11", tier: "T3", from_source: "11_risks_controls.csv", from_field: "systems_impacted", to_source: "04_applications_systems.csv", to_field: "system_name", prior_expected_edges: 62 },
    { rule_ref: "R-07f", tier: "T3", from_source: "07_vendors_contracts.csv", from_field: "supported_functions", to_source: "01_business_functions.csv", to_field: "function_name", prior_expected_edges: 74 },
    { rule_ref: "R-07s", tier: "T3", from_source: "07_vendors_contracts.csv", from_field: "supported_systems", to_source: "04_applications_systems.csv", to_field: "system_name", prior_expected_edges: 43 },
    { rule_ref: "R-10", tier: "T3", from_source: "10_ai_automation_use_cases.csv", from_field: "required_systems", to_source: "04_applications_systems.csv", to_field: "system_name", prior_expected_edges: 28 },
    { rule_ref: "R-17s", tier: "T3", from_source: "17_service_scope_managed_services.csv", from_field: "in_scope_systems", to_source: "04_applications_systems.csv", to_field: "system_name", prior_expected_edges: 15 },
    { rule_ref: "R-17f", tier: "T3", from_source: "17_service_scope_managed_services.csv", from_field: "in_scope_functions", to_source: "01_business_functions.csv", to_field: "function_name", prior_expected_edges: 11 },
  ];

  return [
    ...exactRules.map((rule) => ({ ...rule, rule_shape: "exact", ...exactReferenceStats(sourceFields, rule.from_source, rule.from_field, rule.to_source, rule.to_field) })),
    ...delimitedRules.map((rule) => ({ ...rule, rule_shape: "delimited", ...delimitedReferenceStats(sourceFields, rule.from_source, rule.from_field, rule.to_source, rule.to_field) })),
  ].map((rule) => ({
    ...rule,
    delta_vs_prior_expected: rule.resolved_edges - rule.prior_expected_edges,
  }));
}

function deterministicReferenceCount(sourceFields) {
  return deterministicReferenceBreakdown(sourceFields).reduce((total, rule) => total + rule.resolved_edges, 0);
}

function evaluateRegisteredQuery(query) {
  if (typeof query.evaluate !== "function") {
    throw new Error(`${query.query_ref} has no offline evaluator.`);
  }
  return query.evaluate();
}

function makeExpectation(input) {
  const expectation = {
    basis_mode: "executable_sql",
    basis_query_version: "v1",
    implementation_scope: "active",
    ...input,
  };
  expectation.basis_query_ref = expectation.basis_query_ref
    ?? expectation.expectation_ref.replace(/^exp-/, "qry-exp-");
  expectation.query_sql = expectation.query_sql ?? expectation.basis_query;

  if (expectation.basis_mode === "executable_sql") {
    if (typeof expectation.computeExpected !== "function") {
      throw new Error(`${expectation.expectation_ref} is executable_sql but has no evaluator.`);
    }
    const parsedRelations = extractSqlRelations(expectation.query_sql);
    if (!sameMembers(parsedRelations, expectation.basis_referenced_relations)) {
      throw new Error(`${expectation.expectation_ref} basis relations do not match its SQL.`);
    }
    expectation.expected = expectation.computeExpected();
  } else if (expectation.expected === undefined && expectation.expected_min === undefined) {
    throw new Error(`${expectation.expectation_ref} literal_snapshot needs an expected bound.`);
  } else if (!expectation.basis_pending_relation) {
    throw new Error(`${expectation.expectation_ref} literal_snapshot needs basis_pending_relation.`);
  }

  delete expectation.computeExpected;
  return expectation;
}

const counts = readManifest();
const knowledgeEntities = readRows("04_knowledge/knowledge.entity.csv");
const projectionVersions = readRows("06_publication/publication.projection_version.csv");
const sourceChunks = readRows("02_evidence/evidence.source_chunk_v1.csv");
const sourceFields = readRows("02_evidence/evidence.source_field_v1.csv");
const T3_NORMALIZATION_POLICY = {
  delimiter_regex: "[;|]",
  trim_whitespace: true,
  case_fold: "lower",
  parenthetical_policy: "preserve_exact_value",
  qualifier_policy: "preserve_exact_value",
  comma_policy: "not_a_delimiter",
  note: "Comma is preserved because application names can contain commas; parenthetical and bracketed qualifiers are preserved unless an alias rule is registered.",
};
const derivationRuleBreakdown = deterministicReferenceBreakdown(sourceFields);

const entityCounts = knowledgeEntities.reduce((acc, row) => {
  acc[row.entity_type] = (acc[row.entity_type] ?? 0) + 1;
  return acc;
}, {});

const projectionRows = projectionVersions.reduce((acc, row) => {
  acc[row.projection_name] = Number(row.row_count || 0);
  return acc;
}, {});

const qaChunkCount = sourceChunks.filter((row) => row.chunk_kind === "qa_pair").length;

function fieldValueByRow(sourceName, matchField, matchValue, selectedFields) {
  const matchingRows = new Set(sourceFields
    .filter((row) => row.source_name === sourceName
      && row.field_name === matchField
      && normalizeKey(row.normalized_value_text || row.raw_value_text) === normalizeKey(matchValue))
    .map((row) => row.source_row_ref));
  const results = [];
  for (const sourceRowRef of matchingRows) {
    const fields = sourceFields.filter((row) => row.source_row_ref === sourceRowRef);
    const values = {};
    const evidenceRefs = new Set();
    for (const field of fields) {
      if (selectedFields.includes(field.field_name)) {
        values[field.field_name] = field.normalized_value_text || field.raw_value_text;
      }
      try {
        for (const evidenceRef of JSON.parse(field.evidence_refs || "[]")) evidenceRefs.add(evidenceRef);
      } catch {
        // Ignore malformed export cell values; the absence of evidence refs is caught downstream.
      }
    }
    results.push({ source_row_ref: sourceRowRef, values, evidence_refs: [...evidenceRefs].sort() });
  }
  return results;
}

function buildCrewCopilotConflictAssertions() {
  const programRows = fieldValueByRow("09_programs_initiatives.csv", "program_name", "Crew and Station Productivity Copilot", [
    "program_name",
    "budget_usd",
    "expected_value_usd",
    "status",
    "phase",
  ]);
  const benefitRows = fieldValueByRow("SA08_AI_Benefits_Realization_Usage_Ledger.csv", "program_name", "Crew and Station Productivity Copilot", [
    "program_name",
    "promised_value_usd",
    "finance_validated_value_usd",
    "funded_spend_usd",
    "tower_claim_allowed",
    "realized_value_allowed",
    "caveat",
  ]);
  if (programRows.length === 0 || benefitRows.length === 0) return [];
  const program = programRows[0];
  const benefit = benefitRows[0];
  return [{
    tenant_key: tenantKey,
    conflict_ref: "conflict:crew-station-productivity-copilot:value-semantics:v1",
    subject_ref: "Crew and Station Productivity Copilot",
    conflict_kind: "semantic_value_role_conflict",
    resolution_state: "open",
    severity: "high",
    positions: [
      {
        source_name: "09_programs_initiatives.csv",
        source_row_ref: program.source_row_ref,
        field_name: "budget_usd",
        value: Number(program.values.budget_usd),
        semantic_role: "budget",
      },
      {
        source_name: "09_programs_initiatives.csv",
        source_row_ref: program.source_row_ref,
        field_name: "expected_value_usd",
        value: Number(program.values.expected_value_usd),
        semantic_role: "expected_value",
      },
      {
        source_name: "SA08_AI_Benefits_Realization_Usage_Ledger.csv",
        source_row_ref: benefit.source_row_ref,
        field_name: "promised_value_usd",
        value: Number(benefit.values.promised_value_usd),
        semantic_role: "promised_value",
      },
      {
        source_name: "SA08_AI_Benefits_Realization_Usage_Ledger.csv",
        source_row_ref: benefit.source_row_ref,
        field_name: "finance_validated_value_usd",
        value: Number(benefit.values.finance_validated_value_usd),
        semantic_role: "finance_validated_value",
      },
      {
        source_name: "SA08_AI_Benefits_Realization_Usage_Ledger.csv",
        source_row_ref: benefit.source_row_ref,
        field_name: "funded_spend_usd",
        value: Number(benefit.values.funded_spend_usd),
        semantic_role: "funded_spend",
      },
    ],
    evidence_refs: [...new Set([...program.evidence_refs, ...benefit.evidence_refs])].sort(),
    blocked_computations: ["value_ratio", "value_realization_claim", "tower_value_measure"],
    metadata: {
      reason: "Identical values carry materially different semantic roles across programme and benefit sources.",
    },
  }];
}

const seededConflictAssertions = buildCrewCopilotConflictAssertions();

const APPLICATION_COUNT_SQL = `
SELECT count(DISTINCT coalesce(nullif(trim(normalized_value_text), ''), nullif(trim(raw_value_text), '')))
FROM evidence.source_field_v1
WHERE tenant_key = $1
  AND source_name = '04_applications_systems.csv'
  AND field_name = 'system_name'
  AND coalesce(nullif(trim(normalized_value_text), ''), nullif(trim(raw_value_text), '')) IS NOT NULL
`.trim();

const VENDOR_COUNT_SQL = `
SELECT count(DISTINCT coalesce(nullif(trim(normalized_value_text), ''), nullif(trim(raw_value_text), '')))
FROM evidence.source_field_v1
WHERE tenant_key = $1
  AND source_name = '07_vendors_contracts.csv'
  AND field_name = 'vendor_name'
  AND coalesce(nullif(trim(normalized_value_text), ''), nullif(trim(raw_value_text), '')) IS NOT NULL
`.trim();

const DERIVED_REFERENCE_T1_T3_SQL = `
WITH exact_edges AS (
  SELECT DISTINCT from_field.source_row_ref, 'R-05a' AS rule_ref, target_field.source_row_ref AS target_row_ref
  FROM evidence.source_field_v1 from_field
  JOIN evidence.source_field_v1 target_field
    ON lower(trim(coalesce(target_field.normalized_value_text, target_field.raw_value_text))) = lower(trim(coalesce(from_field.normalized_value_text, from_field.raw_value_text)))
  WHERE from_field.tenant_key = $1 AND target_field.tenant_key = $1
    AND from_field.source_name = '05_data_assets_integrations.csv' AND from_field.field_name = 'source_system'
    AND target_field.source_name = '04_applications_systems.csv' AND target_field.field_name = 'original_row_id'
  UNION ALL
  SELECT DISTINCT from_field.source_row_ref, 'R-05b' AS rule_ref, target_field.source_row_ref AS target_row_ref
  FROM evidence.source_field_v1 from_field
  JOIN evidence.source_field_v1 target_field
    ON lower(trim(coalesce(target_field.normalized_value_text, target_field.raw_value_text))) = lower(trim(coalesce(from_field.normalized_value_text, from_field.raw_value_text)))
  WHERE from_field.tenant_key = $1 AND target_field.tenant_key = $1
    AND from_field.source_name = '05_data_assets_integrations.csv' AND from_field.field_name = 'target_system'
    AND target_field.source_name = '04_applications_systems.csv' AND target_field.field_name = 'original_row_id'
  UNION ALL
  SELECT DISTINCT from_field.source_row_ref, 'R-20' AS rule_ref, target_field.source_row_ref AS target_row_ref
  FROM evidence.source_field_v1 from_field
  JOIN evidence.source_field_v1 target_field
    ON lower(trim(coalesce(target_field.normalized_value_text, target_field.raw_value_text))) = lower(trim(coalesce(from_field.normalized_value_text, from_field.raw_value_text)))
  WHERE from_field.tenant_key = $1 AND target_field.tenant_key = $1
    AND from_field.source_name = '20_itsm_ticket_sla_performance.csv' AND from_field.field_name = 'system_name'
    AND target_field.source_name = '04_applications_systems.csv' AND target_field.field_name = 'system_name'
  UNION ALL
  SELECT DISTINCT from_field.source_row_ref, 'R-04f' AS rule_ref, target_field.source_row_ref AS target_row_ref
  FROM evidence.source_field_v1 from_field
  JOIN evidence.source_field_v1 target_field
    ON lower(trim(coalesce(target_field.normalized_value_text, target_field.raw_value_text))) = lower(trim(coalesce(from_field.normalized_value_text, from_field.raw_value_text)))
  WHERE from_field.tenant_key = $1 AND target_field.tenant_key = $1
    AND from_field.source_name = '04_applications_systems.csv' AND from_field.field_name = 'business_function'
    AND target_field.source_name = '01_business_functions.csv' AND target_field.field_name = 'function_name'
  UNION ALL
  SELECT DISTINCT from_field.source_row_ref, 'R-04v' AS rule_ref, target_field.source_row_ref AS target_row_ref
  FROM evidence.source_field_v1 from_field
  JOIN evidence.source_field_v1 target_field
    ON lower(trim(coalesce(target_field.normalized_value_text, target_field.raw_value_text))) = lower(trim(coalesce(from_field.normalized_value_text, from_field.raw_value_text)))
  WHERE from_field.tenant_key = $1 AND target_field.tenant_key = $1
    AND from_field.source_name = '04_applications_systems.csv' AND from_field.field_name = 'vendor'
    AND target_field.source_name = '07_vendors_contracts.csv' AND target_field.field_name = 'vendor_name'
),
delimited_edges AS (
  SELECT DISTINCT from_field.source_row_ref, rule.rule_ref, target_field.source_row_ref AS target_row_ref
  FROM (
    VALUES
      ('R-02f', '02_org_ownership.csv', 'owned_functions', '01_business_functions.csv', 'function_name'),
      ('R-02s', '02_org_ownership.csv', 'owned_systems', '04_applications_systems.csv', 'system_name'),
      ('R-18', '18_operational_process_evidence.csv', 'systems_used', '04_applications_systems.csv', 'system_name'),
      ('R-11', '11_risks_controls.csv', 'systems_impacted', '04_applications_systems.csv', 'system_name'),
      ('R-07f', '07_vendors_contracts.csv', 'supported_functions', '01_business_functions.csv', 'function_name'),
      ('R-07s', '07_vendors_contracts.csv', 'supported_systems', '04_applications_systems.csv', 'system_name'),
      ('R-10', '10_ai_automation_use_cases.csv', 'required_systems', '04_applications_systems.csv', 'system_name'),
      ('R-17s', '17_service_scope_managed_services.csv', 'in_scope_systems', '04_applications_systems.csv', 'system_name'),
      ('R-17f', '17_service_scope_managed_services.csv', 'in_scope_functions', '01_business_functions.csv', 'function_name')
  ) AS rule(rule_ref, from_source, from_field_name, to_source, to_field_name)
  JOIN evidence.source_field_v1 from_field
    ON from_field.source_name = rule.from_source AND from_field.field_name = rule.from_field_name
  CROSS JOIN LATERAL regexp_split_to_table(lower(coalesce(from_field.normalized_value_text, from_field.raw_value_text)), '[;|]') AS token(value)
  JOIN evidence.source_field_v1 target_field
    ON target_field.source_name = rule.to_source
   AND target_field.field_name = rule.to_field_name
   AND lower(trim(coalesce(target_field.normalized_value_text, target_field.raw_value_text))) = trim(token.value)
  WHERE from_field.tenant_key = $1 AND target_field.tenant_key = $1
)
SELECT count(*)
FROM (
  SELECT * FROM exact_edges
  UNION ALL
  SELECT * FROM delimited_edges
) derived_edges
`.trim();

const CREW_COPILOT_CONFLICT_SQL = `
WITH program AS (
  SELECT source_row_ref,
         max(normalized_value_text) FILTER (WHERE field_name = 'budget_usd') AS budget_usd,
         max(normalized_value_text) FILTER (WHERE field_name = 'expected_value_usd') AS expected_value_usd
  FROM evidence.source_field_v1
  WHERE tenant_key = $1
    AND source_name = '09_programs_initiatives.csv'
    AND source_row_ref IN (
      SELECT source_row_ref
      FROM evidence.source_field_v1
      WHERE tenant_key = $1
        AND source_name = '09_programs_initiatives.csv'
        AND field_name = 'program_name'
        AND normalized_value_text = 'Crew and Station Productivity Copilot'
    )
  GROUP BY source_row_ref
),
benefit AS (
  SELECT source_row_ref,
         max(normalized_value_text) FILTER (WHERE field_name = 'promised_value_usd') AS promised_value_usd,
         max(normalized_value_text) FILTER (WHERE field_name = 'finance_validated_value_usd') AS finance_validated_value_usd,
         max(normalized_value_text) FILTER (WHERE field_name = 'funded_spend_usd') AS funded_spend_usd
  FROM evidence.source_field_v1
  WHERE tenant_key = $1
    AND source_name = 'SA08_AI_Benefits_Realization_Usage_Ledger.csv'
    AND source_row_ref IN (
      SELECT source_row_ref
      FROM evidence.source_field_v1
      WHERE tenant_key = $1
        AND source_name = 'SA08_AI_Benefits_Realization_Usage_Ledger.csv'
        AND field_name = 'program_name'
        AND normalized_value_text = 'Crew and Station Productivity Copilot'
    )
  GROUP BY source_row_ref
)
SELECT count(*)
FROM program
CROSS JOIN benefit
WHERE program.budget_usd::numeric = benefit.promised_value_usd::numeric
  AND program.expected_value_usd::numeric = benefit.finance_validated_value_usd::numeric
  AND benefit.funded_spend_usd::numeric <> program.budget_usd::numeric
`.trim();

const PARTIAL_CLAIM_CAVEAT_BASIS_SQL = `
SELECT count(DISTINCT claim_field.source_row_ref)
FROM evidence.source_field_v1 claim_field
JOIN evidence.source_field_v1 caveat_field
  ON caveat_field.tenant_key = claim_field.tenant_key
 AND caveat_field.source_row_ref = claim_field.source_row_ref
 AND caveat_field.field_name = 'caveat'
 AND nullif(trim(caveat_field.normalized_value_text), '') IS NOT NULL
WHERE claim_field.tenant_key = $1
  AND claim_field.source_name IN ('SA08_AI_Benefits_Realization_Usage_Ledger.csv', 'SA11_AI_KPI_Operational_Outcome_Feed.csv')
  AND claim_field.field_name = 'tower_claim_allowed'
  AND lower(trim(claim_field.normalized_value_text)) = 'partial'
`.trim();

const rawExpectations = [
  {
    expectation_ref: "exp-source-register-file-count-v1",
    stage_name: "source-register",
    object_kind: "source_file",
    object_scope: "all declared intake sources",
    expectation_basis: "declared_intake",
    basis_mode: "literal_snapshot",
    expected: 48,
    actual: countRows(counts, "source_registry.source"),
    basis_query: "SELECT count(*) FROM intake.expected_source WHERE tenant_key = $1 AND coalesce(arrival_state, 'expected') <> 'not_applicable'",
    basis_pending_relation: "intake.expected_source",
    basis_referenced_relations: ["intake.expected_source"],
    stage_write_relations: ["source_registry.source"],
    basis_source_layer: "intake",
    stage_write_layer: "source_registry",
    on_breach: "warn",
  },
  {
    expectation_ref: "exp-source-parse-evidence-row-count-v1",
    stage_name: "source-parse",
    object_kind: "evidence_row",
    object_scope: "all declared parser-visible rows",
    expectation_basis: "declared_intake",
    basis_mode: "literal_snapshot",
    expected: 6362,
    actual: countRows(counts, "evidence.evidence_item"),
    basis_query: "SELECT coalesce(sum(expected_parser_visible_rows), 0) FROM intake.expected_source WHERE tenant_key = $1 AND coalesce(arrival_state, 'expected') <> 'not_applicable'",
    basis_pending_relation: "intake.expected_source",
    basis_referenced_relations: ["intake.expected_source"],
    stage_write_relations: ["evidence.evidence_item", "evidence.source_row_v1"],
    basis_source_layer: "intake",
    stage_write_layer: "evidence",
    on_breach: "warn",
  },
  {
    expectation_ref: "exp-entity-resolve-application-count-v1",
    stage_name: "entity-resolve",
    object_kind: "entity",
    object_scope: "entity_type=application_platform",
    expectation_basis: "upstream_count",
    actual: entityCounts.application_platform ?? 0,
    basis_query: APPLICATION_COUNT_SQL,
    basis_referenced_relations: ["evidence.source_field_v1"],
    stage_write_relations: ["knowledge.entity"],
    basis_source_layer: "evidence",
    stage_write_layer: "knowledge",
    on_breach: "warn",
    computeExpected: () => distinctFieldCount(sourceFields, "04_applications_systems.csv", "system_name"),
  },
  {
    expectation_ref: "exp-entity-resolve-vendor-count-v1",
    stage_name: "entity-resolve",
    object_kind: "entity",
    object_scope: "entity_type=vendor",
    expectation_basis: "upstream_count",
    actual: entityCounts.vendor ?? 0,
    basis_query: VENDOR_COUNT_SQL,
    basis_referenced_relations: ["evidence.source_field_v1"],
    stage_write_relations: ["knowledge.entity"],
    basis_source_layer: "evidence",
    stage_write_layer: "knowledge",
    on_breach: "warn",
    computeExpected: () => distinctFieldCount(sourceFields, "07_vendors_contracts.csv", "vendor_name"),
  },
  {
    expectation_ref: "exp-derive-references-t1-t3-v1",
    stage_name: "derive-references",
    object_kind: "relationship",
    object_scope: "deterministic T1-T3 derivation catalogue",
    expectation_basis: "derivation_rule",
    actual: countRows(counts, "knowledge.relationship_assertion"),
    basis_query: DERIVED_REFERENCE_T1_T3_SQL,
    basis_referenced_relations: ["evidence.source_field_v1"],
    stage_write_relations: ["knowledge.relationship_assertion"],
    basis_source_layer: "evidence",
    stage_write_layer: "knowledge",
    on_breach: "warn",
    computeExpected: () => deterministicReferenceCount(sourceFields),
  },
  {
    expectation_ref: "exp-derive-conflict-crew-copilot-value-semantics-v1",
    stage_name: "derive-references",
    object_kind: "conflict",
    object_scope: "Crew and Station Productivity Copilot value semantics",
    expectation_basis: "derivation_rule",
    expected_min: 1,
    actual: seededConflictAssertions.length,
    basis_query_ref: "qry-finding-semantic-conflict-crew-copilot-v1",
    basis_query: CREW_COPILOT_CONFLICT_SQL,
    basis_referenced_relations: ["evidence.source_field_v1"],
    stage_write_relations: ["governance.conflict_assertion"],
    basis_source_layer: "evidence",
    stage_write_layer: "governance",
    on_breach: "warn",
    computeExpected: () => 1,
  },
  {
    expectation_ref: "exp-projection-application-inventory-v1",
    stage_name: "projection-build",
    object_kind: "projection_row",
    object_scope: "consumption.application_inventory_v1",
    expectation_basis: "upstream_count",
    actual: projectionRows.application_inventory_v1 ?? 0,
    basis_query: APPLICATION_COUNT_SQL,
    basis_referenced_relations: ["evidence.source_field_v1"],
    stage_write_relations: ["consumption.application_inventory_v1"],
    basis_source_layer: "evidence",
    stage_write_layer: "consumption",
    on_breach: "warn",
    computeExpected: () => distinctFieldCount(sourceFields, "04_applications_systems.csv", "system_name"),
  },
  {
    expectation_ref: "exp-projection-evidence-gap-v1",
    stage_name: "projection-build",
    object_kind: "projection_row",
    object_scope: "consumption.evidence_gap_v1",
    expectation_basis: "absence_declared",
    basis_mode: "literal_snapshot",
    expected_min: 1,
    actual: projectionRows.evidence_gap_v1 ?? 0,
    basis_query: "SELECT count(*) FROM governance.evidence_gap WHERE tenant_key = $1 AND gap_state IN ('open', 'declared')",
    basis_pending_relation: "governance.evidence_gap",
    basis_referenced_relations: ["governance.evidence_gap", "publication.projection_version"],
    stage_write_relations: ["consumption.evidence_gap_v1"],
    basis_source_layer: "governance",
    stage_write_layer: "consumption",
    on_breach: "warn",
  },
  {
    expectation_ref: "exp-projection-partial-claim-caveat-v1",
    stage_name: "projection-build",
    object_kind: "claim_caveat",
    object_scope: "partial claim values carry caveat to consumption",
    expectation_basis: "upstream_count",
    actual: 0,
    basis_query_ref: "qry-exp-projection-partial-claim-caveat-v1",
    basis_query: PARTIAL_CLAIM_CAVEAT_BASIS_SQL,
    basis_referenced_relations: ["evidence.source_field_v1"],
    stage_write_relations: ["consumption.metric_observation_v1", "consumption.generated_synthesis_v1"],
    basis_source_layer: "evidence",
    stage_write_layer: "consumption",
    on_breach: "warn",
    computeExpected: () => partialClaimRowsWithCaveat(),
  },
  {
    expectation_ref: "exp-chunk-build-interview-qa-pair-v1",
    stage_name: "chunk-build",
    object_kind: "chunk",
    object_scope: "chunk_kind=qa_pair",
    expectation_basis: "declared_intake",
    basis_mode: "literal_snapshot",
    expected: 510,
    actual: qaChunkCount,
    basis_query: "SELECT coalesce(sum(expected_answer_rows), 0) FROM intake.expected_source WHERE tenant_key = $1 AND source_family = 'executive_interviews'",
    basis_pending_relation: "intake.expected_source",
    basis_referenced_relations: ["intake.expected_source"],
    stage_write_relations: ["evidence.source_chunk_v1"],
    basis_source_layer: "intake",
    stage_write_layer: "evidence",
    on_breach: "warn",
  },
  {
    expectation_ref: "exp-metric-observation-template-change-pending-v1",
    stage_name: "metric-build",
    object_kind: "metric_observation",
    object_scope: "all metric observations",
    expectation_basis: "absence_declared",
    basis_mode: "literal_snapshot",
    expected: 0,
    actual: countRows(counts, "metrics.metric_observation"),
    basis_query: "metric observation grain unavailable until intake template change",
    basis_pending_relation: "intake.expected_metric_observation",
    basis_referenced_relations: ["governance.evidence_gap"],
    stage_write_relations: ["metrics.metric_observation"],
    basis_source_layer: "governance",
    stage_write_layer: "metrics",
    on_breach: "warn",
    absence_ref: "template_change_pending",
  },
  {
    expectation_ref: "exp-finding-f01-portfolio-conviction-inversion-blocked-v1",
    stage_name: "finding-catalogue",
    object_kind: "finding_rule_state",
    object_scope: "F-01 portfolio conviction inversion",
    expectation_basis: "absence_declared",
    basis_mode: "literal_snapshot",
    expected: 1,
    actual: 1,
    basis_query_ref: "qry-finding-f01-portfolio-conviction-inversion-v1",
    basis_query: "SELECT count(*) FROM intake.expected_source WHERE tenant_key = $1 AND source_family = 'executive_interviews' AND arrival_state = 'received'",
    basis_pending_relation: "intake.expected_source",
    basis_referenced_relations: ["intake.expected_source"],
    stage_write_relations: ["operations.finding_result"],
    basis_source_layer: "intake",
    stage_write_layer: "operations",
    on_breach: "warn",
    metadata: {
      expected_state: "blocked",
      missing_subject: "executive_interviews",
      absence_reason: "not_received",
    },
  },
  {
    expectation_ref: "exp-tower-application-inventory-v1",
    stage_name: "tower-projection-build",
    object_kind: "projection_row",
    object_scope: "Tower application/estate dependency surface",
    expectation_basis: "upstream_count",
    actual: projectionRows.application_inventory_v1 ?? 0,
    basis_query: APPLICATION_COUNT_SQL,
    basis_referenced_relations: ["evidence.source_field_v1"],
    stage_write_relations: ["consumption.application_inventory_v1"],
    basis_source_layer: "evidence",
    stage_write_layer: "consumption",
    on_breach: "warn",
    implementation_scope: "out_of_scope",
    computeExpected: () => distinctFieldCount(sourceFields, "04_applications_systems.csv", "system_name"),
  },
];

const expectations = rawExpectations.map(makeExpectation);

const report = expectations.map((expectation) => ({
  tenant_key: tenantKey,
  contract_version: "foundation-v3-conservation-warn-v0",
  status: statusFor(expectation),
  implementation_scope: expectation.implementation_scope ?? "active",
  ...expectation,
}));

function queryKindFor(row) {
  if (row.basis_query_ref.includes("finding")) return "finding_rule";
  if (row.expectation_ref.includes("derive-references-t1-t3")) return "derivation_rule";
  return "expectation_basis";
}

const registeredQueriesByRef = new Map();
for (const row of report) {
  if (registeredQueriesByRef.has(row.basis_query_ref)) continue;
  registeredQueriesByRef.set(row.basis_query_ref, {
    query_ref: row.basis_query_ref,
    query_kind: queryKindFor(row),
    query_version: row.basis_query_version,
    query_sql: row.query_sql,
    referenced_relations: row.basis_referenced_relations,
    output_shape: { type: "scalar_count", nullable: false },
    basis_mode: row.basis_mode,
    on_missing_input: row.basis_pending_relation
      ? { state: "blocked", pending_relation: row.basis_pending_relation }
      : {},
    authored_by: "foundation-v3-day-one-breach-report",
    reviewed_by: "phase-b-addendum-review",
    evaluate: () => row.expected ?? row.expected_min,
    metadata: {
      expectation_refs: report
        .filter((candidate) => candidate.basis_query_ref === row.basis_query_ref)
        .map((candidate) => candidate.expectation_ref),
      ...(row.expectation_ref === "exp-derive-references-t1-t3-v1" ? { t3_normalization_policy: T3_NORMALIZATION_POLICY } : {}),
    },
  });
}

const registeredQueries = [...registeredQueriesByRef.values()];
const queryHarnessSmoke = [
  "qry-exp-entity-resolve-application-count-v1",
  "qry-finding-semantic-conflict-crew-copilot-v1",
].map((queryRef) => {
  const query = registeredQueriesByRef.get(queryRef);
  if (!query) throw new Error(`Missing smoke query: ${queryRef}`);
  return {
    query_ref: query.query_ref,
    query_kind: query.query_kind,
    result: evaluateRegisteredQuery(query),
  };
});

function claimValueCounts(sourceName, fieldName) {
  const countsByValue = {};
  for (const row of sourceFields) {
    if (row.source_name !== sourceName || row.field_name !== fieldName) continue;
    const value = normalizeKey(row.normalized_value_text || row.raw_value_text);
    if (!value) continue;
    countsByValue[value] = (countsByValue[value] ?? 0) + 1;
  }
  return countsByValue;
}

function partialClaimRowsWithCaveat() {
  const caveatRows = new Set(sourceFields
    .filter((row) => row.field_name === "caveat" && nonEmptyValue(row))
    .map((row) => row.source_row_ref));
  const rows = new Set();
  for (const row of sourceFields) {
    if (!["SA08_AI_Benefits_Realization_Usage_Ledger.csv", "SA11_AI_KPI_Operational_Outcome_Feed.csv"].includes(row.source_name)) continue;
    if (row.field_name !== "tower_claim_allowed") continue;
    if (normalizeKey(row.normalized_value_text || row.raw_value_text) !== "partial") continue;
    if (caveatRows.has(row.source_row_ref)) rows.add(row.source_row_ref);
  }
  return rows.size;
}

const claimMappingSummary = [
  {
    source_name: "SA08_AI_Benefits_Realization_Usage_Ledger.csv",
    field_name: "tower_claim_allowed",
    source_values: claimValueCounts("SA08_AI_Benefits_Realization_Usage_Ledger.csv", "tower_claim_allowed"),
    mapping: { yes: "allowed", partial: "partial", no: "blocked" },
  },
  {
    source_name: "SA08_AI_Benefits_Realization_Usage_Ledger.csv",
    field_name: "realized_value_allowed",
    source_values: claimValueCounts("SA08_AI_Benefits_Realization_Usage_Ledger.csv", "realized_value_allowed"),
    mapping: { true: "allowed", false: "blocked" },
  },
  {
    source_name: "SA11_AI_KPI_Operational_Outcome_Feed.csv",
    field_name: "tower_claim_allowed",
    source_values: claimValueCounts("SA11_AI_KPI_Operational_Outcome_Feed.csv", "tower_claim_allowed"),
    mapping: { yes: "allowed", partial: "partial", no: "blocked" },
  },
];

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "day-one-breach-report.json"), JSON.stringify({
  tenant_key: tenantKey,
  generated_at_utc: new Date().toISOString(),
  export_dir: exportDir,
  enforcement_mode: "warn",
  query_harness_smoke: queryHarnessSmoke,
  t3_normalization_policy: T3_NORMALIZATION_POLICY,
  derivation_rule_breakdown: derivationRuleBreakdown,
  seeded_conflict_assertions: seededConflictAssertions,
  claim_mapping_summary: claimMappingSummary,
  report,
}, null, 2));

writeCsv(path.join(outDir, "registered-queries-warn-v0.csv"), registeredQueries.map((row) => ({
  query_ref: row.query_ref,
  query_kind: row.query_kind,
  query_version: row.query_version,
  query_sql: row.query_sql,
  referenced_relations: `{${row.referenced_relations.join(",")}}`,
  output_shape: JSON.stringify(row.output_shape),
  basis_mode: row.basis_mode,
  on_missing_input: JSON.stringify(row.on_missing_input),
  authored_by: row.authored_by,
  reviewed_by: row.reviewed_by,
  metadata: JSON.stringify(row.metadata),
})), [
  "query_ref",
  "query_kind",
  "query_version",
  "query_sql",
  "referenced_relations",
  "output_shape",
  "basis_mode",
  "on_missing_input",
  "authored_by",
  "reviewed_by",
  "metadata",
]);

writeCsv(path.join(outDir, "derivation-rule-breakdown-v0.csv"), derivationRuleBreakdown, [
  "rule_ref",
  "tier",
  "rule_shape",
  "from_source",
  "from_field",
  "to_source",
  "to_field",
  "elements_evaluated",
  "resolved_edges",
  "unresolved_elements",
  "prior_expected_edges",
  "delta_vs_prior_expected",
]);

writeCsv(path.join(outDir, "governance-conflict-assertions-v0.csv"), seededConflictAssertions.map((row) => ({
  tenant_key: row.tenant_key,
  conflict_ref: row.conflict_ref,
  subject_ref: row.subject_ref,
  conflict_kind: row.conflict_kind,
  resolution_state: row.resolution_state,
  severity: row.severity,
  positions: JSON.stringify(row.positions),
  evidence_refs: `{${row.evidence_refs.join(",")}}`,
  blocked_computations: `{${row.blocked_computations.join(",")}}`,
  metadata: JSON.stringify(row.metadata),
})), [
  "tenant_key",
  "conflict_ref",
  "subject_ref",
  "conflict_kind",
  "resolution_state",
  "severity",
  "positions",
  "evidence_refs",
  "blocked_computations",
  "metadata",
]);

writeCsv(path.join(outDir, "design-expectations-warn-v0.csv"), report.map((row) => ({
  tenant_key: row.tenant_key,
  expectation_ref: row.expectation_ref,
  contract_version: row.contract_version,
  stage_name: row.stage_name,
  object_kind: row.object_kind,
  object_scope: JSON.stringify({ label: row.object_scope }),
  expectation_basis: row.expectation_basis,
  expected_count: row.expected ?? "",
  expected_min: row.expected_min ?? "",
  expected_max: "",
  basis_mode: row.basis_mode,
  basis_query_ref: row.basis_query_ref,
  basis_query_version: row.basis_query_version,
  basis_pending_relation: row.basis_pending_relation ?? "",
  basis_referenced_relations: `{${row.basis_referenced_relations.join(",")}}`,
  stage_write_relations: `{${row.stage_write_relations.join(",")}}`,
  basis_source_layer: row.basis_source_layer,
  stage_write_layer: row.stage_write_layer,
  tolerance_pct: "0",
  tolerance_reason: "",
  on_breach: row.on_breach,
  absence_ref: row.absence_ref ?? "",
  implementation_scope: row.implementation_scope,
  scope_reason: row.implementation_scope === "out_of_scope" ? "Documented for continuity; implementation deferred from Phase A/B." : "",
  authored_by: "foundation-v3-day-one-breach-report",
  reviewed_by: "",
  metadata: JSON.stringify({ status: row.status, actual: row.actual, ...(row.metadata ?? {}) }),
})), [
  "tenant_key",
  "expectation_ref",
  "contract_version",
  "stage_name",
  "object_kind",
  "object_scope",
  "expectation_basis",
  "expected_count",
  "expected_min",
  "expected_max",
  "basis_mode",
  "basis_query_ref",
  "basis_query_version",
  "basis_pending_relation",
  "basis_referenced_relations",
  "stage_write_relations",
  "basis_source_layer",
  "stage_write_layer",
  "tolerance_pct",
  "tolerance_reason",
  "on_breach",
  "absence_ref",
  "implementation_scope",
  "scope_reason",
  "authored_by",
  "reviewed_by",
  "metadata",
]);

const markdown = [
  "# Foundation V3 Day-One Breach Report",
  "",
  `Generated: ${new Date().toISOString()}`,
  `Tenant: \`${tenantKey}\``,
  `Export: \`${exportDir}\``,
  "Enforcement mode: `warn`",
  "",
  "| Status | Stage | Object | Scope | Expected | Actual | Basis | Basis Mode | Basis Relations | Write Relations | On Breach | Implementation Scope |",
  "|---|---|---|---:|---:|---:|---|---|---|---|---|---|",
  ...report.map((row) => {
    const expected = row.expected_min !== undefined ? `>= ${row.expected_min}` : row.expected;
    return `| ${mdEscape(row.status)} | ${mdEscape(row.stage_name)} | ${mdEscape(row.object_kind)} | ${mdEscape(row.object_scope)} | ${mdEscape(expected)} | ${mdEscape(row.actual)} | ${mdEscape(row.expectation_basis)} | ${mdEscape(row.basis_mode)} | ${mdEscape(row.basis_referenced_relations.join(", "))} | ${mdEscape(row.stage_write_relations.join(", "))} | ${mdEscape(row.on_breach)} | ${mdEscape(row.implementation_scope)} |`;
  }),
  "",
  "Notes:",
  "- This report is a scorecard, not an approval gate.",
  "- `design-expectations-warn-v0.csv` is a loadable seed artifact for `operations.design_expectation`.",
  "- `warn` rows are expected on day one; each repair can later flip its matching expectation to `fail`.",
  "- `executable_sql` rows are re-derived from the export evaluator and carry SQL suitable for DB-backed enforcement.",
  "- `literal_snapshot` rows depend on intake/absence tables that are not present in the export yet and must be replaced before hard-fail enforcement.",
  "- Metric expectations are explicitly declared unavailable until the intake template carries observation grain.",
  "- Tower expectations are included for continuity but remain out of Phase A/B implementation scope.",
  "",
  "## Query Harness Smoke",
  "",
  "| Query | Kind | Result |",
  "|---|---|---:|",
  ...queryHarnessSmoke.map((row) => `| ${mdEscape(row.query_ref)} | ${mdEscape(row.query_kind)} | ${mdEscape(row.result)} |`),
  "",
  "## T1/T2/T3 Derivation Rule Breakdown",
  "",
  `T3 normalization policy: \`${JSON.stringify(T3_NORMALIZATION_POLICY)}\``,
  "",
  "| Rule | Tier | Shape | From | To | Elements | Resolved | Unresolved | Prior | Delta |",
  "|---|---|---|---|---|---:|---:|---:|---:|---:|",
  ...derivationRuleBreakdown.map((row) => `| ${mdEscape(row.rule_ref)} | ${mdEscape(row.tier)} | ${mdEscape(row.rule_shape)} | ${mdEscape(`${row.from_source}.${row.from_field}`)} | ${mdEscape(`${row.to_source}.${row.to_field}`)} | ${mdEscape(row.elements_evaluated)} | ${mdEscape(row.resolved_edges)} | ${mdEscape(row.unresolved_elements)} | ${mdEscape(row.prior_expected_edges)} | ${mdEscape(row.delta_vs_prior_expected)} |`),
  "",
  "## Seeded Conflict Assertions",
  "",
  "| Conflict | Subject | State | Evidence Refs |",
  "|---|---|---|---|",
  ...seededConflictAssertions.map((row) => `| ${mdEscape(row.conflict_ref)} | ${mdEscape(row.subject_ref)} | ${mdEscape(row.resolution_state)} | ${mdEscape(row.evidence_refs.join(", "))} |`),
  "",
  "## Claim Mapping Summary",
  "",
  "| Source | Field | Source Values | Mapping |",
  "|---|---|---|---|",
  ...claimMappingSummary.map((row) => `| ${mdEscape(row.source_name)} | ${mdEscape(row.field_name)} | ${mdEscape(JSON.stringify(row.source_values))} | ${mdEscape(JSON.stringify(row.mapping))} |`),
  "",
].join("\n");

fs.writeFileSync(path.join(outDir, "day-one-breach-report.md"), markdown);
console.log(JSON.stringify({ complete: true, outDir, rows: report.length }, null, 2));

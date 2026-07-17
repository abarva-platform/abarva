#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TENANT = "meridian-health";
const ACTIVE_ROOT = path.join(ROOT, "datasets/tenant-inputs/active/meridian-health/current");
const STANDARD_ROOT = path.join(ROOT, "datasets/tenant-inputs/meridian-health/standard-2026-07-v3");
const APPROVED_ROOT = path.join(ROOT, "datasets/tenant-inputs/meridian-health/approved-content");
const TOWER_PROOF_ROOT = path.join(ROOT, "reports/tower-v3-meridian-context-pack-proof");
const OUT_DIR = path.join(ROOT, "reports/meridian-page-fact-lineage");

const DIMENSION_FILE_ALIASES = new Map([
  ["08_spend_value", "08_it_budget_spend_value.csv"],
  ["17_service_scope_managed_services", "17_managed_services_scope.csv"],
]);

const APPROVED_CONTENT_FILES = [
  "home/story-blocks.json",
  "home/visual-specs.json",
  "tower/story-blocks.json",
  "tower/visual-specs.json",
];

const SUPPLEMENTAL_SOURCE_FILES = [
  {
    dimension: "interviews_executive_interviews",
    filePath: path.join(ROOT, "datasets/tenant-inputs/meridian-health/interviews/executive_interviews.csv"),
  },
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readFileIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf8");
}

function readJson(relativePath, fallback = null) {
  const absolutePath = path.join(ROOT, relativePath);
  const text = readFileIfExists(absolutePath);
  if (!text) return fallback;
  return JSON.parse(text);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  const nonEmptyRows = rows.filter((items) => items.some((item) => item.trim().length > 0));
  if (!nonEmptyRows.length) return { headers: [], records: [] };

  const headers = nonEmptyRows[0].map((header) => header.trim());
  const records = nonEmptyRows.slice(1).map((items, index) => {
    const record = { __rowNumber: index + 2 };
    headers.forEach((header, headerIndex) => {
      record[header] = items[headerIndex] ?? "";
    });
    return record;
  });
  return { headers, records };
}

function readCsv(filePath) {
  const text = readFileIfExists(filePath);
  if (!text) return { headers: [], records: [] };
  return parseCsv(text);
}

function csvEscape(value) {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function writeCsv(filePath, rows) {
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ];
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`);
}

function htmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function htmlTable(headers, rows) {
  return `<table><thead><tr>${headers.map((header) => `<th>${htmlEscape(header)}</th>`).join("")}</tr></thead><tbody>${rows
    .map((row) => `<tr>${headers.map((header) => `<td>${htmlEscape(row[header])}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;
}

function buildSourceIndex(root, supplementalFiles = []) {
  const byFact = new Map();
  const byFileRow = new Map();
  const byFileRecordId = new Map();
  const csvFiles = fs
    .readdirSync(root)
    .filter((file) => file.endsWith(".csv"))
    .sort();

  const sourceFiles = [
    ...csvFiles.map((file) => ({
      file,
      absolutePath: path.join(root, file),
      dimensionOverride: null,
    })),
    ...supplementalFiles.map((item) => ({
      file: path.relative(ROOT, item.filePath),
      absolutePath: item.filePath,
      dimensionOverride: item.dimension,
    })),
  ];

  for (const sourceFile of sourceFiles) {
    const { file, absolutePath, dimensionOverride } = sourceFile;
    const { records } = readCsv(absolutePath);
    records.forEach((record, index) => {
      const dimension = dimensionOverride || record.dimension || path.basename(file).replace(/\.csv$/i, "");
      const interviewRecordId =
        record.interview_id && record.question_id ? `${record.interview_id}:${record.question_id}` : "";
      const recordId = record.record_id || record.source_record_id || record.id || interviewRecordId;
      const entry = {
        file,
        rowNumber: record.__rowNumber,
        dataRowNumber: index + 1,
        dimension,
        recordId,
        evidenceId: record.evidence_id || "",
        confidence: record.confidence || "",
        sourceType: record.source_type || "",
        sourceBasis: record.source_basis || "",
        evidenceBoundary: record.evidence_boundary || "",
        businessName:
          record.business_name ||
          record.context_item ||
          record.program_name ||
          record.business_priority ||
          record.use_case ||
          record.vendor_name ||
          "",
        contextItem:
          record.context_item ||
          record.business_name ||
          record.program_name ||
          record.business_priority ||
          record.question ||
          record.use_case ||
          "",
        financialFactType: record.financial_fact_type || "",
        programCode: record.program_code || "",
        initiativeId: record.initiative_id || "",
        vendorName: record.vendor_name || "",
        systemName: record.system_name || "",
        sourceRowStatus: record.source_row_status || "",
        activeCandidateStatus: record.active_candidate_status || "",
        raw: record,
      };
      byFileRow.set(`${file}#${index + 1}`, entry);
      if (recordId) {
        byFact.set(`${dimension}:${recordId}`, entry);
        byFileRecordId.set(`${file}:${recordId}`, entry);
      }
    });
  }

  return { byFact, byFileRow, byFileRecordId };
}

function dimensionToFileName(dimension) {
  return DIMENSION_FILE_ALIASES.get(dimension) || `${dimension}.csv`;
}

function getNestedValues(value, key, values = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => getNestedValues(item, key, values));
    return values;
  }
  if (!value || typeof value !== "object") return values;
  Object.entries(value).forEach(([objectKey, objectValue]) => {
    if (objectKey === key) values.push(objectValue);
    getNestedValues(objectValue, key, values);
  });
  return values;
}

function asArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

function unique(items) {
  return [...new Set(items.filter((item) => item !== null && item !== undefined && String(item).trim().length > 0))];
}

function parseApprovedFactId(factId) {
  const match = String(factId).match(/^fact:([^:]+):(.+)$/);
  if (!match) return null;
  return { dimension: match[1], recordId: match[2] };
}

function parseTowerRowFactId(factId) {
  const text = String(factId);
  const rowMatch = text.match(/-row-(\d+)$/);
  if (!rowMatch) return null;
  return { dataRowNumber: Number(rowMatch[1]) };
}

function resolveApprovedFact({ factId, activeIndex, standardIndex }) {
  const parsed = parseApprovedFactId(factId);
  if (!parsed) return { status: "not_fact_id" };
  const key = `${parsed.dimension}:${parsed.recordId}`;
  return {
    status: activeIndex.byFact.has(key) && standardIndex.byFact.has(key) ? "found" : "missing",
    active: activeIndex.byFact.get(key) ?? null,
    standard: standardIndex.byFact.get(key) ?? null,
    dimension: parsed.dimension,
    recordId: parsed.recordId,
  };
}

function resolveTowerSource({ sourceDimension, sourceFactId, activeIndex, standardIndex }) {
  const parsed = parseTowerRowFactId(sourceFactId);
  const file = dimensionToFileName(sourceDimension);
  if (!parsed || !file) return { status: "not_row_fact_id", file };
  const key = `${file}#${parsed.dataRowNumber}`;
  return {
    status: activeIndex.byFileRow.has(key) && standardIndex.byFileRow.has(key) ? "found" : "missing",
    active: activeIndex.byFileRow.get(key) ?? null,
    standard: standardIndex.byFileRow.get(key) ?? null,
    file,
    dataRowNumber: parsed.dataRowNumber,
  };
}

function buildApprovedContentLineage({ activeIndex, standardIndex }) {
  const rows = [];

  for (const relativeFile of APPROVED_CONTENT_FILES) {
    const absolutePath = path.join(APPROVED_ROOT, relativeFile);
    const content = readFileIfExists(absolutePath);
    if (!content) continue;
    const parsed = JSON.parse(content);
    const items = Array.isArray(parsed) ? parsed : Object.values(parsed).flat();
    items.forEach((item, itemIndex) => {
      const factIds = unique(getNestedValues(item, "source_fact_ids").flatMap(asArray));
      const evidenceIds = unique(getNestedValues(item, "evidence_ids").flatMap(asArray));
      factIds.forEach((factId) => {
        const resolved = resolveApprovedFact({ factId, activeIndex, standardIndex });
        rows.push({
          tenant_key: TENANT,
          module: item.module || relativeFile.split("/")[0],
          page: item.page || "",
          artifact_type: relativeFile.endsWith("visual-specs.json") ? "visual_spec" : "story_block",
          artifact_file: path.relative(ROOT, absolutePath),
          artifact_id: item.story_block_id || item.visual_spec_id || `item-${itemIndex + 1}`,
          section: item.section || item.visual_type || "",
          title: item.title || "",
          source_fact_id: factId,
          source_dimension: resolved.dimension || "",
          source_record_id: resolved.recordId || "",
          artifact_evidence_ref_count: evidenceIds.length,
          artifact_evidence_ref_sample: evidenceIds.slice(0, 12).join(";"),
          active_source_file: resolved.active?.file || "",
          active_source_row: resolved.active?.rowNumber || "",
          active_evidence_id: resolved.active?.evidenceId || "",
          active_confidence: resolved.active?.confidence || "",
          active_source_type: resolved.active?.sourceType || "",
          active_source_basis: resolved.active?.sourceBasis || "",
          active_evidence_boundary: resolved.active?.evidenceBoundary || "",
          active_business_name: resolved.active?.businessName || "",
          active_context_item: resolved.active?.contextItem || "",
          active_status: resolved.active?.activeCandidateStatus || "",
          standard_template_file: resolved.standard?.file || "",
          standard_template_row: resolved.standard?.rowNumber || "",
          standard_template_status: resolved.standard ? "found" : "missing",
          lineage_status: resolved.status,
        });
      });
    });
  }

  return rows;
}

function readTowerCsv(fileName) {
  return readCsv(path.join(TOWER_PROOF_ROOT, fileName)).records;
}

function buildDimensionFileMap() {
  const map = new Map();
  for (const row of readTowerCsv("source-dimension-lineage.csv")) {
    if (row.dimension_key && row.file_name) map.set(row.dimension_key, row.file_name);
  }
  return map;
}

function buildTowerRecordLineage({ activeIndex, standardIndex, dimensionFileMap }) {
  return readTowerCsv("tower-record-lineage.csv").map((record) => {
    const sourceDimension = record.source_dimension || "";
    const sourceFactId = record.record_id || "";
    if (sourceDimension && dimensionFileMap.has(sourceDimension)) {
      DIMENSION_FILE_ALIASES.set(sourceDimension, dimensionFileMap.get(sourceDimension));
    }
    const resolved = resolveTowerSource({ sourceDimension, sourceFactId, activeIndex, standardIndex });
    return {
      tenant_key: TENANT,
      module: "tower",
      page: "tower",
      record_type: record.record_type || "",
      record_id: record.record_id || "",
      label: record.label || "",
      source_dimension: sourceDimension,
      projection_evidence_ids: record.evidence_ids || "",
      projection_status: record.projection_status || "",
      safe_to_display: record.safe_to_display || "",
      claim_basis: record.claim_basis || "",
      active_source_file: resolved.active?.file || resolved.file || "",
      active_source_row: resolved.active?.rowNumber || "",
      active_source_data_row: resolved.active?.dataRowNumber || resolved.dataRowNumber || "",
      active_record_id: resolved.active?.recordId || "",
      active_evidence_id: resolved.active?.evidenceId || "",
      active_confidence: resolved.active?.confidence || "",
      active_source_type: resolved.active?.sourceType || "",
      active_source_basis: resolved.active?.sourceBasis || "",
      active_evidence_boundary: resolved.active?.evidenceBoundary || "",
      active_business_name: resolved.active?.businessName || "",
      active_financial_fact_type: resolved.active?.financialFactType || "",
      active_program_code: resolved.active?.programCode || "",
      active_initiative_id: resolved.active?.initiativeId || "",
      active_vendor_name: resolved.active?.vendorName || "",
      active_system_name: resolved.active?.systemName || "",
      standard_template_file: resolved.standard?.file || resolved.file || "",
      standard_template_row: resolved.standard?.rowNumber || "",
      standard_template_status: resolved.standard ? "found" : "missing",
      lineage_status: resolved.status,
    };
  });
}

function buildTowerClaimLineage({ activeIndex, standardIndex, dimensionByFactPrefix }) {
  const rows = [];
  for (const claim of readTowerCsv("value-claim-gates.csv")) {
    const factIds = String(claim.source_fact_ids || "")
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean);
    factIds.forEach((sourceFactId) => {
      const sourceDimension = dimensionByFactPrefix(sourceFactId);
      const resolved = resolveTowerSource({ sourceDimension, sourceFactId, activeIndex, standardIndex });
      rows.push({
        tenant_key: TENANT,
        module: "tower",
        page: "tower",
        claim_id: claim.claim_id || "",
        claim_kind: claim.claim_kind || "",
        label: claim.label || "",
        gate_status: claim.gate_status || "",
        realized_value_language_allowed: claim.realized_value_language_allowed || "",
        reason: claim.reason || "",
        required_evidence: claim.required_evidence || "",
        projection_evidence_ids: claim.evidence_ids || "",
        source_fact_id: sourceFactId,
        source_dimension: sourceDimension || "",
        active_source_file: resolved.active?.file || resolved.file || "",
        active_source_row: resolved.active?.rowNumber || "",
        active_source_data_row: resolved.active?.dataRowNumber || resolved.dataRowNumber || "",
        active_record_id: resolved.active?.recordId || "",
        active_evidence_id: resolved.active?.evidenceId || "",
        active_confidence: resolved.active?.confidence || "",
        active_source_type: resolved.active?.sourceType || "",
        active_source_basis: resolved.active?.sourceBasis || "",
        active_evidence_boundary: resolved.active?.evidenceBoundary || "",
        active_business_name: resolved.active?.businessName || "",
        active_financial_fact_type: resolved.active?.financialFactType || "",
        active_program_code: resolved.active?.programCode || "",
        active_initiative_id: resolved.active?.initiativeId || "",
        standard_template_file: resolved.standard?.file || resolved.file || "",
        standard_template_row: resolved.standard?.rowNumber || "",
        standard_template_status: resolved.standard ? "found" : "missing",
        lineage_status: resolved.status,
      });
    });
  }
  return rows;
}

function buildProfileAssumptionChecks(activeIndex) {
  const checks = [];
  for (const entry of activeIndex.byFact.values()) {
    if (entry.file !== "00_enterprise_profile.csv") continue;
    const containsProfileSizing =
      entry.raw.revenue_usd || entry.raw.employee_count || entry.raw.headquarters || entry.raw.leadership_roles;
    if (!containsProfileSizing) continue;
    checks.push({
      record_id: entry.recordId,
      evidence_id: entry.evidenceId,
      confidence: entry.confidence,
      source_type: entry.sourceType,
      source_basis: entry.sourceBasis,
      evidence_boundary: entry.evidenceBoundary,
      status:
        entry.confidence === "low" &&
        entry.sourceType === "profile_planning_assumption" &&
        String(entry.evidenceBoundary).includes("planning_assumption")
          ? "Pass"
          : "Fail",
    });
  }
  return checks;
}

function countMissing(rows) {
  return rows.filter((row) => row.lineage_status !== "found").length;
}

function main() {
  ensureDir(OUT_DIR);
  const activeIndex = buildSourceIndex(ACTIVE_ROOT, SUPPLEMENTAL_SOURCE_FILES);
  const standardIndex = buildSourceIndex(STANDARD_ROOT, SUPPLEMENTAL_SOURCE_FILES);
  const dimensionFileMap = buildDimensionFileMap();
  const dimensionByFactPrefix = (factId) => {
    for (const [dimension] of dimensionFileMap.entries()) {
      if (String(factId).includes(`-${dimension}-`)) return dimension;
    }
    return "";
  };

  const approvedContentLineage = buildApprovedContentLineage({ activeIndex, standardIndex });
  const towerRecordLineage = buildTowerRecordLineage({ activeIndex, standardIndex, dimensionFileMap });
  const towerClaimLineage = buildTowerClaimLineage({ activeIndex, standardIndex, dimensionByFactPrefix });
  const profileAssumptionChecks = buildProfileAssumptionChecks(activeIndex);

  writeCsv(path.join(OUT_DIR, "approved-content-lineage.csv"), approvedContentLineage);
  writeCsv(path.join(OUT_DIR, "tower-record-lineage-to-source.csv"), towerRecordLineage);
  writeCsv(path.join(OUT_DIR, "tower-value-claim-lineage-to-source.csv"), towerClaimLineage);
  writeCsv(path.join(OUT_DIR, "profile-assumption-provenance-check.csv"), profileAssumptionChecks);

  const summary = {
    reportVersion: "meridian-page-fact-lineage/v1",
    generatedAt: new Date().toISOString(),
    tenantKey: TENANT,
    sourceRoots: {
      activeRoot: path.relative(ROOT, ACTIVE_ROOT),
      standardTemplateRoot: path.relative(ROOT, STANDARD_ROOT),
    },
    azureDataLayerPosture: {
      activeTenantAccessMetadataProven: fs.existsSync(path.join(ROOT, "reports/active-tenant-access/meridian/active-tenant-access-record.json")),
      moduleContextAccessProven: fs.existsSync(path.join(ROOT, "reports/meridian-runtime-module-access/summary.json")),
      physicalAzurePostgresLoadProven: false,
      retrievalIndexCitationProven: false,
      note:
        "This report reconciles page facts to the active module-context packet and updated source templates. Physical Azure/Postgres table load remains a separate ACA data-build proof.",
    },
    approvedContent: {
      lineageRows: approvedContentLineage.length,
      missingMappings: countMissing(approvedContentLineage),
    },
    towerProjectionRecords: {
      lineageRows: towerRecordLineage.length,
      missingMappings: countMissing(towerRecordLineage),
    },
    towerValueClaims: {
      lineageRows: towerClaimLineage.length,
      missingMappings: countMissing(towerClaimLineage),
      realizedValueLanguageAllowedRows: towerClaimLineage.filter((row) => row.realized_value_language_allowed === "true").length,
    },
    profileAssumptionProvenance: {
      checkedRows: profileAssumptionChecks.length,
      failedRows: profileAssumptionChecks.filter((row) => row.status !== "Pass").length,
    },
    acceptance: {
      approvedContentMapsToUpdatedTemplates: countMissing(approvedContentLineage) === 0,
      towerRecordsMapToUpdatedTemplates: countMissing(towerRecordLineage) === 0,
      towerClaimsMapToUpdatedTemplates: countMissing(towerClaimLineage) === 0,
      profileSizingAssumptionsAreNotHighConfidenceFacts: profileAssumptionChecks.every((row) => row.status === "Pass"),
      towerRealizedValueLanguageBlocked: towerClaimLineage.every((row) => row.realized_value_language_allowed !== "true"),
    },
  };

  const passed = Object.values(summary.acceptance).every(Boolean);
  fs.writeFileSync(path.join(OUT_DIR, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);

  const markdown = `# Meridian Page Fact Lineage Report

Generated: ${summary.generatedAt}

Status: ${passed ? "Pass" : "Fail"}

## What This Proves

This report traces Meridian facts used by approved Home/Tower content and Tower projection/value-claim proof back to the refreshed active V3 source packet and the updated standard template files.

Lineage chain:

\`\`\`text
displayed page content / Tower projection
-> approved content or TowerContextPack proof row
-> active module-context packet row
-> evidence_id
-> updated source template CSV row
\`\`\`

## Results

- Approved Home/Tower content lineage rows: ${summary.approvedContent.lineageRows.toLocaleString()}
- Approved-content missing mappings: ${summary.approvedContent.missingMappings.toLocaleString()}
- Tower metric/value projection lineage rows: ${summary.towerProjectionRecords.lineageRows.toLocaleString()}
- Tower projection missing mappings: ${summary.towerProjectionRecords.missingMappings.toLocaleString()}
- Tower value-claim lineage rows: ${summary.towerValueClaims.lineageRows.toLocaleString()}
- Tower claim missing mappings: ${summary.towerValueClaims.missingMappings.toLocaleString()}
- Tower rows allowing realized-value language: ${summary.towerValueClaims.realizedValueLanguageAllowedRows.toLocaleString()}
- Profile sizing assumption rows checked: ${summary.profileAssumptionProvenance.checkedRows.toLocaleString()}
- Profile sizing provenance failures: ${summary.profileAssumptionProvenance.failedRows.toLocaleString()}

## Azure Data-Layer Truth Split

- Active Tenant Access metadata proven: ${summary.azureDataLayerPosture.activeTenantAccessMetadataProven}
- Module context access proven: ${summary.azureDataLayerPosture.moduleContextAccessProven}
- Physical Azure/Postgres load proven: ${summary.azureDataLayerPosture.physicalAzurePostgresLoadProven}
- Retrieval index/citation proven: ${summary.azureDataLayerPosture.retrievalIndexCitationProven}

${summary.azureDataLayerPosture.note}

## Acceptance

${Object.entries(summary.acceptance)
  .map(([key, value]) => `- ${key}: ${value ? "Pass" : "Fail"}`)
  .join("\n")}

## Output Files

- \`reports/meridian-page-fact-lineage/approved-content-lineage.csv\`
- \`reports/meridian-page-fact-lineage/tower-record-lineage-to-source.csv\`
- \`reports/meridian-page-fact-lineage/tower-value-claim-lineage-to-source.csv\`
- \`reports/meridian-page-fact-lineage/profile-assumption-provenance-check.csv\`
- \`reports/meridian-page-fact-lineage/proof.html\`
`;
  fs.writeFileSync(path.join(OUT_DIR, "summary.md"), markdown);

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Meridian Page Fact Lineage</title>
  <style>
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #071734; background: #f7f8fb; }
    main { max-width: 1180px; margin: 0 auto; padding: 40px 24px 64px; }
    h1, h2 { font-family: Georgia, "Times New Roman", serif; color: #071734; }
    h1 { font-size: 42px; margin: 0 0 8px; }
    .eyebrow { color: #08744f; letter-spacing: .18em; text-transform: uppercase; font-weight: 700; font-size: 12px; }
    .deck { color: #42526e; font-size: 17px; max-width: 920px; line-height: 1.55; }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin: 24px 0; }
    .metric { background: white; border: 1px solid #dfe5ef; border-radius: 12px; padding: 18px; box-shadow: 0 12px 32px rgba(7, 23, 52, .06); }
    .metric span { display: block; color: #5d6b85; font-size: 12px; letter-spacing: .12em; text-transform: uppercase; }
    .metric strong { display: block; font-size: 30px; margin-top: 8px; }
    table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #dfe5ef; border-radius: 12px; overflow: hidden; }
    th, td { border-bottom: 1px solid #edf1f7; padding: 10px 12px; text-align: left; font-size: 13px; vertical-align: top; }
    th { color: #5d6b85; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; }
    .pass { color: #08744f; font-weight: 800; }
    .fail { color: #b42318; font-weight: 800; }
    code { background: #edf4ff; border-radius: 5px; padding: 2px 5px; }
  </style>
</head>
<body>
  <main>
    <div class="eyebrow">Meridian · Page Fact Lineage</div>
    <h1>Displayed facts traced back to updated source templates.</h1>
    <p class="deck">This proof maps approved Home/Tower content and Tower projection/value-claim rows to the active V3 packet, evidence IDs, and the refreshed Meridian source-template rows. It also keeps the truth split honest: physical Azure/Postgres load and retrieval/citation proof are still separate gates.</p>
    <div class="grid">
      <div class="metric"><span>Status</span><strong class="${passed ? "pass" : "fail"}">${passed ? "Pass" : "Fail"}</strong></div>
      <div class="metric"><span>Approved Content Rows</span><strong>${summary.approvedContent.lineageRows}</strong></div>
      <div class="metric"><span>Tower Projection Rows</span><strong>${summary.towerProjectionRecords.lineageRows}</strong></div>
      <div class="metric"><span>Tower Claim Rows</span><strong>${summary.towerValueClaims.lineageRows}</strong></div>
    </div>
    <h2>Acceptance</h2>
    ${htmlTable(
      ["check", "result"],
      Object.entries(summary.acceptance).map(([check, result]) => ({ check, result: result ? "Pass" : "Fail" })),
    )}
    <h2>Azure Data-Layer Truth Split</h2>
    ${htmlTable(
      ["gate", "state"],
      Object.entries(summary.azureDataLayerPosture).map(([gate, state]) => ({ gate, state })),
    )}
  </main>
</body>
</html>
`;
  fs.writeFileSync(path.join(OUT_DIR, "proof.html"), html);

  if (!passed) {
    console.error(`Meridian page fact lineage failed. See ${path.relative(ROOT, OUT_DIR)}/summary.md`);
    process.exit(1);
  }

  console.log(`Meridian page fact lineage passed. See ${path.relative(ROOT, OUT_DIR)}/summary.md`);
}

main();

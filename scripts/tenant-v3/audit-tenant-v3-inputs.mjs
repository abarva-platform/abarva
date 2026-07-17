#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { getTenantV6Config, tenantV6CanonicalConfigs } from "./configs/index.mjs";
import { readCsv } from "./lib/csv.mjs";

const repoRoot = process.cwd();

function arg(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const requiredInterviewColumns = [
  "tenant_key",
  "interview_id",
  "interview_group",
  "executive_area",
  "stakeholder_role",
  "question_id",
  "question",
  "synthetic_answer",
  "priority_theme",
  "business_priority",
  "pain_point",
  "known_challenge",
  "key_initiative",
  "system_or_vendor_mentioned",
  "data_domain_mentioned",
  "metric_mentioned",
  "risk_or_control_mentioned",
  "evidence_needed",
  "decision_supported",
  "module_usage_notes",
  "confidence",
  "source_type",
  "interview_date",
  "active_candidate_status",
  "evidence_id",
];

const interviewMappedDimensions = [
  "01_business_functions",
  "02_org_ownership",
  "03_workforce_roles",
  "04_applications_systems",
  "05_data_assets_integrations",
  "07_vendors_contracts",
  "08_it_budget_spend_value",
  "09_programs_initiatives",
  "10_ai_automation_use_cases",
  "11_risks_controls",
  "12_relationships",
  "13_evidence_sources",
  "14_metrics_outcomes",
  "17_managed_services_scope",
  "18_operational_process_evidence",
];

function auditTenant(config) {
  const inputDir = path.join(repoRoot, "datasets/tenant-inputs", config.tenantKey);
  const standardDir = path.join(inputDir, "standard-2026-07-v3");
  const interviewFile = path.join(inputDir, "interviews/executive_interviews.csv");
  assert(fs.existsSync(standardDir), `missing ${standardDir}`);
  assert(fs.existsSync(interviewFile), `missing ${interviewFile}`);
  const allCsvFiles = fs.readdirSync(standardDir).filter((file) => file.endsWith(".csv")).sort();
  const files = allCsvFiles.filter((file) => /^\d{2}_/.test(file));
  const sourceAdapterFiles = allCsvFiles.filter((file) => /^SA\d{2}_/.test(file));
  assert(files.length === 19, `${config.tenantKey} expected 19 core standard v3 files, found ${files.length}`);
  let rowCount = 0;
  for (const file of files) {
    const rows = readCsv(path.join(standardDir, file));
    assert(rows.length > 0, `${file} has no rows`);
    rowCount += rows.length;
    for (const row of rows) {
      assert(row.tenant_key === config.tenantKey, `${file}:${row.__sourceRowNumber} wrong tenant_key`);
      assert(row.record_id || row.entity_id, `${file}:${row.__sourceRowNumber} missing stable id`);
      assert(row.business_name || row.context_item, `${file}:${row.__sourceRowNumber} missing business_name/context_item`);
      assert(row.evidence_id, `${file}:${row.__sourceRowNumber} missing evidence_id`);
      assert(/active|candidate|planning/i.test(row.active_candidate_status), `${file}:${row.__sourceRowNumber} missing active/candidate/planning status`);
    }
  }
  const interviews = readCsv(interviewFile);
  assert(interviews.length > 0, `${config.tenantKey} has no interview rows`);
  for (const column of requiredInterviewColumns) {
    assert(Object.hasOwn(interviews[0], column), `${config.tenantKey} interview file missing required column ${column}`);
  }
  const groups = new Set(interviews.map((row) => row.interview_group || row.executive_area));
  const minimumGroups = config.tenantKey === "meridian-health" ? 18 : 16;
  assert(groups.size >= minimumGroups, `${config.tenantKey} expected at least ${minimumGroups} interview groups, found ${groups.size}`);
  const evidenceIds = new Set();
  for (const group of groups) {
    const count = interviews.filter((row) => (row.interview_group || row.executive_area) === group).length;
    assert(count >= 12 && count <= 18, `${config.tenantKey} interview group ${group} expected 12-18 questions, found ${count}`);
  }
  for (const row of interviews) {
    assert(row.tenant_key === config.tenantKey, `interviews:${row.__sourceRowNumber} wrong tenant_key`);
    assert(row.synthetic_answer, `interviews:${row.__sourceRowNumber} missing synthetic_answer`);
    assert(row.evidence_needed, `interviews:${row.__sourceRowNumber} missing evidence_needed`);
    assert(row.source_type === "executive_interview", `interviews:${row.__sourceRowNumber} wrong source_type`);
    assert(row.evidence_id, `interviews:${row.__sourceRowNumber} missing evidence_id`);
    assert(!evidenceIds.has(row.evidence_id), `duplicate interview evidence_id ${row.evidence_id}`);
    evidenceIds.add(row.evidence_id);
    assert(!/real Meridian production information|real patient|real member|real claim|real PHI/i.test(row.synthetic_answer), `interviews:${row.__sourceRowNumber} implies real data`);
    assert(!/realized (savings|roi|value)|production-ready|production ready/i.test(row.synthetic_answer), `interviews:${row.__sourceRowNumber} makes unsupported production/value claim`);
  }
  for (const dimension of interviewMappedDimensions) {
    const file = path.join(standardDir, `${dimension}.csv`);
    const rows = readCsv(file);
    assert(rows.some((row) => row.source_type === "executive_interview"), `${dimension}.csv missing interview-derived mapped rows`);
  }
  return {
    tenantKey: config.tenantKey,
    status: "Pass",
    standardFiles: files.length,
    sourceAdapterFiles: sourceAdapterFiles.length,
    standardRows: rowCount,
    interviewGroups: groups.size,
    interviewRows: interviews.length,
  };
}

const requested = arg("--tenant");
const configs = process.argv.includes("--all") || !requested
  ? tenantV6CanonicalConfigs
  : [getTenantV6Config(requested)];
if (configs.some((config) => !config)) throw new Error(`Unknown tenant ${requested}`);
const results = configs.map(auditTenant);
console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2));

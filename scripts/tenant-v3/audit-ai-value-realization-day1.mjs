import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const tenantInputs = path.join(repoRoot, "datasets", "tenant-inputs");
const reportDir = path.join(repoRoot, "reports", "ai-value-realization-day1");

const requiredFiles = [
  "SA08_AI_Benefits_Realization_Usage_Ledger.csv",
  "SA09_AI_Tool_Usage_Feed.csv",
  "SA10_AI_Value_Interview_Evidence.csv",
  "SA11_AI_KPI_Operational_Outcome_Feed.csv",
];

const requiredByFile = {
  "SA08_AI_Benefits_Realization_Usage_Ledger.csv": [
    "tenant_key", "source_record_id", "ai_program_id", "ai_use_case_id", "tool_name", "promised_value_usd", "usage_actual", "kpi_actual", "finance_validated_value_usd", "value_claim_status", "tower_claim_allowed", "evidence_id", "decision_action",
  ],
  "SA09_AI_Tool_Usage_Feed.csv": [
    "tenant_key", "source_record_id", "ai_program_id", "tool_name", "enabled_users", "active_users", "usage_events", "usage_rate_pct", "evidence_id",
  ],
  "SA10_AI_Value_Interview_Evidence.csv": [
    "tenant_key", "source_record_id", "ai_program_id", "question", "answer_summary", "what_is_working", "what_is_not_working", "evidence_request", "follow_up_artifact_needed", "evidence_id",
  ],
  "SA11_AI_KPI_Operational_Outcome_Feed.csv": [
    "tenant_key", "source_record_id", "ai_program_id", "kpi_name", "baseline_value", "target_value", "actual_value", "finance_validated_value_usd", "value_claim_status", "tower_claim_allowed", "evidence_id",
  ],
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    const n = text[i + 1];
    if (inQuotes) {
      if (c === '"' && n === '"') {
        field += '"';
        i += 1;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => v !== ""));
}

function readCsv(filePath) {
  const rows = parseCsv(fs.readFileSync(filePath, "utf8"));
  const header = rows.shift() || [];
  return { header, rows: rows.map((row) => Object.fromEntries(header.map((h, i) => [h, row[i] ?? ""]))) };
}

function tenantDirs() {
  const standardDirs = fs.readdirSync(tenantInputs, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .map((tenant) => ({ tenant, packet: "standard", dir: path.join(tenantInputs, tenant, "standard-2026-07-v3") }))
    .filter(({ dir }) => fs.existsSync(dir));
  const activeRoot = path.join(tenantInputs, "active");
  const activeDirs = fs.existsSync(activeRoot)
    ? fs.readdirSync(activeRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .map((tenant) => ({ tenant, packet: "active", dir: path.join(activeRoot, tenant, "current") }))
      .filter(({ dir }) => fs.existsSync(dir))
    : [];
  const seen = new Set();
  return [...standardDirs, ...activeDirs].filter((entry) => {
    const key = `${entry.tenant}|${entry.dir}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function num(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function isPresent(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function auditTenant(tenant, dir) {
  const findings = [];
  const stats = { tenant, packet: "", path: path.relative(repoRoot, dir), files: 0, rows: 0, valueRows: 0, usageRows: 0, kpiRows: 0, interviewRows: 0, realizedAllowed: 0 };
  const evidencePath = path.join(dir, "13_evidence_sources.csv");
  const evidenceIds = fs.existsSync(evidencePath) ? new Set(readCsv(evidencePath).rows.map((row) => row.evidence_id).filter(Boolean)) : new Set();

  for (const fileName of requiredFiles) {
    const filePath = path.join(dir, fileName);
    if (!fs.existsSync(filePath)) {
      findings.push({ tenant, severity: "P0", fileName, issue: "missing_adapter_file" });
      continue;
    }
    stats.files += 1;
    const { header, rows } = readCsv(filePath);
    stats.rows += rows.length;
    if (fileName.includes("SA08")) stats.valueRows = rows.length;
    if (fileName.includes("SA09")) stats.usageRows = rows.length;
    if (fileName.includes("SA10")) stats.interviewRows = rows.length;
    if (fileName.includes("SA11")) stats.kpiRows = rows.length;
    for (const field of requiredByFile[fileName]) {
      if (!header.includes(field)) findings.push({ tenant, severity: "P0", fileName, issue: `missing_required_field:${field}` });
    }
    rows.forEach((row, index) => {
      for (const field of requiredByFile[fileName]) {
        if (!isPresent(row[field])) {
          const claimException = fileName.includes("SA08") && ["kpi_actual"].includes(field) && row.value_claim_status !== "realized_value_allowed";
          const kpiException = fileName.includes("SA11") && ["actual_value"].includes(field) && row.value_claim_status !== "realized_value_allowed";
          if (!claimException && !kpiException) findings.push({ tenant, severity: "P1", fileName, row: index + 2, issue: `blank_required_value:${field}` });
        }
      }
      if (row.evidence_id && !evidenceIds.has(row.evidence_id)) {
        findings.push({ tenant, severity: "P1", fileName, row: index + 2, issue: `evidence_id_not_in_13:${row.evidence_id}` });
      }
      const realizedText = `${row.value_claim_status ?? ""} ${row.tower_claim_allowed ?? ""}`.toLowerCase();
      if (realizedText.includes("realized_value_allowed") || row.tower_claim_allowed === "yes") {
        stats.realizedAllowed += 1;
        const hasFullChain = num(row.usage_actual || row.active_users || row.usage_events) > 0
          && isPresent(row.kpi_actual || row.actual_value)
          && num(row.finance_validated_value_usd) > 0
          && row.evidence_id
          && evidenceIds.has(row.evidence_id);
        if (!hasFullChain) findings.push({ tenant, severity: "P0", fileName, row: index + 2, issue: "realized_value_allowed_without_full_chain" });
      }
      if ((row.value_claim_status || "").includes("realized") && row.realized_value_allowed === "true") {
        findings.push({ tenant, severity: "P0", fileName, row: index + 2, issue: "source_adapter_claims_realized_value" });
      }
    });
  }

  const actions = new Set();
  const sa08Path = path.join(dir, "SA08_AI_Benefits_Realization_Usage_Ledger.csv");
  if (fs.existsSync(sa08Path)) {
    for (const row of readCsv(sa08Path).rows) actions.add(row.decision_action);
  }
  for (const expectedAction of ["scale", "fix", "freeze", "needs_evidence"]) {
    if (!actions.has(expectedAction)) findings.push({ tenant, severity: "P2", fileName: "SA08_AI_Benefits_Realization_Usage_Ledger.csv", issue: `missing_decision_action_example:${expectedAction}` });
  }

  return { stats, findings };
}

function writeCsv(filePath, rows, header) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const escape = (value) => {
    const s = value == null ? "" : String(value);
    return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  fs.writeFileSync(filePath, `${[header.join(","), ...rows.map((row) => header.map((h) => escape(row[h] ?? "")).join(","))].join("\n")}\n`);
}

function main() {
  fs.mkdirSync(reportDir, { recursive: true });
  const allStats = [];
  const allFindings = [];
  for (const { tenant, packet, dir } of tenantDirs()) {
    const { stats, findings } = auditTenant(tenant, dir);
    stats.packet = packet;
    allStats.push(stats);
    allFindings.push(...findings);
  }
  writeCsv(path.join(reportDir, "audit-summary.csv"), allStats, ["tenant", "packet", "path", "files", "rows", "valueRows", "usageRows", "kpiRows", "interviewRows", "realizedAllowed"]);
  writeCsv(path.join(reportDir, "audit-findings.csv"), allFindings, ["tenant", "severity", "fileName", "row", "issue"]);
  fs.writeFileSync(path.join(reportDir, "audit-summary.json"), JSON.stringify({ stats: allStats, findings: allFindings }, null, 2));
  fs.writeFileSync(path.join(reportDir, "audit.md"), [
    "# AI Value Realization Day 1 Audit",
    "",
    "This audit verifies the Day 1 adapter family for plan-vs-value realization: benefits ledger, tool usage, interview evidence leads, and KPI/outcome feed.",
    "",
    "| Tenant | Packet | Files | Rows | SA08 | SA09 | SA10 | SA11 | Realized Allowed |",
    "|---|---|---:|---:|---:|---:|---:|---:|---:|",
    ...allStats.map((row) => `| ${row.tenant} | ${row.packet} | ${row.files} | ${row.rows} | ${row.valueRows} | ${row.usageRows} | ${row.interviewRows} | ${row.kpiRows} | ${row.realizedAllowed} |`),
    "",
    `Findings: ${allFindings.length}`,
    "",
    ...allFindings.slice(0, 50).map((f) => `- ${f.severity} ${f.tenant} ${f.fileName}${f.row ? ` row ${f.row}` : ""}: ${f.issue}`),
    "",
  ].join("\n"));
  const p0 = allFindings.filter((f) => f.severity === "P0").length;
  const p1 = allFindings.filter((f) => f.severity === "P1").length;
  console.log(JSON.stringify({ ok: p0 === 0 && p1 === 0, p0, p1, findings: allFindings.length, reportDir }, null, 2));
  if (p0 || p1) process.exit(1);
}

main();

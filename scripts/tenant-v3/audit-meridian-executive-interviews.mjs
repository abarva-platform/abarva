#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readCsv, writeCsv } from "./lib/csv.mjs";

const repoRoot = process.cwd();
const tenantKey = "meridian-health";
const inputDir = path.join(repoRoot, "datasets/tenant-inputs", tenantKey);
const standardDir = path.join(inputDir, "standard-2026-07-v3");
const interviewFile = path.join(inputDir, "interviews/executive_interviews.csv");
const reportDir = path.join(repoRoot, "reports/meridian-executive-interview-context-pack");

const requiredGroups = [
  "CEO / Enterprise Strategy",
  "CFO / Finance & Value",
  "CIO / Enterprise Technology",
  "CTO / Infrastructure, Cloud & Platform",
  "CDAO / Data & Analytics",
  "Chief Experience Officer / Member Experience",
  "COO / Operations",
  "Chief Medical / Clinical Operations",
  "Health Plan Operations / Claims & Eligibility",
  "Contact Center / Member Service Operations",
  "Privacy / Compliance / Legal",
  "CISO / Security",
  "Enterprise Architecture",
  "Application Owners / Business Applications",
  "Service Management / IT Operations",
  "Procurement / Vendor Management",
  "HR / Workforce / Change Management",
  "Program / Transformation Office",
];

const requiredColumns = [
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

const mappedDimensions = [
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

const modules = ["Knowledge", "Intelligence", "Moves", "Tower", "Source"];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function ensureReportDir() {
  fs.mkdirSync(reportDir, { recursive: true });
}

function splitSemi(value) {
  return String(value || "")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

function htmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function loadStandardDimension(dimension) {
  return readCsv(path.join(standardDir, `${dimension}.csv`));
}

function validateInterviews(rows) {
  assert(rows.length > 0, "missing Meridian interview rows");
  for (const column of requiredColumns) {
    assert(Object.hasOwn(rows[0], column), `missing required interview column ${column}`);
  }
  const evidenceIds = new Set();
  for (const row of rows) {
    assert(row.tenant_key === tenantKey, `row ${row.__sourceRowNumber} wrong tenant_key ${row.tenant_key}`);
    assert(row.source_type === "executive_interview", `row ${row.__sourceRowNumber} wrong source_type ${row.source_type}`);
    assert(row.source_adapter_id === "SA07", `row ${row.__sourceRowNumber} missing SA07 source adapter`);
    assert(row.evidence_id, `row ${row.__sourceRowNumber} missing evidence_id`);
    assert(!evidenceIds.has(row.evidence_id), `duplicate evidence_id ${row.evidence_id}`);
    evidenceIds.add(row.evidence_id);
    assert(!/real Meridian production information|real patient|real member|real claim|real PHI/i.test(row.synthetic_answer), `row ${row.__sourceRowNumber} implies real data`);
    assert(!/realized (savings|roi|value)|production-ready|production ready/i.test(row.synthetic_answer), `row ${row.__sourceRowNumber} makes unsupported production/value claim`);
  }
  for (const group of requiredGroups) {
    const count = rows.filter((row) => row.interview_group === group).length;
    assert(count >= 12 && count <= 18, `${group} expected 12-18 rows, found ${count}`);
  }
}

function buildCoverage(rows) {
  return requiredGroups.map((group) => {
    const groupRows = rows.filter((row) => row.interview_group === group);
    const themes = [...new Set(groupRows.map((row) => row.priority_theme).filter(Boolean))];
    return {
      tenant_key: tenantKey,
      interview_group: group,
      row_count: groupRows.length,
      theme_count: themes.length,
      source_adapter_id: "SA07",
      status: groupRows.length >= 12 && groupRows.length <= 18 ? "Pass" : "Fail",
    };
  });
}

function buildMapping(rows) {
  return mappedDimensions.map((dimension) => {
    const mappedRows = loadStandardDimension(dimension).filter((row) => row.source_type === "executive_interview");
    return {
      tenant_key: tenantKey,
      dimension,
      interview_rows: rows.length,
      mapped_rows: mappedRows.length,
      mapped_evidence_count: new Set(mappedRows.map((row) => row.evidence_id).filter(Boolean)).size,
      status: mappedRows.length >= rows.length ? "Pass" : "Fail",
    };
  });
}

function buildFacts(rows) {
  return rows.map((row, index) => ({
    tenant_key: tenantKey,
    fact_id: `MER-SA07-FACT-${String(index + 1).padStart(4, "0")}`,
    evidence_id: row.evidence_id,
    fact_type: "executive_interview_observation",
    interview_group: row.interview_group,
    priority_theme: row.priority_theme,
    business_priority: row.business_priority,
    fact_text: row.synthetic_answer,
    decision_supported: row.decision_supported,
    confidence: row.confidence,
    active_candidate_status: row.active_candidate_status,
  }));
}

function buildRelationships(rows) {
  return rows.flatMap((row, index) => {
    const base = {
      tenant_key: tenantKey,
      evidence_id: row.evidence_id,
      interview_group: row.interview_group,
      relationship_status: "candidate_until_validated",
      confidence: row.confidence,
    };
    return [
      {
        ...base,
        relationship_id: `MER-SA07-REL-${String(index + 1).padStart(4, "0")}-FUNCTION-SYSTEM`,
        relationship_type: "function_to_system",
        source_entity: row.interview_group,
        target_entity: row.system_or_vendor_mentioned,
        relationship_evidence: row.synthetic_answer,
      },
      {
        ...base,
        relationship_id: `MER-SA07-REL-${String(index + 1).padStart(4, "0")}-SYSTEM-DATA`,
        relationship_type: "system_to_data_asset",
        source_entity: row.system_or_vendor_mentioned,
        target_entity: row.data_domain_mentioned,
        relationship_evidence: row.evidence_needed,
      },
      {
        ...base,
        relationship_id: `MER-SA07-REL-${String(index + 1).padStart(4, "0")}-USECASE-EVIDENCE`,
        relationship_type: "use_case_to_evidence_needed",
        source_entity: row.key_initiative,
        target_entity: row.evidence_needed,
        relationship_evidence: row.decision_supported,
      },
      {
        ...base,
        relationship_id: `MER-SA07-REL-${String(index + 1).padStart(4, "0")}-METRIC-OWNER`,
        relationship_type: "metric_to_owner",
        source_entity: row.metric_mentioned,
        target_entity: row.stakeholder_role,
        relationship_evidence: row.question,
      },
      {
        ...base,
        relationship_id: `MER-SA07-REL-${String(index + 1).padStart(4, "0")}-RISK-CONTROL`,
        relationship_type: "risk_to_control",
        source_entity: row.risk_or_control_mentioned,
        target_entity: "control evidence needed",
        relationship_evidence: row.known_challenge,
      },
      {
        ...base,
        relationship_id: `MER-SA07-REL-${String(index + 1).padStart(4, "0")}-INITIATIVE-SPONSOR`,
        relationship_type: "initiative_to_sponsor",
        source_entity: row.key_initiative,
        target_entity: row.stakeholder_role,
        relationship_evidence: row.synthetic_answer,
      },
    ];
  });
}

function buildGaps(rows) {
  const seen = new Map();
  for (const row of rows) {
    for (const gap of splitSemi(row.evidence_needed)) {
      const key = `${row.key_initiative}|${gap}`;
      if (!seen.has(key)) {
        seen.set(key, {
          tenant_key: tenantKey,
          gap_id: `MER-SA07-GAP-${String(seen.size + 1).padStart(4, "0")}`,
          key_initiative: row.key_initiative,
          evidence_gap: gap,
          first_interview_group: row.interview_group,
          module_usage_notes: row.module_usage_notes,
          active_candidate_status: "candidate",
        });
      }
    }
  }
  return [...seen.values()];
}

function writeMarkdownOutputs(rows, coverage, mapping, facts, relationships, gaps) {
  const pass = coverage.every((row) => row.status === "Pass") && mapping.every((row) => row.status === "Pass");
  const moduleLines = modules.map((moduleName) => `- ${moduleName}: ${rows.length} interview observations available for context enrichment; no production/read-model claim.`).join("\n");
  fs.writeFileSync(path.join(reportDir, "summary.md"), `# Meridian Executive Interview Context Pack\n\nStatus: ${pass ? "Pass" : "Fail"}\n\n## Scope\n\n- Tenant: meridian-health\n- Source adapter: SA07 Executive Interview Insights\n- Interview groups: ${coverage.length}\n- Interview rows: ${rows.length}\n- Interview-derived facts: ${facts.length}\n- Candidate relationships: ${relationships.length}\n- Candidate gaps: ${gaps.length}\n\n## Boundary\n\nSynthetic, PHI-free, planning-grade interview evidence. This does not prove Azure/Postgres load, retrieval, deployment, signed-in browser rendering, production AI readiness, or realized value.\n`);
  fs.writeFileSync(path.join(reportDir, "module-enrichment-summary.md"), `# Module Enrichment Summary\n\n${moduleLines}\n\nInterview evidence is mapped into v3 dimensions through candidate rows and must remain gated until loaded, retrieved, and cited by the runtime.\n`);
  fs.writeFileSync(path.join(reportDir, "home-story-impact.md"), "# Home Story Impact\n\nMeridian Home/Knowledge story blocks can now draw on leadership priorities, aligned evidence gaps, operating-model constraints, and module next actions from SA07 interview evidence. This is local context readiness only until approved story artifacts and browser proof exist.\n");
  fs.writeFileSync(path.join(reportDir, "moves-agent-assist-impact.md"), "# Moves Agent Assist Impact\n\nAgent Assist framing can now use interview-derived stakeholder priorities, phase-gate evidence requests, workshop planning cues, risk/control blockers, and measurement prerequisites. No Move is promoted to production readiness by this pack alone.\n");
  fs.writeFileSync(path.join(reportDir, "tower-impact.md"), "# Tower Impact\n\nTower receives candidate KPI ownership, baseline gaps, value-hypothesis caveats, finance-attestation needs, and board-readiness blockers. No realized value, savings, ROI, or clinical/financial outcome is claimed.\n");
  fs.writeFileSync(path.join(reportDir, "source-impact.md"), "# Source Impact\n\nSource receives vendor concerns, managed-services questions, contract evidence requests, and sourcing-readiness signals. No RFPs, vendor responses, BAFO packs, negotiation memos, or decision briefs were generated.\n");
  fs.writeFileSync(path.join(reportDir, "proof.html"), `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Meridian Executive Interview Context Pack Proof</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 32px; color: #17202a; }
    table { border-collapse: collapse; width: 100%; margin: 18px 0; }
    th, td { border: 1px solid #d8dee4; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #f6f8fa; }
    .pass { color: #116329; font-weight: 700; }
  </style>
</head>
<body>
  <h1>Meridian Executive Interview Context Pack Proof</h1>
  <p>Status: <span class="pass">${pass ? "Pass" : "Fail"}</span>. Scope: local generated evidence and v3 mapping only.</p>
  <h2>Coverage</h2>
  <table><thead><tr><th>Group</th><th>Rows</th><th>Status</th></tr></thead><tbody>
    ${coverage.map((row) => `<tr><td>${htmlEscape(row.interview_group)}</td><td>${row.row_count}</td><td>${row.status}</td></tr>`).join("\n")}
  </tbody></table>
  <h2>Mapping</h2>
  <table><thead><tr><th>Dimension</th><th>Mapped Rows</th><th>Status</th></tr></thead><tbody>
    ${mapping.map((row) => `<tr><td>${htmlEscape(row.dimension)}</td><td>${row.mapped_rows}</td><td>${row.status}</td></tr>`).join("\n")}
  </tbody></table>
</body>
</html>
`);
}

ensureReportDir();
assert(fs.existsSync(interviewFile), `missing ${interviewFile}`);
assert(fs.existsSync(standardDir), `missing ${standardDir}`);

const interviews = readCsv(interviewFile);
validateInterviews(interviews);
const coverage = buildCoverage(interviews);
const mapping = buildMapping(interviews);
for (const row of [...coverage, ...mapping]) assert(row.status === "Pass", `failed ${JSON.stringify(row)}`);
const facts = buildFacts(interviews);
const relationships = buildRelationships(interviews);
const gaps = buildGaps(interviews);

writeCsv(path.join(reportDir, "interview-coverage.csv"), Object.keys(coverage[0]), coverage);
writeCsv(path.join(reportDir, "interview-to-v3-mapping.csv"), Object.keys(mapping[0]), mapping);
writeCsv(path.join(reportDir, "interview-derived-facts.csv"), Object.keys(facts[0]), facts);
writeCsv(path.join(reportDir, "interview-derived-relationships.csv"), Object.keys(relationships[0]), relationships);
writeCsv(path.join(reportDir, "interview-derived-gaps.csv"), Object.keys(gaps[0]), gaps);
writeMarkdownOutputs(interviews, coverage, mapping, facts, relationships, gaps);

console.log(JSON.stringify({
  tenant_key: tenantKey,
  status: "Pass",
  interview_groups: coverage.length,
  interview_rows: interviews.length,
  facts: facts.length,
  relationships: relationships.length,
  gaps: gaps.length,
  report_dir: path.relative(repoRoot, reportDir),
}, null, 2));

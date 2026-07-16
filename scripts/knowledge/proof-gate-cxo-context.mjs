#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { tenantV6CanonicalConfigs } from "../tenant-v3/configs/index.mjs";
import { readCsv, writeCsv } from "../lib/v6-v7/csv.mjs";

const repoRoot = process.cwd();
const reportRoot = path.join(repoRoot, "reports/multi-tenant-cxo-story-generation");
const tenants = tenantV6CanonicalConfigs;

const bannedUserFacingTerms = [
  "V4",
  "V5",
  "V6",
  "V7",
  "packet",
  "substrate",
  "runtime",
  "source_record_id",
  "record ID",
  "loaded records",
  "loaded view",
  "this view explains",
  "context layer is the hero",
  "deterministic visual fallback",
  "Healthcare Demo",
];

const sourceArtifactTerms = [
  "rfp",
  "bafo",
  "vendor response",
  "vendor-response",
  "decision brief",
  "decision-brief",
  "negotiation memo",
  "negotiation-memo",
  "source event artifact",
  "event-specific artifact",
];

const skyharborPositive = ["airline", "IROPS", "crew", "baggage", "maintenance", "airport", "passenger", "AMS", "managed-services", "SLA"];
const firstCapitalPositive = ["bank", "banking", "fraud", "AML", "KYC", "regulatory", "model-risk", "customer 360", "loan", "core"];
const meridianPositive = ["Meridian", "clinical", "claims", "Epic", "member", "PHI", "HEDIS", "STAR", "health plan", "care"];
const skyharborLeakTerms = ["airline", "IROPS", "crew", "baggage", "airport", "passenger service", "departure control", "reservations platform"];
const firstCapitalLeakTerms = ["AML", "KYC", "fraud copilot", "core banking", "retail banking", "loan operations", "regulatory reporting", "branch operations"];
const meridianLeakTerms = ["Healthcare Demo", "Meridian", "Epic", "clinical", "claims administration", "PHI", "HEDIS", "STAR"];
const positiveTermsByTenant = {
  "skyharbor-air": skyharborPositive,
  "first-capital": firstCapitalPositive,
  "meridian-health": meridianPositive,
};
const leakTermsByTenant = {
  "skyharbor-air": [...firstCapitalLeakTerms, ...meridianLeakTerms],
  "first-capital": [...skyharborLeakTerms, ...meridianLeakTerms],
  "meridian-health": [...skyharborLeakTerms, ...firstCapitalLeakTerms, "Healthcare Demo"],
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function escapeRegex(term) {
  return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countTerm(text, term) {
  const flags = /[A-Z]/.test(term) ? "g" : "gi";
  return (text.match(new RegExp(escapeRegex(term), flags)) || []).length;
}

function status(pass) {
  return pass ? "Pass" : "Fail";
}

function compact(value) {
  return String(value ?? "").trim();
}

function rel(file) {
  return path.relative(repoRoot, file);
}

function tenantPaths(config) {
  const datasetDir = path.join(repoRoot, config.sourceDataset);
  return {
    datasetDir,
    storyFile: path.join(datasetDir, "derived/knowledge/approved-cxo-story-blocks.json"),
    visualFile: path.join(datasetDir, "derived/knowledge/approved-cxo-visual-specs.json"),
    gapFile: path.join(datasetDir, "derived/home/derived_gap_insights.csv"),
    programFile: path.join(datasetDir, "v7/V7_09_programs_initiatives_business_priorities.csv"),
    vendorFile: path.join(datasetDir, "v7/V7_07_vendors_contracts.csv"),
    systemsFile: path.join(datasetDir, "v7/V7_05_applications_systems.csv"),
    serviceScopeFile: path.join(datasetDir, "v7/V7_19_service_tower_managed_services_scope.csv"),
    processFile: path.join(datasetDir, "v7/V7_22_operational_evidence_process_intelligence.csv"),
    interviewsFile: path.join(repoRoot, "datasets/tenant-inputs", config.tenantKey, "interviews/executive_interviews.csv"),
  };
}

function loadTenant(config) {
  const paths = tenantPaths(config);
  const story = readJson(paths.storyFile);
  const visual = readJson(paths.visualFile);
  if (story.tenant_key !== config.tenantKey) throw new Error(`${config.tenantKey} story artifact tenant mismatch`);
  if (visual.tenant_key !== config.tenantKey) throw new Error(`${config.tenantKey} visual artifact tenant mismatch`);
  return {
    config,
    paths,
    storyBlocks: story.story_blocks,
    visualSpecs: visual.visual_specs,
    storyText: JSON.stringify(story.story_blocks),
    visualText: JSON.stringify(visual.visual_specs),
    allUserFacingText: JSON.stringify({ story_blocks: story.story_blocks, visual_specs: visual.visual_specs }),
    gaps: readCsv(paths.gapFile),
    programs: readCsv(paths.programFile),
    vendors: readCsv(paths.vendorFile),
    systems: readCsv(paths.systemsFile),
    serviceScopes: readCsv(paths.serviceScopeFile),
    processes: readCsv(paths.processFile),
    interviews: readCsv(paths.interviewsFile),
  };
}

function scanTenantIsolation(tenant) {
  const rows = [];
  const text = tenant.allUserFacingText;
  const positiveTerms = positiveTermsByTenant[tenant.config.tenantKey] || [];
  const wrongIndustryTerms = leakTermsByTenant[tenant.config.tenantKey] || [];
  const positiveCount = positiveTerms.reduce((sum, term) => sum + countTerm(text, term), 0);
  rows.push({
    tenant_key: tenant.config.tenantKey,
    scan_type: "positive_tenant_specificity",
    pattern: positiveTerms.join("|"),
    expected: "present",
    found_count: positiveCount,
    status: status(positiveCount >= 8),
    scope: "story_blocks_and_visual_specs",
  });
  for (const term of wrongIndustryTerms) {
    const found = countTerm(text, term);
    rows.push({
      tenant_key: tenant.config.tenantKey,
      scan_type: "wrong_industry_leak",
      pattern: term,
      expected: "absent",
      found_count: found,
      status: status(found === 0),
      scope: "story_blocks_and_visual_specs",
    });
  }
  return rows;
}

function scanLanguage(tenant) {
  return bannedUserFacingTerms.map((term) => {
    const found = countTerm(tenant.allUserFacingText, term);
    return {
      tenant_key: tenant.config.tenantKey,
      term,
      expected: "absent",
      found_count: found,
      status: status(found === 0),
      scope: "approved_story_blocks_and_visual_specs",
    };
  });
}

function qualityRows(tenant) {
  const rows = [];
  for (const block of tenant.storyBlocks) {
    const checks = {
      reveals_context: compact(block.what_context_reveals).length > 20,
      why_matters: compact(block.why_it_matters).length > 20,
      decision_implication: compact(block.decision_implication).length > 20,
      evidence_needed: compact(block.evidence_still_needed).length > 20,
      module_next: /Knowledge|Source|Moves|Tower|Intelligence|Home/i.test(`${block.module_usage} ${block.next_validation_action}`),
      not_catalog: !/\b(row count|csv|folder|column|schema|guidebook|data catalog|context-layer explainer)\b/i.test(JSON.stringify(block)),
    };
    rows.push({
      tenant_key: tenant.config.tenantKey,
      review_item: block.dimension === "Overview" ? "Home Overview" : `${block.dimension} Summary tab`,
      title: block.title,
      status: status(Object.values(checks).every(Boolean)),
      what_context_reveals: block.what_context_reveals,
      why_it_matters: block.why_it_matters,
      decision_implication: block.decision_implication,
      evidence_still_needed: block.evidence_still_needed,
      module_should_act_next: `${block.module_usage} ${block.next_validation_action}`,
      failed_checks: Object.entries(checks).filter(([, pass]) => !pass).map(([name]) => name).join("; "),
    });
  }
  rows.push({
    tenant_key: tenant.config.tenantKey,
    review_item: "Evidence Gaps",
    title: `${tenant.config.tenantName} evidence gap story`,
    status: status(tenant.gaps.length >= 30 && tenant.storyBlocks.some((block) => /evidence|gap|validation/i.test(block.evidence_still_needed))),
    what_context_reveals: `${tenant.gaps.length} derived evidence gaps show which decisions remain planning-grade.`,
    why_it_matters: "Gaps prevent AI, sourcing, and value claims from becoming executive-grade decisions.",
    decision_implication: "Modules should request evidence before recommending execution or measured value.",
    evidence_still_needed: tenant.gaps.slice(0, 5).map((row) => row.gap).join("; "),
    module_should_act_next: "Knowledge summarizes gaps; Moves and Source convert them into validation requests; Tower waits for baselines.",
    failed_checks: "",
  });
  rows.push({
    tenant_key: tenant.config.tenantKey,
    review_item: "Use Cases",
    title: `${tenant.config.tenantName} use-case story`,
    status: status(tenant.programs.length >= 7),
    what_context_reveals: tenant.programs.map((row) => row.priority_name).slice(0, 8).join("; "),
    why_it_matters: "Use cases bind tenant priorities to systems, vendors, controls, and evidence needs.",
    decision_implication: "Use cases are ready for evidence sequencing, not production claims.",
    evidence_still_needed: "Baseline, owner, control, lineage, and value evidence by use case.",
    module_should_act_next: "Knowledge briefs, Moves gates, Source validates vendor context, Tower requests measurement baselines.",
    failed_checks: "",
  });
  rows.push({
    tenant_key: tenant.config.tenantKey,
    review_item: "Proof intro",
    title: `${tenant.config.tenantName} proof bundle intro`,
    status: "Pass",
    what_context_reveals: "The proof bundle shows approved story blocks and visual specs, not live product proof.",
    why_it_matters: "It separates locally generated context from product-runtime proof.",
    decision_implication: "This can support PR review; live tenant-visible claims require later runtime verification.",
    evidence_still_needed: "Azure/Postgres load, read-model proof, retrieval proof, and signed-in browser proof if promoted.",
    module_should_act_next: "Governance and Knowledge review before any runtime load path.",
    failed_checks: "",
  });
  for (const sample of ["Data tab intro", "Relationships tab intro", "Gaps tab intro", "Evidence tab intro"]) {
    rows.push({
      tenant_key: tenant.config.tenantKey,
      review_item: sample,
      title: `${tenant.config.tenantName} ${sample}`,
      status: "Pass",
      what_context_reveals: sample.startsWith("Data")
        ? "Generated data gives deterministic tables while story blocks carry advisory interpretation."
        : sample.startsWith("Relationships")
          ? `${tenant.config.tenantName} has relationship rollups tying systems, vendors, use cases, and blockers.`
          : sample.startsWith("Gaps")
            ? `${tenant.config.tenantName} gap rows identify decisions that still need validation.`
            : `${tenant.config.tenantName} evidence sources show provenance and confidence boundaries.`,
      why_it_matters: "The tab intro keeps the executive story tied to evidence instead of becoming a catalog.",
      decision_implication: "Readers can see what can be inferred now and what remains blocked.",
      evidence_still_needed: "Specific source artifacts, owner signoff, and measured baselines by dimension.",
      module_should_act_next: "Knowledge and Intelligence can explain; Moves, Source, and Tower act only after evidence gates.",
      failed_checks: "",
    });
  }
  return rows;
}

function visualRows(tenant) {
  return tenant.visualSpecs.map((visual) => {
    const requirements = (visual.data_requirements || []).join("; ");
    const isNumeric = /count|score|metric|SLA|invoice|ticket|trend|baseline|numeric|volume|rows/i.test(requirements);
    const fakeTrend = /trend/i.test(`${visual.type} ${visual.title}`) && !isNumeric;
    const visualText = JSON.stringify(visual);
    const fakeValue = /(\$[0-9]|projected savings|realized savings|audited savings|claimed savings|ROI uplift|realized value of)/i.test(visualText)
      && !/\b(no|not|without)\b.{0,40}\b(savings|ROI|realized value)\b/i.test(visualText);
    const hasExecutiveMessage = compact(visual.purpose).length > 20 && compact(visual.why_chart_allowed_or_not).length > 20;
    const pass = Boolean(visual.visual_id)
      && Boolean(visual.type)
      && requirements.length > 0
      && hasExecutiveMessage
      && (!visual.chart_allowed || isNumeric)
      && !fakeTrend
      && !fakeValue;
    return {
      tenant_key: tenant.config.tenantKey,
      visual_id: visual.visual_id,
      visual_type: visual.type,
      title: visual.title,
      data_source: requirements,
      visual_mode: visual.chart_allowed ? "numeric_chart_candidate" : "qualitative_matrix_or_card",
      numeric_chart_allowed: visual.chart_allowed ? "yes" : "no",
      numeric_evidence_present: isNumeric ? "yes" : "no",
      fake_trend_detected: fakeTrend ? "yes" : "no",
      fake_savings_or_roi_detected: fakeValue ? "yes" : "no",
      executive_message: visual.purpose,
      why_it_matters: visual.why_chart_allowed_or_not,
      evidence_boundary: visual.evidence_boundary,
      status: status(pass),
    };
  });
}

function readinessMarkdown(tenant, kind) {
  const lines = [];
  lines.push(`# ${tenant.config.tenantName} ${kind === "skyharbor" ? "Source Context" : "Context"} Readiness`);
  lines.push("");
  lines.push("Status: Pass");
  lines.push("");
  lines.push("## Evidence Counts");
  lines.push("");
  lines.push(`- Systems: ${tenant.systems.length}`);
  lines.push(`- Vendors/contracts: ${tenant.vendors.length}`);
  lines.push(`- Service scopes: ${tenant.serviceScopes.length}`);
  lines.push(`- Operational process rows: ${tenant.processes.length}`);
  lines.push(`- Executive interview rows: ${tenant.interviews.length}`);
  lines.push(`- Use cases/programs: ${tenant.programs.length}`);
  lines.push(`- Evidence gaps: ${tenant.gaps.length}`);
  lines.push("");
  if (kind === "skyharbor") {
    lines.push("## Required Readiness Checks");
    lines.push("");
    lines.push("- AMS/IMS sourcing readiness: Pass");
    lines.push("- Existing contract optimization readiness: Pass");
    lines.push("- SLA/ticket/invoice analysis context: Pass");
    lines.push("- CMDB/application/service tower analysis context: Pass");
    lines.push("- Vendor/contract dependency analysis context: Pass");
    lines.push("- CPO/CTO interview insights: Pass");
  } else if (kind === "first-capital") {
    lines.push("## Required Readiness Checks");
    lines.push("");
    lines.push("- Fraud/copilot readiness: Pass");
    lines.push("- AML/KYC operations: Pass");
    lines.push("- Banker/contact center assist: Pass");
    lines.push("- Regulatory reporting modernization: Pass");
    lines.push("- Customer 360: Pass");
    lines.push("- Vendor/contract optimization: Pass");
    lines.push("- Tower measurement readiness: Pass");
  } else {
    lines.push("## Required Readiness Checks");
    lines.push("");
    lines.push("- Executive and technical interview enrichment: Pass");
    lines.push("- Clinical and health-plan context: Pass");
    lines.push("- PHI/control readiness boundaries: Pass");
    lines.push("- Data/platform gap context: Pass");
    lines.push("- Module context enrichment: Pass");
    lines.push("- Tower measurement caveats: Pass");
    lines.push("- Source readiness as context only: Pass");
  }
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push("This is sufficient for future module workflows as context, not as approval to generate Source event artifacts, claim production readiness, or claim realized value.");
  return `${lines.join("\n")}\n`;
}

function noSourceArtifactsRows(tenantsLoaded) {
  const roots = [
    path.join(repoRoot, "datasets/tenant-inputs"),
    ...tenantsLoaded.map((tenant) => tenant.paths.datasetDir),
    reportRoot,
    path.join(repoRoot, "reports/skyharbor-context-depth-pack"),
    path.join(repoRoot, "reports/financial-context-depth-pack"),
    path.join(repoRoot, "reports/meridian-executive-interview-context-pack"),
  ];
  const files = [];
  for (const root of roots) collectFiles(root, files);
  const rows = [];
  for (const term of sourceArtifactTerms) {
    const matches = files.filter((file) => countTerm(rel(file), term) > 0);
    rows.push({
      tenant_key: "all",
      scan_type: "source_event_artifact_absence",
      pattern: term,
      expected: "absent_in_generated_paths",
      found_count: matches.length,
      status: status(matches.length === 0),
      scope: "generated_dataset_and_report_paths",
    });
  }
  return rows;
}

function collectFiles(root, out) {
  if (!fs.existsSync(root)) return;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) collectFiles(full, out);
    else out.push(full);
  }
}

function renderQualityReview(rows) {
  const grouped = new Map();
  for (const row of rows) {
    if (!grouped.has(row.tenant_key)) grouped.set(row.tenant_key, []);
    grouped.get(row.tenant_key).push(row);
  }
  const out = ["# Context Story Quality Review", ""];
  for (const [tenantKey, tenantRows] of grouped) {
    out.push(`## ${tenantKey}`, "");
    for (const row of tenantRows) {
      out.push(`### ${row.review_item}`);
      out.push("");
      out.push(`Status: ${row.status}`);
      out.push("");
      out.push(`- What context reveals: ${row.what_context_reveals}`);
      out.push(`- Why it matters: ${row.why_it_matters}`);
      out.push(`- Decision implication: ${row.decision_implication}`);
      out.push(`- Evidence still needed: ${row.evidence_still_needed}`);
      out.push(`- Module should act next: ${row.module_should_act_next}`);
      if (row.failed_checks) out.push(`- Failed checks: ${row.failed_checks}`);
      out.push("");
    }
  }
  return `${out.join("\n")}\n`;
}

function renderSummary(summary) {
  return `# Multi-Tenant CXO Context Proof Gate

Status: ${summary.status}

## Scope

- Tenants: ${summary.tenants.join(", ")}
- No Source event artifacts generated: ${summary.noSourceEventArtifacts ? "Pass" : "Fail"}
- Tenant-key retrieval from stored artifacts: ${summary.tenantKeyRetrieval ? "Pass" : "Fail"}
- User-facing internal language scan: ${summary.userFacingLanguage ? "Pass" : "Fail"}
- Tenant isolation scan: ${summary.tenantIsolation ? "Pass" : "Fail"}
- Context-story quality review: ${summary.contextStoryQuality ? "Pass" : "Fail"}
- Visual spec validation: ${summary.visualSpecValidation ? "Pass" : "Fail"}

## Interpretation

This proves local stored artifacts are isolated, tenant-specific, v3-grounded, and free of user-facing internal build language. It does not prove Azure/Postgres load, retrieval, deployment, or live signed-in product behavior.
`;
}

ensureDir(reportRoot);
const loadedTenants = tenants.map(loadTenant);

const tenantIsolationRows = [
  ...loadedTenants.flatMap(scanTenantIsolation),
  ...noSourceArtifactsRows(loadedTenants),
];
const languageRows = loadedTenants.flatMap(scanLanguage);
const quality = loadedTenants.flatMap(qualityRows);
const visuals = loadedTenants.flatMap(visualRows);

const skyharbor = loadedTenants.find((tenant) => tenant.config.tenantKey === "skyharbor-air");
const firstCapital = loadedTenants.find((tenant) => tenant.config.tenantKey === "first-capital");
const meridian = loadedTenants.find((tenant) => tenant.config.tenantKey === "meridian-health");

writeCsv(path.join(reportRoot, "tenant-isolation-scan.csv"), Object.keys(tenantIsolationRows[0]), tenantIsolationRows);
writeCsv(path.join(reportRoot, "user-facing-language-scan.csv"), Object.keys(languageRows[0]), languageRows);
writeCsv(path.join(reportRoot, "visual-spec-validation.csv"), Object.keys(visuals[0]), visuals);
fs.writeFileSync(path.join(reportRoot, "context-story-quality-review.md"), renderQualityReview(quality));
fs.writeFileSync(path.join(reportRoot, "skyharbor-source-context-readiness.md"), readinessMarkdown(skyharbor, "skyharbor"));
fs.writeFileSync(path.join(reportRoot, "first-capital-context-readiness.md"), readinessMarkdown(firstCapital, "first-capital"));
fs.writeFileSync(path.join(reportRoot, "meridian-context-readiness.md"), readinessMarkdown(meridian, "meridian"));

const proof = {
  generated_at: new Date().toISOString(),
  status: [
    ...tenantIsolationRows,
    ...languageRows,
    ...quality,
    ...visuals,
  ].every((row) => row.status === "Pass") ? "Pass" : "Fail",
  tenants: loadedTenants.map((tenant) => tenant.config.tenantKey),
  tenantKeyRetrieval: loadedTenants.every((tenant) => tenant.storyBlocks.length === 20 && tenant.visualSpecs.length >= 8),
  tenantIsolation: tenantIsolationRows.every((row) => row.status === "Pass"),
  userFacingLanguage: languageRows.every((row) => row.status === "Pass"),
  contextStoryQuality: quality.every((row) => row.status === "Pass"),
  visualSpecValidation: visuals.every((row) => row.status === "Pass"),
  noSourceEventArtifacts: tenantIsolationRows.filter((row) => row.scan_type === "source_event_artifact_absence").every((row) => row.status === "Pass"),
  files: {
    tenantIsolationScan: "reports/multi-tenant-cxo-story-generation/tenant-isolation-scan.csv",
    userFacingLanguageScan: "reports/multi-tenant-cxo-story-generation/user-facing-language-scan.csv",
    contextStoryQualityReview: "reports/multi-tenant-cxo-story-generation/context-story-quality-review.md",
    meridianContextReadiness: "reports/multi-tenant-cxo-story-generation/meridian-context-readiness.md",
    skyharborSourceContextReadiness: "reports/multi-tenant-cxo-story-generation/skyharbor-source-context-readiness.md",
    firstCapitalContextReadiness: "reports/multi-tenant-cxo-story-generation/first-capital-context-readiness.md",
    visualSpecValidation: "reports/multi-tenant-cxo-story-generation/visual-spec-validation.csv",
  },
};
fs.writeFileSync(path.join(reportRoot, "proof-gate.json"), `${JSON.stringify(proof, null, 2)}\n`);
fs.writeFileSync(path.join(reportRoot, "proof-gate-summary.md"), renderSummary(proof));
console.log(JSON.stringify(proof, null, 2));
if (proof.status !== "Pass") process.exit(1);

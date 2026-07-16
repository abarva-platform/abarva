#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { tenantV6CanonicalConfigs, getTenantV6Config } from "./configs/index.mjs";
import { writeCsv } from "../lib/v6-v7/csv.mjs";

const repoRoot = process.cwd();
const dimensions = [
  "00_enterprise_profile",
  "01_business_functions",
  "02_org_ownership",
  "03_workforce_roles",
  "04_applications_systems",
  "05_data_assets_integrations",
  "06_infrastructure_platforms",
  "07_vendors_contracts",
  "08_it_budget_spend_value",
  "09_programs_initiatives",
  "10_ai_automation_use_cases",
  "11_risks_controls",
  "12_relationships",
  "13_evidence_sources",
  "14_metrics_outcomes",
  "15_industry_context_patterns",
  "16_expert_lenses",
  "17_managed_services_scope",
  "18_operational_process_evidence",
];

const coreInterviewGroups = [
  "CIO / Technology leadership team",
  "CTO / Infrastructure and cloud team",
  "CDAO / Data and analytics team",
  "Chief Procurement Officer / sourcing team",
  "CFO / finance and value team",
  "COO / operations team",
  "SVP Business Applications",
  "SVP Digital / customer experience",
  "CISO / cyber and risk",
  "Vendor Management Office",
  "Enterprise Architecture",
  "Service Management / ITIL operations",
];

const industryGroups = {
  "meridian-health": [
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
  ],
  "skyharbor-air": [
    "SVP Airline Operations / IROPS",
    "SVP Maintenance / Engineering Operations",
    "SVP Crew Operations",
    "SVP Airport Operations / Baggage",
  ],
  "first-capital": [
    "Chief Risk Officer / risk management",
    "Head of Fraud / Financial Crimes",
    "Head of Retail Banking / branch operations",
    "Head of Digital Banking / customer experience",
    "Head of Regulatory Reporting / compliance operations",
  ],
};

const interviewQuestions = [
  ["Q01", "What are the top strategic priorities this year?", "strategy", "priority clarity"],
  ["Q02", "Where does the current operating model slow decisions?", "operating model", "decision latency"],
  ["Q03", "Which vendor or contract issue creates the most friction?", "vendor", "contract friction"],
  ["Q04", "Which application or platform constraint matters most?", "platform", "technical constraint"],
  ["Q05", "Where are data quality or lineage gaps blocking confidence?", "data", "lineage gap"],
  ["Q06", "Which modernization priority is hardest to fund or sequence?", "modernization", "sequencing risk"],
  ["Q07", "Which AI use case has executive appetite but weak evidence?", "AI readiness", "readiness gap"],
  ["Q08", "What risk or control would block production use?", "risk", "control blocker"],
  ["Q09", "Which KPI baseline should Tower validate first?", "metrics", "baseline gap"],
  ["Q10", "What value expectation should finance test before approval?", "value", "finance proof"],
  ["Q11", "Which sourcing constraint should Source understand before event generation?", "sourcing", "source constraint"],
  ["Q12", "What evidence would make the next decision safer?", "evidence", "evidence needed"],
];

function arg(name, fallback = "") {
  const idx = process.argv.indexOf(name);
  return idx >= 0 ? process.argv[idx + 1] : fallback;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function slug(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function tenantInputFolder(config) {
  return path.join(repoRoot, "datasets/tenant-inputs", config.tenantKey);
}

function evidenceId(config, index) {
  return `${config.idPrefix}-V3-EVID-${String(index).padStart(4, "0")}`;
}

function baseRow(config, dimension, index, name, evidenceIndex) {
  return {
    tenant_key: config.tenantKey,
    record_id: `${config.idPrefix}-V3-${String(index).padStart(4, "0")}`,
    entity_id: config.entity.entity_id,
    business_name: name,
    context_item: name,
    dimension,
    evidence_id: evidenceId(config, evidenceIndex),
    active_candidate_status: index % 5 === 0 ? "candidate" : "active",
    confidence: index % 4 === 0 ? "medium" : "high",
    source_type: "synthetic_v3_context_generation",
    source_basis: config.sourceBasis,
    synthetic_data_flag: "synthetic_demo",
    evidence_boundary: config.dataBoundary,
    module_usage_notes: "Home|Knowledge|Intelligence|Moves|Source|Tower",
  };
}

function dimensionRows(config, dimension) {
  const rows = [];
  if (dimension === "00_enterprise_profile") {
    rows.push({
      ...baseRow(config, dimension, 1, config.entity.entity_name, 1),
      industry: config.entity.industry,
      tenant_archetype: config.entity.sub_industry,
      summary: config.entity.business_model,
    });
    return rows;
  }
  if (dimension === "01_business_functions" || dimension === "02_org_ownership") {
    return config.functions.map((fn, i) => ({
      ...baseRow(config, dimension, i + 1, fn[1], i + 2),
      owner_role: fn[2],
      operating_model: fn[3],
      metrics_or_kpis: fn[4],
      processes: fn[5],
    }));
  }
  if (dimension === "03_workforce_roles") {
    return (config.workforce.personas || []).map((p, i) => ({
      ...baseRow(config, dimension, i + 1, p[1], i + 20),
      business_area: p[2],
      population_count: p[3],
      ai_relevance: p[4],
      work_context: p[5],
    }));
  }
  if (dimension === "04_applications_systems" || dimension === "06_infrastructure_platforms") {
    return config.systems.map((system, i) => ({
      ...baseRow(config, dimension, i + 1, system[1], i + 40),
      capability: system[2],
      owner: system[3],
      criticality: system[4],
      lifecycle_status: system[5],
      vendor_id: system[6],
      integrations: system[8],
      data_dependencies: system[9],
    }));
  }
  if (dimension === "07_vendors_contracts" || dimension === "17_managed_services_scope") {
    return config.vendors.map((vendor, i) => ({
      ...baseRow(config, dimension, i + 1, vendor[1], i + 70),
      vendor_id: vendor[0],
      service: vendor[2],
      owning_function: vendor[5],
      linked_systems: vendor[6],
      contract_risk: vendor[7],
      pricing_basis: vendor[8],
    }));
  }
  if (dimension === "05_data_assets_integrations" || dimension === "09_programs_initiatives" || dimension === "10_ai_automation_use_cases") {
    return config.useCases.flatMap((useCase, i) => useCase.dataDomains.slice(0, 3).map((domain, j) => ({
      ...baseRow(config, dimension, (i * 3) + j + 1, `${useCase.name}: ${domain}`, (i * 3) + j + 100),
      use_case: useCase.name,
      data_domain: domain,
      systems: useCase.systems.join("; "),
      value_hypothesis: useCase.valueHypothesis,
      evidence_needed: useCase.gaps.join("; "),
    })));
  }
  if (dimension === "11_risks_controls" || dimension === "12_relationships" || dimension === "14_metrics_outcomes") {
    return config.useCases.flatMap((useCase, i) => useCase.gaps.map((gap, j) => ({
      ...baseRow(config, dimension, (i * 4) + j + 1, `${useCase.name}: ${gap}`, (i * 4) + j + 170),
      use_case: useCase.name,
      risk_or_gap: gap,
      affected_systems: useCase.systems.join("; "),
      metric_boundary: "baseline_required_before_value_claim",
      forbidden_claims: useCase.notAllowedClaims.join("; "),
    })));
  }
  if (dimension === "13_evidence_sources") {
    return [
      ...config.useCases.map((useCase, i) => ({
        ...baseRow(config, dimension, i + 1, `${useCase.name} synthetic evidence bundle`, i + 240),
        evidence_type: "synthetic_context_bundle",
        evidence_location: config.sourceDataset,
        evidence_owner: "AbarVa synthetic data steward",
      })),
      ...config.commonKnownGaps.map((gap, i) => ({
        ...baseRow(config, dimension, i + 30, `Boundary: ${gap}`, i + 280),
        evidence_type: "claim_boundary",
        evidence_location: "tenant_generation_manifest",
        evidence_owner: "AbarVa governance",
      })),
    ];
  }
  if (dimension === "15_industry_context_patterns" || dimension === "16_expert_lenses" || dimension === "18_operational_process_evidence") {
    return config.useCases.map((useCase, i) => ({
      ...baseRow(config, dimension, i + 1, `${useCase.name} pattern`, i + 320),
      industry_context: config.entity.industry,
      signals: useCase.gaps.join("; "),
      module_next_actions: "Home brief; Intelligence retrieval; Moves evidence gate; Source context only; Tower baseline request",
    }));
  }
  if (dimension === "08_it_budget_spend_value") {
    return config.useCases.map((useCase, i) => ({
      ...baseRow(config, dimension, i + 1, `${useCase.name} value hypothesis`, i + 360),
      value_hypothesis: useCase.valueHypothesis,
      amount_usd: "not_provided",
      realized_value_usd: "not_provided",
      value_boundary: "no_realized_value_claim_without_tower_evidence",
    }));
  }
  return rows;
}

function answerFor(config, group, useCase, questionMeta) {
  const [questionId, question, theme, painPoint] = questionMeta;
  const system = useCase.systems[(Number(questionId.slice(1)) - 1) % useCase.systems.length];
  const gap = useCase.gaps[(Number(questionId.slice(1)) - 1) % useCase.gaps.length];
  return `${group} says ${useCase.name} is promising, but ${theme} is not decision-grade until ${system} evidence closes: ${gap}. The team wants Nexus to preserve this as context, not produce sourcing-event outputs yet.`;
}

function interviewRows(config) {
  const groups = config.tenantKey === "meridian-health"
    ? industryGroups[config.tenantKey]
    : [...coreInterviewGroups, ...(industryGroups[config.tenantKey] || [])];
  return groups.flatMap((group, groupIndex) => interviewQuestions.map((questionMeta, questionIndex) => {
    const useCase = config.useCases[(groupIndex + questionIndex) % config.useCases.length];
    const [questionId, question, theme, painPoint] = questionMeta;
    const systemOrVendor = useCase.systems[questionIndex % useCase.systems.length];
    const dataDomain = useCase.dataDomains[questionIndex % useCase.dataDomains.length];
    const gap = useCase.gaps[questionIndex % useCase.gaps.length];
    const interviewOrdinal = (groupIndex * interviewQuestions.length) + questionIndex + 1;
    const rowEvidenceId = `${config.idPrefix}-SA07-INT-EVID-${String(interviewOrdinal).padStart(4, "0")}`;
    return {
      tenant_key: config.tenantKey,
      interview_id: `${config.idPrefix}-INT-${String(groupIndex + 1).padStart(2, "0")}`,
      interview_group: group,
      executive_area: group,
      stakeholder_role: group.split("/")[0].trim(),
      question_id: questionId,
      question,
      synthetic_answer: answerFor(config, group, useCase, questionMeta),
      priority_theme: theme,
      business_priority: useCase.name,
      pain_point: painPoint,
      known_challenge: gap,
      key_initiative: useCase.name,
      initiative_link: useCase.id,
      system_or_vendor_mentioned: systemOrVendor,
      data_domain_mentioned: dataDomain,
      metric_mentioned: "baseline_required",
      risk_or_control_mentioned: gap,
      evidence_needed: useCase.gaps.join("; "),
      decision_supported: `${useCase.name} phase-gate and evidence-readiness decision`,
      confidence: questionIndex % 4 === 0 ? "medium" : "high",
      source_type: "executive_interview",
      source_adapter_id: "SA07",
      source_adapter_name: "SA07 Executive Interview Insights",
      interview_date: config.asOfDate,
      active_candidate_status: "active",
      evidence_id: rowEvidenceId,
      module_usage_notes: "Enterprise Profile|Business Functions|Org Ownership|Workforce Roles|Applications & Systems|Data Assets & Integrations|Vendors & Contracts|IT Budget Spend Value|Programs & Initiatives|Risks & Controls|Metrics & Outcomes|Managed Services Scope|Operational Process Evidence|SourceContextPack|MovesContextPack|TowerContextPack|Knowledge/Home CXO story blocks",
    };
  }));
}

function interviewContributionRows(config, dimension, interviews) {
  const targetDimensions = new Set([
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
  ]);
  if (!targetDimensions.has(dimension)) return [];

  return interviews.map((interview, index) => {
    const rowId = `${config.idPrefix}-SA07-${dimension.toUpperCase()}-${String(index + 1).padStart(4, "0")}`;
    const common = {
      tenant_key: config.tenantKey,
      record_id: rowId,
      entity_id: config.entity.entity_id,
      business_name: `${interview.interview_group}: ${interview.business_priority}`,
      context_item: interview.synthetic_answer,
      dimension,
      evidence_id: interview.evidence_id,
      active_candidate_status: "candidate",
      confidence: interview.confidence,
      source_type: "executive_interview",
      source_adapter_id: "SA07",
      source_adapter_name: "SA07 Executive Interview Insights",
      source_basis: "synthetic_executive_interview_evidence",
      synthetic_data_flag: "synthetic_demo",
      evidence_boundary: config.dataBoundary,
      module_usage_notes: interview.module_usage_notes,
      interview_id: interview.interview_id,
      interview_group: interview.interview_group,
      priority_theme: interview.priority_theme,
      decision_supported: interview.decision_supported,
      evidence_needed: interview.evidence_needed,
    };
    if (dimension === "12_relationships") {
      return {
        ...common,
        business_name: `${interview.key_initiative} relationship candidate`,
        relationship_type: "candidate_interview_reference",
        source_entity: interview.interview_group,
        target_entity: interview.system_or_vendor_mentioned,
        relationship_status: "candidate_until_validated",
        relationship_evidence: interview.synthetic_answer,
      };
    }
    if (dimension === "13_evidence_sources") {
      return {
        ...common,
        business_name: `${interview.interview_group} interview evidence`,
        evidence_type: "synthetic_executive_interview",
        evidence_location: `datasets/tenant-inputs/${config.tenantKey}/interviews/executive_interviews.csv`,
        evidence_owner: interview.stakeholder_role,
        source_artifact_type: "SA07 Executive Interview Insights",
      };
    }
    if (dimension === "14_metrics_outcomes") {
      return {
        ...common,
        metric_mentioned: interview.metric_mentioned,
        metric_boundary: "baseline_required_before_value_claim",
        outcome_status: "candidate_baseline_needed",
      };
    }
    if (dimension === "11_risks_controls") {
      return {
        ...common,
        risk_or_control_mentioned: interview.risk_or_control_mentioned,
        control_status: "candidate_control_evidence_needed",
      };
    }
    return {
      ...common,
      system_or_vendor_mentioned: interview.system_or_vendor_mentioned,
      data_domain_mentioned: interview.data_domain_mentioned,
      key_initiative: interview.key_initiative,
      known_challenge: interview.known_challenge,
    };
  });
}

function writeTenant(config) {
  const base = tenantInputFolder(config);
  const standardDir = path.join(base, "standard-2026-07-v3");
  const interviewDir = path.join(base, "interviews");
  ensureDir(standardDir);
  ensureDir(interviewDir);
  const rowCounts = {};
  const interviews = interviewRows(config);
  for (const dimension of dimensions) {
    const rows = [
      ...dimensionRows(config, dimension),
      ...interviewContributionRows(config, dimension, interviews),
    ];
    writeCsv(path.join(standardDir, `${dimension}.csv`), Object.keys(rows[0]), rows);
    rowCounts[`standard-2026-07-v3/${dimension}.csv`] = rows.length;
  }
  writeCsv(path.join(interviewDir, "executive_interviews.csv"), Object.keys(interviews[0]), interviews);
  rowCounts["interviews/executive_interviews.csv"] = interviews.length;
  return { tenantKey: config.tenantKey, inputFolder: base, rowCounts, interviewRows: interviews.length };
}

function writeManifest(results) {
  const manifestPath = path.join(repoRoot, "datasets/tenant-generation-manifest.v3.json");
  const entries = [
    {
      tenant_key: "meridian-health",
      display_name: "Meridian Health System",
      industry: "healthcare_provider",
      tenant_archetype: "healthcare integrated delivery network and health plan",
      enabled_for_cxo_story_generation: true,
    },
    {
      tenant_key: "skyharbor-air",
      requested_alias: "skyharbor",
      display_name: "SkyHarbor Air",
      industry: "airline",
      tenant_archetype: "global airline operations, procurement, AMS, and digital enterprise",
      enabled_for_cxo_story_generation: true,
    },
    {
      tenant_key: "first-capital",
      requested_alias: "financial",
      display_name: "First Capital Financial",
      industry: "financial_services_banking",
      tenant_archetype: "regulated banking, digital, risk, fraud, AML/KYC, and servicing enterprise",
      enabled_for_cxo_story_generation: true,
    },
  ].map((entry) => {
    const result = results.find((item) => item.tenantKey === entry.tenant_key);
    return {
      ...entry,
      approved_template_version: "standard-2026-07-v3",
      source_input_folder: `datasets/tenant-inputs/${entry.tenant_key}/standard-2026-07-v3`,
      generated_dataset_folder: `datasets/${entry.tenant_key === "first-capital" ? "first-capital-financial" : entry.tenant_key}-v3-v7-context-v1`,
      generated_context_folder: `datasets/${entry.tenant_key === "first-capital" ? "first-capital-financial" : entry.tenant_key}-v3-v7-context-v1/v7`,
      narrative_output_file: `reports/multi-tenant-cxo-story-generation/${entry.tenant_key}/generated-story-blocks.json`,
      synthetic_data_required: true,
      cxo_story_prompt_profile: entry.industry,
      allowed_industry_patterns: entry.industry,
      forbidden_claims: "no real client data; no realized savings; no production AI readiness; no event-specific Source artifacts",
      primary_use_cases: "see tenant config and generated v3 inputs",
      module_emphasis: "Home|Knowledge|Intelligence|Moves|Source|Tower",
      interview_profiles_required: true,
      source_context_depth_required: entry.tenant_key === "skyharbor-air" ? "high_ams_ims_contract_optimization" : "regulated_vendor_risk_and_control_context",
      generated_input_rows: result?.rowCounts ?? {},
    };
  });
  fs.writeFileSync(manifestPath, `${JSON.stringify({ generated_at: new Date().toISOString(), entries }, null, 2)}\n`);
  return manifestPath;
}

function writeReports(results) {
  for (const result of results) {
    const reportRoot = path.join(repoRoot, "reports", result.tenantKey === "skyharbor-air"
      ? "skyharbor-context-depth-pack"
      : result.tenantKey === "first-capital"
        ? "financial-context-depth-pack"
        : "meridian-executive-interview-context-pack");
    ensureDir(reportRoot);
    const coverage = Object.entries(result.rowCounts).map(([file, count]) => `- ${file}: ${count}`).join("\n");
    const label = result.tenantKey === "skyharbor-air"
      ? "SkyHarbor"
      : result.tenantKey === "first-capital"
        ? "Financial"
        : "Meridian Executive Interview";
    fs.writeFileSync(path.join(reportRoot, "summary.md"), `# ${label} Context Depth Pack\n\nGenerated from standard-2026-07-v3 synthetic inputs.\n\n${coverage}\n`);
    fs.writeFileSync(path.join(reportRoot, "interview-coverage.md"), `# Interview Coverage\n\n- Interview rows: ${result.interviewRows}\n- Groups: ${(result.interviewRows / interviewQuestions.length).toFixed(0)}\n- Questions per group: ${interviewQuestions.length}\n`);
    if (result.tenantKey === "skyharbor-air") {
      fs.writeFileSync(path.join(reportRoot, "source-context-coverage.md"), "# Source Context Coverage\n\nAMS/IMS sourcing readiness, existing contract optimization, SLA/ticket/invoice leakage, application scope, service tower, rate-card, exit, benchmark, step-in, and audit-right context are represented as synthetic evidence.\n");
      fs.writeFileSync(path.join(reportRoot, "contract-context-coverage.md"), "# Contract Context Coverage\n\nSynthetic MSA/SOW/SLA/rate-card/service-credit/termination/transition/audit/benchmark/productivity/AI-automation context is available for later Source artifact generation.\n");
      fs.writeFileSync(path.join(reportRoot, "sla-ticket-invoice-coverage.md"), "# SLA Ticket Invoice Coverage\n\nSynthetic SLA, ServiceNow, invoice-to-SOW, change-order, service-credit, incident aging, and application-criticality context is represented. Numeric outcomes remain planning-grade unless separately validated.\n");
    } else if (result.tenantKey === "first-capital") {
      fs.writeFileSync(path.join(reportRoot, "risk-control-coverage.md"), "# Risk Control Coverage\n\nFraud, AML/KYC, model risk, regulatory reporting, PII handling, lineage, explainability, and auditability gaps are captured as context evidence.\n");
      fs.writeFileSync(path.join(reportRoot, "vendor-contract-coverage.md"), "# Vendor Contract Coverage\n\nCore banking, digital banking, fraud/AML, cloud/data, MRM, AMS, contract, invoice, SLA, third-party risk, data-export, and renewal evidence is represented as synthetic context.\n");
    } else {
      fs.writeFileSync(path.join(reportRoot, "interview-context-coverage.md"), "# Interview Context Coverage\n\nSynthetic executive and technical interview evidence covers Meridian leadership priorities, operating model constraints, PHI/control readiness, data/platform gaps, module next actions, and evidence required before AI or sourcing activity scales.\n");
    }
  }
}

const requested = arg("--tenant");
const configs = process.argv.includes("--all") || !requested
  ? tenantV6CanonicalConfigs
  : [getTenantV6Config(requested)];
if (configs.some((config) => !config)) throw new Error(`Unknown tenant ${requested}`);
const results = configs.map(writeTenant);
const manifestPath = writeManifest(results);
writeReports(results);
console.log(JSON.stringify({ manifestPath, results }, null, 2));

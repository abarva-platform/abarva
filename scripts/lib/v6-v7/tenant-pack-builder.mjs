import fs from "node:fs";
import path from "node:path";
import { checksumFile, key, pickRecordName, readCsv, readHeader, slug, writeCsv } from "./csv.mjs";

const REPO_ROOT = process.cwd();
const V6_HEADER_ROOT = path.join(REPO_ROOT, "datasets/meridian-health-synthetic-v6/templates");
const V7_HEADER_ROOT = path.join(REPO_ROOT, "datasets/lakeshore-industries-synthetic-v7-holdco");
const NOW = "2026-07-09T00:00:00Z";

const REL_TYPES = new Set([
  "SUPPORTS",
  "DEPENDS_ON",
  "HOSTED_ON",
  "OWNED_BY",
  "PRIMARY_SYSTEM_FOR",
  "SYSTEM_OF_RECORD_FOR",
  "VENDOR_SUPPORTS_SYSTEM",
  "FUNDS",
  "MITIGATES",
  "FEEDS",
  "BLOCKS",
  "MEASURES",
  "USES",
  "MODERNIZES",
  "IMPACTS",
  "GOVERNS",
  "ROLLS_UP_TO",
]);

const V7_FILES = [
  ["V7_00_portfolio_entity_registry.csv", "v7_00_portfolio_entity_registry", "Portfolio Entity Registry"],
  ["V7_01_enterprise_profile.csv", "v7_01_enterprise_profile", "Enterprise Profile"],
  ["V7_02_business_functions.csv", "v7_02_business_functions", "Business Functions"],
  ["V7_03_org_ownership.csv", "v7_03_org_ownership", "Org Ownership"],
  ["V7_04_workforce_personas.csv", "v7_04_workforce_personas", "Workforce Personas"],
  ["V7_05_applications_systems.csv", "v7_05_applications_systems", "Applications Systems"],
  ["V7_06_data_assets_integrations.csv", "v7_06_data_assets_integrations", "Data Assets Integrations"],
  ["V7_07_vendors_contracts.csv", "v7_07_vendors_contracts", "Vendors Contracts"],
  ["V7_08_spend_value.csv", "v7_08_spend_value", "Spend Value"],
  ["V7_09_programs_initiatives_business_priorities.csv", "v7_09_programs_initiatives_business_priorities", "Programs Initiatives Business Priorities"],
  ["V7_10_ai_initiatives.csv", "v7_10_ai_initiatives", "Ai Initiatives"],
  ["V7_11_operations_risk_controls.csv", "v7_11_operations_risk_controls", "Operations Risk Controls"],
  ["V7_12_relationships_graph_edges.csv", "v7_12_relationships_graph_edges", "Relationships Graph Edges"],
  ["V7_13_source_evidence_registry.csv", "v7_13_source_evidence_registry", "Source Evidence Registry"],
  ["V7_14_metric_definitions.csv", "v7_14_metric_definitions", "Metric Definitions"],
  ["V7_15_industry_market_knowledge_patterns.csv", "v7_15_industry_market_knowledge_patterns", "Industry Market Knowledge Patterns"],
  ["V7_16_expert_lenses.csv", "v7_16_expert_lenses", "Expert Lenses"],
  ["V7_17_client_rate_card_cost_basis.csv", "v7_17_client_rate_card_cost_basis", "Client Rate Card Cost Basis"],
  ["V7_18_function_system_data_vendor_bridge.csv", "v7_18_function_system_data_vendor_bridge", "Function System Data Vendor Bridge"],
  ["V7_19_service_tower_managed_services_scope.csv", "v7_19_service_tower_managed_services_scope", "Service Tower Managed Services Scope"],
  ["V7_20_chunk_retrieval_registry.csv", "v7_20_chunk_retrieval_registry", "Chunk Retrieval Registry"],
  ["V7_21_graph_registry_relationship_dictionary.csv", "v7_21_graph_registry_relationship_dictionary", "Graph Registry Relationship Dictionary"],
  ["V7_22_operational_evidence_process_intelligence.csv", "v7_22_operational_evidence_process_intelligence", "Operational Evidence Process Intelligence"],
  ["V7_23_external_benchmark_market_corpus.csv", "v7_23_external_benchmark_market_corpus", "External Benchmark Market Corpus"],
  ["V7_24_infrastructure_cloud_estate.csv", "v7_24_infrastructure_cloud_estate", "Infrastructure Cloud Estate"],
];

function base(config, family, id, name, sourceFile, sourceRowNumber, confidence = "medium") {
  return {
    tenant_key: config.tenantKey,
    client_display_name: config.tenantName,
    v6_contract_version: config.v6ContractVersion,
    business_object_family: family,
    record_id: id,
    record_name: name,
    source_system: config.datasetId,
    source_owner: "AbarVa synthetic data steward",
    source_basis: config.sourceBasis,
    source_file: sourceFile,
    source_row_number: sourceRowNumber,
    as_of_date: config.asOfDate,
    period_start: "2026-01-01",
    period_end: "2026-07-09",
    refresh_frequency: "workshop_refresh",
    confidence,
    synthetic_demo_flag: "synthetic_demo",
    data_sensitivity: config.dataBoundary,
    required_for_surfaces: "Home|Intelligence|Tower|Moves|Source",
    allowed_answer_types: "current_state|gap|relationship|recommendation|planning_scenario",
    not_allowed_claims: config.notAllowedClaims.join(" | "),
    known_gaps: config.commonKnownGaps.join(" | "),
    created_at: NOW,
    updated_at: NOW,
  };
}

function evidence(config) {
  return {
    data_provider_name: "AbarVa synthetic data steward",
    data_provider_role: "Synthetic data generation",
    source_artifact_type: "repo_generated_current_state_pack",
    source_artifact_name: config.sourceArtifactName,
    capture_method: "tenant_config_plus_deterministic_derivation",
    extraction_method: "scripts/lib/v6-v7/tenant-pack-builder.mjs",
    generated_by: "scripts/tenant-v6/generate-tenant-v6-pack.mjs",
    validated_by: "scripts/tenant-v6/validate-tenant-v6-pack.mjs",
    source_validation_status: "synthetic_demo_manifest_gated",
    source_as_of_date: config.asOfDate,
    known_gaps: config.commonKnownGaps.join(" | "),
  };
}

function withEntity(config, row = {}) {
  return {
    tenant_key: config.tenantKey,
    entity_id: config.entity.entity_id,
    entity_name: config.entity.entity_name,
    entity_short_name: config.entity.entity_short_name,
    entity_scope: config.entity.entity_scope,
    parent_entity_id: config.entity.parent_entity_id,
    parent_entity_name: config.entity.parent_entity_name,
    ...row,
    ...evidence(config),
  };
}

function v6Rows(config) {
  const rows = {};
  const entity = config.entity;
  rows["V6_01_enterprise_profile.csv"] = [{
    ...base(config, "enterprise_profile", "MER-V6-ENT-001", entity.entity_name, "tenant_config", 2, "medium"),
    company_name: entity.entity_name,
    industry: entity.industry,
    sub_industry: entity.sub_industry,
    revenue_usd: "not_provided",
    employee_count: "not_provided",
    business_model: entity.business_model,
    strategic_priorities: config.useCases.map((uc) => uc.name).join("; "),
  }];

  rows["V6_02_business_functions.csv"] = config.functions.map((fn, i) => ({
    ...base(config, "business_function", fn[0], fn[1], "tenant_config.functions", i + 2),
    function_id: fn[0],
    function_name: fn[1],
    executive_owner: fn[2],
    operating_model: fn[3],
    primary_kpis: fn[4],
    critical_processes: fn[5],
  }));

  rows["V6_03_org_ownership.csv"] = config.functions.map((fn, i) => ({
    ...base(config, "org_ownership", `MER-ORG-${String(i + 1).padStart(3, "0")}`, `${fn[1]} ownership`, "tenant_config.functions", i + 2),
    org_unit_id: `MER-ORG-${String(i + 1).padStart(3, "0")}`,
    org_unit_name: fn[1],
    leader_role: fn[2],
    reports_to_role: i === 0 ? "CEO / Executive Committee" : "Executive sponsor",
    decision_rights: `Owns evidence, priorities, and phase-gate facts for ${fn[1]}.`,
    owned_systems: config.systems.filter((s) => s[3].includes(fn[1].split(" ")[0]) || s[2].includes(fn[1].split(" ")[0].toLowerCase())).map((s) => s[1]).join("; ") || "not_loaded",
    owned_processes: fn[5],
  }));

  rows["V6_04_workforce_personas.csv"] = [
    ["MER-PER-001", "Analytics managed-services report maintainer", "Enterprise Data and Analytics", Math.round(config.workforce.analyticsResourceCount * config.workforce.maintenanceShare), "High", "Break/fix, extract refresh, dashboard maintenance, ad hoc report changes."],
    ["MER-PER-002", "Net-new analytics delivery resource", "Enterprise Data and Analytics", Math.round(config.workforce.analyticsResourceCount * config.workforce.netNewShare), "High", "New data product, semantic model, and use-case delivery constrained by maintenance load."],
    ["MER-PER-003", "Data steward / semantic owner", "Enterprise Data and Analytics", "not_provided", "High", "Definition ownership and quality certification are not formally established."],
    ["MER-PER-004", "Clinical quality analyst", "Quality and Provider Performance", "not_provided", "High", "HEDIS, STAR, attribution, care gap, and provider benchmarking analysis."],
    ["MER-PER-005", "Finance analytics analyst", "Finance and Actuarial", "not_provided", "High", "Cost-of-care, margin, close reporting, and reconciliation analytics."],
    ["MER-PER-006", "Contact center supervisor", "Contact Center and Member Experience", "not_provided", "Medium", "Call QA, agent performance, intent analysis, and escalation review."],
  ].map((p, i) => ({
    ...base(config, "workforce_persona", p[0], p[1], "tenant_config.workforce", i + 2),
    persona_id: p[0],
    persona_name: p[1],
    business_area: p[2],
    population_count: p[3],
    ai_relevance: p[4],
    work_context: p[5],
  }));

  rows["V6_05_applications_systems.csv"] = config.systems.map((s, i) => ({
    ...base(config, "application_system", s[0], s[1], "tenant_config.systems", i + 2, s[5].includes("aspirational") ? "low" : "medium"),
    system_id: s[0],
    system_name: s[1],
    business_capability: s[2],
    system_owner: s[3],
    criticality: s[4],
    lifecycle_status: s[5],
    vendor_id: s[6],
    annual_cost_usd: s[7] || "not_provided",
    integrations: s[8],
    data_dependencies: s[9],
    ai_relevance: s[10],
  }));

  const dataRows = [];
  config.useCases.forEach((uc, i) => {
    uc.dataDomains.forEach((domain, j) => {
      dataRows.push({
        ...base(config, "data_asset_integration", `MER-DATA-${String(dataRows.length + 1).padStart(3, "0")}`, `${uc.name}: ${domain}`, "derived_from_use_cases", dataRows.length + 2, "medium"),
        data_asset_id: `MER-DATA-${String(dataRows.length + 1).padStart(3, "0")}`,
        data_asset_name: `${uc.name}: ${domain}`,
        data_owner: "owner_to_confirm_in_workshop",
        system_of_record: uc.systems[j % uc.systems.length],
        lineage: `${uc.systems.join(" + ")} -> current extracts/marts -> governed lakehouse target not certified`,
        consumers: `${uc.category}; CDAO; accountable business owner`,
        quality_score: "not_scored",
        governance_status: uc.gaps.join("; "),
      });
    });
  });
  rows["V6_06_data_assets_integrations.csv"] = dataRows;

  rows["V6_07_vendors_contracts.csv"] = config.vendors.map((v, i) => ({
    ...base(config, "vendor_contract", v[0], v[1], "tenant_config.vendors", i + 2, "medium"),
    vendor_id: v[0],
    vendor_name: v[1],
    contract_id: "not_loaded",
    service: v[2],
    annual_cost_usd: v[3] || "not_provided",
    renewal_date: v[4] || "not_loaded",
    owning_function: v[5],
    linked_systems: v[6],
    contract_risk: v[7],
    pricing_basis: v[8],
  }));

  rows["V6_08_spend_value.csv"] = [
    ["MER-SPEND-001", "not_provided", "analytics_resource_count", "Enterprise Data and Analytics", "", "MER-VEN-AMS", "", "not_loaded", "phase_gate", "128 analytics/data resources modeled from user-provided 120+ resource constraint", "resource_count"],
    ["MER-SPEND-002", "not_provided", "maintenance_share", "Enterprise Data and Analytics", "", "MER-VEN-AMS", "", "not_loaded", "phase_gate", "Roughly 80 percent maintenance / ad hoc support work", "work_mix"],
    ["MER-SPEND-003", "not_provided", "net_new_share", "Enterprise Data and Analytics", "", "MER-VEN-AMS", "", "not_loaded", "phase_gate", "Roughly 20 percent net-new request work", "work_mix"],
    ...config.useCases.map((uc, i) => [`MER-SPEND-${String(i + 4).padStart(3, "0")}`, "not_provided", "value_hypothesis", uc.category, uc.id, "", "", "not_loaded", "phase_gate", uc.valueHypothesis, "baseline_required"]),
  ].map((s, i) => ({
    ...base(config, "spend_value", s[0], s[9], "derived_value_hypotheses", i + 2, "medium"),
    spend_id: s[0],
    amount_usd: s[1],
    amount_type: s[2],
    owner: s[3],
    program_id: s[4],
    vendor_id: s[5],
    system_id: s[6],
    committed_vs_discretionary: s[7],
    renewal_or_gate_date: s[8],
    value_linkage: s[9],
    unit_economics: s[10],
  }));

  rows["V6_09_programs_initiatives.csv"] = config.useCases.map((uc, i) => ({
    ...base(config, "program_initiative", uc.id, uc.name, "tenant_config.use_cases", i + 2, "medium"),
    program_id: uc.id,
    business_owner: uc.category,
    technology_owner: "CDAO / Data Platform owner to confirm",
    executive_sponsor: uc.category === "Finance" ? "CFO" : uc.category === "Clinical" ? "CMO" : "CDAO",
    phase: "P0/P1 evidence framing",
    budget_usd: "not_provided",
    spend_to_date_usd: "not_provided",
    expected_value_usd: "not_provided",
    realized_value_usd: "not_provided",
    value_basis: uc.valueHypothesis,
    status: "candidate_move",
    target_date: "not_loaded",
    dependencies: uc.systems.join("; "),
    risks: uc.gaps.join("; "),
    decision_needed: `Confirm evidence owner, baseline, gate criteria, and missing artifacts for ${uc.name}.`,
  }));

  rows["V6_10_ai_initiatives.csv"] = config.useCases.slice(0, 3).map((uc, i) => ({
    ...base(config, "ai_initiative", `MER-AI-${String(i + 1).padStart(3, "0")}`, uc.name, "tenant_config.use_cases", i + 2, "low"),
    ai_initiative_id: `MER-AI-${String(i + 1).padStart(3, "0")}`,
    use_case: uc.name,
    business_process: uc.dataDomains.join("; "),
    tool_or_model: "AI/LLM workflow target - not production",
    agent_or_copilot_name: "not_loaded",
    user_group: uc.category,
    licensed_users: "not_loaded",
    active_users: "not_loaded",
    adoption_metric: "not_loaded",
    value_hypothesis: uc.valueHypothesis,
    measured_value_usd: "not_provided",
    production_status: "not_production_ready",
    risk_status: uc.gaps.join("; "),
    model_risk_tier: "requires_review",
    data_readiness: "blocked_by_governance_and_foundation_gaps",
    decision_needed: `Do not progress ${uc.name} to automation until source, governance, and control evidence are loaded.`,
    scale_hold_stop: "hold",
  }));

  rows["V6_11_operations_risk_controls.csv"] = config.useCases.flatMap((uc, i) => uc.gaps.map((gap, j) => ({
    ...base(config, "operations_risk_control", `MER-RISK-${String(i + 1).padStart(2, "0")}-${String(j + 1).padStart(2, "0")}`, `${uc.name}: ${gap}`, "tenant_config.use_cases.gaps", (i * 10) + j + 2, "medium"),
    process: uc.name,
    process_owner: uc.category,
    severity: gap.includes("not") || gap.includes("No ") ? "high" : "medium",
    status: "open",
    control: `Workshop must provide evidence to close: ${gap}.`,
    affected_systems: uc.systems.join("; "),
    business_impact: `Blocks confident progression for ${uc.name}.`,
  })));

  const rels = [];
  config.useCases.forEach((uc) => {
    uc.systems.forEach((systemName) => {
      const sys = config.systems.find((s) => s[1] === systemName);
      if (sys) rels.push(["application_system", sys[0], "SUPPORTS", "program_initiative", uc.id, `${systemName} supports ${uc.name}`]);
    });
    uc.gaps.forEach((gap, i) => rels.push(["operations_risk_control", `MER-RISK-${String(config.useCases.indexOf(uc) + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`, "BLOCKS", "program_initiative", uc.id, gap]));
  });
  config.systems.forEach((s) => rels.push(["vendor_contract", s[6], "VENDOR_SUPPORTS_SYSTEM", "application_system", s[0], `${s[6]} supports ${s[1]}`]));
  rows["V6_12_relationships.csv"] = rels.map((r, i) => ({
    ...base(config, "relationship", `MER-REL-${String(i + 1).padStart(4, "0")}`, r[5], "derived_relationship_graph", i + 2, "medium"),
    relationship_id: `MER-REL-${String(i + 1).padStart(4, "0")}`,
    from_object_family: r[0],
    from_record_id: r[1],
    relationship_type: r[2],
    to_object_family: r[3],
    to_record_id: r[4],
    evidence_basis: r[5],
    relationship_confidence: "medium",
  }));

  rows["V6_13_evidence_sources.csv"] = [
    ["MER-EVID-001", "User-provided Meridian current-state brief", "operator_prompt", "Codex thread prompt 2026-07-09", "AbarVa operator", "medium"],
    ["MER-EVID-002", "Generated Meridian V6/V7 current-state pack", "generated_dataset", config.sourceDataset, "AbarVa synthetic data steward", "medium"],
    ["MER-EVID-003", "Meridian use-case priority list", "operator_prompt", "CDAO use cases from prompt", "AbarVa operator", "medium"],
    ["MER-EVID-004", "V7 derivation anti-boilerplate quality gate", "validation_report", "out/meridian-v6-v7-current-state-v1", "AbarVa QA", "high"],
  ].map((e, i) => ({
    ...base(config, "evidence_source", e[0], e[1], "manifest_and_prompt", i + 2, e[5]),
    evidence_id: e[0],
    evidence_title: e[1],
    evidence_type: e[2],
    source_location: e[3],
    evidence_owner: e[4],
    evidence_confidence: e[5],
  }));

  rows["V6_14_metric_definitions.csv"] = [
    ["MER-MET-001", "Analytics maintenance share", "Share of data/analytics resources consumed by maintenance and ad hoc work.", "maintenance resources / total analytics resources", "percent", "CDAO", "planning_grade"],
    ["MER-MET-002", "Net-new analytics capacity share", "Share of resources available for net-new analytics delivery.", "net-new resources / total analytics resources", "percent", "CDAO", "planning_grade"],
    ["MER-MET-003", "Medallion certification status", "Whether bronze/silver/gold data product layers are certified.", "evidence review", "status", "Data Platform", "gap"],
    ["MER-MET-004", "Governance operating model status", "Whether formal stewardship, semantic ownership, and quality gates exist.", "evidence review", "status", "CDAO", "gap"],
    ...config.useCases.map((uc, i) => [`MER-MET-${String(i + 5).padStart(3, "0")}`, `${uc.name} baseline readiness`, `Evidence readiness for ${uc.name}.`, "phase evidence checklist", "status", uc.category, "planning_grade"]),
  ].map((m, i) => ({
    ...base(config, "metric_definition", m[0], m[1], "derived_metric_catalog", i + 2, "medium"),
    metric_id: m[0],
    metric_name: m[1],
    metric_definition: m[2],
    calculation_basis: m[3],
    unit_of_measure: m[4],
    metric_owner: m[5],
    metric_claim_level: m[6],
  }));

  rows["V6_15_industry_corpus_patterns.csv"] = config.useCases.map((uc, i) => ({
    ...base(config, "industry_corpus_pattern", `MER-PAT-${String(i + 1).padStart(3, "0")}`, `${uc.name} healthcare analytics pattern`, "derived_patterns", i + 2, "medium"),
    pattern_id: `MER-PAT-${String(i + 1).padStart(3, "0")}`,
    pattern_name: `${uc.name} healthcare analytics pattern`,
    industry_domain: "Healthcare",
    when_to_apply: uc.dataDomains.join("; "),
    signals: uc.gaps.join("; "),
    recommended_actions: `Use evidence-gated phase review for ${uc.name}; collect missing source/system/governance evidence before value claims.`,
    corpus_context_label: uc.category,
  }));

  rows["V6_16_expert_lenses.csv"] = [
    ["MER-LENS-001", "Healthcare CDAO data foundation lens", "CDAO", "data foundation or lakehouse modernization", "What source systems, governance gates, and semantic definitions are certified?", "Do not claim production-ready AI without data controls."],
    ["MER-LENS-002", "Clinical quality lens", "Clinical", "quality, HEDIS, STAR, provider performance", "Which measure logic, attribution, and provider-contract facts are certified?", "Do not claim audited HEDIS/STAR outcomes."],
    ["MER-LENS-003", "Finance cost transparency lens", "Finance", "cost-of-care, margin, close, reporting", "Which claims, capitation, contract, GL, and reconciliation evidence is loaded?", "Do not invent dollar values or audited margin."],
    ["MER-LENS-004", "Member experience lens", "Operations", "contact center, CRM, claims, transcript analytics", "Which transcript, CRM, claims, intent, and QA evidence is approved?", "Do not claim real-time agent assist is live."],
    ["MER-LENS-005", "Platform/security readiness lens", "Technology", "AWS Databricks target or AI automation", "Which network, security, IAM, PHI, lineage, and medallion controls are evidenced?", "Do not claim platform foundation exists."],
  ].map((l, i) => ({
    ...base(config, "expert_lens", l[0], l[1], "derived_expert_lenses", i + 2, "medium"),
    expert_lens_id: l[0],
    expert_lens_name: l[1],
    domain_focus: l[2],
    activation_conditions: l[3],
    lens_questions: l[4],
    lens_forbidden_claims: l[5],
  }));

  for (const row of rows["V6_12_relationships.csv"]) {
    if (!REL_TYPES.has(row.relationship_type)) throw new Error(`Unsupported relationship_type ${row.relationship_type}`);
  }
  return rows;
}

function deriveFindings(config) {
  return config.useCases.flatMap((uc, i) => uc.gaps.map((gap, j) => {
    const system = uc.systems[j % uc.systems.length];
    const domain = uc.dataDomains[j % uc.dataDomains.length];
    return {
      move_id: uc.id,
      move_name: uc.name,
      finding_id: `${uc.id}-F${j + 1}`,
      source_system: system,
      data_domain: domain,
      current_state_finding: `${system} and ${domain} evidence show a blocker for ${uc.name}: ${gap}.`,
      business_implication: `${uc.category} cannot treat ${domain} as decision-grade for ${uc.name} until ${gap.toLowerCase()} is closed with named evidence.`,
      recommended_next_step: `For ${uc.name}, collect ${domain} lineage/control evidence from ${system} and assign a steward before phase advancement.`,
      evidence_refs: `MER-EVID-001; ${system}; ${domain}`,
      not_allowed_claims: uc.notAllowedClaims.join(" | "),
      confidence: "medium",
    };
  }));
}

function deriveGoldenQuestions(config) {
  const stems = [
    "What exact source evidence supports this Move?",
    "Which foundation gap blocks phase advancement?",
    "What must not be claimed yet?",
    "Which systems must be reconciled?",
    "What baseline is required before value is quantified?",
    "Which owner must validate the answer?",
  ];
  const passVariants = [
    (uc, system, domain, gap) => `Pass only if the answer identifies ${system} as evidence for ${uc.name}, ties it to ${domain}, and states that "${gap}" still requires source proof.`,
    (uc, system, domain, gap) => `Pass when the blocker is named as "${gap}", the answer explains why it constrains ${domain}, and ${uc.name} remains in planning-grade language.`,
    (uc, system, domain, gap) => `Pass if the response refuses production/value claims for ${uc.name}, preserves the forbidden-claim boundary, and cites ${system} as the relevant fact anchor.`,
    (uc, system, domain, gap) => `Pass when ${system} is reconciled with the other Move systems, ${domain} is not treated as certified, and the open dependency "${gap}" is explicit.`,
    (uc, system, domain, gap) => `Pass only if value discussion for ${uc.name} asks for a baseline for ${domain}, names the owner evidence still needed, and avoids dollar or ROI invention.`,
    (uc, system, domain, gap) => `Pass when the validating owner path is tied to ${uc.category}, the source artifact is referenced, and the answer explains how "${gap}" affects phase advancement.`,
  ];
  return config.useCases.flatMap((uc) => stems.map((stem, i) => {
    const system = uc.systems[i % uc.systems.length];
    const domain = uc.dataDomains[i % uc.dataDomains.length];
    const gap = uc.gaps[i % uc.gaps.length];
    return {
      move_id: uc.id,
      question_id: `${uc.id}-Q${String(i + 1).padStart(2, "0")}`,
      question: `${stem} (${uc.name})`,
      must_include: `${uc.name}; ${system}; ${domain}; ${gap}`,
      must_not_claim: `${uc.notAllowedClaims[i % uc.notAllowedClaims.length]} Specific to ${uc.name}, do not present ${system} / ${domain} as certified while "${gap}" remains open.`,
      pass_criteria: passVariants[i](uc, system, domain, gap),
      evidence_refs: `MER-EVID-001; ${system}`,
      failure_mode_guarded: i === 0 ? "unsupported_tenant_claim" : i === 1 ? "foundation_overclaim" : i === 2 ? "value_fabrication" : "thin_generic_answer",
    };
  }));
}

function v7Rows(config, v6) {
  const out = Object.fromEntries(V7_FILES.map(([file]) => [file, []]));
  const entity = config.entity;
  out["V7_00_portfolio_entity_registry.csv"].push(withEntity(config, {
    ...entity,
    revenue_usd: "",
    employee_count: "",
    corporate_it_budget_usd: "",
    opco_local_technology_budget_usd: "",
    total_direct_technology_budget_usd: "",
    ai_data_budget_usd: "",
    currency: "USD",
    revenue_period_label: "not_loaded",
    employee_count_basis: "not_loaded",
    validation_status: "synthetic_demo_manifest_gated",
  }));
  out["V7_01_enterprise_profile.csv"].push({
    client_display_name: config.tenantName,
    company_name: config.tenantName,
    ...entity,
    legal_entity_type: entity.entity_type,
    revenue_usd: "",
    revenue_basis: "not_loaded",
    revenue_period_label: "not_loaded",
    employee_count: "",
    employee_count_basis: "not_loaded",
    operating_company_breakdown: "not_loaded",
    business_segments: "clinical delivery; health plan operations; finance; analytics",
    corporate_it_budget_usd: "",
    opco_local_technology_budget_usd: "",
    total_direct_technology_budget_usd: "",
    technology_budget_basis: "not_loaded",
    ai_data_budget_usd: "",
    primary_cloud: "AWS target for analytics; foundation not evidenced",
    enterprise_cdp_status: "not_loaded",
    strategic_priorities: config.useCases.map((uc) => uc.name).join("; "),
    ...evidence(config),
  });
  out["V7_02_business_functions.csv"] = v6["V6_02_business_functions.csv"].map((r) => withEntity(config, {
    function_id: r.function_id,
    function_name: r.function_name,
    function_category: r.executive_owner,
    parent_function_name: "enterprise",
    business_capability: r.critical_processes,
    executive_owner: r.executive_owner,
    operating_model: r.operating_model,
    critical_processes_structured: r.critical_processes,
    primary_kpis_structured: r.primary_kpis,
    kpi_source_ref: "MER-EVID-001",
    function_criticality: "high",
    stakeholder_facing_type: "internal",
    supporting_system_refs: config.systems.filter((s) => r.critical_processes.toLowerCase().split(";").some((p) => s[2].toLowerCase().includes(p.trim().split(" ")[0]))).map((s) => s[0]).join("; "),
    supporting_data_asset_refs: "see V7_06",
    supporting_vendor_refs: "see V7_07",
    known_business_pain_points: config.commonKnownGaps.join("; "),
    ai_opportunity_areas: config.useCases.filter((uc) => uc.category === r.executive_owner || r.function_name.includes(uc.category)).map((uc) => uc.name).join("; ") || "evidence-bound analytics modernization",
  }));
  out["V7_03_org_ownership.csv"] = v6["V6_03_org_ownership.csv"].map((r) => withEntity(config, {
    ownership_id: r.org_unit_id,
    org_unit: r.org_unit_name,
    leader_role: r.leader_role,
    leader_name: "not_loaded",
    reports_to_role: r.reports_to_role,
    decision_rights: r.decision_rights,
    budget_authority: "not_loaded",
    business_or_it_org: r.org_unit_name,
    escalation_path: "workshop_to_confirm",
    accountable_budget_usd: "",
    team_size_fte: "",
    key_initiatives_owned: r.owned_processes,
  }));
  out["V7_04_workforce_personas.csv"] = v6["V6_04_workforce_personas.csv"].map((r) => withEntity(config, {
    persona_id: r.persona_id,
    persona_name: r.persona_name,
    role_family: r.business_area,
    population_count: r.population_count,
    population_basis: r.population_count === "not_provided" ? "not_loaded" : "user_provided_current_state",
    primary_tasks: r.work_context,
    systems_used: "SQL Server marts; Tableau; SAS; Power BI; Epic analytics where applicable",
    pain_points: "Maintenance load; fragmented marts; missing governance; foundation gaps",
    change_readiness: "requires workshop validation",
    ai_enablement_need: r.ai_relevance,
    decisions_supported: "phase evidence and baseline readiness",
  }));
  out["V7_05_applications_systems.csv"] = v6["V6_05_applications_systems.csv"].map((r) => withEntity(config, {
    system_id: r.system_id,
    system_name: r.system_name,
    system_aliases: "",
    system_scope: r.lifecycle_status.includes("aspirational") ? "target_not_ready" : "current_state",
    ownership_model: r.system_owner,
    served_entity_ids: entity.entity_id,
    served_entity_names: entity.entity_name,
    service_consumer_type: "enterprise",
    system_category: r.business_capability,
    vendor_product: r.vendor_id,
    hosting_model: r.system_name.includes("AWS") || r.system_name.includes("Databricks") ? "target_cloud_not_ready" : "current_mixed",
    business_function_refs: r.system_owner,
    critical_process_refs: r.data_dependencies,
    business_owner_role: r.system_owner,
    technical_owner_role: r.system_owner,
    criticality: r.criticality,
    lifecycle_status: r.lifecycle_status,
    modernization_disposition: r.lifecycle_status,
    annual_run_cost_usd: "",
    vendor_contract_refs: r.vendor_id,
    data_domains: r.data_dependencies,
    ai_data_readiness: r.ai_relevance,
    decision_relevance: r.integrations,
    system_business_context: `${r.system_name} supports ${r.data_dependencies}; gaps: ${r.known_gaps}`,
  }));
  out["V7_06_data_assets_integrations.csv"] = v6["V6_06_data_assets_integrations.csv"].map((r) => withEntity(config, {
    data_asset_id: r.data_asset_id,
    data_asset_name: r.data_asset_name,
    system_of_record: r.system_of_record,
    integration_type: "current_extract_or_target_lakehouse",
    data_owner: r.data_owner,
    data_steward: "not_loaded",
    refresh_frequency: "not_loaded",
    data_quality_status: r.quality_score,
    lineage_status: r.lineage,
    ai_consumption_readiness: r.governance_status.includes("No ") ? "not_ready" : "requires_validation",
    business_question_supported: r.consumers,
    minimum_validation_needed: r.governance_status,
  }));
  out["V7_07_vendors_contracts.csv"] = v6["V6_07_vendors_contracts.csv"].map((r) => withEntity(config, {
    vendor_id: r.vendor_id,
    vendor_name: r.vendor_name,
    vendor_category: r.service,
    annual_cost_usd: "",
    renewal_date: "",
    contract_risk: r.contract_risk,
    vendor_role: r.service,
    supported_functions: r.owning_function,
    concentration_notes: r.linked_systems,
  }));
  out["V7_08_spend_value.csv"] = v6["V6_08_spend_value.csv"].map((r) => withEntity(config, {
    spend_id: r.spend_id,
    amount_usd: "",
    spend_category: r.amount_type,
    spend_type: r.unit_economics,
    run_change: r.amount_type.includes("maintenance") ? "run" : "planning",
    spend_owner: r.owner,
    committed_vs_discretionary: r.committed_vs_discretionary,
    value_linkage: r.value_linkage,
    unit_economics: r.unit_economics,
    mapped_initiative_ref: r.program_id,
    funding_decision_status: "baseline_required",
    value_evidence_status: "not_quantified",
  }));
  out["V7_09_programs_initiatives_business_priorities.csv"] = v6["V6_09_programs_initiatives.csv"].map((r) => withEntity(config, {
    priority_id: r.program_id,
    priority_name: r.record_name,
    priority_type: "candidate_move",
    business_sponsor: r.executive_sponsor,
    current_status: r.status,
    decision_required: r.decision_needed,
    value_hypothesis: r.value_basis,
    budget_usd: "",
    funding_source: "not_loaded",
    impacted_systems: r.dependencies,
    impacted_org_roles: r.business_owner,
    value_metric: "baseline_required",
  }));
  out["V7_10_ai_initiatives.csv"] = v6["V6_10_ai_initiatives.csv"].map((r) => withEntity(config, {
    ai_initiative_id: r.ai_initiative_id,
    ai_use_case: r.use_case,
    tool_or_model: r.tool_or_model,
    active_users: "",
    production_status: r.production_status,
    readiness_gate: r.data_readiness,
    value_risk_posture: r.risk_status,
  }));
  out["V7_11_operations_risk_controls.csv"] = v6["V6_11_operations_risk_controls.csv"].map((r) => withEntity(config, {
    control_id: r.record_id,
    process_control_name: r.record_name,
    risk_category: r.process,
    severity: r.severity,
    status: r.status,
    control_owner: r.process_owner,
    evidence_required: r.control,
  }));
  out["V7_12_relationships_graph_edges.csv"] = v6["V6_12_relationships.csv"].map((r) => withEntity(config, {
    relationship_id: r.relationship_id,
    from_object_ref: r.from_record_id,
    from_object_type: r.from_object_family,
    relationship_type: r.relationship_type,
    to_object_ref: r.to_record_id,
    to_object_type: r.to_object_family,
    relationship_direction: "directed",
    evidence_ref: r.evidence_basis,
    relationship_strength: r.relationship_confidence,
    quality_score: r.relationship_confidence === "high" ? 86 : 68,
    graph_materialization_status: "ready_for_loader",
  }));
  out["V7_13_source_evidence_registry.csv"] = v6["V6_13_evidence_sources.csv"].map((r) => withEntity(config, {
    evidence_id: r.evidence_id,
    source_artifact_uri: r.source_location,
    source_artifact_label: r.evidence_title,
    evidence_purpose: r.evidence_type,
    validation_status: r.evidence_confidence,
    sensitivity: config.dataBoundary,
    owner: r.evidence_owner,
    freshness: config.asOfDate,
  }));
  out["V7_14_metric_definitions.csv"] = v6["V6_14_metric_definitions.csv"].map((r) => withEntity(config, {
    metric_id: r.metric_id,
    metric_name: r.metric_name,
    metric_definition: r.metric_definition,
    metric_owner: r.metric_owner,
    unit: r.unit_of_measure,
    target_value: "not_loaded",
    baseline_source: r.calculation_basis,
  }));
  out["V7_15_industry_market_knowledge_patterns.csv"] = v6["V6_15_industry_corpus_patterns.csv"].map((r) => ({
    pattern_id: r.pattern_id,
    pattern_name: r.pattern_name,
    industry_domain: r.industry_domain,
    recommended_actions: r.recommended_actions,
    executive_audience: "CDAO; CFO; CMO; COO",
    relevance_to_lakeshore: "not_applicable_meridian_health",
    pattern_confidence: r.confidence,
    grounding_boundary: config.dataBoundary,
    ...evidence(config),
  }));
  out["V7_16_expert_lenses.csv"] = v6["V6_16_expert_lenses.csv"].map((r) => ({
    lens_id: r.expert_lens_id,
    expert_lens_name: r.expert_lens_name,
    lens_domain: r.domain_focus,
    question_families: r.lens_questions,
    decision_criteria: r.activation_conditions,
    default_canvas: r.lens_forbidden_claims,
    ...evidence(config),
  }));
  out["V7_17_client_rate_card_cost_basis.csv"] = [
    ["MER-RATE-001", "Data foundation discovery", "solution architect", "senior", "US", "", "P0/P1 evidence review", "No rate loaded; client must provide rate card."],
    ["MER-RATE-002", "Healthcare data engineering", "data engineer", "mid", "nearshore", "", "P2/P3 delivery scenario", "No rate loaded; client must provide rate card."],
    ["MER-RATE-003", "Governance and semantic modeling", "data steward", "senior", "US", "", "P2/P4 controls", "No rate loaded; client must provide rate card."],
    ["MER-RATE-004", "Analytics AMS run support", "report maintainer", "mid", "outsourced", "", "current-state baseline", "No contract rate loaded; vendor terms not provided."],
  ].map((r) => withEntity(config, {
    rate_card_id: r[0],
    service_tower: r[1],
    role_family: r[2],
    seniority: r[3],
    delivery_location: r[4],
    rate_usd_per_hour: r[5],
    applicability: r[6],
    assumptions: r[7],
  }));
  out["V7_18_function_system_data_vendor_bridge.csv"] = v6["V6_12_relationships.csv"].slice(0, 60).map((r, i) => withEntity(config, {
    bridge_id: `MER-BRIDGE-${String(i + 1).padStart(3, "0")}`,
    function_ref: r.to_record_id,
    dependency_type: r.relationship_type,
    object_ref: r.from_record_id,
    role_in_function: r.evidence_basis,
    criticality_to_function: "medium",
    primary_secondary: i % 3 === 0 ? "primary" : "secondary",
    process_supported: r.record_name,
    data_exchanged: r.evidence_basis,
    evidence_ref: r.relationship_id,
  }));
  out["V7_19_service_tower_managed_services_scope.csv"] = [
    ["MER-SCOPE-001", "Analytics managed services", "Dashboard and report maintenance", "SQL mart refresh; Tableau/Power BI extract fixes; SAS support", "not_loaded", "not_loaded"],
    ["MER-SCOPE-002", "Analytics managed services", "Ad hoc reporting support", "Business user report changes and extracts", "not_loaded", "not_loaded"],
    ["MER-SCOPE-003", "Data foundation delivery", "Net-new data product build", "Candidate future-state delivery; currently capacity constrained", "not_loaded", "not_loaded"],
  ].map((r) => withEntity(config, {
    scope_id: r[0],
    service_tower: r[1],
    scope_item: r[2],
    included_services: r[3],
    sla: r[4],
    pricing_unit: r[5],
  }));
  out["V7_20_chunk_retrieval_registry.csv"] = Object.entries(out).filter(([file]) => !["V7_20_chunk_retrieval_registry.csv"].includes(file)).flatMap(([file, rows]) => rows.slice(0, 8).map((row, i) => withEntity(config, {
    chunk_id: `MER-CHUNK-${slug(file)}-${String(i + 1).padStart(3, "0")}`,
    source_artifact_ref: file,
    dimension: file.replace(".csv", ""),
    fact_refs: pickRecordName(row),
    semantic_tags: `${config.tenantKey}; ${file}; ${pickRecordName(row)}`,
    entity_refs: config.entity.entity_id,
    retrieval_eligibility: "eligible_after_load",
    sensitivity: config.dataBoundary,
    embedding_model: "not_indexed_in_this_pr",
    index_name: "not_indexed_in_this_pr",
    indexed_at: "",
    stale_after: "2026-10-09",
  })));
  out["V7_21_graph_registry_relationship_dictionary.csv"] = Array.from(REL_TYPES).map((type) => ({
    relationship_dictionary_id: `DICT-${type}`,
    edge_type: type,
    allowed_from: "v6_business_record",
    allowed_to: "v6_business_record",
    inverse_label: "see intelligence_v6.relationship_types",
    evidence_required: "yes",
    ...evidence(config),
  }));
  out["V7_22_operational_evidence_process_intelligence.csv"] = [
    ["MER-PROC-001", "Analytics AMS work intake", "ticket", String(config.workforce.analyticsResourceCount), "80 percent maintenance mix", "maintenance load constrains net-new work"],
    ["MER-PROC-002", "Lakehouse foundation readiness", "workshop gate", "not_loaded", "foundation incomplete", "no medallion/platform/network/security evidence"],
    ["MER-PROC-003", "Data governance readiness", "workshop gate", "not_loaded", "governance incomplete", "no formal stewardship or semantic certification evidence"],
    ...config.useCases.map((uc) => [`MER-PROC-${String(config.useCases.indexOf(uc) + 4).padStart(3, "0")}`, uc.name, "move evidence review", "not_loaded", uc.gaps[0], uc.gaps.join("; ")]),
  ].map((r) => withEntity(config, {
    process_id: r[0],
    process: r[1],
    work_item_type: r[2],
    volume: r[3],
    cycle_time: r[4],
    bottleneck: r[5],
  }));
  out["V7_23_external_benchmark_market_corpus.csv"] = [
    ["MER-BENCH-001", "Healthcare lakehouse foundation benchmark placeholder", "Healthcare", "US", "", "", "Use only after approved external benchmark is loaded.", "not_loaded", "Do not benchmark Meridian until corpus evidence is approved."],
    ["MER-BENCH-002", "Analytics operating model benchmark placeholder", "Healthcare", "US", "", "", "Use only after approved external benchmark is loaded.", "not_loaded", "Do not compare 80/20 resource mix to market without sourced benchmark."],
  ].map((r) => ({
    benchmark_id: r[0],
    benchmark_name: r[1],
    industry: r[2],
    geography: r[3],
    range_low: r[4],
    range_high: r[5],
    benchmark_definition: r[6],
    benchmark_basis: r[7],
    recommended_use: r[8],
    ...evidence(config),
  }));
  out["V7_24_infrastructure_cloud_estate.csv"] = [
    ["MER-INFRA-001", "AWS analytics landing zone", "cloud_foundation", "target_not_ready", "critical", "not_loaded"],
    ["MER-INFRA-002", "Databricks on AWS workspace", "lakehouse_platform", "target_not_ready", "critical", "not_loaded"],
    ["MER-INFRA-003", "On-prem SQL Server reporting estate", "legacy_reporting", "current_state", "critical", "on_premise"],
    ["MER-INFRA-004", "BI gateway and extract estate", "reporting_infrastructure", "current_state", "high", "on_premise_and_saas"],
  ].map((r) => withEntity(config, {
    estate_item_id: r[0],
    estate_item_name: r[1],
    infrastructure_category: r[2],
    hosting_deployment_model: r[3],
    criticality: r[4],
    primary_location_region: r[5],
  }));
  return out;
}

function fillHeaders(headers, rows) {
  return rows.map((row) => Object.fromEntries(headers.map((h) => [h, row[h] ?? ""])));
}

function writeDataset(config, outDir) {
  const v6 = v6Rows(config);
  const v7 = v7Rows(config, v6);
  const findings = deriveFindings(config);
  const goldenQuestions = deriveGoldenQuestions(config);
  const v6Dir = path.join(outDir, "templates");
  const v7Dir = path.join(outDir, "v7");
  const derivedDir = path.join(outDir, "derived");
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const rowCounts = {};
  for (const [file, rows] of Object.entries(v6)) {
    const headers = readHeader(path.join(V6_HEADER_ROOT, file));
    writeCsv(path.join(v6Dir, file), headers, fillHeaders(headers, rows));
    rowCounts[`templates/${file}`] = rows.length;
  }
  for (const [file, rows] of Object.entries(v7)) {
    const headers = readHeader(path.join(V7_HEADER_ROOT, file));
    writeCsv(path.join(v7Dir, file), headers, fillHeaders(headers, rows));
    rowCounts[`v7/${file}`] = rows.length;
  }
  writeCsv(path.join(derivedDir, "meridian_moves_current_state_findings.csv"), Object.keys(findings[0]), findings);
  writeCsv(path.join(derivedDir, "meridian_moves_golden_questions_scorecard.csv"), Object.keys(goldenQuestions[0]), goldenQuestions);
  rowCounts["derived/meridian_moves_current_state_findings.csv"] = findings.length;
  rowCounts["derived/meridian_moves_golden_questions_scorecard.csv"] = goldenQuestions.length;

  const dimensions = V7_FILES.map(([file, dimensionKey, label]) => {
    const columns = readHeader(path.join(V7_HEADER_ROOT, file));
    return {
      file,
      dimensionKey,
      label,
      columns,
      metadata: columns.map((col) => ({
        "Client Field": col,
        "Internal Field": col,
        Required: "Observed",
        "Allowed / Format": "Text",
        "Client Instruction": "Generated from manifest-gated tenant config and V6 facts.",
        Example: "",
        "Right Canvas / Module Use": "Home, Intelligence",
      })),
    };
  });
  const tenantFiles = V7_FILES.map(([file, dimensionKey]) => {
    const filePath = path.join(v7Dir, file);
    return {
      file,
      dimensionKey,
      checksumSha256: checksumFile(filePath),
      rows: readCsv(filePath).map((row) => ({
        sourceRowNumber: row.__sourceRowNumber,
        recordName: pickRecordName(row),
        values: Object.fromEntries(Object.entries(row).filter(([k]) => !k.startsWith("__"))),
      })),
    };
  });
  const payload = {
    generatedAt: NOW,
    contractVersion: config.v7ContractVersion,
    contractName: config.v7ContractName,
    sourceTemplateDir: path.join(outDir, "v7"),
    sourceDataDir: config.sourceDataset,
    dimensions,
    tenantPacks: [{
      tenantKey: config.tenantKey,
      tenantName: config.tenantName,
      files: tenantFiles,
    }],
  };
  fs.mkdirSync(path.join(outDir, "azure"), { recursive: true });
  fs.writeFileSync(path.join(outDir, "azure/v7-tenant-load-payload.json"), `${JSON.stringify(payload, null, 2)}\n`);
  const manifest = {
    datasetId: config.datasetId,
    tenantKey: config.tenantKey,
    tenantName: config.tenantName,
    v6ContractVersion: config.v6ContractVersion,
    v7ContractVersion: config.v7ContractVersion,
    sourceBasis: config.sourceBasis,
    rowCounts,
    generatedAt: NOW,
    notAllowedClaims: config.notAllowedClaims,
    commonKnownGaps: config.commonKnownGaps,
  };
  fs.writeFileSync(path.join(outDir, "V6_V7_GENERATED_MANIFEST.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, "README.md"), `# Meridian Health V6/V7 Current-State Pack\n\nSynthetic, PHI-free, planning-grade pack generated by the reusable tenant V6/V7 pipeline. It encodes the current-state facts supplied by the operator and avoids unsupported spend, renewal, ROI, production, or PHI claims.\n\n- V6 files: \`templates/\`\n- V7 files: \`v7/\`\n- Loader payload: \`azure/v7-tenant-load-payload.json\`\n- Derived Move QA: \`derived/\`\n`);
  return { outDir, rowCounts, findings, goldenQuestions, payload };
}

export function buildTenantDataset(config, options = {}) {
  const outDir = options.outDir || path.join(REPO_ROOT, config.sourceDataset);
  return writeDataset(config, outDir);
}

export { REL_TYPES, V7_FILES, deriveFindings, deriveGoldenQuestions, v6Rows, v7Rows };

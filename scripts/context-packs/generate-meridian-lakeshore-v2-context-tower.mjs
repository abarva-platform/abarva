#!/usr/bin/env node
/**
 * Meridian Health + Lakeshore Industries V2 context/corpus/Tower pack generator.
 *
 * Output:
 *   datasets/meridian-health-synthetic-v2/
 *   datasets/lakeshore-industries-synthetic-v2/
 *
 * These are local refresh-ready source packs only. The script does not write to
 * Azure Blob, Postgres, queues, embeddings, or live retrieval indexes.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const GENERATED_AT = '2026-06-18T00:00:00Z';

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function cleanDir(dir) { fs.rmSync(dir, { recursive: true, force: true }); ensureDir(dir); }
function write(root, rel, content) {
  const file = path.join(root, rel);
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, typeof content === 'string' ? content : JSON.stringify(content, null, 2), 'utf8');
}
function esc(value) {
  const s = value == null ? '' : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}
function csv(headers, rows) {
  return [headers.join(','), ...rows.map((row) => headers.map((h) => esc(row[h])).join(','))].join('\n') + '\n';
}
function jsonl(rows) { return rows.map((row) => JSON.stringify(row)).join('\n') + '\n'; }

function dollars(base, ix, step = 1_900_000) { return base + ix * step; }
function pct(ix, base = 62, spread = 31) { return base + (ix * 7) % spread; }

const loadOrder = [
  ['enterprise_operating_model', 'enterprise_profile', 'family-1-enterprise-operating-model/F01_enterprise-profile.yaml', 'enterprise-profile'],
  ['enterprise_operating_model', 'business_org_functions', 'family-1-enterprise-operating-model/F02_business-org-functions.csv', 'business-org-functions'],
  ['enterprise_operating_model', 'it_org_ownership', 'family-1-enterprise-operating-model/F03_it-org-ownership.csv', 'it-org-ownership'],
  ['personas_workforce', 'personas_workforce', 'D19-personas-workforce/D19_personas-workforce.csv', 'personas-workforce'],
  ['enterprise_operating_model', 'capabilities_value_streams', 'family-1-enterprise-operating-model/F04_capabilities-value-streams.csv', 'capabilities-value-streams'],
  ['technology_estate', 'applications_systems', 'family-2-technology-estate/F05_applications-systems.csv', 'applications-systems'],
  ['technology_estate', 'system_function_mapping', 'family-2-technology-estate/F06_system-function-mapping.csv', 'system-function-mapping'],
  ['technology_estate', 'infrastructure_cloud', 'family-2-technology-estate/F07_infrastructure-cloud.csv', 'infrastructure-cloud'],
  ['technology_estate', 'platform_volumetrics', 'family-2-technology-estate/F08_platform-volumetrics.csv', 'platform-volumetrics'],
  ['data_connectivity', 'data_analytics_estate', 'family-3-data-connectivity/F09_data-analytics-estate.csv', 'data-analytics-estate'],
  ['data_connectivity', 'integrations_interfaces', 'family-3-data-connectivity/F10_integrations-interfaces.csv', 'integrations-interfaces'],
  ['financial_commercial', 'vendors_contracts_licenses', 'family-4-financial-commercial/F11_vendors-contracts-licenses.csv', 'vendors-contracts-licenses'],
  ['financial_commercial', 'it_budget_financials', 'family-4-financial-commercial/F12_it-budget-financials.csv', 'it-budget-financials'],
  ['execution_operations', 'initiatives_portfolio', 'family-5-execution-operations/F13_initiatives-portfolio.csv', 'initiatives-portfolio'],
  ['execution_operations', 'operations_service_management', 'family-5-execution-operations/F14_operations-service-management.csv', 'operations-service-management'],
  ['execution_operations', 'kpis_outcome_evidence', 'family-5-execution-operations/F15_kpis-outcome-evidence.csv', 'kpis-outcome-evidence'],
  ['governance_ai_evidence', 'security_risk_compliance', 'family-6-governance-ai-evidence/F16_security-risk-compliance.csv', 'security-risk-compliance'],
  ['governance_ai_evidence', 'ai_automation_footprint', 'family-6-governance-ai-evidence/F17_ai-automation-footprint.csv', 'ai-automation-footprint'],
  ['relationship_graph', 'context_relationships', 'graph/context-relationships.jsonl', 'context-relationships'],
];

function buildManifest(cfg, counts) {
  const entries = loadOrder.map(([family, dimension, file, template_id], index) => ({
    order: index + 1,
    family,
    dimension,
    file,
    template_id,
  }));
  return `tenant_key: ${cfg.tenantKey}
client_id: ${cfg.clientId}
dataset_version: v2
generated_at: ${GENERATED_AT}
industry: ${cfg.industry}
sub_industry: ${cfg.subIndustry}
model_version: 6-family-19-dimension-v1

load_order:
${entries.map((e) => `  - order: ${e.order}
    family: ${e.family}
    dimension: ${e.dimension}
    file: ${e.file}
    template_id: ${e.template_id}`).join('\n')}

summary:
  families: 6
  dimensions: 19
  relationship_edges_approx: ${counts.edges}
  applications: ${counts.applications}
  integrations: ${counts.integrations}
  ai_control_tower_initiatives: ${counts.aiInitiatives}
  corpus_patterns: ${counts.patterns}
`;
}

function appRows(prefix, seedGroups, target, owners) {
  const rows = [];
  let ix = 1;
  for (const group of seedGroups) {
    for (const name of group.names) {
      rows.push({
        application_id: `${prefix}-APP-${String(ix).padStart(3, '0')}`,
        application_name: name,
        domain: group.domain,
        primary_business_owner: owners[(ix - 1) % owners.length],
        technical_owner_team: group.team,
        platform_type: group.platform,
        hosting_model: group.hosting[(ix - 1) % group.hosting.length],
        environment: 'production',
        criticality: group.criticality,
        annual_run_cost_usd: dollars(group.costBase, ix),
        users_or_entities_supported: group.volumeBase + ix * group.volumeStep,
        integration_count: group.integrationBase + (ix % 9),
        data_classification: group.dataClass,
        modernization_state: group.modernization[(ix - 1) % group.modernization.length],
        evidence_id: `${prefix}-EVID-${String((ix % 12) + 1).padStart(3, '0')}`,
      });
      ix += 1;
    }
  }
  while (rows.length < target) {
    rows.push({
      application_id: `${prefix}-APP-${String(ix).padStart(3, '0')}`,
      application_name: `${cfgCase(prefix)} regional workflow app ${ix}`,
      domain: 'regional_operations',
      primary_business_owner: owners[(ix - 1) % owners.length],
      technical_owner_team: `${cfgCase(prefix)} platform services`,
      platform_type: 'custom',
      hosting_model: ix % 3 === 0 ? 'on_prem_vmware' : 'managed_saas',
      environment: 'production',
      criticality: ix % 4 === 0 ? 'high' : 'medium',
      annual_run_cost_usd: dollars(420000, ix, 135000),
      users_or_entities_supported: 600 + ix * 44,
      integration_count: 2 + (ix % 5),
      data_classification: 'internal',
      modernization_state: 'contain_or_replace',
      evidence_id: `${prefix}-EVID-${String((ix % 12) + 1).padStart(3, '0')}`,
    });
    ix += 1;
  }
  return rows.slice(0, target);
}

function cfgCase(prefix) {
  if (prefix === 'MER') return 'Meridian';
  if (prefix === 'LAK') return 'Lakeshore';
  return prefix;
}

function integrationRows(prefix, apps, target, pattern) {
  const rows = [];
  let ix = 1;
  for (const p of pattern) {
    for (let j = 0; j < p.count && rows.length < target; j += 1) {
      const source = apps[(ix * 3 + j) % apps.length];
      const targetApp = apps[(ix * 7 + j + 5) % apps.length];
      rows.push({
        integration_id: `${prefix}-INT-${String(ix).padStart(4, '0')}`,
        source_system: source.application_name,
        target_system: targetApp.application_name,
        interface_type: p.type,
        protocol_or_standard: p.standard,
        cadence: p.cadence,
        data_domain: p.domain,
        avg_daily_volume: p.volumeBase + ix * p.volumeStep,
        latency_sla_minutes: p.latency,
        failure_rate_30d_pct: ((ix % 6) * 0.21 + p.failureBase).toFixed(2),
        owning_team: source.technical_owner_team,
        control_gap: ix % p.gapEvery === 0 ? p.gap : 'none_reported',
        evidence_id: `${prefix}-EVID-${String((ix % 12) + 1).padStart(3, '0')}`,
      });
      ix += 1;
    }
  }
  while (rows.length < target) {
    const source = apps[(ix * 2) % apps.length];
    const targetApp = apps[(ix * 5 + 2) % apps.length];
    rows.push({
      integration_id: `${prefix}-INT-${String(ix).padStart(4, '0')}`,
      source_system: source.application_name,
      target_system: targetApp.application_name,
      interface_type: 'batch_file',
      protocol_or_standard: 'SFTP/CSV',
      cadence: 'daily',
      data_domain: 'finance_operations',
      avg_daily_volume: 5000 + ix * 73,
      latency_sla_minutes: 720,
      failure_rate_30d_pct: (0.18 + (ix % 5) * 0.09).toFixed(2),
      owning_team: source.technical_owner_team,
      control_gap: ix % 17 === 0 ? 'lineage_not_captured' : 'none_reported',
      evidence_id: `${prefix}-EVID-${String((ix % 12) + 1).padStart(3, '0')}`,
    });
    ix += 1;
  }
  return rows;
}

function aiTowerRows(prefix, initiatives, personas, vendors) {
  const registry = initiatives.map((it, ix) => ({
    initiative_id: `${prefix}-AI-${String(ix + 1).padStart(3, '0')}`,
    initiative_name: it.name,
    business_area: it.area,
    owner_role: it.owner,
    stage: it.stage,
    promised_benefit_usd: it.promised,
    measured_value_usd: it.measured,
    value_confidence: it.confidence,
    status: it.status,
    primary_blocker: it.blocker,
    evidence_id: `${prefix}-EVID-${String((ix % 12) + 1).padStart(3, '0')}`,
  }));
  const milestones = registry.flatMap((r, ix) => ['charter_approved', 'data_ready', 'control_ready', 'pilot_exit', 'scale_decision'].map((gate, j) => ({
    initiative_id: r.initiative_id,
    milestone_id: `${r.initiative_id}-MS-${j + 1}`,
    milestone_name: gate,
    due_date: `2026-${String(7 + ((ix + j) % 5)).padStart(2, '0')}-${String(8 + ((ix + j) % 18)).padStart(2, '0')}`,
    status: j < itGate(ix) ? 'complete' : j === itGate(ix) ? 'at_risk' : 'not_started',
    blocker_or_condition: j === itGate(ix) ? registry[ix].primary_blocker : '',
  })));
  const toolUsage = ['M365 Copilot', 'Claude Code', 'Codex', 'Cursor', 'ServiceNow Now Assist', 'Databricks Assistant', 'AWS Bedrock', 'Tableau Pulse', 'Epic AI', 'Kyriba AI'].flatMap((tool, ix) =>
    ['2026-03', '2026-04', '2026-05', '2026-06'].map((period, p) => ({
      period,
      tool_name: tool,
      licensed_users: 120 + ix * 210,
      active_users: Math.floor((120 + ix * 210) * (0.38 + p * 0.06)),
      prompts_or_actions: 8000 + ix * 4200 + p * 3100,
      estimated_hours_saved: 260 + ix * 55 + p * 80,
      quality_or_control_flag: ix % 4 === 0 ? 'needs_evidence_review' : 'normal',
    })),
  );
  const agentOutcomes = initiatives.slice(0, 14).map((it, ix) => ({
    agent_id: `${prefix}-AGENT-${String(ix + 1).padStart(3, '0')}`,
    agent_name: `${it.name} agent/workflow`,
    business_process: it.area,
    work_items_resolved: 900 + ix * 710,
    deflection_pct: 12 + ix * 2,
    exception_rate_pct: (4.8 + ix * 0.7).toFixed(1),
    human_escalation_pct: (22 - ix * 0.8).toFixed(1),
    approval_status: ix % 5 === 0 ? 'restricted' : ix % 3 === 0 ? 'review_required' : 'approved_pilot',
    risk_note: it.blocker,
  }));
  const personaProductivity = personas.slice(0, 14).map((p, ix) => ({
    persona_id: p.persona_id,
    persona_name: p.persona_name,
    baseline_cycle_time_minutes: 45 + ix * 8,
    current_cycle_time_minutes: 36 + ix * 5,
    quality_metric: ix % 3 === 0 ? 'audit_accuracy' : 'first_pass_resolution',
    quality_before_pct: 82 + (ix % 8),
    quality_after_pct: 84 + (ix % 10),
    confidence: ix % 4 === 0 ? 'medium' : 'high',
  }));
  const dora = registry.slice(0, 12).map((r, ix) => ({
    team_or_product: r.business_area,
    deployment_frequency_before: `${2 + (ix % 4)}/month`,
    deployment_frequency_after: `${4 + (ix % 7)}/month`,
    lead_time_before_days: 31 - (ix % 9),
    lead_time_after_days: 18 - (ix % 6),
    change_failure_before_pct: 18 + (ix % 6),
    change_failure_after_pct: 11 + (ix % 5),
    mttr_before_hours: 14 + ix,
    mttr_after_hours: 7 + (ix % 5),
  }));
  const benefit = registry.map((r, ix) => ({
    initiative_id: r.initiative_id,
    metric_basis: ix % 3 === 0 ? 'cost_takeout' : ix % 3 === 1 ? 'cycle_time' : 'risk_reduction',
    promised_benefit_usd: r.promised_benefit_usd,
    measured_value_usd: r.measured_value_usd,
    unrealized_or_blocked_value_usd: Math.max(0, r.promised_benefit_usd - r.measured_value_usd),
    confidence: r.value_confidence,
    evidence_status: ix % 5 === 0 ? 'review_required' : 'source_backed',
  }));
  const spend = registry.map((r, ix) => ({
    initiative_id: r.initiative_id,
    vendor_or_tool: vendors[ix % vendors.length].vendor_name,
    ytd_spend_usd: Math.round(r.promised_benefit_usd * (0.11 + (ix % 5) * 0.018)),
    annual_budget_usd: Math.round(r.promised_benefit_usd * (0.18 + (ix % 4) * 0.021)),
    contract_value_usd: vendors[ix % vendors.length].annual_contract_value_usd,
    renewal_date: vendors[ix % vendors.length].renewal_date,
    unit_economic_note: ix % 4 === 0 ? 'Scale only after evidence gate' : 'Within portfolio threshold',
  }));
  const risk = registry.map((r, ix) => ({
    initiative_id: r.initiative_id,
    risk_id: `${r.initiative_id}-RISK`,
    risk_domain: ix % 4 === 0 ? 'privacy_security' : ix % 4 === 1 ? 'model_risk' : ix % 4 === 2 ? 'clinical_or_operational_safety' : 'financial_control',
    severity: ix % 5 === 0 ? 'critical' : ix % 3 === 0 ? 'high' : 'medium',
    control_status: ix % 5 === 0 ? 'blocked' : ix % 3 === 0 ? 'review_required' : 'approved_with_conditions',
    exception_or_gap: r.blocker,
    owner_role: r.owner_role,
  }));
  const evidence = registry.map((r, ix) => ({
    evidence_item_id: `${r.initiative_id}-EV-${ix + 1}`,
    initiative_id: r.initiative_id,
    source_file: `source-docs/${r.initiative_name.replaceAll(/[^A-Za-z0-9]+/g, '_')}_Evidence_SYNTHETIC.md`,
    source_locator: `section ${2 + (ix % 7)}.${1 + (ix % 4)}`,
    source_timestamp: `2026-06-${String(1 + (ix % 17)).padStart(2, '0')}`,
    review_state: ix % 5 === 0 ? 'review_required' : 'approved',
    confidence: ix % 5 === 0 ? '0.63' : '0.86',
  }));
  const refresh = [{
    refresh_id: `${prefix}-REFRESH-2026-06`,
    period: '2026-06',
    source_freshness: 'local_artifact_generated_not_loaded',
    parser_status: 'not_run',
    approval_state: 'awaiting_backend_refresh',
    notes: 'Synthetic context/corpus/Tower files assembled locally for backend refresh rehearsal.',
  }];
  const actions = registry.filter((_, ix) => ix < 10).map((r, ix) => ({
    action_id: `${r.initiative_id}-ACT`,
    action_title: ix % 3 === 0 ? `Approve guarded pilot for ${r.initiative_name}` : ix % 3 === 1 ? `Close evidence gap for ${r.initiative_name}` : `Sequence dependency before scaling ${r.initiative_name}`,
    priority: ix < 3 ? 'P0' : ix < 7 ? 'P1' : 'P2',
    derived_from: `${r.initiative_id};${r.evidence_id}`,
    decision_owner: r.owner_role,
    next_decision_date: `2026-07-${String(8 + ix).padStart(2, '0')}`,
    expected_impact_usd: Math.max(0, r.promised_benefit_usd - r.measured_value_usd),
  }));
  const modelInventory = registry.map((r, ix) => ({
    model_id: `${r.initiative_id}-MODEL`,
    model_name: `${r.initiative_name} model/service`,
    model_type: ix % 4 === 0 ? 'LLM_workflow' : ix % 4 === 1 ? 'predictive_ml' : ix % 4 === 2 ? 'rules_ml_hybrid' : 'analytics_scoring',
    use_case: r.initiative_name,
    risk_tier: ix % 5 === 0 ? 'tier_1_high' : ix % 3 === 0 ? 'tier_2' : 'tier_3',
    validation_status: ix % 5 === 0 ? 'overdue' : ix % 3 === 0 ? 'conditional' : 'current',
    pii_phi_financial_data: ix % 2 === 0 ? 'yes' : 'limited',
    owner_role: r.owner_role,
  }));
  return { registry, milestones, toolUsage, agentOutcomes, personaProductivity, dora, benefit, spend, risk, evidence, refresh, actions, modelInventory };
}

function itGate(ix) { return 1 + (ix % 4); }

function buildGenericFiles(root, cfg, data) {
  const rows = data;
  write(root, 'family-1-enterprise-operating-model/F01_enterprise-profile.yaml', Object.entries(cfg.profile).map(([k, v]) => `${k}: ${v}`).join('\n') + `\ntenant_key: ${cfg.tenantKey}\nclient_id: ${cfg.clientId}\ngenerated_at: ${GENERATED_AT}\n`);
  write(root, 'family-1-enterprise-operating-model/F02_business-org-functions.csv', csv(['function_id', 'function_name', 'executive_owner_role', 'head_count', 'description'], rows.businessFunctions));
  write(root, 'family-1-enterprise-operating-model/F03_it-org-ownership.csv', csv(['team_id', 'team_name', 'executive_owner_role', 'domain', 'head_count_fte', 'offshore_pct', 'annual_budget_usd'], rows.itOrg));
  write(root, 'D19-personas-workforce/D19_personas-workforce.csv', csv(['persona_id', 'persona_name', 'business_area', 'population_count', 'ai_relevance', 'work_context'], rows.personas));
  write(root, 'family-1-enterprise-operating-model/F04_capabilities-value-streams.csv', csv(['capability_id', 'capability_name', 'value_stream', 'business_owner', 'maturity', 'ai_relevance', 'primary_systems', 'known_gap'], rows.capabilities));
  write(root, 'family-2-technology-estate/F05_applications-systems.csv', csv(['application_id', 'application_name', 'domain', 'primary_business_owner', 'technical_owner_team', 'platform_type', 'hosting_model', 'environment', 'criticality', 'annual_run_cost_usd', 'users_or_entities_supported', 'integration_count', 'data_classification', 'modernization_state', 'evidence_id'], rows.apps));
  write(root, 'family-2-technology-estate/F06_system-function-mapping.csv', csv(['mapping_id', 'application_id', 'application_name', 'business_function', 'process_supported', 'fit_score', 'pain_point', 'move_relevance'], rows.systemMap));
  write(root, 'family-2-technology-estate/F07_infrastructure-cloud.csv', csv(['asset_id', 'asset_name', 'hosting_model', 'platform', 'region_or_datacenter', 'annual_cost_usd', 'resilience_tier', 'owner_team', 'modernization_note'], rows.infrastructure));
  write(root, 'family-2-technology-estate/F08_platform-volumetrics.csv', csv(['metric_id', 'platform_or_system', 'metric_name', 'monthly_volume', 'peak_volume', 'growth_rate_pct', 'sla_target', 'observed_issue'], rows.volumetrics));
  write(root, 'family-3-data-connectivity/F09_data-analytics-estate.csv', csv(['data_asset_id', 'data_asset_name', 'domain', 'source_systems', 'target_platform', 'data_owner', 'freshness', 'quality_score', 'semantic_layer_status', 'move_relevance'], rows.dataAssets));
  write(root, 'family-3-data-connectivity/F10_integrations-interfaces.csv', csv(['integration_id', 'source_system', 'target_system', 'interface_type', 'protocol_or_standard', 'cadence', 'data_domain', 'avg_daily_volume', 'latency_sla_minutes', 'failure_rate_30d_pct', 'owning_team', 'control_gap', 'evidence_id'], rows.integrations));
  write(root, 'family-4-financial-commercial/F11_vendors-contracts-licenses.csv', csv(['vendor_id', 'vendor_name', 'category', 'owned_by', 'annual_contract_value_usd', 'renewal_date', 'criticality', 'license_or_unit_basis', 'commercial_risk', 'evidence_id'], rows.vendors));
  write(root, 'family-4-financial-commercial/F12_it-budget-financials.csv', csv(['budget_id', 'budget_area', 'owner_role', 'run_budget_usd', 'change_budget_usd', 'ai_or_data_budget_usd', 'labor_pct', 'vendor_pct', 'cloud_or_infra_pct', 'budget_pressure'], rows.budgets));
  write(root, 'family-5-execution-operations/F13_initiatives-portfolio.csv', csv(['initiative_id', 'initiative_name', 'business_area', 'owner_role', 'stage', 'budget_usd', 'promised_benefit_usd', 'target_date', 'dependency', 'risk_status', 'move_relevance'], rows.initiatives));
  write(root, 'family-5-execution-operations/F14_operations-service-management.csv', csv(['signal_id', 'service_or_process', 'ticket_or_event_type', 'monthly_volume', 'severity_mix', 'mttr_hours', 'backlog_count', 'automation_candidate', 'root_cause_theme'], rows.ops));
  write(root, 'family-5-execution-operations/F15_kpis-outcome-evidence.csv', csv(['kpi_id', 'kpi_name', 'domain', 'baseline_value', 'current_value', 'target_value', 'measurement_period', 'evidence_id', 'decision_relevance'], rows.kpis));
  write(root, 'family-6-governance-ai-evidence/F16_security-risk-compliance.csv', csv(['control_id', 'control_name', 'domain', 'owner_role', 'status', 'risk_severity', 'evidence_status', 'gap_or_condition', 'regulatory_or_policy_anchor'], rows.controls));
  write(root, 'family-6-governance-ai-evidence/F17_ai-automation-footprint.csv', csv(['ai_asset_id', 'ai_asset_name', 'business_area', 'tool_or_model', 'stage', 'monthly_users_or_cases', 'measured_value_usd', 'risk_tier', 'evidence_status', 'next_gate'], rows.aiFootprint));
  write(root, 'graph/context-relationships.jsonl', jsonl(rows.edges));
}

function writeTower(root, tower) {
  const dir = 'ai-control-tower';
  write(root, `${dir}/T00_ai-investment-super-template.csv`, csv(
    ['initiative_id', 'initiative_name', 'business_area', 'owner_role', 'stage', 'promised_benefit_usd', 'measured_value_usd', 'value_confidence', 'status', 'primary_blocker', 'evidence_id'],
    tower.registry,
  ));
  write(root, `${dir}/T01_initiative-registry.csv`, csv(['initiative_id', 'initiative_name', 'business_area', 'owner_role', 'stage', 'promised_benefit_usd', 'measured_value_usd', 'value_confidence', 'status', 'primary_blocker', 'evidence_id'], tower.registry));
  write(root, `${dir}/T02_project-milestones.csv`, csv(['initiative_id', 'milestone_id', 'milestone_name', 'due_date', 'status', 'blocker_or_condition'], tower.milestones));
  write(root, `${dir}/T03_tool-usage-monthly.csv`, csv(['period', 'tool_name', 'licensed_users', 'active_users', 'prompts_or_actions', 'estimated_hours_saved', 'quality_or_control_flag'], tower.toolUsage));
  write(root, `${dir}/T04_agent-outcomes.csv`, csv(['agent_id', 'agent_name', 'business_process', 'work_items_resolved', 'deflection_pct', 'exception_rate_pct', 'human_escalation_pct', 'approval_status', 'risk_note'], tower.agentOutcomes));
  write(root, `${dir}/T05_persona-productivity.csv`, csv(['persona_id', 'persona_name', 'baseline_cycle_time_minutes', 'current_cycle_time_minutes', 'quality_metric', 'quality_before_pct', 'quality_after_pct', 'confidence'], tower.personaProductivity));
  write(root, `${dir}/T06_dora-delivery-metrics.csv`, csv(['team_or_product', 'deployment_frequency_before', 'deployment_frequency_after', 'lead_time_before_days', 'lead_time_after_days', 'change_failure_before_pct', 'change_failure_after_pct', 'mttr_before_hours', 'mttr_after_hours'], tower.dora));
  write(root, `${dir}/T07_benefit-realization.csv`, csv(['initiative_id', 'metric_basis', 'promised_benefit_usd', 'measured_value_usd', 'unrealized_or_blocked_value_usd', 'confidence', 'evidence_status'], tower.benefit));
  write(root, `${dir}/T08_spend-contracts.csv`, csv(['initiative_id', 'vendor_or_tool', 'ytd_spend_usd', 'annual_budget_usd', 'contract_value_usd', 'renewal_date', 'unit_economic_note'], tower.spend));
  write(root, `${dir}/T09_risk-governance.csv`, csv(['initiative_id', 'risk_id', 'risk_domain', 'severity', 'control_status', 'exception_or_gap', 'owner_role'], tower.risk));
  write(root, `${dir}/T10_evidence-items.csv`, csv(['evidence_item_id', 'initiative_id', 'source_file', 'source_locator', 'source_timestamp', 'review_state', 'confidence'], tower.evidence));
  write(root, `${dir}/T11_refresh-log.csv`, csv(['refresh_id', 'period', 'source_freshness', 'parser_status', 'approval_state', 'notes'], tower.refresh));
  write(root, `${dir}/T12_derived-actions.csv`, csv(['action_id', 'action_title', 'priority', 'derived_from', 'decision_owner', 'next_decision_date', 'expected_impact_usd'], tower.actions));
  write(root, `${dir}/T13_model-ai-inventory.csv`, csv(['model_id', 'model_name', 'model_type', 'use_case', 'risk_tier', 'validation_status', 'pii_phi_financial_data', 'owner_role'], tower.modelInventory));
}

function writeCommonDocs(root, cfg, docs, patterns, goldenQuestions, counts) {
  for (const [file, body] of Object.entries(docs)) write(root, `source-docs/${file}`, body);
  write(root, 'corpus-patterns/move-patterns.jsonl', jsonl(patterns));
  write(root, '99-verification/golden-questions.json', { generated_at: GENERATED_AT, tenant_key: cfg.tenantKey, golden_questions: goldenQuestions });
  write(root, '99-verification/expected-row-counts.json', counts);
  write(root, 'README.md', `# ${cfg.companyName} synthetic V2 context, corpus, and AI Control Tower pack

Generated at: ${GENERATED_AT}

This pack is a local backend-refresh input for the 6-family / 19-dimension Intelligence context layer plus AI Control Tower monthly feeds. It is synthetic but intentionally modeled on large real enterprises in the relevant sector.

## Refresh truth

- Local artifact generated: yes
- Local parse/preflight passed: generated row-count check only
- Product loader/API accepted upload: not run
- Azure Blob/object storage staged originals: not run
- Queue/private worker handoff: not run
- Parser extracted text/tables/facts with citations: not run
- Context rows/facts/chunks committed to client data plane: not run
- Embeddings/search index refreshed: not run
- Live signed-in retrieval or answer QA proved context usable: not run

## Generated contents

- 19 context dimensions across 6 families
- AI Control Tower T00-T13 feeds
- Source-document narratives for corpus ingestion
- Move/corpus patterns for Intelligence and Moves
- Relationship graph edges
- Golden questions for post-refresh QA

## Intended demo use

${cfg.demoUse}
`);
}

function edgeRows(prefix, apps, capabilities, initiatives, dataAssets, aiFootprint, target) {
  const rows = [];
  let ix = 1;
  for (const app of apps) {
    rows.push({ edge_id: `${prefix}-EDGE-${String(ix++).padStart(4, '0')}`, from_type: 'application', from_id: app.application_id, to_type: 'capability', to_id: capabilities[ix % capabilities.length].capability_id, relationship: 'supports', confidence: 0.86 });
    if (ix % 3 === 0) rows.push({ edge_id: `${prefix}-EDGE-${String(ix++).padStart(4, '0')}`, from_type: 'application', from_id: app.application_id, to_type: 'data_asset', to_id: dataAssets[ix % dataAssets.length].data_asset_id, relationship: 'produces_or_consumes', confidence: 0.82 });
  }
  for (const initiative of initiatives) {
    rows.push({ edge_id: `${prefix}-EDGE-${String(ix++).padStart(4, '0')}`, from_type: 'initiative', from_id: initiative.initiative_id, to_type: 'capability', to_id: capabilities[ix % capabilities.length].capability_id, relationship: 'changes', confidence: 0.88 });
    rows.push({ edge_id: `${prefix}-EDGE-${String(ix++).padStart(4, '0')}`, from_type: 'initiative', from_id: initiative.initiative_id, to_type: 'application', to_id: apps[ix % apps.length].application_id, relationship: 'depends_on', confidence: 0.8 });
  }
  for (const ai of aiFootprint) {
    rows.push({ edge_id: `${prefix}-EDGE-${String(ix++).padStart(4, '0')}`, from_type: 'ai_asset', from_id: ai.ai_asset_id, to_type: 'initiative', to_id: initiatives[ix % initiatives.length].initiative_id, relationship: 'evidence_for', confidence: 0.78 });
  }
  while (rows.length < target) {
    rows.push({ edge_id: `${prefix}-EDGE-${String(ix++).padStart(4, '0')}`, from_type: 'data_asset', from_id: dataAssets[ix % dataAssets.length].data_asset_id, to_type: 'capability', to_id: capabilities[ix % capabilities.length].capability_id, relationship: 'measures', confidence: 0.77 });
  }
  return rows.slice(0, target);
}

function meridianConfig() {
  const prefix = 'MER';
  const owners = ['Chief Medical Officer', 'Chief Health Plan Officer', 'Chief Digital & Information Officer', 'CFO', 'Chief Operating Officer', 'Chief Nursing Officer', 'Chief Compliance Officer', 'Chief Customer Experience Officer'];
  const businessFunctions = [
    ['MER-BF-001', 'Ambulatory and Primary Care', 'Chief Medical Officer', 18500, 'Primary care, clinics, care-team workflows, MyChart adoption'],
    ['MER-BF-002', 'Hospital Operations', 'Chief Operating Officer', 22200, 'Acute facilities, perioperative, bed management, transfer center'],
    ['MER-BF-003', 'Health Plan Operations', 'Chief Health Plan Officer', 6200, 'Membership, claims, prior auth, utilization management, provider network'],
    ['MER-BF-004', 'Pharmacy Services', 'Chief Pharmacy Officer', 3700, 'Retail/specialty pharmacy, PBM interfaces, medication adherence'],
    ['MER-BF-005', 'Revenue Cycle and Coding', 'VP Revenue Cycle', 5100, 'Registration, charge capture, coding, denials, payment posting'],
    ['MER-BF-006', 'Member and Patient Contact Center', 'Chief Customer Experience Officer', 4200, 'Scheduling, claims questions, benefits, care navigation'],
    ['MER-BF-007', 'Quality, STAR and HEDIS', 'Chief Quality Officer', 1250, 'Clinical quality, HEDIS, STAR, attribution, provider performance'],
    ['MER-BF-008', 'Finance and Actuarial', 'CFO', 1800, 'GL, FP&A, capitation, cost-of-care, product margin'],
    ['MER-BF-009', 'Population Health and VBC', 'SVP Population Health', 1600, 'Risk stratification, care gaps, chronic disease panels'],
    ['MER-BF-010', 'Data, Analytics and AI', 'Chief Data Officer', 980, 'Enterprise analytics, ML, semantic layer, data governance'],
    ['MER-BF-011', 'Cybersecurity, Privacy and Compliance', 'CISO', 760, 'HIPAA, HITRUST, SOC, third-party risk, model governance'],
    ['MER-BF-012', 'Digital and IT', 'Chief Digital & Information Officer', 6100, 'EHR, payer core, cloud migration, applications, service management'],
    ['MER-BF-013', 'Provider Network Management', 'Chief Network Officer', 910, 'Contracts, credentialing, network adequacy, provider benchmarking'],
    ['MER-BF-014', 'Clinical Informatics', 'Chief Clinical Informatics Officer', 640, 'Epic optimization, clinical decision support, safety review'],
    ['MER-BF-015', 'Enterprise Transformation Office', 'Chief Strategy Officer', 430, 'Databricks on AWS migration, automation portfolio, value office'],
  ].map(([function_id, function_name, executive_owner_role, head_count, description]) => ({ function_id, function_name, executive_owner_role, head_count, description }));
  const itOrg = [
    ['MER-IT-001', 'Office of CDIO', 'Chief Digital & Information Officer', 'technology_leadership', 90, 0, 41000000],
    ['MER-IT-002', 'Epic and Clinical Systems', 'VP Clinical Platforms', 'ehr', 820, 8, 188000000],
    ['MER-IT-003', 'Health Plan Core and Claims Platforms', 'VP Health Plan Technology', 'payer_core', 590, 12, 142000000],
    ['MER-IT-004', 'Data Platform Migration Office', 'Chief Data Officer', 'databricks_aws_lakehouse', 310, 15, 126000000],
    ['MER-IT-005', 'Integration and Interoperability', 'VP Integration', 'hl7_fhir_edi_api', 340, 10, 78000000],
    ['MER-IT-006', 'Contact Center and CRM Platforms', 'VP Patient Experience Tech', 'contact_center_crm', 260, 18, 69000000],
    ['MER-IT-007', 'Finance, ERP and Reporting', 'VP Corporate Systems', 'erp_finance', 240, 20, 62000000],
    ['MER-IT-008', 'Security, Privacy and Resilience', 'CISO', 'cyber_privacy', 760, 6, 154000000],
    ['MER-IT-009', 'Cloud and Infrastructure', 'VP Infrastructure', 'aws_network_datacenter', 510, 14, 166000000],
    ['MER-IT-010', 'ServiceNow and IT Operations', 'VP IT Operations', 'itsm_observability', 220, 12, 52000000],
    ['MER-IT-011', 'AI Governance and Automation Office', 'Chief Data Officer', 'ai_governance', 115, 5, 38000000],
    ['MER-IT-012', 'Developer Experience and DevSecOps', 'VP Engineering', 'devex', 180, 20, 34000000],
  ].map(([team_id, team_name, executive_owner_role, domain, head_count_fte, offshore_pct, annual_budget_usd]) => ({ team_id, team_name, executive_owner_role, domain, head_count_fte, offshore_pct, annual_budget_usd }));
  const personas = [
    ['MER-PER-001', 'Primary care physician', 'Ambulatory', 6700, 'High', 'Clinical documentation, inbox, care gaps, longitudinal patient history'],
    ['MER-PER-002', 'Care manager', 'Population Health', 2100, 'High', 'Care gaps, risk panels, patient outreach, chronic condition programs'],
    ['MER-PER-003', 'Utilization management nurse', 'Health Plan', 890, 'High', 'Prior authorization, medical necessity, policy evidence, appeals'],
    ['MER-PER-004', 'Claims examiner', 'Claims', 1450, 'High', 'Adjudication exceptions, payment integrity, edits, provider disputes'],
    ['MER-PER-005', 'Contact center agent', 'Member Services', 3300, 'High', 'Intent detection, benefits, claims status, next-best-action'],
    ['MER-PER-006', 'Provider quality analyst', 'Quality', 520, 'High', 'HEDIS, STAR, attribution, provider benchmarking, measure closure'],
    ['MER-PER-007', 'Revenue cycle coder', 'Revenue Cycle', 1250, 'High', 'Charge capture, CDI, denials, coding audit, compliance'],
    ['MER-PER-008', 'Actuary', 'Finance', 210, 'Medium', 'Product margin, capitation, risk adjustment, cost-of-care'],
    ['MER-PER-009', 'Financial analyst', 'Finance', 640, 'Medium', 'GL, close, provider contract accruals, reconciliation'],
    ['MER-PER-010', 'Data engineer', 'Data Platform', 310, 'High', 'FHIR, EDI, claims, clinical, pharmacy pipelines, quality rules'],
    ['MER-PER-011', 'Clinical informaticist', 'Clinical Informatics', 380, 'High', 'Epic workflows, order sets, CDS safety, physician adoption'],
    ['MER-PER-012', 'Privacy analyst', 'Compliance', 160, 'High', 'HIPAA, minimum necessary, PHI approvals, model review'],
    ['MER-PER-013', 'Cloud platform engineer', 'AWS Lakehouse', 220, 'High', 'Databricks on AWS, Unity Catalog, jobs, networking, FinOps'],
    ['MER-PER-014', 'Provider contracting manager', 'Network', 260, 'Medium', 'Contract terms, attribution, leakage, provider scorecards'],
  ].map(([persona_id, persona_name, business_area, population_count, ai_relevance, work_context]) => ({ persona_id, persona_name, business_area, population_count, ai_relevance, work_context }));
  const capabilities = [
    ['MER-CAP-001', 'Longitudinal patient/member 360', 'Care and cost insight', 'Chief Data Officer', 'emerging', 'critical', 'Epic; claims core; pharmacy; Databricks AWS', 'Clinical and claims identifiers are not harmonized'],
    ['MER-CAP-002', 'Prior authorization automation foundation', 'Utilization management', 'Chief Health Plan Officer', 'fragmented', 'critical', 'Claims core; UM platform; policy repository', 'Policy evidence and clinical record retrieval are manual'],
    ['MER-CAP-003', 'Call center next-best-action', 'Member experience', 'Chief Customer Experience Officer', 'pilot', 'critical', 'Genesys; Salesforce; claims; CRM; transcripts', 'Real-time context missing across claims and care history'],
    ['MER-CAP-004', 'HEDIS and STAR provider performance', 'Clinical quality', 'Chief Quality Officer', 'maturing', 'high', 'Epic; claims; provider network; quality warehouse', 'Attribution and measure closure lag'],
    ['MER-CAP-005', 'Cost-of-care and margin by population', 'Finance and VBC', 'CFO', 'fragmented', 'critical', 'Claims; capitation; contracts; GL; Databricks', 'GL and claims economics not joined at decision grain'],
    ['MER-CAP-006', 'Payment integrity and leakage detection', 'Claims integrity', 'VP Payment Integrity', 'emerging', 'high', 'Claims core; provider network; analytics', 'FWA patterns are episodic and not operationalized'],
    ['MER-CAP-007', 'Automated close and financial reporting', 'Finance operations', 'Controller', 'fragmented', 'medium', 'ERP; claims accruals; provider contracts; Tableau', 'Manual reconciliation remains high'],
    ['MER-CAP-008', 'Clinical documentation ambient AI', 'Clinical productivity', 'Chief Medical Officer', 'pilot', 'high', 'Epic; Abridge; Nuance DAX; Suki', 'Specialty coverage and documentation quality gates'],
    ['MER-CAP-009', 'Data product governance and semantic layer', 'Enterprise data', 'Chief Data Officer', 'nascent', 'critical', 'Databricks; Unity Catalog; BI tools', 'No certified semantic layer for cross-domain KPIs'],
    ['MER-CAP-010', 'FHIR and interoperability operations', 'Regulatory interoperability', 'Chief Compliance Officer', 'maturing', 'high', 'FHIR gateway; EDI; HIE; Epic', 'FHIR API and claims pipeline controls separate'],
  ].map(([capability_id, capability_name, value_stream, business_owner, maturity, ai_relevance, primary_systems, known_gap]) => ({ capability_id, capability_name, value_stream, business_owner, maturity, ai_relevance, primary_systems, known_gap }));
  const apps = appRows(prefix, [
    { domain: 'clinical_ehr', team: 'Epic and Clinical Systems', platform: 'package', hosting: ['vendor_hosted', 'on_prem_vmware'], criticality: 'critical', dataClass: 'phi', costBase: 5_200_000, volumeBase: 4_700_000, volumeStep: 8400, integrationBase: 18, modernization: ['optimize', 'extend_to_lakehouse'], names: ['Epic Hyperspace', 'Epic MyChart', 'Epic Cadence', 'Epic Resolute PB', 'Epic Resolute HB', 'Epic Healthy Planet', 'Epic Cogito', 'Epic Clarity', 'Epic Caboodle', 'Epic Cosmos connector', 'Epic Beaker', 'Epic Willow'] },
    { domain: 'payer_claims', team: 'Health Plan Core and Claims Platforms', platform: 'package', hosting: ['on_prem_aix_or_linux', 'managed_saas'], criticality: 'critical', dataClass: 'phi_pii_financial', costBase: 3_900_000, volumeBase: 1_900_000, volumeStep: 12100, integrationBase: 22, modernization: ['contain_and_integrate', 'lakehouse_feed_required'], names: ['HealthRules Payor', 'Facets legacy claims', 'QNXT Medicare Advantage', 'TriZetto provider pricing', 'Evolent care management', 'InterQual authorization', 'MHK quality platform', 'Optum payment integrity', 'Change Healthcare EDI gateway', 'Availity provider portal'] },
    { domain: 'contact_center_crm', team: 'Contact Center and CRM Platforms', platform: 'saas', hosting: ['managed_saas'], criticality: 'high', dataClass: 'phi_pii', costBase: 1_700_000, volumeBase: 860_000, volumeStep: 5200, integrationBase: 11, modernization: ['agent_assist_candidate', 'real_time_context_gap'], names: ['Genesys Cloud CX', 'Salesforce Health Cloud', 'Twilio Flex SMS', 'Verint workforce management', 'NICE call recording', 'Sprinklr digital service', 'Medallia experience signals', 'Luma Health scheduling'] },
    { domain: 'data_analytics', team: 'Data Platform Migration Office', platform: 'data_platform', hosting: ['on_prem_oracle_exadata', 'on_prem_hadoop', 'aws_databricks_target'], criticality: 'critical', dataClass: 'phi_pii_financial', costBase: 2_500_000, volumeBase: 22_000_000, volumeStep: 76000, integrationBase: 30, modernization: ['migrate_to_databricks_on_aws', 'govern_with_unity_catalog'], names: ['Oracle EDW clinical mart', 'Teradata claims mart', 'Hadoop raw zone', 'Informatica PowerCenter', 'Tableau Server', 'BusinessObjects', 'SAS Grid', 'Databricks AWS Lakehouse', 'Unity Catalog', 'dbt semantic layer', 'Collibra catalog', 'MuleSoft API analytics'] },
    { domain: 'finance_corporate', team: 'Finance, ERP and Reporting', platform: 'erp_package', hosting: ['managed_saas', 'on_prem_vmware'], criticality: 'high', dataClass: 'financial_pii', costBase: 1_300_000, volumeBase: 180_000, volumeStep: 700, integrationBase: 8, modernization: ['stabilize', 'automate_close_candidate'], names: ['Workday Financials', 'Workday HCM', 'Oracle Hyperion Planning', 'BlackLine close', 'Coupa procurement', 'Kyriba treasury', 'ServiceNow SPM', 'Adaptive planning'] },
    { domain: 'security_operations', team: 'Security, Privacy and Resilience', platform: 'security_tool', hosting: ['managed_saas', 'aws'], criticality: 'critical', dataClass: 'security_phi_metadata', costBase: 920_000, volumeBase: 120_000, volumeStep: 2300, integrationBase: 7, modernization: ['operate', 'zero_trust_extend'], names: ['Okta IAM', 'CrowdStrike Falcon', 'Zscaler ZIA/ZPA', 'Palo Alto Prisma', 'Splunk Cloud', 'Proofpoint', 'ServiceNow IRM', 'BigID discovery'] },
  ], 92, owners);
  const integrations = integrationRows(prefix, apps, 132, [
    { count: 28, type: 'HL7', standard: 'HL7 v2 ADT/ORM/ORU', cadence: 'near_real_time', domain: 'clinical', volumeBase: 240000, volumeStep: 8200, latency: 15, failureBase: 0.22, gapEvery: 9, gap: 'interface_ack_not_linked_to_data_quality_rule' },
    { count: 26, type: 'FHIR API', standard: 'FHIR R4', cadence: 'near_real_time', domain: 'interoperability', volumeBase: 120000, volumeStep: 5100, latency: 10, failureBase: 0.18, gapEvery: 8, gap: 'scope_and_consent_controls_need_unification' },
    { count: 24, type: 'EDI', standard: 'X12 837/835/270/271/278', cadence: 'batch_intraday', domain: 'claims', volumeBase: 680000, volumeStep: 15000, latency: 240, failureBase: 0.31, gapEvery: 6, gap: 'claim_traceability_missing_between_edit_and_payment' },
    { count: 18, type: 'ETL', standard: 'Informatica/Oracle extracts', cadence: 'nightly', domain: 'analytics', volumeBase: 2100000, volumeStep: 53000, latency: 1440, failureBase: 0.42, gapEvery: 5, gap: 'batch_lineage_not_ready_for_ai' },
    { count: 16, type: 'streaming', standard: 'Kafka/FHIR events target', cadence: 'event_driven', domain: 'call_center', volumeBase: 82000, volumeStep: 3300, latency: 5, failureBase: 0.16, gapEvery: 7, gap: 'real_time_identity_resolution_gap' },
  ]);
  const systemMap = apps.slice(0, 80).map((a, ix) => ({
    mapping_id: `MER-MAP-${String(ix + 1).padStart(3, '0')}`,
    application_id: a.application_id,
    application_name: a.application_name,
    business_function: businessFunctions[ix % businessFunctions.length].function_name,
    process_supported: capabilities[ix % capabilities.length].capability_name,
    fit_score: pct(ix, 54, 42),
    pain_point: ix % 4 === 0 ? 'Data must be manually reconciled before decision use' : ix % 4 === 1 ? 'Workflow is locked in legacy package screens' : ix % 4 === 2 ? 'Controls are strong but evidence is not machine-readable' : 'Real-time signal not available to front-line role',
    move_relevance: ['Databricks lakehouse migration', 'prior auth automation', 'call center optimization', 'quality/provider performance', 'cost transparency'][ix % 5],
  }));
  const infrastructure = ['Primary on-prem clinical datacenter', 'Secondary DR datacenter', 'AWS landing zone', 'AWS Databricks workspace', 'PrivateLink integration VPC', 'Epic BLOB/image archive', 'Oracle Exadata cluster', 'Hadoop raw-data cluster', 'Splunk Cloud ingest', 'Genesys Cloud connectivity', 'FHIR API gateway', 'Enterprise VPN/SDWAN'].map((asset_name, ix) => ({
    asset_id: `MER-INF-${String(ix + 1).padStart(3, '0')}`,
    asset_name,
    hosting_model: ix < 3 ? 'on_prem_or_hybrid' : ix < 8 ? 'aws_or_migration_target' : 'managed_saas',
    platform: ['VMware/Linux', 'AIX/Oracle', 'AWS VPC', 'Databricks on AWS', 'MuleSoft', 'NetApp', 'Oracle Exadata', 'Hadoop', 'Splunk', 'Genesys Cloud', 'API Gateway', 'Cisco SDWAN'][ix],
    region_or_datacenter: ix % 3 === 0 ? 'US-East-1' : ix % 3 === 1 ? 'Central DC' : 'Western DR',
    annual_cost_usd: dollars(2_800_000, ix, 1_125_000),
    resilience_tier: ix < 8 ? 'tier_1' : 'tier_2',
    owner_team: itOrg[ix % itOrg.length].team_name,
    modernization_note: ix === 3 ? 'Target platform for clinical plus claims lakehouse' : ix < 2 ? 'Current dependency and migration constraint' : 'Must publish evidence to context layer',
  }));
  const volumetrics = ['claims per month', 'encounters per month', 'pharmacy fills per month', 'call transcripts per month', 'prior auth requests per month', 'HEDIS measure rows per month', 'provider contracts', 'GL journal lines', 'FHIR API calls per month', 'clinical notes per month', 'payment integrity leads', 'close reconciliations'].map((metric_name, ix) => ({
    metric_id: `MER-VOL-${String(ix + 1).padStart(3, '0')}`,
    platform_or_system: apps[ix].application_name,
    metric_name,
    monthly_volume: 120000 + ix * 185000,
    peak_volume: 190000 + ix * 240000,
    growth_rate_pct: 5 + (ix % 8) * 2,
    sla_target: ix % 3 === 0 ? 'near real time' : ix % 3 === 1 ? 'daily by 6am' : 'monthly close day 3',
    observed_issue: ix % 4 === 0 ? 'manual validation before executive use' : ix % 4 === 1 ? 'source-to-report lineage not certified' : ix % 4 === 2 ? 'identity matching incomplete' : 'sufficient for baseline reporting',
  }));
  const dataAssets = [
    ['MER-DATA-001', 'Longitudinal patient/member gold record', 'clinical_claims_pharmacy', 'Epic;Claims;Pharmacy;CRM', 'Databricks AWS', 'Chief Data Officer', 'target near real time', 58, 'not_ready', 'Unified clinical + claims data'],
    ['MER-DATA-002', 'Prior authorization evidence corpus', 'utilization_management', 'UM;Epic;Policy repo;Claims', 'Databricks AWS', 'Chief Health Plan Officer', 'daily target', 52, 'not_ready', 'Data foundation for automation'],
    ['MER-DATA-003', 'Call center transcript and intent lake', 'member_experience', 'Genesys;Salesforce;Claims;CRM', 'Databricks AWS', 'Chief Customer Experience Officer', 'hourly target', 49, 'nascent', 'Call center optimization'],
    ['MER-DATA-004', 'HEDIS and STAR quality mart', 'quality', 'Epic;Claims;Provider network', 'Databricks AWS', 'Chief Quality Officer', 'weekly target', 63, 'partial', 'Provider quality performance'],
    ['MER-DATA-005', 'Cost-of-care and product margin mart', 'finance', 'Claims;Contracts;GL;Capitation', 'Databricks AWS', 'CFO', 'monthly target', 46, 'not_ready', 'Cost transparency'],
    ['MER-DATA-006', 'Payment integrity pattern library', 'claims_integrity', 'Claims;Provider;FWA cases', 'Databricks AWS', 'VP Payment Integrity', 'daily target', 55, 'nascent', 'Payment integrity leakage reduction'],
    ['MER-DATA-007', 'Automated close semantic layer', 'finance_reporting', 'ERP;Claims accruals;Provider contracts', 'dbt semantic layer', 'Controller', 'monthly close day 2', 51, 'not_ready', 'Automated close reporting'],
    ['MER-DATA-008', 'Provider attribution and contract economics', 'provider_network', 'Provider contracts;Claims;Quality', 'Databricks AWS', 'Chief Network Officer', 'weekly target', 57, 'partial', 'Provider benchmarking and margin'],
    ['MER-DATA-009', 'Clinical documentation AI evidence store', 'clinical_ai', 'Epic;Ambient vendors;Audit review', 'Unity Catalog', 'Chief Medical Officer', 'daily target', 61, 'partial', 'Ambient documentation scaling'],
  ].map(([data_asset_id, data_asset_name, domain, source_systems, target_platform, data_owner, freshness, quality_score, semantic_layer_status, move_relevance]) => ({ data_asset_id, data_asset_name, domain, source_systems, target_platform, data_owner, freshness, quality_score, semantic_layer_status, move_relevance }));
  const vendors = ['Epic', 'Databricks', 'AWS', 'Microsoft/Nuance', 'Abridge', 'Suki', 'Genesys', 'Salesforce', 'Change Healthcare', 'Optum', 'HealthEdge', 'TriZetto', 'MuleSoft', 'Informatica', 'Tableau', 'SAS', 'Collibra', 'ServiceNow', 'Okta', 'CrowdStrike', 'Zscaler', 'Workday', 'Oracle', 'BlackLine', 'Coupa', 'Kyriba', 'NICE', 'Verint', 'Availity', 'MHK', 'InterQual', 'Innovaccer', 'Health Catalyst', 'BigID'].map((vendor_name, ix) => ({
    vendor_id: `MER-VEN-${String(ix + 1).padStart(3, '0')}`,
    vendor_name,
    category: ix < 6 ? 'clinical_ai_or_ehr' : ix < 13 ? 'payer_platform_or_integration' : ix < 18 ? 'data_and_analytics' : ix < 22 ? 'security' : 'corporate_finance_operations',
    owned_by: owners[ix % owners.length],
    annual_contract_value_usd: dollars(1_200_000, ix, 1_075_000),
    renewal_date: `2026-${String(7 + (ix % 6)).padStart(2, '0')}-${String(5 + (ix % 20)).padStart(2, '0')}`,
    criticality: ix < 18 ? 'high' : 'medium',
    license_or_unit_basis: ix % 3 === 0 ? 'enterprise subscription' : ix % 3 === 1 ? 'per user / per provider' : 'usage plus platform',
    commercial_risk: ix % 5 === 0 ? 'renewal before evidence gate' : ix % 4 === 0 ? 'overlapping capability' : 'normal',
    evidence_id: `MER-EVID-${String((ix % 12) + 1).padStart(3, '0')}`,
  }));
  const budgets = itOrg.map((t, ix) => ({
    budget_id: `MER-BUD-${String(ix + 1).padStart(3, '0')}`,
    budget_area: t.team_name,
    owner_role: t.executive_owner_role,
    run_budget_usd: Math.round(t.annual_budget_usd * 0.62),
    change_budget_usd: Math.round(t.annual_budget_usd * 0.31),
    ai_or_data_budget_usd: Math.round(t.annual_budget_usd * (ix === 3 ? 0.42 : 0.08 + (ix % 3) * 0.03)),
    labor_pct: 32 + (ix % 5) * 4,
    vendor_pct: 38 + (ix % 4) * 5,
    cloud_or_infra_pct: 18 + (ix % 4) * 4,
    budget_pressure: ix === 3 ? 'Databricks migration spend must show phased value' : ix % 4 === 0 ? 'run cost crowding out change' : 'within plan',
  }));
  const moveUseCases = [
    ['MER-INIT-001', 'Databricks AWS clinical + claims lakehouse foundation', 'Enterprise data', 'Chief Data Officer', 'mobilize', 58000000, 93000000, '2027-03-31', 'PHI networking, Unity Catalog, EMR/claims identity', 'high', 'Unified clinical + claims data'],
    ['MER-INIT-002', 'Unified semantic layer for automation-ready data products', 'Data governance', 'Chief Data Officer', 'design', 18000000, 42000000, '2026-12-15', 'certified metric ownership', 'high', 'Data foundation for automation'],
    ['MER-INIT-003', 'Prior authorization automation evidence cockpit', 'Utilization management', 'Chief Health Plan Officer', 'pilot', 22000000, 61000000, '2027-02-15', 'clinical record retrieval and policy evidence', 'critical', 'Prior auth automation'],
    ['MER-INIT-004', 'Call center agent assist and next-best-action', 'Member experience', 'Chief Customer Experience Officer', 'pilot', 26000000, 68000000, '2027-01-20', 'real-time claims/member context', 'high', 'Call center optimization'],
    ['MER-INIT-005', 'HEDIS/STAR provider quality performance mart', 'Clinical quality', 'Chief Quality Officer', 'build', 16000000, 52000000, '2026-11-30', 'attribution and measure closure rules', 'medium', 'Provider quality performance'],
    ['MER-INIT-006', 'Cost-of-care and margin transparency by population', 'Finance', 'CFO', 'design', 19000000, 76000000, '2027-04-30', 'claims, capitation, provider contracts, GL join', 'high', 'End-to-end cost transparency'],
    ['MER-INIT-007', 'Payment integrity leakage reduction analytics', 'Claims integrity', 'VP Payment Integrity', 'pilot', 14000000, 55000000, '2027-01-31', 'provider pattern features and FWA feedback loop', 'high', 'Payment integrity'],
    ['MER-INIT-008', 'Automated close and management reporting pipelines', 'Finance operations', 'Controller', 'mobilize', 12000000, 31000000, '2026-12-31', 'claims accrual and provider contract reconciliations', 'medium', 'Automated close'],
    ['MER-INIT-009', 'Ambient documentation scale with safety review', 'Clinical productivity', 'Chief Medical Officer', 'scale_gate', 24000000, 47000000, '2026-10-15', 'specialty-specific quality evidence', 'medium', 'Clinical productivity'],
    ['MER-INIT-010', 'Epic to lakehouse FHIR/HL7 modernization', 'Interoperability', 'VP Integration', 'build', 21000000, 36000000, '2027-05-15', 'interface retirement sequencing', 'high', 'Lakehouse migration dependency'],
    ['MER-INIT-011', 'Provider network contract analytics', 'Provider network', 'Chief Network Officer', 'design', 9000000, 27000000, '2027-03-01', 'provider contract terms not machine-readable', 'medium', 'Cost and quality benchmarking'],
    ['MER-INIT-012', 'Responsible AI and PHI model governance operating model', 'Governance', 'Chief Compliance Officer', 'mobilize', 8000000, 19000000, '2026-09-30', 'HIPAA review workflow and model inventory', 'high', 'AI governance foundation'],
  ].map(([initiative_id, initiative_name, business_area, owner_role, stage, budget_usd, promised_benefit_usd, target_date, dependency, risk_status, move_relevance]) => ({ initiative_id, initiative_name, business_area, owner_role, stage, budget_usd, promised_benefit_usd, target_date, dependency, risk_status, move_relevance }));
  const ops = ['Epic interface failures', 'claims EDI rejects', 'call transcript ingest backlog', 'prior auth missing clinical evidence', 'provider attribution disputes', 'HEDIS measure exceptions', 'GL to claims reconciliation defects', 'payment integrity false positives', 'Databricks job failures', 'Unity Catalog access exceptions', 'FHIR consent scope tickets', 'Tableau certified data requests'].map((service_or_process, ix) => ({
    signal_id: `MER-OPS-${String(ix + 1).padStart(3, '0')}`,
    service_or_process,
    ticket_or_event_type: ix % 3 === 0 ? 'incident' : ix % 3 === 1 ? 'data_quality' : 'service_request',
    monthly_volume: 160 + ix * 58,
    severity_mix: ix % 4 === 0 ? '18% high / 62% medium / 20% low' : '8% high / 54% medium / 38% low',
    mttr_hours: 5 + ix * 1.3,
    backlog_count: 38 + ix * 14,
    automation_candidate: ix % 2 === 0 ? 'yes' : 'partial',
    root_cause_theme: ix % 4 === 0 ? 'source data quality' : ix % 4 === 1 ? 'manual triage' : ix % 4 === 2 ? 'identity/attribution mismatch' : 'control evidence gap',
  }));
  const kpis = ['member first call resolution', 'prior auth turnaround hours', 'claims auto-adjudication rate', 'HEDIS gap closure rate', 'STAR weighted measure score', 'cost-of-care PMPM variance', 'payment integrity recoveries', 'close cycle days', 'manual reconciliation hours', 'clinical inbox time saved', 'lakehouse certified data products', 'provider quality benchmark adoption'].map((kpi_name, ix) => ({
    kpi_id: `MER-KPI-${String(ix + 1).padStart(3, '0')}`,
    kpi_name,
    domain: ['operations', 'clinical', 'finance', 'data'][ix % 4],
    baseline_value: ix % 3 === 0 ? `${72 - ix}%` : ix % 3 === 1 ? `${48 + ix} hrs` : `$${12 + ix}M`,
    current_value: ix % 3 === 0 ? `${75 - ix}%` : ix % 3 === 1 ? `${44 + ix} hrs` : `$${16 + ix}M`,
    target_value: ix % 3 === 0 ? `${84 - Math.floor(ix / 2)}%` : ix % 3 === 1 ? `${28 + ix} hrs` : `$${28 + ix}M`,
    measurement_period: '2026-Q2',
    evidence_id: `MER-EVID-${String((ix % 12) + 1).padStart(3, '0')}`,
    decision_relevance: moveUseCases[ix % moveUseCases.length].move_relevance,
  }));
  const controls = ['HIPAA minimum necessary', 'HITRUST access evidence', 'FHIR consent scope control', 'PHI model review', 'clinical safety review', 'claims payment control', 'CMS interoperability control', 'HEDIS audit trail', 'SOX GL reconciliation', 'vendor BAA review', 'AI model inventory', 'data retention and deletion'].map((control_name, ix) => ({
    control_id: `MER-CTRL-${String(ix + 1).padStart(3, '0')}`,
    control_name,
    domain: ix % 4 === 0 ? 'privacy' : ix % 4 === 1 ? 'security' : ix % 4 === 2 ? 'clinical_safety' : 'financial_control',
    owner_role: owners[ix % owners.length],
    status: ix % 5 === 0 ? 'blocked' : ix % 3 === 0 ? 'review_required' : 'operating',
    risk_severity: ix % 5 === 0 ? 'critical' : ix % 3 === 0 ? 'high' : 'medium',
    evidence_status: ix % 4 === 0 ? 'missing_machine_readable_evidence' : 'source_available',
    gap_or_condition: ix % 4 === 0 ? 'Must attach source citation before AI automation can scale' : 'Standard review cadence',
    regulatory_or_policy_anchor: ix % 3 === 0 ? 'HIPAA/CMS' : ix % 3 === 1 ? 'HITRUST/SOC2' : 'SOX/clinical safety policy',
  }));
  const meridianAiInitiatives = moveUseCases.concat([
    {
      initiative_id: 'MER-INIT-013',
      initiative_name: 'M365 Copilot non-clinical adoption',
      business_area: 'Productivity',
      owner_role: 'Chief Digital & Information Officer',
      stage: 'scale',
      budget_usd: 7000000,
      promised_benefit_usd: 14000000,
      target_date: '2026-09-01',
      dependency: 'usage-to-value evidence',
      risk_status: 'medium',
      move_relevance: 'Enterprise productivity',
    },
    {
      initiative_id: 'MER-INIT-014',
      initiative_name: 'ServiceNow Now Assist IT operations',
      business_area: 'IT operations',
      owner_role: 'VP IT Operations',
      stage: 'pilot',
      budget_usd: 5000000,
      promised_benefit_usd: 9000000,
      target_date: '2026-10-01',
      dependency: 'knowledge quality',
      risk_status: 'medium',
      move_relevance: 'Service reliability',
    },
  ]);
  const aiFootprint = meridianAiInitiatives.map((it, ix) => ({
    ai_asset_id: `MER-AI-ASSET-${String(ix + 1).padStart(3, '0')}`,
    ai_asset_name: it.initiative_name,
    business_area: it.business_area,
    tool_or_model: ix % 4 === 0 ? 'Databricks ML/LLM workflow' : ix % 4 === 1 ? 'AWS Bedrock / Claude' : ix % 4 === 2 ? 'Epic or vendor AI' : 'M365/ServiceNow AI',
    stage: it.stage,
    monthly_users_or_cases: 700 + ix * 420,
    measured_value_usd: Math.round(it.promised_benefit_usd * (0.18 + (ix % 4) * 0.09)),
    risk_tier: ix % 5 === 0 ? 'tier_1_high' : ix % 3 === 0 ? 'tier_2' : 'tier_3',
    evidence_status: ix % 4 === 0 ? 'review_required' : 'source_backed',
    next_gate: ix % 4 === 0 ? 'PHI/model governance approval' : 'scale readiness',
  }));
  const towerInitiatives = aiFootprint.map((a, ix) => ({
    name: a.ai_asset_name,
    area: a.business_area,
    owner: moveUseCases[ix % moveUseCases.length]?.owner_role || 'Chief Digital & Information Officer',
    stage: a.stage,
    promised: moveUseCases[ix % moveUseCases.length]?.promised_benefit_usd || 9000000,
    measured: a.measured_value_usd,
    confidence: ix % 4 === 0 ? 'medium' : 'high',
    status: ix % 5 === 0 ? 'at_risk' : ix % 3 === 0 ? 'hold_until_evidence' : 'scale_candidate',
    blocker: ix % 4 === 0 ? 'PHI/model governance and source evidence missing' : ix % 4 === 1 ? 'data quality and semantic ownership not certified' : ix % 4 === 2 ? 'workflow integration not proven' : 'value measurement needs CFO signoff',
  }));
  const edges = edgeRows(prefix, apps, capabilities, moveUseCases, dataAssets, aiFootprint, 260);
  const patterns = [
    ['MER-PAT-001', 'Move readiness: unified clinical plus claims lakehouse', 'When EMR, claims, pharmacy, and CRM data are fragmented and no cloud data platform exists, recommend phased Databricks on AWS foundation before AI scale.', ['MER-DATA-001', 'MER-INIT-001', 'MER-INT-0001'], ['Longitudinal identity', 'PHI controls', 'Unity Catalog', 'source-to-report lineage'], 'Operations'],
    ['MER-PAT-002', 'Automation blocker: prior auth evidence retrieval', 'Prior authorization automation should not be sold as pure AI until policy evidence, clinical context retrieval, and audit trail are machine-readable.', ['MER-DATA-002', 'MER-INIT-003', 'MER-CTRL-001'], ['clinical record retrieval', 'policy versioning', 'appeal audit'], 'Operations'],
    ['MER-PAT-003', 'Call center: agent assist needs real-time member context', 'Agent assist value depends on joining transcripts, CRM, benefits, claims, prior auth, and care gaps with low latency.', ['MER-DATA-003', 'MER-INIT-004', 'MER-OPS-003'], ['intent detection', 'next-best-action', 'claims status', 'PHI guardrails'], 'Operations'],
    ['MER-PAT-004', 'Provider quality: HEDIS/STAR attribution before dashboards', 'Provider performance dashboards are trusted only when attribution, measure closure, denominator logic, and audit trail are certified.', ['MER-DATA-004', 'MER-INIT-005', 'MER-KPI-004'], ['HEDIS', 'STAR', 'provider benchmarking', 'quality gaps'], 'Clinical'],
    ['MER-PAT-005', 'Finance: cost-of-care requires claims + contracts + GL grain', 'Cost transparency requires joining claims, capitation, provider contracts, product, population, and GL without losing traceability.', ['MER-DATA-005', 'MER-INIT-006', 'MER-KPI-006'], ['PMPM', 'margin', 'capitation', 'provider contract'], 'Finance'],
    ['MER-PAT-006', 'Payment integrity: pattern library needs feedback loop', 'Payment integrity improves only when claim anomaly features, provider pattern history, investigation outcomes, and recovery feedback are reused.', ['MER-DATA-006', 'MER-INIT-007', 'MER-KPI-007'], ['FWA', 'billing anomaly', 'recoveries', 'false positive'], 'Finance'],
    ['MER-PAT-007', 'Automated close: claims accrual and provider contract evidence', 'Automated close must reconcile claims accruals, capitation, provider contracts, GL, and management reporting with source citations.', ['MER-DATA-007', 'MER-INIT-008', 'MER-CTRL-009'], ['close cycle', 'reconciliation', 'SOX', 'reporting'], 'Finance'],
  ].map(([pattern_id, pattern_name, when_to_apply, evidence_refs, signals, move_domain]) => ({ pattern_id, pattern_name, move_domain, when_to_apply, evidence_refs, signals }));
  const docs = {
    'Meridian_Health_2025_Annual_Report_SYNTHETIC.md': '# Meridian Health 2025 annual report (synthetic)\n\nMeridian Health is a synthetic integrated regional provider-payer modeled on large not-for-profit health systems and scaled payer/service organizations. FY2025 revenue is $39.6B with 29 hospitals, 415 ambulatory sites, 88,000 employees, 12,600 affiliated physicians and clinicians, 4.8M annual unique patients, and 2.1M health-plan members.\n\nStrategic priorities are access, affordability, value-based care, provider quality, member experience, digital front door, payment integrity, and a governed Databricks on AWS data foundation.\n',
    'Databricks_AWS_Lakehouse_Move_Brief_SYNTHETIC.md': '# Databricks on AWS lakehouse move brief (synthetic)\n\nMeridian does not have mature cloud data capabilities today. Current analytics depend on Oracle/Teradata marts, Hadoop raw zones, SAS jobs, Tableau extracts, BusinessObjects, and manual reconciliations. The target architecture uses Databricks on AWS, Unity Catalog, FHIR/HL7/EDI ingestion, governed bronze/silver/gold zones, and certified semantic products for patient/member 360, prior auth, call center, HEDIS/STAR, cost-of-care, payment integrity, and close reporting.\n',
    'Call_Center_AI_and_Member_Experience_SYNTHETIC.md': '# Call center AI and member experience (synthetic)\n\nAgent assist cannot work from transcripts alone. It requires CRM, benefits, claims status, prior authorization, care gaps, provider network, pharmacy, and consent-aware PHI controls. The first value gates are first-call resolution, handle time, escalation rate, complaint reduction, and next-best-action adherence.\n',
    'Finance_Cost_Transparency_and_Payment_Integrity_SYNTHETIC.md': '# Finance cost transparency and payment integrity (synthetic)\n\nFinance leadership needs cost-of-care and margin by product, provider, population, and geography. Claims, capitation, contracts, GL, and utilization data currently reconcile late. Payment integrity analytics must include provider pattern history, claim-level features, policy rules, investigation outcomes, and recovery feedback.\n',
    'Clinical_Quality_HEDIS_STAR_SYNTHETIC.md': '# Clinical quality HEDIS and STAR (synthetic)\n\nThe provider quality program needs attributed panels, denominator/ numerator lineage, measure closure workflow, quality outreach, provider benchmarking, and audit trail. Dashboards without certified attribution are not trusted by clinical leaders.\n',
  };
  const goldenQuestions = [
    'What blocks Meridian from using AI for prior authorization today?',
    'Why does the Databricks on AWS lakehouse need to come before call center agent assist scale?',
    'Which data assets are required for cost-of-care transparency?',
    'What evidence is needed before HEDIS/STAR provider performance dashboards can be trusted?',
    'Where is payment integrity value blocked by data or feedback-loop gaps?',
  ];
  return {
    cfg: {
      prefix, tenantKey: 'meridian-health', clientId: 'd2e9b6f4-8c25-43a9-b8e0-7d2f41f0a612',
      companyName: 'Meridian Health', industry: 'healthcare', subIndustry: 'integrated_provider_payer',
      demoUse: 'Supports PHS/Meridian Moves around Databricks on AWS, clinical plus claims data, automation foundation, call center optimization, HEDIS/STAR provider performance, cost transparency, payment integrity, and automated close.',
      profile: {
        company_name: 'Meridian Health',
        synthetic_peer_anchor: 'Sutter-scale regional provider with Kaiser/Humana-style payer/services complexity',
        revenue_fy25_usd: 39600000000,
        employees_fte: 88000,
        hospitals: 29,
        ambulatory_sites: 415,
        annual_unique_patients: 4800000,
        health_plan_members: 2100000,
        annual_technology_budget_usd: 1280000000,
        annual_ai_and_data_budget_usd: 162000000,
        current_cloud_data_capability: 'immature_no_enterprise_cloud_lakehouse',
        target_data_platform: 'Databricks on AWS',
        primary_ehr: 'Epic',
        payer_core_complexity: 'HealthRules plus QNXT/Facets legacy claims',
      },
    },
    data: { businessFunctions, itOrg, personas, capabilities, apps, systemMap, infrastructure, volumetrics, dataAssets, integrations, vendors, budgets, initiatives: moveUseCases, ops, kpis, controls, aiFootprint, edges },
    tower: aiTowerRows(prefix, towerInitiatives, personas, vendors),
    patterns,
    docs,
    goldenQuestions,
  };
}

function lakeshoreConfig() {
  const prefix = 'LAK';
  const owners = ['CFO', 'Treasurer', 'CIO', 'Chief Supply Chain Officer', 'Controller', 'Chief Procurement Officer', 'Chief Data Officer', 'CISO'];
  const businessFunctions = [
    ['LAK-BF-001', 'Corporate Treasury', 'Treasurer', 280, 'Cash positioning, debt, FX, bank connectivity, payments'],
    ['LAK-BF-002', 'Finance and Controller', 'Controller', 1250, 'Close, consolidation, management reporting, SOX'],
    ['LAK-BF-003', 'FP&A and Business Finance', 'CFO', 820, 'Forecasting, margin, working capital, segment planning'],
    ['LAK-BF-004', 'Procurement and Supplier Management', 'Chief Procurement Officer', 960, 'Direct materials, indirect, vendor risk, contracts'],
    ['LAK-BF-005', 'Manufacturing Operations', 'COO', 18800, 'Plants, MES, quality, maintenance, production planning'],
    ['LAK-BF-006', 'Supply Chain and Logistics', 'Chief Supply Chain Officer', 5200, 'S&OP, inventory, logistics, transport'],
    ['LAK-BF-007', 'Sales and Customer Operations', 'Chief Commercial Officer', 3400, 'Order-to-cash, pricing, customer service'],
    ['LAK-BF-008', 'Digital and IT', 'CIO', 4200, 'ERP, data, integrations, cyber, AI, service management'],
    ['LAK-BF-009', 'Data and Analytics', 'Chief Data Officer', 460, 'Data platform, reporting, semantic layer, AI/ML'],
    ['LAK-BF-010', 'Cybersecurity and Risk', 'CISO', 390, 'Identity, network, OT security, SOX evidence'],
  ].map(([function_id, function_name, executive_owner_role, head_count, description]) => ({ function_id, function_name, executive_owner_role, head_count, description }));
  const itOrg = [
    ['LAK-IT-001', 'Office of CIO', 'CIO', 'technology_leadership', 70, 0, 31000000],
    ['LAK-IT-002', 'SAP and ERP Platforms', 'VP ERP', 'erp', 520, 18, 156000000],
    ['LAK-IT-003', 'Treasury and Finance Systems', 'VP Finance Technology', 'treasury_finance', 210, 12, 62000000],
    ['LAK-IT-004', 'Integration and Middleware', 'VP Integration', 'api_edi_batch', 240, 18, 48000000],
    ['LAK-IT-005', 'Data Platform and BI', 'Chief Data Officer', 'data_analytics', 460, 22, 98000000],
    ['LAK-IT-006', 'Manufacturing and OT Systems', 'VP Manufacturing Tech', 'mes_ot', 780, 8, 174000000],
    ['LAK-IT-007', 'Cloud and Infrastructure', 'VP Infrastructure', 'cloud_datacenter', 630, 12, 188000000],
    ['LAK-IT-008', 'ServiceNow and IT Operations', 'VP IT Operations', 'itsm', 180, 15, 43000000],
    ['LAK-IT-009', 'Cybersecurity and Identity', 'CISO', 'cyber', 390, 5, 116000000],
    ['LAK-IT-010', 'AI Automation Office', 'Chief Data Officer', 'ai_governance', 95, 5, 28000000],
  ].map(([team_id, team_name, executive_owner_role, domain, head_count_fte, offshore_pct, annual_budget_usd]) => ({ team_id, team_name, executive_owner_role, domain, head_count_fte, offshore_pct, annual_budget_usd }));
  const personas = [
    ['LAK-PER-001', 'Treasury analyst', 'Treasury', 96, 'High', 'Cash positioning, bank portals, payments, liquidity forecast'],
    ['LAK-PER-002', 'Cash manager', 'Treasury', 42, 'High', 'Daily cash, debt draw, bank fees, exception approval'],
    ['LAK-PER-003', 'FX risk manager', 'Treasury', 24, 'Medium', 'Exposure capture, hedge accounting, scenario analysis'],
    ['LAK-PER-004', 'Controller analyst', 'Finance', 420, 'High', 'Close, reconciliations, journal evidence, management packs'],
    ['LAK-PER-005', 'FP&A analyst', 'Finance', 560, 'High', 'Forecasting, working capital, segment margin'],
    ['LAK-PER-006', 'Plant finance manager', 'Manufacturing', 180, 'Medium', 'Plant P&L, inventory, production variances'],
    ['LAK-PER-007', 'Procurement category manager', 'Procurement', 240, 'High', 'Contracts, supplier risk, spend analytics'],
    ['LAK-PER-008', 'SAP functional analyst', 'ERP', 320, 'High', 'FI/CO/MM/SD issues, interfaces, close support'],
    ['LAK-PER-009', 'Data engineer', 'Data Platform', 210, 'High', 'SAP, bank, treasury, procurement, BI pipelines'],
    ['LAK-PER-010', 'Service desk analyst', 'IT Operations', 220, 'Medium', 'Finance app tickets, ERP incidents, knowledge articles'],
  ].map(([persona_id, persona_name, business_area, population_count, ai_relevance, work_context]) => ({ persona_id, persona_name, business_area, population_count, ai_relevance, work_context }));
  const capabilities = [
    ['LAK-CAP-001', 'Global cash visibility', 'Treasury operations', 'Treasurer', 'fragmented', 'critical', 'Kyriba target; SAP; banks; TMS legacy', 'Bank balances spread across portals and spreadsheets'],
    ['LAK-CAP-002', 'Bank connectivity and payments control', 'Treasury controls', 'Treasurer', 'mobilizing', 'critical', 'Kyriba; SWIFT; host-to-host; SAP', 'Format testing and signer control evidence gaps'],
    ['LAK-CAP-003', 'Liquidity forecasting', 'Working capital', 'CFO', 'emerging', 'high', 'SAP; AP/AR; sales forecast; Kyriba', 'Forecast inputs manually assembled'],
    ['LAK-CAP-004', 'Automated close and reconciliations', 'Finance operations', 'Controller', 'fragmented', 'high', 'SAP; BlackLine; Hyperion; BI', 'Manual reconciliation evidence scattered'],
    ['LAK-CAP-005', 'Working-capital and supplier analytics', 'Procurement finance', 'Chief Procurement Officer', 'maturing', 'medium', 'Coupa; SAP; supplier risk; AP', 'Supplier terms and risk not unified'],
    ['LAK-CAP-006', 'Finance service management automation', 'IT operations', 'VP IT Operations', 'pilot', 'medium', 'ServiceNow; SAP; Kyriba', 'Knowledge quality and root cause tagging weak'],
    ['LAK-CAP-007', 'AI-assisted finance reporting', 'Management reporting', 'CFO', 'pilot', 'medium', 'Power BI; Tableau; GL; semantic layer', 'Narratives not tied to governed metrics'],
    ['LAK-CAP-008', 'Treasury risk and control evidence', 'Risk and compliance', 'CISO', 'emerging', 'high', 'Kyriba; IAM; SOX; bank portals', 'Dual approval and audit trail mapping incomplete'],
  ].map(([capability_id, capability_name, value_stream, business_owner, maturity, ai_relevance, primary_systems, known_gap]) => ({ capability_id, capability_name, value_stream, business_owner, maturity, ai_relevance, primary_systems, known_gap }));
  const apps = appRows(prefix, [
    { domain: 'erp_finance', team: 'SAP and ERP Platforms', platform: 'erp_package', hosting: ['on_prem_unix', 'private_cloud'], criticality: 'critical', dataClass: 'financial', costBase: 4_700_000, volumeBase: 650_000, volumeStep: 3300, integrationBase: 24, modernization: ['stabilize', 'finance_transformation_dependency'], names: ['SAP ECC Central Finance', 'SAP S/4 pilot instance', 'SAP FI/CO', 'SAP MM', 'SAP SD', 'SAP BW', 'SAP GRC', 'SAP PI/PO', 'SAP BPC', 'SAP Ariba network connector'] },
    { domain: 'treasury', team: 'Treasury and Finance Systems', platform: 'finance_package', hosting: ['managed_saas', 'on_prem_vmware'], criticality: 'critical', dataClass: 'financial_sensitive', costBase: 1_300_000, volumeBase: 120_000, volumeStep: 810, integrationBase: 12, modernization: ['kyriba_rollout', 'retire_legacy_tms'], names: ['Kyriba implementation tenant', 'Quantum legacy TMS', 'Bank of America CashPro', 'JPM Access', 'CitiDirect', 'SWIFT Alliance Lite2', 'Bloomberg FX', 'BlackLine Treasury Recs', 'FIS bank fee analysis', 'Treasury spreadsheet control repository'] },
    { domain: 'data_bi', team: 'Data Platform and BI', platform: 'data_platform', hosting: ['on_prem_sql_server', 'azure', 'aws_target'], criticality: 'high', dataClass: 'financial_operational', costBase: 1_100_000, volumeBase: 220_000, volumeStep: 4200, integrationBase: 10, modernization: ['semantic_layer_required', 'ai_evidence_required'], names: ['SQL Server finance mart', 'Oracle procurement mart', 'Power BI Premium', 'Tableau Server', 'Informatica PowerCenter', 'DataStage plant feeds', 'Snowflake pilot', 'dbt semantic layer', 'Alteryx finance workflows', 'Collibra catalog'] },
    { domain: 'manufacturing_supply_chain', team: 'Manufacturing and OT Systems', platform: 'industrial_package', hosting: ['plant_datacenter', 'managed_saas'], criticality: 'high', dataClass: 'operational', costBase: 2_100_000, volumeBase: 870_000, volumeStep: 9000, integrationBase: 16, modernization: ['contain', 'interface_standardize'], names: ['Siemens MES', 'Rockwell FactoryTalk', 'Kinaxis RapidResponse', 'Blue Yonder WMS', 'Manhattan TMS', 'SAP APO legacy', 'QualityOne QMS', 'EAM Maximo', 'Oracle Agile PLM', 'Supplier portal'] },
    { domain: 'corporate_platforms', team: 'Cloud and Infrastructure', platform: 'saas_or_cloud', hosting: ['managed_saas', 'azure', 'aws'], criticality: 'medium', dataClass: 'internal', costBase: 760_000, volumeBase: 64000, volumeStep: 1400, integrationBase: 6, modernization: ['operate', 'ai_enable'], names: ['Workday HCM', 'ServiceNow ITSM', 'Microsoft 365', 'GitHub Enterprise', 'Claude Code', 'Codex', 'Cursor', 'Okta', 'CrowdStrike', 'Zscaler'] },
  ], 86, owners);
  const integrations = integrationRows(prefix, apps, 118, [
    { count: 30, type: 'bank_connectivity', standard: 'BAI2/MT940/ISO20022', cadence: 'intraday', domain: 'treasury', volumeBase: 82000, volumeStep: 1800, latency: 60, failureBase: 0.24, gapEvery: 6, gap: 'bank_format_mapping_not_signed_off' },
    { count: 24, type: 'ERP_IDOC_API', standard: 'SAP IDoc/BAPI/OData', cadence: 'near_real_time', domain: 'finance_supply_chain', volumeBase: 190000, volumeStep: 4100, latency: 30, failureBase: 0.2, gapEvery: 8, gap: 'interface_owner_unclear' },
    { count: 22, type: 'ETL', standard: 'Informatica/DataStage', cadence: 'nightly', domain: 'analytics', volumeBase: 440000, volumeStep: 8100, latency: 1440, failureBase: 0.35, gapEvery: 7, gap: 'lineage_not_captured' },
    { count: 16, type: 'EDI', standard: 'X12/EDIFACT', cadence: 'daily', domain: 'supplier_customer', volumeBase: 260000, volumeStep: 5300, latency: 240, failureBase: 0.28, gapEvery: 9, gap: 'retry_evidence_not_standardized' },
    { count: 14, type: 'ServiceNow_Event', standard: 'REST/webhook', cadence: 'event_driven', domain: 'support_workload', volumeBase: 18000, volumeStep: 900, latency: 5, failureBase: 0.14, gapEvery: 5, gap: 'knowledge_article_quality_gap' },
  ]);
  const systemMap = apps.slice(0, 74).map((a, ix) => ({
    mapping_id: `LAK-MAP-${String(ix + 1).padStart(3, '0')}`,
    application_id: a.application_id,
    application_name: a.application_name,
    business_function: businessFunctions[ix % businessFunctions.length].function_name,
    process_supported: capabilities[ix % capabilities.length].capability_name,
    fit_score: pct(ix, 57, 38),
    pain_point: ix % 4 === 0 ? 'Manual spreadsheet bridge remains in critical path' : ix % 4 === 1 ? 'Bank/ERP/Kyriba mapping not fully reconciled' : ix % 4 === 2 ? 'Control evidence not attached to transaction lineage' : 'Support tickets repeat same root cause',
    move_relevance: ['Kyriba rollout', 'treasury controls', 'automated close', 'finance AI', 'working capital analytics'][ix % 5],
  }));
  const infrastructure = ['Primary manufacturing datacenter', 'Finance private cloud', 'Azure landing zone', 'AWS analytics target', 'Plant network DMZ', 'SWIFT connectivity zone', 'SAP application cluster', 'Oracle/SQL finance databases', 'Power BI tenant', 'ServiceNow production', 'Kyriba secure connectivity'].map((asset_name, ix) => ({
    asset_id: `LAK-INF-${String(ix + 1).padStart(3, '0')}`,
    asset_name,
    hosting_model: ix < 2 ? 'on_prem_or_private_cloud' : ix < 4 ? 'public_cloud' : 'hybrid_or_saas',
    platform: ['VMware/Linux', 'Private Cloud', 'Azure', 'AWS', 'Cisco/Palo Alto', 'SWIFT', 'AIX/Linux SAP', 'Oracle/SQL Server', 'Power BI', 'ServiceNow', 'Kyriba'][ix],
    region_or_datacenter: ix % 3 === 0 ? 'Midwest DC' : ix % 3 === 1 ? 'US-East' : 'Plant network',
    annual_cost_usd: dollars(1_600_000, ix, 850_000),
    resilience_tier: ix < 7 ? 'tier_1' : 'tier_2',
    owner_team: itOrg[ix % itOrg.length].team_name,
    modernization_note: ix === 10 ? 'Critical for Kyriba rollout evidence' : 'Must publish lineage/control evidence',
  }));
  const volumetrics = ['daily bank balance records', 'payments per month', 'cash forecast lines', 'FX exposure records', 'GL journal lines', 'close reconciliations', 'supplier invoices', 'purchase orders', 'plant production events', 'finance support tickets', 'management report refreshes', 'Kyriba test defects'].map((metric_name, ix) => ({
    metric_id: `LAK-VOL-${String(ix + 1).padStart(3, '0')}`,
    platform_or_system: apps[ix].application_name,
    metric_name,
    monthly_volume: 18000 + ix * 67000,
    peak_volume: 32000 + ix * 92000,
    growth_rate_pct: 4 + (ix % 7) * 2,
    sla_target: ix % 3 === 0 ? 'intraday' : ix % 3 === 1 ? 'close day 2' : 'daily',
    observed_issue: ix % 4 === 0 ? 'manual reconciliation' : ix % 4 === 1 ? 'format mapping defect' : ix % 4 === 2 ? 'control evidence gap' : 'baseline stable',
  }));
  const dataAssets = ['cash positioning gold table', 'bank connectivity test evidence', 'payment approval lineage', 'liquidity forecast data product', 'debt and FX exposure mart', 'close reconciliation semantic model', 'working capital data product', 'supplier spend risk mart', 'finance service workload lake', 'Kyriba rollout defect/evidence corpus'].map((data_asset_name, ix) => ({
    data_asset_id: `LAK-DATA-${String(ix + 1).padStart(3, '0')}`,
    data_asset_name,
    domain: ['treasury', 'controls', 'finance', 'procurement', 'operations'][ix % 5],
    source_systems: ix < 5 ? 'Kyriba; bank portals; SAP; treasury spreadsheets' : 'SAP; BlackLine; Coupa; ServiceNow; Power BI',
    target_platform: ix < 5 ? 'Kyriba plus finance lakehouse' : 'semantic layer / BI',
    data_owner: owners[ix % owners.length],
    freshness: ix < 3 ? 'intraday target' : 'daily/monthly target',
    quality_score: 48 + ix * 4,
    semantic_layer_status: ix % 3 === 0 ? 'not_ready' : ix % 3 === 1 ? 'partial' : 'certified_candidate',
    move_relevance: ['Kyriba rollout', 'cash visibility', 'payments control', 'automated close', 'finance AI'][ix % 5],
  }));
  const vendors = ['Kyriba', 'SAP', 'BlackLine', 'Oracle Hyperion', 'Power BI', 'Tableau', 'Informatica', 'DataStage', 'Coupa', 'Kinaxis', 'ServiceNow', 'Microsoft', 'Claude', 'OpenAI Codex', 'Cursor', 'AWS', 'Azure', 'Okta', 'CrowdStrike', 'Zscaler', 'JPMorgan', 'Bank of America', 'Citi', 'SWIFT', 'Deloitte SI', 'Accenture AMS', 'IBM', 'Cisco'].map((vendor_name, ix) => ({
    vendor_id: `LAK-VEN-${String(ix + 1).padStart(3, '0')}`,
    vendor_name,
    category: ix < 5 ? 'finance_treasury' : ix < 10 ? 'data_supply_chain' : ix < 16 ? 'ai_it_operations' : ix < 20 ? 'cloud_security' : 'bank_si_partner',
    owned_by: owners[ix % owners.length],
    annual_contract_value_usd: dollars(950000, ix, 725000),
    renewal_date: `2026-${String(7 + (ix % 6)).padStart(2, '0')}-${String(6 + (ix % 19)).padStart(2, '0')}`,
    criticality: ix < 14 ? 'high' : 'medium',
    license_or_unit_basis: ix % 3 === 0 ? 'enterprise subscription' : ix % 3 === 1 ? 'transaction / bank account' : 'user plus services',
    commercial_risk: ix === 0 ? 'implementation spend before control evidence gate' : ix % 6 === 0 ? 'renewal overlaps target architecture decision' : 'normal',
    evidence_id: `LAK-EVID-${String((ix % 12) + 1).padStart(3, '0')}`,
  }));
  const budgets = itOrg.map((t, ix) => ({
    budget_id: `LAK-BUD-${String(ix + 1).padStart(3, '0')}`,
    budget_area: t.team_name,
    owner_role: t.executive_owner_role,
    run_budget_usd: Math.round(t.annual_budget_usd * 0.64),
    change_budget_usd: Math.round(t.annual_budget_usd * 0.29),
    ai_or_data_budget_usd: Math.round(t.annual_budget_usd * (0.07 + (ix % 4) * 0.035)),
    labor_pct: 30 + (ix % 5) * 3,
    vendor_pct: 42 + (ix % 4) * 4,
    cloud_or_infra_pct: 18 + (ix % 4) * 3,
    budget_pressure: ix === 2 ? 'Kyriba rollout requires evidence-based scope control' : ix % 4 === 0 ? 'legacy run cost crowding out automation' : 'within plan',
  }));
  const initiatives = [
    ['LAK-INIT-001', 'Kyriba global cash and payments rollout', 'Treasury', 'Treasurer', 'build', 42000000, 86000000, '2027-02-28', 'bank connectivity and SAP mapping', 'critical', 'Kyriba rollout'],
    ['LAK-INIT-002', 'Treasury bank connectivity control evidence', 'Treasury controls', 'Treasurer', 'mobilize', 12000000, 28000000, '2026-10-30', 'ISO20022/BAI2 mapping signoff', 'high', 'Payments control'],
    ['LAK-INIT-003', 'Liquidity forecasting automation', 'FP&A', 'CFO', 'pilot', 15000000, 39000000, '2027-01-31', 'AP/AR/S&OP forecast integration', 'high', 'Liquidity forecast'],
    ['LAK-INIT-004', 'Automated close and finance reporting semantic layer', 'Finance', 'Controller', 'build', 18000000, 46000000, '2027-03-31', 'GL reconciliation and report lineage', 'high', 'Automated close'],
    ['LAK-INIT-005', 'ServiceNow finance support agent', 'IT Operations', 'VP IT Operations', 'pilot', 6000000, 14000000, '2026-11-30', 'knowledge quality and SAP root-cause tagging', 'medium', 'Service automation'],
    ['LAK-INIT-006', 'Finance AI narrative and variance explainer', 'Finance', 'CFO', 'design', 7000000, 17000000, '2026-12-15', 'governed metric store', 'medium', 'Finance AI'],
    ['LAK-INIT-007', 'Supplier working-capital analytics', 'Procurement', 'Chief Procurement Officer', 'pilot', 10000000, 26000000, '2027-02-15', 'supplier terms and AP data quality', 'medium', 'Working capital'],
    ['LAK-INIT-008', 'Kyriba rollout assistant and defect triage', 'Treasury', 'Treasurer', 'pilot', 5000000, 11000000, '2026-09-30', 'test defect corpus and RACI', 'medium', 'Moves support'],
  ].map(([initiative_id, initiative_name, business_area, owner_role, stage, budget_usd, promised_benefit_usd, target_date, dependency, risk_status, move_relevance]) => ({ initiative_id, initiative_name, business_area, owner_role, stage, budget_usd, promised_benefit_usd, target_date, dependency, risk_status, move_relevance }));
  const ops = ['Kyriba mapping defect', 'bank file rejection', 'SAP IDoc failure', 'BlackLine reconciliation aging', 'Power BI refresh failure', 'finance service desk repeat issue', 'payment approval exception', 'SWIFT connectivity alert', 'supplier master mismatch', 'close calendar delay'].map((service_or_process, ix) => ({
    signal_id: `LAK-OPS-${String(ix + 1).padStart(3, '0')}`,
    service_or_process,
    ticket_or_event_type: ix % 3 === 0 ? 'defect' : ix % 3 === 1 ? 'incident' : 'control_exception',
    monthly_volume: 90 + ix * 36,
    severity_mix: ix % 4 === 0 ? '22% high / 58% medium / 20% low' : '9% high / 51% medium / 40% low',
    mttr_hours: 4 + ix * 1.1,
    backlog_count: 21 + ix * 9,
    automation_candidate: ix % 2 === 0 ? 'yes' : 'partial',
    root_cause_theme: ix % 4 === 0 ? 'mapping and master data' : ix % 4 === 1 ? 'control evidence gap' : ix % 4 === 2 ? 'knowledge gap' : 'manual reconciliation',
  }));
  const kpis = ['daily cash visibility coverage', 'bank connection test pass rate', 'payment straight-through rate', 'cash forecast accuracy', 'close cycle days', 'manual reconciliation hours', 'finance ticket deflection', 'supplier term improvement', 'SOX evidence completeness', 'Kyriba defect burn-down'].map((kpi_name, ix) => ({
    kpi_id: `LAK-KPI-${String(ix + 1).padStart(3, '0')}`,
    kpi_name,
    domain: ['treasury', 'finance', 'operations', 'risk'][ix % 4],
    baseline_value: ix % 3 === 0 ? `${42 + ix}%` : ix % 3 === 1 ? `${11 - Math.floor(ix / 2)} days` : `$${8 + ix}M`,
    current_value: ix % 3 === 0 ? `${50 + ix}%` : ix % 3 === 1 ? `${9 - Math.floor(ix / 3)} days` : `$${12 + ix}M`,
    target_value: ix % 3 === 0 ? `${88 - ix}%` : ix % 3 === 1 ? `${5 + Math.floor(ix / 4)} days` : `$${22 + ix}M`,
    measurement_period: '2026-Q2',
    evidence_id: `LAK-EVID-${String((ix % 12) + 1).padStart(3, '0')}`,
    decision_relevance: initiatives[ix % initiatives.length].move_relevance,
  }));
  const controls = ['SOX payment approval evidence', 'bank signer recertification', 'Kyriba role design', 'SWIFT connectivity control', 'SAP-Kyriba interface reconciliation', 'cash forecast approval', 'AI narrative source citation', 'vendor access review', 'close evidence retention', 'finance data semantic owner'].map((control_name, ix) => ({
    control_id: `LAK-CTRL-${String(ix + 1).padStart(3, '0')}`,
    control_name,
    domain: ix % 4 === 0 ? 'sox' : ix % 4 === 1 ? 'treasury_control' : ix % 4 === 2 ? 'identity_access' : 'data_governance',
    owner_role: owners[ix % owners.length],
    status: ix % 5 === 0 ? 'blocked' : ix % 3 === 0 ? 'review_required' : 'operating',
    risk_severity: ix % 5 === 0 ? 'critical' : ix % 3 === 0 ? 'high' : 'medium',
    evidence_status: ix % 4 === 0 ? 'missing_machine_readable_evidence' : 'source_available',
    gap_or_condition: ix % 4 === 0 ? 'Attach test/signoff source before go-live' : 'Standard review cadence',
    regulatory_or_policy_anchor: ix % 3 === 0 ? 'SOX' : ix % 3 === 1 ? 'Treasury policy' : 'Cyber/IAM policy',
  }));
  const lakeshoreAiInitiatives = initiatives.concat([
    {
      initiative_id: 'LAK-INIT-009',
      initiative_name: 'M365 Copilot finance rollout',
      business_area: 'Productivity',
      owner_role: 'CIO',
      stage: 'scale',
      budget_usd: 8000000,
      promised_benefit_usd: 13000000,
      target_date: '2026-09-15',
      dependency: 'usage/value evidence',
      risk_status: 'medium',
      move_relevance: 'Productivity',
    },
    {
      initiative_id: 'LAK-INIT-010',
      initiative_name: 'Codex/Claude developer productivity for finance integrations',
      business_area: 'Developer productivity',
      owner_role: 'CIO',
      stage: 'pilot',
      budget_usd: 4000000,
      promised_benefit_usd: 8000000,
      target_date: '2026-10-01',
      dependency: 'DORA evidence',
      risk_status: 'medium',
      move_relevance: 'Engineering productivity',
    },
  ]);
  const aiFootprint = lakeshoreAiInitiatives.map((it, ix) => ({
    ai_asset_id: `LAK-AI-ASSET-${String(ix + 1).padStart(3, '0')}`,
    ai_asset_name: it.initiative_name,
    business_area: it.business_area,
    tool_or_model: ix % 4 === 0 ? 'Kyriba workflow assistant' : ix % 4 === 1 ? 'M365 Copilot' : ix % 4 === 2 ? 'ServiceNow Now Assist' : 'Claude/Codex/Cursor',
    stage: it.stage,
    monthly_users_or_cases: 220 + ix * 180,
    measured_value_usd: Math.round(it.promised_benefit_usd * (0.22 + (ix % 4) * 0.08)),
    risk_tier: ix % 4 === 0 ? 'tier_2' : 'tier_3',
    evidence_status: ix % 3 === 0 ? 'review_required' : 'source_backed',
    next_gate: ix % 3 === 0 ? 'SOX/control evidence approval' : 'scale readiness',
  }));
  const towerInitiatives = aiFootprint.map((a, ix) => ({
    name: a.ai_asset_name,
    area: a.business_area,
    owner: initiatives[ix % initiatives.length]?.owner_role || 'CIO',
    stage: a.stage,
    promised: initiatives[ix % initiatives.length]?.promised_benefit_usd || 8000000,
    measured: a.measured_value_usd,
    confidence: ix % 3 === 0 ? 'medium' : 'high',
    status: ix % 4 === 0 ? 'at_risk' : ix % 3 === 0 ? 'hold_until_evidence' : 'scale_candidate',
    blocker: ix % 3 === 0 ? 'SOX/control evidence and source citation gap' : ix % 3 === 1 ? 'integration and master-data defect backlog' : 'value measurement needs CFO/Treasurer signoff',
  }));
  const edges = edgeRows(prefix, apps, capabilities, initiatives, dataAssets, aiFootprint, 226);
  const patterns = [
    ['LAK-PAT-001', 'Kyriba rollout: bank connectivity before automation', 'Do not scale treasury automation until bank formats, signer controls, SAP mappings, and rejection handling are evidenced.', ['LAK-DATA-002', 'LAK-INIT-001', 'LAK-CTRL-001'], ['BAI2', 'ISO20022', 'SWIFT', 'payment approvals'], 'Treasury'],
    ['LAK-PAT-002', 'Cash visibility: portal dependency is the risk signal', 'If cash is still assembled from bank portals and spreadsheets, daily liquidity decisions are not automation-ready.', ['LAK-DATA-001', 'LAK-KPI-001'], ['cash positioning', 'bank portals', 'manual consolidation'], 'Treasury'],
    ['LAK-PAT-003', 'Automated close: semantic layer must cite GL and reconciliation evidence', 'AI finance narratives need governed metric definitions and source-cited close reconciliations.', ['LAK-DATA-006', 'LAK-INIT-004', 'LAK-CTRL-009'], ['close', 'reconciliation', 'SOX', 'semantic layer'], 'Finance'],
    ['LAK-PAT-004', 'Finance service agent: repeated ticket themes signal automation candidates', 'ServiceNow finance tickets can drive agent assist only when root cause, knowledge quality, and SAP/Kyriba ownership are explicit.', ['LAK-OPS-006', 'LAK-INIT-005'], ['support workload', 'knowledge article', 'root cause'], 'IT Operations'],
  ].map(([pattern_id, pattern_name, when_to_apply, evidence_refs, signals, move_domain]) => ({ pattern_id, pattern_name, move_domain, when_to_apply, evidence_refs, signals }));
  const docs = {
    'Lakeshore_Industries_Enterprise_Context_SYNTHETIC.md': '# Lakeshore Industries enterprise context (synthetic)\n\nLakeshore Industries is a synthetic private industrial enterprise with $54.2B revenue, 72,000 employees, 89 plants, global treasury operations, SAP-centered finance, and a Kyriba modernization program. The pack is aligned to treasury, finance, AI Control Tower, and Moves use cases.\n',
    'Kyriba_Rollout_Current_State_and_Risks_SYNTHETIC.md': '# Kyriba rollout current state and risks (synthetic)\n\nThe Kyriba program must resolve bank connectivity, payment formats, signer controls, SAP mappings, cash forecast inputs, testing evidence, and SOX control mapping before broad go-live. The top risks are manual bank portal fallback, incomplete ISO20022 mapping, unclear RACI for defects, and lack of machine-readable evidence.\n',
    'Finance_AI_and_Close_Automation_SYNTHETIC.md': '# Finance AI and close automation (synthetic)\n\nFinance wants AI-assisted variance commentary, close evidence summarization, reconciliation triage, and management reporting. These use cases require a governed finance semantic layer tied to SAP, BlackLine, Hyperion, treasury, procurement, and working-capital data.\n',
  };
  const goldenQuestions = [
    'What is blocking Lakeshore from safely scaling Kyriba payments?',
    'Which evidence is missing for treasury controls and SOX?',
    'Where should finance AI start if close automation is the goal?',
    'Which systems and integrations are most critical to cash visibility?',
  ];
  return {
    cfg: {
      prefix, tenantKey: 'lakeshore', clientId: '3b83d8ad-2db1-4c0a-a3b3-0a19c2e5a667',
      companyName: 'Lakeshore Industries', industry: 'industrial_manufacturing', subIndustry: 'private_global_manufacturer',
      demoUse: 'Supports Kyriba Moves, treasury modernization, finance AI, automated close, payment controls, bank connectivity, and AI Control Tower spend/value governance.',
      profile: {
        company_name: 'Lakeshore Industries',
        synthetic_peer_anchor: 'large private global industrial manufacturer',
        revenue_fy25_usd: 54200000000,
        employees_fte: 72000,
        manufacturing_plants: 89,
        countries: 34,
        annual_technology_budget_usd: 1160000000,
        annual_ai_and_data_budget_usd: 96000000,
        primary_erp: 'SAP ECC with S/4 pilot',
        treasury_target_platform: 'Kyriba',
        data_platform_state: 'fragmented SQL/BI with semantic layer target',
      },
    },
    data: { businessFunctions, itOrg, personas, capabilities, apps, systemMap, infrastructure, volumetrics, dataAssets, integrations, vendors, budgets, initiatives, ops, kpis, controls, aiFootprint, edges },
    tower: aiTowerRows(prefix, towerInitiatives, personas, vendors),
    patterns,
    docs,
    goldenQuestions,
  };
}

function buildPack(makeCfg, rootRel) {
  const pack = makeCfg();
  const root = path.join(REPO_ROOT, rootRel);
  cleanDir(root);
  buildGenericFiles(root, pack.cfg, pack.data);
  writeTower(root, pack.tower);
  const counts = {
    tenant_key: pack.cfg.tenantKey,
    business_functions: pack.data.businessFunctions.length,
    it_teams: pack.data.itOrg.length,
    personas: pack.data.personas.length,
    capabilities: pack.data.capabilities.length,
    applications: pack.data.apps.length,
    system_mappings: pack.data.systemMap.length,
    infrastructure_assets: pack.data.infrastructure.length,
    volumetrics: pack.data.volumetrics.length,
    data_assets: pack.data.dataAssets.length,
    integrations: pack.data.integrations.length,
    vendors: pack.data.vendors.length,
    budgets: pack.data.budgets.length,
    initiatives: pack.data.initiatives.length,
    operations_signals: pack.data.ops.length,
    kpis: pack.data.kpis.length,
    controls: pack.data.controls.length,
    ai_footprint: pack.data.aiFootprint.length,
    edges: pack.data.edges.length,
    ai_control_tower_registry: pack.tower.registry.length,
    ai_control_tower_milestones: pack.tower.milestones.length,
    ai_control_tower_tool_usage: pack.tower.toolUsage.length,
    ai_control_tower_agent_outcomes: pack.tower.agentOutcomes.length,
    ai_control_tower_evidence_items: pack.tower.evidence.length,
    corpus_patterns: pack.patterns.length,
  };
  writeCommonDocs(root, pack.cfg, pack.docs, pack.patterns, pack.goldenQuestions, counts);
  write(root, 'manifest.yaml', buildManifest(pack.cfg, {
    applications: pack.data.apps.length,
    integrations: pack.data.integrations.length,
    aiInitiatives: pack.tower.registry.length,
    patterns: pack.patterns.length,
    edges: pack.data.edges.length,
  }));
  return { root, counts };
}

const outputs = [
  buildPack(meridianConfig, 'datasets/meridian-health-synthetic-v2'),
  buildPack(lakeshoreConfig, 'datasets/lakeshore-industries-synthetic-v2'),
];

for (const out of outputs) {
  console.log(`${path.relative(REPO_ROOT, out.root)} generated`);
  console.log(JSON.stringify(out.counts, null, 2));
}

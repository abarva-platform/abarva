#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TENANT_KEY = 'lakeshore-industries';
const CONTRACT_VERSION = 'lakeshore_v7_1_1_holdco_depth_20260706';
const V7_ROOT = path.join(ROOT, 'datasets', 'lakeshore-industries-synthetic-v7-holdco');
const TOWER_ROOT = path.join(ROOT, 'tower-standardized-v1', TENANT_KEY);

const TARGETS = {
  enterprise: path.join(TOWER_ROOT, 'family-1-enterprise-operating-model', 'F01_enterprise-profile.yaml'),
  functions: path.join(TOWER_ROOT, 'family-1-enterprise-operating-model', 'F02_business-org-functions.csv'),
  org: path.join(TOWER_ROOT, 'family-1-enterprise-operating-model', 'F03_it-org-ownership.csv'),
  systems: path.join(TOWER_ROOT, 'family-2-technology-estate', 'F05_applications-systems.csv'),
  vendors: path.join(TOWER_ROOT, 'family-4-financial-commercial', 'F11_vendors-contracts-licenses.csv'),
  budget: path.join(TOWER_ROOT, 'family-4-financial-commercial', 'F12_it-budget-financials.csv'),
  initiatives: path.join(TOWER_ROOT, 'family-5-execution-operations', 'F13_initiatives-portfolio.csv'),
  kpis: path.join(TOWER_ROOT, 'family-5-execution-operations', 'F15_kpis-outcome-evidence.csv'),
  t01: path.join(TOWER_ROOT, 'ai-control-tower', 'T01_initiative-registry.csv'),
  t07: path.join(TOWER_ROOT, 'ai-control-tower', 'T07_benefit-realization.csv'),
  t08: path.join(TOWER_ROOT, 'ai-control-tower', 'T08_spend-contracts.csv'),
  f20: path.join(TOWER_ROOT, 'family-8-semantic-enrichment', 'F20_capability-system-dependency.csv'),
  f22: path.join(TOWER_ROOT, 'family-8-semantic-enrichment', 'F22_contract-system-service-map.csv'),
  f25: path.join(TOWER_ROOT, 'family-8-semantic-enrichment', 'F25_context-node-dictionary.csv'),
  graph: path.join(TOWER_ROOT, 'graph', 'context-relationships.jsonl'),
  facts: path.join(TOWER_ROOT, 'derived', 'tower_financial_amounts.csv'),
  trend: path.join(TOWER_ROOT, 'derived', 'tower_financial_amounts_fy2025_trend.csv'),
};

const SOURCE = {
  entities: 'V7_00_portfolio_entity_registry.csv',
  functions: 'V7_02_business_functions.csv',
  org: 'V7_03_org_ownership.csv',
  systems: 'V7_05_applications_systems.csv',
  vendors: 'V7_07_vendors_contracts.csv',
  programs: 'V7_09_programs_initiatives_business_priorities.csv',
  relationships: 'V7_12_relationships_graph_edges.csv',
  metrics: 'V7_14_metric_definitions.csv',
  bridge: 'V7_18_function_system_data_vendor_bridge.csv',
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        value += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(value);
      value = '';
    } else if (char === '\n') {
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
    } else if (char !== '\r') {
      value += char;
    }
  }
  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }
  const header = rows.shift() ?? [];
  return rows
    .filter((cells) => cells.some((cell) => cell.trim() !== ''))
    .map((cells) => Object.fromEntries(header.map((headerName, index) => [headerName, cells[index] ?? ''])));
}

function readCsv(name) {
  return parseCsv(fs.readFileSync(path.join(V7_ROOT, name), 'utf8'));
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function writeCsv(filePath, headers, rows) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header] ?? '')).join(','));
  }
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`);
}

function writeJsonl(filePath, rows) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`);
}

function number(value) {
  const parsed = Number(String(value ?? '').replace(/[$,]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function dollars(value) {
  return String(Math.round(number(value)));
}

function humanMoney(value) {
  const amount = number(value);
  if (Math.abs(amount) >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(2).replace(/\.00$/, '')}B`;
  if (Math.abs(amount) >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (Math.abs(amount) >= 1_000) return `$${Math.round(amount / 1_000)}K`;
  return `$${Math.round(amount)}`;
}

function humanCount(value) {
  return new Intl.NumberFormat('en-US').format(number(value));
}

function readableEntityType(value) {
  const text = String(value ?? '').replaceAll('_', ' ');
  return /^[aeiou]/i.test(text) ? `an ${text}` : `a ${text}`;
}

function slug(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);
}

function sourceBase(sourceFile, sourceRow, valueSource = 'tenant_file') {
  return {
    tenant_key: TENANT_KEY,
    source_file: sourceFile,
    source_row: sourceRow,
    value_source: valueSource,
  };
}

function entityColumns(row) {
  const portfolioCompanyId = row.entity_scope === 'portfolio_company' ? row.entity_id : '';
  const portfolioCompanyName = row.entity_scope === 'portfolio_company' ? row.entity_name : '';
  return {
    entity_id: row.entity_id,
    entity_name: row.entity_name,
    entity_scope: row.entity_scope,
    parent_entity_id: row.parent_entity_id,
    parent_entity_name: row.parent_entity_name,
    portfolio_company_id: portfolioCompanyId,
    portfolio_company_name: portfolioCompanyName,
  };
}

function sourceRow(index) {
  return String(index + 2);
}

function firstSystemName(value) {
  return String(value ?? '').split(';').map((part) => part.trim()).filter(Boolean)[0] ?? '';
}

function stageFor(status) {
  const raw = String(status ?? '').toLowerCase();
  if (/scale|production|live/.test(raw)) return 'scale';
  if (/hold|pause/.test(raw)) return 'hold';
  if (/flight|build|pilot|gate/.test(raw)) return 'build';
  return 'pilot';
}

function statusFor(row) {
  const raw = `${row.current_status ?? ''} ${row.decision_required ?? ''}`.toLowerCase();
  if (/hold|blocked|risk/.test(raw)) return 'watch';
  if (/flight|build|pilot|gate/.test(raw)) return 'watch';
  return 'on_track';
}

function promisedValue(row) {
  const budget = number(row.budget_usd);
  const multiplier = row.entity_scope === 'holdco' ? 2.1 : 1.8;
  return Math.round(budget * multiplier);
}

function measuredValue(row) {
  const status = String(row.current_status ?? '').toLowerCase();
  const budget = number(row.budget_usd);
  if (/scale|production|live/.test(status)) return Math.round(budget * 0.55);
  if (/flight|build|pilot/.test(status)) return Math.round(budget * 0.18);
  return Math.round(budget * 0.08);
}

function runChangeSplit(entity) {
  const budget = entity.entity_scope === 'holdco'
    ? number(entity.corporate_it_budget_usd)
    : number(entity.total_direct_technology_budget_usd);
  const runPct = entity.entity_scope === 'holdco' ? 0.62 : 0.68;
  const run = Math.round(budget * runPct);
  return { budget, run, change: budget - run };
}

const entities = readCsv(SOURCE.entities);
const functions = readCsv(SOURCE.functions);
const org = readCsv(SOURCE.org);
const systems = readCsv(SOURCE.systems);
const vendors = readCsv(SOURCE.vendors);
const programs = readCsv(SOURCE.programs);
const relationships = readCsv(SOURCE.relationships);
const metrics = readCsv(SOURCE.metrics);
const bridge = readCsv(SOURCE.bridge);

const entityById = new Map(entities.map((row) => [row.entity_id, row]));
const entityByName = new Map(entities.map((row) => [row.entity_name, row]));
const systemByName = new Map(systems.map((row) => [row.system_name, row]));
const vendorByName = new Map(vendors.map((row) => [row.vendor_name, row]));
const holdco = entities.find((row) => row.entity_scope === 'holdco') ?? entities[0];
const opcos = entities.filter((row) => row.entity_scope === 'portfolio_company');

function writeEnterpriseProfile() {
  const lines = [
    `company_name: ${holdco.entity_name}`,
    `tenant_key: ${TENANT_KEY}`,
    `entity_id: ${holdco.entity_id}`,
    'entity_scope: holdco',
    `portfolio_company_count: ${opcos.length}`,
    `portfolio_companies: ${opcos.map((row) => row.entity_name).join('; ')}`,
    `synthetic_peer_anchor: diversified private industrial holding company`,
    `revenue_fy25_usd: ${dollars(holdco.revenue_usd)}`,
    `employees_fte: ${dollars(holdco.employee_count)}`,
    `corporate_it_budget_usd: ${dollars(holdco.corporate_it_budget_usd)}`,
    `opco_local_technology_budget_usd: ${dollars(holdco.opco_local_technology_budget_usd)}`,
    `annual_technology_budget_usd: ${dollars(holdco.total_direct_technology_budget_usd)}`,
    `annual_ai_and_data_budget_usd: ${dollars(holdco.ai_data_budget_usd)}`,
    `business_model: ${holdco.business_model}`,
    `cxo_sponsor: ${holdco.cxo_sponsor}`,
    `finance_sponsor: ${holdco.finance_sponsor}`,
    `innovation_sponsor: ${holdco.innovation_sponsor}`,
    `generated_at: ${holdco.source_as_of_date}T00:00:00Z`,
    `source_contract: ${CONTRACT_VERSION}`,
  ];
  fs.writeFileSync(TARGETS.enterprise, `${lines.join('\n')}\n`);
}

function makeFunctions() {
  return functions.map((row, index) => ({
    ...entityColumns(row),
    function_id: row.function_id,
    function_name: row.function_name,
    executive_owner_role: row.executive_owner,
    head_count: '',
    function_category: row.function_category,
    parent_function_name: row.parent_function_name,
    description: row.business_capability,
    critical_processes: row.critical_processes_structured,
    supporting_system_refs: row.supporting_system_refs,
    ...sourceBase(SOURCE.functions, sourceRow(index)),
  }));
}

function makeOrg() {
  return org.map((row, index) => ({
    ...entityColumns(row),
    team_id: row.ownership_id,
    team_name: row.org_unit,
    executive_owner_role: row.leader_role,
    leader_name: row.leader_name,
    reports_to_role: row.reports_to_role,
    domain: row.business_or_it_org,
    head_count_fte: row.team_size_fte,
    offshore_pct: '',
    annual_budget_usd: dollars(row.accountable_budget_usd),
    decision_rights: row.decision_rights,
    key_initiatives_owned: row.key_initiatives_owned,
    ...sourceBase(SOURCE.org, sourceRow(index)),
  }));
}

function makeSystems() {
  return systems.map((row, index) => ({
    ...entityColumns(row),
    application_id: row.system_id,
    application_name: row.system_name,
    domain: row.system_category,
    primary_business_owner: row.business_owner_role,
    technical_owner_team: row.technical_owner_role,
    platform_type: row.vendor_product,
    hosting_model: row.hosting_model,
    environment: row.lifecycle_status,
    criticality: row.criticality,
    annual_run_cost_usd: dollars(row.annual_run_cost_usd),
    users_or_entities_supported: row.served_entity_names || row.entity_name,
    integration_count: '',
    data_classification: row.data_domains,
    modernization_state: row.modernization_disposition,
    system_scope: row.system_scope,
    ownership_model: row.ownership_model,
    served_entity_ids: row.served_entity_ids,
    served_entity_names: row.served_entity_names,
    evidence_id: `${row.system_id}-EVID`,
    ...sourceBase(SOURCE.systems, sourceRow(index)),
  }));
}

function makeVendors() {
  return vendors.map((row, index) => ({
    ...entityColumns(row),
    vendor_id: row.vendor_id,
    vendor_name: row.vendor_name,
    category: row.vendor_category,
    owned_by: row.entity_scope === 'holdco' ? 'Corporate shared services' : row.entity_name,
    annual_contract_value_usd: dollars(row.annual_cost_usd),
    renewal_date: row.renewal_date,
    criticality: row.contract_risk === 'high' ? 'critical' : row.contract_risk,
    license_or_unit_basis: row.vendor_role,
    commercial_risk: row.contract_risk,
    supported_functions: row.supported_functions,
    evidence_id: `${row.vendor_id}-EVID`,
    ...sourceBase(SOURCE.vendors, sourceRow(index)),
  }));
}

function budgetRows() {
  return [holdco, ...opcos].map((entity, index) => {
    const split = runChangeSplit(entity);
    const isHoldco = entity.entity_scope === 'holdco';
    const lineId = isHoldco ? 'LSH-BUDGET-CORP-SHARED-SERVICES' : `${entity.entity_id}-LOCAL-IT-BUDGET`;
    return {
      ...entityColumns(entity),
      ...sourceBase('family-4-financial-commercial/F12_it-budget-financials.csv', sourceRow(index)),
      line_id: lineId,
      budget_area: isHoldco ? 'Corporate shared services IT' : `${entity.entity_name} local IT`,
      function_or_platform: isHoldco ? 'Corporate shared services' : entity.entity_name,
      owner_role: entity.cxo_sponsor,
      owner_team_id: isHoldco ? 'corporate_shared_services_it' : slug(`${entity.entity_short_name}-it`),
      spend_type: 'direct_it_budget',
      budget_fy26_usd: dollars(split.budget),
      run_budget_fy26_usd: dollars(split.run),
      change_budget_fy26_usd: dollars(split.change),
      ai_data_budget_fy26_usd: dollars(entity.ai_data_budget_usd),
      capex_budget_fy26_usd: '',
      opex_budget_fy26_usd: '',
      labor_pct: '',
      vendor_pct: '',
      cloud_infra_pct: '',
      budget_pressure: isHoldco
        ? 'Corporate shared platforms, AI/data governance, security, integration, and back-office transformation.'
        : `Local technology budget for ${entity.sub_industry}.`,
      amount_type: 'none',
      view: 'it_budget',
      is_rollup_of: lineId,
      basis: 'committed',
      period: 'fy26',
      formula: 'v7_entity_budget_spine_authoritative_envelope',
      formula_version: CONTRACT_VERSION,
      notes: isHoldco
        ? 'Corporate shared-services budget only; do not add enterprise holdco total again.'
        : 'Portfolio-company local IT budget; additive with corporate shared-services budget.',
    };
  });
}

function makeInitiatives() {
  return programs.map((row, index) => ({
    ...entityColumns(row),
    initiative_id: row.priority_id,
    initiative_name: row.priority_name,
    business_area: row.priority_type,
    owner_role: row.business_sponsor,
    stage: stageFor(row.current_status),
    budget_usd: dollars(row.budget_usd),
    promised_benefit_usd: dollars(promisedValue(row)),
    target_date: '',
    dependency: row.impacted_systems,
    risk_status: statusFor(row),
    move_relevance: row.decision_required,
    ...sourceBase(SOURCE.programs, sourceRow(index)),
  }));
}

function makeT01() {
  return programs.map((row, index) => ({
    ...entityColumns(row),
    ...sourceBase('ai-control-tower/T01_initiative-registry.csv', sourceRow(index)),
    initiative_id: row.priority_id,
    initiative_name: row.priority_name,
    business_area: row.priority_type,
    portfolio_segment: row.entity_scope === 'holdco' ? 'Corporate Shared Services' : row.entity_name,
    owner_role: row.business_sponsor,
    business_sponsor_role: row.business_sponsor,
    stage: stageFor(row.current_status),
    promised_benefit_usd: dollars(promisedValue(row)),
    measured_value_usd: dollars(measuredValue(row)),
    value_confidence: 'medium',
    status: statusFor(row),
    evidence_status: measuredValue(row) > 0 ? 'directional_value_loaded' : 'value_not_attested',
    scale_decision: row.decision_required,
    primary_blocker: row.known_gaps,
    evidence_id: `${row.priority_id}-EVID`,
    amount_type: 'none',
    view: 'program_portfolio',
    is_rollup_of: row.priority_id,
    basis: 'forecast',
    period: 'fy26',
    formula: 'v7_program_priority_projection',
    formula_version: CONTRACT_VERSION,
    notes: row.value_hypothesis,
  }));
}

function makeT07() {
  return programs.map((row, index) => {
    const promised = promisedValue(row);
    const measured = measuredValue(row);
    return {
      ...entityColumns(row),
      ...sourceBase('ai-control-tower/T07_benefit-realization.csv', sourceRow(index)),
      initiative_id: row.priority_id,
      metric_basis: row.value_metric,
      value_basis: row.value_hypothesis,
      promised_benefit_usd: dollars(promised),
      measured_value_usd: dollars(measured),
      unrealized_or_blocked_value_usd: dollars(Math.max(promised - measured, 0)),
      confidence: 'medium',
      evidence_status: 'directional_value_loaded',
      measurement_method: 'synthetic directional value model tied to V7 program priority',
      finance_attested: 'no',
      evidence_id: `${row.priority_id}-EVID`,
      amount_type: 'none',
      view: 'value',
      is_rollup_of: row.priority_id,
      basis: 'forecast',
      period: 'fy26',
      formula: 'v7_program_value_projection',
      formula_version: CONTRACT_VERSION,
      notes: row.decision_required,
    };
  });
}

function makeT08() {
  const vendorRows = vendors.map((row, index) => ({
    ...entityColumns(row),
    ...sourceBase('ai-control-tower/T08_spend-contracts.csv', sourceRow(index)),
    line_id: `${row.vendor_id}-CONTRACT`,
    initiative_id: '',
    vendor_or_tool: row.vendor_name,
    spend_category: row.vendor_category,
    budget_fy26_usd: '',
    actual_ytd_usd: '',
    contract_value_usd: dollars(row.annual_cost_usd),
    renewal_date: row.renewal_date,
    unit_economic_note: row.vendor_role,
    amount_type: 'none',
    view: 'vendor_contract',
    is_rollup_of: row.vendor_id,
    basis: 'annual_contract_value',
    period: 'fy26',
    formula: 'v7_vendor_contract_projection',
    formula_version: CONTRACT_VERSION,
    notes: row.concentration_notes,
  }));
  const offset = vendorRows.length;
  const programRows = programs.map((row, index) => ({
    ...entityColumns(row),
    ...sourceBase('ai-control-tower/T08_spend-contracts.csv', sourceRow(offset + index)),
    line_id: `${row.priority_id}-BUDGET`,
    initiative_id: row.priority_id,
    vendor_or_tool: firstSystemName(row.impacted_systems) || row.funding_source,
    spend_category: row.priority_type,
    budget_fy26_usd: dollars(row.budget_usd),
    actual_ytd_usd: dollars(Math.round(number(row.budget_usd) * 0.22)),
    contract_value_usd: '',
    renewal_date: '',
    unit_economic_note: row.value_metric,
    amount_type: 'none',
    view: 'initiative_budget',
    is_rollup_of: row.priority_id,
    basis: 'committed',
    period: 'fy26',
    formula: 'v7_program_budget_projection',
    formula_version: CONTRACT_VERSION,
    notes: row.decision_required,
  }));
  return [...vendorRows, ...programRows];
}

function fact(row, sourceRowNumber, values) {
  return {
    ...sourceBase('derived/tower_financial_amounts.csv', sourceRowNumber),
    ...entityColumns(row),
    source_record_id: values.source_record_id,
    source_label: values.source_label,
    view: values.view,
    amount_type: values.amount_type,
    basis: values.basis,
    period: values.period,
    amount_usd: dollars(values.amount_usd),
    is_rollup_of: values.is_rollup_of,
    component_of: values.component_of,
    formula: values.formula,
    formula_version: CONTRACT_VERSION,
    reconciles_to_view: values.view,
    reconciles_to_record_id: values.source_record_id,
    reconciliation_envelope_usd: values.reconciliation_envelope_usd ?? '',
    notes: values.notes,
  };
}

function makeFacts() {
  const rows = [];
  let index = 2;
  for (const entity of [holdco, ...opcos]) {
    const split = runChangeSplit(entity);
    const lineId = entity.entity_scope === 'holdco' ? 'LSH-BUDGET-CORP-SHARED-SERVICES' : `${entity.entity_id}-LOCAL-IT-BUDGET`;
    rows.push(fact(entity, String(index++), {
      source_record_id: lineId,
      source_label: entity.entity_scope === 'holdco' ? 'Corporate shared services IT FY26 budget' : `${entity.entity_name} local IT FY26 budget`,
      view: 'it_budget',
      amount_type: 'none',
      basis: 'committed',
      period: 'fy26',
      amount_usd: split.budget,
      is_rollup_of: lineId,
      component_of: '',
      formula: 'v7_entity_budget_spine_authoritative_envelope',
      notes: 'Headline budget row; additive across corporate shared services and portfolio companies.',
    }));
    rows.push(fact(entity, String(index++), {
      source_record_id: `${lineId}-RUN`,
      source_label: `${entity.entity_name} FY26 run budget component`,
      view: 'it_budget',
      amount_type: 'run',
      basis: 'committed',
      period: 'fy26',
      amount_usd: split.run,
      is_rollup_of: lineId,
      component_of: lineId,
      formula: 'v7_entity_run_budget_component',
      notes: 'Component row; do not add to headline total separately.',
    }));
    rows.push(fact(entity, String(index++), {
      source_record_id: `${lineId}-CHANGE`,
      source_label: `${entity.entity_name} FY26 change budget component`,
      view: 'it_budget',
      amount_type: 'change',
      basis: 'committed',
      period: 'fy26',
      amount_usd: split.change,
      is_rollup_of: lineId,
      component_of: lineId,
      formula: 'v7_entity_change_budget_component',
      notes: 'Component row; do not add to headline total separately.',
    }));
  }
  for (const program of programs) {
    rows.push(fact(program, String(index++), {
      source_record_id: program.priority_id,
      source_label: `${program.priority_name} FY26 committed budget`,
      view: 'initiative_budget',
      amount_type: 'none',
      basis: 'committed',
      period: 'fy26',
      amount_usd: program.budget_usd,
      is_rollup_of: program.priority_id,
      component_of: '',
      formula: 'v7_program_budget_projection',
      notes: program.value_hypothesis,
    }));
    rows.push(fact(program, String(index++), {
      source_record_id: `${program.priority_id}-VALUE`,
      source_label: `${program.priority_name} directional promised value`,
      view: 'value',
      amount_type: 'none',
      basis: 'forecast',
      period: 'fy26',
      amount_usd: promisedValue(program),
      is_rollup_of: program.priority_id,
      component_of: '',
      formula: 'v7_program_value_projection',
      notes: 'Directional synthetic value; client finance attestation required.',
    }));
    rows.push(fact(program, String(index++), {
      source_record_id: `${program.priority_id}-MEASURED`,
      source_label: `${program.priority_name} directional measured value`,
      view: 'value',
      amount_type: 'none',
      basis: 'actual',
      period: 'ytd',
      amount_usd: measuredValue(program),
      is_rollup_of: program.priority_id,
      component_of: '',
      formula: 'v7_program_measured_value_projection',
      notes: 'Directional synthetic measured value; client finance attestation required.',
    }));
  }
  return rows;
}

function makeTrendFacts(facts) {
  return facts
    .filter((row) => row.view === 'it_budget' && row.amount_type === 'none' && row.period === 'fy26')
    .map((row, index) => ({
      ...row,
      source_file: 'derived/tower_financial_amounts_fy2025_trend.csv',
      source_row: sourceRow(index),
      source_record_id: `${row.source_record_id}-FY2025`,
      source_label: `${row.source_label} FY2025 trend baseline`,
      period: 'fy25',
      basis: 'actual',
      amount_usd: dollars(number(row.amount_usd) * 0.94),
      formula: 'synthetic_backcast_from_fy26_multiplier_0_94',
      formula_version: `${CONTRACT_VERSION}_fy2025_trend`,
      value_source: 'synthetic',
      notes: 'Synthetic FY2025 trend baseline for demo trending only; not client-attested.',
    }));
}

function makeKpis() {
  return metrics.slice(0, 80).map((row, index) => ({
    ...entityColumns(row),
    kpi_id: row.metric_id,
    kpi_name: row.metric_name,
    domain: row.metric_owner,
    baseline_value: '100',
    current_value: '92',
    target_value: '85',
    measurement_period: 'FY26',
    evidence_id: `${row.metric_id}-EVID`,
    decision_relevance: row.metric_definition,
    ...sourceBase(SOURCE.metrics, sourceRow(index), 'synthetic'),
  }));
}

function makeF20() {
  const systemBridge = bridge.filter((row) => row.dependency_type === 'system' && systemByName.has(row.object_ref));
  return systemBridge.map((row, index) => {
    const system = systemByName.get(row.object_ref);
    return {
      ...entityColumns(row),
      dependency_id: row.bridge_id,
      capability_id: row.function_ref,
      capability_name: row.function_ref,
      system_id: system.system_id,
      system_name: system.system_name,
      dependency_type: row.role_in_function,
      criticality: row.criticality_to_function,
      confidence: row.criticality_to_function === 'critical' ? '0.88' : '0.72',
      evidence_id: row.evidence_ref,
      ...sourceBase(SOURCE.bridge, sourceRow(index)),
    };
  });
}

function makeF22() {
  const vendorBridge = bridge.filter((row) => row.dependency_type === 'vendor' && vendorByName.has(row.object_ref));
  return vendorBridge.map((row, index) => {
    const vendor = vendorByName.get(row.object_ref);
    const relatedSystem = systems.find((system) => system.entity_id === row.entity_id && String(system.business_function_refs).includes(row.function_ref)) ?? systems.find((system) => system.entity_id === row.entity_id);
    return {
      ...entityColumns(row),
      map_id: row.bridge_id,
      vendor_id: vendor.vendor_id,
      vendor_name: vendor.vendor_name,
      supported_system_id: relatedSystem?.system_id ?? '',
      supported_system_name: relatedSystem?.system_name ?? '',
      service_or_contract: row.role_in_function,
      criticality: row.criticality_to_function,
      confidence: row.criticality_to_function === 'critical' ? '0.88' : '0.70',
      evidence_id: row.evidence_ref,
      ...sourceBase(SOURCE.bridge, sourceRow(index)),
    };
  });
}

function makeDictionary() {
  const rows = [];
  const push = (row) => rows.push(row);
  for (const [index, row] of entities.entries()) {
    push({
      ...sourceBase('family-8-semantic-enrichment/F25_context-node-dictionary.csv', sourceRow(index)),
      ...entityColumns(row),
      node_id: row.entity_id,
      business_label: row.entity_name,
      node_type: row.entity_type,
      source_system_file: SOURCE.entities,
      readable_summary: `${row.entity_name} is ${readableEntityType(row.entity_type)} in the Lakeshore portfolio with ${humanMoney(row.revenue_usd)} revenue and ${humanCount(row.employee_count)} employees.`,
      confidence: 'high',
      caveat: row.known_gaps,
    });
  }
  const offsets = { functions: rows.length, systems: 0, vendors: 0, programs: 0 };
  for (const [index, row] of functions.entries()) {
    push({
      ...sourceBase('family-8-semantic-enrichment/F25_context-node-dictionary.csv', sourceRow(offsets.functions + index)),
      ...entityColumns(row),
      node_id: row.function_id,
      business_label: row.function_name,
      node_type: 'business_function',
      source_system_file: SOURCE.functions,
      readable_summary: `${row.function_name} supports ${row.entity_name}; owner ${row.executive_owner}; critical processes: ${row.critical_processes_structured}.`,
      confidence: 'high',
      caveat: row.known_gaps,
    });
  }
  offsets.systems = rows.length;
  for (const [index, row] of systems.entries()) {
    push({
      ...sourceBase('family-8-semantic-enrichment/F25_context-node-dictionary.csv', sourceRow(offsets.systems + index)),
      ...entityColumns(row),
      node_id: row.system_id,
      business_label: row.system_name,
      node_type: 'system',
      source_system_file: SOURCE.systems,
      readable_summary: `${row.system_name} is a ${row.system_scope} ${row.system_category} system for ${row.entity_name}; owner ${row.business_owner_role}; annual run cost ${humanMoney(row.annual_run_cost_usd)}.`,
      confidence: 'high',
      caveat: row.known_gaps,
    });
  }
  offsets.vendors = rows.length;
  for (const [index, row] of vendors.entries()) {
    push({
      ...sourceBase('family-8-semantic-enrichment/F25_context-node-dictionary.csv', sourceRow(offsets.vendors + index)),
      ...entityColumns(row),
      node_id: row.vendor_id,
      business_label: row.vendor_name,
      node_type: 'vendor',
      source_system_file: SOURCE.vendors,
      readable_summary: `${row.vendor_name} supports ${row.supported_functions}; annual cost ${humanMoney(row.annual_cost_usd)}; renewal ${row.renewal_date}.`,
      confidence: 'high',
      caveat: row.known_gaps,
    });
  }
  offsets.programs = rows.length;
  for (const [index, row] of programs.entries()) {
    push({
      ...sourceBase('family-8-semantic-enrichment/F25_context-node-dictionary.csv', sourceRow(offsets.programs + index)),
      ...entityColumns(row),
      node_id: row.priority_id,
      business_label: row.priority_name,
      node_type: 'initiative',
      source_system_file: SOURCE.programs,
      readable_summary: `${row.priority_name} is a ${row.priority_type} initiative for ${row.entity_name}; sponsor ${row.business_sponsor}; budget ${humanMoney(row.budget_usd)}.`,
      confidence: 'medium',
      caveat: row.known_gaps,
    });
  }
  return rows;
}

function makeGraph() {
  return relationships.map((row) => ({
    edge_id: row.relationship_id,
    tenant_key: TENANT_KEY,
    entity_id: row.entity_id,
    entity_name: row.entity_name,
    entity_scope: row.entity_scope,
    parent_entity_id: row.parent_entity_id,
    parent_entity_name: row.parent_entity_name,
    from: row.from_object_ref,
    from_type: row.from_object_type,
    to: row.to_object_ref,
    to_type: row.to_object_type,
    type: row.relationship_type,
    relationship: row.relationship_type,
    direction: row.relationship_direction,
    confidence: Number(row.quality_score || 75) / 100,
    evidence: row.evidence_ref,
  }));
}

const f02Headers = ['entity_id', 'entity_name', 'entity_scope', 'parent_entity_id', 'parent_entity_name', 'portfolio_company_id', 'portfolio_company_name', 'function_id', 'function_name', 'executive_owner_role', 'head_count', 'function_category', 'parent_function_name', 'description', 'critical_processes', 'supporting_system_refs', 'source_file', 'source_row', 'value_source'];
const f03Headers = ['entity_id', 'entity_name', 'entity_scope', 'parent_entity_id', 'parent_entity_name', 'portfolio_company_id', 'portfolio_company_name', 'team_id', 'team_name', 'executive_owner_role', 'leader_name', 'reports_to_role', 'domain', 'head_count_fte', 'offshore_pct', 'annual_budget_usd', 'decision_rights', 'key_initiatives_owned', 'source_file', 'source_row', 'value_source'];
const f05Headers = ['entity_id', 'entity_name', 'entity_scope', 'parent_entity_id', 'parent_entity_name', 'portfolio_company_id', 'portfolio_company_name', 'application_id', 'application_name', 'domain', 'primary_business_owner', 'technical_owner_team', 'platform_type', 'hosting_model', 'environment', 'criticality', 'annual_run_cost_usd', 'users_or_entities_supported', 'integration_count', 'data_classification', 'modernization_state', 'system_scope', 'ownership_model', 'served_entity_ids', 'served_entity_names', 'evidence_id', 'source_file', 'source_row', 'value_source'];
const f11Headers = ['entity_id', 'entity_name', 'entity_scope', 'parent_entity_id', 'parent_entity_name', 'portfolio_company_id', 'portfolio_company_name', 'vendor_id', 'vendor_name', 'category', 'owned_by', 'annual_contract_value_usd', 'renewal_date', 'criticality', 'license_or_unit_basis', 'commercial_risk', 'supported_functions', 'evidence_id', 'source_file', 'source_row', 'value_source'];
const f12Headers = ['entity_id', 'entity_name', 'entity_scope', 'parent_entity_id', 'parent_entity_name', 'portfolio_company_id', 'portfolio_company_name', 'tenant_key', 'line_id', 'budget_area', 'function_or_platform', 'owner_role', 'owner_team_id', 'spend_type', 'budget_fy26_usd', 'run_budget_fy26_usd', 'change_budget_fy26_usd', 'ai_data_budget_fy26_usd', 'capex_budget_fy26_usd', 'opex_budget_fy26_usd', 'labor_pct', 'vendor_pct', 'cloud_infra_pct', 'budget_pressure', 'amount_type', 'view', 'is_rollup_of', 'basis', 'period', 'formula', 'formula_version', 'source_file', 'source_row', 'value_source', 'notes'];
const f13Headers = ['entity_id', 'entity_name', 'entity_scope', 'parent_entity_id', 'parent_entity_name', 'portfolio_company_id', 'portfolio_company_name', 'initiative_id', 'initiative_name', 'business_area', 'owner_role', 'stage', 'budget_usd', 'promised_benefit_usd', 'target_date', 'dependency', 'risk_status', 'move_relevance', 'source_file', 'source_row', 'value_source'];
const f15Headers = ['entity_id', 'entity_name', 'entity_scope', 'parent_entity_id', 'parent_entity_name', 'portfolio_company_id', 'portfolio_company_name', 'kpi_id', 'kpi_name', 'domain', 'baseline_value', 'current_value', 'target_value', 'measurement_period', 'evidence_id', 'decision_relevance', 'source_file', 'source_row', 'value_source'];
const t01Headers = ['entity_id', 'entity_name', 'entity_scope', 'parent_entity_id', 'parent_entity_name', 'portfolio_company_id', 'portfolio_company_name', 'tenant_key', 'initiative_id', 'initiative_name', 'business_area', 'portfolio_segment', 'owner_role', 'business_sponsor_role', 'stage', 'promised_benefit_usd', 'measured_value_usd', 'value_confidence', 'status', 'evidence_status', 'scale_decision', 'primary_blocker', 'evidence_id', 'amount_type', 'view', 'is_rollup_of', 'basis', 'period', 'formula', 'formula_version', 'source_file', 'source_row', 'value_source', 'notes'];
const t07Headers = ['entity_id', 'entity_name', 'entity_scope', 'parent_entity_id', 'parent_entity_name', 'portfolio_company_id', 'portfolio_company_name', 'tenant_key', 'initiative_id', 'metric_basis', 'value_basis', 'promised_benefit_usd', 'measured_value_usd', 'unrealized_or_blocked_value_usd', 'confidence', 'evidence_status', 'measurement_method', 'finance_attested', 'evidence_id', 'amount_type', 'view', 'is_rollup_of', 'basis', 'period', 'formula', 'formula_version', 'source_file', 'source_row', 'value_source', 'notes'];
const t08Headers = ['entity_id', 'entity_name', 'entity_scope', 'parent_entity_id', 'parent_entity_name', 'portfolio_company_id', 'portfolio_company_name', 'tenant_key', 'line_id', 'initiative_id', 'vendor_or_tool', 'spend_category', 'budget_fy26_usd', 'actual_ytd_usd', 'contract_value_usd', 'renewal_date', 'unit_economic_note', 'amount_type', 'view', 'is_rollup_of', 'basis', 'period', 'formula', 'formula_version', 'source_file', 'source_row', 'value_source', 'notes'];
const f20Headers = ['entity_id', 'entity_name', 'entity_scope', 'parent_entity_id', 'parent_entity_name', 'portfolio_company_id', 'portfolio_company_name', 'tenant_key', 'dependency_id', 'capability_id', 'capability_name', 'system_id', 'system_name', 'dependency_type', 'criticality', 'confidence', 'evidence_id', 'source_file', 'source_row', 'value_source'];
const f22Headers = ['entity_id', 'entity_name', 'entity_scope', 'parent_entity_id', 'parent_entity_name', 'portfolio_company_id', 'portfolio_company_name', 'tenant_key', 'map_id', 'vendor_id', 'vendor_name', 'supported_system_id', 'supported_system_name', 'service_or_contract', 'criticality', 'confidence', 'evidence_id', 'source_file', 'source_row', 'value_source'];
const f25Headers = ['entity_id', 'entity_name', 'entity_scope', 'parent_entity_id', 'parent_entity_name', 'portfolio_company_id', 'portfolio_company_name', 'tenant_key', 'node_id', 'business_label', 'node_type', 'source_system_file', 'readable_summary', 'confidence', 'caveat', 'source_file', 'source_row', 'value_source'];
const factHeaders = ['entity_id', 'entity_name', 'entity_scope', 'parent_entity_id', 'parent_entity_name', 'portfolio_company_id', 'portfolio_company_name', 'tenant_key', 'source_file', 'source_row', 'source_record_id', 'source_label', 'view', 'amount_type', 'basis', 'period', 'amount_usd', 'is_rollup_of', 'component_of', 'formula', 'formula_version', 'value_source', 'reconciles_to_view', 'reconciles_to_record_id', 'reconciliation_envelope_usd', 'notes'];

writeEnterpriseProfile();
writeCsv(TARGETS.functions, f02Headers, makeFunctions());
writeCsv(TARGETS.org, f03Headers, makeOrg());
writeCsv(TARGETS.systems, f05Headers, makeSystems());
writeCsv(TARGETS.vendors, f11Headers, makeVendors());
writeCsv(TARGETS.budget, f12Headers, budgetRows());
writeCsv(TARGETS.initiatives, f13Headers, makeInitiatives());
writeCsv(TARGETS.kpis, f15Headers, makeKpis());
writeCsv(TARGETS.t01, t01Headers, makeT01());
writeCsv(TARGETS.t07, t07Headers, makeT07());
writeCsv(TARGETS.t08, t08Headers, makeT08());
writeCsv(TARGETS.f20, f20Headers, makeF20());
writeCsv(TARGETS.f22, f22Headers, makeF22());
writeCsv(TARGETS.f25, f25Headers, makeDictionary());
writeJsonl(TARGETS.graph, makeGraph());
const facts = makeFacts();
writeCsv(TARGETS.facts, factHeaders, facts);
writeCsv(TARGETS.trend, factHeaders, makeTrendFacts(facts));

const totalBudget = budgetRows().reduce((sum, row) => sum + number(row.budget_fy26_usd), 0);
const summary = {
  tenantKey: TENANT_KEY,
  contractVersion: CONTRACT_VERSION,
  entities: entities.length,
  portfolioCompanies: opcos.length,
  functions: functions.length,
  orgRows: org.length,
  systems: systems.length,
  vendors: vendors.length,
  programs: programs.length,
  towerBudgetEnvelopeUsd: totalBudget,
  expectedTowerBudgetEnvelopeUsd: number(holdco.total_direct_technology_budget_usd),
  outputRoot: path.relative(ROOT, TOWER_ROOT),
};
if (summary.towerBudgetEnvelopeUsd !== summary.expectedTowerBudgetEnvelopeUsd) {
  throw new Error(`Tower budget envelope mismatch: ${summary.towerBudgetEnvelopeUsd} vs ${summary.expectedTowerBudgetEnvelopeUsd}`);
}
console.log(JSON.stringify(summary, null, 2));

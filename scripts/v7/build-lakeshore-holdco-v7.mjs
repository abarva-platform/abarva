import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const outRoot = process.argv.includes('--out')
  ? path.resolve(process.argv[process.argv.indexOf('--out') + 1])
  : path.join(repoRoot, 'datasets/lakeshore-industries-synthetic-v7-holdco');

const contractVersion = 'v7.1.0-holdco-entity-spine-20260706';
const tenantKey = 'lakeshore-industries';
const tenantName = 'Lakeshore Holdings';
const asOf = '2026-07-06';

const commonEvidence = {
  data_provider_name: 'AbarVa synthetic data steward',
  data_provider_role: 'Synthetic data generation',
  source_artifact_type: 'uploaded_template',
  source_artifact_name: 'lakeshore-holdco-v7-client-template.xlsx',
  capture_method: 'synthetic_demo',
  extraction_method: 'deterministic_generator',
  generated_by: 'scripts/v7/build-lakeshore-holdco-v7.mjs',
  validated_by: 'AbarVa QA',
  source_validation_status: 'synthetic_demo',
  source_as_of_date: asOf,
  known_gaps: 'Client must validate actual financials, system inventory, ownership, and evidence before board-grade use.',
};

const entities = [
  {
    entity_id: 'LSH-HOLDCO',
    entity_name: 'Lakeshore Holdings',
    entity_short_name: 'Lakeshore',
    entity_type: 'holding_company',
    entity_scope: 'holdco',
    parent_entity_id: '',
    parent_entity_name: '',
    revenue_usd: 7120000000,
    employee_count: 11800,
    corporate_it_budget_usd: 36500000,
    opco_local_technology_budget_usd: 154100000,
    total_direct_technology_budget_usd: 190600000,
    ai_data_budget_usd: 11800000,
    headquarters: 'Chicago, IL',
    industry: 'Industrial holding company',
    sub_industry: 'Diversified industrial, supply chain, foodservice, packaging, field services',
    business_model: 'Portfolio company rollup with corporate shared services and OpCo-led operations',
    cxo_sponsor: 'Corporate CIO',
    finance_sponsor: 'CFO',
    innovation_sponsor: 'VP Innovation',
  },
  {
    entity_id: 'LSH-OPCO-NLS',
    entity_name: 'Northline Supply Chain',
    entity_short_name: 'Northline',
    entity_type: 'operating_company',
    entity_scope: 'portfolio_company',
    parent_entity_id: 'LSH-HOLDCO',
    parent_entity_name: 'Lakeshore Holdings',
    revenue_usd: 1500000000,
    employee_count: 3000,
    total_direct_technology_budget_usd: 32500000,
    ai_data_budget_usd: 2300000,
    headquarters: 'Rosemont, IL',
    industry: 'Industrial distribution',
    sub_industry: 'Foodservice supply chain, freight, cold chain, distribution',
    business_model: 'Multi-site distribution and logistics operator',
    cxo_sponsor: 'Northline CIO',
    finance_sponsor: 'Northline CFO',
    innovation_sponsor: 'Northline VP Continuous Improvement',
  },
  {
    entity_id: 'LSH-OPCO-BMS',
    entity_name: 'Brightmark Marketing Services',
    entity_short_name: 'Brightmark',
    entity_type: 'operating_company',
    entity_scope: 'portfolio_company',
    parent_entity_id: 'LSH-HOLDCO',
    parent_entity_name: 'Lakeshore Holdings',
    revenue_usd: 720000000,
    employee_count: 1300,
    total_direct_technology_budget_usd: 15600000,
    ai_data_budget_usd: 1200000,
    headquarters: 'Chicago, IL',
    industry: 'Marketing services',
    sub_industry: 'Promotions, loyalty operations, fulfillment, retail marketing services',
    business_model: 'Campaign operations and marketing-services platform',
    cxo_sponsor: 'Brightmark CTO',
    finance_sponsor: 'Brightmark CFO',
    innovation_sponsor: 'Brightmark VP Digital Operations',
  },
  {
    entity_id: 'LSH-OPCO-FFF',
    entity_name: 'Forge & Field Consumer Products',
    entity_short_name: 'Forge & Field',
    entity_type: 'operating_company',
    entity_scope: 'portfolio_company',
    parent_entity_id: 'LSH-HOLDCO',
    parent_entity_name: 'Lakeshore Holdings',
    revenue_usd: 800000000,
    employee_count: 1200,
    total_direct_technology_budget_usd: 17300000,
    ai_data_budget_usd: 1300000,
    headquarters: 'Seattle, WA',
    industry: 'Consumer products',
    sub_industry: 'Premium consumer products, DTC commerce, retail channels',
    business_model: 'Brand-led manufacturing, DTC, and wholesale operations',
    cxo_sponsor: 'Forge & Field VP Technology',
    finance_sponsor: 'Forge & Field CFO',
    innovation_sponsor: 'Forge & Field VP Product Operations',
  },
  {
    entity_id: 'LSH-OPCO-GLP',
    entity_name: 'Great Lakes Pantry Services',
    entity_short_name: 'Great Lakes Pantry',
    entity_type: 'operating_company',
    entity_scope: 'portfolio_company',
    parent_entity_id: 'LSH-HOLDCO',
    parent_entity_name: 'Lakeshore Holdings',
    revenue_usd: 540000000,
    employee_count: 900,
    total_direct_technology_budget_usd: 11700000,
    ai_data_budget_usd: 900000,
    headquarters: 'Troy, MI',
    industry: 'Foodservice',
    sub_industry: 'Workplace foodservice, micro-markets, vending, onsite dining',
    business_model: 'Field-service and replenishment network with route operations',
    cxo_sponsor: 'GLP VP Technology',
    finance_sponsor: 'GLP Controller',
    innovation_sponsor: 'GLP VP Operations Excellence',
  },
  {
    entity_id: 'LSH-OPCO-HPG',
    entity_name: 'HarborPoint Packaging Group',
    entity_short_name: 'HarborPoint',
    entity_type: 'operating_company',
    entity_scope: 'portfolio_company',
    parent_entity_id: 'LSH-HOLDCO',
    parent_entity_name: 'Lakeshore Holdings',
    revenue_usd: 1050000000,
    employee_count: 1800,
    total_direct_technology_budget_usd: 25100000,
    ai_data_budget_usd: 1700000,
    headquarters: 'Grand Rapids, MI',
    industry: 'Packaging manufacturing',
    sub_industry: 'Industrial packaging, print, corrugate, contract manufacturing',
    business_model: 'Plant network with demand, quality, and capacity variability',
    cxo_sponsor: 'HarborPoint CIO',
    finance_sponsor: 'HarborPoint CFO',
    innovation_sponsor: 'HarborPoint VP Manufacturing Excellence',
  },
  {
    entity_id: 'LSH-OPCO-RCF',
    entity_name: 'Riverton Components & Field Services',
    entity_short_name: 'Riverton',
    entity_type: 'operating_company',
    entity_scope: 'portfolio_company',
    parent_entity_id: 'LSH-HOLDCO',
    parent_entity_name: 'Lakeshore Holdings',
    revenue_usd: 1180000000,
    employee_count: 2000,
    total_direct_technology_budget_usd: 28500000,
    ai_data_budget_usd: 2100000,
    headquarters: 'Cleveland, OH',
    industry: 'Industrial components and field services',
    sub_industry: 'Maintenance, repair, fabrication, installation, technical field services',
    business_model: 'Field-service labor, parts, quoting, and dispatch network',
    cxo_sponsor: 'Riverton CIO',
    finance_sponsor: 'Riverton CFO',
    innovation_sponsor: 'Riverton VP Service Transformation',
  },
  {
    entity_id: 'LSH-OPCO-KIS',
    entity_name: 'Keystone Industrial Services',
    entity_short_name: 'Keystone',
    entity_type: 'operating_company',
    entity_scope: 'portfolio_company',
    parent_entity_id: 'LSH-HOLDCO',
    parent_entity_name: 'Lakeshore Holdings',
    revenue_usd: 1330000000,
    employee_count: 1600,
    total_direct_technology_budget_usd: 23400000,
    ai_data_budget_usd: 2300000,
    headquarters: 'Pittsburgh, PA',
    industry: 'Industrial services',
    sub_industry: 'Facilities services, equipment lifecycle services, safety compliance',
    business_model: 'Contracted industrial services with regional branches',
    cxo_sponsor: 'Keystone CIO',
    finance_sponsor: 'Keystone VP Finance',
    innovation_sponsor: 'Keystone VP Innovation and Automation',
  },
].map((entity) => ({
  tenant_key: tenantKey,
  ...entity,
  currency: 'USD',
  revenue_period_label: 'FY2025',
  employee_count_basis: 'headcount',
  validation_status: 'synthetic_demo',
  ...commonEvidence,
}));

const corporateEntity = entities[0];
const opcos = entities.filter((entity) => entity.entity_scope === 'portfolio_company');
const allOpcoEntityIds = opcos.map((entity) => entity.entity_id).join('; ');
const allOpcoEntityNames = opcos.map((entity) => entity.entity_name).join('; ');

const sharedFunctions = [
  ['Corporate Treasury', 'finance', 'CFO', 'cash forecasting; liquidity planning; bank connectivity; payment controls', 'critical'],
  ['Finance and Controller', 'finance', 'CFO', 'close; consolidation; account reconciliation; statutory reporting', 'critical'],
  ['FP&A and Business Finance', 'finance', 'CFO', 'budgeting; forecasting; scenario planning; management reporting', 'high'],
  ['Procurement and Supplier Management', 'supply chain', 'Chief Procurement Officer', 'sourcing; supplier risk; contract compliance', 'high'],
  ['Shared HR Operations', 'corporate', 'CHRO', 'employee services; payroll coordination; HR case management', 'high'],
  ['Legal and Compliance', 'risk', 'General Counsel', 'contract review; matter management; policy controls', 'high'],
  ['Cybersecurity and Identity', 'technology', 'CISO', 'identity; endpoint security; cyber operations; vulnerability management', 'critical'],
  ['Enterprise Applications', 'technology', 'Corporate CIO', 'ERP; CRM; HCM; integration portfolio governance', 'critical'],
  ['Data and Analytics', 'technology', 'Chief Data Officer', 'data platform; semantic definitions; data quality; BI', 'critical'],
  ['AI and Automation Office', 'technology', 'VP Innovation', 'use-case intake; automation standards; model governance', 'high'],
  ['IT Service Management', 'technology', 'VP IT Operations', 'incident; change; service catalog; asset management', 'high'],
  ['Integration and Middleware', 'technology', 'VP Enterprise Architecture', 'API; EDI; event integration; master-data flows', 'high'],
];

const opcoFunctionTemplates = [
  ['Finance and Controller', 'finance', 'CFO', 'month-end close; plant/branch P&L; account reconciliation', 'critical'],
  ['FP&A and Commercial Finance', 'finance', 'VP Finance', 'forecasting; margin analysis; price-volume-mix reporting', 'high'],
  ['People Operations', 'corporate', 'HR Director', 'workforce planning; hiring; timekeeping; employee relations', 'high'],
  ['Legal and Compliance', 'risk', 'General Counsel', 'contracting; compliance evidence; claims support', 'high'],
  ['Procurement and Supplier Management', 'supply chain', 'VP Procurement', 'supplier onboarding; purchase orders; supplier quality', 'high'],
  ['Manufacturing Operations', 'operations', 'COO', 'production planning; shop-floor execution; yield management', 'critical'],
  ['Supply Chain and Logistics', 'operations', 'VP Supply Chain', 'warehouse; transportation; replenishment; OTIF', 'critical'],
  ['Sales and Customer Operations', 'customer', 'Chief Commercial Officer', 'order capture; quoting; customer service; returns', 'high'],
  ['Quality and Food Safety', 'risk', 'VP Quality', 'quality holds; audit readiness; corrective actions; traceability', 'critical'],
  ['Maintenance and Reliability', 'operations', 'VP Operations', 'preventive maintenance; asset uptime; spare parts', 'high'],
  ['Digital and IT', 'technology', 'OpCo CIO', 'application support; local infrastructure; data enablement', 'critical'],
  ['Field Service Operations', 'operations', 'VP Field Operations', 'dispatch; work orders; mobile workforce; SLA attainment', 'high'],
];

const systemTemplates = [
  ['ERP Core', 'ERP', 'SAP ECC', 'enterprise_resource_planning', 4800000, 'critical'],
  ['Manufacturing Execution', 'MES', 'Plex MES', 'manufacturing_operations', 1600000, 'critical'],
  ['Warehouse Management', 'WMS', 'Manhattan WMS', 'warehouse_and_distribution', 1200000, 'critical'],
  ['Transportation Management', 'TMS', 'Blue Yonder TMS', 'transportation_and_routing', 950000, 'high'],
  ['CRM and Sales Operations', 'CRM', 'Microsoft Dynamics 365', 'sales_and_customer_ops', 1100000, 'high'],
  ['Customer Service Case Management', 'Service', 'Zendesk Enterprise', 'customer_service', 420000, 'medium'],
  ['E-commerce / Customer Portal', 'Digital', 'Adobe Commerce', 'digital_customer', 900000, 'high'],
  ['Quality Management System', 'QMS', 'ETQ Reliance', 'quality_and_compliance', 700000, 'high'],
  ['Maintenance Management', 'EAM/CMMS', 'IBM Maximo', 'maintenance_reliability', 860000, 'high'],
  ['Plant / Branch Data Historian', 'Operational Data', 'AVEVA PI', 'operational_telemetry', 740000, 'high'],
  ['Labor Scheduling and Timekeeping', 'Workforce', 'UKG Pro Workforce', 'workforce_management', 620000, 'high'],
  ['Procurement and Supplier Portal', 'Procurement', 'Coupa', 'procurement', 780000, 'high'],
  ['Business Intelligence', 'Analytics', 'Power BI Premium', 'analytics_reporting', 520000, 'high'],
  ['Local Data Mart', 'Data Platform', 'Snowflake', 'data_platform', 680000, 'high'],
  ['Integration Runtime', 'Integration', 'Azure Integration Services', 'integration', 410000, 'critical'],
  ['Document and Contract Repository', 'Content', 'SharePoint Online', 'document_management', 260000, 'medium'],
  ['Mobile Field Operations', 'Mobile', 'Salesforce Field Service', 'field_service', 720000, 'high'],
  ['Safety and EHS Management', 'EHS', 'Intelex', 'safety_compliance', 340000, 'medium'],
];

const corporateSystems = [
  ['Kyriba Treasury', 'Treasury', 'Kyriba', 'cash_visibility_and_payments', 1800000, 'critical'],
  ['Oracle EPM Planning', 'Planning', 'Oracle EPM', 'fpna_planning', 2100000, 'critical'],
  ['OneStream Consolidation', 'Consolidation', 'OneStream', 'financial_close', 1600000, 'critical'],
  ['Workday HCM', 'HCM', 'Workday', 'hr_core', 2400000, 'critical'],
  ['ServiceNow ITSM', 'ITSM', 'ServiceNow', 'it_service_management', 2100000, 'critical'],
  ['ServiceNow CMDB', 'CMDB', 'ServiceNow', 'asset_and_configuration', 1200000, 'high'],
  ['Azure Integration Services', 'Integration', 'Microsoft Azure', 'enterprise_integration', 2900000, 'critical'],
  ['Snowflake Enterprise Lake', 'Data Platform', 'Snowflake', 'enterprise_data_platform', 3200000, 'critical'],
  ['dbt Semantic Layer', 'Semantic Layer', 'dbt Labs', 'metric_semantics', 850000, 'high'],
  ['Microsoft 365 Copilot', 'AI Productivity', 'Microsoft', 'knowledge_work_ai', 4800000, 'high'],
  ['Azure OpenAI Landing Zone', 'AI Platform', 'Microsoft Azure', 'genai_platform', 1600000, 'high'],
  ['Okta Workforce Identity', 'Identity', 'Okta', 'identity_access', 1300000, 'critical'],
  ['CrowdStrike Falcon', 'Cybersecurity', 'CrowdStrike', 'endpoint_security', 1700000, 'critical'],
  ['Splunk Enterprise Security', 'Cybersecurity', 'Splunk', 'security_monitoring', 2100000, 'critical'],
  ['Coupa Enterprise Procurement', 'Procurement', 'Coupa', 'source_to_pay', 1400000, 'high'],
  ['Icertis Contract Intelligence', 'CLM', 'Icertis', 'contract_lifecycle', 900000, 'high'],
  ['Legal Tracker', 'Legal Ops', 'Thomson Reuters', 'matter_management', 420000, 'medium'],
  ['Power BI Executive Reporting', 'Analytics', 'Microsoft', 'executive_reporting', 760000, 'high'],
  ['Master Data Management Hub', 'MDM', 'Informatica', 'master_data', 1250000, 'high'],
  ['Enterprise API Gateway', 'API', 'Azure API Management', 'api_management', 620000, 'high'],
  ['Privileged Access Manager', 'Cybersecurity', 'CyberArk', 'privileged_access', 820000, 'critical'],
  ['Data Quality Observability', 'Data Quality', 'Monte Carlo', 'data_quality', 540000, 'high'],
  ['RPA Orchestration', 'Automation', 'UiPath', 'shared_services_automation', 920000, 'high'],
  ['Corporate Data Catalog', 'Data Governance', 'Microsoft Purview', 'lineage_catalog', 680000, 'high'],
];

const roleTemplates = [
  ['President', 'executive', 'Owns OpCo P&L, strategy, and operating performance', 'enterprise_decision'],
  ['Chief Financial Officer', 'finance', 'Owns financial performance, controls, and value proof', 'budget_authority'],
  ['Chief Operating Officer', 'operations', 'Owns plant, branch, logistics, quality, and field execution', 'operating_authority'],
  ['Chief Information Officer', 'technology', 'Owns OpCo technology roadmap, local systems, and corporate alignment', 'technology_authority'],
  ['VP Finance', 'finance', 'Owns FP&A, month-end close support, and management reporting', 'functional_owner'],
  ['Controller', 'finance', 'Owns accounting controls, reconciliations, audit evidence', 'control_owner'],
  ['HR Director', 'corporate', 'Owns workforce planning, employee relations, HR service delivery', 'functional_owner'],
  ['General Counsel / Legal Lead', 'risk', 'Owns contracts, disputes, legal operations, compliance coordination', 'control_owner'],
  ['VP Operations', 'operations', 'Owns production, distribution, and service delivery performance', 'functional_owner'],
  ['VP Supply Chain', 'supply chain', 'Owns procurement, planning, warehousing, logistics', 'functional_owner'],
  ['VP Commercial Operations', 'customer', 'Owns sales operations, customer service, quoting', 'functional_owner'],
  ['Director Data and Analytics', 'technology', 'Owns local reporting, data stewardship, and analytics adoption', 'data_owner'],
  ['IT Operations Manager', 'technology', 'Owns local service desk, endpoint, network, and plant/branch support', 'service_owner'],
  ['Business Process Owner', 'operations', 'Owns process standardization and improvement backlog', 'process_owner'],
];

const personaTemplates = [
  ['Executive decision maker', 'executive', 12, 'Approves investments, priorities, and business tradeoffs', 'medium'],
  ['Finance controller user', 'finance', 35, 'Runs close, reconciliation, controls, and reporting', 'medium'],
  ['FP&A analyst / manager', 'finance', 28, 'Builds forecasts, scenario analysis, and margin reporting', 'high'],
  ['Procurement specialist', 'supply chain', 42, 'Manages sourcing, supplier data, purchase orders', 'medium'],
  ['HR service partner', 'corporate', 24, 'Supports employee cases, workforce data, HR policy execution', 'medium'],
  ['Legal operations user', 'risk', 8, 'Handles contracts, matter intake, outside counsel spend', 'low'],
  ['Plant / branch supervisor', 'operations', 110, 'Runs daily execution, quality, productivity, and labor decisions', 'medium'],
  ['Field service coordinator', 'operations', 75, 'Schedules work orders, dispatch, mobile workforce tasks', 'high'],
  ['Customer service agent', 'customer', 90, 'Handles order status, service issues, returns, complaints', 'high'],
  ['IT service analyst', 'technology', 22, 'Resolves tickets, changes, access, end-user support', 'medium'],
];

const vendorTemplates = [
  ['Microsoft', 'cloud_productivity', 2200000, 'enterprise platform provider', 'medium'],
  ['SAP', 'erp', 1800000, 'ERP software and AMS dependency', 'high'],
  ['Oracle', 'finance_planning', 650000, 'planning and reporting dependency', 'medium'],
  ['ServiceNow', 'it_service_management', 540000, 'ITSM and workflow platform', 'medium'],
  ['Snowflake', 'data_platform', 420000, 'data warehouse and analytics platform', 'medium'],
  ['Accenture', 'managed_services', 1700000, 'AMS and transformation support', 'high'],
  ['Deloitte', 'advisory', 820000, 'finance and controls advisory', 'medium'],
  ['KPMG', 'risk_controls', 520000, 'audit, SOX, and controls support', 'medium'],
  ['Cisco', 'network', 740000, 'network infrastructure provider', 'medium'],
  ['CrowdStrike', 'cybersecurity', 330000, 'endpoint protection provider', 'high'],
  ['UiPath', 'automation', 260000, 'RPA and workflow automation', 'medium'],
  ['Local OpCo Systems Integrator', 'systems_integration', 620000, 'local implementation and support', 'high'],
];

function slug(value) {
  return String(value).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function id(prefix, entity, label, index) {
  return `${prefix}-${entity.entity_id.replace('LSH-', '')}-${String(index + 1).padStart(3, '0')}-${slug(label).slice(0, 24)}`;
}

function fmtCurrency(n) {
  return Number(n || 0);
}

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function stableHeaders(rows) {
  const seen = new Set();
  const headers = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key);
        headers.push(key);
      }
    }
  }
  return headers;
}

async function writeCsv(file, rows, forcedHeaders) {
  const headers = forcedHeaders ?? stableHeaders(rows);
  const text = [headers.join(','), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))].join('\n') + '\n';
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, text, 'utf8');
  return { file, rows: rows.length, columns: headers.length, checksum: sha256(text) };
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function withEntity(entity, extra) {
  return {
    tenant_key: tenantKey,
    entity_id: entity.entity_id,
    entity_name: entity.entity_name,
    entity_short_name: entity.entity_short_name,
    entity_scope: entity.entity_scope,
    parent_entity_id: entity.parent_entity_id,
    parent_entity_name: entity.parent_entity_name,
    ...extra,
    ...commonEvidence,
  };
}

function buildEnterpriseProfile() {
  return entities.map((entity) => ({
    client_display_name: tenantName,
    company_name: entity.entity_name,
    entity_id: entity.entity_id,
    entity_name: entity.entity_name,
    entity_short_name: entity.entity_short_name,
    entity_scope: entity.entity_scope,
    parent_entity_id: entity.parent_entity_id,
    parent_entity_name: entity.parent_entity_name,
    legal_entity_type: entity.entity_type,
    industry: entity.industry,
    sub_industry: entity.sub_industry,
    revenue_usd: entity.revenue_usd,
    revenue_basis: entity.entity_scope === 'holdco' ? 'portfolio_rollup' : 'direct_operating_revenue',
    revenue_period_label: entity.revenue_period_label,
    employee_count: entity.employee_count,
    employee_count_basis: entity.employee_count_basis,
    operating_company_breakdown: entity.entity_scope === 'holdco'
      ? opcos.map((opco) => `${opco.entity_short_name}=${opco.revenue_usd}`).join('; ')
      : '',
    business_segments: entity.sub_industry,
    corporate_it_budget_usd: entity.corporate_it_budget_usd ?? 0,
    opco_local_technology_budget_usd: entity.opco_local_technology_budget_usd ?? entity.total_direct_technology_budget_usd,
    total_direct_technology_budget_usd: entity.total_direct_technology_budget_usd,
    technology_budget_basis: entity.entity_scope === 'holdco' ? 'total_direct_it' : 'opco_local_it',
    ai_data_budget_usd: entity.ai_data_budget_usd,
    primary_cloud: 'Microsoft Azure; AWS pockets at OpCos',
    enterprise_cdp_status: entity.entity_scope === 'holdco' ? 'planned' : 'partial',
    strategic_priorities: 'shared services modernization; finance automation; AI-enabled operating model; ERP rationalization; data foundation',
    headquarters: entity.headquarters,
    business_model: entity.business_model,
    cxo_sponsor: entity.cxo_sponsor,
    finance_sponsor: entity.finance_sponsor,
    innovation_sponsor: entity.innovation_sponsor,
    ...commonEvidence,
  }));
}

function buildFunctions() {
  const rows = [];
  sharedFunctions.forEach(([name, category, owner, processes, criticality], index) => {
    rows.push(withEntity(corporateEntity, {
      function_id: id('FUNC', corporateEntity, name, index),
      function_name: name,
      function_category: category,
      parent_function_name: 'Corporate shared services',
      business_capability: `${name} strategy; service delivery; controls; performance management`,
      executive_owner: owner,
      operating_model: 'Centralized corporate shared service with OpCo service consumers',
      critical_processes_structured: processes,
      primary_kpis_structured: 'cycle time; cost per transaction; control exceptions; service satisfaction; automation rate',
      kpi_source_ref: 'shared-services-kpi-pack.xlsx',
      function_criticality: criticality,
      stakeholder_facing_type: 'internal',
      supporting_system_refs: 'Workday HCM; ServiceNow ITSM; Snowflake Enterprise Lake; Microsoft 365 Copilot',
      supporting_data_asset_refs: 'enterprise KPI catalog; workforce data; finance data products',
      supporting_vendor_refs: 'Microsoft; ServiceNow; Snowflake; Accenture',
      known_business_pain_points: 'Fragmented service ownership, inconsistent OpCo data definitions, manual exception handling',
      ai_opportunity_areas: 'AI service desk; close automation; cash forecasting; contract review; HR knowledge assistant',
    }));
  });
  for (const entity of opcos) {
    opcoFunctionTemplates.forEach(([name, category, owner, processes, criticality], index) => {
      rows.push(withEntity(entity, {
        function_id: id('FUNC', entity, name, index),
        function_name: name,
        function_category: category,
        parent_function_name: entity.entity_name,
        business_capability: `${name} planning; execution; controls; reporting`,
        executive_owner: owner.replace('OpCo', entity.entity_short_name),
        operating_model: 'OpCo-led function with corporate policy, data, and platform guardrails',
        critical_processes_structured: processes,
        primary_kpis_structured: 'cycle time; backlog; cost; service level; quality; first-pass yield',
        kpi_source_ref: `${slug(entity.entity_short_name)}-function-scorecard.xlsx`,
        function_criticality: criticality,
        stakeholder_facing_type: category === 'customer' ? 'customer' : 'mixed',
        supporting_system_refs: `${entity.entity_short_name} ERP Core; ${entity.entity_short_name} Business Intelligence; ServiceNow ITSM`,
        supporting_data_asset_refs: `${entity.entity_short_name} operational KPI data product; ${entity.entity_short_name} finance data product`,
        supporting_vendor_refs: 'Microsoft; Local OpCo Systems Integrator',
        known_business_pain_points: 'Manual handoffs, local system variation, reporting latency, incomplete workflow standardization',
        ai_opportunity_areas: 'copilot assisted work; exception triage; operational forecasting; shared services workflow automation',
      }));
    });
  }
  return rows;
}

function buildOrgOwnership() {
  const corporateRoles = [
    ['Corporate CIO', 'CEO', 'Technology strategy, platform standards, AI/data governance', '$190.6M direct technology budget influence'],
    ['CFO', 'CEO', 'Finance, treasury, FP&A, value realization', 'Final value attestation'],
    ['VP Innovation', 'Corporate CIO', 'AI and automation portfolio, use-case intake, experiment governance', '$11.8M AI/data budget influence'],
    ['CHRO', 'CEO', 'HR shared services and workforce modernization', 'HR service-delivery transformation'],
    ['General Counsel', 'CEO', 'Legal, compliance, contracting, outside counsel', 'Legal AI controls'],
    ['CISO', 'Corporate CIO', 'Cybersecurity, identity, risk posture', 'Security approval authority'],
    ['Chief Data Officer', 'Corporate CIO', 'Data platform, semantic layer, data quality', 'Data product certification'],
    ['Treasurer', 'CFO', 'Cash, liquidity, payments, bank relationships', 'Treasury controls and Kyriba readiness'],
    ['VP Enterprise Applications', 'Corporate CIO', 'ERP, EPM, HCM, CLM, enterprise app portfolio', 'Application modernization roadmap'],
    ['VP IT Operations', 'Corporate CIO', 'ITSM, infrastructure, endpoint, service delivery', 'Run operations'],
    ['VP Procurement', 'CFO', 'Sourcing, supplier management, contract savings', 'Third-party spend governance'],
    ['Director Shared Services', 'CFO', 'Service center design, SLA, intake and service catalog', 'Shared-services operating model'],
    ['Director Data Governance', 'Chief Data Officer', 'Definitions, stewardship, quality controls', 'Semantic definition approval'],
    ['Director Automation Factory', 'VP Innovation', 'RPA/AI delivery standards and production support', 'Automation pipeline'],
    ['Enterprise Architect', 'Corporate CIO', 'Architecture standards, integration, technical debt', 'Architecture approval'],
    ['Director Change Management', 'VP Innovation', 'Adoption, training, stakeholder readiness', 'Transformation adoption'],
    ['Director Vendor Management', 'VP Procurement', 'Vendor performance, renewals, commercial governance', 'Renewal governance'],
    ['Controller', 'CFO', 'Close, consolidation, audit evidence', 'Accounting controls'],
  ];
  const rows = corporateRoles.map(([role, reportsTo, rights, budget], index) => withEntity(corporateEntity, {
    ownership_id: id('OWN', corporateEntity, role, index),
    org_unit: 'Corporate shared services',
    leader_role: role,
    leader_name: syntheticPerson(role, corporateEntity.entity_short_name, index),
    reports_to_role: reportsTo,
    decision_rights: rights,
    budget_authority: budget,
    business_or_it_org: role.match(/CIO|Data|IT|Architect|CISO|Automation/) ? 'IT' : 'Business',
    escalation_path: `${role} -> ${reportsTo}`,
  }));
  for (const entity of opcos) {
    roleTemplates.forEach(([role, family, rights, authority], index) => {
      rows.push(withEntity(entity, {
        ownership_id: id('OWN', entity, role, index),
        org_unit: `${entity.entity_short_name} leadership`,
        leader_role: role,
        leader_name: syntheticPerson(role, entity.entity_short_name, index),
        reports_to_role: role === 'President' ? 'Lakeshore CEO' : `${entity.entity_short_name} President`,
        decision_rights: rights,
        budget_authority: authority === 'budget_authority' ? `${Math.round(entity.total_direct_technology_budget_usd / 1000000)}M technology and local transformation influence` : 'functional decision authority',
        business_or_it_org: family === 'technology' ? 'IT' : 'Business',
        escalation_path: `${role} -> ${entity.entity_short_name} President -> Lakeshore portfolio leadership`,
      }));
    });
  }
  return rows;
}

function syntheticPerson(role, unit, index) {
  const first = ['Maya', 'Victor', 'Elena', 'Marcus', 'Priya', 'Daniel', 'Sofia', 'Jordan', 'Leah', 'Nolan', 'Asha', 'Graham', 'Iris', 'Mateo', 'Nina', 'Caleb', 'Renee', 'Owen'];
  const last = ['Keller', 'Ortiz', 'Shah', 'Morrison', 'Bennett', 'Chen', 'Okafor', 'Reilly', 'Marchetti', 'Donnelly', 'Patel', 'Santos', 'Walker', 'Hale', 'Nguyen', 'Brooks'];
  return `${first[index % first.length]} ${last[(index + unit.length + role.length) % last.length]}`;
}

function buildPersonas() {
  const rows = [];
  for (const entity of [corporateEntity, ...opcos]) {
    const templates = entity.entity_scope === 'holdco'
      ? [
          ['Executive sponsor', 'executive', 14, 'Approves portfolio choices, cross-OpCo standards, and capital gates', 'medium'],
          ['Shared services agent', 'corporate', 180, 'Handles HR, finance, IT, procurement, and legal service requests', 'high'],
          ['Finance operations analyst', 'finance', 65, 'Runs AP/AR, close, treasury support, controls, and reporting tasks', 'medium'],
          ['IT service desk analyst', 'technology', 48, 'Handles incidents, access, changes, asset requests, and knowledge support', 'high'],
          ['Data steward', 'technology', 35, 'Owns definitions, quality checks, lineage, and data product acceptance', 'medium'],
          ['Procurement category manager', 'supply chain', 26, 'Manages supplier negotiations, renewals, category savings', 'medium'],
          ['Legal operations specialist', 'risk', 18, 'Supports contract review, matter triage, outside counsel spend', 'medium'],
          ['HR business partner', 'corporate', 34, 'Supports employee cases, workforce planning, and policy adoption', 'medium'],
          ['Automation product owner', 'technology', 16, 'Owns workflow automation backlog and adoption measures', 'high'],
          ['Security operations analyst', 'technology', 22, 'Monitors alerts, vulnerabilities, access, and risk exceptions', 'medium'],
          ['Executive assistant / knowledge worker', 'corporate', 110, 'Uses productivity AI, meeting synthesis, document generation', 'high'],
          ['Transformation PMO lead', 'corporate', 20, 'Runs roadmap, benefits tracking, stakeholder actions', 'medium'],
        ]
      : personaTemplates;
    templates.forEach(([name, family, population, tasks, readiness], index) => {
      rows.push(withEntity(entity, {
        persona_id: id('PER', entity, name, index),
        persona_name: name,
        role_family: family,
        population_count: population,
        primary_tasks: tasks,
        systems_used: `${entity.entity_short_name} ERP Core; ServiceNow ITSM; Microsoft 365 Copilot; Power BI`,
        pain_points: 'Manual lookup, fragmented data, exception rework, unclear ownership, duplicate entry',
        change_readiness: readiness,
        ai_enablement_need: 'Role-specific workflow assistant, policy grounding, data access guardrails, and adoption support',
      }));
    });
  }
  return rows;
}

function buildSystems() {
  const rows = [];
  corporateSystems.forEach(([name, category, vendor, domain, cost, criticality], index) => {
    rows.push(withEntity(corporateEntity, {
      system_id: id('SYS', corporateEntity, name, index),
      system_name: name,
      system_aliases: slug(name),
      system_scope: 'corporate_shared_service',
      ownership_model: 'owned_by_corporate_it_or_shared_service_function',
      served_entity_ids: allOpcoEntityIds,
      served_entity_names: allOpcoEntityNames,
      service_consumer_type: 'all_portfolio_companies',
      system_category: category,
      vendor_product: vendor,
      hosting_model: name.match(/Azure|Snowflake|Microsoft|Workday|ServiceNow|Kyriba|Okta|CrowdStrike|dbt|Purview|Monte Carlo/) ? 'SaaS / cloud' : 'hybrid',
      business_function_refs: corporateFunctionRefs(name),
      critical_process_refs: domain,
      business_owner_role: corporateOwnerForSystem(name),
      technical_owner_role: systemTechOwner(name),
      criticality,
      lifecycle_status: 'production',
      modernization_disposition: 'standardize_and_optimize',
      annual_run_cost_usd: fmtCurrency(cost),
      vendor_contract_refs: vendor,
      data_domains: domain,
      ai_data_readiness: name.match(/Snowflake|dbt|Data|Purview|Monte Carlo/) ? 'certified_candidate' : 'needs_lineage_confirmation',
      decision_relevance: 'shared_services_ai_and_backoffice_transformation',
    }));
  });
  for (const entity of opcos) {
    systemTemplates.forEach(([suffix, category, vendor, domain, baseCost, criticality], index) => {
      rows.push(withEntity(entity, {
      system_id: id('SYS', entity, suffix, index),
      system_name: `${entity.entity_short_name} ${suffix}`,
      system_aliases: `${slug(entity.entity_short_name)}-${slug(suffix)}`,
      system_scope: 'opco_local_application',
      ownership_model: 'owned_by_portfolio_company_it_with_corporate_standards',
      served_entity_ids: entity.entity_id,
      served_entity_names: entity.entity_name,
      service_consumer_type: 'owning_portfolio_company',
      system_category: category,
      vendor_product: vendorForEntity(vendor, entity),
        hosting_model: category.match(/ERP|MES|EAM/) ? 'hybrid' : 'SaaS / cloud',
        business_function_refs: systemFunctionRefs(suffix),
        critical_process_refs: domain,
        business_owner_role: businessOwnerForSystem(suffix),
        technical_owner_role: `${entity.entity_short_name} IT Operations Manager`,
        criticality,
        lifecycle_status: index % 7 === 0 ? 'modernization_candidate' : 'production',
        modernization_disposition: index % 7 === 0 ? 'rationalize_or_modernize' : 'maintain_with_controls',
        annual_run_cost_usd: fmtCurrency(Math.round(baseCost * (0.75 + entity.revenue_usd / 4500000000))),
        vendor_contract_refs: vendor,
        data_domains: domain,
        ai_data_readiness: index % 4 === 0 ? 'needs_data_quality_gate' : 'usable_with_owner_confirmation',
        decision_relevance: 'opco_process_transformation_and_shared_services_dependency',
      }));
    });
  }
  return rows;
}

function vendorForEntity(vendor, entity) {
  if (vendor === 'SAP ECC' && entity.entity_short_name.match(/Brightmark|Forge|Pantry/)) return entity.entity_short_name === 'Brightmark' ? 'Infor M3' : 'Microsoft Dynamics 365 F&O';
  return vendor;
}

function corporateFunctionRefs(name) {
  if (name.match(/Kyriba/)) return 'Corporate Treasury';
  if (name.match(/EPM|OneStream/)) return 'Finance and Controller; FP&A and Business Finance';
  if (name.match(/Workday/)) return 'Shared HR Operations';
  if (name.match(/ServiceNow/)) return 'IT Service Management';
  if (name.match(/Snowflake|dbt|Data|Purview|Monte Carlo/)) return 'Data and Analytics';
  if (name.match(/Icertis|Legal/)) return 'Legal and Compliance';
  if (name.match(/Copilot|OpenAI|UiPath/)) return 'AI and Automation Office';
  return 'Enterprise Applications';
}

function corporateOwnerForSystem(name) {
  if (name.match(/Kyriba/)) return 'Treasurer';
  if (name.match(/EPM|OneStream|Procurement/)) return 'CFO';
  if (name.match(/Workday/)) return 'CHRO';
  if (name.match(/CrowdStrike|Cyber|Okta|Privileged|Splunk/)) return 'CISO';
  if (name.match(/Snowflake|dbt|Data|Purview|Monte Carlo/)) return 'Chief Data Officer';
  if (name.match(/Icertis|Legal/)) return 'General Counsel';
  if (name.match(/Copilot|OpenAI|UiPath/)) return 'VP Innovation';
  return 'Corporate CIO';
}

function systemTechOwner(name) {
  if (name.match(/Cyber|Okta|CrowdStrike|Privileged|Splunk/)) return 'CISO';
  if (name.match(/Data|Snowflake|dbt|Purview|Monte Carlo/)) return 'Chief Data Officer';
  if (name.match(/Integration|API/)) return 'VP Enterprise Architecture';
  if (name.match(/ServiceNow/)) return 'VP IT Operations';
  return 'VP Enterprise Applications';
}

function systemFunctionRefs(suffix) {
  if (suffix.match(/ERP/)) return 'Finance and Controller; Procurement and Supplier Management; Manufacturing Operations';
  if (suffix.match(/Manufacturing/)) return 'Manufacturing Operations; Quality and Food Safety';
  if (suffix.match(/Warehouse|Transportation/)) return 'Supply Chain and Logistics';
  if (suffix.match(/CRM|Customer|E-commerce/)) return 'Sales and Customer Operations';
  if (suffix.match(/Quality|Safety/)) return 'Quality and Food Safety';
  if (suffix.match(/Maintenance/)) return 'Maintenance and Reliability';
  if (suffix.match(/Labor/)) return 'People Operations';
  if (suffix.match(/Procurement/)) return 'Procurement and Supplier Management';
  if (suffix.match(/Data|BI/)) return 'Digital and IT';
  if (suffix.match(/Field/)) return 'Field Service Operations';
  return 'Digital and IT';
}

function businessOwnerForSystem(suffix) {
  if (suffix.match(/ERP|BI|Data|Integration/)) return 'CFO / CIO';
  if (suffix.match(/Manufacturing|Plant|Maintenance|Safety/)) return 'COO';
  if (suffix.match(/Warehouse|Transportation|Procurement/)) return 'VP Supply Chain';
  if (suffix.match(/CRM|Customer|E-commerce/)) return 'Chief Commercial Officer';
  if (suffix.match(/Labor/)) return 'HR Director';
  if (suffix.match(/Field/)) return 'VP Field Operations';
  return 'OpCo CIO';
}

function buildDataAssets(systems) {
  const rows = [];
  const templates = [
    ['finance close data product', 'financials', 'daily', 'CFO'],
    ['order-to-cash data product', 'commercial', 'daily', 'Chief Commercial Officer'],
    ['procure-to-pay data product', 'procurement', 'daily', 'VP Procurement'],
    ['inventory and warehouse data product', 'supply_chain', 'hourly', 'VP Supply Chain'],
    ['workforce and labor data product', 'workforce', 'daily', 'HR Director'],
    ['quality and safety data product', 'quality', 'daily', 'VP Quality'],
    ['service management data product', 'technology', 'real-time', 'OpCo CIO'],
    ['operational KPI semantic model', 'operations', 'daily', 'COO'],
    ['customer service interactions', 'customer', 'hourly', 'Chief Commercial Officer'],
    ['automation opportunity ledger', 'innovation', 'weekly', 'VP Innovation'],
  ];
  for (const entity of [corporateEntity, ...opcos]) {
    templates.forEach(([name, domain, frequency, owner], index) => {
      rows.push(withEntity(entity, {
        data_asset_id: id('DATA', entity, name, index),
        data_asset_name: `${entity.entity_short_name} ${name}`,
        system_of_record: pickSystemForEntity(systems, entity, domain),
        integration_type: domain === 'technology' ? 'api_event_stream' : 'batch_and_api',
        data_owner: owner,
        data_steward: `${entity.entity_short_name} Data Steward`,
        refresh_frequency: frequency,
        data_quality_status: index % 3 === 0 ? 'needs_certification' : 'usable_with_monitoring',
        lineage_status: index % 4 === 0 ? 'partial_lineage' : 'documented',
        ai_consumption_readiness: index % 3 === 0 ? 'gate_required' : 'candidate',
      }));
    });
  }
  return rows;
}

function pickSystemForEntity(systems, entity, domain) {
  const scoped = systems.filter((system) => system.entity_id === entity.entity_id);
  const hit = scoped.find((system) => String(system.data_domains).includes(domain));
  return hit?.system_name ?? scoped[0]?.system_name ?? 'Needs evidence';
}

function buildVendors() {
  const rows = [];
  for (const entity of [corporateEntity, ...opcos]) {
    vendorTemplates.forEach(([vendor, category, baseCost, role, risk], index) => {
      rows.push(withEntity(entity, {
        vendor_id: id('VEND', entity, vendor, index),
        vendor_name: vendor === 'Local OpCo Systems Integrator' ? `${entity.entity_short_name} Systems Integrator` : vendor,
        vendor_category: category,
        annual_cost_usd: Math.round(baseCost * (entity.entity_scope === 'holdco' ? 1.7 : Math.max(0.35, entity.revenue_usd / 1500000000))),
        renewal_date: `202${7 + (index % 3)}-${String((index % 12) + 1).padStart(2, '0')}-15`,
        contract_risk: risk,
        vendor_role: role,
        supported_functions: entity.entity_scope === 'holdco' ? 'shared services; technology; finance; data; cyber' : 'local operations; finance; supply chain; customer operations',
        concentration_notes: index < 3 ? 'material dependency for standardized operations and AI readiness' : 'normal operating dependency',
      }));
    });
  }
  return rows;
}

function buildSpendValue() {
  const rows = [];
  for (const entity of [corporateEntity, ...opcos]) {
    const budget = entity.total_direct_technology_budget_usd;
    const categories = [
      ['Run operations', 'run_cost', 0.42, 'committed'],
      ['Application modernization', 'change', 0.16, 'discretionary'],
      ['Data platform and analytics', 'data_ai', 0.11, 'mixed'],
      ['Cybersecurity and identity', 'risk', 0.10, 'committed'],
      ['Shared services automation', 'automation', 0.08, 'discretionary'],
      ['Infrastructure and cloud', 'run_cost', 0.13, 'committed'],
    ];
    categories.forEach(([name, type, pct, model], index) => {
      rows.push(withEntity(entity, {
        spend_id: id('SPEND', entity, name, index),
        amount_usd: Math.round(budget * pct),
        spend_category: name,
        spend_type: type,
        run_change: type === 'run_cost' ? 'run' : 'change',
        spend_owner: entity.cxo_sponsor,
        committed_vs_discretionary: model,
        value_linkage: type === 'automation' || type === 'data_ai' ? 'linked_to_ai_and_shared_services_transformation' : 'operating_runway',
        unit_economics: `${Math.round((budget * pct) / Math.max(1, entity.employee_count))} USD per employee`,
      }));
    });
  }
  return rows;
}

function buildPrograms() {
  const rows = [];
  const corporate = [
    ['Shared services AI service desk', 'in_flight', 'VP Innovation', 'reduce Tier 1 HR/Finance/IT cases and improve employee experience'],
    ['Kyriba treasury control evidence', 'in_flight', 'Treasurer', 'cash visibility, bank connectivity, payment controls'],
    ['Finance close automation', 'planned', 'CFO', 'reduce close cycle and reconciliation rework'],
    ['Legal contract AI intake', 'planned', 'General Counsel', 'contract triage, clause review, outside counsel spend controls'],
    ['Entity spine and semantic data foundation', 'in_flight', 'Chief Data Officer', 'create governed entity/function/system/vendor spine'],
    ['Workday employee service modernization', 'planned', 'CHRO', 'HR service catalog and knowledge automation'],
  ];
  corporate.forEach(([name, status, sponsor, purpose], index) => {
    rows.push(withEntity(corporateEntity, {
      priority_id: id('PROG', corporateEntity, name, index),
      priority_name: name,
      priority_type: 'shared_services_transformation',
      business_sponsor: sponsor,
      current_status: status,
      decision_required: 'Approve gate, owner, baseline, and 90-day value proof.',
      value_hypothesis: purpose,
    }));
  });
  for (const entity of opcos) {
    [
      [`${entity.entity_short_name} ERP/data readiness sprint`, 'planned', entity.cxo_sponsor, 'certify core ERP, finance, customer, inventory, and workforce data'],
      [`${entity.entity_short_name} operations exception triage`, 'candidate', 'COO', 'AI-assisted backlog, quality, and operational exception prioritization'],
      [`${entity.entity_short_name} customer service copilot`, 'candidate', 'Chief Commercial Officer', 'reduce case handle time and improve knowledge consistency'],
    ].forEach(([name, status, sponsor, purpose], index) => rows.push(withEntity(entity, {
      priority_id: id('PROG', entity, name, index),
      priority_name: name,
      priority_type: 'opco_transformation',
      business_sponsor: sponsor,
      current_status: status,
      decision_required: 'Confirm owner, baseline, data products, and adoption plan.',
      value_hypothesis: purpose,
    })));
  }
  return rows;
}

function buildAiInitiatives(programs) {
  return programs.map((program, index) => ({
    ...withEntity(entityById(program.entity_id), {
      ai_initiative_id: `AI-${String(index + 1).padStart(4, '0')}`,
      ai_use_case: program.priority_name,
      tool_or_model: index % 3 === 0 ? 'Microsoft 365 Copilot + workflow grounding' : index % 3 === 1 ? 'Azure OpenAI governed assistant' : 'UiPath + document intelligence',
      active_users: program.entity_scope === 'holdco' ? 250 + index * 35 : 45 + index * 20,
      production_status: program.current_status === 'in_flight' ? 'pilot' : 'candidate',
      readiness_gate: 'named owner, data product, control baseline, human review, value metric',
      value_risk_posture: index % 2 === 0 ? 'high_value_readiness_gated' : 'medium_value_needs_baseline',
    }),
  }));
}

function entityById(entityId) {
  return entities.find((entity) => entity.entity_id === entityId) ?? corporateEntity;
}

function buildControls() {
  const rows = [];
  for (const entity of [corporateEntity, ...opcos]) {
    [
      ['Data owner signoff', 'data_quality', 'high', 'open'],
      ['AI human review control', 'model_risk', 'high', 'drafted'],
      ['Access and segregation of duties', 'security', 'critical', 'in_place'],
      ['Process baseline evidence', 'value_proof', 'high', 'open'],
      ['Change-management and adoption plan', 'change', 'medium', 'drafted'],
      ['Vendor data processing review', 'third_party', 'medium', 'open'],
    ].forEach(([name, category, severity, status], index) => rows.push(withEntity(entity, {
      control_id: id('CTRL', entity, name, index),
      process_control_name: `${entity.entity_short_name} ${name}`,
      risk_category: category,
      severity,
      status,
      control_owner: category === 'security' ? 'CISO' : entity.cxo_sponsor,
      evidence_required: 'policy, owner attestation, source-system extract, and control test result',
    })));
  }
  return rows;
}

function buildRelationships(functions, systems, vendors, dataAssets, programs) {
  const rows = [];
  let edge = 1;
  function add(entity, from, fromType, rel, to, toType, strength = 'strong') {
    rows.push(withEntity(entity, {
      relationship_id: `REL-${String(edge++).padStart(5, '0')}`,
      from_object_ref: from,
      from_object_type: fromType,
      relationship_type: rel,
      to_object_ref: to,
      to_object_type: toType,
      relationship_direction: 'outbound',
      evidence_ref: `${entity.entity_short_name} relationship evidence pack`,
      relationship_strength: strength,
      quality_score: strength === 'strong' ? 92 : strength === 'medium' ? 76 : 61,
      graph_materialization_status: 'ready',
    }));
  }
  for (const entity of [corporateEntity, ...opcos]) {
    const ef = functions.filter((row) => row.entity_id === entity.entity_id);
    const es = systems.filter((row) => row.entity_id === entity.entity_id);
    const ev = vendors.filter((row) => row.entity_id === entity.entity_id);
    const ed = dataAssets.filter((row) => row.entity_id === entity.entity_id);
    const ep = programs.filter((row) => row.entity_id === entity.entity_id);
    for (const fn of ef) {
      for (const sys of es.filter((system) => String(system.business_function_refs).includes(fn.function_name)).slice(0, 4)) {
        add(entity, sys.system_name, 'application_system', 'supports', fn.function_name, 'business_function', 'strong');
      }
      for (const asset of ed.filter((data) => String(data.data_owner).includes(String(fn.executive_owner).split(' ')[0]) || String(data.data_asset_name).toLowerCase().includes(String(fn.function_category).split(' ')[0])).slice(0, 2)) {
        add(entity, fn.function_name, 'business_function', 'uses_data_from', asset.data_asset_name, 'data_asset', 'medium');
      }
    }
    for (const vendor of ev.slice(0, 10)) {
      const sys = es[edge % Math.max(1, es.length)];
      if (sys) add(entity, vendor.vendor_name, 'vendor_contract', 'supplies_or_supports', sys.system_name, 'application_system', vendor.contract_risk === 'high' ? 'strong' : 'medium');
    }
    for (const sys of es.slice(0, 12)) {
      const asset = ed.find((data) => String(sys.data_domains).includes(String(data.data_asset_name).split(' ').at(-2) ?? '')) ?? ed[edge % Math.max(1, ed.length)];
      if (asset) add(entity, sys.system_name, 'application_system', 'produces_or_consumes', asset.data_asset_name, 'data_asset', 'medium');
    }
    for (const program of ep) {
      add(entity, program.priority_name, 'program_initiative', 'depends_on', ef[edge % ef.length]?.function_name ?? 'Digital and IT', 'business_function', 'strong');
      add(entity, program.priority_name, 'program_initiative', 'requires_data_from', ed[edge % ed.length]?.data_asset_name ?? 'data product', 'data_asset', 'medium');
    }
  }
  return rows;
}

function buildBridge(functions, systems, vendors, dataAssets) {
  const rows = [];
  let n = 1;
  for (const entity of [corporateEntity, ...opcos]) {
    const ef = functions.filter((row) => row.entity_id === entity.entity_id);
    const es = systems.filter((row) => row.entity_id === entity.entity_id);
    const ev = vendors.filter((row) => row.entity_id === entity.entity_id);
    const ed = dataAssets.filter((row) => row.entity_id === entity.entity_id);
    for (const fn of ef) {
      for (const system of es.filter((row) => String(row.business_function_refs).includes(fn.function_name)).slice(0, 3)) {
        rows.push(withEntity(entity, {
          bridge_id: `BR-${String(n++).padStart(5, '0')}`,
          function_ref: fn.function_name,
          dependency_type: 'system',
          object_ref: system.system_name,
          role_in_function: 'primary workflow or data dependency',
          criticality_to_function: system.criticality,
          primary_secondary: 'primary',
          process_supported: fn.critical_processes_structured,
          data_exchanged: system.data_domains,
          evidence_ref: `${entity.entity_short_name} function-system bridge`,
        }));
      }
      if (entity.entity_scope === 'portfolio_company') {
        for (const system of sharedCorporateSystemsForFunction(fn, systems).slice(0, 3)) {
          rows.push(withEntity(entity, {
            bridge_id: `BR-${String(n++).padStart(5, '0')}`,
            function_ref: fn.function_name,
            dependency_type: 'corporate_shared_system',
            object_ref: system.system_name,
            role_in_function: 'shared-service platform consumed by portfolio company function',
            criticality_to_function: system.criticality,
            primary_secondary: ['Finance and Controller', 'People Operations', 'Digital and IT'].includes(fn.function_name) ? 'primary' : 'secondary',
            process_supported: fn.critical_processes_structured,
            data_exchanged: system.data_domains,
            evidence_ref: `${entity.entity_short_name} shared-service consumption map`,
          }));
        }
      }
      const data = ed[n % ed.length];
      if (data) rows.push(withEntity(entity, {
        bridge_id: `BR-${String(n++).padStart(5, '0')}`,
        function_ref: fn.function_name,
        dependency_type: 'data_asset',
        object_ref: data.data_asset_name,
        role_in_function: 'reporting, control, or AI-readiness data dependency',
        criticality_to_function: 'high',
        primary_secondary: 'secondary',
        process_supported: fn.critical_processes_structured,
        data_exchanged: data.data_asset_name,
        evidence_ref: `${entity.entity_short_name} data product catalog`,
      }));
      const vendor = ev[n % ev.length];
      if (vendor) rows.push(withEntity(entity, {
        bridge_id: `BR-${String(n++).padStart(5, '0')}`,
        function_ref: fn.function_name,
        dependency_type: 'vendor',
        object_ref: vendor.vendor_name,
        role_in_function: vendor.vendor_role,
        criticality_to_function: vendor.contract_risk === 'high' ? 'high' : 'medium',
        primary_secondary: 'secondary',
        process_supported: fn.critical_processes_structured,
        data_exchanged: 'contract, service, performance, and spend data',
        evidence_ref: `${entity.entity_short_name} vendor dependency catalog`,
      }));
    }
  }
  return rows;
}

function sharedCorporateSystemsForFunction(fn, systems) {
  const corporate = systems.filter((system) => system.entity_id === corporateEntity.entity_id);
  const name = String(fn.function_name);
  const category = String(fn.function_category);
  const matchers = [];
  if (/Finance|FP&A|Controller/i.test(name) || category === 'finance') matchers.push(/Oracle EPM|OneStream|Power BI|Snowflake|dbt|Master Data/i);
  if (/People|HR/i.test(name) || category === 'corporate') matchers.push(/Workday|ServiceNow|Microsoft 365 Copilot/i);
  if (/Legal|Compliance/i.test(name) || category === 'risk') matchers.push(/Icertis|Legal Tracker|Microsoft 365 Copilot/i);
  if (/Procurement|Supplier/i.test(name) || category === 'supply chain') matchers.push(/Coupa|Icertis|Power BI/i);
  if (/Digital|IT/i.test(name) || category === 'technology') matchers.push(/ServiceNow|Azure Integration|Okta|CrowdStrike|Snowflake|Power BI/i);
  if (/Sales|Customer/i.test(name) || category === 'customer') matchers.push(/Microsoft 365 Copilot|Power BI|Snowflake/i);
  if (/Manufacturing|Supply Chain|Quality|Maintenance|Field/i.test(name) || category === 'operations') matchers.push(/Azure Integration|Snowflake|Power BI|ServiceNow/i);
  return corporate.filter((system) => matchers.some((matcher) => matcher.test(system.system_name)));
}

function buildMetrics(functions) {
  const rows = [];
  let n = 1;
  for (const fn of functions) {
    const entity = entityById(fn.entity_id);
    ['cycle time', 'backlog', 'cost per transaction', 'automation rate'].forEach((metric, index) => {
      rows.push(withEntity(entity, {
        metric_id: `MET-${String(n++).padStart(5, '0')}`,
        metric_name: `${fn.function_name} ${metric}`,
        metric_definition: `Measures ${metric} for ${fn.function_name} at ${entity.entity_short_name}.`,
        metric_owner: fn.executive_owner,
        unit: metric.includes('rate') ? 'percent' : metric.includes('cost') ? 'USD' : 'count/days',
        target_value: metric.includes('rate') ? '25%' : metric.includes('cost') ? '10% reduction' : '15% improvement',
        baseline_source: fn.kpi_source_ref,
      }));
    });
  }
  return rows;
}

function buildSourceEvidence() {
  const rows = [];
  for (const entity of [corporateEntity, ...opcos]) {
    [
      ['enterprise profile', 'profile and financial baseline'],
      ['application inventory', 'systems, owners, costs, criticality'],
      ['org and persona roster', 'roles, decision rights, personas'],
      ['vendor and contract extract', 'vendor cost, renewal, risk'],
      ['process and KPI pack', 'functions, process baselines, metrics'],
      ['data product catalog', 'data owners, quality, lineage, AI readiness'],
    ].forEach(([name, purpose], index) => rows.push(withEntity(entity, {
      evidence_id: id('EVID', entity, name, index),
      source_artifact_uri: `synthetic://${tenantKey}/${slug(entity.entity_short_name)}/${slug(name)}.xlsx`,
      source_artifact_label: `${entity.entity_short_name} ${name}`,
      evidence_purpose: purpose,
      validation_status: 'synthetic_demo',
      sensitivity: 'confidential',
      owner: entity.cxo_sponsor,
      freshness: 'current_static_snapshot',
    })));
  }
  return rows;
}

function simpleDimension(entityRows, prefix, rowsPerEntity, fields) {
  const rows = [];
  for (const entity of entityRows) {
    for (let index = 0; index < rowsPerEntity; index += 1) {
      rows.push(withEntity(entity, fields(entity, index, `${prefix}-${entity.entity_short_name}-${index + 1}`)));
    }
  }
  return rows;
}

function buildOtherDimensions(functions, systems, vendors, dataAssets, programs) {
  return {
    'V7_15_industry_market_knowledge_patterns.csv': [
      ['Back-office AI value office', 'industrial_shared_services', 'prioritize finance, HR, legal, procurement, and IT service workflows where volume, baseline, and owner exist'],
      ['Finance close automation', 'finance_transformation', 'gate AI on reconciliation evidence, account ownership, and close-cycle baseline'],
      ['Treasury cash forecasting', 'treasury', 'certify bank feeds, ERP/AP/AR/GL quality, and signer controls before scaling'],
      ['Legal AI intake', 'legal_operations', 'start with matter triage and clause playbooks; keep attorney review controls'],
      ['HR shared services assistant', 'hr_operations', 'ground policy answers in HR knowledge base and case taxonomy before broad rollout'],
    ].map(([pattern_name, industry_domain, recommended_actions], index) => ({ pattern_id: `PAT-${String(index + 1).padStart(3, '0')}`, pattern_name, industry_domain, recommended_actions, pattern_confidence: 'high', ...commonEvidence })),
    'V7_16_expert_lenses.csv': [
      ['CIO', 'technology_portfolio', 'what should we scale, certify, hold, or stop', 'proof of ownership, integration depth, run cost, value baseline'],
      ['CFO', 'value_and_controls', 'what value is committed vs proven', 'finance attestation, baseline, control evidence'],
      ['VP Innovation', 'ai_and_automation', 'where should AI change how work is done', 'use-case owner, adoption path, data readiness, risk gate'],
      ['CHRO', 'people_and_shared_services', 'where HR AI can improve service without policy risk', 'policy grounding, HRIS data, employee experience baseline'],
      ['General Counsel', 'legal_ai_governance', 'where legal AI can safely assist', 'matter type, privilege, attorney review, retention policy'],
    ].map(([expert_lens_name, lens_domain, question_families, decision_criteria], index) => ({ lens_id: `LENS-${String(index + 1).padStart(3, '0')}`, expert_lens_name, lens_domain, question_families, decision_criteria, ...commonEvidence })),
    'V7_17_client_rate_card_cost_basis.csv': simpleDimension([corporateEntity], 'RATE', 18, (entity, index) => ({
      rate_card_id: `RATE-${String(index + 1).padStart(3, '0')}`,
      service_tower: ['Finance operations', 'HR operations', 'Legal operations', 'IT service desk', 'Data engineering', 'Automation delivery'][index % 6],
      role_family: ['analyst', 'senior analyst', 'manager'][index % 3],
      seniority: ['junior', 'mid', 'senior'][index % 3],
      delivery_location: ['US', 'nearshore', 'offshore'][index % 3],
      rate_usd_per_hour: [85, 115, 150, 55, 42, 75][index % 6],
    })),
    'V7_19_service_tower_managed_services_scope.csv': simpleDimension([corporateEntity, ...opcos], 'TOWER', 6, (entity, index) => ({
      scope_id: id('TOWER', entity, `scope ${index}`, index),
      service_tower: ['Finance operations', 'HR operations', 'Legal operations', 'IT operations', 'Data platform', 'Automation factory'][index % 6],
      scope_item: `${entity.entity_short_name} ${['intake', 'fulfillment', 'quality review', 'reporting', 'controls', 'continuous improvement'][index % 6]}`,
      included_services: 'intake, triage, execution, reporting, exception handling',
      sla: ['P1 4h', 'P2 1 business day', 'P3 3 business days'][index % 3],
      pricing_unit: ['per ticket', 'per FTE', 'per workflow', 'per application'][index % 4],
    })),
    'V7_20_chunk_retrieval_registry.csv': [...functions.slice(0, 120), ...systems.slice(0, 120), ...vendors.slice(0, 80), ...dataAssets.slice(0, 80)].map((row, index) => withEntity(entityById(row.entity_id), {
      chunk_id: `CHK-${String(index + 1).padStart(5, '0')}`,
      source_artifact_ref: row.source_artifact_name,
      dimension: row.function_name ? 'business_functions' : row.system_name ? 'applications_systems' : row.vendor_name ? 'vendors_contracts' : 'data_assets_integrations',
      fact_refs: row.function_id ?? row.system_id ?? row.vendor_id ?? row.data_asset_id,
      semantic_tags: [row.entity_name, row.function_name, row.system_name, row.vendor_name, row.data_asset_name].filter(Boolean).join('; '),
      entity_refs: row.entity_id,
      retrieval_eligibility: 'eligible',
      sensitivity: 'confidential',
      embedding_model: 'text-embedding-3-large',
      index_name: 'intelligence-v7-lakeshore-holdco',
      indexed_at: asOf,
      stale_after: '2027-07-06',
    })),
    'V7_21_graph_registry_relationship_dictionary.csv': [
      ['owns', 'holding_company', 'portfolio_company', 'owned by'],
      ['supports', 'application_system', 'business_function', 'supported by'],
      ['uses_data_from', 'business_function', 'data_asset', 'used by'],
      ['supplies_or_supports', 'vendor_contract', 'application_system', 'supplied by'],
      ['depends_on', 'program_initiative', 'business_function', 'required by'],
      ['requires_data_from', 'program_initiative', 'data_asset', 'required by'],
    ].map(([edge_type, allowed_from, allowed_to, inverse_label], index) => ({ relationship_dictionary_id: `REL-DICT-${index + 1}`, edge_type, allowed_from, allowed_to, inverse_label, evidence_required: 'source artifact, owner, and relationship strength', ...commonEvidence })),
    'V7_22_operational_evidence_process_intelligence.csv': simpleDimension([corporateEntity, ...opcos], 'PROC', 10, (entity, index) => ({
      process_id: id('PROC', entity, `process ${index}`, index),
      process: ['AP invoice exception', 'employee service request', 'contract review intake', 'IT access request', 'customer case escalation', 'production schedule exception', 'supplier onboarding', 'forecast variance review', 'quality hold resolution', 'work order dispatch'][index % 10],
      work_item_type: ['ticket', 'case', 'approval', 'exception'][index % 4],
      volume: 400 + index * 125 + Math.round(entity.employee_count / 10),
      cycle_time: `${2 + (index % 7)} days`,
      bottleneck: ['manual approval', 'missing master data', 'unclear owner', 'duplicate entry', 'policy lookup'][index % 5],
    })),
    'V7_23_external_benchmark_market_corpus.csv': [
      ['Shared services automation rate', 'industrial', 'North America', 0.12, 0.35],
      ['Finance close cycle days', 'industrial', 'North America', 4, 8],
      ['HR case deflection with AI', 'industrial', 'North America', 0.15, 0.42],
      ['Legal contract AI cycle-time reduction', 'industrial', 'North America', 0.10, 0.30],
      ['IT ticket deflection with knowledge AI', 'industrial', 'North America', 0.18, 0.45],
    ].map(([benchmark_name, industry, geography, range_low, range_high], index) => ({ benchmark_id: `BM-${String(index + 1).padStart(3, '0')}`, benchmark_name, industry, geography, range_low, range_high, benchmark_basis: 'synthetic planning benchmark; not tenant fact', ...commonEvidence })),
    'V7_24_infrastructure_cloud_estate.csv': simpleDimension([corporateEntity, ...opcos], 'INFRA', 12, (entity, index) => ({
      estate_item_id: id('INFRA', entity, `infra ${index}`, index),
      estate_item_name: `${entity.entity_short_name} ${['Azure landing zone', 'AWS workload account', 'plant network segment', 'endpoint fleet', 'identity tenant', 'backup vault', 'data gateway', 'API gateway', 'VDI pool', 'warehouse Wi-Fi', 'OT firewall', 'monitoring workspace'][index % 12]}`,
      infrastructure_category: ['cloud', 'network', 'endpoint', 'identity', 'backup', 'integration', 'security', 'observability'][index % 8],
      hosting_deployment_model: ['Azure', 'AWS', 'hybrid', 'plant_edge'][index % 4],
      criticality: index % 5 === 0 ? 'critical' : 'high',
      primary_location_region: entity.headquarters,
    })),
  };
}

async function main() {
  await fs.rm(outRoot, { recursive: true, force: true });
  await fs.mkdir(outRoot, { recursive: true });

  const enterprise = buildEnterpriseProfile();
  const functions = buildFunctions();
  const ownership = buildOrgOwnership();
  const personas = buildPersonas();
  const systems = buildSystems();
  const dataAssets = buildDataAssets(systems);
  const vendors = buildVendors();
  const spend = buildSpendValue();
  const programs = buildPrograms();
  const ai = buildAiInitiatives(programs);
  const controls = buildControls();
  const relationships = buildRelationships(functions, systems, vendors, dataAssets, programs);
  const bridge = buildBridge(functions, systems, vendors, dataAssets);
  const metrics = buildMetrics(functions);
  const evidence = buildSourceEvidence();
  const other = buildOtherDimensions(functions, systems, vendors, dataAssets, programs);

  const files = {
    'V7_00_portfolio_entity_registry.csv': entities,
    'V7_01_enterprise_profile.csv': enterprise,
    'V7_02_business_functions.csv': functions,
    'V7_03_org_ownership.csv': ownership,
    'V7_04_workforce_personas.csv': personas,
    'V7_05_applications_systems.csv': systems,
    'V7_06_data_assets_integrations.csv': dataAssets,
    'V7_07_vendors_contracts.csv': vendors,
    'V7_08_spend_value.csv': spend,
    'V7_09_programs_initiatives_business_priorities.csv': programs,
    'V7_10_ai_initiatives.csv': ai,
    'V7_11_operations_risk_controls.csv': controls,
    'V7_12_relationships_graph_edges.csv': relationships,
    'V7_13_source_evidence_registry.csv': evidence,
    'V7_14_metric_definitions.csv': metrics,
    'V7_18_function_system_data_vendor_bridge.csv': bridge,
    ...other,
  };

  const writeResults = [];
  for (const [file, rows] of Object.entries(files)) {
    writeResults.push(await writeCsv(path.join(outRoot, file), rows));
  }

  const dimensionRegistry = writeResults.map((result, index) => ({
    dimension_key: fileToDimensionKey(path.basename(result.file)),
    dimension_file: path.basename(result.file),
    dimension_label: dimensionLabel(path.basename(result.file)),
    column_count: result.columns,
    row_count: result.rows,
    sort_order: index,
    entity_spine_required: path.basename(result.file) === 'V7_00_portfolio_entity_registry.csv' ? 'source' : 'yes',
  }));
  await writeCsv(path.join(outRoot, '00_master/V7_DIMENSION_REGISTRY.csv'), dimensionRegistry);

  const fieldCatalog = buildFieldCatalog(files);
  await writeCsv(path.join(outRoot, 'field_catalog/V7_FIELD_CATALOG.csv'), fieldCatalog);
  await writeCsv(path.join(outRoot, 'client_templates/V7_00_portfolio_entity_registry.csv'), files['V7_00_portfolio_entity_registry.csv'].slice(0, 0), stableHeaders(files['V7_00_portfolio_entity_registry.csv']));
  for (const [file, rows] of Object.entries(files)) {
    await writeCsv(path.join(outRoot, 'client_templates', file), [], stableHeaders(rows));
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    contractVersion,
    tenantKey,
    tenantName,
    outputRoot: outRoot,
    totalRows: writeResults.reduce((sum, result) => sum + result.rows, 0),
    totalFiles: writeResults.length,
    source: 'repo-owned deterministic Lakeshore holdco entity-spine generator',
    files: writeResults.map((result) => ({
      file: path.basename(result.file),
      rows: result.rows,
      columns: result.columns,
      checksum_sha256: result.checksum,
    })),
  };
  await fs.writeFile(path.join(outRoot, 'V7_SYNTHETIC_MANIFEST.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  const payload = buildAzurePayload(files, writeResults, fieldCatalog);
  const payloadPath = path.join(outRoot, 'azure', 'v7-holdco-azure-load-payload.json');
  await fs.mkdir(path.dirname(payloadPath), { recursive: true });
  await fs.writeFile(payloadPath, `${JSON.stringify(payload, null, 2)}\n`);

  const validation = validatePack(files);
  await fs.writeFile(path.join(outRoot, 'V7_HOLDCO_HYGIENE_REPORT.json'), `${JSON.stringify(validation, null, 2)}\n`);
  await fs.writeFile(path.join(outRoot, 'V7_HOLDCO_HYGIENE_REPORT.html'), renderValidationHtml(validation, manifest), 'utf8');

  if (!validation.pass) {
    console.error(JSON.stringify(validation.summary, null, 2));
    process.exitCode = 1;
    return;
  }
  console.log(`Generated ${writeResults.length} files / ${manifest.totalRows} rows at ${outRoot}`);
  console.log(`Azure load payload: ${payloadPath}`);
  console.log(JSON.stringify(validation.summary, null, 2));
}

function buildAzurePayload(files, writeResults, fieldCatalog) {
  const resultByFile = new Map(writeResults.map((result) => [path.basename(result.file), result]));
  const catalogByDimension = new Map();
  for (const row of fieldCatalog) {
    const list = catalogByDimension.get(row.dimension_key) ?? [];
    list.push({
      Section: 'Holdco entity-spine contract',
      'Client Field': row.client_field,
      'Internal Field': row.column_name,
      Required: row.required_level,
      'Allowed / Format': row.allowed_format,
      'Client Instruction': row.client_instruction,
      Example: row.example_value,
      'Right Canvas / Module Use': row.module_use,
    });
    catalogByDimension.set(row.dimension_key, list);
  }
  const dimensions = Object.entries(files).map(([file, rows]) => {
    const dimensionKey = fileToDimensionKey(file);
    return {
      file,
      dimensionKey,
      label: dimensionLabel(file),
      columns: stableHeaders(rows),
      metadata: catalogByDimension.get(dimensionKey) ?? [],
    };
  });
  return {
    generatedAt: new Date().toISOString(),
    contractVersion,
    contractName: 'AbarVa V7.1 Holdco Entity-Spine Contract',
    sourceTemplateDir: path.join(outRoot, 'client_templates'),
    sourceDataDir: outRoot,
    dimensions,
    tenantPacks: [
      {
        tenantKey,
        tenantName,
        files: Object.entries(files).map(([file, rows]) => {
          const result = resultByFile.get(file);
          const dimensionKey = fileToDimensionKey(file);
          return {
            file,
            dimensionKey,
            label: dimensionLabel(file),
            checksumSha256: result?.checksum ?? sha256(JSON.stringify(rows)),
            rows: rows.map((row, index) => ({
              sourceRowNumber: index + 2,
              recordName: recordNameForRow(dimensionKey, row, index),
              values: Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value == null ? '' : String(value)])),
            })),
          };
        }),
      },
    ],
  };
}

function recordNameForRow(dimensionKey, row, index) {
  return row.entity_name && dimensionKey === 'v7_00_portfolio_entity_registry' ? row.entity_name
    : row.company_name
      || row.function_name
      || row.leader_role
      || row.persona_name
      || row.system_name
      || row.data_asset_name
      || row.vendor_name
      || row.priority_name
      || row.ai_use_case
      || row.process_control_name
      || row.relationship_id
      || row.source_artifact_label
      || row.metric_name
      || row.pattern_name
      || row.expert_lens_name
      || row.scope_item
      || row.chunk_id
      || row.edge_type
      || row.process
      || row.benchmark_name
      || row.estate_item_name
      || `${dimensionKey} row ${index + 1}`;
}

function fileToDimensionKey(file) {
  return file.replace(/\.csv$/i, '').toLowerCase();
}

function dimensionLabel(file) {
  return file
    .replace(/^V7_\d+_/, '')
    .replace(/\.csv$/i, '')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildFieldCatalog(files) {
  const rows = [];
  for (const [file, dataRows] of Object.entries(files)) {
    const dimensionKey = fileToDimensionKey(file);
    const dimensionName = dimensionLabel(file);
    stableHeaders(dataRows).forEach((column, index) => {
      rows.push({
        dimension_key: dimensionKey,
        dimension_name: dimensionName,
        column_ordinal: index + 1,
        column_name: column,
        client_field: humanize(column),
        required_level: requiredLevel(column),
        allowed_format: allowedFormat(column),
        client_instruction: instructionFor(column),
        example_value: String(dataRows[0]?.[column] ?? ''),
        module_use: moduleUse(column, dimensionKey),
      });
    });
  }
  return rows;
}

function humanize(column) {
  return column.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function requiredLevel(column) {
  if (['entity_id', 'entity_name', 'entity_scope', 'parent_entity_id', 'parent_entity_name'].includes(column)) return 'Required for holdco clients';
  if (column.match(/id$|name$|type$|category$|owner|status|criticality|amount|cost|revenue|employee|relationship|ref/)) return 'Required';
  if (column.match(/known_gaps|validated_by|source_validation_status|source_as_of_date|source_artifact/)) return 'Required';
  return 'Recommended';
}

function allowedFormat(column) {
  if (column.match(/usd|amount|cost|budget|revenue|employee|count|users|volume|score|rate|range_/)) return 'Number';
  if (column.match(/date|as_of|stale_after|indexed_at/)) return 'YYYY-MM-DD';
  if (column.match(/flag/)) return 'Boolean';
  return 'Text';
}

function instructionFor(column) {
  if (column === 'entity_id') return 'Use the stable ID from V7_00_portfolio_entity_registry. Do not type a display name in this field.';
  if (column === 'entity_name') return 'Use the exact portfolio company or holdco name from the entity registry.';
  if (column === 'entity_scope') return 'Classify as holdco, portfolio_company, shared_services, business_unit, region, or site.';
  if (column === 'parent_entity_id') return 'Use the parent entity ID. For operating companies this should be the holdco ID.';
  if (column.match(/usd|amount|cost|budget|revenue/)) return 'Enter raw USD numbers, not text like $1.2M. The product formats units for display.';
  if (column.match(/owner|sponsor|role/)) return 'Use a business-readable role or title that an executive would recognize.';
  if (column.match(/known_gaps/)) return 'State missing client validation, data, or caveats in plain English.';
  return 'Provide a business-readable value. Avoid internal IDs unless the field explicitly asks for an ID.';
}

function moduleUse(column, dimensionKey) {
  if (column.startsWith('entity_') || column.startsWith('parent_entity')) return 'Home, Intelligence, Tower, Moves, Source';
  if (dimensionKey.includes('applications') || column.includes('system')) return 'Home, Intelligence, Tower';
  if (dimensionKey.includes('relationships') || dimensionKey.includes('bridge')) return 'Home, Intelligence, Source';
  if (dimensionKey.includes('spend') || column.includes('cost') || column.includes('budget')) return 'Home, Tower, Source';
  return 'Home, Intelligence';
}

function validatePack(files) {
  const errors = [];
  const warnings = [];
  const entityRows = files['V7_00_portfolio_entity_registry.csv'];
  const entityIds = new Set(entityRows.map((row) => row.entity_id));
  const opcoRows = entityRows.filter((row) => row.entity_scope === 'portfolio_company');
  const requiredEntityColumns = ['entity_id', 'entity_name', 'entity_scope', 'parent_entity_id', 'parent_entity_name'];
  if (entityRows.filter((row) => row.entity_scope === 'holdco').length !== 1) errors.push('Entity spine must contain exactly one holdco.');
  if (opcoRows.length < 7) errors.push(`Expected at least 7 named portfolio companies; found ${opcoRows.length}.`);
  for (const row of opcoRows) {
    if (!entityIds.has(row.parent_entity_id)) errors.push(`OpCo ${row.entity_name} has invalid parent_entity_id ${row.parent_entity_id}.`);
  }
  if (entityRows.some((row) => /additional portfolio/i.test(row.entity_name))) errors.push('Aggregate "Additional Portfolio Companies" must not masquerade as a portfolio company.');

  for (const [file, rows] of Object.entries(files)) {
    if (file === 'V7_00_portfolio_entity_registry.csv' || file.includes('industry') || file.includes('expert') || file.includes('rate_card') || file.includes('benchmark') || file.includes('graph_registry')) continue;
    const headers = stableHeaders(rows);
    for (const column of requiredEntityColumns) {
      if (!headers.includes(column)) errors.push(`${file} is missing required holdco spine column ${column}.`);
    }
    const missingEntity = rows.filter((row) => !row.entity_id || !row.entity_name || !row.entity_scope);
    if (missingEntity.length) errors.push(`${file} has ${missingEntity.length} rows without entity spine values.`);
  }

  const thresholds = [
    ['V7_01_enterprise_profile.csv', opcoRows.length + 1],
    ['V7_02_business_functions.csv', 90],
    ['V7_03_org_ownership.csv', 110],
    ['V7_04_workforce_personas.csv', 75],
    ['V7_05_applications_systems.csv', 140],
    ['V7_06_data_assets_integrations.csv', 80],
    ['V7_07_vendors_contracts.csv', 90],
    ['V7_12_relationships_graph_edges.csv', 450],
    ['V7_18_function_system_data_vendor_bridge.csv', 430],
  ];
  for (const [file, min] of thresholds) {
    const count = files[file]?.length ?? 0;
    if (count < min) errors.push(`${file} is thin: ${count} rows < required ${min}.`);
  }

  const coverageFiles = ['V7_02_business_functions.csv', 'V7_03_org_ownership.csv', 'V7_04_workforce_personas.csv', 'V7_05_applications_systems.csv', 'V7_06_data_assets_integrations.csv', 'V7_07_vendors_contracts.csv', 'V7_12_relationships_graph_edges.csv'];
  for (const file of coverageFiles) {
    const counts = countBy(files[file], 'entity_id');
    for (const opco of opcoRows) {
      if (!counts[opco.entity_id]) errors.push(`${file} has no rows for ${opco.entity_name}.`);
    }
  }
  const systems = files['V7_05_applications_systems.csv'];
  const corporateSharedSystems = systems.filter((row) => row.entity_scope === 'holdco' && row.system_scope === 'corporate_shared_service');
  if (corporateSharedSystems.length < 20) errors.push(`Corporate shared-service systems are thin: ${corporateSharedSystems.length} rows < required 20.`);
  for (const system of corporateSharedSystems) {
    for (const opco of opcoRows) {
      if (!String(system.served_entity_ids ?? '').includes(opco.entity_id)) {
        errors.push(`Corporate shared system ${system.system_name} does not list ${opco.entity_name} as a served portfolio company.`);
      }
    }
  }
  const bridgeRows = files['V7_18_function_system_data_vendor_bridge.csv'];
  for (const opco of opcoRows) {
    const sharedBridgeCount = bridgeRows.filter((row) => row.entity_id === opco.entity_id && row.dependency_type === 'corporate_shared_system').length;
    if (sharedBridgeCount < 12) errors.push(`${opco.entity_name} has thin corporate-shared-system consumption coverage: ${sharedBridgeCount} rows < required 12.`);
  }

  const canonicalNames = new Map(entityRows.map((row) => [row.entity_id, row.entity_name]));
  for (const [file, rows] of Object.entries(files)) {
    for (const row of rows) {
      if (row.entity_id && canonicalNames.has(row.entity_id) && row.entity_name !== canonicalNames.get(row.entity_id)) {
        errors.push(`${file} has entity name drift for ${row.entity_id}: ${row.entity_name} != ${canonicalNames.get(row.entity_id)}.`);
      }
    }
  }
  const textBlob = Object.values(files).flat().map((row) => Object.values(row).join('|')).join('\n');
  if (/Northline Industries|Brightmark Capital|Forge and Field|Additional Portfolio Companies/i.test(textBlob)) {
    errors.push('Found retired/inconsistent portfolio company labels.');
  }
  const summary = {
    pass: errors.length === 0,
    files: Object.keys(files).length,
    rows: Object.values(files).reduce((sum, rows) => sum + rows.length, 0),
    entities: entityRows.length,
    opcos: opcoRows.length,
    namedOpCos: opcoRows.map((row) => row.entity_name),
    businessFunctions: files['V7_02_business_functions.csv'].length,
    orgRoles: files['V7_03_org_ownership.csv'].length,
    workforcePersonas: files['V7_04_workforce_personas.csv'].length,
    systems: files['V7_05_applications_systems.csv'].length,
    relationships: files['V7_12_relationships_graph_edges.csv'].length,
    bridgeRows: files['V7_18_function_system_data_vendor_bridge.csv'].length,
    errors: errors.length,
    warnings: warnings.length,
  };
  return { pass: errors.length === 0, summary, errors, warnings, entityCoverage: buildCoverage(files, opcoRows) };
}

function countBy(rows, key) {
  const counts = {};
  for (const row of rows ?? []) counts[row[key]] = (counts[row[key]] ?? 0) + 1;
  return counts;
}

function buildCoverage(files, opcoRows) {
  const dimensions = ['V7_02_business_functions.csv', 'V7_03_org_ownership.csv', 'V7_04_workforce_personas.csv', 'V7_05_applications_systems.csv', 'V7_06_data_assets_integrations.csv', 'V7_07_vendors_contracts.csv', 'V7_12_relationships_graph_edges.csv'];
  return opcoRows.map((opco) => {
    const row = { entity_id: opco.entity_id, entity_name: opco.entity_name };
    for (const file of dimensions) row[file.replace(/^V7_\d+_/, '').replace('.csv', '')] = countBy(files[file], 'entity_id')[opco.entity_id] ?? 0;
    return row;
  });
}

function renderValidationHtml(validation, manifest) {
  const status = validation.pass ? 'PASS' : 'FAIL';
  const rows = validation.entityCoverage.map((row) => `<tr>${Object.values(row).map((value) => `<td>${String(value)}</td>`).join('')}</tr>`).join('');
  const headers = Object.keys(validation.entityCoverage[0] ?? {}).map((key) => `<th>${humanize(key)}</th>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>Lakeshore V7 Holdco Hygiene</title><style>body{font-family:Arial,sans-serif;margin:32px;color:#0f172a}h1{font-family:Georgia,serif}.pass{color:#047857}.fail{color:#b91c1c}.card{border:1px solid #ddd;border-radius:8px;padding:16px;margin:12px 0}table{border-collapse:collapse;width:100%;font-size:13px}th,td{border-bottom:1px solid #e5e7eb;padding:8px;text-align:left}th{background:#f8fafc}</style></head><body><h1>Lakeshore V7 Holdco Entity-Spine Hygiene</h1><p class="${validation.pass ? 'pass' : 'fail'}"><strong>${status}</strong> · ${manifest.totalRows} rows · ${manifest.totalFiles} files · ${manifest.contractVersion}</p><div class="card"><pre>${JSON.stringify(validation.summary, null, 2)}</pre></div><h2>Entity coverage</h2><table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table><h2>Errors</h2><ul>${validation.errors.map((error) => `<li>${error}</li>`).join('') || '<li>None</li>'}</ul></body></html>`;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

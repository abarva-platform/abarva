#!/usr/bin/env node
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve('docs/build/lakeshore/current-state-load-v2');
const dataDir = join(root, 'data');
const zipPath = join(root, 'lakeshore-current-state-admin-load-v2.zip');
const productionZipPath = join(
  root,
  'lakeshore-current-state-admin-load-v2-production-compatible.zip',
);
const productionPackageDir = join(root, '.production-compatible-package');
const generatedAt = '2026-06-08T12:30:00.000Z';

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeCsv(fileName, headers, rows) {
  const path = join(dataDir, fileName);
  const body = [
    headers.map(csvEscape).join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
  ].join('\n') + '\n';
  writeFileSync(path, body);
}

function writeJson(fileName, rows) {
  writeFileSync(join(dataDir, fileName), JSON.stringify(rows, null, 2) + '\n');
}

function money(value) {
  return String(value);
}

function sourceNote(detail) {
  return `SYNTHETIC / ILLUSTRATIVE. Admin-loader-backed current-state substrate for Lakeshore pilot. ${detail}`;
}

const opcos = [
  { key: 'holdco', name: 'Lakeshore Holdings', segment: 'Holding company', revenue: 420000000, employees: 850, countries: 3 },
  { key: 'northline', name: 'Northline Supply Services', segment: 'Supply chain services', revenue: 1850000000, employees: 5200, countries: 8 },
  { key: 'brightmark', name: 'Brightmark Marketing Services', segment: 'Marketing and sourcing services', revenue: 880000000, employees: 2100, countries: 5 },
  { key: 'forge-field', name: 'Forge & Field Consumer Products', segment: 'Consumer products and DTC commerce', revenue: 640000000, employees: 1600, countries: 4 },
  { key: 'great-lakes-pantry', name: 'Great Lakes Pantry', segment: 'Convenience services and pantry operations', revenue: 410000000, employees: 1250, countries: 2 },
];

const enterpriseProfile = [
  {
    revenue_usd: 4200000000,
    employees: 11000,
    countries: 12,
    business_units: opcos.map((opco) => opco.name).join('; '),
    debt_usd: 780000000,
    it_budget_usd: 142000000,
    headquarters: 'Chicago, Illinois',
    benchmark_profile: 'Small diversified holding-company pilot, intentionally closer to a private holdco / operating-company portfolio model than Target or Delta.',
    operating_model: 'Lean holdco with shared finance, treasury, architecture, cyber, data governance, and procurement; operating companies retain business-system ownership.',
    cloud_strategy: 'Hybrid: private-cloud core for WMS/ERP legacy workloads, Azure for shared data/identity/finance analytics, AWS for DTC commerce.',
    private_cloud_summary: 'Dell PowerEdge + VMware vSphere at Chicago primary, Nutanix AHV at Northline warehouse edge, NetApp/Pure storage, Cisco Nexus and Palo Alto segmentation.',
    data_center_summary: 'Three major hosting locations: Chicago primary, Columbus colo, Indianapolis colo; Milwaukee closet retained for Great Lakes Pantry local services.',
    synthetic_state: 'synthetic_admin_loader_backed',
  },
];

const orgRoles = [
  ['P-LSH-CEO', 'Russell Hargrove', 'C-Level', 'Chief Executive Officer', '', 'LSH-EXEC', 'Chicago, IL', 'Executive Office', 'Board and holdco strategy'],
  ['P-LSH-CFO', 'Daniel Whitaker', 'C-Level', 'Chief Financial Officer', 'P-LSH-CEO', 'LSH-FIN', 'Chicago, IL', 'Finance', 'FP&A, treasury, tax, controllership, procurement'],
  ['P-LSH-CIO', 'Meera Rao', 'C-Level', 'Chief Information Officer', 'P-LSH-CEO', 'LSH-IT', 'Chicago, IL', 'IT', 'Enterprise applications, infrastructure, security, architecture'],
  ['P-LSH-CDAO', 'Priya Shah', 'C-Level', 'Chief Data and Analytics Officer', 'P-LSH-CIO', 'LSH-DATA', 'Chicago, IL', 'Data and analytics', 'Enterprise data platform, BI, governance, analytics products'],
  ['P-LSH-CSCO', 'Lena Ortiz', 'C-Level', 'Chief Supply Chain Officer', 'P-LSH-CEO', 'LSH-SC', 'Rosemont, IL', 'Supply chain', 'Network planning, warehouse ops, logistics, inventory, S&OP'],
  ['P-LSH-CISO', 'Marcus Reed', 'VP', 'Chief Information Security Officer', 'P-LSH-CIO', 'LSH-SEC', 'Chicago, IL', 'Cybersecurity', 'SOC, IAM, GRC, vulnerability, incident response'],
  ['P-LSH-CTO', 'Ishan Patel', 'VP', 'VP Infrastructure and Cloud', 'P-LSH-CIO', 'LSH-INFRA', 'Chicago, IL', 'Infrastructure', 'Private cloud, datacenters, network, cloud platform engineering'],
  ['P-LSH-EA', 'Nora Kim', 'VP', 'VP Enterprise Architecture', 'P-LSH-CIO', 'LSH-EA', 'Chicago, IL', 'Enterprise architecture', 'ERP, integration, application rationalization, standards'],
  ['P-LSH-APPS', 'Avery Moreno', 'VP', 'VP Enterprise Applications', 'P-LSH-CIO', 'LSH-APPS', 'Chicago, IL', 'Applications', 'ERP, HCM, treasury, procurement, CRM, WMS/TMS portfolio'],
  ['P-LSH-DATA-PLAT', 'Casey Shah', 'Director', 'Director Data Platform', 'P-LSH-CDAO', 'LSH-DATA-PLAT', 'Chicago, IL', 'Data platform', 'Snowflake, ADF, dbt, Power BI semantic layer'],
  ['P-LSH-ANALYTICS', 'Riley Brooks', 'Director', 'Director Analytics Products', 'P-LSH-CDAO', 'LSH-ANALYTICS', 'Chicago, IL', 'Analytics', 'Finance, supply-chain, marketing and operations analytics'],
  ['P-LSH-SC-PLAN', 'Maya Singh', 'VP', 'VP Supply Chain Planning', 'P-LSH-CSCO', 'LSH-SC-PLAN', 'Rosemont, IL', 'Supply chain planning', 'Demand planning, S&OP, inventory optimization'],
  ['P-LSH-SC-OPS', 'Owen Clarke', 'VP', 'VP Distribution Operations', 'P-LSH-CSCO', 'LSH-SC-OPS', 'Columbus, OH', 'Supply chain operations', 'Distribution centers, labor, warehouse safety, service levels'],
  ['P-LSH-SC-LOG', 'Grace Nguyen', 'Director', 'Director Transportation and Logistics', 'P-LSH-CSCO', 'LSH-SC-LOG', 'Rosemont, IL', 'Logistics', 'Carrier management, route performance, freight visibility'],
  ['P-LSH-PROC', 'Taylor Nguyen', 'VP', 'VP Procurement and Vendor Management', 'P-LSH-CFO', 'LSH-PROC', 'Chicago, IL', 'Procurement', 'Strategic sourcing, supplier performance, renewals, contract governance'],
  ['P-LSH-TREAS', 'Quinn Chen', 'VP', 'VP Treasury', 'P-LSH-CFO', 'LSH-TREAS', 'Chicago, IL', 'Treasury', 'Cash visibility, bank connectivity, payments controls, FX exposure'],
  ['P-NLS-CIO', 'Alicia Moreno', 'C-Level', 'Northline CIO', 'P-LSH-CIO', 'NLS-IT', 'Rosemont, IL', 'Northline IT', 'Supply-chain systems and regional IT'],
  ['P-BMS-CIO', 'Nadia Bell', 'C-Level', 'Brightmark CIO', 'P-LSH-CIO', 'BMS-IT', 'Chicago, IL', 'Brightmark IT', 'Marketing-services systems and analytics'],
  ['P-FFF-CIO', 'Ethan Brooks', 'C-Level', 'Forge & Field CIO', 'P-LSH-CIO', 'FFF-IT', 'Seattle, WA', 'Forge & Field IT', 'DTC commerce and product systems'],
  ['P-GLP-CIO', 'Monica Ellis', 'C-Level', 'Great Lakes Pantry CIO', 'P-LSH-CIO', 'GLP-IT', 'Troy, MI', 'Great Lakes Pantry IT', 'Retail convenience operations systems'],
].map(([person_id, name, level, role, manager_id, cost_center, location, function_name, accountability], index) => ({
  person_id, name, level, role, manager_id, cost_center, location,
  function_name,
  accountability,
  team_size: index < 6 ? 0 : [42, 38, 61, 28, 18, 22, 45, 410, 35, 26, 55, 24, 32, 29][Math.max(0, index - 6)] ?? 12,
  source_system: 'Workday HCM',
  source_record_id: `workday-lsh-v2-${String(index + 1).padStart(4, '0')}`,
  source_owner: 'CHRO',
  last_validated_date: '2026-06-08',
  confidence: 0.88,
  evidence_usable: true,
  notes_gaps: sourceNote('Named executive and reporting-line row.'),
}));

const infrastructure = [
  ['INF-DC-CHI', 'Chicago Primary Datacenter', 'datacenter', 'Owned datacenter', 'Chicago, IL', '2.5 MW / 220 racks / Tier III target', 'VMware vSphere 8', '', 'Holdco Infrastructure', 'Holdco', 'Primary private cloud and shared services; Dell/VMware based.'],
  ['INF-DC-COL', 'Columbus Colocation', 'datacenter', 'Flexential colo', 'Columbus, OH', '1.2 MW / 92 racks', 'VMware vSphere 8', '', 'Northline Infrastructure', 'Northline', 'WMS/TMS and supply-chain edge aggregation.'],
  ['INF-DC-IND', 'Indianapolis Colocation', 'datacenter', 'Equinix/colo', 'Indianapolis, IN', '0.4 MW / 38 racks', 'VMware vSphere 7', '', 'Forge & Field Infrastructure', 'Forge & Field', 'Commerce back-office and integration landing zone.'],
  ['INF-DC-MKE', 'Milwaukee Local Server Room', 'datacenter', 'On-prem branch closet', 'Milwaukee, WI', '0.2 MW / 14 racks', 'VMware vSphere 7', '', 'Great Lakes Pantry IT', 'Great Lakes Pantry', 'Retained local services; consolidation candidate.'],
  ['INF-CMP-DELL-01', 'Holdco Private Cloud Compute', 'compute', 'Dell PowerEdge R760', 'Chicago, IL', '24 hosts / 1,920 vCPU / 16 TB RAM', 'VMware vSphere 8', '', 'VP Infrastructure and Cloud', 'Holdco', 'Private cloud core.'],
  ['INF-HCI-NUTANIX-01', 'Northline Warehouse Edge HCI', 'compute', 'Nutanix NX / AHV', '12 DC warehouse sites', '12 clusters / 144 nodes', 'Nutanix AHV', '', 'Northline Infrastructure', 'Northline', 'Warehouse edge compute for WMS, label, conveyor, and handheld services.'],
  ['INF-STG-NETAPP-01', 'Holdco Enterprise Storage', 'storage', 'NetApp AFF A400', 'Chicago, IL', '400 TB usable / SnapMirror DR', '', '', 'Holdco Infrastructure', 'Holdco', 'Finance, treasury, shared file, and VM storage.'],
  ['INF-STG-PURE-01', 'Northline Flash Storage', 'storage', 'Pure FlashArray X70', 'Columbus, OH', '250 TB usable', '', '', 'Northline Infrastructure', 'Northline', 'WMS/transportation performance tier.'],
  ['INF-NET-CISCO-01', 'Core Network Fabric', 'network', 'Cisco Nexus 9000 + ACI', 'Chicago / Columbus', '40/100Gb spine-leaf', '', '', 'Network Engineering', 'Holdco', 'Private cloud network backbone.'],
  ['INF-SEC-PALO-01', 'Segmentation and Firewall', 'security', 'Palo Alto PA-5400 / Prisma Access', 'Chicago / AWS / Azure', '32 segmented zones', '', '', 'CISO', 'Holdco', 'PCI, treasury, identity, WMS, and corporate segmentation.'],
  ['INF-AZ-HOLDCO', 'Holdco Azure Subscription', 'cloud_account', 'Microsoft Azure', 'East US 2', '600 cores / 110 TB storage / ExpressRoute', '', 'azure-lsh-holdco-prod', 'VP Infrastructure and Cloud', 'Holdco', 'Data, identity, finance analytics, landing zone, DR.'],
  ['INF-AZ-NLS', 'Northline Azure Subscription', 'cloud_account', 'Microsoft Azure', 'Central US', '220 cores / 35 TB storage', '', 'azure-northline-prod', 'Northline Cloud', 'Northline', 'Supply-chain analytics and API services.'],
  ['INF-AWS-FFF', 'Forge & Field AWS Commerce Account', 'cloud_account', 'AWS', 'us-east-1 / us-west-2', '300 EC2-equivalent cores / 42 TB S3', '', 'aws-forge-field-prod', 'Forge & Field Digital', 'Forge & Field', 'DTC commerce, content, personalization workloads.'],
  ['INF-GCP-BMS-LAB', 'Brightmark GCP Analytics Sandbox', 'cloud_account', 'Google Cloud', 'us-central1', 'Low-use sandbox / BigQuery lab only', '', 'gcp-brightmark-lab', 'Brightmark Data', 'Brightmark', 'Sandbox only; no regulated production workloads.'],
  ['INF-IAM-ENTRA', 'Enterprise Identity', 'identity', 'Microsoft Entra ID + Okta legacy bridge', 'SaaS', '11k users / 3.4k contractors', '', 'azure-lsh-holdco-prod', 'IAM Engineering', 'Holdco', 'Entra primary, Okta retained for Forge & Field customer-support apps.'],
  ['INF-OBS-DATADOG', 'Observability Platform', 'observability', 'Datadog + ServiceNow Event Mgmt', 'SaaS', '1.8 TB/month logs / 420 monitored services', '', '', 'IT Operations', 'Holdco', 'Telemetry and incident correlation.'],
].map(([asset_id, asset_name, asset_class, make_model, location, capacity, virtualization, cloud_account, owner, opco, architecture_notes]) => ({
  asset_id, asset_name, asset_class, make_model, location, capacity, virtualization, cloud_account, owner, opco, architecture_notes,
  private_cloud_role: ['datacenter', 'compute', 'storage', 'network', 'security', 'identity', 'observability'].includes(asset_class) ? 'private_or_hybrid_core' : 'public_cloud',
  source_system: 'Infrastructure CMDB',
  source_record_id: asset_id,
  source_owner: 'VP Infrastructure and Cloud',
  last_validated_date: '2026-06-08',
  confidence: 0.88,
  evidence_usable: true,
  notes_gaps: sourceNote('Infrastructure estate row with private/hybrid cloud architecture.'),
}));

const dataPlatforms = [
  ['FIN-CASH-VIS', 'Cash visibility mart', 'Kyriba; bank files; SAP S/4HANA', 'none', 'daily by 07:30 CT', 0.89, 'Snowflake', 'Treasury', 'Kyriba + ADF + Snowflake + Power BI', 'Cash by bank, entity, currency, forecast variance'],
  ['SC-INVENTORY', 'Inventory health data product', 'Manhattan WMS; Blue Yonder; SAP S/4HANA', 'none', 'hourly', 0.84, 'Snowflake', 'Supply chain analytics', 'ADF + dbt + Snowflake + Power BI', 'Inventory turns, fill rate, aged stock, OTIF'],
  ['SC-FREIGHT', 'Freight visibility product', 'FourKites; TMS; carrier EDI 214', 'none', 'near real time', 0.81, 'Snowflake', 'Transportation analytics', 'Event hub + Snowflake + Power BI', 'Shipment status, dwell, detention, carrier service'],
  ['MKT-CAMPAIGN', 'Campaign performance product', 'Salesforce Marketing Cloud; Braze; Amplitude', 'pseudonymous customer', 'daily', 0.82, 'Snowflake', 'Marketing analytics', 'Fivetran + Snowflake + Power BI', 'Campaign ROI and funnel health'],
  ['DTC-ORDER', 'DTC order and margin product', 'Salesforce Commerce Cloud; NetSuite; Shopify Plus', 'customer', 'hourly', 0.8, 'Snowflake', 'Forge & Field Data', 'AWS Glue + Snowflake + Looker Studio bridge', 'Order margin, returns, fulfillment promise'],
  ['FIN-FPNA', 'FP&A planning model', 'Anaplan; SAP S/4HANA; NetSuite', 'none', 'monthly close + weekly forecast', 0.87, 'Anaplan + Snowflake', 'FP&A', 'Anaplan Data Hub + Snowflake', 'Forecast, scenario, plan-to-actual bridge'],
  ['OPS-QMS', 'Quality and incident product', 'ServiceNow; QMS spreadsheets; plant systems', 'employee limited', 'daily', 0.77, 'SQL Server + Snowflake', 'Quality analytics', 'SQL Server landing + ADF + Snowflake', 'CAPA, incidents, audit findings'],
  ['LEG-SQL-GLP', 'Great Lakes Pantry SQL Server DW', 'POS; Cantaloupe; local ERP', 'none', 'daily', 0.72, 'SQL Server 2019', 'Great Lakes Pantry Data', 'On-prem SQL Server', 'Local operations and finance reporting'],
  ['LEG-SQL-FFF', 'Forge & Field SQL Server DW', 'NetSuite; Commerce Cloud exports', 'customer', 'daily', 0.73, 'SQL Server 2017', 'Forge & Field Data', 'On-prem SQL Server', 'Legacy commerce and order reporting'],
  ['LEG-HADOOP-ARCH', 'Legacy Hadoop archive', 'Historic WMS and EDI logs', 'none', 'frozen archive', 0.58, 'Cloudera Hadoop', 'Data Platform', 'Read-only archive', 'Decommission candidate; not used for active analytics'],
  ['NO-NETEZZA', 'Netezza footprint', 'Not present', 'none', 'not applicable', 0.93, 'None', 'Enterprise Architecture', 'No active Netezza appliance', 'Explicit negative evidence: no active Netezza platform loaded'],
  ['NO-TERADATA', 'Teradata footprint', 'Not present', 'none', 'not applicable', 0.93, 'None', 'Enterprise Architecture', 'No active Teradata appliance', 'Explicit negative evidence: no active Teradata platform loaded'],
].map(([data_product, _source_system, source_systems, phi_class, refresh_sla, quality_score, platform, owner, architecture, domains]) => ({
  data_product,
  source_system: source_systems,
  phi_class,
  refresh_sla,
  quality_score,
  platform,
  owner,
  architecture,
  data_domains: domains,
  semantic_layer: platform === 'None' ? 'not_applicable' : 'Power BI shared datasets and governed metric catalog',
  source_record_id: data_product,
  source_owner: 'Chief Data and Analytics Officer',
  last_validated_date: '2026-06-08',
  confidence: quality_score,
  evidence_usable: true,
  notes_gaps: sourceNote('Data platform and analytics architecture row.'),
}));

const apps = [
  ['APP-FIN-S4', 'SAP S/4HANA Private Cloud', 'Tier 1', 'VP Enterprise Applications', true, 'SAP', 'run', 'SAP S/4HANA', 'Private cloud / RISE bridge', 'restricted', 'Finance; procurement; inventory costing'],
  ['APP-FIN-KYRIBA', 'Kyriba Treasury Management', 'Tier 1', 'VP Treasury', true, 'Kyriba', 'modernize', 'Kyriba', 'SaaS', 'restricted', 'Cash positioning, bank connectivity, payments, FX'],
  ['APP-HR-WORKDAY', 'Workday HCM', 'Tier 1', 'CHRO', true, 'Workday', 'run', 'Workday', 'SaaS', 'confidential', 'Core HR, org, talent, workforce'],
  ['APP-PROC-COUPA', 'Coupa Source-to-Pay', 'Tier 2', 'VP Procurement', true, 'Coupa', 'change', 'Coupa', 'SaaS', 'confidential', 'Sourcing, procurement, supplier records'],
  ['APP-FPNA-ANAPLAN', 'Anaplan FP&A', 'Tier 1', 'CFO FP&A', true, 'Anaplan', 'run', 'Anaplan', 'SaaS', 'confidential', 'Planning, forecast, scenario modeling'],
  ['APP-IT-SNOW', 'ServiceNow ITSM / CMDB', 'Tier 1', 'VP IT Operations', true, 'ServiceNow', 'run', 'ServiceNow', 'SaaS', 'confidential', 'Incidents, changes, CMDB, asset data'],
  ['APP-IAM-ENTRA', 'Microsoft Entra ID', 'Tier 1', 'IAM Engineering', true, 'Microsoft', 'run', 'Entra ID', 'SaaS/Azure', 'restricted', 'Identity and access management'],
  ['APP-SC-MANHATTAN', 'Manhattan WMS', 'Tier 1', 'VP Distribution Operations', true, 'Manhattan', 'run', 'Manhattan Active WM', 'Private cloud + edge', 'confidential', 'Warehouse management, labor, inventory'],
  ['APP-SC-BLUEYONDER', 'Blue Yonder Demand Planning', 'Tier 1', 'VP Supply Chain Planning', true, 'Blue Yonder', 'change', 'Blue Yonder', 'SaaS', 'confidential', 'Demand planning, replenishment, S&OP'],
  ['APP-SC-FOURKITES', 'FourKites Freight Visibility', 'Tier 2', 'Director Transportation and Logistics', true, 'FourKites', 'modernize', 'FourKites', 'SaaS', 'confidential', 'Carrier ETA, shipment tracking, dwell'],
  ['APP-SC-SAPIBP', 'SAP IBP', 'Tier 2', 'VP Supply Chain Planning', false, 'SAP', 'modernize', 'SAP IBP', 'SaaS', 'confidential', 'S&OP pilot and supply planning'],
  ['APP-INT-MULE', 'MuleSoft Integration Platform', 'Tier 1', 'VP Enterprise Architecture', true, 'Salesforce', 'run', 'MuleSoft', 'Hybrid', 'confidential', 'API gateway and enterprise integration'],
  ['APP-DATA-SNOWFLAKE', 'Snowflake Enterprise Data Cloud', 'Tier 1', 'Chief Data and Analytics Officer', true, 'Snowflake', 'run', 'Snowflake', 'Azure', 'confidential', 'Enterprise data warehouse and marts'],
  ['APP-BI-POWERBI', 'Power BI Enterprise', 'Tier 2', 'Director Analytics Products', true, 'Microsoft', 'run', 'Power BI', 'SaaS/Azure', 'confidential', 'Executive dashboards, semantic layer'],
  ['APP-DTC-SFCC', 'Salesforce Commerce Cloud', 'Tier 1', 'Forge & Field CIO', true, 'Salesforce', 'run', 'Commerce Cloud', 'SaaS', 'customer', 'DTC commerce'],
  ['APP-DTC-SHOPIFY', 'Shopify Plus', 'Tier 2', 'Forge & Field CIO', false, 'Shopify', 'change', 'Shopify Plus', 'SaaS', 'customer', 'Brand microsites and promotional storefronts'],
  ['APP-GLP-NETSUITE', 'NetSuite ERP', 'Tier 1', 'Great Lakes Pantry CIO', true, 'Oracle NetSuite', 'run', 'NetSuite', 'SaaS', 'confidential', 'GLP finance, order, purchasing'],
  ['APP-GLP-POS', 'Cantaloupe / 365 Retail POS', 'Tier 1', 'Great Lakes Pantry CIO', true, 'Cantaloupe', 'run', 'Cantaloupe Seed', 'Hybrid', 'confidential', 'Pantry POS and merchandising'],
  ['APP-CYB-CROWDSTRIKE', 'CrowdStrike Falcon', 'Tier 1', 'CISO', true, 'CrowdStrike', 'run', 'CrowdStrike', 'SaaS', 'restricted', 'Endpoint security and EDR'],
  ['APP-OBS-DATADOG', 'Datadog Observability', 'Tier 2', 'VP Infrastructure and Cloud', true, 'Datadog', 'run', 'Datadog', 'SaaS', 'confidential', 'APM, logs, infrastructure monitoring'],
].map(([app_id, name, criticality, owner_role, system_of_record, ams_vendor, time_classification, platform, hosting_model, data_classification, business_function]) => ({
  app_id, name, criticality, owner_role, system_of_record, ams_vendor, time_classification, platform, hosting_model, data_classification, business_function,
  source_system: 'ServiceNow CMDB',
  source_record_id: app_id,
  source_owner: 'VP Enterprise Architecture',
  last_validated_date: '2026-06-08',
  confidence: 0.88,
  evidence_usable: true,
  notes_gaps: sourceNote('Critical application/platform row.'),
}));

const erp = [
  ['ERP-FIN-GL', 'SAP S/4HANA Private Cloud', 'Record to report', 'VP Enterprise Applications', 'Holdco/Northline', 126, 'none', 'Finance core on SAP private cloud; clean-core exceptions tracked.'],
  ['ERP-FIN-AP', 'SAP S/4HANA Private Cloud', 'Accounts payable', 'VP Enterprise Applications', 'Holdco/Northline', 48, 'Coupa invoice integration', 'AP in SAP; Coupa upstream procurement.'],
  ['ERP-PROC', 'Coupa Source-to-Pay', 'Procure to pay', 'VP Procurement and Vendor Management', 'All opcos', 32, 'SAP supplier master sync', 'Supplier, sourcing, contract requests.'],
  ['ERP-HCM', 'Workday HCM', 'Hire to retire', 'CHRO', 'All opcos', 18, 'Entra ID provisioning', 'SaaS HCM system of record.'],
  ['ERP-TREAS', 'Kyriba', 'Treasury operations', 'VP Treasury', 'All opcos', 22, 'Bank connectivity and SAP GL posting', 'Treasury SaaS modernizing bank connectivity.'],
  ['ERP-FPNA', 'Anaplan', 'Forecasting and planning', 'CFO FP&A', 'All opcos', 35, 'Snowflake actuals', 'FP&A model; not ERP of record.'],
  ['ERP-FFF', 'NetSuite', 'Order to cash / finance', 'Forge & Field CIO', 'Forge & Field', 74, 'Commerce Cloud orders', 'SaaS ERP; integration debt with SFCC.'],
  ['ERP-GLP', 'NetSuite', 'Order to cash / finance', 'Great Lakes Pantry CIO', 'Great Lakes Pantry', 58, 'POS and pantry replenishment', 'SaaS ERP retained.'],
  ['ERP-NLS-WMS', 'Manhattan Active WM', 'Warehouse execution', 'VP Distribution Operations', 'Northline', 91, 'SAP and FourKites', 'Core WMS; private cloud plus warehouse edge.'],
  ['ERP-NLS-PLAN', 'Blue Yonder', 'Demand and replenishment planning', 'VP Supply Chain Planning', 'Northline', 46, 'SAP IBP pilot', 'Supply planning and forecasting stack.'],
].map(([erp_object_id, platform, process_area, owner_role, business_unit, customization_count, tsa_dependency, architecture_notes]) => ({
  erp_object_id, platform, process_area, owner_role, business_unit, customization_count, tsa_dependency, architecture_notes,
  source_system: 'ERP Landscape Workbook',
  source_record_id: erp_object_id,
  source_owner: 'VP Enterprise Applications',
  last_validated_date: '2026-06-08',
  confidence: 0.87,
  evidence_usable: true,
  notes_gaps: sourceNote('ERP/HCM/treasury/platform architecture row.'),
}));

const integrations = [
  ['INT-KYRIBA-BANKS', 'APP-FIN-KYRIBA', 'Bank partners', 'SFTP/API', 'daily by 06:30 CT', true, 'treasury', 'Tier 1', 'Bank connectivity modernization gate; file acknowledgements not yet uniform.'],
  ['INT-KYRIBA-SAP', 'APP-FIN-KYRIBA', 'APP-FIN-S4', 'API + file posting', 'daily close', true, 'finance', 'Tier 1', 'Cash journal and GL posting dependency.'],
  ['INT-S4-COUPA', 'APP-FIN-S4', 'APP-PROC-COUPA', 'MuleSoft API', '15 min', false, 'procurement', 'Tier 2', 'Supplier and invoice synchronization.'],
  ['INT-WORKDAY-ENTRA', 'APP-HR-WORKDAY', 'APP-IAM-ENTRA', 'SCIM', 'near real time', false, 'identity', 'Tier 1', 'Joiner/mover/leaver path.'],
  ['INT-MANHATTAN-S4', 'APP-SC-MANHATTAN', 'APP-FIN-S4', 'IDoc/API', 'hourly', true, 'inventory', 'Tier 1', 'Inventory valuation and goods movement dependency.'],
  ['INT-BLUEYONDER-SNOW', 'APP-SC-BLUEYONDER', 'APP-DATA-SNOWFLAKE', 'ADF pipeline', 'daily', false, 'supply_chain', 'Tier 2', 'Forecast signals to analytics.'],
  ['INT-FOURKITES-TMS', 'APP-SC-FOURKITES', 'APP-SC-MANHATTAN', 'carrier API/EDI', '15 min', true, 'logistics', 'Tier 2', 'ETA and carrier visibility.'],
  ['INT-SFCC-NETSUITE', 'APP-DTC-SFCC', 'APP-GLP-NETSUITE', 'MuleSoft API', 'hourly', true, 'orders', 'Tier 1', 'Order and revenue handoff.'],
  ['INT-SNOW-POWERBI', 'APP-DATA-SNOWFLAKE', 'APP-BI-POWERBI', 'DirectQuery/import', 'hourly', false, 'analytics', 'Tier 2', 'Semantic layer consumption.'],
  ['INT-SNOW-DATADOG', 'APP-OBS-DATADOG', 'APP-DATA-SNOWFLAKE', 'log export', 'daily', false, 'observability', 'Tier 3', 'Ops analytics bridge.'],
].map(([edge_id, source_app_id, target_app_id, integration_type, latency_sla, kill_blocker_flag, data_domain, criticality, architecture_notes]) => ({
  edge_id, source_app_id, target_app_id, integration_type, latency_sla, kill_blocker_flag, data_domain, criticality, architecture_notes,
  source_system: 'Integration Topology Workbook',
  source_record_id: edge_id,
  source_owner: 'VP Enterprise Architecture',
  last_validated_date: '2026-06-08',
  confidence: 0.86,
  evidence_usable: true,
  notes_gaps: sourceNote('Integration dependency row.'),
}));

const vendors = [
  ['V-KYRIBA', 'Kyriba', 2200000, '2027-03-31', '12 month notice; bank file export rights', 'AI clauses limited; no model training on customer data', 'Customer owns treasury and bank connectivity data', 'CON-LSH-KYRIBA-2026', 'Treasury SaaS'],
  ['V-MICROSOFT', 'Microsoft', 6800000, '2027-06-30', 'EA true-up annually; 90 day termination for some Azure services', 'Copilot governed by tenant AI policy', 'Customer data boundary and Azure logs retained by tenant policy', 'CON-LSH-MSFT-2026', 'Azure, M365, Power BI, Entra'],
  ['V-SAP', 'SAP', 5400000, '2028-12-31', 'RISE terms; exit requires data export plan', 'SAP AI features opt-in only', 'S/4 data export under DPA', 'CON-LSH-SAP-2026', 'SAP S/4HANA Private Cloud and IBP'],
  ['V-WORKDAY', 'Workday', 1900000, '2027-09-30', '12 month notice', 'Workday AI restricted to enabled modules', 'HCM data under Workday DPA', 'CON-LSH-WDAY-2026', 'HCM SaaS'],
  ['V-MANHATTAN', 'Manhattan Associates', 3100000, '2027-11-30', 'Per-facility termination schedule', 'No autonomous optimization without approval', 'Warehouse data export provided via APIs', 'CON-NLS-MANH-2026', 'WMS'],
  ['V-BLUEYONDER', 'Blue Yonder', 1700000, '2026-12-31', '6 month notice', 'AI forecast features disabled pending governance', 'Planning data customer-owned', 'CON-NLS-BY-2026', 'Demand planning'],
  ['V-FOURKITES', 'FourKites', 950000, '2026-10-31', '90 day notice', 'Carrier ETA ML permitted for service delivery only', 'Shipment data export via API', 'CON-NLS-FK-2026', 'Freight visibility'],
  ['V-SNOWFLAKE', 'Snowflake', 2400000, '2027-05-31', 'Marketplace commit; usage true-up risk', 'Cortex disabled for restricted data', 'Customer owns data; external functions reviewed', 'CON-LSH-SNOW-2026', 'Data warehouse'],
  ['V-DATABRICKS', 'Databricks', 850000, '2026-12-31', 'Pilot capacity; no renewal commitment yet', 'Model-serving disabled in production', 'Customer workspace export required', 'CON-LSH-DBX-2026', 'Data science pilot'],
  ['V-SERVICENOW', 'ServiceNow', 1600000, '2027-04-30', 'Module-specific renewal', 'Now Assist not enabled for incident summaries', 'ITSM/CMDB data under DPA', 'CON-LSH-SNOW-ITSM-2026', 'ITSM and CMDB'],
  ['V-COUPA', 'Coupa', 1350000, '2027-02-28', 'Supplier data transition support required', 'AI supplier recommendations disabled', 'Supplier and sourcing data export rights', 'CON-LSH-COUPA-2026', 'Procurement'],
  ['V-CROWDSTRIKE', 'CrowdStrike', 1250000, '2026-08-31', 'Sensor uninstall assistance', 'Charlotte AI not enabled for restricted investigations', 'Telemetry retention 180 days', 'CON-LSH-CRWD-2026', 'Endpoint security'],
].map(([vendor_id, vendor_name, annual_value_usd, renewal_date, exit_terms, ai_clauses, data_rights, contract_id, contract_category]) => ({
  vendor_id, vendor_name, annual_value_usd, renewal_date, exit_terms, ai_clauses, data_rights, contract_id, contract_category,
  source_system: 'Contract Repository',
  source_record_id: contract_id,
  source_owner: 'VP Procurement and Vendor Management',
  last_validated_date: '2026-06-08',
  confidence: 0.86,
  evidence_usable: true,
  notes_gaps: sourceNote('Vendor/contract row.'),
}));

const kpiNames = [
  ['Finance', 'Revenue', '$', 'reported revenue', 'CFO'],
  ['Finance', 'EBITDA margin', '%', 'profitability', 'CFO'],
  ['Finance', 'Free cash flow', '$', 'cash conversion', 'CFO'],
  ['Finance', 'Working capital days', 'days', 'cash discipline', 'CFO'],
  ['Finance', 'Forecast accuracy', '%', 'planning quality', 'CFO'],
  ['Treasury', 'Daily cash visibility by 07:30 CT', '%', 'cash control', 'VP Treasury'],
  ['Treasury', 'Bank connectivity success rate', '%', 'Kyriba readiness', 'VP Treasury'],
  ['Treasury', 'Payment exception rate', '%', 'controls', 'VP Treasury'],
  ['Supply chain', 'On-time in-full', '%', 'customer service', 'Chief Supply Chain Officer'],
  ['Supply chain', 'Inventory turns', 'turns', 'inventory productivity', 'VP Supply Chain Planning'],
  ['Supply chain', 'Warehouse pick accuracy', '%', 'quality', 'VP Distribution Operations'],
  ['Supply chain', 'Freight cost per shipment', '$', 'cost productivity', 'Director Transportation and Logistics'],
  ['Supply chain', 'Carrier dwell hours', 'hours', 'logistics efficiency', 'Director Transportation and Logistics'],
  ['Supply chain', 'S&OP adherence', '%', 'planning discipline', 'VP Supply Chain Planning'],
  ['IT', 'Tier 1 app availability', '%', 'resilience', 'CIO'],
  ['IT', 'P1 incident MTTR', 'hours', 'operational recovery', 'VP IT Operations'],
  ['IT', 'Change failure rate', '%', 'delivery quality', 'VP Engineering'],
  ['IT', 'Cloud spend variance', '%', 'FinOps', 'VP Infrastructure and Cloud'],
  ['IT', 'Patch compliance', '%', 'security hygiene', 'CISO'],
  ['Data', 'Certified KPI coverage', '%', 'semantic consistency', 'CDAO'],
  ['Data', 'Data product freshness SLA', '%', 'data reliability', 'Director Data Platform'],
  ['Data', 'Data quality score', 'score', 'trust', 'CDAO'],
  ['Data', 'Manual spreadsheet dependency count', 'count', 'modernization', 'Director Analytics Products'],
  ['Procurement', 'Addressable spend under management', '%', 'sourcing discipline', 'VP Procurement'],
  ['Procurement', 'Contract renewal pipeline coverage', '%', 'renewal risk', 'VP Procurement'],
  ['Procurement', 'Supplier risk exceptions', 'count', 'third-party risk', 'VP Procurement'],
  ['Customer/Digital', 'DTC conversion rate', '%', 'growth', 'Forge & Field CIO'],
  ['Customer/Digital', 'Order promise accuracy', '%', 'customer trust', 'Forge & Field CIO'],
  ['Operations', 'Capacity utilization', '%', 'asset productivity', 'COO'],
  ['Operations', 'Quality event aging', 'days', 'risk closure', 'Chief Quality Officer'],
];
const kpis = [];
for (let i = 0; i < 50; i += 1) {
  const base = kpiNames[i % kpiNames.length];
  kpis.push({
    period: i < 30 ? 'FY2026-Q2' : 'FY2026-Q1',
    metric: `${base[1]}${i >= kpiNames.length ? ` ${Math.floor(i / kpiNames.length) + 1}` : ''}`,
    value: i % 5 === 0 ? money(4200000000 - i * 25000000) : (72 + (i % 19)).toString(),
    currency_or_unit: base[2],
    segment: base[0],
    margin_bridge_driver: base[3],
    source_report: 'Lakeshore CXO KPI Catalog v2',
    owner_role: base[4],
    formula: `Synthetic KPI definition for ${base[1]} with CFO/CXO review grain.`,
    source_system: 'KPI Catalog',
    source_record_id: `KPI-LSH-${String(i + 1).padStart(3, '0')}`,
    source_owner: 'CFO FP&A',
    last_validated_date: '2026-06-08',
    confidence: 0.84,
    evidence_usable: true,
    notes_gaps: sourceNote('Top-50 KPI catalog row.'),
  });
}

const initiatives = [
  ['INIT-KYRIBA-001', 'Kyriba treasury modernization', 'mobilize', 'active', 'VP Treasury', 6400000, 14500000, 'APP-FIN-KYRIBA;APP-FIN-S4;INT-KYRIBA-BANKS', 'Bank connectivity matrix and payment controls gate blocked'],
  ['INIT-SC-VIS-002', 'Freight visibility and ETA control tower', 'scope', 'active', 'Chief Supply Chain Officer', 2800000, 7600000, 'APP-SC-FOURKITES;APP-SC-MANHATTAN', 'Carrier EDI quality and dwell event completeness'],
  ['INIT-DATA-SEM-003', 'Certified KPI semantic layer', 'scope', 'active', 'Chief Data and Analytics Officer', 1900000, 5900000, 'APP-DATA-SNOWFLAKE;APP-BI-POWERBI', 'Metric ownership and quality score threshold'],
  ['INIT-PRIVATE-CLOUD-004', 'Private cloud resilience uplift', 'discover', 'active', 'VP Infrastructure and Cloud', 4200000, 8300000, 'INF-DC-CHI;INF-DC-COL', 'DR test and network segmentation evidence'],
  ['INIT-WMS-EDGE-005', 'Warehouse edge HCI refresh', 'discover', 'active', 'VP Distribution Operations', 3500000, 6200000, 'INF-HCI-NUTANIX-01;APP-SC-MANHATTAN', 'Site rollout sequencing and local downtime plan'],
  ['INIT-ERP-CLEAN-006', 'SAP clean-core and integration debt reduction', 'scope', 'active', 'VP Enterprise Applications', 5200000, 11800000, 'APP-FIN-S4;APP-INT-MULE', 'Custom object rationalization and release train governance'],
  ['INIT-CLOUD-FINOPS-007', 'Hybrid cloud FinOps and tagging program', 'mobilize', 'active', 'CFO', 850000, 3100000, 'INF-AZ-HOLDCO;INF-AWS-FFF', 'Tag completeness below 85 percent in AWS commerce workloads'],
  ['INIT-IAM-008', 'Entra/Okta identity convergence', 'scope', 'active', 'CISO', 1700000, 4800000, 'APP-IAM-ENTRA;INF-IAM-ENTRA', 'Forge & Field app exceptions and SCIM coverage'],
].map(([initiative_id, title, stage, status_flag, sponsor_role, committed_usd, projected_value_usd, linked_app_ids, blocker]) => ({
  initiative_id, title, stage, status: status_flag, status_flag, sponsor_role, committed_usd, projected_value_usd, linked_app_ids, opco_id: 'lakeshore-holdings', blocker,
  decision_needed: blocker,
  source_system: 'Transformation Portfolio',
  source_record_id: initiative_id,
  source_owner: 'Transformation PMO',
  last_validated_date: '2026-06-08',
  confidence: 0.85,
  evidence_usable: true,
  notes_gaps: sourceNote('Active initiative and blocked-decision row.'),
}));

const risks = [
  ['RISK-KYRIBA-BANK', 'control_gap', 'FIN-CASH-VIS', 'high', '2026-05-30', 'CAPA-KYRIBA-001', 'AUD-TREAS-2026-04', 'Bank acknowledgement files inconsistent before Kyriba go-live'],
  ['RISK-PAY-BEC', 'fraud_control', 'APP-FIN-KYRIBA', 'high', '2026-05-22', 'CAPA-PAY-002', 'SOX-PAY-2026', 'Payment approval and BEC controls require dual approval evidence'],
  ['RISK-WMS-EDGE', 'resilience', 'APP-SC-MANHATTAN', 'medium', '2026-05-18', 'CAPA-WMS-003', 'OPS-DR-2026', 'Warehouse edge clusters lack consistent DR evidence'],
  ['RISK-DATA-QUALITY', 'data_quality', 'SC-INVENTORY', 'medium', '2026-05-15', 'CAPA-DATA-004', 'DQ-2026-02', 'Inventory data quality below certified KPI threshold'],
  ['RISK-CLOUD-TAG', 'cost_control', 'INF-AWS-FFF', 'medium', '2026-05-11', 'CAPA-FINOPS-005', 'FINOPS-2026', 'AWS commerce tagging gaps affect cost allocation'],
  ['RISK-HADOOP-ARCH', 'legacy_risk', 'LEG-HADOOP-ARCH', 'low', '2026-04-28', 'CAPA-ARCH-006', 'ARCH-2026', 'Legacy Hadoop archive retained without active analytics owner'],
].map(([event_id, event_type, product_family_id, severity, opened_at, capa_id, audit_reference, finding]) => ({
  event_id, event_type, product_family_id, severity, opened_at, capa_id, audit_reference, finding, opco: 'Lakeshore Holdings',
  control_owner: event_id.includes('PAY') || event_id.includes('KYRIBA') ? 'VP Treasury' : event_id.includes('DATA') ? 'CDAO' : 'VP Infrastructure and Cloud',
  source_system: 'Risk and Control Register',
  source_record_id: event_id,
  source_owner: 'Risk and Compliance',
  last_validated_date: '2026-06-08',
  confidence: 0.83,
  evidence_usable: true,
  notes_gaps: sourceNote('Risk/control/audit-finding row.'),
}));

const capabilities = [
  ['Treasury cash visibility', 'Finance', 'Cash-to-report', 'VP Treasury', 'Kyriba; SAP S/4HANA; Snowflake', 'Bank connectivity and payments controls'],
  ['Record to report', 'Finance', 'Close and consolidate', 'CFO Controller', 'SAP S/4HANA; NetSuite; Power BI', 'Close calendar and reconciliations'],
  ['Supply chain planning', 'Supply chain', 'Plan-to-fulfill', 'VP Supply Chain Planning', 'Blue Yonder; SAP IBP; Snowflake', 'Demand, inventory and S&OP'],
  ['Warehouse execution', 'Supply chain', 'Fulfill and distribute', 'VP Distribution Operations', 'Manhattan WMS; Nutanix edge; SAP', 'Warehouse labor, inventory and dock operations'],
  ['Transportation visibility', 'Supply chain', 'Deliver and track', 'Director Transportation and Logistics', 'FourKites; TMS; carrier EDI', 'Carrier ETA, dwell and service'],
  ['Enterprise data and analytics', 'Data', 'Measure and decide', 'CDAO', 'Snowflake; Power BI; ADF; dbt; Anaplan', 'Certified KPI and analytic products'],
  ['Digital commerce', 'Customer/Digital', 'Sell and serve', 'Forge & Field CIO', 'Salesforce Commerce Cloud; Shopify Plus; NetSuite', 'DTC order and customer journey'],
  ['Identity and cyber', 'IT', 'Protect and govern', 'CISO', 'Entra ID; Okta; CrowdStrike; Palo Alto', 'IAM, endpoint, network segmentation and incident response'],
  ['Hybrid infrastructure', 'IT', 'Run and recover', 'VP Infrastructure and Cloud', 'Dell/VMware; Nutanix; Azure; AWS; Cisco', 'Private and public cloud platform operations'],
].map(([capability_name, business_function, value_stream, owner, enabling_systems, current_challenges]) => ({
  capability_name, business_function, value_stream, owner, enabling_systems, current_challenges,
  maturity: business_function === 'Data' ? 'managed but semantic gaps remain' : 'managed',
  source_system: 'Business Capability Map',
  source_record_id: capability_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  source_owner: 'Enterprise Architect',
  last_validated_date: '2026-06-08',
  confidence: 0.84,
  evidence_usable: true,
  notes_gaps: sourceNote('Business capability row.'),
}));

const pnl = opcos.map((opco) => ({
  segment: opco.name,
  revenue_usd: opco.revenue,
  gross_margin_pct: opco.key === 'holdco' ? 0 : 27 + opco.key.length,
  operating_margin_pct: opco.key === 'holdco' ? 0 : 9 + (opco.key.length % 6),
  r_and_d_usd: opco.key === 'forge-field' ? 18000000 : 2500000,
  sg_and_a_usd: Math.round(opco.revenue * 0.11),
  period: 'FY2026-Q2',
  employees: opco.employees,
  countries: opco.countries,
  source_system: 'Segment P&L',
  source_record_id: `PNL-${opco.key}`,
  source_owner: 'CFO FP&A',
  last_validated_date: '2026-06-08',
  confidence: 0.86,
  evidence_usable: true,
  notes_gaps: sourceNote('Segment scale and financial baseline row.'),
}));

mkdirSync(dataDir, { recursive: true });
rmSync(zipPath, { force: true });
rmSync(productionZipPath, { force: true });
rmSync(productionPackageDir, { recursive: true, force: true });

writeJson('lakeshore-enterprise-profile.json', enterpriseProfile);
writeCsv('lakeshore-org-roles.csv', Object.keys(orgRoles[0]), orgRoles);
writeCsv('lakeshore-infrastructure-estate.csv', Object.keys(infrastructure[0]), infrastructure);
writeCsv('lakeshore-data-platform-lineage.csv', Object.keys(dataPlatforms[0]), dataPlatforms);
writeCsv('lakeshore-application-portfolio.csv', Object.keys(apps[0]), apps);
writeCsv('lakeshore-erp-landscape.csv', Object.keys(erp[0]), erp);
writeCsv('lakeshore-integration-topology.csv', Object.keys(integrations[0]), integrations);
writeCsv('lakeshore-vendor-contracts.csv', Object.keys(vendors[0]), vendors);
writeCsv('lakeshore-financial-kpi-workbook.csv', Object.keys(kpis[0]), kpis);
writeCsv('lakeshore-initiative-portfolio.csv', Object.keys(initiatives[0]), initiatives);
writeCsv('lakeshore-risks-controls.csv', Object.keys(risks[0]), risks);
writeCsv('lakeshore-business-capability-map.csv', Object.keys(capabilities[0]), capabilities);
writeCsv('lakeshore-segment-pnl.csv', Object.keys(pnl[0]), pnl);

const manifest = {
  loadName: 'lakeshore-current-state-v2',
  defaultDataClassification: 'confidential_business',
  files: [
    { path: 'data/lakeshore-enterprise-profile.json', templateId: 'enterprise-profile' },
    { path: 'data/lakeshore-org-roles.csv', templateId: 'org-roles' },
    { path: 'data/lakeshore-infrastructure-estate.csv', templateId: 'infrastructure-estate' },
    { path: 'data/lakeshore-data-platform-lineage.csv', templateId: 'data-platform-lineage' },
    { path: 'data/lakeshore-application-portfolio.csv', templateId: 'application-portfolio' },
    { path: 'data/lakeshore-erp-landscape.csv', templateId: 'erp-landscape-workbook' },
    { path: 'data/lakeshore-integration-topology.csv', templateId: 'integration-topology' },
    { path: 'data/lakeshore-vendor-contracts.csv', templateId: 'vendor-contracts' },
    { path: 'data/lakeshore-financial-kpi-workbook.csv', templateId: 'financial-kpi-workbook' },
    { path: 'data/lakeshore-initiative-portfolio.csv', templateId: 'initiative-portfolio' },
    { path: 'data/lakeshore-risks-controls.csv', templateId: 'qms-events' },
    { path: 'data/lakeshore-business-capability-map.csv', templateId: 'business-capability-map' },
    { path: 'data/lakeshore-segment-pnl.csv', templateId: 'segment-pnl' },
  ],
};
writeFileSync(join(root, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

const productionCompatibleManifest = {
  ...manifest,
  loadName: 'lakeshore-current-state-v2-production-compatible',
  files: manifest.files.map((file) => {
    const templateIdByPath = {
      'data/lakeshore-infrastructure-estate.csv': 'application-portfolio',
      'data/lakeshore-data-platform-lineage.csv': 'integration-topology',
      'data/lakeshore-business-capability-map.csv': 'strategy-memo',
    };
    return {
      ...file,
      templateId: templateIdByPath[file.path] ?? file.templateId,
    };
  }),
};
writeFileSync(
  join(root, 'manifest.production.json'),
  JSON.stringify(productionCompatibleManifest, null, 2) + '\n',
);

const readme = `# Lakeshore Current-State Admin Load v2

Generated at: ${generatedAt}

SYNTHETIC / ILLUSTRATIVE. This package is not a real company disclosure.

## Purpose

This governed Admin ZIP closes Lakeshore current-state gaps for CXO questions:
leadership, IT organization, supply-chain organization, private cloud, hybrid
cloud, datacenters, ERP/HCM/treasury systems, supply-chain systems, data and
analytics architecture, vendors/contracts, top KPIs, active initiatives, risks,
controls, business capabilities, and company scale.

## Scale posture

Lakeshore is intentionally a smaller diversified holding-company pilot, closer
to a private holdco / operating-company portfolio model than Apex/Target or
SkyHarbor/Delta. The synthetic profile uses about $4.2B revenue, about 11k
employees, 12 countries, and five operating companies.

## Admin load contract

Upload \`lakeshore-current-state-admin-load-v2-production-compatible.zip\`
through \`/admin/setup\` → \`Open upload workspace\` → Bulk load. Use:

- Mode: Stage to Azure Blob and process now
- Attestation: accepted
- Note: Lakeshore current-state v2 synthetic admin load, generated ${generatedAt}

The production-compatible ZIP contains root \`manifest.json\` plus structured
CSV/JSON files. It preserves the rich source files while mapping three deeper
dimensions to template IDs accepted by the currently deployed Admin loader:

- infrastructure estate → application portfolio
- data platform lineage → integration topology
- business capability map → strategy memo

The canonical \`lakeshore-current-state-admin-load-v2.zip\` keeps the deeper
intended template IDs for the branch/deploy that includes the expanded registry.
The governed bulk route expands the ZIP, validates the manifest, stages each
file to Azure Blob, writes tenant-context chunks, persists the job status
receipt, and emits an admin \`intelligence.context_refreshed\` notification
after success once this branch is deployed.

## Expected evidence

- Blob bucket: \`context-uploads\`
- Load name: \`lakeshore-current-state-v2-production-compatible\` for the first
  live production-compatible run; \`lakeshore-current-state-v2\` for the
  canonical deeper-template package after deployment.
- Files: ${manifest.files.length}
- Structured records in package: ${
  enterpriseProfile.length + orgRoles.length + infrastructure.length + dataPlatforms.length + apps.length + erp.length +
  integrations.length + vendors.length + kpis.length + initiatives.length + risks.length + capabilities.length + pnl.length
}
- Source state: \`synthetic_admin_loader_backed\`

## Truth boundary

The Admin bulk CSV path commits retrievable tenant-context chunks with source
paths and provenance. It does not by itself populate every structured domain
table such as \`applications\`, \`vendor_contracts\`, \`ai_initiatives\`, or
\`enterprise_context_facts\`. The post-load audit must report those states
separately.
`;
writeFileSync(join(root, 'README.md'), readme);

const zipInputs = ['manifest.json', ...manifest.files.map((file) => file.path)];
const zip = spawnSync('/usr/bin/zip', ['-q', '-r', relative(root, zipPath), ...zipInputs], {
  cwd: root,
  stdio: 'inherit',
});
if (zip.status !== 0) {
  throw new Error(`zip failed with status ${zip.status}`);
}

mkdirSync(join(productionPackageDir, 'data'), { recursive: true });
writeFileSync(
  join(productionPackageDir, 'manifest.json'),
  JSON.stringify(productionCompatibleManifest, null, 2) + '\n',
);
for (const file of productionCompatibleManifest.files) {
  cpSync(join(root, file.path), join(productionPackageDir, file.path));
}
const productionZip = spawnSync(
  '/usr/bin/zip',
  ['-q', '-r', productionZipPath, 'manifest.json', 'data'],
  {
    cwd: productionPackageDir,
    stdio: 'inherit',
  },
);
if (productionZip.status !== 0) {
  throw new Error(`production zip failed with status ${productionZip.status}`);
}
rmSync(productionPackageDir, { recursive: true, force: true });

console.log(JSON.stringify({
  ok: true,
  root,
  zipPath,
  productionZipPath,
  files: manifest.files.length,
  productionCompatibleFiles: productionCompatibleManifest.files.length,
  rows:
    enterpriseProfile.length + orgRoles.length + infrastructure.length + dataPlatforms.length + apps.length + erp.length +
    integrations.length + vendors.length + kpis.length + initiatives.length + risks.length + capabilities.length + pnl.length,
}, null, 2));

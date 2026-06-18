#!/usr/bin/env node
/**
 * First Capital Financial — 6-Family Context Layer Generator (V2)
 *
 * Generates all 19 universal dimensions organized by family + the context
 * relationship graph (edges). This is the reference implementation of the
 * Enterprise Context Engine model.
 *
 * Output: datasets/first-capital-financial-synthetic-v2/
 * Usage:  node scripts/seed/generate-first-capital-v2.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ROOT = path.join(REPO_ROOT, 'datasets/first-capital-financial-synthetic-v2');
const CLIENT_ID = 'a75687bf-71b9-4524-ab4e-68ae3f28d200';
const TENANT_KEY = 'first-capital';
const GENERATED_AT = '2026-06-17T00:00:00Z';

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function write(rel, content) {
  const file = path.join(ROOT, rel);
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, typeof content === 'string' ? content : JSON.stringify(content, null, 2), 'utf8');
}
function esc(v) {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}
function csv(headers, rows) {
  return [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n') + '\n';
}
function jsonl(rows) { return rows.map(r => JSON.stringify(r)).join('\n') + '\n'; }

// ════════════════════════════════════════════════════════════════════════════
// FAMILY 1 — Enterprise & Operating Model
// ════════════════════════════════════════════════════════════════════════════

// D01 — Enterprise Profile
write('family-1-enterprise-operating-model/F01_enterprise-profile.yaml', `\
tenant_key: first-capital
dimension: enterprise_profile
dimension_family: enterprise_operating_model
load_order: 1

company_name: First Capital Financial Corporation
nasdaq: FCFC
industry: Regional Commercial Bank
sub_industry: Financial Services — US Banking
headquarters: Chicago, IL
founded: 1887
total_assets_usd: 148000000000
total_revenue_fy25_usd: 5400000000
employees_fte: 14200
branches: 312
atm_count: 2140
states_served: 8
regulatory_agencies:
  - OCC
  - Federal Reserve
  - FDIC
  - CFPB
  - FinCEN
it_budget_fy25_usd: 498000000
ai_spend_fy25_usd: 61000000
fiscal_year_end: December 31
data_classes:
  - public
  - internal
  - confidential
  - restricted
  - pii_confidential
  - pci_confidential
active_ai_programs: 32
open_mras: 3
open_findings: 14
source: First Capital Financial 2025 Annual Report (public); IT planning deck (confidential)
generated_at: ${GENERATED_AT}
`);

// D02 — Business Org & Functions
const businessFunctions = [
  ['FCF-BF-RETAIL',    'Retail Banking',              'EVP Retail Banking',              6800, 'Core deposits, consumer lending, branch and digital channels'],
  ['FCF-BF-COMMBK',   'Commercial Banking',           'EVP Commercial Banking',           2100, 'Middle-market and large corporate lending, treasury services'],
  ['FCF-BF-WEALTH',   'Wealth & Private Banking',     'SVP Wealth Management',             680, 'HNW advisory, trust, investments, private banking'],
  ['FCF-BF-TREASURY', 'Treasury & Capital Markets',   'Treasurer',                         420, 'ALM, liquidity, derivatives, correspondent banking'],
  ['FCF-BF-RISK',     'Risk & Compliance',            'Chief Risk Officer',                940, 'Credit, market, operational, AML/BSA, model risk, regulatory'],
  ['FCF-BF-FINANCE',  'Finance & Accounting',         'CFO',                               580, 'Financial reporting, FP&A, tax, investor relations'],
  ['FCF-BF-OPS',      'Operations',                   'COO',                              1680, 'Deposit, loan, payment, and servicing operations'],
  ['FCF-BF-TECH',     'Technology',                   'CIO',                              2240, 'IT delivery, infrastructure, architecture, security, data'],
  ['FCF-BF-DIGITAL',  'Digital & Marketing',          'Chief Digital Officer',             560, 'Digital channels, marketing, customer experience'],
  ['FCF-BF-HR',       'Human Resources',              'CHRO',                              280, 'Talent, learning, workforce planning, compensation'],
];

write('family-1-enterprise-operating-model/F02_business-org-functions.csv', csv(
  ['function_id','function_name','executive_owner_role','head_count','description'],
  businessFunctions.map(([function_id, function_name, executive_owner_role, head_count, description]) =>
    ({ function_id, function_name, executive_owner_role, head_count, description }))
));

// D03 — IT Org & Ownership
const itTeams = [
  ['TEAM-FCF-CORE',     'Core Banking Platforms',               'EVP Technology Operations',      'core banking',   210, 0,  100],
  ['TEAM-FCF-PAYMENTS', 'Payments and Treasury Services',       'SVP Payments Technology',        'payments',       95,  5,  95],
  ['TEAM-FCF-DIGITAL',  'Digital Banking and Client Experience','Chief Digital Officer',           'digital',        180, 20, 80],
  ['TEAM-FCF-COMMLEND', 'Commercial Lending Technology',        'SVP Commercial Bank CIO',        'lending',        75,  10, 90],
  ['TEAM-FCF-WEALTH',   'Wealth and Private Bank Technology',   'SVP Wealth Technology',          'wealth',         55,  0,  100],
  ['TEAM-FCF-RISK',     'Risk, Compliance and Financial Crimes','Chief Risk Officer',              'risk',           130, 30, 70],
  ['TEAM-FCF-DATA',     'Enterprise Data and AI',               'Chief Data and Analytics Officer','data',           160, 35, 65],
  ['TEAM-FCF-CLOUD',    'Cloud Platform Engineering',           'SVP Infrastructure',             'cloud',           90,  40, 60],
  ['TEAM-FCF-CYBER',    'Cybersecurity and IAM',                'CISO',                           'security',        80,  0,  100],
  ['TEAM-FCF-ERP',      'Finance ERP and Procurement Systems',  'CFO',                            'erp',             65,  0,  100],
  ['TEAM-FCF-BRANCH',   'Branch and ATM Technology',            'SVP Retail Bank Ops',            'branch',          70,  0,  100],
  ['TEAM-FCF-CONTACT',  'Contact Center and Servicing',         'SVP Client Service',             'servicing',       55,  0,  100],
  ['TEAM-FCF-MRM',      'Model Risk and Validation',            'Chief Model Risk Officer',       'model risk',      40,  5,  95],
  ['TEAM-FCF-OPS',      'Deposit and Loan Operations',          'COO',                            'operations',      85,  0,  100],
  ['TEAM-FCF-OPENBANK', 'Open Banking and API Products',        'Chief Product Officer',          'api',             50,  20, 80],
  ['TEAM-FCF-ITSM',     'ITSM, Observability and SRE',          'VP Technology Service Mgmt',     'itsm',            75,  30, 70],
  ['TEAM-FCF-REG',      'Regulatory Remediation PMO',           'Chief Compliance Officer',       'regulatory',      45,  0,  100],
  ['TEAM-FCF-DEVEX',    'Engineering Productivity Office',      'CIO',                            'devex',           35,  0,  100],
];

write('family-1-enterprise-operating-model/F03_it-org-ownership.csv', csv(
  ['team_id','team_name','it_owner_role','domain','head_count_fte','offshore_pct','onshore_pct'],
  itTeams.map(([team_id, team_name, it_owner_role, domain, head_count_fte, offshore_pct, onshore_pct]) =>
    ({ team_id, team_name, it_owner_role, domain, head_count_fte, offshore_pct, onshore_pct }))
));

// D04 — Capabilities & Value Streams
const capabilities = [
  ['FCF-CAP-01', 'Customer Onboarding',           'FCF-BF-RETAIL',   'Digital Onboarding', 2, 'Digital account opening and KYC verification'],
  ['FCF-CAP-02', 'Consumer Deposit Management',   'FCF-BF-RETAIL',   'Core Deposits',      4, 'DDA, savings, CD, MMA origination and servicing'],
  ['FCF-CAP-03', 'Consumer Lending Origination',  'FCF-BF-RETAIL',   'Consumer Lending',   3, 'Mortgage, auto, personal loan origination'],
  ['FCF-CAP-04', 'Commercial Loan Origination',   'FCF-BF-COMMBK',  'Commercial Lending', 2, 'Middle-market credit underwriting and approval'],
  ['FCF-CAP-05', 'Payment Processing',             'FCF-BF-OPS',     'Payments',           4, 'ACH, wire, card, RTP, FedNow payment execution'],
  ['FCF-CAP-06', 'AML & Financial Crimes',         'FCF-BF-RISK',    'Risk Management',    2, 'Transaction monitoring, case management, SAR filing'],
  ['FCF-CAP-07', 'Credit Underwriting & MRM',     'FCF-BF-RISK',    'Risk Management',    2, 'Credit assessment, model risk validation, scoring'],
  ['FCF-CAP-08', 'Wealth Advisory Services',       'FCF-BF-WEALTH',  'Wealth Management',  3, 'Portfolio management, trust, financial planning'],
  ['FCF-CAP-09', 'Treasury & ALM',                 'FCF-BF-TREASURY','Capital Markets',    2, 'Liquidity management, interest rate risk, hedging'],
  ['FCF-CAP-10', 'Regulatory Reporting',           'FCF-BF-RISK',    'Compliance',         1, 'Call report, FR Y-9C, HMDA, CRA, BSA reporting'],
  ['FCF-CAP-11', 'Digital Banking & Servicing',   'FCF-BF-DIGITAL', 'Digital Channels',   2, 'Mobile, online banking, customer self-service'],
  ['FCF-CAP-12', 'Contact Center Servicing',       'FCF-BF-OPS',     'Client Service',     3, 'Inbound/outbound customer interactions, case resolution'],
  ['FCF-CAP-13', 'Data & Analytics',               'FCF-BF-TECH',    'Data Platform',      2, 'Enterprise data lake, BI reporting, ML feature store'],
  ['FCF-CAP-14', 'Technology Delivery',            'FCF-BF-TECH',    'Engineering',        1, 'Software development, release management, DevOps'],
  ['FCF-CAP-15', 'Cybersecurity & IAM',            'FCF-BF-TECH',    'Security',           2, 'Identity, access, threat detection, incident response'],
];

write('family-1-enterprise-operating-model/F04_capabilities-value-streams.csv', csv(
  ['capability_id','capability_name','business_function','value_stream','ai_maturity','description'],
  capabilities.map(([capability_id, capability_name, business_function, value_stream, ai_maturity, description]) =>
    ({ capability_id, capability_name, business_function, value_stream, ai_maturity, description }))
));

// ════════════════════════════════════════════════════════════════════════════
// FAMILY 2 — Technology Estate
// ════════════════════════════════════════════════════════════════════════════

// D05 — Applications & Systems (anchor apps)
const namedApps = [
  ['FCF-APP-FIS-HORIZON',       'FIS Horizon Core Deposits',          'FIS',               'core banking',     'TEAM-FCF-CORE',     'FCF-BF-RETAIL',   'mainframe', 'maintain',    'critical', 18500000, 'pci_pii_confidential', 142, 0.22],
  ['FCF-APP-HOGAN-LOANS',       'Hogan Commercial Loan Servicing',    'DXC/FIS',           'commercial lending','TEAM-FCF-COMMLEND', 'FCF-BF-COMMBK',  'mainframe', 'migrate',     'critical', 12400000, 'confidential',         96,  0.18],
  ['FCF-APP-FEDWIRE-ACH',       'ACH and Wire Payments Hub',          'ACI Worldwide',     'payments',         'TEAM-FCF-PAYMENTS', 'FCF-BF-OPS',      'hybrid',    'invest',      'critical',  9200000, 'pci_confidential',     118, 0.45],
  ['FCF-APP-FEDNOW-RTP',        'FedNow and RTP Gateway',             'The Clearing House','payments',         'TEAM-FCF-PAYMENTS', 'FCF-BF-OPS',      'cloud',     'invest',      'critical',  6400000, 'pci_confidential',      62, 0.68],
  ['FCF-APP-SALESFORCE-FSC',    'Salesforce Financial Services Cloud','Salesforce',         'crm',              'TEAM-FCF-DIGITAL',  'FCF-BF-RETAIL',   'saas',      'invest',      'critical',  7200000, 'pii_confidential',      80, 0.71],
  ['FCF-APP-NCINO',             'nCino Commercial Loan Origination',  'nCino',              'commercial lending','TEAM-FCF-COMMLEND', 'FCF-BF-COMMBK',  'saas',      'invest',      'critical',  8700000, 'confidential',          75, 0.63],
  ['FCF-APP-NICE-ACTIMIZE',     'NICE Actimize AML and Fraud',        'NICE',               'financial crimes', 'TEAM-FCF-RISK',     'FCF-BF-RISK',     'hybrid',    'invest',      'critical', 11200000, 'restricted',           104, 0.56],
  ['FCF-APP-FENERGO-KYC',       'Fenergo Client Lifecycle Mgmt',      'Fenergo',            'kyc',              'TEAM-FCF-RISK',     'FCF-BF-RISK',     'saas',      'restructure', 'critical',  6600000, 'restricted',            61, 0.58],
  ['FCF-APP-MUREX-TREASURY',    'Murex Treasury and Liquidity',       'Murex',              'treasury',         'TEAM-FCF-PAYMENTS', 'FCF-BF-TREASURY', 'on_prem',   'maintain',    'critical',  8100000, 'confidential',          72, 0.34],
  ['FCF-APP-SAP-ECC',           'SAP ECC Finance and Procurement',    'SAP',                'erp finance',      'TEAM-FCF-ERP',      'FCF-BF-FINANCE',  'on_prem',   'migrate',     'critical', 10300000, 'confidential',          88, 0.31],
  ['FCF-APP-WORKDAY-HCM',       'Workday HCM and Payroll',            'Workday',            'hr',               'TEAM-FCF-ERP',      'FCF-BF-HR',       'saas',      'maintain',    'high',      5100000, 'pii_confidential',      43, 0.49],
  ['FCF-APP-SNOWFLAKE',         'Snowflake Financial Data Cloud',     'Snowflake',          'data platform',    'TEAM-FCF-DATA',     'FCF-BF-TECH',     'cloud',     'invest',      'critical',  7400000, 'confidential',         117, 0.78],
  ['FCF-APP-DATABRICKS',        'Databricks AI and Feature Platform', 'Databricks',         'ai platform',      'TEAM-FCF-DATA',     'FCF-BF-TECH',     'cloud',     'invest',      'high',      5900000, 'restricted',            66, 0.82],
  ['FCF-APP-MOBILE-BANKING',    'Mobile Banking App',                 'Internal',           'digital banking',  'TEAM-FCF-DIGITAL',  'FCF-BF-DIGITAL',  'cloud',     'invest',      'critical',  9300000, 'pii_confidential',      91, 0.76],
  ['FCF-APP-ONLINE-ACCT-OPEN',  'Digital Account Opening',           'Blend/Internal',     'digital banking',  'TEAM-FCF-DIGITAL',  'FCF-BF-DIGITAL',  'hybrid',    'restructure', 'critical',  4300000, 'pii_confidential',      70, 0.70],
  ['FCF-APP-PEGA-CASE',         'Pega Operations Case Management',    'Pega',               'operations',       'TEAM-FCF-OPS',      'FCF-BF-OPS',      'hybrid',    'maintain',    'high',      4700000, 'confidential',          53, 0.52],
  ['FCF-APP-SERVICENOW',        'ServiceNow ITSM and GRC',            'ServiceNow',         'itsm grc',         'TEAM-FCF-ITSM',     'FCF-BF-TECH',     'saas',      'invest',      'high',      6800000, 'confidential',          74, 0.64],
  ['FCF-APP-SPLUNK',            'Splunk Enterprise Security',         'Splunk',             'security',         'TEAM-FCF-CYBER',    'FCF-BF-TECH',     'hybrid',    'maintain',    'critical',  6100000, 'restricted',            69, 0.44],
  ['FCF-APP-CROWDSTRIKE',       'CrowdStrike Falcon',                 'CrowdStrike',        'security',         'TEAM-FCF-CYBER',    'FCF-BF-TECH',     'saas',      'maintain',    'critical',  3900000, 'restricted',            42, 0.54],
  ['FCF-APP-BROADRIDGE',        'Broadridge Wealth Operations',       'Broadridge',         'wealth',           'TEAM-FCF-WEALTH',   'FCF-BF-WEALTH',   'saas',      'maintain',    'critical',  5600000, 'confidential',          38, 0.41],
];

write('family-2-technology-estate/F05_applications-systems.csv', csv(
  ['app_id','name','vendor','category','it_owner_team','business_function','deployment','lifecycle_stage','criticality','run_cost_fy25_usd','primary_dataclass','integration_count','ai_eligibility_score'],
  namedApps.map(([app_id, name, vendor, category, it_owner_team, business_function, deployment, lifecycle_stage, criticality, run_cost_fy25_usd, primary_dataclass, integration_count, ai_eligibility_score]) =>
    ({ app_id, name, vendor, category, it_owner_team, business_function, deployment, lifecycle_stage, criticality, run_cost_fy25_usd, primary_dataclass, integration_count, ai_eligibility_score }))
));

// D06 — System-to-Function Mapping (the critical graph bridge)
const sysFuncMapping = [
  ['FCF-SFM-001', 'FCF-APP-FIS-HORIZON',     'FCF-CAP-02', 'primary',   'Core deposit system of record',                      2100, 'core deposits and DDA'],
  ['FCF-SFM-002', 'FCF-APP-FIS-HORIZON',     'FCF-CAP-03', 'secondary', 'Consumer lending account servicing',                  380, 'consumer loan servicing'],
  ['FCF-SFM-003', 'FCF-APP-HOGAN-LOANS',     'FCF-CAP-04', 'primary',   'Commercial loan servicing platform of record',        280, 'commercial credit'],
  ['FCF-SFM-004', 'FCF-APP-FEDWIRE-ACH',     'FCF-CAP-05', 'primary',   'Wire and ACH payment execution platform',            1400, 'payment processing'],
  ['FCF-SFM-005', 'FCF-APP-FEDNOW-RTP',      'FCF-CAP-05', 'secondary', 'Real-time payment gateway (FedNow/RTP)',               220, 'instant payments'],
  ['FCF-SFM-006', 'FCF-APP-SALESFORCE-FSC',  'FCF-CAP-01', 'secondary', 'CRM used in onboarding and relationship management',  840, 'prospect and client CRM'],
  ['FCF-SFM-007', 'FCF-APP-SALESFORCE-FSC',  'FCF-CAP-08', 'primary',   'Wealth advisor CRM and relationship platform',        480, 'wealth CRM'],
  ['FCF-SFM-008', 'FCF-APP-NCINO',           'FCF-CAP-04', 'primary',   'Commercial loan origination workflow',                280, 'commercial origination'],
  ['FCF-SFM-009', 'FCF-APP-NICE-ACTIMIZE',   'FCF-CAP-06', 'primary',   'Transaction monitoring and AML case management',      420, 'AML analysts'],
  ['FCF-SFM-010', 'FCF-APP-FENERGO-KYC',     'FCF-CAP-06', 'secondary', 'KYC onboarding and client lifecycle management',      420, 'compliance and KYC'],
  ['FCF-SFM-011', 'FCF-APP-MUREX-TREASURY',  'FCF-CAP-09', 'primary',   'ALM, derivatives, and liquidity management',          180, 'treasury analysts'],
  ['FCF-SFM-012', 'FCF-APP-SAP-ECC',         'FCF-CAP-10', 'secondary', 'General ledger and regulatory financial reporting',   340, 'finance and accounting'],
  ['FCF-SFM-013', 'FCF-APP-SNOWFLAKE',       'FCF-CAP-13', 'primary',   'Enterprise data warehouse for analytics and ML',      380, 'data analysts'],
  ['FCF-SFM-014', 'FCF-APP-DATABRICKS',      'FCF-CAP-13', 'secondary', 'AI/ML feature engineering and model training',        160, 'data scientists'],
  ['FCF-SFM-015', 'FCF-APP-DATABRICKS',      'FCF-CAP-07', 'secondary', 'Fraud and credit model development',                  95, 'model risk analysts'],
  ['FCF-SFM-016', 'FCF-APP-MOBILE-BANKING',  'FCF-CAP-11', 'primary',   'Primary digital banking channel (mobile)',            7200, 'retail clients'],
  ['FCF-SFM-017', 'FCF-APP-ONLINE-ACCT-OPEN','FCF-CAP-01', 'primary',   'Digital account opening and onboarding',             1800, 'new account applicants'],
  ['FCF-SFM-018', 'FCF-APP-PEGA-CASE',       'FCF-CAP-12', 'secondary', 'Operations case management for deposits/loans',       420, 'ops processing team'],
  ['FCF-SFM-019', 'FCF-APP-SERVICENOW',      'FCF-CAP-14', 'secondary', 'ITSM, change management, and GRC evidence store',    1200, 'technology staff'],
  ['FCF-SFM-020', 'FCF-APP-SPLUNK',          'FCF-CAP-15', 'primary',   'SIEM, audit log, and regulatory evidence platform',   80, 'security team'],
  ['FCF-SFM-021', 'FCF-APP-CROWDSTRIKE',     'FCF-CAP-15', 'secondary', 'Endpoint and identity protection',                    80, 'security team'],
  ['FCF-SFM-022', 'FCF-APP-BROADRIDGE',      'FCF-CAP-08', 'secondary', 'Wealth trade processing and statement generation',    480, 'wealth advisors'],
  ['FCF-SFM-023', 'FCF-APP-WORKDAY-HCM',    'FCF-CAP-14', 'secondary', 'HR, payroll, and workforce data platform',           14200, 'all employees'],
];

write('family-2-technology-estate/F06_system-function-mapping.csv', csv(
  ['mapping_id','app_id','capability_id','support_type','process_area','user_count','module'],
  sysFuncMapping.map(([mapping_id, app_id, capability_id, support_type, process_area, user_count, module]) =>
    ({ mapping_id, app_id, capability_id, support_type, process_area, user_count, module }))
));

// D07 — Infrastructure & Cloud
const infraResources = [
  ['FCF-INFRA-AWS-001',  'cloud',         'AWS',           'us-east-1',    'critical', 'TEAM-FCF-CLOUD',   'production', 2800000, 'Digital banking, FedNow/RTP, ML workloads'],
  ['FCF-INFRA-AZURE-001','cloud',         'Azure',         'eastus',       'critical', 'TEAM-FCF-CLOUD',   'production', 1900000, 'M365, Copilot, identity, ACA workloads'],
  ['FCF-INFRA-DC-CHI',   'datacenter',    'Equinix',       'Chicago',      'critical', 'TEAM-FCF-CLOUD',   'production',  850000, 'Core banking colocation; FIS Horizon'],
  ['FCF-INFRA-DC-DET',   'datacenter',    'Equinix',       'Detroit',      'high',     'TEAM-FCF-CLOUD',   'dr',          420000, 'Disaster recovery site for core banking'],
  ['FCF-INFRA-MF-Z15',   'mainframe',     'IBM',           'Chicago',      'critical', 'TEAM-FCF-CORE',    'production', 4200000, 'IBM Z15 running FIS Horizon and Hogan; lease through 2028'],
  ['FCF-INFRA-AZURE-002','cloud',         'Azure',         'eastus2',      'high',     'TEAM-FCF-CYBER',   'production',  430000, 'Azure Sentinel SIEM, Defender for Cloud'],
  ['FCF-INFRA-AWS-002',  'cloud',         'AWS',           'us-east-1',    'high',     'TEAM-FCF-DATA',    'production', 1100000, 'Databricks on AWS; fraud graph workloads'],
  ['FCF-INFRA-GCP-001',  'cloud',         'Google Cloud',  'us-central1',  'medium',   'TEAM-FCF-DATA',    'production',  310000, 'BigQuery analytics sandbox'],
  ['FCF-INFRA-COLLAB',   'saas',          'Microsoft',     'global',       'critical', 'TEAM-FCF-DEVEX',   'production', 2400000, 'M365, Teams, SharePoint'],
];

write('family-2-technology-estate/F07_infrastructure-cloud.csv', csv(
  ['resource_id','resource_type','provider','region','criticality','owner_team','environment','monthly_cost_usd','notes'],
  infraResources.map(([resource_id, resource_type, provider, region, criticality, owner_team, environment, monthly_cost_usd, notes]) =>
    ({ resource_id, resource_type, provider, region, criticality, owner_team, environment, monthly_cost_usd, notes }))
));

// D08 — Platform Volumetrics
const volumetrics = [
  ['FCF-APP-FIS-HORIZON',    'daily_transactions',   '2026-05', 2400000,    'txn/day',  3200000, 75,   'Mainframe batch window 23:00–05:00 EST'],
  ['FCF-APP-FEDWIRE-ACH',    'daily_payment_volume', '2026-05', 8200000000, 'usd/day',  null,    null, 'FedNow/RTP represents 4% of daily volume'],
  ['FCF-APP-MOBILE-BANKING', 'monthly_active_users', '2026-05', 1840000,    'users',    3200000, 58,   'Peer median MAU penetration is 78%'],
  ['FCF-APP-SNOWFLAKE',      'daily_queries',        '2026-05', 142000,     'queries',  null,    null, 'Cortex AI calls = 8,400/day; masked data only'],
  ['FCF-APP-NICE-ACTIMIZE',  'monthly_alerts',       '2026-05', 38400,      'alerts',   null,    null, 'False positive rate 89%; SR 11-7 validation pending'],
  ['FCF-APP-SERVICENOW',     'monthly_incidents',    '2026-05', 4200,       'tickets',  null,    null, 'CMDB coverage 74%; critical CIs 98%'],
  ['FCF-APP-DATABRICKS',     'monthly_ml_jobs',      '2026-05', 18600,      'jobs',     null,    null, 'Fraud graph job = 3.2h/day; credit scoring = 1.4h/day'],
];

write('family-2-technology-estate/F08_platform-volumetrics.csv', csv(
  ['platform_id','metric_name','period','value','unit','capacity','capacity_pct','notes'],
  volumetrics.map(([platform_id, metric_name, period, value, unit, capacity, capacity_pct, notes]) =>
    ({ platform_id, metric_name, period, value, unit, capacity, capacity_pct, notes }))
));

// ════════════════════════════════════════════════════════════════════════════
// FAMILY 3 — Data & Connectivity
// ════════════════════════════════════════════════════════════════════════════

// D09 — Data & Analytics Estate
const dataProducts = [
  ['FCF-DP-001', 'Customer 360 Profile',      'FCF-APP-FIS-HORIZON|FCF-APP-SALESFORCE-FSC', 'TEAM-FCF-DATA', 'pii_confidential', '4h',   88, true,  'Cross-system customer view; consent gaps block AI personalization'],
  ['FCF-DP-002', 'Transaction Ledger',        'FCF-APP-FIS-HORIZON|FCF-APP-FEDWIRE-ACH',    'TEAM-FCF-DATA', 'pci_confidential', '1h',   95, true,  'Regulatory reporting source; MRA-flagged lineage gaps for wire transactions'],
  ['FCF-DP-003', 'Commercial Credit Data',    'FCF-APP-NCINO|FCF-APP-HOGAN-LOANS',          'TEAM-FCF-DATA', 'confidential',     '24h',  71, false, 'Credit underwriting and portfolio data; integration gaps cause 23-day cycle time'],
  ['FCF-DP-004', 'AML Alert Dataset',         'FCF-APP-NICE-ACTIMIZE',                      'TEAM-FCF-RISK', 'restricted',       '1h',   82, true,  'SR 11-7 subject; model-feature use requires validation evidence'],
  ['FCF-DP-005', 'Fraud Feature Store',       'FCF-APP-DATABRICKS|FCF-APP-SNOWFLAKE',       'TEAM-FCF-DATA', 'restricted',       '15min',96, true,  'Real-time fraud features; Featurespace integration in progress'],
  ['FCF-DP-006', 'Regulatory Reporting Pack', 'FCF-APP-SAP-ECC|FCF-APP-SNOWFLAKE',          'TEAM-FCF-FINANCE','confidential',   '24h',  79, true,  'Call report, FR Y-9C, HMDA; OCC MRA on lineage documentation'],
  ['FCF-DP-007', 'ML Model Registry',         'FCF-APP-DATABRICKS',                         'TEAM-FCF-MRM',  'restricted',       'on_demand', 91, true, '47 production models; 12 require SR 11-7 refreshed evidence'],
  ['FCF-DP-008', 'Digital Funnel Analytics',  'FCF-APP-MOBILE-BANKING|FCF-APP-ONLINE-ACCT-OPEN','TEAM-FCF-DIGITAL','pii_confidential','1h',74, false,'Abandonment 64%; peer benchmark 42%; AI personalization blocked pending consent'],
];

write('family-3-data-connectivity/F09_data-analytics-estate.csv', csv(
  ['data_product_id','name','source_system','owner_team','data_class','refresh_sla','quality_score','lineage_documented','notes'],
  dataProducts.map(([data_product_id, name, source_system, owner_team, data_class, refresh_sla, quality_score, lineage_documented, notes]) =>
    ({ data_product_id, name, source_system, owner_team, data_class, refresh_sla, quality_score, lineage_documented, notes }))
));

// D10 — Integrations & Interfaces
const integrations = [
  ['FCF-INT-001', 'FCF-APP-FIS-HORIZON',    'FCF-APP-SNOWFLAKE',         'batch_file',  'inbound',  true,  'nightly', 2400000, 'Core deposit ledger → data warehouse; MRA-flagged lineage gap'],
  ['FCF-INT-002', 'FCF-APP-FEDWIRE-ACH',    'FCF-APP-NICE-ACTIMIZE',    'api',         'outbound', true,  'real_time', null,  'Payment transaction feed to AML monitoring; 38,400 alerts/mo'],
  ['FCF-INT-003', 'FCF-APP-NCINO',          'FCF-APP-SAP-ECC',           'api',         'outbound', false, 'daily',  null,    'Commercial loan booking to GL; manual reconciliation gap'],
  ['FCF-INT-004', 'FCF-APP-FENERGO-KYC',   'FCF-APP-NICE-ACTIMIZE',    'api',         'outbound', true,  'event',  null,    'KYC decision feed to AML case management'],
  ['FCF-INT-005', 'FCF-APP-SALESFORCE-FSC', 'FCF-APP-FIS-HORIZON',      'api',         'inbound',  false, '15min',  null,    'Balance and product data to CRM; fragmented adoption blocks advisor productivity'],
  ['FCF-INT-006', 'FCF-APP-DATABRICKS',     'FCF-APP-NICE-ACTIMIZE',    'api',         'inbound',  true,  'real_time', null, 'ML risk scores to AML triage agent; SR 11-7 evidence pending'],
  ['FCF-INT-007', 'FCF-APP-SAP-ECC',        'FCF-APP-SNOWFLAKE',         'batch_file',  'inbound',  true,  'nightly', null,    'GL actuals to data warehouse for regulatory and BI reporting'],
  ['FCF-INT-008', 'FCF-APP-FIS-HORIZON',    'FCF-APP-MOBILE-BANKING',   'api',         'inbound',  true,  'real_time', null, 'Account balance and transaction API to digital channel'],
  ['FCF-INT-009', 'FCF-APP-SERVICENOW',     'FCF-APP-SPLUNK',            'api',         'inbound',  true,  'event',  null,    'Security alerts from SIEM to ITSM for incident creation'],
  ['FCF-INT-010', 'FCF-APP-MUREX-TREASURY', 'FCF-APP-SNOWFLAKE',         'batch_file',  'inbound',  false, 'daily',  null,    'Treasury P&L and position data to enterprise warehouse'],
  ['FCF-INT-011', 'FCF-APP-WORKDAY-HCM',   'FCF-APP-SNOWFLAKE',         'batch_file',  'inbound',  true,  'daily',  14200,   'HR headcount and workforce data to analytics'],
  ['FCF-INT-012', 'FCF-APP-FEDNOW-RTP',     'FCF-APP-FEDWIRE-ACH',      'mq',          'peer',     true,  'real_time', null, 'Real-time payment routing between ACH hub and FedNow/RTP gateway'],
];

write('family-3-data-connectivity/F10_integrations-interfaces.csv', csv(
  ['edge_id','source_app_id','target_app_id','integration_type','direction','monitored','latency_sla','daily_volume','notes'],
  integrations.map(([edge_id, source_app_id, target_app_id, integration_type, direction, monitored, latency_sla, daily_volume, notes]) =>
    ({ edge_id, source_app_id, target_app_id, integration_type, direction, monitored, latency_sla, daily_volume, notes }))
));

// ════════════════════════════════════════════════════════════════════════════
// FAMILY 4 — Financial & Commercial
// ════════════════════════════════════════════════════════════════════════════

// D11 — Vendors, Contracts & Licenses
const vendors = [
  ['FCF-VEND-001', 'FIS',              'FCF-APP-FIS-HORIZON',       'core_ams',        38000000, '2027-02-15', true,  180, 'CIO',                     'restricted',       'AI use requires MRM approval; model-generated code prohibited', 'Core transition assistance capped 12 months', true],
  ['FCF-VEND-002', 'DXC Technology',   'FCF-APP-HOGAN-LOANS',       'mainframe_ams',   26000000, '2026-11-30', false, 120, 'CIO',                     'confidential',     'AI tooling in isolated dev only; no client-data LLM use',      'App-by-app removal; 120-day notice required',  false],
  ['FCF-VEND-003', 'Accenture',        null,                         'si_advisory',     18000000, '2026-09-30', false, 90,  'CIO',                     'confidential',     'Client IP indemnity required for any AI output',               'SOW termination for convenience',              false],
  ['FCF-VEND-004', 'Deloitte',         null,                         'risk_consulting', 14000000, '2026-08-31', false, 60,  'Chief Risk Officer',      'restricted',       'No customer data in public LLMs; SR 11-7 attestation required', 'Quarterly SOW breakpoints',                   false],
  ['FCF-VEND-005', 'Salesforce',       'FCF-APP-SALESFORCE-FSC',    'saas_crm',        12200000, '2027-01-31', true,  120, 'Chief Digital Officer',   'pii_confidential', 'Einstein features require written approval + evidence',         'Annual volume true-down only',                true],
  ['FCF-VEND-006', 'NICE Systems',     'FCF-APP-NICE-ACTIMIZE',     'financial_crimes',11200000, '2026-12-31', false, 90,  'Chief Risk Officer',      'restricted',       'ML feature use subject to SR 11-7 evidence',                   'Module carve-out allowed after 90 days',       true],
  ['FCF-VEND-007', 'SAP',              'FCF-APP-SAP-ECC',           'erp_license',      9800000, '2027-05-31', true,  180, 'CFO',                     'confidential',     'Joule AI features disabled pending data policy review',         'S/4HANA transition credit negotiable',         false],
  ['FCF-VEND-008', 'ACI Worldwide',    'FCF-APP-FEDWIRE-ACH',       'payments_license', 8600000, '2026-10-31', false, 90,  'SVP Payments Technology', 'restricted',       'AI-generated payment rules prohibited without OCC sign-off',   'FedNow module removal after stabilization',    false],
  ['FCF-VEND-009', 'Snowflake',        'FCF-APP-SNOWFLAKE',         'data_platform',    7600000, '2026-07-31', false, 60,  'Chief Data Officer',      'confidential',     'Cortex AI restricted to masked or aggregate data only',         'Committed-use drawdown resets annually',       true],
  ['FCF-VEND-010', 'Databricks',       'FCF-APP-DATABRICKS',        'ai_platform',      6400000, '2027-03-31', true,  90,  'Chief Data Officer',      'restricted',       'Mosaic AI use requires MRM approval before production use',     'Workspace termination with data export SLA',   true],
  ['FCF-VEND-011', 'Microsoft',        'FCF-APP-MOBILE-BANKING',    'saas_productivity',5200000, '2027-06-30', true,  90,  'CIO',                     'pii_confidential', 'Copilot features gated on privacy impact assessment per tenant','Annual EA renewal; opt-out available',         true],
  ['FCF-VEND-012', 'Murex',            'FCF-APP-MUREX-TREASURY',    'treasury_platform',8100000, '2027-08-31', true,  180, 'Treasurer',               'confidential',     'No AI augmentation without FRTB evidence review',              '24-month decommission notice required',        false],
];

write('family-4-financial-commercial/F11_vendors-contracts-licenses.csv', csv(
  ['vendor_id','vendor_name','primary_system_id','contract_type','annual_value_usd','renewal_date','auto_renew','notice_days','contract_owner','data_class','ai_clauses','exit_terms','benchmark_present'],
  vendors.map(([vendor_id, vendor_name, primary_system_id, contract_type, annual_value_usd, renewal_date, auto_renew, notice_days, contract_owner, data_class, ai_clauses, exit_terms, benchmark_present]) =>
    ({ vendor_id, vendor_name, primary_system_id, contract_type, annual_value_usd, renewal_date, auto_renew, notice_days, contract_owner, data_class, ai_clauses, exit_terms, benchmark_present }))
));

// D12 — IT Budget & Financials
const budgetLines = [
  ['FCF-BDG-001', 'Core Banking Run & Sustain',    'TEAM-FCF-CORE',     98000000, 'opex', 0,        98000000, 78000000, 20000000,  2026, 'FIS Horizon + IBM mainframe + DXC AMS'],
  ['FCF-BDG-002', 'Digital & Payments Investment', 'TEAM-FCF-DIGITAL',  72000000, 'mixed',28000000, 44000000, 18000000, 26000000,  2026, 'Mobile banking, FedNow/RTP, account opening'],
  ['FCF-BDG-003', 'Risk & Compliance Technology',  'TEAM-FCF-RISK',     58000000, 'opex', 0,        58000000, 22000000, 36000000,  2026, 'NICE Actimize, Fenergo, regulatory tooling'],
  ['FCF-BDG-004', 'Data & AI Platform',            'TEAM-FCF-DATA',     55000000, 'mixed',20000000, 35000000, 14000000, 21000000,  2026, 'Snowflake, Databricks, ML engineering'],
  ['FCF-BDG-005', 'Cloud & Infrastructure',        'TEAM-FCF-CLOUD',    48000000, 'opex', 0,        48000000, 8000000,  40000000,  2026, 'AWS, Azure, colocation; DC exit in progress'],
  ['FCF-BDG-006', 'Commercial Banking Technology', 'TEAM-FCF-COMMLEND', 42000000, 'mixed',12000000, 30000000, 12000000, 18000000,  2026, 'nCino, Hogan migration, credit technology'],
  ['FCF-BDG-007', 'Cybersecurity',                 'TEAM-FCF-CYBER',    38000000, 'opex', 0,        38000000, 6000000,  32000000,  2026, 'Splunk, CrowdStrike, IAM, pen testing'],
  ['FCF-BDG-008', 'Regulatory Remediation PMO',    'TEAM-FCF-REG',      28000000, 'opex', 0,        28000000, 4000000,  24000000,  2026, 'OCC MRA remediation; BSA/AML enhancement'],
  ['FCF-BDG-009', 'Finance & ERP Systems',         'TEAM-FCF-ERP',      24000000, 'opex', 0,        24000000, 6000000,  18000000,  2026, 'SAP ECC, Workday; S/4HANA migration TBD'],
  ['FCF-BDG-010', 'AI Program Investments',        'TEAM-FCF-DATA',     35000000, 'capex',35000000, 0,        4000000,  8000000,   2026, 'Copilot, AML AI, fraud graph, credit automation'],
];

write('family-4-financial-commercial/F12_it-budget-financials.csv', csv(
  ['budget_line_id','category','owner_team','annual_budget_usd','spend_type','capex_usd','opex_usd','labor_usd','vendor_usd','fiscal_year','notes'],
  budgetLines.map(([budget_line_id, category, owner_team, annual_budget_usd, spend_type, capex_usd, opex_usd, labor_usd, vendor_usd, fiscal_year, notes]) =>
    ({ budget_line_id, category, owner_team, annual_budget_usd, spend_type, capex_usd, opex_usd, labor_usd, vendor_usd, fiscal_year, notes }))
));

// ════════════════════════════════════════════════════════════════════════════
// FAMILY 5 — Execution & Operations
// ════════════════════════════════════════════════════════════════════════════

// D13 — Initiatives & Portfolio
const initiatives = [
  ['FCF-INIT-001', 'FedNow and RTP Modernization',            'active', 'SVP Payments Technology',  'FCF-BF-OPS',      18600000, 42000000, 'Restructure', 'Build',  'FCF-APP-FEDWIRE-ACH|FCF-APP-FEDNOW-RTP',         'FCF-KPI-005', 'RESTRUCTURE: commercial-deposit value real; core API, sanction screening, 24x7 ops gates unresolved.'],
  ['FCF-INIT-002', 'AML Case Triage Automation',              'active', 'Chief Risk Officer',       'FCF-BF-RISK',      8900000, 21000000, 'Restructure', 'Pilot',  'FCF-APP-NICE-ACTIMIZE|FCF-APP-DATABRICKS',       'FCF-KPI-002', 'RESTRUCTURE: case backlog value clear; SR 11-7 validation evidence incomplete. Cannot scale without MRM sign-off.'],
  ['FCF-INIT-003', 'Core Banking Future Decision',            'active', 'CIO',                      'FCF-BF-RETAIL',   14000000, 0,        'Hold',        'Scope',  'FCF-APP-FIS-HORIZON',                            null,          'HOLD: CIO wants RFP now; Sentinel holds until OCC MRA remediation and data migration sequencing resolved.'],
  ['FCF-INIT-004', 'Fraud Graph Analytics v2',                'active', 'Chief Risk Officer',       'FCF-BF-RISK',      7300000, 28600000, 'Continue',    'Scale',  'FCF-APP-DATABRICKS|FCF-APP-NICE-ACTIMIZE',       'FCF-KPI-001', 'CONTINUE: verified fraud-loss avoidance $28.6M; engaged sponsor; high spend is justified by evidence.'],
  ['FCF-INIT-005', 'Digital Account Opening Recovery',        'active', 'Chief Digital Officer',    'FCF-BF-DIGITAL',   4100000, 18400000, 'Continue',    'Build',  'FCF-APP-ONLINE-ACCT-OPEN|FCF-APP-SALESFORCE-FSC','FCF-KPI-003', 'CONTINUE: abandonment rate 64% vs peer 42%; KYC and funding handoff improvements underway.'],
  ['FCF-INIT-006', 'Commercial Credit Memo AI',               'active', 'SVP Commercial Bank CIO',  'FCF-BF-COMMBK',   3400000, 12200000, 'Continue',    'Pilot',  'FCF-APP-NCINO|FCF-APP-DATABRICKS',               'FCF-KPI-004', 'CONTINUE: 23-day cycle time gap vs 14-day target; MRM sign-off pending; pilot with 8 analysts proving value.'],
  ['FCF-INIT-007', 'Branch Queue Vision AI',                  'active', 'SVP Retail Bank Ops',      'FCF-BF-RETAIL',    1900000,   600000, 'Kill',        'Pilot',  'FCF-APP-MOBILE-BANKING',                         null,          'KILL: low teller adoption; privacy review unresolved; no verified throughput value after 18 months.'],
  ['FCF-INIT-008', 'Contact Center Sentiment AI v1',          'active', 'SVP Client Service',       'FCF-BF-OPS',       2400000,   800000, 'Kill',        'Run',    null,                                             null,          'KILL: canned sentiment scores created coaching risk; no call-time reduction verified.'],
  ['FCF-INIT-009', 'Wealth Advisor Copilot Shadow',           'active', 'SVP Wealth Technology',    'FCF-BF-WEALTH',    3100000,  1700000, 'Kill',        'Pilot',  'FCF-APP-SALESFORCE-FSC',                         null,          'KILL: unapproved client-note data path; FINRA supervision gaps unresolved.'],
  ['FCF-INIT-010', 'M365 Copilot Controlled Rollout',         'active', 'CIO',                      'FCF-BF-TECH',      3800000,  9200000, 'Continue',    'Scale',  null,                                             'FCF-KPI-006', 'CONTINUE: 1,200 developer seats showing 28% code-completion time reduction; expanding to ops.'],
  ['FCF-INIT-011', 'Mortgage Document Intelligence',          'active', 'SVP Consumer Lending CIO', 'FCF-BF-RETAIL',    2800000,  7400000, 'Continue',    'Pilot',  null,                                             'FCF-KPI-007', 'CONTINUE: document extraction reduces underwriting cycle 4 days; MRM validation in progress.'],
  ['FCF-INIT-012', 'Model Risk Evidence Automation',          'active', 'Chief Model Risk Officer', 'FCF-BF-RISK',      1600000,  4100000, 'Continue',    'Build',  'FCF-APP-DATABRICKS|FCF-APP-SERVICENOW',          null,          'CONTINUE: 47 production models; automated evidence packaging reduces review from 18 to 6 days.'],
];

write('family-5-execution-operations/F13_initiatives-portfolio.csv', csv(
  ['initiative_id','title','status','sponsor_role','business_function','committed_usd','projected_value_usd','posture','stage','linked_app_ids','kpi_id','notes'],
  initiatives.map(([initiative_id, title, status, sponsor_role, business_function, committed_usd, projected_value_usd, posture, stage, linked_app_ids, kpi_id, notes]) =>
    ({ initiative_id, title, status, sponsor_role, business_function, committed_usd, projected_value_usd, posture, stage, linked_app_ids, kpi_id, notes }))
));

// D14 — Operations & Service Management
const incidents = Array.from({ length: 48 }, (_, i) => ({
  record_id: `FCF-INC-${String(i + 1).padStart(3, '0')}`,
  record_type: 'incident',
  system_id: namedApps[i % namedApps.length][0],
  severity: i % 10 === 0 ? 'sev1' : i % 4 === 0 ? 'sev2' : 'sev3',
  opened_at: `2026-${String((i % 5) + 1).padStart(2, '0')}-${String((i % 26) + 1).padStart(2, '0')}`,
  closed_at: i % 7 === 0 ? null : `2026-${String((i % 5) + 1).padStart(2, '0')}-${String(Math.min((i % 26) + 4, 28)).padStart(2, '0')}`,
  mttr_hours: i % 7 === 0 ? null : 0.5 + ((i * 13) % 47),
  sla_breached: i % 9 === 0,
  customer_impact: i % 3 === 0 ? 'client-facing degradation' : 'internal operational',
  root_cause: ['core batch delay', 'vendor change defect', 'API timeout', 'data-quality issue', 'capacity threshold'][i % 5],
}));

write('family-5-execution-operations/F14_operations-service-management.csv', csv(
  ['record_id','record_type','system_id','severity','opened_at','closed_at','mttr_hours','sla_breached','customer_impact','root_cause'],
  incidents
));

// D15 — KPIs & Outcome Evidence
const kpis = [
  ['FCF-KPI-001', 'Fraud Loss Avoidance',              'Chief Risk Officer',      'FCF-INIT-004', 47000000, 52600000, 75000000, 'usd_annual',    '2026-05', 'high',   'Databricks fraud graph — verified by fraud operations; $28.6M run-rate improvement vs baseline.'],
  ['FCF-KPI-002', 'AML False Positive Rate',           'Chief Risk Officer',      'FCF-INIT-002', 89,       81,       65,       'pct',           '2026-05', 'medium', 'AML triage AI pilot; SR 11-7 validation pending; 8% improvement but target 65% requires scale.'],
  ['FCF-KPI-003', 'Digital Account Open Abandonment',  'Chief Digital Officer',   'FCF-INIT-005', 64,       58,       28,       'pct',           '2026-05', 'medium', 'Account opening abandonment; peer median 42%; top quartile 28%; KYC friction is primary driver.'],
  ['FCF-KPI-004', 'Commercial Credit Cycle Time',      'EVP Commercial Banking',  'FCF-INIT-006', 23,       21,       14,       'days',          '2026-05', 'low',    'Commercial credit underwriting cycle; pilot with 8 analysts shows 2-day reduction.'],
  ['FCF-KPI-005', 'Instant Payment Adoption',          'SVP Payments Technology', 'FCF-INIT-001', 0,        2,        35,       'pct_volume',    '2026-05', 'low',    'FedNow/RTP as share of total payment volume; currently 2%; target 35% within 18 months.'],
  ['FCF-KPI-006', 'Developer Code Completion Velocity','CIO',                     'FCF-INIT-010', 100,      128,      160,      'index_baseline','2026-05', 'high',   'GitHub Copilot: 28% code-completion time reduction on 1,200-seat rollout.'],
  ['FCF-KPI-007', 'Mortgage Underwriting Cycle Time',  'SVP Consumer Lending CIO','FCF-INIT-011', 18,       14,       10,       'days',          '2026-05', 'medium', 'Document intelligence reducing 4 days; full extraction-to-decision target 10 days.'],
  ['FCF-KPI-008', 'Mobile App Store Rating',           'Chief Digital Officer',   null,           3.1,      3.2,      4.3,      'stars_5',       '2026-05', 'low',    'Mobile rating below peer median 4.2; authentication and onboarding friction primary drivers.'],
  ['FCF-KPI-009', 'IT Efficiency Ratio Contribution',  'CFO',                     null,           9.2,      9.2,      7.2,      'pct_revenue',   '2026-05', 'low',    'IT spend as % revenue; peer median 7.1%; legacy run cost and remediation are drivers.'],
  ['FCF-KPI-010', 'AML Model Review Cycle Time',       'Chief Model Risk Officer','FCF-INIT-012', 18,       14,       6,        'days',          '2026-05', 'medium', 'Evidence automation cuts model risk review from 18 to 6 days target.'],
  ['FCF-KPI-011', 'Contact Center Average Handle Time','SVP Client Service',      'FCF-INIT-008', 8.2,      8.1,      6.5,      'minutes',       '2026-05', 'low',    'Sentiment AI pilot failed to reduce AHT; initiative flagged for kill.'],
  ['FCF-KPI-012', 'Branch Teller Transaction Time',    'SVP Retail Bank Ops',     'FCF-INIT-007', 4.8,      4.9,      3.8,      'minutes',       '2026-05', 'low',    'Vision AI pilot shows no improvement; initiative flagged for kill.'],
];

write('family-5-execution-operations/F15_kpis-outcome-evidence.csv', csv(
  ['kpi_id','kpi_name','owner_role','initiative_id','baseline_value','current_value','target_value','unit','measurement_date','confidence','notes'],
  kpis.map(([kpi_id, kpi_name, owner_role, initiative_id, baseline_value, current_value, target_value, unit, measurement_date, confidence, notes]) =>
    ({ kpi_id, kpi_name, owner_role, initiative_id, baseline_value, current_value, target_value, unit, measurement_date, confidence, notes }))
));

// ════════════════════════════════════════════════════════════════════════════
// FAMILY 6 — Governance, AI & Evidence
// ════════════════════════════════════════════════════════════════════════════

// D16 — Security, Risk & Compliance
const controls = [
  ['FCF-CTRL-001', 'data_lineage',         'FCF-APP-FIS-HORIZON|FCF-APP-SNOWFLAKE', 'deficient',  'OCC',           'CIO',      '2025-11-15', 3, 'OCC MRA: data-lineage gaps for wire transaction reporting; remediation deadline 2026-Q4.'],
  ['FCF-CTRL-002', 'bsa_aml_case_mgmt',   'FCF-APP-NICE-ACTIMIZE|FCF-APP-FENERGO-KYC','deficient','FinCEN/OCC', 'Chief Risk Officer','2026-01-20',5,'BSA AML case management quality; alert-to-SAR funnel evidence required; staffing plan filed.'],
  ['FCF-CTRL-003', 'model_risk_sr11_7',   'FCF-APP-DATABRICKS|FCF-APP-NICE-ACTIMIZE','at_risk',   'Federal Reserve','Chief Model Risk Officer','2026-03-10',2,'SR 11-7: 12 production AI models lack refreshed validation evidence; blocking AML and fraud scale.'],
  ['FCF-CTRL-004', 'glba_safeguards',     'FCF-APP-MOBILE-BANKING|FCF-APP-SALESFORCE-FSC','compliant','OCC/FRB','CISO','2026-02-28',0,'GLBA safeguarding controls in place; annual testing completed; no open findings.'],
  ['FCF-CTRL-005', 'pci_dss_v4',         'FCF-APP-FEDWIRE-ACH|FCF-APP-FIS-HORIZON','compliant',  'PCI SSC',       'CISO',     '2026-04-15', 1,'PCI DSS v4 compliant; 1 minor finding on session key rotation; remediation in 30 days.'],
  ['FCF-CTRL-006', 'third_party_ai_risk', null,                                     'at_risk',   'OCC',           'Chief Risk Officer','2026-05-01',4,'OCC examiner flagged: 8 of 12 named AI vendors have undocumented data rights and exit clauses.'],
  ['FCF-CTRL-007', 'cyber_resilience',    'FCF-APP-SPLUNK|FCF-APP-CROWDSTRIKE',     'compliant',  'Federal Reserve','CISO',    '2026-03-30', 0,'DFAST cyber scenario playbook completed; 99.97% SOC uptime; no high-severity gaps.'],
  ['FCF-CTRL-008', 'fair_lending',        'FCF-APP-NCINO|FCF-APP-DATABRICKS',       'at_risk',   'CFPB',          'Chief Compliance Officer','2026-04-20',2,'CFPB: commercial credit model explainability gaps; bias testing in progress; nCino mapping incomplete.'],
];

write('family-6-governance-ai-evidence/F16_security-risk-compliance.csv', csv(
  ['control_id','control_area','system_id','status','regulation','owner_role','last_audit_date','finding_count','notes'],
  controls.map(([control_id, control_area, system_id, status, regulation, owner_role, last_audit_date, finding_count, notes]) =>
    ({ control_id, control_area, system_id, status, regulation, owner_role, last_audit_date, finding_count, notes }))
));

// D17 — AI & Automation Footprint
const aiTools = [
  ['FCF-AI-001', 'M365 Copilot',             'Microsoft',   'CIO',                     'productivity',     'enterprise',       1200, 2800000,  'approved',     'internal',              'pii_confidential', false, 'Developer and ops productivity; expanding to 3,000 seats.'],
  ['FCF-AI-002', 'GitHub Copilot',            'GitHub/MSFT', 'CIO',                     'code_generation',  'engineering',       980, 1200000,  'approved',     'internal',              'confidential',     false, '28% code-completion time reduction on controlled rollout.'],
  ['FCF-AI-003', 'Databricks Mosaic AI',      'Databricks',  'Chief Data Officer',      'ml_platform',      'fraud/credit',      160,  980000,  'conditional',  'internal_masked',       'restricted',       true,  'MRM approval required before production scoring; fraud graph approved.'],
  ['FCF-AI-004', 'Snowflake Cortex',          'Snowflake',   'Chief Data Officer',      'data_analytics',   'analytics',         380,  420000,  'conditional',  'aggregate_masked',      'confidential',     false, 'Restricted to masked or aggregate data per Snowflake AI policy.'],
  ['FCF-AI-005', 'NICE X-Sight AI',           'NICE',        'Chief Risk Officer',      'aml_triage',       'aml_compliance',    420, 1800000,  'conditional',  'internal_restricted',   'restricted',       true,  'SR 11-7 validation pending; cannot scale AML triage until evidence complete.'],
  ['FCF-AI-006', 'Salesforce Einstein',       'Salesforce',  'Chief Digital Officer',   'crm_ai',           'wealth/retail',     840,  640000,  'conditional',  'internal',              'pii_confidential', false, 'Einstein features require written AI usage approval per Salesforce contract.'],
  ['FCF-AI-007', 'ServiceNow Now Assist',     'ServiceNow',  'CIO',                     'itsm_ai',          'technology',       1200,  380000,  'approved',     'internal',              'confidential',     false, 'IT service management assist; approved for internal confidential data.'],
  ['FCF-AI-008', 'SAS Viya AI',              'SAS',         'Chief Model Risk Officer','model_risk',       'model_validation',  95,  620000,  'approved',     'internal_restricted',   'restricted',       true,  'SR 11-7 compliant model risk platform; validated for regulatory submission.'],
  ['FCF-AI-009', 'Pega GenAI Blueprint',      'Pega',        'COO',                     'process_ai',       'operations',        420,  280000,  'conditional',  'internal',              'confidential',     false, 'Loan operations case automation; approval in progress.'],
  ['FCF-AI-010', 'AWS Bedrock (sandbox)',     'AWS',         'Chief Data Officer',      'llm_sandbox',      'data',              35,   90000,  'pilot',        'synthetic_only',        'internal',         false, 'Sandbox only; no client data; approved for synthetic scenario testing.'],
];

write('family-6-governance-ai-evidence/F17_ai-automation-footprint.csv', csv(
  ['tool_id','tool_name','vendor','owner_role','workflow','use_case','active_users','monthly_spend_usd','approval_status','approved_data_scope','data_class','regulated_workflow_flag','notes'],
  aiTools.map(([tool_id, tool_name, vendor, owner_role, workflow, use_case, active_users, monthly_spend_usd, approval_status, approved_data_scope, data_class, regulated_workflow_flag, notes]) =>
    ({ tool_id, tool_name, vendor, owner_role, workflow, use_case, active_users, monthly_spend_usd, approval_status, approved_data_scope, data_class, regulated_workflow_flag, notes }))
));

// ════════════════════════════════════════════════════════════════════════════
// DIMENSION 19 — Personas & Workforce
// ════════════════════════════════════════════════════════════════════════════

const personas = [
  ['FCF-PERS-001', 'Branch Banker',                  'FCF-BF-RETAIL',   'FCF-CAP-02', 'TEAM-FCF-BRANCH',  3200, 'FCF-APP-FIS-HORIZON|FCF-APP-SALESFORCE-FSC', 8,   38, 100, 4.8, 4.2, 'assisted', 'Teller + universal banker hybrid; primary deposit and consumer onboarding workflow.'],
  ['FCF-PERS-002', 'Commercial Credit Analyst',      'FCF-BF-COMMBK',  'FCF-CAP-04', 'TEAM-FCF-COMMLEND',280, 'FCF-APP-NCINO|FCF-APP-SAP-ECC',            22,  12, 60,  23,  21,  'piloting', '23-day credit cycle; AI credit memo pilot with 8 analysts showing 2-day improvement.'],
  ['FCF-PERS-003', 'AML / Financial Crimes Analyst', 'FCF-BF-RISK',    'FCF-CAP-06', 'TEAM-FCF-RISK',    420, 'FCF-APP-NICE-ACTIMIZE|FCF-APP-FENERGO-KYC',35,  8,  55,  28,  26,  'piloting', 'Alert-to-SAR pipeline; 89% false positive rate; AI triage reduces review queue.'],
  ['FCF-PERS-004', 'Contact Center Representative',  'FCF-BF-OPS',     'FCF-CAP-12', 'TEAM-FCF-CONTACT', 850, 'FCF-APP-PEGA-CASE|FCF-APP-SALESFORCE-FSC',  12,  5,  20,  8.2, 8.1, 'none',     'Sentiment AI kill-candidate; handle time unchanged; CSAT scores did not improve.'],
  ['FCF-PERS-005', 'Treasury / ALM Analyst',         'FCF-BF-TREASURY','FCF-CAP-09', 'TEAM-FCF-PAYMENTS',180, 'FCF-APP-MUREX-TREASURY|FCF-APP-SNOWFLAKE',  5,   28, 80,  null,null,'none',     'Murex + Snowflake; FRTB evidence review blocks AI augmentation of stress scenarios.'],
  ['FCF-PERS-006', 'Finance Analyst / Controller',   'FCF-BF-FINANCE', 'FCF-CAP-10', 'TEAM-FCF-ERP',     340, 'FCF-APP-SAP-ECC|FCF-APP-WORKDAY-HCM',      18,  6,  45,  null,null,'piloting', 'M365 Copilot for GL close narratives; early productivity signals positive.'],
  ['FCF-PERS-007', 'Software Engineer',              'FCF-BF-TECH',    'FCF-CAP-14', 'TEAM-FCF-DEVEX',   980, 'FCF-APP-SERVICENOW|FCF-APP-DATABRICKS',    62,  0,  100, 100, 128, 'active',   'GitHub Copilot + M365 Copilot; 28% code-completion velocity improvement measured.'],
  ['FCF-PERS-008', 'Model Risk / Validation Analyst','FCF-BF-RISK',    'FCF-CAP-07', 'TEAM-FCF-MRM',     95,  'FCF-APP-DATABRICKS|FCF-APP-SERVICENOW',    8,   32, 75,  18,  14,  'active',   'SAS Viya + Databricks; evidence automation cutting validation cycle from 18 to 14 days.'],
  ['FCF-PERS-009', 'Wealth Advisor',                 'FCF-BF-WEALTH',  'FCF-CAP-08', 'TEAM-FCF-WEALTH',  480, 'FCF-APP-SALESFORCE-FSC|FCF-APP-BROADRIDGE', 4,   3,  25,  null,null,'halted',   'Copilot shadow pilot halted; FINRA supervision gap; client-note data path unapproved.'],
  ['FCF-PERS-010', 'Mortgage Loan Officer',           'FCF-BF-RETAIL',  'FCF-CAP-03', 'TEAM-FCF-CORE',    320, 'FCF-APP-FIS-HORIZON|FCF-APP-MOBILE-BANKING', 7, 4,  30,  18,  14,  'piloting', 'Document intelligence pilot reducing underwriting cycle 4 days; MRM validation in progress.'],
  ['FCF-PERS-011', 'Data Analyst / Data Scientist',  'FCF-BF-TECH',    'FCF-CAP-13', 'TEAM-FCF-DATA',    380, 'FCF-APP-SNOWFLAKE|FCF-APP-DATABRICKS',     72,  0,  100, null,null,'active',   'Snowflake Cortex + Databricks Mosaic; 72% use Cortex AI; Mosaic conditional approval.'],
  ['FCF-PERS-012', 'Branch ATM Operations Tech',     'FCF-BF-RETAIL',  'FCF-CAP-02', 'TEAM-FCF-BRANCH',  140, 'FCF-APP-FIS-HORIZON|FCF-APP-SERVICENOW',   0,   0,  0,   null,null,'none',     'Field ATM and branch hardware maintenance; no AI tools approved or piloted.'],
];

write('D19-personas-workforce/D19_personas-workforce.csv', csv(
  ['persona_id','persona_name','business_function','primary_capability','it_owner_team','head_count','primary_tools','ai_adoption_pct','time_on_ai_tasks_pct','ai_eligible_work_pct','baseline_throughput','current_throughput','ai_status','notes'],
  personas.map(([persona_id, persona_name, business_function, primary_capability, it_owner_team, head_count, primary_tools, ai_adoption_pct, time_on_ai_tasks_pct, ai_eligible_work_pct, baseline_throughput, current_throughput, ai_status, notes]) =>
    ({ persona_id, persona_name, business_function, primary_capability, it_owner_team, head_count, primary_tools, ai_adoption_pct, time_on_ai_tasks_pct, ai_eligible_work_pct, baseline_throughput, current_throughput, ai_status, notes }))
));

// ════════════════════════════════════════════════════════════════════════════
// CONTEXT RELATIONSHIP GRAPH
// The canonical edge table. Every entity in the 19 dimensions connects here.
// Relationship types: SUPPORTS, GOVERNED_BY, DEPENDS_ON, TARGETS, MEASURED_BY,
//                     USES, SERVES, PROVES, BELONGS_TO, INTEGRATES_WITH
// ════════════════════════════════════════════════════════════════════════════

const relationships = [
  // System → SUPPORTS → Capability
  ...sysFuncMapping.map(([mapping_id, app_id, capability_id, support_type]) => ({
    relationship_key: `REL-${mapping_id}`,
    relationship_type: 'SUPPORTS',
    from_record_type: 'application',
    from_record_key: app_id,
    to_record_type: 'capability',
    to_record_key: capability_id,
    properties: JSON.stringify({ support_type }),
    source_system: 'system-function-mapping',
    source_file: 'F06_system-function-mapping.csv',
  })),

  // System → GOVERNED_BY → Vendor Contract
  ...vendors.filter(v => v[2]).map(([vendor_id, vendor_name, primary_system_id]) => ({
    relationship_key: `REL-SYSVC-${vendor_id}`,
    relationship_type: 'GOVERNED_BY',
    from_record_type: 'application',
    from_record_key: primary_system_id,
    to_record_type: 'vendor_contract',
    to_record_key: vendor_id,
    properties: JSON.stringify({}),
    source_system: 'vendors-contracts',
    source_file: 'F11_vendors-contracts-licenses.csv',
  })),

  // Integration → INTEGRATES_WITH edges (app-to-app)
  ...integrations.map(([edge_id, source_app_id, target_app_id, integration_type]) => ({
    relationship_key: `REL-${edge_id}`,
    relationship_type: 'INTEGRATES_WITH',
    from_record_type: 'application',
    from_record_key: source_app_id,
    to_record_type: 'application',
    to_record_key: target_app_id,
    properties: JSON.stringify({ integration_type }),
    source_system: 'integrations',
    source_file: 'F10_integrations-interfaces.csv',
  })),

  // Initiative → TARGETS → Capability/Function
  ...initiatives.filter(i => i[4]).map(([initiative_id, , , , business_function]) => ({
    relationship_key: `REL-INIT-BF-${initiative_id}`,
    relationship_type: 'TARGETS',
    from_record_type: 'initiative',
    from_record_key: initiative_id,
    to_record_type: 'business_function',
    to_record_key: business_function,
    properties: JSON.stringify({}),
    source_system: 'initiatives',
    source_file: 'F13_initiatives-portfolio.csv',
  })),

  // Initiative → DEPENDS_ON → System
  ...initiatives.flatMap(([initiative_id, , , , , , , , , linked_app_ids]) =>
    (linked_app_ids || '').split('|').filter(Boolean).map(app_id => ({
      relationship_key: `REL-INIT-APP-${initiative_id}-${app_id}`,
      relationship_type: 'DEPENDS_ON',
      from_record_type: 'initiative',
      from_record_key: initiative_id,
      to_record_type: 'application',
      to_record_key: app_id,
      properties: JSON.stringify({}),
      source_system: 'initiatives',
      source_file: 'F13_initiatives-portfolio.csv',
    }))
  ),

  // Initiative → MEASURED_BY → KPI
  ...initiatives.filter(i => i[10]).map(([initiative_id, , , , , , , , , , kpi_id]) => ({
    relationship_key: `REL-INIT-KPI-${initiative_id}`,
    relationship_type: 'MEASURED_BY',
    from_record_type: 'initiative',
    from_record_key: initiative_id,
    to_record_type: 'kpi',
    to_record_key: kpi_id,
    properties: JSON.stringify({}),
    source_system: 'initiatives',
    source_file: 'F13_initiatives-portfolio.csv',
  })),

  // KPI → PROVES → Initiative (reverse for retrieval)
  ...kpis.filter(k => k[3]).map(([kpi_id, , , initiative_id, , current_value, target_value, , , confidence]) => ({
    relationship_key: `REL-KPI-PROVES-${kpi_id}`,
    relationship_type: 'PROVES',
    from_record_type: 'kpi',
    from_record_key: kpi_id,
    to_record_type: 'initiative',
    to_record_key: initiative_id,
    properties: JSON.stringify({ current_value, target_value, confidence }),
    source_system: 'kpis',
    source_file: 'F15_kpis-outcome-evidence.csv',
  })),

  // Persona → USES → AI Tool
  ...personas.flatMap(([persona_id, , , , , , primary_tools, , , , , , ai_status]) =>
    primary_tools.split('|').map(tool_key => {
      const aiTool = aiTools.find(t => t[0] && namedApps.find(a => a[0] === tool_key));
      return {
        relationship_key: `REL-PERS-TOOL-${persona_id}-${tool_key.replace(/-/g, '_')}`,
        relationship_type: 'USES',
        from_record_type: 'persona',
        from_record_key: persona_id,
        to_record_type: 'application',
        to_record_key: tool_key,
        properties: JSON.stringify({ ai_status }),
        source_system: 'personas',
        source_file: 'D19_personas-workforce.csv',
      };
    })
  ),

  // AI Tool → SERVES → Persona
  { relationship_key: 'REL-AITOOL-SERVES-001', relationship_type: 'SERVES', from_record_type: 'ai_tool', from_record_key: 'FCF-AI-005', to_record_type: 'persona', to_record_key: 'FCF-PERS-003', properties: '{"description":"AML triage agent resolves case priority for AML analysts"}', source_system: 'ai-footprint', source_file: 'F17_ai-automation-footprint.csv' },
  { relationship_key: 'REL-AITOOL-SERVES-002', relationship_type: 'SERVES', from_record_type: 'ai_tool', from_record_key: 'FCF-AI-002', to_record_type: 'persona', to_record_key: 'FCF-PERS-007', properties: '{"description":"GitHub Copilot serves software engineers for code generation"}', source_system: 'ai-footprint', source_file: 'F17_ai-automation-footprint.csv' },
  { relationship_key: 'REL-AITOOL-SERVES-003', relationship_type: 'SERVES', from_record_type: 'ai_tool', from_record_key: 'FCF-AI-003', to_record_type: 'persona', to_record_key: 'FCF-PERS-011', properties: '{"description":"Databricks Mosaic AI serves data scientists for fraud and credit models"}', source_system: 'ai-footprint', source_file: 'F17_ai-automation-footprint.csv' },
  { relationship_key: 'REL-AITOOL-SERVES-004', relationship_type: 'SERVES', from_record_type: 'ai_tool', from_record_key: 'FCF-AI-008', to_record_type: 'persona', to_record_key: 'FCF-PERS-008', properties: '{"description":"SAS Viya serves model risk analysts for SR 11-7 validation"}', source_system: 'ai-footprint', source_file: 'F17_ai-automation-footprint.csv' },

  // Control → GOVERNS → System
  ...controls.flatMap(([control_id, , system_id]) =>
    (system_id || '').split('|').filter(Boolean).map(app_id => ({
      relationship_key: `REL-CTRL-SYS-${control_id}-${app_id}`,
      relationship_type: 'GOVERNS',
      from_record_type: 'control',
      from_record_key: control_id,
      to_record_type: 'application',
      to_record_key: app_id,
      properties: JSON.stringify({}),
      source_system: 'controls',
      source_file: 'F16_security-risk-compliance.csv',
    }))
  ),

  // System → BELONGS_TO → IT Team
  ...namedApps.map(([app_id, , , , it_owner_team]) => ({
    relationship_key: `REL-APP-TEAM-${app_id}`,
    relationship_type: 'BELONGS_TO',
    from_record_type: 'application',
    from_record_key: app_id,
    to_record_type: 'it_team',
    to_record_key: it_owner_team,
    properties: JSON.stringify({}),
    source_system: 'applications',
    source_file: 'F05_applications-systems.csv',
  })),
];

write('graph/context-relationships.jsonl', jsonl(relationships));

// ════════════════════════════════════════════════════════════════════════════
// MANIFEST
// ════════════════════════════════════════════════════════════════════════════

write('manifest.yaml', `\
tenant_key: ${TENANT_KEY}
client_id: ${CLIENT_ID}
dataset_version: v2
generated_at: ${GENERATED_AT}
industry: financial_services
sub_industry: regional_commercial_bank
model_version: 6-family-19-dimension-v1

load_order:
  - order: 1
    family: enterprise_operating_model
    dimension: enterprise_profile
    file: family-1-enterprise-operating-model/F01_enterprise-profile.yaml
    template_id: enterprise-profile
  - order: 2
    family: enterprise_operating_model
    dimension: business_org_functions
    file: family-1-enterprise-operating-model/F02_business-org-functions.csv
    template_id: business-org-functions
  - order: 2
    family: enterprise_operating_model
    dimension: it_org_ownership
    file: family-1-enterprise-operating-model/F03_it-org-ownership.csv
    template_id: it-org-ownership
  - order: 2
    family: personas_workforce
    dimension: personas_workforce
    file: D19-personas-workforce/D19_personas-workforce.csv
    template_id: personas-workforce
  - order: 3
    family: enterprise_operating_model
    dimension: capabilities_value_streams
    file: family-1-enterprise-operating-model/F04_capabilities-value-streams.csv
    template_id: capabilities-value-streams
  - order: 4
    family: technology_estate
    dimension: applications_systems
    file: family-2-technology-estate/F05_applications-systems.csv
    template_id: applications-systems
  - order: 4
    family: technology_estate
    dimension: system_function_mapping
    file: family-2-technology-estate/F06_system-function-mapping.csv
    template_id: system-function-mapping
  - order: 4
    family: technology_estate
    dimension: infrastructure_cloud
    file: family-2-technology-estate/F07_infrastructure-cloud.csv
    template_id: infrastructure-cloud
  - order: 4
    family: technology_estate
    dimension: platform_volumetrics
    file: family-2-technology-estate/F08_platform-volumetrics.csv
    template_id: platform-volumetrics
  - order: 5
    family: data_connectivity
    dimension: data_analytics_estate
    file: family-3-data-connectivity/F09_data-analytics-estate.csv
    template_id: data-analytics-estate
  - order: 5
    family: data_connectivity
    dimension: integrations_interfaces
    file: family-3-data-connectivity/F10_integrations-interfaces.csv
    template_id: integrations-interfaces
  - order: 6
    family: financial_commercial
    dimension: vendors_contracts_licenses
    file: family-4-financial-commercial/F11_vendors-contracts-licenses.csv
    template_id: vendors-contracts-licenses
  - order: 6
    family: financial_commercial
    dimension: it_budget_financials
    file: family-4-financial-commercial/F12_it-budget-financials.csv
    template_id: it-budget-financials
  - order: 7
    family: execution_operations
    dimension: initiatives_portfolio
    file: family-5-execution-operations/F13_initiatives-portfolio.csv
    template_id: initiatives-portfolio
  - order: 8
    family: execution_operations
    dimension: operations_service_management
    file: family-5-execution-operations/F14_operations-service-management.csv
    template_id: operations-service-management
  - order: 8
    family: execution_operations
    dimension: kpis_outcome_evidence
    file: family-5-execution-operations/F15_kpis-outcome-evidence.csv
    template_id: kpis-outcome-evidence
  - order: 9
    family: governance_ai_evidence
    dimension: security_risk_compliance
    file: family-6-governance-ai-evidence/F16_security-risk-compliance.csv
    template_id: security-risk-compliance
  - order: 9
    family: governance_ai_evidence
    dimension: ai_automation_footprint
    file: family-6-governance-ai-evidence/F17_ai-automation-footprint.csv
    template_id: ai-automation-footprint
  - order: 10
    type: relationship_graph
    file: graph/context-relationships.jsonl
    description: Context graph edges — must load after all entity dimensions

summary:
  families: 6
  dimensions: 19
  total_segments: 19
  relationship_edges_approx: ${relationships.length}
`);

// ════════════════════════════════════════════════════════════════════════════
// VERIFICATION
// ════════════════════════════════════════════════════════════════════════════

const goldenQuestions = [
  {
    id: 'FCF-GQ-001',
    question: 'Which AI initiatives should we kill, and why?',
    must_cite: ['FCF-INIT-007', 'FCF-INIT-008', 'FCF-INIT-009'],
    must_answer: 'Branch Vision AI, Contact Center Sentiment AI, and Wealth Advisor Copilot — all three have no verified value and unresolved governance gaps.',
  },
  {
    id: 'FCF-GQ-002',
    question: 'What evidence backs the Fraud Graph v2 value case?',
    must_cite: ['FCF-INIT-004', 'FCF-KPI-001'],
    must_answer: '$28.6M fraud loss avoidance verified; engaged sponsor; high spend justified by evidence.',
  },
  {
    id: 'FCF-GQ-003',
    question: 'What blocks scaling AML triage automation?',
    must_cite: ['FCF-INIT-002', 'FCF-CTRL-003', 'FCF-AI-005'],
    must_answer: 'SR 11-7 model validation evidence incomplete; 12 production AI models lack refreshed validation.',
  },
  {
    id: 'FCF-GQ-004',
    question: 'Show me all AI tools that serve the AML analyst persona and their governance status.',
    must_cite: ['FCF-PERS-003', 'FCF-AI-005', 'FCF-CTRL-003'],
    must_answer: 'NICE X-Sight AI serves AML analysts; conditional approval; SR 11-7 validation pending.',
  },
  {
    id: 'FCF-GQ-005',
    question: 'Which vendor contracts renew within 90 days with no peer benchmark?',
    must_cite: ['FCF-VEND-002', 'FCF-VEND-004', 'FCF-VEND-008', 'FCF-VEND-009'],
    must_answer: 'DXC (Nov-30), Deloitte (Aug-31), ACI Worldwide (Oct-31), Snowflake (Jul-31) — all lack benchmark_present flag.',
  },
  {
    id: 'FCF-GQ-006',
    question: 'Which systems support Risk & Compliance and what is their governance status?',
    must_cite: ['FCF-APP-NICE-ACTIMIZE', 'FCF-APP-FENERGO-KYC', 'FCF-APP-DATABRICKS', 'FCF-CTRL-003'],
    must_answer: 'NICE Actimize + Fenergo support AML/KYC; Databricks supports credit/fraud. SR 11-7 finding covers Databricks and NICE Actimize.',
  },
  {
    id: 'FCF-GQ-007',
    question: 'What is the productivity impact of AI on software engineers at First Capital?',
    must_cite: ['FCF-PERS-007', 'FCF-AI-002', 'FCF-KPI-006'],
    must_answer: '28% code-completion velocity improvement; GitHub Copilot on 980 engineer seats; index 100 → 128 vs 160 target.',
  },
];

write('99-verification/expected-row-counts.json', {
  client_id: CLIENT_ID,
  tenant_key: TENANT_KEY,
  generated_at: GENERATED_AT,
  business_functions: businessFunctions.length,
  it_teams: itTeams.length,
  capabilities: capabilities.length,
  applications: namedApps.length,
  system_function_mappings: sysFuncMapping.length,
  infrastructure_resources: infraResources.length,
  data_products: dataProducts.length,
  integrations: integrations.length,
  vendors: vendors.length,
  budget_lines: budgetLines.length,
  initiatives: initiatives.length,
  incidents: incidents.length,
  kpis: kpis.length,
  controls: controls.length,
  ai_tools: aiTools.length,
  personas: personas.length,
  relationship_edges: relationships.length,
});

write('99-verification/golden-questions.json', goldenQuestions);

console.log(`\n✓ First Capital Financial V2 substrate generated at ${ROOT}`);
console.log(`  Model: 6 families · 19 dimensions · ${relationships.length} relationship edges`);
console.log(`  Personas: ${personas.length} · AI tools: ${aiTools.length} · KPIs: ${kpis.length}`);
console.log(`  Initiatives: ${initiatives.length} · Applications: ${namedApps.length} · Vendors: ${vendors.length}`);
console.log(`  Golden questions: ${goldenQuestions.length}\n`);

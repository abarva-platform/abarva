#!/usr/bin/env node
/**
 * Generates the First Capital Financial substrate pack.
 *
 * This is deliberately deterministic: rerunning the script rewrites the same
 * files and row IDs so loader/idempotency tests can rely on stable fixtures.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ROOT = path.join(REPO_ROOT, 'datasets/first-capital-financial-synthetic-v1');

const CLIENT_ID = 'a75687bf-71b9-4524-ab4e-68ae3f28d200';
const TENANT_KEY = 'first-capital';
const GENERATED_AT = '2026-05-26T00:00:00Z';

const dirs = [
  '00-profile',
  '01-portfolio',
  '02-financial',
  '03-org',
  '04-vendors',
  '05-dora',
  '06-devex',
  '07-ai-tools',
  '08-sponsor-signal',
  '10-incidents-changes',
  '11-regulatory',
  '12-benchmarks',
  '13-context/source-files',
  '99-verification',
];

for (const dir of dirs) fs.mkdirSync(path.join(ROOT, dir), { recursive: true });

function write(rel, content) {
  fs.writeFileSync(path.join(ROOT, rel), content.endsWith('\n') ? content : `${content}\n`, 'utf8');
}

function csvEscape(value) {
  const s = value == null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

function csv(headers, rows) {
  return [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => csvEscape(row[h])).join(',')),
  ].join('\n');
}

function jsonl(rows) {
  return rows.map((row) => JSON.stringify(row)).join('\n');
}

const teams = [
  ['TEAM-FCF-CORE', 'Core Banking Platforms', 'EVP Technology Operations', 'core banking'],
  ['TEAM-FCF-PAYMENTS', 'Payments and Treasury Services', 'SVP Payments Technology', 'payments'],
  ['TEAM-FCF-DIGITAL', 'Digital Banking and Client Experience', 'Chief Digital Officer', 'digital'],
  ['TEAM-FCF-COMMLEND', 'Commercial Lending Technology', 'SVP Commercial Bank CIO', 'lending'],
  ['TEAM-FCF-WEALTH', 'Wealth and Private Bank Technology', 'SVP Wealth Technology', 'wealth'],
  ['TEAM-FCF-RISK', 'Risk, Compliance and Financial Crimes', 'Chief Risk Officer', 'risk'],
  ['TEAM-FCF-DATA', 'Enterprise Data and AI', 'Chief Data and Analytics Officer', 'data'],
  ['TEAM-FCF-CLOUD', 'Cloud Platform Engineering', 'SVP Infrastructure', 'cloud'],
  ['TEAM-FCF-CYBER', 'Cybersecurity and IAM', 'CISO', 'security'],
  ['TEAM-FCF-ERP', 'Finance ERP and Procurement Systems', 'CFO', 'erp'],
  ['TEAM-FCF-BRANCH', 'Branch and ATM Technology', 'SVP Retail Bank Ops', 'branch'],
  ['TEAM-FCF-CONTACT', 'Contact Center and Servicing', 'SVP Client Service', 'servicing'],
  ['TEAM-FCF-MRM', 'Model Risk and Validation', 'Chief Model Risk Officer', 'model risk'],
  ['TEAM-FCF-OPS', 'Deposit and Loan Operations', 'COO', 'operations'],
  ['TEAM-FCF-OPENBANK', 'Open Banking and API Products', 'Chief Product Officer', 'api'],
  ['TEAM-FCF-TREASURY', 'Corporate Treasury Technology', 'Treasurer', 'treasury'],
  ['TEAM-FCF-MORTGAGE', 'Mortgage and Consumer Lending', 'SVP Consumer Lending CIO', 'mortgage'],
  ['TEAM-FCF-CARDS', 'Cards and Rewards Technology', 'SVP Cards', 'cards'],
  ['TEAM-FCF-DEVEX', 'Engineering Productivity Office', 'CIO', 'devex'],
  ['TEAM-FCF-ITSM', 'ITSM, Observability and SRE', 'VP Technology Service Mgmt', 'itsm'],
  ['TEAM-FCF-REG', 'Regulatory Remediation PMO', 'Chief Compliance Officer', 'regulatory'],
  ['TEAM-FCF-VENDOR', 'Vendor and Sourcing Technology', 'Chief Procurement Officer', 'procurement'],
];

const namedApps = [
  ['FCF-APP-FIS-HORIZON', 'FIS Horizon Core Deposits', 'FIS', 'core banking', 'COO', 'TEAM-FCF-CORE', 'mainframe', 'maintain', 'critical', 18500000, 'pci_pii_confidential', 142, 0.22, 'Primary deposit system of record; core future decision pending.'],
  ['FCF-APP-HOGAN-LOANS', 'Hogan Commercial Loan Servicing', 'DXC/FIS', 'commercial lending', 'SVP Commercial Bank CIO', 'TEAM-FCF-COMMLEND', 'mainframe', 'migrate', 'critical', 12400000, 'confidential', 96, 0.18, 'COBOL customizations block straight-through commercial servicing.'],
  ['FCF-APP-FEDWIRE-ACH', 'ACH and Wire Payments Hub', 'ACI Worldwide', 'payments', 'SVP Payments Technology', 'TEAM-FCF-PAYMENTS', 'hybrid', 'invest', 'critical', 9200000, 'pci_confidential', 118, 0.45, 'FedNow/RTP readiness depends on message broker and sanction-screening integration.'],
  ['FCF-APP-FEDNOW-RTP', 'FedNow and RTP Gateway', 'The Clearing House', 'payments', 'SVP Payments Technology', 'TEAM-FCF-PAYMENTS', 'cloud', 'invest', 'critical', 6400000, 'pci_confidential', 62, 0.68, 'Board-visible instant-payments initiative; commercial deposits at risk without delivery.'],
  ['FCF-APP-SALESFORCE-FSC', 'Salesforce Financial Services Cloud', 'Salesforce', 'crm', 'Chief Digital Officer', 'TEAM-FCF-DIGITAL', 'saas', 'invest', 'critical', 7200000, 'pii_confidential', 80, 0.71, 'Retail and wealth relationship platform with fragmented adoption.'],
  ['FCF-APP-NCINO', 'nCino Commercial Loan Origination', 'nCino', 'commercial lending', 'SVP Commercial Bank CIO', 'TEAM-FCF-COMMLEND', 'saas', 'invest', 'critical', 8700000, 'confidential', 75, 0.63, 'Commercial lending workflow anchor; integration debt drives manual credit memos.'],
  ['FCF-APP-NICE-ACTIMIZE', 'NICE Actimize AML and Fraud', 'NICE', 'financial crimes', 'Chief Risk Officer', 'TEAM-FCF-RISK', 'hybrid', 'invest', 'critical', 11200000, 'restricted', 104, 0.56, 'AML case volume is high; model-risk evidence needed before AI triage scale.'],
  ['FCF-APP-FENERGO-KYC', 'Fenergo Client Lifecycle Management', 'Fenergo', 'kyc', 'Chief Compliance Officer', 'TEAM-FCF-RISK', 'saas', 'restructure', 'critical', 6600000, 'restricted', 61, 0.58, 'KYC refresh backlog and beneficial ownership data gaps remain.'],
  ['FCF-APP-MUREX-TREASURY', 'Murex Treasury and Liquidity', 'Murex', 'treasury', 'Treasurer', 'TEAM-FCF-TREASURY', 'on_prem', 'maintain', 'critical', 8100000, 'confidential', 72, 0.34, 'Treasury stress reporting and liquidity forecasting platform.'],
  ['FCF-APP-SAP-ECC', 'SAP ECC Finance and Procurement', 'SAP', 'erp finance', 'CFO', 'TEAM-FCF-ERP', 'on_prem', 'migrate', 'critical', 10300000, 'confidential', 88, 0.31, 'SAP ECC 6.0 finance core; S/4HANA vs RISE vs Oracle decision not resolved.'],
  ['FCF-APP-ORACLE-EBS-REMNANTS', 'Oracle EBS Legacy AP Remnants', 'Oracle', 'erp finance', 'CFO', 'TEAM-FCF-ERP', 'on_prem', 'retire', 'high', 1800000, 'confidential', 31, 0.20, 'Residual AP workflows after SAP migration; audit controls still depend on extracts.'],
  ['FCF-APP-WORKDAY-HCM', 'Workday HCM and Payroll', 'Workday', 'hr', 'CHRO', 'TEAM-FCF-ERP', 'saas', 'maintain', 'high', 5100000, 'pii_confidential', 43, 0.49, 'HCM and payroll platform.'],
  ['FCF-APP-SNOWFLAKE', 'Snowflake Financial Data Cloud', 'Snowflake', 'data platform', 'Chief Data and Analytics Officer', 'TEAM-FCF-DATA', 'cloud', 'invest', 'critical', 7400000, 'confidential', 117, 0.78, 'Enterprise data platform for finance, risk and digital analytics.'],
  ['FCF-APP-DATABRICKS', 'Databricks AI and Feature Platform', 'Databricks', 'ai platform', 'Chief Data and Analytics Officer', 'TEAM-FCF-DATA', 'cloud', 'invest', 'high', 5900000, 'restricted', 66, 0.82, 'Fraud graph and document intelligence workloads.'],
  ['FCF-APP-MOBILE-BANKING', 'Mobile Banking App', 'Internal', 'digital banking', 'Chief Digital Officer', 'TEAM-FCF-DIGITAL', 'cloud', 'invest', 'critical', 9300000, 'pii_confidential', 91, 0.76, 'Mobile rating is below peers; authentication and onboarding friction persist.'],
  ['FCF-APP-ONLINE-ACCOUNT-OPENING', 'Digital Account Opening', 'Blend/Internal', 'digital banking', 'Chief Digital Officer', 'TEAM-FCF-DIGITAL', 'hybrid', 'restructure', 'critical', 4300000, 'pii_confidential', 70, 0.70, 'Abandonment elevated; KYC and funding handoff is brittle.'],
  ['FCF-APP-PEGA-CASE', 'Pega Operations Case Management', 'Pega', 'operations', 'COO', 'TEAM-FCF-OPS', 'hybrid', 'maintain', 'high', 4700000, 'confidential', 53, 0.52, 'Deposit operations case backbone.'],
  ['FCF-APP-SERVICENOW', 'ServiceNow ITSM and GRC', 'ServiceNow', 'itsm grc', 'CIO', 'TEAM-FCF-ITSM', 'saas', 'invest', 'high', 6800000, 'confidential', 74, 0.64, 'ITSM, CMDB, GRC evidence store.'],
  ['FCF-APP-SPLUNK', 'Splunk Enterprise Security', 'Splunk', 'security', 'CISO', 'TEAM-FCF-CYBER', 'hybrid', 'maintain', 'critical', 6100000, 'restricted', 69, 0.44, 'SIEM and audit evidence for financial regulators.'],
  ['FCF-APP-CROWDSTRIKE', 'CrowdStrike Falcon', 'CrowdStrike', 'security', 'CISO', 'TEAM-FCF-CYBER', 'saas', 'maintain', 'critical', 3900000, 'restricted', 42, 0.54, 'Endpoint and identity protection.'],
];

const categories = [
  ['core banking', 'FIS', 'TEAM-FCF-CORE', 'mainframe'],
  ['payments', 'ACI Worldwide', 'TEAM-FCF-PAYMENTS', 'hybrid'],
  ['digital banking', 'Internal', 'TEAM-FCF-DIGITAL', 'cloud'],
  ['commercial lending', 'nCino', 'TEAM-FCF-COMMLEND', 'saas'],
  ['wealth', 'Broadridge', 'TEAM-FCF-WEALTH', 'hybrid'],
  ['financial crimes', 'NICE', 'TEAM-FCF-RISK', 'hybrid'],
  ['data platform', 'Snowflake', 'TEAM-FCF-DATA', 'cloud'],
  ['cybersecurity', 'Palo Alto Networks', 'TEAM-FCF-CYBER', 'saas'],
  ['erp finance', 'SAP', 'TEAM-FCF-ERP', 'on_prem'],
  ['branch atm', 'NCR', 'TEAM-FCF-BRANCH', 'on_prem'],
  ['contact center', 'Genesys', 'TEAM-FCF-CONTACT', 'saas'],
  ['model risk', 'SAS', 'TEAM-FCF-MRM', 'on_prem'],
];

const apps = namedApps.map(([app_id, name, vendor, category, business_owner, it_owner, deployment, lifecycle_stage, criticality, run_cost_fy25_usd, primary_dataclass, integration_count, ai_eligibility_score, notes]) => ({
  app_id, name, vendor, category, business_owner, it_owner, deployment, lifecycle_stage, criticality,
  run_cost_fy25_usd, primary_dataclass, integration_count, last_modernization_review: '2026-02-15', ai_eligibility_score, notes,
}));

for (let i = apps.length + 1; i <= 180; i++) {
  const [category, vendor, team, deployment] = categories[(i - 1) % categories.length];
  const criticality = i % 9 === 0 ? 'critical' : i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low';
  const lifecycle = i % 17 === 0 ? 'retire' : i % 11 === 0 ? 'migrate' : i % 7 === 0 ? 'restructure' : i % 5 === 0 ? 'invest' : 'maintain';
  const prefix = category.toUpperCase().replaceAll(' ', '-').replaceAll('_', '-');
  apps.push({
    app_id: `FCF-APP-${prefix}-${String(i).padStart(3, '0')}`,
    name: `First Capital ${category.replace(/\b\w/g, (m) => m.toUpperCase())} Service ${String(i).padStart(3, '0')}`,
    vendor,
    category,
    business_owner: teams.find((t) => t[0] === team)?.[2] ?? 'CIO',
    it_owner: team,
    deployment,
    lifecycle_stage: lifecycle,
    criticality,
    run_cost_fy25_usd: 350000 + ((i * 137000) % 6400000),
    primary_dataclass: category.includes('risk') || category.includes('cyber') ? 'restricted' : category.includes('digital') ? 'pii_confidential' : 'confidential',
    integration_count: 8 + ((i * 7) % 84),
    last_modernization_review: `2026-${String((i % 9) + 1).padStart(2, '0')}-15`,
    ai_eligibility_score: Number((0.18 + ((i * 13) % 72) / 100).toFixed(2)),
    notes: `${category} workload in the First Capital context layer; ${lifecycle} posture with ${vendor} dependency and ${deployment} deployment.`,
  });
}

const initiatives = [
  ['FCF-INIT-BRANCH-VISION-AI', 'Branch queue vision AI pilot', 'active', 'SVP Retail Bank Ops', 'NCR|AWS Rekognition', 1900000, 600000, 'Kill', 'Pilot', 'KILL CANDIDATE: branch pilots show low teller adoption; privacy review unresolved; no verified branch throughput value.'],
  ['FCF-INIT-CONTACT-SENTIMENT-V1', 'Contact center sentiment AI v1', 'active', 'SVP Client Service', 'Genesys|Verint', 2400000, 800000, 'Kill', 'Run', 'KILL CANDIDATE: canned sentiment scores created coaching risk with no call-time reduction.'],
  ['FCF-INIT-WEALTH-COPILOT-SHADOW', 'Wealth advisor copilot shadow rollout', 'active', 'SVP Wealth Technology', 'Microsoft|Salesforce', 3100000, 1700000, 'Kill', 'Pilot', 'KILL CANDIDATE: unapproved client-note data path and FINRA supervision gaps.'],
  ['FCF-INIT-FEDNOW-RTP-MODERNIZATION', 'FedNow and RTP modernization', 'active', 'SVP Payments Technology', 'ACI Worldwide|The Clearing House|FIS', 18600000, 42000000, 'Restructure', 'Build', 'RESTRUCTURE CANDIDATE: commercial-deposit value is real but core API, sanction screening and 24x7 ops gates are unresolved.'],
  ['FCF-INIT-AML-TRIAGE-AI', 'AML case triage automation', 'active', 'Chief Risk Officer', 'NICE|Databricks|Deloitte', 8900000, 21000000, 'Restructure', 'Pilot', 'RESTRUCTURE CANDIDATE: case backlog value clear, but SR 11-7 validation evidence is incomplete.'],
  ['FCF-INIT-CORE-BANKING-FUTURE', 'Core banking future decision', 'active', 'CIO', 'FIS|Thought Machine|Mambu|Accenture', 14000000, 0, 'Hold', 'Scope', 'CONTESTED: CIO wants RFP now; Sentinel should hold until data migration and OCC remediation sequencing are resolved.'],
  ['FCF-INIT-FRAUD-GRAPH-V2', 'Fraud graph analytics v2', 'active', 'Chief Risk Officer', 'Databricks|NICE|Featurespace', 7300000, 28600000, 'Continue', 'Scale', 'FALSE-POSITIVE-DO-NOT-FLAG: high spend but verified fraud-loss avoidance and engaged sponsor.'],
];

const extraInitiatives = [
  'SAP S/4HANA finance future decision',
  'Digital account opening abandonment recovery',
  'Commercial credit memo automation',
  'Treasury liquidity forecast modernization',
  'KYC beneficial ownership refresh',
  'Model inventory evidence automation',
  'M365 Copilot controlled rollout',
  'Cloud exit-risk reduction',
  'ServiceNow CMDB truth remediation',
  'Data lineage for regulatory reports',
  'Debit-card disputes automation',
  'Mortgage document intelligence',
  'Branch appointment and workforce optimization',
  'Open banking developer portal',
  'Vendor AI indemnity clause refresh',
  'IAM privileged access cleanup',
  'SAS model-hosting rationalization',
  'Snowflake cost governance',
  'Client complaint root-cause analytics',
  'Loan operations straight-through processing',
  'Data retention and legal hold automation',
  'Engineering productivity tooling for legacy apps',
  'Payment exceptions workflow modernization',
  'Customer 360 consent and preference hub',
  'Third-party risk scoring automation',
];

for (let i = 0; initiatives.length < 32; i++) {
  const title = extraInitiatives[i % extraInitiatives.length];
  const team = teams[(i + 4) % teams.length];
  const status = 'active';
  const posture = i % 8 === 0 ? 'Watch' : i % 5 === 0 ? 'Restructure' : 'Healthy';
  initiatives.push([
    `FCF-INIT-${String(initiatives.length + 1).padStart(3, '0')}`,
    title,
    status,
    team[2],
    categories[i % categories.length][1],
    1200000 + ((i * 791000) % 13800000),
    2500000 + ((i * 1490000) % 32000000),
    posture,
    ['Scope', 'Pilot', 'Build', 'Scale', 'Run'][i % 5],
    `${title} is tied to ${team[1]} with ${posture.toLowerCase()} posture and board/CXO evidence requirements.`,
  ]);
}

const closedInitiatives = Array.from({ length: 10 }, (_, i) => ({
  initiative_id: `FCF-CLOSED-${String(i + 1).padStart(3, '0')}`,
  title: [
    'Branch teller desktop consolidation',
    'ACH exception queue triage uplift',
    'Commercial credit memo template standardization',
    'Mortgage document indexing remediation',
    'Treasury intraday liquidity dashboard',
    'Loan operations RPA retirement',
    'Cyber privileged-access recertification',
    'Vendor renewal evidence room pilot',
    'Digital-servicing complaint taxonomy cleanup',
    'Model inventory attestation cycle',
  ][i],
  status: 'closed',
  accountable: teams[i % teams.length][2],
  vendors: categories[i % categories.length][1],
  committed_usd: 900000 + i * 210000,
  projected_value_usd: 1400000 + i * 300000,
  sentinel_posture: i % 2 === 0 ? 'Closed - value verified' : 'Closed - lessons captured',
  stage: 'Closed',
  evidence_note: [
    'Closeout package includes before/after handle-time sample and branch adoption exceptions.',
    'Operations evidence shows the triage model reduced aging over 5 business days but did not eliminate manual sanction-screening review.',
    'Credit policy retained manual override authority; value is limited to memo assembly and reviewer cycle time.',
    'Records management accepted the index remediation after sampling 600 loan files across 3 servicing centers.',
    'Treasury signed off on liquidity dashboard timeliness but left stress-scenario lineage as an open control item.',
    'RPA retirement delivered run-cost savings only after Pega case-routing controls were amended.',
    'Cyber evidence includes recertification completion, privileged group exceptions, and post-cycle remediation owners.',
    'Procurement reused the evidence room pattern for three renewals but did not yet integrate it with ServiceNow GRC.',
    'Complaint taxonomy cleanup improved root-cause coding, with unresolved mapping to Salesforce FSC case types.',
    'Model inventory attestation closed after second-line review, with monitoring evidence deferred to the next quarter.',
  ][i],
}));

const vendorNames = [
  ['FIS', 'core_ams', 38000000, '2027-02-15', 'CIO', 'restricted', 'requires model-risk approval for generated code', '180-day core transition; termination assistance capped at 12 months'],
  ['DXC', 'mainframe_ams', 26000000, '2026-11-30', 'CIO', 'confidential', 'AI tooling allowed only in isolated dev', 'app-by-app removal with 120-day notice'],
  ['Accenture', 'si_advisory', 18000000, '2026-09-30', 'CIO', 'confidential', 'client IP indemnity required', 'statement-of-work termination for convenience'],
  ['Deloitte', 'risk_consulting', 14000000, '2026-08-31', 'CRO', 'restricted', 'no customer data in public LLMs', 'quarterly SOW breakpoints'],
  ['Salesforce', 'saas_crm', 12200000, '2027-01-31', 'CDO', 'pii_confidential', 'Einstein features require opt-in evidence', 'annual volume true-down only'],
  ['NICE', 'financial_crimes', 11200000, '2026-12-31', 'CRO', 'restricted', 'model feature use subject to SR 11-7 evidence', 'module carve-out allowed after 90 days'],
  ['SAP', 'erp_license', 9800000, '2027-05-31', 'CFO', 'confidential', 'Joule disabled pending data policy', 'S/4 transition credit negotiable'],
  ['ACI Worldwide', 'payments_license', 8600000, '2026-10-31', 'SVP Payments', 'restricted', 'AI-generated payment rules prohibited', 'FedNow module removal after stabilization'],
  ['Snowflake', 'data_platform', 7600000, '2026-07-31', 'CDAO', 'confidential', 'Cortex use restricted to masked data', 'committed-use drawdown reset annually'],
  ['Databricks', 'ai_platform', 6400000, '2027-03-31', 'CDAO', 'restricted', 'Mosaic AI use requires MRM approval', 'workspace termination with data export SLA'],
];

const vendors = vendorNames.map(([vendor, type, annual_usd, renewal_date, owner, data_class, ai_usage_clauses, exit_terms]) => ({
  vendor, type, annual_usd, renewal_date, owner, data_class, ai_usage_clauses, exit_terms,
  notes: `${vendor} is a named First Capital concentration-risk vendor for banking, risk, data or ERP operations.`,
}));

const moreVendors = ['Microsoft', 'AWS', 'Google Cloud', 'Oracle', 'Workday', 'ServiceNow', 'Splunk', 'CrowdStrike', 'Palo Alto Networks', 'Okta', 'SailPoint', 'NCR', 'Fiserv', 'Fenergo', 'nCino', 'Murex', 'SAS', 'Pega', 'Broadridge', 'Genesys', 'Verint', 'Twilio', 'Blend', 'Zelle/EWS', 'The Clearing House', 'Visa DPS', 'Mastercard', 'FICO', 'Moody\'s Analytics', 'S&P Global', 'Bloomberg', 'Refinitiv', 'Tableau', 'Looker', 'Informatica', 'Collibra', 'Alation', 'Confluent', 'Red Hat', 'Kyndryl', 'TCS', 'Wipro', 'Infosys', 'EPAM', 'Thought Machine', 'Mambu', 'Q2', 'Temenos', 'Featurespace', 'Feedzai', 'Alloy', 'Plaid', 'Trulioo', 'Socure', 'DocuSign', 'Icertis', 'Coupa', 'Thomson Reuters', 'Wolters Kluwer', 'NVIDIA'];
while (vendors.length < 70) {
  const i = vendors.length;
  const vendor = moreVendors[(i - 10) % moreVendors.length];
  vendors.push({
    vendor,
    type: ['saas', 'license', 'managed_service', 'si_advisory', 'data_feed'][i % 5],
    annual_usd: 450000 + ((i * 677000) % 7200000),
    renewal_date: `202${6 + (i % 2)}-${String((i % 12) + 1).padStart(2, '0')}-15`,
    owner: teams[i % teams.length][2],
    data_class: i % 6 === 0 ? 'restricted' : i % 3 === 0 ? 'pii_confidential' : 'confidential',
    ai_usage_clauses: i % 4 === 0 ? 'AI use requires prior written approval and audit evidence' : 'standard data-processing and confidentiality restrictions',
    exit_terms: i % 5 === 0 ? '90-day module removal with transition support' : 'standard annual renewal notice',
    notes: `${vendor} supports ${categories[i % categories.length][0]} capabilities; included for concentration, renewal and AI-clause reasoning.`,
  });
}

const edges = Array.from({ length: 380 }, (_, i) => {
  const from = apps[i % apps.length].app_id;
  const to = apps[(i * 7 + 13) % apps.length].app_id;
  return {
    edge_id: `FCF-EDGE-${String(i + 1).padStart(3, '0')}`,
    from_app_id: from,
    to_app_id: to === from ? apps[(i + 1) % apps.length].app_id : to,
    integration_type: ['batch_file', 'api', 'mq', 'sftp', 'database_replication', 'event_stream'][i % 6],
    criticality: i % 8 === 0 ? 'critical' : i % 3 === 0 ? 'high' : 'medium',
    data_class: i % 5 === 0 ? 'restricted' : 'confidential',
    notes: `First Capital integration dependency ${i + 1}; relevant to retirement, vendor exit and regulatory evidence sequencing.`,
  };
});

const sourceTitles = [
  'CIO core modernization decision memo',
  'CFO technology run-cost workbook excerpt',
  'OCC MRA remediation status note',
  'FedNow and RTP board update',
  'BSA AML consent-order progress pack',
  'Digital account-opening abandonment analysis',
  'Mobile banking NPS and crash analytics',
  'Commercial lending operating review',
  'Wealth advisor supervision memo',
  'Vendor concentration risk register',
  'Model risk management committee minutes',
  'Data governance and lineage attestation',
  'Cyber resilience board report',
  'SAP ECC finance migration options',
  'FIS core API assessment',
];

const sourceDocumentTypes = [
  'Executive decision memo',
  'Finance workbook narrative',
  'Regulatory remediation update',
  'Architecture review record',
  'Operations review excerpt',
  'Vendor renewal brief',
  'Model risk committee note',
  'Data lineage attestation',
  'Cyber resilience evidence note',
  'Board technology appendix',
];

function formatUsd(value) {
  return `$${Number(value).toLocaleString('en-US')}`;
}

function articleFor(value) {
  return /^[aeiou]/i.test(String(value)) ? 'an' : 'a';
}

function stripTerminalPeriod(value) {
  return String(value).replace(/\.+$/, '');
}

function sourceDocumentBody({ id, title, app, initiative, vendor, edge }) {
  const docType = sourceDocumentTypes[(id - 1) % sourceDocumentTypes.length];
  const date = `2026-${String((id % 12) + 1).padStart(2, '0')}-${String(((id * 3) % 24) + 1).padStart(2, '0')}`;
  const controlOwner = teams[(id * 2) % teams.length];
  const dependency = edge?.to_app_id ?? apps[(id * 11) % apps.length].app_id;
  const exposure = initiative[7] === 'Kill'
    ? 'The steering group should not treat committed spend as proof of value; adoption and control evidence are both weak.'
    : initiative[7] === 'Hold'
      ? 'The decision is blocked until migration sequencing, regulator-facing remediation evidence, and fallback operating procedures are explicit.'
      : initiative[7] === 'Restructure'
        ? 'The value case is credible, but the scope must be narrowed to the evidence-backed cohort before additional funding.'
        : 'The program is eligible to continue only while value measurement remains tied to the named control and operating metrics.';
  return `# ${title}

Document type: ${docType}
Prepared for: ${initiative[3]}
Evidence date: ${date}
Primary system: ${app.app_id} - ${app.name}
Owning team: ${app.it_owner}
Related dependency: ${dependency}
Vendor exposure: ${vendor.vendor} / ${formatUsd(vendor.annual_usd)} annual run-rate
Classification: ${app.primary_dataclass}

## Situation

${app.name} is carried as a ${app.criticality} ${app.category} platform with ${formatUsd(app.run_cost_fy25_usd)} in FY25 run cost and ${articleFor(app.lifecycle_stage)} ${app.lifecycle_stage} modernization posture. The application is not a stand-alone decision: it sits in a dependency chain that includes ${dependency}, ${vendor.vendor}, and the ${controlOwner[1]} control owner group.

## Evidence Observed

- Current architecture: ${app.deployment} deployment with ${app.integration_count} cataloged upstream/downstream relationships.
- Program tie: ${initiative[0]} - ${initiative[1]}; committed funding ${formatUsd(initiative[5])}, projected value ${formatUsd(initiative[6])}, Sentinel posture ${initiative[7]}.
- Vendor condition: ${vendor.exit_terms}; AI/data-use clause: ${vendor.ai_usage_clauses}.
- Risk lens: OCC/FFIEC operational resilience, GLBA safeguarding, BSA/AML evidence where customer or transaction data is in scope, and SR 11-7 model-risk expectations for AI-assisted decisions.

## Decision Implication

${exposure} Any recommendation must cite the application id, initiative id, vendor exposure, and the dependency above. If any of those facts are unavailable in the live context layer, Sentinel should answer that it cannot complete the recommendation yet.

## Open Evidence Requests

- Confirm whether ${dependency} has a tested rollback or parallel-run pattern.
- Reconcile ${app.app_id} run cost to the latest finance allocation workbook.
- Attach latest ServiceNow change/problem records for the last two high-risk release windows.
- Confirm whether second-line risk has accepted the evidence basis for ${initiative[0]}.
`;
}

for (let i = 1; i <= 60; i++) {
  const title = sourceTitles[(i - 1) % sourceTitles.length];
  const app = apps[(i * 3) % apps.length];
  const initiative = initiatives[(i * 5) % initiatives.length];
  const vendor = vendors[(i * 7) % vendors.length];
  const edge = edges[(i * 13) % edges.length];
  write(`13-context/source-files/FCF-SRC-${String(i).padStart(3, '0')}.md`, sourceDocumentBody({
    id: i,
    title,
    app,
    initiative,
    vendor,
    edge,
  }));
}

const corpus = Array.from({ length: 400 }, (_, i) => {
  const app = apps[i % apps.length];
  const initiative = initiatives[(i * 3) % initiatives.length];
  const vendor = vendors[(i * 5) % vendors.length];
  const sourceId = `FCF-SRC-${String((i % 60) + 1).padStart(3, '0')}`;
  const topic = ['core modernization', 'payments modernization', 'AML triage', 'digital onboarding', 'ERP decision', 'vendor concentration', 'model-risk evidence', 'engineering productivity'][i % 8];
  const dependency = edges[(i * 17) % edges.length];
  const text = `${app.app_id} (${app.name}) is a ${app.criticality} ${app.category} platform owned by ${app.it_owner}, with FY25 run cost ${formatUsd(app.run_cost_fy25_usd)}, ${app.integration_count} cataloged dependencies, and lifecycle posture ${app.lifecycle_stage}. ${initiative[0]} (${initiative[1]}) carries ${initiative[7]} posture: committed funding ${formatUsd(initiative[5])}, projected value ${formatUsd(initiative[6])}, and evidence note "${stripTerminalPeriod(initiative[9])}". ${vendor.vendor} contributes ${formatUsd(vendor.annual_usd)} annual exposure with renewal ${vendor.renewal_date}; exit terms are "${vendor.exit_terms}". For ${topic}, the critical dependency to test is ${dependency.from_app_id} -> ${dependency.to_app_id} over ${dependency.integration_type}; recommendations should stay First Capital-specific and name missing evidence when any dependency, control, or run-cost fact is absent.`;
  return {
    chunk_id: `FCF-CHUNK-${String(i + 1).padStart(3, '0')}`,
    id: `FCF-CHUNK-${String(i + 1).padStart(3, '0')}`,
    source_file_id: sourceId,
    tenant_id: TENANT_KEY,
    title: `${sourceTitles[i % sourceTitles.length]} evidence excerpt ${String(i + 1).padStart(3, '0')}`,
    text,
    claim: `${app.app_id}, ${initiative[0]}, ${vendor.vendor}, and dependency ${dependency.from_app_id}->${dependency.to_app_id} must be reasoned together for ${topic}.`,
    evidence_basis: `${sourceId}; ${vendor.vendor} contract; ${app.name} portfolio row.`,
    use_case: topic,
    industry: 'financial_services_banking',
    dataclass: app.primary_dataclass,
    last_updated: `2026-${String((i % 12) + 1).padStart(2, '0')}-15`,
    depth_score: 8 + (i % 3),
    confidence: Number((0.78 + (i % 18) / 100).toFixed(2)),
  };
});

const doraRows = [];
for (const team of teams) {
  for (let week = 1; week <= 6; week++) {
    doraRows.push({
      team_id: team[0],
      measured_at: `2026-0${Math.ceil(week / 4)}-${String(((week - 1) % 4) * 7 + 1).padStart(2, '0')}`,
      deploy_freq_per_week: 1 + ((week + team[0].length) % 12),
      lead_time_hours: 8 + ((week * 9 + team[0].length) % 80),
      mttr_hours: 2 + ((week * 5) % 22),
      change_failure_rate_pct: 4 + ((week * 3) % 18),
      reliability_pct: 98.0 + ((week % 10) / 10),
    });
  }
}

const roles = [];
for (const team of teams) {
  for (let i = 1; i <= 75; i++) {
    roles.push({
      role_id: `${team[0]}-ROLE-${String(i).padStart(3, '0')}`,
      team_id: team[0],
      title: ['Engineer', 'Senior Engineer', 'Principal Engineer', 'Product Manager', 'Scrum Master', 'Business Analyst', 'SRE', 'Security Analyst', 'Data Engineer', 'QA Engineer'][i % 10],
      fte_type: i % 11 === 0 ? 'contractor' : i % 7 === 0 ? 'system_integrator' : 'employee',
      location: ['Charlotte', 'New York', 'Dallas', 'Chicago', 'Remote'][i % 5],
      critical_skill: team[3],
    });
  }
}

const sourceManifest = Array.from({ length: 60 }, (_, i) => ({
  file_id: `FCF-SRC-${String(i + 1).padStart(3, '0')}`,
  path: `13-context/source-files/FCF-SRC-${String(i + 1).padStart(3, '0')}.md`,
  title: sourceTitles[i % sourceTitles.length],
}));

write('00-profile/enterprise-profile.yaml', `client_id: ${CLIENT_ID}
tenant_key: ${TENANT_KEY}
display_name: First Capital Financial
industry: financial_services_banking
revenue_fy25_usd: 21400000000
assets_under_management_usd: 128000000000
employees: 62000
branches: 870
markets: 31
it_budget_fy25_usd: 1960000000
it_budget_pct_revenue: 9.2
operating_efficiency_ratio: 0.68
target_efficiency_ratio: 0.55
regulatory_posture:
  - OCC MRA remediation in flight
  - BSA AML consent-order closure plan
  - SR 11-7 model-risk evidence required for AI decision support
  - GLBA and FFIEC operational resilience expectations
strategic_story: >
  First Capital is a $21.4B revenue financial institution balancing core banking modernization,
  instant-payments pressure, AML remediation, digital-account-opening friction, SAP ECC finance
  decisions, and vendor concentration across FIS, DXC, Accenture, Deloitte, Salesforce and NICE.
`);

write('README.md', `# First Capital Financial Synthetic Substrate v1

This pack provides a banking-grade synthetic enterprise context layer for First Capital:

- 180 application portfolio rows across core banking, payments, lending, wealth, fraud, ERP, data and cyber.
- 380 integration-topology edges for dependency and kill-blocker reasoning.
- 32 active initiatives plus 10 closed initiatives with seeded KILL, RESTRUCTURE, CONTESTED and FALSE-POSITIVE scenarios.
- 70 vendor contracts with annual spend, renewal windows, AI clauses and exit terms.
- 22 teams and 1,650 org-role rows representing CXO, EVP, SVP, VP, director and engineering depth.
- 60 source files and 400 retrieval corpus chunks for Sentinel/Source/Tower grounding.
- Financial-services corpus coverage: OCC, FFIEC, GLBA, BSA/AML, FedNow/RTP, SR 11-7, model risk, vendor risk and operational resilience.

Use \`TENANT_KEY=firstcapital npx tsx scripts/seed/load-tenant-substrate.ts --dry-run\` to verify loader compatibility.
`);

write('CHANGELOG.md', `# Changelog

## v1 - 2026-05-26

- Initial comprehensive First Capital Financial substrate authored.
- Added loader aliases: firstcapital, first-capital and arcturus.
- Seeded banking-specific kill/restructure/hold/false-positive scenarios for Sentinel verification.
`);

write('manifest.yaml', `pack: first-capital-financial-synthetic-v1
client_id: ${CLIENT_ID}
tenant_key: ${TENANT_KEY}
generated_at: ${GENERATED_AT}
row_counts:
  applications: 180
  integration_edges: 380
  initiatives_active: 32
  initiatives_closed: 10
  vendor_contracts: 70
  teams: 22
  roles: 1650
  dora_rows: ${doraRows.length}
  source_files: 60
  corpus_chunks: 400
verification:
  loader_keys:
    - firstcapital
    - first-capital
    - arcturus
`);

write('01-portfolio/application-portfolio.csv', csv([
  'app_id', 'name', 'vendor', 'category', 'business_owner', 'it_owner', 'deployment', 'lifecycle_stage', 'criticality', 'run_cost_fy25_usd', 'primary_dataclass', 'integration_count', 'last_modernization_review', 'ai_eligibility_score', 'notes',
], apps));

write('01-portfolio/initiatives-active.csv', csv([
  'initiative_id', 'title', 'status', 'accountable', 'vendors', 'committed_usd', 'projected_value_usd', 'sentinel_posture', 'stage', 'evidence_note',
], initiatives.map(([initiative_id, title, status, accountable, vendors, committed_usd, projected_value_usd, sentinel_posture, stage, evidence_note]) => ({
  initiative_id, title, status, accountable, vendors, committed_usd, projected_value_usd, sentinel_posture, stage, evidence_note,
}))));

write('01-portfolio/initiatives-closed.csv', csv([
  'initiative_id', 'title', 'status', 'accountable', 'vendors', 'committed_usd', 'projected_value_usd', 'sentinel_posture', 'stage', 'evidence_note',
], closedInitiatives));

write('01-portfolio/integration-topology.json', JSON.stringify({
  client_id: CLIENT_ID,
  tenant_key: TENANT_KEY,
  edge_count: edges.length,
  kill_blocker_summary: {
    'FCF-APP-FIS-HORIZON': ['FCF-APP-FEDWIRE-ACH', 'FCF-APP-FEDNOW-RTP', 'FCF-APP-ONLINE-ACCOUNT-OPENING', 'FCF-APP-SALESFORCE-FSC'],
    'FCF-APP-HOGAN-LOANS': ['FCF-APP-NCINO', 'FCF-APP-SNOWFLAKE', 'FCF-APP-PEGA-CASE'],
    'FCF-APP-SAP-ECC': ['FCF-APP-ORACLE-EBS-REMNANTS', 'FCF-APP-SNOWFLAKE', 'FCF-APP-SERVICENOW'],
  },
  edges,
}, null, 2));

write('02-financial/capex-opex-summary.csv', csv(['metric', 'fy25_usd', 'fy26_plan_usd', 'notes'], [
  { metric: 'revenue', fy25_usd: 21400000000, fy26_plan_usd: 22600000000, notes: 'Top-line anchor for First Capital context.' },
  { metric: 'it_budget', fy25_usd: 1960000000, fy26_plan_usd: 2050000000, notes: '9.2% of revenue; above peer median due remediation and core modernization.' },
  { metric: 'run', fy25_usd: 1274000000, fy26_plan_usd: 1290000000, notes: 'Run burden includes FIS, DXC, SAP ECC and regulatory platforms.' },
  { metric: 'grow', fy25_usd: 431000000, fy26_plan_usd: 478000000, notes: 'Digital banking, payments, lending and data programs.' },
  { metric: 'transform', fy25_usd: 255000000, fy26_plan_usd: 282000000, notes: 'Core future decision, AI, AML triage and platform modernization.' },
]));

write('02-financial/run-cost-by-application.csv', csv(['app_id', 'run_cost_fy25_usd', 'allocated_vendor', 'basis'], apps.map((app) => ({
  app_id: app.app_id,
  run_cost_fy25_usd: app.run_cost_fy25_usd,
  allocated_vendor: app.vendor,
  basis: 'annual run cost allocated from technology finance workbook',
}))));

write('02-financial/initiative-commitments.csv', csv(['initiative_id', 'committed_usd', 'projected_value_usd', 'value_basis'], initiatives.map((i) => ({
  initiative_id: i[0], committed_usd: i[5], projected_value_usd: i[6], value_basis: i[9],
}))));

write('02-financial/renewal-calendar.csv', csv(['vendor', 'renewal_date', 'annual_usd', 'owner', 'negotiation_theme'], vendors.map((v) => ({
  vendor: v.vendor, renewal_date: v.renewal_date, annual_usd: v.annual_usd, owner: v.owner, negotiation_theme: v.exit_terms,
}))));

write('03-org/teams.csv', csv(['team_id', 'team_name', 'executive_owner', 'domain', 'fte_count'], teams.map((t, i) => ({
  team_id: t[0], team_name: t[1], executive_owner: t[2], domain: t[3], fte_count: 55 + ((i * 19) % 110),
}))));

write('03-org/roles.csv', csv(['role_id', 'team_id', 'title', 'fte_type', 'location', 'critical_skill'], roles));

write('03-org/executive-org-chart.json', JSON.stringify({
  ceo: 'Maya Krishnan',
  cfo: 'Jonathan Reed',
  cio: 'Elena Marquez',
  ciso: 'Peter Wallace',
  cro: 'Renee Okafor',
  cdao: 'Priya Narayanan',
  evps: teams.slice(0, 6).map((t, i) => ({ id: `EVP-${i + 1}`, name: ['Elena Marquez', 'Jonathan Reed', 'Renee Okafor', 'Amir Shah', 'Caroline Hughes', 'Sofia Patel'][i], role: t[2], owns: t[1] })),
  svps: teams.slice(6, 14).map((t, i) => ({ id: `SVP-${i + 1}`, name: ['Mark Jensen', 'Lena Ortiz', 'Sean Gallagher', 'Naomi Chen', 'Chris Bell', 'Aisha Morgan', 'Daniel Cho', 'Vivian Brooks'][i], role: t[2], owns: t[1] })),
  vps_and_directors: teams.slice(14).map((t, i) => ({ id: `VP-DIR-${i + 1}`, name: ['Marta Diaz', 'Rob Turner', 'Hannah Lee', 'Nikhil Rao', 'Grace Kim', 'Leo Adams', 'Iris Stone', 'Ben Carter'][i], role: `VP/Director - ${t[1]}`, owns: t[0] })),
}, null, 2));

write('03-org/demo-personas.csv', csv(['email', 'name', 'role', 'persona', 'tenant_key'], [
  { email: 'maya.krishnan+firstcapital@abarva.demo', name: 'Maya Krishnan', role: 'CEO', persona: 'First Capital CEO', tenant_key: TENANT_KEY },
  { email: 'jonathan.reed+firstcapital@abarva.demo', name: 'Jonathan Reed', role: 'CFO', persona: 'First Capital CFO', tenant_key: TENANT_KEY },
  { email: 'elena.marquez+firstcapital@abarva.demo', name: 'Elena Marquez', role: 'CIO', persona: 'First Capital CIO', tenant_key: TENANT_KEY },
  { email: 'renee.okafor+firstcapital@abarva.demo', name: 'Renee Okafor', role: 'CRO', persona: 'First Capital CRO', tenant_key: TENANT_KEY },
  { email: 'peter.wallace+firstcapital@abarva.demo', name: 'Peter Wallace', role: 'CISO', persona: 'First Capital CISO', tenant_key: TENANT_KEY },
]));

write('04-vendors/vendor-contracts.csv', csv(['vendor', 'type', 'annual_usd', 'renewal_date', 'owner', 'data_class', 'ai_usage_clauses', 'exit_terms', 'notes'], vendors));
write('04-vendors/infrastructure-contracts.csv', csv(['vendor', 'service', 'annual_usd', 'term_end', 'notes'], vendors.slice(0, 12).map((v, i) => ({
  vendor: v.vendor, service: ['mainframe hosting', 'cloud commit', 'network', 'datacenter', 'managed security', 'data platform'][i % 6], annual_usd: v.annual_usd, term_end: v.renewal_date, notes: v.exit_terms,
}))));

write('05-dora/dora-baseline.csv', csv(['team_id', 'measured_at', 'deploy_freq_per_week', 'lead_time_hours', 'mttr_hours', 'change_failure_rate_pct', 'reliability_pct'], doraRows));
write('06-devex/devex-survey-fy25.csv', csv(['team_id', 'response_count', 'flow_score', 'build_pain_score', 'legacy_drag_score', 'notes'], teams.map((t, i) => ({
  team_id: t[0], response_count: 24 + (i % 31), flow_score: 5.8 + (i % 4) * 0.4, build_pain_score: 4.1 + (i % 5) * 0.5, legacy_drag_score: 5.2 + (i % 6) * 0.45, notes: `${t[1]} reported ${t[3]} productivity constraints.`,
}))));
write('07-ai-tools/ai-tool-footprint.csv', csv(['tool_id', 'tool_name', 'owner', 'annual_usd', 'approved_data_class', 'status'], Array.from({ length: 18 }, (_, i) => ({
  tool_id: `FCF-AI-TOOL-${String(i + 1).padStart(2, '0')}`,
  tool_name: ['M365 Copilot', 'GitHub Copilot', 'Databricks Mosaic AI', 'Snowflake Cortex', 'NICE X-Sight AI', 'Salesforce Einstein', 'ServiceNow Now Assist', 'SAS Viya AI', 'Pega GenAI Blueprint'][i % 9],
  owner: teams[i % teams.length][2],
  annual_usd: 250000 + ((i * 310000) % 2800000),
  approved_data_class: i % 5 === 0 ? 'internal only' : 'confidential with guardrails',
  status: i % 4 === 0 ? 'pilot' : 'approved',
}))));
write('07-ai-tools/ai-usage-telemetry.csv', csv(['tool_id', 'month', 'active_users', 'accepted_suggestions', 'policy_exceptions'], Array.from({ length: 72 }, (_, i) => ({
  tool_id: `FCF-AI-TOOL-${String((i % 18) + 1).padStart(2, '0')}`,
  month: `2026-${String((i % 12) + 1).padStart(2, '0')}`,
  active_users: 120 + ((i * 37) % 2100),
  accepted_suggestions: 300 + ((i * 97) % 9800),
  policy_exceptions: i % 13,
}))));
write('08-sponsor-signal/sponsor-pulse.jsonl', jsonl(initiatives.map((i, idx) => ({
  initiative_id: i[0],
  sponsor_role: i[3],
  last_status_update_days_ago: idx % 7 === 0 ? 75 : 5 + (idx % 22),
  meetings_held_last_quarter: 1 + (idx % 6),
  meetings_cancelled_last_quarter: idx % 3,
  engagement_self_score_0_10: idx % 7 === 0 ? 3 : 6 + (idx % 4),
  notes: i[9],
}))));
write('10-incidents-changes/incidents.csv', csv(['incident_id', 'app_id', 'opened_at', 'severity', 'customer_impact', 'root_cause'], Array.from({ length: 64 }, (_, i) => ({
  incident_id: `FCF-INC-${String(i + 1).padStart(3, '0')}`,
  app_id: apps[(i * 5) % apps.length].app_id,
  opened_at: `2026-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 26) + 1).padStart(2, '0')}`,
  severity: i % 10 === 0 ? 'sev1' : i % 4 === 0 ? 'sev2' : 'sev3',
  customer_impact: i % 3 === 0 ? 'client-facing latency or failure' : 'internal operational impact',
  root_cause: ['core batch delay', 'vendor change defect', 'API timeout', 'data-quality defect', 'capacity threshold'][i % 5],
}))));
write('10-incidents-changes/changes.csv', csv(['change_id', 'team_id', 'app_id', 'implemented_at', 'risk_rating', 'outcome'], Array.from({ length: 96 }, (_, i) => ({
  change_id: `FCF-CHG-${String(i + 1).padStart(3, '0')}`,
  team_id: teams[i % teams.length][0],
  app_id: apps[(i * 11) % apps.length].app_id,
  implemented_at: `2026-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 24) + 1).padStart(2, '0')}`,
  risk_rating: i % 9 === 0 ? 'high' : 'standard',
  outcome: i % 14 === 0 ? 'rolled_back' : 'successful',
}))));
const regulatoryObligations = [
  ['OCC', 'Remediate core data-lineage MRA', ['FCF-APP-FIS-HORIZON', 'FCF-APP-SNOWFLAKE'], 'lineage attestation, accountable owner signoff, and control testing'],
  ['FinCEN/OCC', 'BSA AML case management remediation', ['FCF-APP-NICE-ACTIMIZE', 'FCF-APP-FENERGO-KYC'], 'case quality sample, alert tuning evidence, staffing model, and escalation history'],
  ['Federal Reserve', 'SR 11-7 model-risk management for AI-assisted decisions', ['FCF-APP-DATABRICKS', 'FCF-APP-NICE-ACTIMIZE'], 'model inventory, independent validation, monitoring, and use limitation evidence'],
  ['Federal banking regulators', 'GLBA safeguarding of customer information', ['FCF-APP-MOBILE-BANKING', 'FCF-APP-SALESFORCE-FSC'], 'access review, encryption control, vendor control, and incident response evidence'],
  ['FFIEC', 'Operational resilience for critical payments', ['FCF-APP-FEDWIRE-ACH', 'FCF-APP-FEDNOW-RTP'], 'resilience tier, RTO/RPO test, failover evidence, and dependency map'],
  ['OCC', 'Third-party risk concentration management', ['FCF-APP-FIS-HORIZON', 'FCF-APP-HOGAN-LOANS'], 'exit plan, concentration analysis, contract term review, and board reporting'],
  ['CFPB', 'Digital account-opening adverse-action traceability', ['FCF-APP-ONLINE-ACCOUNT-OPENING', 'FCF-APP-FENERGO-KYC'], 'decision reason code audit, customer notice sample, and KYC workflow trace'],
  ['FINRA', 'Wealth advisor supervision and client note retention', ['FCF-APP-SALESFORCE-FSC'], 'supervision review, retention policy, exception report, and surveillance evidence'],
  ['SEC', 'Books and records retention for investment advisory workflows', ['FCF-APP-SALESFORCE-FSC', 'FCF-APP-WORKDAY-HCM'], 'retention configuration, legal hold evidence, and archival retrieval test'],
  ['PCI DSS', 'Card payment data protection', ['FCF-APP-FEDWIRE-ACH', 'FCF-APP-FEDNOW-RTP'], 'segmentation evidence, tokenization control, quarterly scan, and remediation log'],
  ['SOX', 'Finance close and access controls', ['FCF-APP-SAP-ECC', 'FCF-APP-ORACLE-EBS-REMNANTS'], 'ITGC control evidence, access recertification, batch reconciliation, and change approval'],
  ['NYDFS', 'Cybersecurity program and incident reporting', ['FCF-APP-SPLUNK', 'FCF-APP-CROWDSTRIKE'], 'monitoring coverage, incident drill, vulnerability remediation, and board attestation'],
];
while (regulatoryObligations.length < 40) {
  const i = regulatoryObligations.length;
  const appA = apps[(i * 7) % apps.length].app_id;
  const appB = apps[(i * 11) % apps.length].app_id;
  regulatoryObligations.push([
    ['OCC', 'FFIEC', 'Federal Reserve', 'CFPB', 'FinCEN', 'Internal Audit'][i % 6],
    [
      'Quarterly access recertification for regulated platform',
      'Evidence retention for critical change window',
      'Vendor due-diligence refresh and AI data-use attestation',
      'Customer-impact incident postmortem and remediation proof',
      'Data-quality control attestation for executive/regulatory report',
      'Operational resilience dependency review',
    ][i % 6],
    [appA, appB],
    [
      'owner attestation, exception list, sampled evidence, and remediation owner',
      'change ticket, rollback evidence, testing signoff, and production validation',
      'contract clause, security review, data-flow boundary, and exit readiness evidence',
      'timeline, impact assessment, root cause, corrective action, and control validation',
      'lineage extract, reconciliation sample, data steward signoff, and issue register',
      'dependency map, DR test, RTO/RPO evidence, and unresolved risk acceptance',
    ][i % 6],
  ]);
}
write('11-regulatory/regulatory-obligations.csv', csv(['reg_id', 'regulator', 'obligation', 'affected_apps', 'evidence_required'], regulatoryObligations.map((row, i) => ({
  reg_id: `FCF-REG-${String(i + 1).padStart(3, '0')}`,
  regulator: row[0],
  obligation: row[1],
  affected_apps: row[2].join('|'),
  evidence_required: row[3],
}))));
write('12-benchmarks/financial-services-benchmarks.csv', csv(['benchmark_id', 'metric', 'first_capital_value', 'peer_median', 'top_quartile', 'notes'], [
  { benchmark_id: 'FCF-BENCH-001', metric: 'efficiency_ratio', first_capital_value: 0.68, peer_median: 0.61, top_quartile: 0.55, notes: 'Technology run cost and remediation burden pressure operating efficiency.' },
  { benchmark_id: 'FCF-BENCH-002', metric: 'mobile_app_rating', first_capital_value: 3.1, peer_median: 4.2, top_quartile: 4.6, notes: 'Digital friction story for CXO demo.' },
  { benchmark_id: 'FCF-BENCH-003', metric: 'digital_account_open_abandonment', first_capital_value: 0.64, peer_median: 0.42, top_quartile: 0.28, notes: 'Grounds digital account opening value case.' },
  { benchmark_id: 'FCF-BENCH-004', metric: 'it_spend_pct_revenue', first_capital_value: 0.092, peer_median: 0.071, top_quartile: 0.061, notes: 'Explains CFO pressure on vendor and legacy run cost.' },
]));
write('13-context/client-data-corpus.jsonl', jsonl(corpus));
write('99-verification/expected-row-counts.json', JSON.stringify({
  client_id: CLIENT_ID,
  applications: apps.length,
  integration_edges: edges.length,
  ai_initiatives_active: initiatives.length,
  ai_initiatives_closed: closedInitiatives.length,
  vendor_contracts: vendors.length,
  teams: teams.length,
  roles: roles.length,
  enterprise_context_source_files: sourceManifest.length,
  enterprise_context_chunks: corpus.length,
}, null, 2));
write('99-verification/expected-sentinel-answers.json', JSON.stringify({
  tenant_key: TENANT_KEY,
  canonical_questions: [
    {
      id: 'FCF-Q01',
      question: 'What do you know about First Capital Financial?',
      must_cite: ['FCF-APP-FIS-HORIZON', 'FCF-APP-FEDNOW-RTP', 'FCF-INIT-CORE-BANKING-FUTURE'],
    },
    {
      id: 'FCF-Q02',
      question: 'Which initiatives should we kill?',
      must_cite: ['FCF-INIT-BRANCH-VISION-AI', 'FCF-INIT-CONTACT-SENTIMENT-V1', 'FCF-INIT-WEALTH-COPILOT-SHADOW'],
    },
    {
      id: 'FCF-Q03',
      question: 'What blocks killing FCF-APP-FIS-HORIZON?',
      must_cite: ['FCF-APP-FEDWIRE-ACH', 'FCF-APP-FEDNOW-RTP', 'FCF-APP-ONLINE-ACCOUNT-OPENING'],
    },
    {
      id: 'FCF-Q04',
      question: 'Should we proceed with the core banking future decision?',
      must_cite: ['FCF-INIT-CORE-BANKING-FUTURE', 'OCC', 'data migration'],
    },
    {
      id: 'FCF-Q05',
      question: 'What are the top vendor concentration risks?',
      must_cite: ['FIS', 'DXC', 'Accenture', 'Deloitte'],
    },
  ],
}, null, 2));

console.log(`Generated First Capital substrate at ${ROOT}`);
console.log(`applications=${apps.length}, edges=${edges.length}, initiatives=${initiatives.length}, vendors=${vendors.length}, teams=${teams.length}, roles=${roles.length}, sources=60, chunks=${corpus.length}`);

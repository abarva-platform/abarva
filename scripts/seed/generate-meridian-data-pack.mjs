import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const packRoot = path.join(root, 'datasets/meridian-health-synthetic-v1');
const tenantId = 'meridian';

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(relativePath, content) {
  const absolute = path.join(packRoot, relativePath);
  ensureDir(path.dirname(absolute));
  fs.writeFileSync(absolute, content);
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function writeCsv(relativePath, headers, rows) {
  const body = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
  ].join('\n');
  writeFile(relativePath, `${body}\n`);
}

function stablePick(list, index) {
  return list[index % list.length];
}

function isoWeek(offset) {
  const base = new Date('2026-01-05T00:00:00.000Z');
  base.setUTCDate(base.getUTCDate() + offset * 7);
  return base.toISOString().slice(0, 10);
}

function makePdf(title, lines) {
  const text = [title, ...lines].join(' | ').replace(/[()\\]/g, '');
  return `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${text.length + 64} >>
stream
BT /F1 10 Tf 54 738 Td (${text.slice(0, 520)}) Tj ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
trailer
<< /Root 1 0 R /Size 6 >>
startxref
512
%%EOF
`;
}

function makePseudoXlsx(label, sheets) {
  return `PK\u0003\u0004MERIDIAN-XLSX-STUB\n${label}\n${JSON.stringify(sheets, null, 2)}\nPK\u0005\u0006`;
}

function checksumFiles() {
  const out = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(absolute);
      if (entry.isFile()) {
        const relativePath = path.relative(packRoot, absolute).replaceAll(path.sep, '/');
        const digest = crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex');
        out.push({ path: relativePath, sha256: digest });
      }
    }
  }
  walk(packRoot);
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

const teamDefs = [
  ['TEAM-MR-EPIC-CLINICAL', 'Epic Clinical Applications', 'clinical_apps', 'Epic clinical core', 'VP Clinical Informatics', 95],
  ['TEAM-MR-EPIC-RC', 'Epic Revenue Cycle Applications', 'revenue_cycle', 'Resolute, charge, denials', 'VP Revenue Cycle IT', 85],
  ['TEAM-MR-EPIC-ANC', 'Epic Ancillaries Applications', 'ancillaries', 'Beaker, Willow, Radiant, Cupid', 'VP Ancillary Systems', 80],
  ['TEAM-MR-EPIC-OR-ED', 'Epic ED and Perioperative', 'clinical_apps', 'ASAP, OpTime, anesthesia', 'VP Clinical Operations IT', 80],
  ['TEAM-MR-INTEGRATION', 'Integration and Interoperability', 'platform', 'HL7, FHIR, HIE, MLLP', 'VP Interoperability', 85],
  ['TEAM-MR-INFRA', 'Infrastructure and Platform', 'platform', 'Sacramento DC, Citrix, VMware, storage', 'VP Infrastructure', 210],
  ['TEAM-MR-SECURITY', 'Security and Identity', 'security', 'Okta, Zscaler, CrowdStrike, HIPAA controls', 'CISO', 95],
  ['TEAM-MR-DATA-AI', 'Data Analytics and AI Enablement', 'data_ai', 'Cogito, Power BI, AI platform, data governance', 'VP Data and AI', 240],
  ['TEAM-MR-DIGITAL', 'Digital Front Door and Consumer', 'digital', 'MyChart, Luma, patient messaging', 'VP Digital Experience', 75],
  ['TEAM-MR-POPHEALTH', 'Population Health Analytics', 'population_health', 'Healthy Planet, Innovaccer, ACO analytics', 'VP Value Based Care', 60],
  ['TEAM-MR-RESEARCH', 'Research Informatics', 'research', 'OnCore, REDCap, cohorts, IRB', 'Director Research Informatics', 40],
  ['TEAM-MR-CORP-IT', 'Corporate IT', 'corporate', 'Workday, ServiceNow, M365', 'VP Corporate Systems', 115],
  ['TEAM-MR-WORKFORCE', 'Workforce and HR Technology', 'workforce', 'QGenda, UKG, HealthStream, Symplr', 'Director Workforce Tech', 45],
  ['TEAM-MR-IMAGING', 'Imaging Informatics', 'imaging', 'Sectra, Visage, MUSE, imaging AI', 'Director Imaging Informatics', 55],
  ['TEAM-MR-PMO', 'PMO and Governance', 'governance', 'portfolio, charters, value ledger', 'VP PMO', 70],
  ['TEAM-MR-SERVICE', 'Service Desk and Field Support', 'support', 'field support, device support, command center', 'VP Support Services', 220],
];

const appSeeds = [
  ['MR-APP-EPIC-HYPERSPACE', 'Epic Hyperspace', 'Epic', 'clinical core', 'CMIO', 'TEAM-MR-EPIC-CLINICAL', 'on_prem', 'invest', 'critical', 14500000, 'phi', 128, 0.55, 'Primary clinician workspace across seven hospitals'],
  ['MR-APP-EPIC-HYPERDRIVE', 'Epic Hyperdrive', 'Epic', 'clinical core', 'CMIO', 'TEAM-MR-EPIC-CLINICAL', 'on_prem', 'invest', 'critical', 7600000, 'phi', 74, 0.62, 'Browser modernization path; phased rollout through FY26'],
  ['MR-APP-EPIC-BEDROCK', 'Epic Bedrock', 'Epic', 'clinical core', 'CDIO', 'TEAM-MR-EPIC-CLINICAL', 'on_prem', 'maintain', 'critical', 6800000, 'phi', 92, 0.42, 'Foundation configuration and security build'],
  ['MR-APP-EPIC-COSMOS', 'Epic Cosmos', 'Epic', 'clinical core', 'CMIO', 'TEAM-MR-DATA-AI', 'cloud', 'invest', 'high', 4200000, 'phi', 34, 0.82, 'Cohort insights and research discovery pilot'],
  ['MR-APP-MYCHART', 'MyChart', 'Epic', 'patient experience', 'Chief Experience Officer', 'TEAM-MR-DIGITAL', 'hybrid', 'invest', 'critical', 5200000, 'phi', 65, 0.74, 'Digital front door anchor integrated with Luma'],
  ['MR-APP-BEAKER', 'Epic Beaker', 'Epic', 'clinical core', 'CMIO', 'TEAM-MR-EPIC-ANC', 'on_prem', 'invest', 'critical', 6100000, 'phi', 70, 0.49, 'Target platform for Sunquest consolidation'],
  ['MR-APP-WILLOW', 'Epic Willow', 'Epic', 'clinical core', 'Chief Pharmacy Officer', 'TEAM-MR-EPIC-ANC', 'on_prem', 'maintain', 'critical', 3600000, 'phi', 48, 0.44, 'Inpatient and outpatient pharmacy workflows'],
  ['MR-APP-CUPID', 'Epic Cupid', 'Epic', 'clinical core', 'Chief Cardiologist', 'TEAM-MR-EPIC-ANC', 'on_prem', 'maintain', 'high', 2100000, 'phi', 33, 0.50, 'Cardiology documentation and workflows'],
  ['MR-APP-STORK', 'Epic Stork', 'Epic', 'clinical core', 'Women and Children Service Line', 'TEAM-MR-EPIC-CLINICAL', 'on_prem', 'maintain', 'high', 1400000, 'phi', 24, 0.43, 'OB workflows'],
  ['MR-APP-ASAP', 'Epic ASAP', 'Epic', 'clinical core', 'COO', 'TEAM-MR-EPIC-OR-ED', 'on_prem', 'invest', 'critical', 3200000, 'phi', 51, 0.69, 'ED throughput and queue-prediction dependency'],
  ['MR-APP-OPTIME', 'Epic OpTime', 'Epic', 'clinical core', 'COO', 'TEAM-MR-EPIC-OR-ED', 'on_prem', 'maintain', 'critical', 2800000, 'phi', 45, 0.46, 'OR scheduling and perioperative workflows'],
  ['MR-APP-ANESTHESIA', 'Epic Anesthesia', 'Epic', 'clinical core', 'Chief Anesthesiologist', 'TEAM-MR-EPIC-OR-ED', 'on_prem', 'maintain', 'high', 950000, 'phi', 20, 0.40, 'Perioperative anesthesia record'],
  ['MR-APP-RADIANT', 'Epic Radiant', 'Epic', 'clinical core', 'Chief Radiologist', 'TEAM-MR-EPIC-ANC', 'on_prem', 'maintain', 'critical', 1900000, 'phi', 42, 0.45, 'Radiology orders and reporting workflow'],
  ['MR-APP-COGITO', 'Epic Cogito', 'Epic', 'clinical core', 'VP Data and AI', 'TEAM-MR-DATA-AI', 'on_prem', 'invest', 'critical', 4100000, 'phi', 58, 0.78, 'Reporting workbench and data mart layer'],
  ['MR-APP-RESOLUTE-HB', 'Epic Resolute HB', 'Epic', 'revenue cycle', 'CFO', 'TEAM-MR-EPIC-RC', 'on_prem', 'maintain', 'critical', 3300000, 'phi', 44, 0.61, 'Hospital billing and revenue integrity source'],
  ['MR-APP-RESOLUTE-PB', 'Epic Resolute PB', 'Epic', 'revenue cycle', 'CFO', 'TEAM-MR-EPIC-RC', 'on_prem', 'maintain', 'critical', 2900000, 'phi', 39, 0.61, 'Professional billing'],
  ['MR-APP-HEALTHY-PLANET', 'Epic Healthy Planet', 'Epic', 'population health', 'VP Value Based Care', 'TEAM-MR-POPHEALTH', 'on_prem', 'invest', 'high', 2600000, 'phi', 35, 0.77, 'Panel surfacing and ACO care gaps'],
  ['MR-APP-SECTRA-PACS', 'Sectra PACS', 'Sectra', 'imaging diagnostics', 'Chief Radiologist', 'TEAM-MR-IMAGING', 'hybrid', 'maintain', 'critical', 7200000, 'phi', 63, 0.57, 'Enterprise PACS for diagnostic imaging'],
  ['MR-APP-VISAGE-7', 'Visage 7', 'Visage Imaging', 'imaging diagnostics', 'Chief Radiologist', 'TEAM-MR-IMAGING', 'hybrid', 'invest', 'critical', 5200000, 'phi', 31, 0.72, 'Enterprise viewer with AI overlays'],
  ['MR-APP-GE-MUSE', 'GE MUSE', 'GE Healthcare', 'imaging diagnostics', 'Chief Cardiologist', 'TEAM-MR-IMAGING', 'on_prem', 'maintain', 'high', 980000, 'phi', 18, 0.36, 'ECG management'],
  ['MR-APP-SUNQUEST-MERCY', 'Sunquest LIS Mercy', 'Sunquest', 'legacy sunset', 'CMIO', 'TEAM-MR-EPIC-ANC', 'on_prem', 'retire', 'high', 1450000, 'phi', 26, 0.20, 'Legacy LIS at Mercy; blocker for Beaker consolidation'],
  ['MR-APP-SUNQUEST-SUTTER', 'Sunquest LIS Sutter', 'Sunquest', 'legacy sunset', 'CMIO', 'TEAM-MR-EPIC-ANC', 'on_prem', 'retire', 'high', 1320000, 'phi', 24, 0.20, 'Legacy LIS at Sutter; high interface debt'],
  ['MR-APP-ALLSCRIPTS-MERCY', 'Allscripts Sunrise Mercy', 'Altera Digital Health', 'legacy sunset', 'COO', 'TEAM-MR-EPIC-CLINICAL', 'on_prem', 'contain', 'high', 1650000, 'phi', 30, 0.18, 'Post-merger holdover; read-only archive and specialty clinic workflows'],
  ['MR-APP-PARAGON', 'McKesson Paragon Archive', 'McKesson', 'legacy sunset', 'CFO', 'TEAM-MR-EPIC-RC', 'on_prem', 'retire', 'medium', 720000, 'phi', 14, 0.12, 'Decommission-in-progress, archive dependencies remain'],
  ['MR-APP-LAWSON-HCM', 'Lawson HCM Residuals', 'Infor', 'legacy sunset', 'CHRO', 'TEAM-MR-WORKFORCE', 'on_prem', 'retire', 'medium', 510000, 'confidential', 12, 0.08, 'Residual payroll extracts after Workday migration'],
  ['MR-APP-WORKDAY-FIN', 'Workday Financials', 'Workday', 'erp corporate', 'CFO', 'TEAM-MR-CORP-IT', 'cloud', 'maintain', 'critical', 6500000, 'confidential', 45, 0.55, 'Cloud financials live 2023'],
  ['MR-APP-WORKDAY-HCM', 'Workday HCM', 'Workday', 'hr workforce', 'CHRO', 'TEAM-MR-WORKFORCE', 'cloud', 'maintain', 'high', 3800000, 'confidential', 34, 0.52, 'Core HR and talent'],
  ['MR-APP-WORKDAY-SCM', 'Workday SCM', 'Workday', 'erp corporate', 'CFO', 'TEAM-MR-CORP-IT', 'cloud', 'invest', 'high', 2400000, 'confidential', 22, 0.58, 'Supply-chain modernization'],
  ['MR-APP-M365-E5', 'Microsoft 365 E5', 'Microsoft', 'erp corporate', 'CDIO', 'TEAM-MR-CORP-IT', 'cloud', 'maintain', 'high', 8900000, 'confidential', 18, 0.70, 'M365, Teams, security bundle, Copilot option'],
  ['MR-APP-SERVICENOW', 'ServiceNow ITSM HRSD', 'ServiceNow', 'erp corporate', 'CDIO', 'TEAM-MR-CORP-IT', 'cloud', 'invest', 'high', 3300000, 'internal', 43, 0.67, 'ITSM, HRSD, CMDB, incident workflows'],
  ['MR-APP-INNOVACCER', 'Innovaccer Health Cloud', 'Innovaccer', 'population health', 'VP Value Based Care', 'TEAM-MR-POPHEALTH', 'cloud', 'invest', 'high', 5700000, 'phi', 38, 0.84, 'Population health overlay and care manager copilots'],
  ['MR-APP-OPTUM-360', 'Optum 360 Revenue Cycle Services', 'Optum', 'revenue cycle', 'CFO', 'TEAM-MR-EPIC-RC', 'managed_service', 'maintain', 'critical', 5100000, 'phi', 21, 0.57, 'Revenue cycle services and coding support'],
  ['MR-APP-CHANGE-CHC', 'Change Healthcare Clearinghouse', 'Change Healthcare', 'revenue cycle', 'CFO', 'TEAM-MR-EPIC-RC', 'cloud', 'contain', 'critical', 2500000, 'phi', 28, 0.32, 'Claims clearinghouse with contingency plan after 2024 incident'],
  ['MR-APP-PHREESIA', 'Phreesia Patient Intake', 'Phreesia', 'revenue cycle', 'Chief Experience Officer', 'TEAM-MR-DIGITAL', 'cloud', 'maintain', 'medium', 1200000, 'phi', 18, 0.60, 'Patient intake and payments'],
  ['MR-APP-LUMA', 'Luma Health', 'Luma Health', 'patient experience', 'Chief Experience Officer', 'TEAM-MR-DIGITAL', 'cloud', 'invest', 'high', 1800000, 'phi', 32, 0.78, 'Digital front door scheduling and nudges'],
  ['MR-APP-PRESS-GANEY', 'Press Ganey', 'Press Ganey', 'patient experience', 'Chief Experience Officer', 'TEAM-MR-DIGITAL', 'cloud', 'maintain', 'medium', 840000, 'confidential', 8, 0.45, 'Patient experience surveys'],
  ['MR-APP-QGENDA', 'QGenda Scheduling', 'QGenda', 'hr workforce', 'CHRO', 'TEAM-MR-WORKFORCE', 'cloud', 'invest', 'high', 1100000, 'confidential', 17, 0.72, 'Physician scheduling and workforce AI dependency'],
  ['MR-APP-UKG-KRONOS', 'UKG Kronos Workforce', 'UKG', 'hr workforce', 'CHRO', 'TEAM-MR-WORKFORCE', 'cloud', 'contain', 'high', 1950000, 'confidential', 22, 0.39, 'Legacy workforce scheduling migration in flight'],
  ['MR-APP-SYMPLR', 'Symplr Credentialing', 'Symplr', 'hr workforce', 'CMO', 'TEAM-MR-WORKFORCE', 'cloud', 'maintain', 'medium', 780000, 'confidential', 11, 0.42, 'Credentialing and provider onboarding'],
  ['MR-APP-HEALTHSTREAM', 'HealthStream LMS', 'HealthStream', 'hr workforce', 'CHRO', 'TEAM-MR-WORKFORCE', 'cloud', 'maintain', 'medium', 660000, 'confidential', 10, 0.51, 'Clinical training and compliance'],
  ['MR-APP-ONCORE', 'OnCore CTMS', 'Advarra', 'research clinical trials', 'VP Research', 'TEAM-MR-RESEARCH', 'cloud', 'maintain', 'medium', 940000, 'phi', 14, 0.55, 'Clinical-trials management'],
  ['MR-APP-REDCAP', 'REDCap', 'Vanderbilt', 'research clinical trials', 'VP Research', 'TEAM-MR-RESEARCH', 'on_prem', 'maintain', 'medium', 180000, 'phi', 9, 0.49, 'Research data capture'],
  ['MR-APP-TEMPUS', 'Tempus', 'Tempus', 'research clinical trials', 'VP Research', 'TEAM-MR-RESEARCH', 'cloud', 'invest', 'medium', 1450000, 'phi', 12, 0.73, 'Genomics and oncology insights'],
  ['MR-APP-CITRIX', 'Citrix Cloud', 'Cloud Software Group', 'infrastructure platform', 'CDIO', 'TEAM-MR-INFRA', 'hybrid', 'maintain', 'critical', 6100000, 'confidential', 40, 0.31, 'Clinical app delivery platform'],
  ['MR-APP-VMWARE', 'VMware vSphere', 'VMware', 'infrastructure platform', 'CDIO', 'TEAM-MR-INFRA', 'on_prem', 'contain', 'critical', 4900000, 'confidential', 35, 0.24, 'Virtualization cost pressure after Broadcom acquisition'],
  ['MR-APP-PURE', 'Pure Storage', 'Pure Storage', 'infrastructure platform', 'CDIO', 'TEAM-MR-INFRA', 'on_prem', 'maintain', 'critical', 4100000, 'confidential', 20, 0.22, 'Storage foundation for Epic and imaging'],
  ['MR-APP-AZURE', 'Azure Foundation', 'Microsoft', 'infrastructure platform', 'CDIO', 'TEAM-MR-INFRA', 'cloud', 'invest', 'high', 4600000, 'confidential', 25, 0.78, 'Primary cloud foundation and AI Search build path'],
  ['MR-APP-CONFLUENT', 'Confluent Platform', 'Confluent', 'infrastructure platform', 'CDIO', 'TEAM-MR-INTEGRATION', 'cloud', 'invest', 'high', 1700000, 'phi', 26, 0.69, 'Event streaming for interoperability modernization'],
  ['MR-APP-SPLUNK', 'Splunk Enterprise Security', 'Splunk', 'infrastructure platform', 'CISO', 'TEAM-MR-SECURITY', 'cloud', 'maintain', 'critical', 5300000, 'confidential', 42, 0.36, 'SIEM and operational logs'],
  ['MR-APP-CROWDSTRIKE', 'CrowdStrike Falcon', 'CrowdStrike', 'infrastructure platform', 'CISO', 'TEAM-MR-SECURITY', 'cloud', 'maintain', 'critical', 4400000, 'confidential', 16, 0.33, 'Endpoint protection and MDR'],
  ['MR-APP-ZSCALER', 'Zscaler ZIA ZPA', 'Zscaler', 'infrastructure platform', 'CISO', 'TEAM-MR-SECURITY', 'cloud', 'maintain', 'high', 2300000, 'confidential', 13, 0.28, 'Zero-trust network access'],
  ['MR-APP-OKTA', 'Okta Identity', 'Okta', 'infrastructure platform', 'CISO', 'TEAM-MR-SECURITY', 'cloud', 'maintain', 'critical', 2400000, 'confidential', 31, 0.35, 'Identity and access platform'],
];

const generatedNames = {
  'clinical core': ['Epic Rover', 'Epic Haiku', 'Epic Canto', 'Epic Secure Chat', 'Epic Bed Planning', 'Epic Transfer Center', 'Clinical Decision Support Library', 'Nursing Care Plan Toolkit'],
  'imaging diagnostics': ['Philips IntelliSpace CV', 'Cassling DR Console', 'Roche cobas IT', 'Nuance Powerscribe', 'MModal Fluency Direct', 'Sectra Education Portal'],
  'revenue cycle': ['Waystar Denials', 'Experian Health Eligibility', 'FinThrive Contract Manager', 'RevSpring Statements', 'Cedar Pay', 'Coding Audit Workbench'],
  'population health': ['Arcadia Legacy Analytics', 'Stellar Health', 'Signify Integration', 'NaviHealth Integration', 'ACO Attribution Hub'],
  'erp corporate': ['Concur Expense', 'DocuSign CLM', 'Coupa Procurement Pilot', 'Power BI Enterprise', 'SharePoint Governance Hub', 'Smartsheet PMO'],
  'hr workforce': ['ADP Tax Services', 'Nurse Float Pool Planner', 'Travel Nurse Agency Portal', 'Employee Wellness Portal', 'Provider Onboarding Tracker'],
  'patient experience': ['Twilio Notify', 'Get Well Network', 'RelateCare Contact Center', 'Wayfinding Kiosk Manager', 'Patient Portal Analytics'],
  'research clinical trials': ['IRB Manager', 'Cohort Builder', 'Epic Research Module', 'LabVantage Biobank', 'Research Consent Manager'],
  'infrastructure platform': ['Cisco UCS Manager', 'Cribl Stream', 'Kafka MSK Bridge', 'SolarWinds Network Monitor', 'Rubrik Backup', 'Palo Alto Firewall Manager', 'Azure AI Search', 'Service Mesh Gateway'],
  'legacy sunset': ['Access DB Inventory', 'Homegrown Bed Board', 'Legacy Fax Routing', 'ColdFusion Physician Directory', 'Legacy Claims Archive', 'Legacy Interface Mapper', 'Radiology CD Burner', 'Old Badge Provisioning'],
  specialty: ['Visicu eICU', 'Spok Smartphone Alerts', 'Stryker Mako Planning', 'Aidoc Stroke Triage', 'Rad AI Impressions', 'Hippocratic Outreach Sandbox'],
};

const appHeaders = ['app_id', 'name', 'vendor', 'category', 'business_owner', 'it_owner', 'deployment', 'lifecycle_stage', 'criticality', 'run_cost_fy25_usd', 'primary_dataclass', 'integration_count', 'last_modernization_review', 'ai_eligibility_score', 'notes'];

function appIdFromName(name, prefix = 'MR-APP') {
  return `${prefix}-${name.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 34)}`;
}

const apps = appSeeds.map(([app_id, name, vendor, category, business_owner, it_owner, deployment, lifecycle_stage, criticality, run_cost_fy25_usd, primary_dataclass, integration_count, ai_eligibility_score, notes], index) => ({
  app_id,
  name,
  vendor,
  category,
  business_owner,
  it_owner,
  deployment,
  lifecycle_stage,
  criticality,
  run_cost_fy25_usd,
  primary_dataclass,
  integration_count,
  last_modernization_review: `2025-${String((index % 12) + 1).padStart(2, '0')}-15`,
  ai_eligibility_score,
  notes,
}));

const targetDomainCounts = {
  'clinical core': 22,
  'imaging diagnostics': 12,
  'revenue cycle': 14,
  'population health': 8,
  'erp corporate': 18,
  'hr workforce': 10,
  'patient experience': 8,
  'research clinical trials': 6,
  'infrastructure platform': 18,
  'legacy sunset': 14,
  specialty: 10,
};

const vendorByCategory = {
  'clinical core': ['Epic', 'Nuance', 'Abridge'],
  'imaging diagnostics': ['Sectra', 'Visage Imaging', 'GE Healthcare', 'Philips', 'Roche'],
  'revenue cycle': ['Epic', 'Optum', 'Waystar', 'Experian Health', 'FinThrive'],
  'population health': ['Epic', 'Innovaccer', 'Arcadia', 'Stellar Health', 'Signify'],
  'erp corporate': ['Workday', 'ServiceNow', 'Microsoft', 'DocuSign', 'Coupa'],
  'hr workforce': ['Workday', 'UKG', 'QGenda', 'Symplr', 'HealthStream'],
  'patient experience': ['Epic', 'Luma Health', 'Twilio', 'Press Ganey', 'Get Well Network'],
  'research clinical trials': ['Advarra', 'Vanderbilt', 'Epic', 'Tempus'],
  'infrastructure platform': ['Microsoft', 'Cisco', 'Cribl', 'Confluent', 'Pure Storage', 'Palo Alto', 'Rubrik'],
  'legacy sunset': ['Infor', 'Sunquest', 'Altera Digital Health', 'Internal'],
  specialty: ['Visicu', 'Spok', 'Stryker', 'Aidoc', 'Rad AI', 'Hippocratic AI'],
};

for (const [category, target] of Object.entries(targetDomainCounts)) {
  let existing = apps.filter((app) => app.category === category).length;
  let index = 0;
  while (existing < target) {
    const name = stablePick(generatedNames[category], index) + (index >= generatedNames[category].length ? ` ${Math.floor(index / generatedNames[category].length) + 1}` : '');
    const vendor = stablePick(vendorByCategory[category], index);
    const team = category === 'clinical core' ? 'TEAM-MR-EPIC-CLINICAL'
      : category === 'imaging diagnostics' ? 'TEAM-MR-IMAGING'
      : category === 'revenue cycle' ? 'TEAM-MR-EPIC-RC'
      : category === 'population health' ? 'TEAM-MR-POPHEALTH'
      : category === 'erp corporate' ? 'TEAM-MR-CORP-IT'
      : category === 'hr workforce' ? 'TEAM-MR-WORKFORCE'
      : category === 'patient experience' ? 'TEAM-MR-DIGITAL'
      : category === 'research clinical trials' ? 'TEAM-MR-RESEARCH'
      : category === 'infrastructure platform' ? 'TEAM-MR-INFRA'
      : category === 'legacy sunset' ? 'TEAM-MR-INTEGRATION'
      : 'TEAM-MR-DATA-AI';
    const lifecycle = category === 'legacy sunset' ? stablePick(['retire', 'contain', 'retire'], index) : stablePick(['invest', 'maintain', 'maintain', 'contain'], index);
    const criticality = category === 'legacy sunset' ? stablePick(['high', 'medium', 'medium', 'low'], index) : stablePick(['critical', 'high', 'high', 'medium', 'medium', 'low'], index);
    const dataclass = ['clinical core', 'imaging diagnostics', 'revenue cycle', 'population health', 'research clinical trials', 'patient experience'].includes(category) ? 'phi' : stablePick(['confidential', 'internal'], index);
    apps.push({
      app_id: appIdFromName(name),
      name,
      vendor,
      category,
      business_owner: stablePick(['CDIO', 'CMIO', 'CFO', 'COO', 'CISO', 'CHRO', 'Chief Experience Officer'], index),
      it_owner: team,
      deployment: stablePick(['cloud', 'on_prem', 'hybrid', 'managed_service'], index),
      lifecycle_stage: lifecycle,
      criticality,
      run_cost_fy25_usd: 120000 + ((index + existing) % 17) * 85000 + (criticality === 'critical' ? 540000 : 0),
      primary_dataclass: dataclass,
      integration_count: 4 + ((index + existing) % 29),
      last_modernization_review: `2025-${String(((index + existing) % 12) + 1).padStart(2, '0')}-20`,
      ai_eligibility_score: Number((category.includes('clinical') || category.includes('revenue') || category.includes('population') ? 0.52 + ((index % 7) * 0.05) : 0.18 + ((index % 9) * 0.04)).toFixed(2)),
      notes: `${category} substrate row for Meridian Health; owner ${team}; review evidence lives in Discovery Kit source files.`,
    });
    existing += 1;
    index += 1;
  }
}

const currentCost = apps.reduce((sum, app) => sum + Number(app.run_cost_fy25_usd), 0);
let delta = 172000000 - currentCost;
for (let i = 0; delta !== 0 && i < apps.length * 4; i += 1) {
  const app = apps[i % apps.length];
  const bump = Math.min(Math.abs(delta), i < 8 ? 1000000 : 250000) * Math.sign(delta);
  app.run_cost_fy25_usd += bump;
  delta -= bump;
}

writeCsv('01-portfolio/application-portfolio.csv', appHeaders, apps);

const requiredInitiatives = [
  ['MR-01', 'Ambient clinical documentation expansion', 'active', 'CMIO', 'Nuance/Microsoft|Abridge', 8500000, 17400000, 'Aligned', 'Scale', 'Clinicians using ambient note capture report strong satisfaction but opt-out pockets remain by specialty.'],
  ['MR-02', 'Epic Cosmos and Healthy Planet high-risk panel surfacing', 'active', 'CMO', 'Epic|Innovaccer', 4200000, 9100000, 'Healthy', 'Pilot', 'Panel-surfacing model tied to ACO care-gap closure and risk coding accuracy.'],
  ['MR-03', 'Revenue integrity AI charge capture and denials prediction', 'active', 'CFO', 'Optum|Waystar|Epic', 6100000, 15800000, 'Watch', 'Pilot', 'CFO wants verified recoveries before scale; denials data quality varies by payer.'],
  ['MR-04', 'ED throughput optimization and queue prediction', 'active', 'COO', 'Epic|Visicu', 3800000, 7900000, 'Aligned', 'Plan', 'Throughput value depends on workflow adoption, not model precision alone.'],
  ['MR-05', 'Patient digital front door rewrite', 'active', 'CDIO', 'Epic|Luma|Twilio', 7200000, 12600000, 'Healthy', 'Scale', 'MyChart and Luma consolidation is board-visible patient-access work.'],
  ['MR-06', 'M365 Copilot Enterprise rollout non-clinical', 'active', 'CDIO', 'Microsoft', 4900000, 6500000, 'Aligned', 'Pilot', 'Non-clinical productivity pilot gated by adoption telemetry and information-protection settings.'],
  ['MR-07', 'Sunquest LIS decommission and Beaker consolidation', 'active', 'CIO ops', 'Epic|Sunquest|Deloitte', 11800000, 14200000, 'Watch', 'Run', 'Mercy and Sutter legacy LIS dependencies still block final retirement.'],
  ['MR-08', 'Workforce AI scheduling', 'active', 'CHRO', 'QGenda|UKG', 3600000, 7100000, 'Healthy', 'Pilot', 'Nurse predictive staffing could reduce premium labor but needs workforce trust.'],
  ['MR-09', 'Pop health value-based AI', 'active', 'VP VBC', 'Innovaccer|Epic', 5600000, 13200000, 'Watch', 'Scale', 'ACO benefit is plausible but attribution and intervention ownership need tightening.'],
  ['MR-10', 'Imaging AI triage vendor selection', 'active', 'Chief Radiologist', 'Aidoc|Rad AI|Visage', 2700000, 5100000, 'Plan', 'Plan', 'Radiology wants stroke and chest triage but CISO requires model-risk gating.'],
  ['MR-11', 'HIPAA-grade GenAI workload platform selection', 'active', 'CISO', 'Microsoft|AWS|Google|NVIDIA', 3200000, 8200000, 'Plan', 'Plan', 'Platform decision must settle BAA coverage, prompt logging, and exit economics.'],
  ['MR-12', 'CMS Interoperability and Prior Authorization compliance', 'active', 'CDIO', 'Epic|MuleSoft|Deloitte', 6900000, 9400000, 'Aligned', 'Build', 'CMS-0057 deadline creates non-discretionary integration and governance work.'],
  ['MR-13', 'Legacy AP and Lawson residual decommission', 'active', 'CFO', 'Workday|Infor|KPMG', 2100000, 4300000, 'Watch', 'Run', 'Residual Lawson extracts keep AP reconciliation fragile.'],
  ['MR-14', 'Patient communications consolidation', 'active', 'Chief Experience Officer', 'Luma|Twilio|RelateCare', 2500000, 3600000, 'Plan', 'Plan', 'Consolidation could reduce duplicate messaging and contact-center leakage.'],
];

for (let i = 15; i <= 28; i += 1) {
  requiredInitiatives.push([
    `MR-${String(i).padStart(2, '0')}`,
    stablePick([
      'Data governance operating model',
      'Research AI secure enclave',
      'Supply-chain resilience analytics',
      'Cyber recovery tabletop automation',
      'Clinical documentation quality dashboard',
      'HIE modernization',
      'Cloud FinOps for clinical workloads',
      'Payer prior-auth automation',
      'Device inventory and biomedical integration',
      'In-basket response quality guardrails',
      'Identity lifecycle automation',
      'Revenue-cycle vendor rationalization',
      'Nursing command-center pilot',
      'Clinical trial matching pilot',
    ], i - 15),
    'active',
    stablePick(['CDIO', 'CISO', 'CFO', 'CMIO', 'COO', 'VP Research'], i),
    stablePick(['Microsoft|Epic', 'Deloitte|ServiceNow', 'Innovaccer|Epic', 'CrowdStrike|Zscaler', 'Workday|QGenda'], i),
    1200000 + (i * 185000),
    2800000 + (i * 320000),
    stablePick(['Healthy', 'Aligned', 'Watch', 'Plan'], i),
    stablePick(['Pilot', 'Build', 'Plan', 'Scale', 'Run'], i),
    'Second-tier initiative included to give Sentinel breadth across security, research, data, and operations.',
  ]);
}

const initiativeHeaders = ['initiative_id', 'title', 'status', 'accountable', 'vendors', 'committed_usd', 'projected_value_usd', 'sentinel_posture', 'stage', 'evidence_note'];
writeCsv('01-portfolio/initiatives-active.csv', initiativeHeaders, requiredInitiatives.map(([initiative_id, title, status, accountable, vendors, committed_usd, projected_value_usd, sentinel_posture, stage, evidence_note]) => ({
  initiative_id, title, status, accountable, vendors, committed_usd, projected_value_usd, sentinel_posture, stage, evidence_note,
})));

writeCsv('01-portfolio/initiatives-closed.csv', initiativeHeaders, Array.from({ length: 14 }, (_, index) => ({
  initiative_id: `MR-CLOSED-${String(index + 1).padStart(2, '0')}`,
  title: stablePick(['Arcadia legacy pop-health sunset', 'Lawson migration overrun', 'IBM Watson clinical-decision-support pilot killed', 'Telehealth waiting-room optimization', 'Claims attachment automation', 'Bedside device refresh', 'Clinical data archive migration'], index),
  status: 'closed',
  accountable: stablePick(['CDIO', 'CFO', 'CMIO', 'COO'], index),
  vendors: stablePick(['Epic|Innovaccer', 'Workday|Infor', 'IBM', 'Amwell', 'Change Healthcare', 'Cisco', 'Pure Storage'], index),
  committed_usd: 600000 + index * 175000,
  projected_value_usd: index % 5 === 0 ? 0 : 900000 + index * 210000,
  sentinel_posture: index < 3 ? 'Failed' : stablePick(['Landed', 'Closed Healthy', 'Closed With Lessons'], index),
  stage: 'Closed',
  evidence_note: index < 3 ? 'Explicit closed failure used for calibration.' : 'Closed initiative used for outcome calibration.',
})));

const teamHeaders = ['team_id', 'team_name', 'team_type', 'stack_focus', 'vp_owner', 'fte_count'];
writeCsv('03-org/teams.csv', teamHeaders, teamDefs.map(([team_id, team_name, team_type, stack_focus, vp_owner, fte_count]) => ({
  team_id, team_name, team_type, stack_focus, vp_owner, fte_count,
})));

const roles = [];
const roleFamilies = ['analyst', 'engineer', 'app_specialist', 'security_engineer', 'data_engineer', 'service_desk', 'product_manager', 'clinical_informaticist'];
let roleIndex = 1;
for (const [team_id, , , , , fte] of teamDefs) {
  for (let i = 0; i < fte; i += 1) {
    roles.push({
      person_key: `MR-ROLE-${String(roleIndex).padStart(4, '0')}`,
      team_id,
      role_family: stablePick(roleFamilies, roleIndex),
      employment_type: roleIndex % 9 === 0 ? 'contractor' : 'fte',
      level: stablePick(['L1', 'L2', 'L3', 'L4', 'director'], roleIndex),
      location: stablePick(['Sacramento', 'Roseville', 'Oakland', 'Remote CA', 'Hybrid'], roleIndex),
    });
    roleIndex += 1;
  }
}
writeCsv('03-org/roles.csv', ['person_key', 'team_id', 'role_family', 'employment_type', 'level', 'location'], roles);
writeCsv('03-org/leadership-bench.csv', ['leader_id', 'name', 'role', 'team_id', 'hire_date', 'prior_employer', 'span'], Array.from({ length: 38 }, (_, index) => ({
  leader_id: `MR-LEADER-${String(index + 1).padStart(2, '0')}`,
  name: `Meridian Leader ${index + 1}`,
  role: stablePick(['VP', 'Senior Director', 'Director', 'Associate VP'], index),
  team_id: stablePick(teamDefs.map((team) => team[0]), index),
  hire_date: `20${10 + (index % 15)}-${String((index % 12) + 1).padStart(2, '0')}-01`,
  prior_employer: stablePick(['Kaiser Permanente', 'Sutter Health', 'UC Davis Health', 'Providence', 'Microsoft Healthcare', 'Epic Systems'], index),
  span: 18 + (index % 75),
})));
writeCsv('03-org/spans-of-control.csv', ['team_id', 'leader_role', 'direct_reports', 'manager_layers', 'notes'], teamDefs.map(([team_id, , , , vp_owner, fte], index) => ({
  team_id,
  leader_role: vp_owner,
  direct_reports: Math.max(4, Math.round(fte / 18)),
  manager_layers: 2 + (index % 3),
  notes: 'Span modeled for Meridian synthetic substrate.',
})));

const edgeProtocols = ['HL7v2', 'FHIR', 'REST', 'SFTP', 'MLLP', 'JDBC', 'SOAP', 'Kafka'];
const edges = [];
const hubTargets = apps.filter((app) => app.app_id !== 'MR-APP-EPIC-HYPERSPACE').slice(0, 95);
for (const [index, target] of hubTargets.entries()) {
  edges.push({
    edge_id: `MR-EDGE-${String(edges.length + 1).padStart(3, '0')}`,
    source_app: 'MR-APP-EPIC-HYPERSPACE',
    target_app: target.app_id,
    protocol: stablePick(edgeProtocols, index),
    direction: 'outbound',
    message_type: stablePick(['ADT', 'ORM', 'ORU', 'DFT', 'FHIR Patient', 'Charge', 'Scheduling'], index),
    dataclass: target.primary_dataclass,
    latency_p95_ms: 120 + (index % 30) * 40,
    error_rate_30d: Number((0.001 + (index % 11) * 0.0008).toFixed(4)),
    owner_team: target.it_owner,
    notes: index < 12 ? 'Epic hub edge; part of clinical integration backbone.' : 'Epic hub edge.',
  });
}
function addEdgesFrom(source, count, note) {
  for (let i = 0; i < count; i += 1) {
    let target = apps[(i * 7 + edges.length) % apps.length];
    if (target.app_id === source) {
      target = apps[(i * 7 + edges.length + 1) % apps.length];
    }
    edges.push({
      edge_id: `MR-EDGE-${String(edges.length + 1).padStart(3, '0')}`,
      source_app: source,
      target_app: target.app_id,
      protocol: stablePick(edgeProtocols, i),
      direction: 'outbound',
      message_type: stablePick(['Cost center', 'Invoice', 'Incident', 'Asset', 'Identity', 'FHIR', 'Claims'], i),
      dataclass: target.primary_dataclass,
      latency_p95_ms: 180 + (i % 40) * 35,
      error_rate_30d: Number((0.002 + (i % 13) * 0.0009).toFixed(4)),
      owner_team: target.it_owner,
      notes: note,
    });
  }
}
addEdgesFrom('MR-APP-WORKDAY-FIN', 32, 'Workday financial cost/AP integration.');
addEdgesFrom('MR-APP-SERVICENOW', 26, 'ServiceNow ITSM/HRSD touchpoint.');
addEdgesFrom('MR-APP-SECTRA-PACS', 18, 'Imaging diagnostic integration.');
for (let i = 0; i < 18; i += 1) addEdgesFrom(stablePick(['MR-APP-EPIC-HYPERSPACE', 'MR-APP-MYCHART', 'MR-APP-HEALTHY-PLANET'], i), 1, 'State HIE, registry, immunization, or public-health reporting edge.');
for (let i = 0; i < 4; i += 1) addEdgesFrom('MR-APP-CHANGE-CHC', 1, stablePick(['Anthem payer edge', 'Blue Shield CA payer edge', 'Aetna payer edge', 'Centene CalAIM payer edge'], i));
while (edges.length < 380) addEdgesFrom(apps[edges.length % apps.length].app_id, 1, edges.length % 17 < 12 ? 'Point-to-point integration; risk high for legacy dependencies.' : 'Standard portfolio integration.');
writeFile('01-portfolio/integration-topology.json', JSON.stringify({
  tenant_id: tenantId,
  generated_at: '2026-05-25',
  kill_blocker_summary: {
    'MR-APP-SUNQUEST-MERCY': { blocker_count: 6, downstream_consumers: ['MR-APP-BEAKER', 'MR-APP-EPIC-HYPERSPACE', 'MR-APP-RESOLUTE-HB', 'MR-APP-MYCHART', 'MR-APP-HEALTHY-PLANET', 'MR-APP-CHANGE-CHC'] },
    'MR-APP-SUNQUEST-SUTTER': { blocker_count: 5, downstream_consumers: ['MR-APP-BEAKER', 'MR-APP-EPIC-HYPERSPACE', 'MR-APP-RESOLUTE-PB', 'MR-APP-MYCHART', 'MR-APP-COGITO'] },
    'MR-APP-LAWSON-HCM': { blocker_count: 4, downstream_consumers: ['MR-APP-WORKDAY-HCM', 'MR-APP-WORKDAY-FIN', 'MR-APP-UKG-KRONOS', 'MR-APP-SERVICENOW'] },
  },
  edges,
}, null, 2));

writeCsv('02-financial/run-cost-by-application.csv', ['app_id', 'fy25_actual_usd', 'fy26_budget_usd', 'cost_basis', 'owner'], apps.map((app) => ({
  app_id: app.app_id,
  fy25_actual_usd: app.run_cost_fy25_usd,
  fy26_budget_usd: Math.round(app.run_cost_fy25_usd * (1.035 + (app.ai_eligibility_score > 0.7 ? 0.025 : 0))),
  cost_basis: 'finance workbook allocation plus vendor contract mapping',
  owner: app.business_owner,
})));

const vendors = ['Epic', 'Workday', 'Microsoft', 'Innovaccer', 'Nuance/Microsoft', 'Abridge', 'Suki', 'Augmedix', 'Sectra', 'Visage Imaging', 'GE Healthcare', 'Philips', 'Tempus', 'Optum', 'Change Healthcare', 'Symplr', 'QGenda', 'HealthStream', 'Press Ganey', 'Luma Health', 'Twilio', 'ServiceNow', 'Splunk', 'CrowdStrike', 'Zscaler', 'Okta', 'AWS', 'Azure', 'Confluent', 'Cribl', 'Pure Storage', 'Cisco', 'VMware', 'Citrix', 'Deloitte', 'KPMG', 'Cognizant', 'Pythian', 'Tegria', 'Caradigm', 'Waystar', 'Experian Health', 'Phreesia', 'Advarra', 'Roche', 'Aidoc', 'Rad AI', 'Stryker', 'Spok', 'Hippocratic AI'];
writeCsv('04-vendors/vendor-contracts.csv', ['vendor', 'type', 'annual_usd', 'renewal_date', 'owner', 'data_class', 'ai_usage_clauses', 'exit_terms', 'notes'], vendors.map((vendor, index) => ({
  vendor,
  type: stablePick(['license', 'managed_service', 'saas', 'clinical_platform', 'advisory'], index),
  annual_usd: [28500000, 11200000, 17600000, 5700000, 8400000][index] ?? (450000 + index * 185000),
  renewal_date: `2026-${String((index % 12) + 1).padStart(2, '0')}-${String(10 + (index % 18)).padStart(2, '0')}`,
  owner: stablePick(['CDIO', 'CFO', 'CISO', 'CMIO', 'Chief Radiologist', 'VP VBC'], index),
  data_class: index % 3 === 0 ? 'confidential' : 'phi',
  ai_usage_clauses: index % 4 === 0 ? 'requires_baa_and_prompt_logging_limits' : 'standard_baa_or_dpa',
  exit_terms: index % 5 === 0 ? '90_day_module_removal_with_transition_support' : 'standard_annual_renewal_notice',
  notes: index < 11 ? 'Renewal pressure: next six months.' : 'Meridian healthcare vendor substrate contract.',
})));
writeCsv('04-vendors/infrastructure-contracts.csv', ['vendor', 'service', 'annual_usd', 'renewal_date', 'owner', 'notes'], Array.from({ length: 14 }, (_, index) => ({
  vendor: stablePick(['KPMG', 'Deloitte', 'Cognizant', 'Pythian', 'Tegria', 'Caradigm', 'CDW', 'World Wide Technology', 'SHI', 'Sirius Healthcare'], index),
  service: stablePick(['advisory', 'ehr_optimization', 'infra_ops', 'database_managed_service', 'revenue_cycle_ops', 'population_analytics', 'network_services'], index),
  annual_usd: 900000 + index * 425000,
  renewal_date: `2026-${String(((index + 4) % 12) + 1).padStart(2, '0')}-28`,
  owner: stablePick(['CDIO', 'CFO', 'CISO', 'COO'], index),
  notes: 'Infrastructure or managed-service contract in Meridian substrate.',
})));
writeCsv('04-vendors/vendor-scorecards.csv', ['vendor', 'relationship_health', 'delivery_score', 'commercial_risk', 'security_posture', 'notes'], vendors.map((vendor, index) => ({
  vendor,
  relationship_health: stablePick(['green', 'amber', 'green', 'red'], index),
  delivery_score: 62 + (index % 34),
  commercial_risk: stablePick(['low', 'medium', 'medium', 'high'], index),
  security_posture: stablePick(['baa_current', 'baa_review', 'dpa_only', 'needs_prompt_logging_review'], index),
  notes: 'Scorecard created for Packet 19 Meridian substrate.',
})));

writeCsv('02-financial/renewal-calendar.csv', ['vendor', 'renewal_date', 'annual_usd', 'pressure_window', 'negotiation_notes'], vendors.slice(0, 45).map((vendor, index) => ({
  vendor,
  renewal_date: `2026-${String((index % 12) + 1).padStart(2, '0')}-15`,
  annual_usd: 500000 + index * 210000,
  pressure_window: index < 11 ? 'next_6_months' : index < 30 ? 'next_12_months' : 'next_18_months',
  negotiation_notes: 'Renewal pressure seeded for Sentinel sourcing analysis.',
})));
writeCsv('02-financial/initiative-commitments.csv', ['initiative_id', 'quarter', 'committed_usd', 'projected_value_usd', 'basis'], requiredInitiatives.flatMap((row) => ['2026Q1', '2026Q2', '2026Q3', '2026Q4'].map((quarter, quarterIndex) => ({
  initiative_id: row[0],
  quarter,
  committed_usd: Math.round(row[5] / 4) + quarterIndex * 25000,
  projected_value_usd: Math.round(row[6] / 4),
  basis: 'portfolio finance workbook',
}))));
writeCsv('02-financial/capex-opex-summary.csv', ['category', 'fiscal_year', 'amount_usd', 'basis'], ['clinical_apps', 'platform', 'security', 'data_ai', 'corporate', 'managed_services'].flatMap((category, index) => ['FY24', 'FY25', 'FY26'].map((fiscal_year, yearIndex) => ({
  category,
  fiscal_year,
  amount_usd: 19000000 + index * 3800000 + yearIndex * 1700000,
  basis: fiscal_year === 'FY26' ? 'budget' : 'actual',
}))));
writeFile('02-financial/workbook-summary.json', JSON.stringify({ tenant_id: tenantId, sheets: ['Initiative Commitments', 'Annual Run Costs', 'Renewal Calendar', 'Variance to Plan'], total_it_budget_usd: 215000000 }, null, 2));
writeFile('02-financial/workbooks/annual-budget.xlsx', makePseudoXlsx('annual-budget', { apps: apps.length, budget: 215000000 }));
writeFile('02-financial/workbooks/renewal-pipeline.xlsx', makePseudoXlsx('renewal-pipeline', { vendors: 45, nextSixMonths: 11 }));

writeCsv('05-dora/dora-baseline.csv', ['team_id', 'measured_at', 'deploy_freq_per_week', 'lead_time_hours', 'mttr_hours', 'change_failure_rate_pct', 'reliability_pct'], teamDefs.slice(0, 14).flatMap((team, teamIndex) => Array.from({ length: 6 }, (_, week) => ({
  team_id: team[0],
  measured_at: isoWeek(week),
  deploy_freq_per_week: Number((0.4 + (teamIndex % 5) * 0.6 + week * 0.05).toFixed(2)),
  lead_time_hours: 18 + (teamIndex % 9) * 12 - week,
  mttr_hours: 2 + (teamIndex % 7) * 1.5,
  change_failure_rate_pct: Number((4 + (teamIndex % 6) * 1.2).toFixed(1)),
  reliability_pct: Number((98.9 - (teamIndex % 5) * 0.22).toFixed(2)),
}))));

writeCsv('06-devex/devex-survey-fy25.csv', ['quarter', 'cohort', 'respondents', 'flow_score_0_10', 'tool_satisfaction_0_10', 'ai_helpfulness_0_10', 'notes'], ['2025Q1', '2025Q2', '2025Q3', '2025Q4'].flatMap((quarter) => Array.from({ length: 12 }, (_, index) => ({
  quarter,
  cohort: stablePick(['Epic clinical', 'Revenue cycle', 'Platform', 'Security', 'Data AI', 'Digital', 'PMO', 'Service desk', 'Imaging', 'Research', 'Corporate', 'Integration'], index),
  respondents: 24 + index * 3,
  flow_score_0_10: Number((5.2 + (index % 5) * 0.4).toFixed(1)),
  tool_satisfaction_0_10: Number((5.8 + (index % 4) * 0.45).toFixed(1)),
  ai_helpfulness_0_10: Number((4.5 + (index % 6) * 0.5).toFixed(1)),
  notes: 'Synthetic DevEx baseline for Meridian Packet 19.',
}))));

const aiTools = [
  ['DAX Copilot', 'Nuance/Microsoft', 'Ambient documentation', 'Scale', 1400],
  ['Abridge', 'Abridge', 'Ambient specialty pilot', 'Pilot', 180],
  ['Suki', 'Suki AI', 'Ambient limited pilot', 'Pilot', 90],
  ['Epic Art', 'Epic', 'In-basket draft replies', 'Scale', 2100],
  ['Epic Cosmos', 'Epic', 'Cohort and research insights', 'Pilot', 220],
  ['Innovaccer Copilot', 'Innovaccer', 'Care manager workflows', 'Pilot', 340],
  ['Microsoft 365 Copilot E5', 'Microsoft', 'Non-clinical productivity', 'Scale', 4200],
  ['GitHub Copilot Business', 'Microsoft', 'Developer productivity', 'Scale', 420],
  ['Glean', 'Glean', 'Enterprise search', 'Pilot', 600],
  ['Notion AI', 'Notion', 'Documentation', 'Pilot', 180],
  ['Hippocratic AI', 'Hippocratic AI', 'Patient outreach', 'Paused', 0],
  ['Augmedix', 'Augmedix', 'Ambient legacy contract', 'Wind-down', 40],
  ['ChatGPT Enterprise', 'OpenAI', 'Researcher allowance', 'Pilot', 80],
  ['Azure OpenAI gpt-4o', 'Microsoft', 'Internal RAG', 'Build', 25],
  ['Visage 7 AI overlays', 'Visage', 'Imaging AI viewer', 'Scale', 95],
  ['Aidoc stroke triage', 'Aidoc', 'Imaging AI', 'Pilot', 12],
  ['Rad AI', 'Rad AI', 'Report impressions', 'Pilot', 8],
  ['Stryker Mako planning', 'Stryker', 'OR planning', 'Scale', 60],
];
writeCsv('07-ai-tools/ai-tool-footprint.csv', ['tool', 'vendor', 'use_case', 'status', 'users', 'data_class', 'policy_notes'], aiTools.map(([tool, vendor, use_case, status, users], index) => ({
  tool, vendor, use_case, status, users, data_class: index < 6 || index > 13 ? 'phi' : 'confidential', policy_notes: 'HIPAA/BAA and model-risk review required for clinical use.',
})));
writeCsv('07-ai-tools/ai-usage-telemetry.csv', ['tool', 'month', 'weekly_active_users', 'minutes_saved', 'satisfaction_0_10'], aiTools.flatMap(([tool, , , , users], index) => Array.from({ length: 6 }, (_, monthIndex) => ({
  tool,
  month: `2025-${String(monthIndex + 7).padStart(2, '0')}`,
  weekly_active_users: Math.round(users * (0.35 + monthIndex * 0.08)),
  minutes_saved: Math.round(users * (12 + monthIndex * 2 + index)),
  satisfaction_0_10: Number((6.1 + (index % 4) * 0.35 + monthIndex * 0.08).toFixed(1)),
}))));

writeFile('08-sponsor-signal/sponsor-pulse.jsonl', Array.from({ length: 35 }, (_, index) => JSON.stringify({
  initiative_id: stablePick(requiredInitiatives.map((row) => row[0]), index),
  sponsor_role: stablePick(['CDIO', 'CMIO', 'CFO', 'CISO', 'COO', 'CHRO'], index),
  last_status_update_days_ago: 3 + (index % 45),
  meetings_held_last_quarter: 1 + (index % 5),
  meetings_cancelled_last_quarter: index % 4,
  engagement_self_score_0_10: 5 + (index % 6),
  notes: 'Sponsor pulse substrate for Meridian Packet 19.',
})).join('\n') + '\n');

writeCsv('10-incidents-changes/incidents.csv', ['incident_id', 'opened_at', 'severity', 'affected_app_id', 'mttr_hours', 'root_cause', 'notes'], Array.from({ length: 90 }, (_, index) => ({
  incident_id: `MR-INC-${String(index + 1).padStart(3, '0')}`,
  opened_at: `2026-02-${String((index % 28) + 1).padStart(2, '0')}`,
  severity: stablePick(['sev1', 'sev2', 'sev3', 'sev3'], index),
  affected_app_id: apps[index % apps.length].app_id,
  mttr_hours: Number((1.5 + (index % 12) * 0.75).toFixed(2)),
  root_cause: stablePick(['interface_error', 'vendor_change', 'certificate_expiry', 'capacity', 'workflow_config'], index),
  notes: '90-day incident sample.',
})));
writeCsv('10-incidents-changes/changes.csv', ['change_id', 'implemented_at', 'team_id', 'affected_app_id', 'risk', 'outcome', 'notes'], Array.from({ length: 180 }, (_, index) => ({
  change_id: `MR-CHG-${String(index + 1).padStart(3, '0')}`,
  implemented_at: `2026-02-${String((index % 28) + 1).padStart(2, '0')}`,
  team_id: stablePick(teamDefs.map((team) => team[0]), index),
  affected_app_id: apps[(index * 3) % apps.length].app_id,
  risk: stablePick(['low', 'medium', 'high'], index),
  outcome: stablePick(['successful', 'successful', 'rollback', 'incident_linked'], index),
  notes: '90-day change sample.',
})));

writeCsv('11-regulatory/hipaa-controls.csv', ['control_id', 'domain', 'maturity', 'owner', 'evidence_source'], Array.from({ length: 54 }, (_, index) => ({
  control_id: `HIPAA-${String(index + 1).padStart(2, '0')}`,
  domain: stablePick(['administrative', 'physical', 'technical', 'breach_notification', 'vendor_management'], index),
  maturity: stablePick(['managed', 'defined', 'optimized', 'needs_evidence'], index),
  owner: stablePick(['CISO', 'Privacy Officer', 'CDIO', 'General Counsel'], index),
  evidence_source: `SRC-REG-${String(index + 1).padStart(2, '0')}`,
})));
writeCsv('11-regulatory/hitrust-mapping.csv', ['hitrust_domain', 'mapped_controls', 'gap_count', 'owner'], Array.from({ length: 18 }, (_, index) => ({
  hitrust_domain: `HITRUST-${String(index + 1).padStart(2, '0')}`,
  mapped_controls: 3 + (index % 7),
  gap_count: index % 4,
  owner: stablePick(['CISO', 'Privacy Officer', 'Security GRC'], index),
})));
writeCsv('11-regulatory/cms-interoperability-checklist.csv', ['requirement_id', 'rule', 'status', 'owner', 'notes'], Array.from({ length: 24 }, (_, index) => ({
  requirement_id: `CMS-${String(index + 1).padStart(2, '0')}`,
  rule: stablePick(['CMS-9115-F', 'CMS-0057'], index),
  status: stablePick(['on_track', 'at_risk', 'evidence_needed'], index),
  owner: stablePick(['CDIO', 'Integration Lead', 'Privacy Officer'], index),
  notes: 'Prior authorization and interoperability checklist item.',
})));
writeCsv('11-regulatory/joint-commission-it-touchpoints.csv', ['touchpoint_id', 'system_area', 'survey_risk', 'evidence_owner'], Array.from({ length: 16 }, (_, index) => ({
  touchpoint_id: `JC-${String(index + 1).padStart(2, '0')}`,
  system_area: stablePick(['downtime procedures', 'medication reconciliation', 'identity access', 'clinical documentation', 'device integration'], index),
  survey_risk: stablePick(['low', 'medium', 'high'], index),
  evidence_owner: stablePick(['CMIO', 'CISO', 'COO'], index),
})));
writeCsv('11-regulatory/information-blocking-attestations.csv', ['attestation_id', 'scope', 'status', 'owner'], Array.from({ length: 12 }, (_, index) => ({
  attestation_id: `IB-${String(index + 1).padStart(2, '0')}`,
  scope: stablePick(['patient access', 'API access', 'provider directory', 'payer exchange'], index),
  status: stablePick(['signed', 'pending_review', 'evidence_needed'], index),
  owner: stablePick(['General Counsel', 'CDIO', 'Privacy Officer'], index),
})));

writeCsv('12-benchmarks/kaufman-hall-it-spend-quartiles.csv', ['metric', 'meridian_value', 'peer_p50', 'peer_p75', 'notes'], [
  ['IT spend as pct NPR', '4.5%', '4.1%', '4.8%', 'Meridian slightly above median due clinical AI and Epic modernization'],
  ['Apps per staffed bed', '0.099', '0.083', '0.104', 'Portfolio complexity above median'],
  ['Vendor spend concentration top 5', '37%', '33%', '42%', 'Renewal pressure manageable but visible'],
].map(([metric, meridian_value, peer_p50, peer_p75, notes]) => ({ metric, meridian_value, peer_p50, peer_p75, notes })));
writeCsv('12-benchmarks/klas-arch-research-medians.csv', ['domain', 'meridian_position', 'median', 'notes'], [
  ['ambient documentation', 'pilot_plus_scale', 'pilot', 'Above median adoption, opt-out issue remains'],
  ['cloud AI platform', 'selection', 'selection', 'Median but needs HIPAA/BAA hardening'],
  ['population health AI', 'scale_with_gaps', 'pilot', 'Above median but value proof still weak'],
].map(([domain, meridian_position, median, notes]) => ({ domain, meridian_position, median, notes })));
writeCsv('12-benchmarks/chime-most-wired-attestation.csv', ['dimension', 'attested_level', 'evidence_source', 'notes'], Array.from({ length: 10 }, (_, index) => ({
  dimension: stablePick(['analytics', 'population health', 'patient engagement', 'security', 'infrastructure'], index),
  attested_level: stablePick(['level_8', 'level_9', 'level_7'], index),
  evidence_source: `SRC-BENCH-${String(index + 1).padStart(2, '0')}`,
  notes: 'Synthetic Most Wired attestation evidence row.',
})));

const sourceRows = Array.from({ length: 48 }, (_, index) => ({
  source_file_id: `MR-SRC-${String(index + 1).padStart(3, '0')}`,
  title: stablePick(['CIO 30-60-90 memo', 'CMIO ambient documentation playbook', 'CFO renewal calendar workbook', 'Board pack excerpt', 'Joint Commission readiness note', 'HIMSS Most Wired attestation', 'CalAIM contract excerpt', 'CISO AI platform policy'], index) + ` ${index + 1}`,
  instrument: stablePick(['interview', 'workbook', 'contract_extract', 'charter', 'survey', 'regulatory_checklist'], index),
  dataclass: index % 3 === 0 ? 'confidential' : 'internal',
  last_updated: `2026-0${(index % 5) + 1}-15`,
  depth_score: 8 + (index % 3),
}));
writeCsv('13-context/enterprise-context-source-files.csv', ['source_file_id', 'title', 'instrument', 'dataclass', 'last_updated', 'depth_score'], sourceRows);
for (const row of sourceRows) {
  writeFile(`13-context/source-files/${row.source_file_id}.md`, `# ${row.title}

Tenant: Meridian Health System
Source file: ${row.source_file_id}
Data class: ${row.dataclass}

This synthetic Discovery Kit source describes Meridian Health System evidence
for ${row.instrument}. It grounds clinical, financial, regulatory, and
technology facts used by Sentinel. It mentions Epic, Workday, MyChart, Luma,
Sectra, Visage, Sunquest decommission dependencies, HIPAA, CMS-0057, ambient
documentation adoption, and renewal pressure.
`);
}
writeFile('13-context/client-data-corpus.jsonl', Array.from({ length: 320 }, (_, index) => {
  const source = sourceRows[index % sourceRows.length];
  const app = apps[index % apps.length];
  const initiative = requiredInitiatives[index % requiredInitiatives.length];
  return JSON.stringify({
    id: `MR-CHUNK-${String(index + 1).padStart(3, '0')}`,
    source_file_id: source.source_file_id,
    tenant_id: tenantId,
    title: `${source.title} chunk ${index + 1}`,
    text: `Meridian Health System evidence chunk ${index + 1}: ${app.name} (${app.app_id}) is owned by ${app.business_owner}, run cost $${app.run_cost_fy25_usd}, dataclass ${app.primary_dataclass}. Initiative ${initiative[0]} ${initiative[1]} has posture ${initiative[7]} and stage ${initiative[8]}. Use this for tenant-grounded Sentinel answers; do not import retail facts.`,
    dataclass: source.dataclass,
    last_updated: source.last_updated,
    depth_score: 8 + (index % 3),
  });
}).join('\n') + '\n');

for (let i = 0; i < 32; i += 1) {
  const vendor = vendors[i % vendors.length];
  writeFile(`04-vendors/contract-pdfs/${vendor.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-meridian-contract.pdf`, makePdf(`Meridian ${vendor} synthetic contract`, [
    `Annual value ${500000 + i * 210000}`,
    `Renewal 2026-${String((i % 12) + 1).padStart(2, '0')}-15`,
    'BAA and HIPAA obligations included where applicable',
    i % 5 === 0 ? 'Exit clause: 90 day module removal' : 'Exit clause: annual notice',
  ]));
}
for (let i = 0; i < 12; i += 1) {
  const initiative = requiredInitiatives[i];
  writeFile(`09-charters/charter-pdfs/${initiative[0].toLowerCase()}-${initiative[1].toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`, makePdf(`Meridian ${initiative[0]} Wave 0 Charter`, [
    initiative[1],
    `Sponsor ${initiative[3]}`,
    `Committed ${initiative[5]}`,
    'Sections include scope, value, risks, RACI, kill criteria, and evidence chain',
  ]));
}

const expectedQuestions = [
  ['q01-prioritize-ai', 'As CDIO, what AI investments should we prioritize for the next two quarters?', ['MR-APP-MYCHART', 'MR-APP-INNOVACCER', 'MR-APP-M365-E5'], ['MR-01', 'MR-03', 'MR-11']],
  ['q02-genai-platform-hipaa', 'How do we de-risk a GenAI workload platform decision under HIPAA?', ['MR-APP-AZURE', 'MR-APP-OKTA', 'MR-APP-SPLUNK'], ['MR-11', 'MR-12']],
  ['q03-application-portfolio', 'Walk me through our application portfolio.', ['MR-APP-EPIC-HYPERSPACE', 'MR-APP-WORKDAY-FIN', 'MR-APP-SECTRA-PACS', 'MR-APP-SUNQUEST-MERCY'], ['MR-07']],
  ['q04-kill-initiatives', 'Which initiatives should we kill this quarter?', ['MR-APP-LAWSON-HCM', 'MR-APP-CHANGE-CHC'], ['MR-13', 'MR-10']],
  ['q05-lis-blockers', 'What blocks killing the legacy LIS at the Mercy and Sutter sites?', ['MR-APP-SUNQUEST-MERCY', 'MR-APP-SUNQUEST-SUTTER', 'MR-APP-BEAKER'], ['MR-07']],
  ['q06-renewal-pressure', "What's the FY26 renewal pressure and which renewals are most exposed?", ['MR-APP-M365-E5', 'MR-APP-SECTRA-PACS'], ['MR-11']],
  ['q07-ambient-doc', 'Where is ambient documentation working vs. where is it stuck?', ['MR-APP-EPIC-HYPERSPACE', 'MR-APP-MYCHART'], ['MR-01']],
  ['q08-revenue-integrity', 'How does our revenue-integrity AI bet pencil out against CFO finance pressure?', ['MR-APP-RESOLUTE-HB', 'MR-APP-OPTUM-360'], ['MR-03']],
  ['q09-pop-health', "What's our population-health AI maturity vs. peers?", ['MR-APP-HEALTHY-PLANET', 'MR-APP-INNOVACCER'], ['MR-09']],
  ['q10-cms-0057', 'Where are we exposed on CMS-0057 prior-auth compliance?', ['MR-APP-EPIC-HYPERSPACE', 'MR-APP-CONFLUENT'], ['MR-12']],
  ['q11-integration-topology', 'Map our integration topology — where is the legacy debt concentrated?', ['MR-APP-EPIC-HYPERSPACE', 'MR-APP-SUNQUEST-MERCY', 'MR-APP-LAWSON-HCM'], ['MR-07', 'MR-13']],
  ['q12-ai-cost', "What's our AI cost-to-serve and where is it growing fastest?", ['MR-APP-M365-E5', 'MR-APP-AZURE', 'MR-APP-INNOVACCER'], ['MR-06', 'MR-11']],
  ['q13-sibling-moves', 'What sibling moves should I bundle with the Sunquest decommission?', ['MR-APP-SUNQUEST-MERCY', 'MR-APP-BEAKER', 'MR-APP-COGITO'], ['MR-07', 'MR-12']],
  ['q14-30-60-90', 'CDIO 30-60-90 plan synthesis given current substrate.', ['MR-APP-EPIC-COSMOS', 'MR-APP-MYCHART', 'MR-APP-SERVICENOW'], ['MR-01', 'MR-11', 'MR-12']],
];
writeFile('99-verification/expected-sentinel-answers.json', JSON.stringify({
  tenant_id: tenantId,
  pass_threshold: { min_questions_passed: 12, min_weighted_average: 0.8, all_tenant_grounded: true },
  questions: expectedQuestions.map(([id, question, must_cite_apps, must_cite_initiatives]) => ({
    id,
    question,
    intent: id.includes('portfolio') ? 'portfolio_walkthrough' : id.includes('kill') ? 'initiative_kill_review' : 'tenant_grounded_reasoning',
    must_cite_apps,
    must_cite_initiatives,
    forbidden_terms: ['Apex Retail', 'SAP ECC', 'AS-400', 'Punchh', 'Wipro AMS'],
    expected_dissent: ['No broad rollout without owner, value ledger, and HIPAA/BAA evidence.'],
    expected_one_click_action: stablePick(['Shape Move', 'Open Source Event', 'Open Tower Value View', 'Refresh Evidence'], must_cite_apps.length),
  })),
}, null, 2));

writeFile('99-verification/expected-row-counts.json', JSON.stringify({
  application_portfolio: 140,
  integration_edges: 380,
  initiatives_active: 28,
  initiatives_closed: 14,
  teams: 16,
  roles: 1650,
  vendor_contracts: 50,
  infrastructure_contracts: 14,
  renewal_calendar: 45,
  initiative_commitments: 112,
  capex_opex_summary: 18,
  leadership_bench: 38,
  dora_baselines: 84,
  devex_rows: 48,
  ai_tools: 18,
  ai_usage_rows: 108,
  sponsor_pulse: 35,
  incidents: 90,
  changes: 180,
  hipaa_controls: 54,
  context_source_files: 48,
  context_chunks: 320,
  contract_pdfs: 32,
  charter_pdfs: 12,
  expected_sentinel_questions: 14,
  min_pack_files: 125,
  app_run_cost_total_usd: 172000000,
}, null, 2));

writeFile('README.md', `# Meridian Health Synthetic Substrate Pack v1

Synthetic healthcare-vertical substrate for Meridian Health System.

This scaffold mirrors the existing synthetic data-pack shape with Meridian
identity, healthcare systems, HIPAA/CMS regulatory overlays, clinical AI
tooling, application portfolio, vendor contracts, DORA baselines, context
source files, and Sentinel verification targets.

Tenant key: \`meridian\`
Display name: Meridian Health System
`);
writeFile('CHANGELOG.md', `# Changelog

## 2026-05-25

- Added Phase A static scaffold for Packet 19 Meridian Health substrate.
- Authored 140 application rows, 380 integration edges, 28 active initiatives,
  14 closed initiatives, 17 teams, 1,650 roles, 50 vendor contracts, 18 AI
  tools, 320 corpus chunks, and 14 Sentinel verification questions.
- Added cross-tenant forbidden-term guard for Meridian substrate files.
`);

writeFile('manifest.yaml', `version: 1.0.0
tenant: meridian
display_name: Meridian Health System
files:
  - path: 01-portfolio/application-portfolio.csv
    row_count: 140
  - path: 01-portfolio/integration-topology.json
    edge_count: 380
  - path: 01-portfolio/initiatives-active.csv
    row_count: 28
  - path: 01-portfolio/initiatives-closed.csv
    row_count: 14
  - path: 02-financial/run-cost-by-application.csv
    row_count: 140
  - path: 02-financial/renewal-calendar.csv
    row_count: 45
  - path: 03-org/teams.csv
    row_count: 16
  - path: 03-org/roles.csv
    row_count: 1650
  - path: 04-vendors/vendor-contracts.csv
    row_count: 50
  - path: 04-vendors/infrastructure-contracts.csv
    row_count: 14
  - path: 05-dora/dora-baseline.csv
    row_count: 84
  - path: 07-ai-tools/ai-tool-footprint.csv
    row_count: 18
  - path: 13-context/enterprise-context-source-files.csv
    row_count: 48
  - path: 13-context/client-data-corpus.jsonl
    row_count: 320
  - path: 99-verification/expected-sentinel-answers.json
    question_count: 14
checksums:
`);

const checksums = checksumFiles();
fs.appendFileSync(path.join(packRoot, 'manifest.yaml'), checksums.map((entry) => `  - path: ${entry.path}\n    sha256: ${entry.sha256}`).join('\n') + '\n');

console.log(JSON.stringify({
  ok: true,
  packRoot,
  apps: apps.length,
  edges: edges.length,
  roles: roles.length,
  vendors: vendors.length,
  contextChunks: 320,
}, null, 2));

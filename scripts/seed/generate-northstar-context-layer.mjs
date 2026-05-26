import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'datasets/northstar-clinical-tech-synthetic-v1');
const DOC_ROOT = path.resolve(process.cwd(), 'docs/build/northstar');

const dirs = [
  '00-profile',
  '01-financials/reports',
  '02-strategy',
  '03-business-units',
  '04-product-portfolio',
  '05-sites-manufacturing',
  '06-erp-landscape',
  '07-application-portfolio',
  '08-integration-topology',
  '09-vendors-contracts/contracts',
  '10-initiatives',
  '11-org-roles',
  '12-delivery-devex',
  '13-regulatory-qms/artifacts',
  '14-ai-models-tools',
  '15-incidents-ops',
  '16-market-corpus/source-files',
  '17-upload-templates',
  '18-upload-scenarios',
  '19-context-approval',
  '20-evidence-ledger-fixtures',
  '99-verification',
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function write(file, value) {
  const full = path.join(ROOT, file);
  ensureDir(path.dirname(full));
  fs.writeFileSync(full, value);
}

function csv(headers, rows) {
  return [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((header) => {
        const value = row[header] ?? '';
        const text = String(value);
        return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
      }).join(','),
    ),
  ].join('\n') + '\n';
}

function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function money(n) {
  return Math.round(n);
}

ensureDir(ROOT);
for (const dir of dirs) ensureDir(path.join(ROOT, dir));
ensureDir(DOC_ROOT);

const businessUnits = [
  ['BU-AWC', 'Advanced Wound Care + Surgical', 5.2, 18.2],
  ['BU-DENTAL', 'Dental + Orthodontic Solutions', 3.9, 17.1],
  ['BU-HIS', 'Health Information Systems / Coding / CDI', 4.6, 24.8],
  ['BU-STERILE', 'Infection Prevention + Sterilization', 3.2, 15.6],
  ['BU-MONITOR', 'Clinical Monitoring + Connected Devices', 3.4, 12.9],
  ['BU-FILTER', 'Life Sciences Filtration / Bioprocessing', 2.3, 20.4],
];

write('00-profile/enterprise-profile.yaml', `tenant_key: northstar
name: Northstar Clinical Technologies
revenue_usd: 22600000000
employees: 58000
countries: 85
plants: 42
rd_hubs: 14
business_units: 6
it_budget_usd: 1150000000
it_ecosystem_people: 3400
product_software_engineers: 1100
regulatory_scope:
  - FDA QSR
  - ISO 13485
  - EU MDR
  - HIPAA-adjacent
  - SOC 2
  - GxP
  - SOX
strategic_posture: newly independent, margin expansion, ERP simplification, TSA exit, AI product modernization
`);

write('00-profile/README.md', `# Northstar Clinical Technologies

Synthetic pilot substrate for a $22.6B global clinical technology enterprise.
Northstar is a composite medtech and clinical-software company, not a real
company. The pack is designed to show how AbarVa converts uploads, templates,
document extraction, approval, sync, and industry corpus into a trusted context
layer.
`);

const financialRows = [];
for (let q = 1; q <= 4; q += 1) {
  for (const [id, name, revenueB, margin] of businessUnits) {
    financialRows.push({
      period: `FY2025-Q${q}`,
      business_unit_id: id,
      business_unit: name,
      revenue_usd: money(revenueB * 1_000_000_000 / 4 * (0.94 + q * 0.02)),
      gross_margin_pct: (48 + margin / 4).toFixed(1),
      operating_margin_pct: margin.toFixed(1),
      r_and_d_usd: money(revenueB * 1_000_000_000 * 0.045 / 4),
      sg_and_a_usd: money(revenueB * 1_000_000_000 * 0.21 / 4),
      source_report: `FY2025-Q${q} board pack`,
    });
  }
}
write('01-financials/financial-kpi-workbook.csv', csv(Object.keys(financialRows[0]), financialRows));
write('01-financials/segment-pnl-workbook.csv', csv(Object.keys(financialRows[0]), financialRows));

for (const report of ['FY2025_Annual_Report.pdf', 'FY2025_Q1_Board_Pack.pdf', 'FY2025_Q2_Board_Pack.pdf', 'FY2025_Q3_Board_Pack.pdf', 'FY2025_Q4_Board_Pack.pdf']) {
  write(`01-financials/reports/${report}`, `Northstar Clinical Technologies ${report}
Revenue: $22.6B. Adjusted operating margin: 16.9%. IT budget: $1.15B.
TSA exit costs: $126M. Margin expansion target: $250M in run-rate savings.
Segment tables include wound care, dental, HIS, sterilization, monitoring, and filtration.
`);
}

write('02-strategy/CEO_strategy_memo.docx', `Northstar CEO strategy memo.
The board expects post-carveout independence, debt reduction, margin expansion,
TSA exit, regulated AI product modernization, and ERP simplification without
creating FDA or EU MDR evidence gaps.
`);
write('02-strategy/CFO_margin_plan.docx', `CFO margin plan targets $250M run-rate expansion:
$82M ERP/TSA simplification, $64M product portfolio rationalization, $48M
vendor renegotiation, $34M quality release-cycle improvement, $22M engineering productivity.
`);
write('02-strategy/CIO_ERP_TSA_plan.docx', `CIO ERP/TSA plan: hold global S/4 Wave 0 until master-data and TSA identity
exit are de-risked. Prioritize AS/400 rebate retirement, JDE Dental restructure,
and SAP ECC finance stabilization.
`);
write('02-strategy/board-priorities.csv', csv(
  ['priority_id', 'priority', 'owner_role', 'time_horizon', 'board_question'],
  [
    { priority_id: 'NST-BOARD-001', priority: 'Prove independent operating model', owner_role: 'CEO', time_horizon: 'FY2026', board_question: 'Can Northstar exit parent TSAs without disrupting regulated operations?' },
    { priority_id: 'NST-BOARD-002', priority: 'Deliver $250M margin expansion', owner_role: 'CFO', time_horizon: '18 months', board_question: 'Which moves are verified vs projected?' },
    { priority_id: 'NST-BOARD-003', priority: 'Modernize clinical coding AI product', owner_role: 'EVP HIS', time_horizon: '12 months', board_question: 'How do we protect model-risk and auditability?' },
  ],
));

write('03-business-units/business-units.csv', csv(
  ['business_unit_id', 'name', 'revenue_b', 'operating_margin_pct', 'president_role'],
  businessUnits.map(([id, name, revenueB, margin]) => ({
    business_unit_id: id,
    name,
    revenue_b: revenueB,
    operating_margin_pct: margin,
    president_role: `President ${name}`,
  })),
));

const productRows = [];
const skuRows = [];
for (let i = 1; i <= 180; i += 1) {
  const bu = businessUnits[i % businessUnits.length];
  const productFamilyId = `NST-PF-${String(i).padStart(3, '0')}`;
  productRows.push({
    product_family_id: productFamilyId,
    business_unit_id: bu[0],
    name: `${bu[1]} Product Family ${i}`,
    revenue_usd: money(18_000_000 + i * 2_150_000),
    margin_pct: (12 + (i % 22)).toFixed(1),
    lifecycle_state: i % 11 === 0 ? 'rationalize' : i % 7 === 0 ? 'mature' : 'grow',
    regulatory_burden: i % 5 === 0 ? 'high' : 'medium',
    plant_dependency: `NST-PLANT-${String((i % 42) + 1).padStart(2, '0')}`,
  });
  for (let s = 1; s <= 7 && skuRows.length < 1200; s += 1) {
    skuRows.push({
      sku_group_id: `NST-SKU-${String(skuRows.length + 1).padStart(4, '0')}`,
      product_family_id: productFamilyId,
      business_unit_id: bu[0],
      revenue_usd: money(1_200_000 + s * 115_000 + i * 5000),
      margin_pct: (8 + ((i + s) % 28)).toFixed(1),
      lifecycle_state: s % 6 === 0 ? 'sunset_candidate' : 'active',
    });
  }
}
write('04-product-portfolio/product-portfolio.csv', csv(Object.keys(productRows[0]), productRows));
write('04-product-portfolio/sku-product-groups.csv', csv(Object.keys(skuRows[0]), skuRows));

const siteRows = [];
const countries = ['US', 'DE', 'IE', 'MX', 'CN', 'JP', 'SG', 'BR', 'FR', 'GB', 'IN', 'CA'];
for (let i = 1; i <= 42; i += 1) {
  siteRows.push({
    site_id: `NST-PLANT-${String(i).padStart(2, '0')}`,
    country: countries[i % countries.length],
    business_unit_id: businessUnits[i % businessUnits.length][0],
    primary_system: ['Siemens Opcenter', 'Rockwell FactoryTalk', 'Werum PAS-X', 'Custom historian'][i % 4],
    validated_system_flag: i % 3 !== 0,
    quality_cost_usd: money(2_000_000 + i * 275_000),
    capacity_utilization_pct: 61 + (i % 32),
    plant_vp: `VP Manufacturing Site ${i}`,
  });
}
write('05-sites-manufacturing/site-and-plant-inventory.csv', csv(Object.keys(siteRows[0]), siteRows));

const erpPlatforms = ['SAP ECC 6.0', 'SAP S/4HANA pilot', 'Oracle EBS', 'JD Edwards', 'Infor LN', 'Dynamics AX', 'AS/400 RPG', 'Mainframe batch'];
const erpRows = [];
for (let i = 1; i <= 152; i += 1) {
  erpRows.push({
    erp_object_id: `NST-ERP-${String(i).padStart(3, '0')}`,
    platform: erpPlatforms[i % erpPlatforms.length],
    process_area: ['Finance close', 'Manufacturing', 'Order management', 'Rebates', 'Quality release', 'Procurement', 'Distributor pricing'][i % 7],
    owner_role: i % 17 === 0 ? '' : `Process Owner ${i % 28}`,
    business_unit_id: businessUnits[i % businessUnits.length][0],
    customization_count: i % 9 === 0 ? 84 : (i % 12) * 4,
    tsa_dependency: i % 11 === 0,
    retirement_posture: i % 13 === 0 ? 'retire' : i % 5 === 0 ? 'migrate' : 'tolerate',
  });
}
write('06-erp-landscape/erp-landscape-workbook.csv', csv(Object.keys(erpRows[0]), erpRows));

const apps = [];
const eras = ['SAP', 'Oracle', 'JD Edwards', 'Infor', 'AS/400', 'Mainframe', 'Java legacy', '.NET Framework', 'SaaS', 'Modern microservice', 'Python ML', 'Plant edge'];
const vendors = ['SAP', 'Oracle', 'Cognizant', 'Accenture', 'Infosys', 'Siemens', 'PTC', 'Veeva', 'Salesforce', 'ServiceNow', 'Microsoft', 'AWS', 'Azure'];
for (let i = 1; i <= 240; i += 1) {
  apps.push({
    app_id: `NST-APP-${String(i).padStart(3, '0')}`,
    name: `${eras[i % eras.length]} Capability ${i}`,
    stack_era: eras[i % eras.length],
    criticality: i % 9 === 0 ? 'P0' : i % 4 === 0 ? 'P1' : 'P2',
    owner_role: i % 18 === 0 ? '' : `VP ${['ERP', 'Quality', 'Manufacturing', 'HIS', 'Commercial', 'Security'][i % 6]}`,
    system_of_record: i % 5 === 0,
    business_unit_id: businessUnits[i % businessUnits.length][0],
    ams_vendor: vendors[i % vendors.length],
    time_classification: i % 19 === 0 ? 'retire' : i % 7 === 0 ? 'migrate' : i % 5 === 0 ? 'tolerate' : 'invest',
    annual_run_cost_usd: money(450_000 + i * 72_000),
    regulatory_scope: i % 6 === 0 ? 'GxP' : i % 4 === 0 ? 'SOX' : 'standard',
    notes: i === 37 ? 'KILL CANDIDATE: AS/400 Distributor Rebates Retirement blocker' : i === 88 ? 'RESTRUCTURE CANDIDATE: JD Edwards Dental Sunset' : '',
  });
}
write('07-application-portfolio/application-portfolio.csv', csv(Object.keys(apps[0]), apps));

const edges = [];
for (let i = 1; i <= 820; i += 1) {
  const source = apps[(i * 7) % apps.length].app_id;
  const target = apps[(i * 13 + 5) % apps.length].app_id;
  edges.push({
    edge_id: `NST-EDGE-${String(i).padStart(4, '0')}`,
    source_app_id: source,
    target_app_id: target,
    integration_type: ['API', 'batch', 'file', 'HL7/FHIR', 'EDI', 'database_link'][i % 6],
    business_process: ['rebates', 'quality release', 'finance close', 'order-to-cash', 'plant execution'][i % 5],
    kill_blocker_flag: i <= 12 || i % 97 === 0,
    latency_sla: i % 3 === 0 ? 'near-real-time' : 'daily',
  });
}
write('08-integration-topology/integration-topology.json', JSON.stringify({ tenant_key: 'northstar', edges }, null, 2));

const vendorRows = [];
const vendorNames = ['SAP', 'Oracle', 'Siemens', 'PTC', 'Veeva', 'Salesforce', 'ServiceNow', 'Microsoft', 'AWS', 'Azure', 'Cognizant', 'Accenture', 'Infosys', 'Deloitte', 'KPMG'];
for (let i = 1; i <= 90; i += 1) {
  const vendorName = vendorNames[i % vendorNames.length];
  vendorRows.push({
    vendor_id: `NST-VEND-${String(i).padStart(3, '0')}`,
    vendor_name: `${vendorName} ${i > vendorNames.length ? `Program ${i}` : ''}`.trim(),
    category: ['ERP', 'QMS', 'PLM', 'Cloud', 'AMS', 'SI', 'Security', 'Clinical software'][i % 8],
    annual_value_usd: money(600_000 + i * 340_000),
    renewal_date: `202${6 + (i % 3)}-${String((i % 12) + 1).padStart(2, '0')}-15`,
    exit_terms: i % 4 === 0 ? '90-day per-app removal clause' : 'annual renewal window',
    ai_clauses: i % 5 === 0 ? 'AI-generated work product indemnity required' : 'not negotiated',
    data_rights: i % 6 === 0 ? 'tenant owns derived models' : 'standard confidentiality',
  });
  if (i <= 20) {
    write(`09-vendors-contracts/contracts/NST-VEND-${String(i).padStart(3, '0')}.pdf`, `Northstar vendor contract ${i}
Vendor: ${vendorName}. Annual value: ${money(600_000 + i * 340_000)}.
Renewal window and exit terms included. AI clauses and data rights require review.
`);
  }
}
write('09-vendors-contracts/vendor-contracts.csv', csv(Object.keys(vendorRows[0]), vendorRows));

const requiredInitiatives = [
  ['NST-INIT-S4-WAVE0', 'SAP S/4 Global Consolidation Wave 0', 'hold_contested', 68000000],
  ['NST-INIT-JDE-DENTAL-SUNSET', 'JD Edwards Dental Sunset', 'restructure', 18500000],
  ['NST-INIT-AS400-REBATES', 'AS/400 Distributor Rebates Retirement', 'kill', 7200000],
  ['NST-INIT-CODING-AI', 'Clinical Coding AI Modernization', 'accelerate_with_guardrails', 42000000],
  ['NST-INIT-QMS-EVIDENCE', 'QMS Evidence Automation', 'accelerate', 16000000],
  ['NST-INIT-PRODUCT-RATIONALIZATION', 'Product Portfolio Rationalization Analytics', 'continue', 12000000],
  ['NST-INIT-GENAI-ENGINEERING', 'GenAI Product Engineering Assistant', 'restructure', 9500000],
  ['NST-INIT-TSA-IDENTITY', 'TSA Identity Exit', 'accelerate', 22000000],
  ['NST-INIT-MES-HARMONIZATION', 'Plant MES Harmonization', 'continue_with_warning', 36000000],
  ['NST-INIT-DENTAL-PLM', 'Dental Materials Legacy PLM Replacement', 'kill', 8600000],
];
const activeInitiatives = [...requiredInitiatives.map(([initiative_id, title, sentinel_posture, committed_usd], index) => ({
  initiative_id,
  title,
  status: 'active',
  sentinel_posture,
  sponsor_role: ['CIO', 'CFO', 'EVP HIS', 'Chief Quality Officer'][index % 4],
  committed_usd,
  projected_value_usd: Number(committed_usd) * 3,
  linked_app_ids: `${apps[index + 20].app_id};${apps[index + 37].app_id}`,
  notes: index === 2 ? 'KILL CANDIDATE' : index === 1 ? 'RESTRUCTURE CANDIDATE' : '',
}))];
for (let i = activeInitiatives.length + 1; i <= 55; i += 1) {
  activeInitiatives.push({
    initiative_id: `NST-INIT-${String(i).padStart(3, '0')}`,
    title: `Northstar transformation initiative ${i}`,
    status: 'active',
    sentinel_posture: i % 9 === 0 ? 'continue_with_warning' : 'continue',
    sponsor_role: ['CIO', 'CFO', 'COO', 'EVP HIS', 'Chief Quality Officer'][i % 5],
    committed_usd: money(2_000_000 + i * 820_000),
    projected_value_usd: money(7_000_000 + i * 1_400_000),
    linked_app_ids: `${apps[i % apps.length].app_id};${apps[(i + 18) % apps.length].app_id}`,
    notes: '',
  });
}
const closedInitiatives = [];
for (let i = 1; i <= 25; i += 1) {
  closedInitiatives.push({
    initiative_id: `NST-CLOSED-${String(i).padStart(3, '0')}`,
    title: `Closed Northstar initiative ${i}`,
    status: i % 4 === 0 ? 'killed' : 'completed',
    sponsor_role: ['CIO', 'CFO', 'COO'][i % 3],
    committed_usd: money(1_500_000 + i * 550_000),
    realized_value_usd: money(2_000_000 + i * 790_000),
  });
}
write('10-initiatives/initiatives-active.csv', csv(Object.keys(activeInitiatives[0]), activeInitiatives));
write('10-initiatives/initiatives-closed.csv', csv(Object.keys(closedInitiatives[0]), closedInitiatives));

const leaders = [
  ['NST-PER-CEO', 'Maya Rangan', 'CEO', '', 'CXO', 'ceo@northstar-clinical.example.com'],
  ['NST-PER-CFO', 'Daniel Okafor', 'CFO', 'NST-PER-CEO', 'CXO', 'cfo@northstar-clinical.example.com'],
  ['NST-PER-CIO', 'Priya Mehta', 'CIO', 'NST-PER-CEO', 'CXO', 'cio@northstar-clinical.example.com'],
  ['NST-PER-CQO', 'Elena Kovacs', 'Chief Quality Officer', 'NST-PER-CEO', 'CXO', 'cqo@northstar-clinical.example.com'],
  ['NST-PER-EVP-HIS', 'Marcus Lee', 'EVP Health Information Systems', 'NST-PER-CEO', 'EVP', 'evp-his@northstar-clinical.example.com'],
];
const executiveOrgChart = {
  tenant_key: 'northstar',
  name: 'Northstar Clinical Technologies',
  depth_model: 'CXO -> EVP -> SVP -> VP -> Senior Director -> Director -> Manager -> IC',
  cxo: {
    id: 'NST-PER-CEO',
    name: 'Maya Rangan',
    role: 'CEO',
    direct_reports: [
      {
        id: 'NST-PER-CFO',
        name: 'Daniel Okafor',
        role: 'CFO',
        functions: ['FP&A', 'Treasury', 'Investor Relations', 'Procurement', 'SOX Controls'],
        senior_chain: [
          { level: 'EVP', role: 'EVP Finance Operations' },
          { level: 'SVP', role: 'SVP Segment FP&A' },
          { level: 'VP', role: 'VP Margin Expansion Office' },
          { level: 'Senior Director', role: 'Senior Director TSA Cost Takeout' },
          { level: 'Director', role: 'Director Finance Systems Value Proof' },
        ],
      },
      {
        id: 'NST-PER-CIO',
        name: 'Priya Mehta',
        role: 'CIO',
        functions: ['ERP', 'Enterprise Architecture', 'Cybersecurity', 'Data Platforms', 'Plant IT'],
        senior_chain: [
          { level: 'EVP', role: 'EVP Enterprise Technology' },
          { level: 'SVP', role: 'SVP ERP and TSA Exit' },
          { level: 'VP', role: 'VP Enterprise Architecture' },
          { level: 'Senior Director', role: 'Senior Director CMDB and Integration Topology' },
          { level: 'Director', role: 'Director S/4 Readiness Evidence' },
        ],
      },
      {
        id: 'NST-PER-CQO',
        name: 'Elena Kovacs',
        role: 'Chief Quality Officer',
        functions: ['QMS', 'CAPA', 'Complaints', 'Regulatory Audit', 'AI Quality Controls'],
        senior_chain: [
          { level: 'EVP', role: 'EVP Quality and Regulatory' },
          { level: 'SVP', role: 'SVP Global QMS' },
          { level: 'VP', role: 'VP CAPA and Complaint Analytics' },
          { level: 'Senior Director', role: 'Senior Director FDA Audit Readiness' },
          { level: 'Director', role: 'Director Regulated AI Evidence Chain' },
        ],
      },
      {
        id: 'NST-PER-EVP-HIS',
        name: 'Marcus Lee',
        role: 'EVP Health Information Systems',
        functions: ['Clinical Coding', 'CDI', 'Audit Software', 'Product Engineering', 'Customer Operations'],
        senior_chain: [
          { level: 'SVP', role: 'SVP Clinical Coding Platforms' },
          { level: 'VP', role: 'VP AI Product Engineering' },
          { level: 'VP', role: 'VP Customer Implementation' },
          { level: 'Senior Director', role: 'Senior Director Coding Model Governance' },
          { level: 'Director', role: 'Director HIS Product Value Analytics' },
        ],
      },
    ],
  },
};
const orgRows = leaders.map(([person_id, name, role, manager_id, level, email]) => ({
  person_id, name, role, manager_id, level, email, cost_center: level, location: 'Global HQ',
}));
const levels = ['EVP', 'SVP', 'VP', 'Senior Director', 'Director', 'Senior Manager', 'Manager', 'Lead', 'IC'];
for (let i = 6; i <= 3400; i += 1) {
  const level = levels[Math.min(levels.length - 1, Math.floor((i - 6) / 70)) % levels.length];
  const managerId = i <= 28 ? leaders[i % leaders.length][0] : `NST-PER-${String(Math.max(6, i - (level === 'IC' ? 5 : 17))).padStart(4, '0')}`;
  orgRows.push({
    person_id: `NST-PER-${String(i).padStart(4, '0')}`,
    name: `Northstar ${level} ${i}`,
    role: `${level} ${['ERP', 'Quality', 'Manufacturing', 'HIS', 'Product', 'Security', 'Finance'][i % 7]}`,
    manager_id: managerId,
    level,
    email: `person${i}@northstar-clinical.example.com`,
    cost_center: `CC-${1000 + (i % 280)}`,
    location: countries[i % countries.length],
  });
}
write('11-org-roles/org-roles.csv', csv(Object.keys(orgRows[0]), orgRows));
write('11-org-roles/executive-org-chart.json', JSON.stringify(executiveOrgChart, null, 2));
write('11-org-roles/org-chart-summary.md', `# Northstar Executive Org Chart

Northstar's pilot org model is intentionally deep: CXO -> EVP -> SVP -> VP ->
Senior Director -> Director -> Manager -> IC. The synthetic role inventory
contains ${orgRows.length.toLocaleString()} people, including the five demo
personas used for pilot login and the named leadership chains needed for
ownership, approval, and blocker reasoning.
`);
write('11-org-roles/demo-personas.csv', csv(['email', 'password', 'name', 'role', 'client_key', 'tenant_key'], leaders.map((leader) => ({
  email: leader[5],
  password: 'Demo2026!',
  name: leader[1],
  role: leader[2],
  client_key: 'northstar',
  tenant_key: 'northstar-clinical-tech',
}))));

const doraRows = [];
for (let team = 1; team <= 28; team += 1) {
  for (let week = 1; week <= 8; week += 1) {
    doraRows.push({
      team_id: `NST-TEAM-${String(team).padStart(2, '0')}`,
      measured_at: `2026-${String(Math.ceil(week / 4) + 3).padStart(2, '0')}-${String(((week - 1) % 4) * 7 + 1).padStart(2, '0')}`,
      deploy_freq_per_week: (0.5 + (team % 7) * 0.4).toFixed(1),
      lead_time_hours: 18 + (team % 9) * 8,
      mttr_hours: 2 + (team % 6) * 1.5,
      change_failure_rate_pct: 7 + (team % 16),
      reliability_pct: 97 - (team % 5),
    });
  }
}
write('12-delivery-devex/dora-baseline.csv', csv(Object.keys(doraRows[0]), doraRows));

const qmsRows = [];
for (let i = 1; i <= 120; i += 1) {
  qmsRows.push({
    event_id: `NST-QMS-${String(i).padStart(3, '0')}`,
    event_type: ['CAPA', 'Complaint trend', 'FDA 483 observation', 'EU MDR remediation', 'Design history gap'][i % 5],
    product_family_id: productRows[i % productRows.length].product_family_id,
    severity: i % 9 === 0 ? 'high' : i % 4 === 0 ? 'medium' : 'low',
    opened_at: `2026-${String((i % 12) + 1).padStart(2, '0')}-03`,
    capa_id: `CAPA-${String(i).padStart(4, '0')}`,
    audit_reference: `AUD-${String(i).padStart(4, '0')}`,
  });
  if (i <= 40) write(`13-regulatory-qms/artifacts/${qmsRows.at(-1).event_id}.pdf`, `QMS artifact ${i}: ${qmsRows.at(-1).event_type}. Product ${qmsRows.at(-1).product_family_id}. Severity ${qmsRows.at(-1).severity}.`);
}
write('13-regulatory-qms/qms-events.csv', csv(Object.keys(qmsRows[0]), qmsRows));

const aiRows = [];
for (let i = 1; i <= 42; i += 1) {
  aiRows.push({
    tool_id: `NST-AI-${String(i).padStart(3, '0')}`,
    tool_name: `Northstar AI Tool ${i}`,
    owner_role: ['AI Governance Lead', 'EVP HIS', 'VP Engineering', 'Chief Quality Officer'][i % 4],
    workflow: ['clinical coding', 'product engineering', 'complaint triage', 'quality release', 'customer support'][i % 5],
    risk_classification: i % 5 === 0 ? 'high-risk regulated workflow' : 'internal productivity',
    model_name: ['gpt-5-class', 'domain encoder', 'vision inspection model', 'forecasting model'][i % 4],
    regulated_workflow_flag: i % 5 === 0,
  });
}
write('14-ai-models-tools/ai-tool-footprint.csv', csv(Object.keys(aiRows[0]), aiRows));

const incidentRows = [];
for (let i = 1; i <= 180; i += 1) {
  incidentRows.push({
    incident_id: `NST-INC-${String(i).padStart(4, '0')}`,
    system_id: apps[i % apps.length].app_id,
    severity: i % 31 === 0 ? 'P0' : i % 11 === 0 ? 'P1' : 'P2',
    opened_at: `2026-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}`,
    closed_at: i % 13 === 0 ? '' : `2026-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 27) + 2).padStart(2, '0')}`,
    root_cause: ['ERP batch failure', 'plant edge network', 'QMS validation defect', 'cloud identity sync'][i % 4],
  });
}
write('15-incidents-ops/incidents.csv', csv(Object.keys(incidentRows[0]), incidentRows));

const corpusChunks = [];
const themes = ['ERP carveout and TSA exit', 'clinical coding AI modernization', 'FDA QMS modernization', 'manufacturing quality AI', 'product portfolio rationalization', 'medtech margin expansion', 'regulated GenAI governance', 'SAP S/4 sequencing'];
for (let i = 1; i <= 720; i += 1) {
  const theme = themes[i % themes.length];
  const sourceId = `NST-SRC-${String((i % 96) + 1).padStart(3, '0')}`;
  corpusChunks.push({
    chunk_id: `NST-CHUNK-${String(i).padStart(4, '0')}`,
    source_file_id: sourceId,
    pattern_id: `NST-PAT-${String((i % 48) + 1).padStart(3, '0')}`,
    industry: 'clinical technology / medtech',
    use_case: theme,
    claim: `${theme} pattern ${i} applies when regulated operations, ERP dependencies, and margin targets collide.`,
    evidence_basis: `Synthetic industry corpus source ${sourceId}`,
    confidence: i % 7 === 0 ? 0.72 : 0.86,
    tenant_applicability: 'Northstar context layer',
    do_not_overclaim_notes: 'Use as industry pattern, not tenant fact, unless paired with approved Northstar evidence.',
  });
}
write('16-market-corpus/client-data-corpus.jsonl', corpusChunks.map((chunk) => JSON.stringify(chunk)).join('\n') + '\n');
for (let i = 1; i <= 96; i += 1) {
  write(`16-market-corpus/source-files/NST-SRC-${String(i).padStart(3, '0')}.md`, `# Northstar industry corpus source ${i}

Theme: ${themes[i % themes.length]}.
This synthetic source explains how a large regulated medtech company should
reason about context-layer evidence, ERP sequencing, QMS controls, and value.
`);
}

const templates = [
  ['enterprise-profile.yaml', 'enterprise profile'],
  ['financial-kpi-workbook.xlsx', 'financial KPIs'],
  ['annual-report.pdf', 'annual report'],
  ['qbr-board-pack.pdf', 'quarterly board pack'],
  ['market-signals.csv', 'market signals'],
  ['competitor-benchmark.md', 'competitor benchmark'],
  ['strategy-memo.docx', 'strategy memo'],
  ['board-priorities.xlsx', 'board priorities'],
  ['segment-pnl-workbook.xlsx', 'segment P&L'],
  ['product-portfolio.csv', 'product portfolio'],
  ['site-and-plant-inventory.csv', 'manufacturing sites'],
  ['erp-landscape-workbook.xlsx', 'ERP landscape'],
  ['application-portfolio.csv', 'CMDB application portfolio'],
  ['integration-topology.json', 'integration topology'],
  ['vendor-contracts.csv', 'vendor contracts'],
  ['initiative-portfolio.xlsx', 'initiatives'],
  ['org-roles.csv', 'org roles'],
  ['team-topology.csv', 'team topology'],
  ['dora-baseline.csv', 'DORA baseline'],
  ['devex-survey.csv', 'DevEx survey'],
  ['qms-events.csv', 'QMS events'],
  ['ai-tool-footprint.csv', 'AI tool footprint'],
  ['model-inventory.csv', 'model inventory'],
  ['incidents.csv', 'incidents'],
  ['change-history.csv', 'change history'],
];
for (const [file, label] of templates) {
  write(`17-upload-templates/${file}`, `Northstar ${label} upload template. Required fields are documented in NORTHSTAR_CONTEXT_LAYER_TEMPLATE_CATALOG.md.\n`);
}

const scenarios = [
  '01-cmdb-upload',
  '02-erp-landscape-workbook',
  '03-financial-reports',
  '04-vendor-contract-batch',
  '05-qms-regulatory-upload',
  '06-csuite-strategy-upload',
  '07-product-portfolio-upload',
  '08-gap-fill-cycle',
];
for (const scenario of scenarios) {
  write(`18-upload-scenarios/${scenario}.md`, `# ${scenario}

This scenario demonstrates Upload Received -> Classified -> Parsed -> Mapped
-> Validated -> Awaiting Approval -> Committed -> Available to Agents.
`);
}
write('18-upload-scenarios/sample-cmdb-upload.csv', csv(Object.keys(apps[0]), apps.slice(0, 20).map((row, index) => ({
  ...row,
  owner_role: index % 7 === 0 ? '' : row.owner_role,
  time_classification: index === 5 ? 'invalid-time' : row.time_classification,
  annual_run_cost_usd: index === 9 ? 'not-a-number' : row.annual_run_cost_usd,
}))));
write('19-context-approval/approval-queue.json', JSON.stringify({
  tenant_key: 'northstar',
  awaiting_approval: 184,
  approved_for_agent_use: 7636,
  rejected: 31,
  insufficient_evidence: 153,
}, null, 2));
write('20-evidence-ledger-fixtures/evidence-rows.jsonl', corpusChunks.slice(0, 160).map((chunk, index) => JSON.stringify({
  evidence_id: `NST-EVID-${String(index + 1).padStart(4, '0')}`,
  claim: chunk.claim,
  source_ref: { file: `${chunk.source_file_id}.md`, chunk_id: chunk.chunk_id },
  confidence: chunk.confidence,
  owner_role: index % 3 === 0 ? 'CFO' : 'VP Enterprise Architecture',
})).join('\n') + '\n');

const expectedQuestions = [
  'What do you know about Northstar?',
  'Where is the fastest path to $250M margin expansion?',
  'Should we accelerate global SAP S/4 consolidation?',
  'What blocks shutting down JD Edwards in Dental?',
  'Which ERP should we retire first?',
  'Where are TSA costs still hiding?',
  'Which vendor contracts should Source renegotiate first?',
  'Which clinical coding AI initiative should we fund, pause, or kill?',
  'What is our FDA/QMS evidence-chain weakness?',
  'Which plants have the highest quality-cost automation opportunity?',
  'Which product families should be rationalized first?',
  'What is the strongest argument against GenAI in product engineering?',
  'What would change your view on S/4 sequencing?',
  'What market pressures matter most to Dental Solutions?',
  'Which integration edges block AS/400 rebate retirement?',
  'Where does industry corpus change the answer versus tenant data alone?',
  'Which facts came from uploaded financial reports?',
  'Which facts came from CMDB?',
  'Which facts require approval before use?',
  'Which facts are stale?',
  'What can Sentinel answer after the QMS upload that it could not answer before?',
  'What can Source do after vendor contract extraction?',
  'Show me the evidence chain behind the TSA exit recommendation.',
  'What are the top 3 risks of this context layer being wrong?',
  'Which org leaders own ERP, QMS, and HIS modernization?',
  'Which VP or director chain blocks plant MES harmonization?',
  'Which five pilot logins are available?',
  'How did AbarVa ingest Northstar data?',
  'Which templates were used?',
  'Which uploaded facts were rejected?',
  'Which annual-report facts support the margin plan?',
  'How do approved facts become available to agents?',
  'What should the board not fund this year?',
  'What is the Source posture for SAP SI renegotiation?',
  'How does QMS evidence automation affect audit readiness?',
  'Which app retirements require integration-edge remediation?',
];
write('99-verification/expected-sentinel-answers.json', JSON.stringify({
  tenant_key: 'northstar',
  pass_threshold: { questions_grounded: 30, citation_requirement: 'must cite NST-* ids and source locators' },
  questions: expectedQuestions.map((question, index) => ({
    id: `NST-Q-${String(index + 1).padStart(2, '0')}`,
    question,
    expected_shape: 'tenant-grounded answer with evidence ids, confidence, dissent, and what-would-change-my-view when recommending',
    must_cite: index < 5 ? ['NST-APP-', 'NST-INIT-', 'NST-EDGE-'] : ['NST-EVID-', 'NST-SRC-', 'NST-CHUNK-'],
  })),
}, null, 2));

const counts = {
  applicationPortfolioRows: apps.length,
  integrationEdges: edges.length,
  activeInitiatives: activeInitiatives.length,
  closedInitiatives: closedInitiatives.length,
  vendorContracts: vendorRows.length,
  erpObjects: erpRows.length,
  plants: siteRows.length,
  productFamilies: productRows.length,
  skuGroups: skuRows.length,
  qmsRecords: qmsRows.length,
  sourceFiles: 96,
  corpusChunks: corpusChunks.length,
  orgRoles: orgRows.length,
  doraBaselines: doraRows.length,
  canonicalQuestions: expectedQuestions.length,
  templates: templates.length,
};
write('99-verification/expected-row-counts.json', JSON.stringify(counts, null, 2));

write('manifest.yaml', `name: northstar-clinical-tech-synthetic-v1
tenant_key: northstar
display_name: Northstar Clinical Technologies
revenue_usd: 22600000000
generated_at: 2026-05-26
counts:
${Object.entries(counts).map(([key, value]) => `  ${key}: ${value}`).join('\n')}
`);

write('README.md', `# Northstar Clinical Technologies Synthetic Context Layer v1

This pack is a comprehensive pilot substrate for a $22.6B composite global
clinical technology company. It is designed to demonstrate dynamic context
ingestion: template-guided uploads, file classification, parsing, validation,
human approval, evidence mapping, and agent-ready context.

The pack includes deep financial, ERP, CMDB, product, manufacturing, QMS,
vendor, initiative, org, DORA, AI tooling, incident, market, and C-suite
strategy context.
`);

const catalog = `# Northstar Context Layer Template Catalog

Each dimension lists the business questions unlocked, required templates,
validation posture, steward, refresh cadence, target context shape, and product
surfaces that consume approved facts.

${[
  ['Enterprise Profile', 'enterprise-profile.yaml', 'What is Northstar and what is its scale?', 'CEO Chief of Staff'],
  ['Financial KPIs', 'financial-kpi-workbook.xlsx', 'Where is the fastest path to $250M margin expansion?', 'CFO FP&A'],
  ['Annual / Quarterly Reports', 'annual-report.pdf, qbr-board-pack.pdf', 'Which claims come from official reporting?', 'Investor Relations'],
  ['Market / Competitor Intel', 'market-signals.csv, competitor-benchmark.md', 'Which market pressures change the decision?', 'Chief Commercial Officer'],
  ['C-Suite Strategy', 'strategy-memo.docx, board-priorities.xlsx', 'What does the board actually want?', 'CEO Chief of Staff'],
  ['Business Units / Segment P&L', 'segment-pnl-workbook.xlsx', 'Which segments fund or block the case?', 'CFO FP&A'],
  ['Product Portfolio', 'product-portfolio.csv', 'Which products should be rationalized?', 'Chief Product Officer'],
  ['Manufacturing / Sites', 'site-and-plant-inventory.csv', 'Which plants have quality-cost automation value?', 'COO'],
  ['ERP Landscape', 'erp-landscape-workbook.xlsx', 'Should Northstar accelerate S/4?', 'CIO ERP Transformation'],
  ['CMDB / Application Portfolio', 'application-portfolio.csv', 'What systems do we have and which matter?', 'VP Enterprise Architecture'],
  ['Integration Topology', 'integration-topology.json', 'What blocks retiring an app?', 'VP Enterprise Architecture'],
  ['Vendor Contracts', 'vendor-contracts.csv + PDFs', 'Which contracts should Source renegotiate?', 'VP Procurement'],
  ['Transformation Initiatives', 'initiative-portfolio.xlsx', 'Which initiatives should we kill, restructure, or accelerate?', 'Transformation PMO'],
  ['Org / Roles / Teams', 'org-roles.csv, team-topology.csv', 'Who owns the decision and blocker chain?', 'CHRO'],
  ['Delivery / DORA / DevEx', 'dora-baseline.csv', 'How healthy are engineering teams?', 'VP Engineering'],
  ['Regulatory / QMS / Risk', 'qms-events.csv, audit PDFs, CAPA exports', 'Where is the FDA/QMS evidence weakness?', 'Chief Quality Officer'],
  ['AI Tooling / Model Inventory', 'ai-tool-footprint.csv, model-inventory.csv', 'Which AI workflows are regulated or risky?', 'AI Governance Lead'],
  ['Incidents / Ops Telemetry', 'incidents.csv, change-history.csv', 'Where does operational risk alter sequencing?', 'VP IT Operations'],
].map(([dimension, templatesValue, questions, owner]) => `## ${dimension}

- Templates: ${templatesValue}
- Business questions unlocked: ${questions}
- Validation: required fields, owner, freshness, duplicate detection, enum checks, and source locator required.
- Steward: ${owner}
- Refresh cadence: monthly or quarterly depending on source volatility.
- Approval flow: upload -> classify -> parse -> map -> validate -> owner approval -> context commit.
- Consumed by: Sentinel, Source, Moves, Tower, Evidence Map.
- Evidence chip example: source file + row/page/sheet + owner + confidence + freshness.
`).join('\n')}
`;
fs.writeFileSync(path.join(DOC_ROOT, 'NORTHSTAR_CONTEXT_LAYER_TEMPLATE_CATALOG.md'), catalog);

console.log(JSON.stringify({ ok: true, root: ROOT, counts }, null, 2));

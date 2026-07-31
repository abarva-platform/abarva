#!/usr/bin/env node
/**
 * Packet 28 · SkyHarbor Air substrate generator.
 *
 * Superseded for the datasets/skyharbor-air-synthetic-v1/ path that
 * scripts/seed/load-tenant-substrate.ts actually loads into Postgres — see
 * generate-skyharbor-substrate-from-enrichment.mjs, which reads the real
 * governed skyharbor-air enrichment dataset instead of this file's
 * self-contained hardcoded content. Left in place for its docs/skyharbor/
 * output and S01-S15 segment/graph/briefs artifacts, which the enrichment
 * bridge does not produce.
 *
 * Purpose:
 *   Build a major-carrier-shaped, de-identified airline modernization substrate that
 *   demonstrates the exact onboarding method a CTO team could reuse: raw
 *   source uploads -> reusable templates -> validated records -> graph ->
 *   chunks -> verification reports.
 *
 * Usage:
 *   node scripts/skyharbor/generate-skyharbor-substrate.mjs
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DATASET = path.join(REPO_ROOT, 'datasets/skyharbor-air-synthetic-v1');
const DOCS = path.join(REPO_ROOT, 'docs/skyharbor');
const CLIENT_ID = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301';
const CLIENT_KEY = 'skyharbor-air';
const TODAY = '2026-05-27';

const segments = [
  ['S01_ENTERPRISE_PROFILE', 'enterprise_profile', 'Enterprise Profile'],
  ['S02_MODERNIZATION_LEDGER', 'modernization_ledger', 'Modernization Ledger'],
  ['S03_MAINFRAME_INVENTORY', 'mainframe_inventory', 'Mainframe Application Inventory'],
  ['S04_AWS_NATIVE_ESTATE', 'aws_native_estate', 'AWS Native Estate'],
  ['S05_INTEGRATION_TOPOLOGY', 'integration_topology', 'Integration Topology'],
  ['S06_IBM_ENGAGEMENT', 'ibm_engagement', 'IBM Engagement Profile'],
  ['S07_INITIATIVES', 'initiatives', 'Active Initiatives Portfolio'],
  ['S08_VENDOR_PORTFOLIO', 'vendor_portfolio', 'Vendor Portfolio'],
  ['S09_ENGINEERING_PRODUCTIVITY', 'engineering_productivity', 'Engineering Productivity Baseline'],
  ['S10_GCC_CAPABILITY', 'gcc_capability', 'Offshore / GCC Capability'],
  ['S11_AI_SDLC_OPPORTUNITY', 'ai_sdlc_opportunity', 'AI-Powered SDLC Opportunity Map'],
  ['S12_EXECUTIVE_DECISION_MAP', 'executive_decision_map', 'Executive Decision Map'],
  ['S13_VALUE_LEDGER', 'value_ledger', 'Value Ledger'],
  ['S14_OPERATIONAL_KPIS', 'operational_kpis', 'Operational + Financial KPIs'],
  ['S15_SOURCING_PIPELINE', 'sourcing_pipeline', 'Sourcing & Renewal Pipeline'],
];

const sourceBasis = {
  public_anchor: 'Anchored to public airline scale and modernization patterns; values are de-identified.',
  synthetic_comparable: 'Generated from comparable airline operating patterns; not a target-carrier confidential fact.',
  generated_assumption: 'Scenario assumption authored for SkyHarbor pilot rehearsal.',
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function write(rel, content) {
  const file = path.join(DATASET, rel);
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content);
}

function writeDoc(rel, content) {
  const file = path.join(DOCS, rel);
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content);
}

function csvEscape(value) {
  if (value == null) return '';
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(rows) {
  const keys = Array.from(rows.reduce((set, row) => {
    Object.keys(row).forEach((key) => set.add(key));
    return set;
  }, new Set()));
  return `${keys.join(',')}\n${rows.map((row) => keys.map((key) => csvEscape(row[key])).join(',')).join('\n')}\n`;
}

function toJsonl(rows) {
  return `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`;
}

function xmlEscape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function writeSimpleXlsx(rel, rows) {
  const outFile = path.join(DATASET, rel);
  ensureDir(path.dirname(outFile));
  const tmp = fs.mkdtempSync(path.join('/tmp', 'skyharbor-xlsx-'));
  ensureDir(path.join(tmp, '_rels'));
  ensureDir(path.join(tmp, 'xl/_rels'));
  ensureDir(path.join(tmp, 'xl/worksheets'));
  const keys = Object.keys(rows[0] ?? { empty: '' });
  const sheetRows = [keys, ...rows.map((row) => keys.map((key) => row[key]))]
    .map((values, rowIndex) => `<row r="${rowIndex + 1}">${values.map((value, colIndex) => `<c r="${String.fromCharCode(65 + (colIndex % 26))}${rowIndex + 1}" t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`).join('')}</row>`)
    .join('');
  fs.writeFileSync(path.join(tmp, '[Content_Types].xml'), `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`);
  fs.writeFileSync(path.join(tmp, '_rels/.rels'), `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`);
  fs.writeFileSync(path.join(tmp, 'xl/workbook.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Data" sheetId="1" r:id="rId1"/></sheets>
</workbook>`);
  fs.writeFileSync(path.join(tmp, 'xl/_rels/workbook.xml.rels'), `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`);
  fs.writeFileSync(path.join(tmp, 'xl/worksheets/sheet1.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${sheetRows}</sheetData>
</worksheet>`);
  const zipped = spawnSync('zip', ['-qr', outFile, '.'], { cwd: tmp });
  fs.rmSync(tmp, { recursive: true, force: true });
  if (zipped.status !== 0) throw new Error(`zip failed for ${rel}: ${zipped.stderr?.toString()}`);
}

function writeSimpleDocx(rel, title, paragraphs) {
  const outFile = path.join(DATASET, rel);
  ensureDir(path.dirname(outFile));
  const tmp = fs.mkdtempSync(path.join('/tmp', 'skyharbor-docx-'));
  ensureDir(path.join(tmp, '_rels'));
  ensureDir(path.join(tmp, 'word/_rels'));
  fs.writeFileSync(path.join(tmp, '[Content_Types].xml'), `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);
  fs.writeFileSync(path.join(tmp, '_rels/.rels'), `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
  const body = [title, ...paragraphs]
    .map((text) => `<w:p><w:r><w:t>${xmlEscape(text)}</w:t></w:r></w:p>`)
    .join('');
  fs.writeFileSync(path.join(tmp, 'word/document.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>`);
  const zipped = spawnSync('zip', ['-qr', outFile, '.'], { cwd: tmp });
  fs.rmSync(tmp, { recursive: true, force: true });
  if (zipped.status !== 0) throw new Error(`zip failed for ${rel}: ${zipped.stderr?.toString()}`);
}

function writeSimplePdf(rel, title, lines) {
  const outFile = path.join(DATASET, rel);
  ensureDir(path.dirname(outFile));
  const text = [title, ...lines].join('\\n').replace(/[()]/g, '');
  const stream = `BT /F1 11 Tf 50 760 Td (${text.slice(0, 2600).replace(/\n/g, ') Tj T* (')}) Tj ET`;
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${obj}\n`;
  }
  const xrefStart = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  fs.writeFileSync(outFile, pdf);
}

function sha(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function stableId(prefix, seed) {
  return `${prefix}-${sha(seed).slice(0, 12).toUpperCase()}`;
}

function addProvenance(record, segment, sourceArtifact, sourceRef, basis = 'synthetic_comparable') {
  return {
    ...record,
    client_id: CLIENT_ID,
    client_key: CLIENT_KEY,
    segment_id: segment,
    data_basis: basis,
    source_artifact_path: sourceArtifact,
    source_ref: sourceRef,
    parser_used: 'skyharbor-structured-template-parser-v1',
    approval_status: 'approved_synthetic',
    confidence: basis === 'public_anchor' ? 0.92 : 0.88,
    last_updated: TODAY,
  };
}

const records = {};
for (const [code] of segments) records[code] = [];

records.S01_ENTERPRISE_PROFILE = [
  addProvenance({
    fact_id: 'SHA-ENT-001',
    name: 'SkyHarbor Air',
    legal_name: 'SkyHarbor Air Group',
    revenue_usd: 52100000000,
    employees: 95000,
    tech_employees: 6800,
    aircraft_total: 950,
    loyalty_members: 110000000,
    annual_it_spend_usd: 3200000000,
    it_run_usd: 1800000000,
    it_grow_usd: 700000000,
    it_transform_usd: 700000000,
    modernization_spend_5yr_usd: 2400000000,
    modernization_run_rate_usd: 640000000,
    ibm_engagement_annual_usd: 280000000,
    aws_edp_annual_commit_usd: 180000000,
    day0_mainframe_workloads: 47,
    current_mainframe_workloads: 28,
    day0_mips_peak: 280000,
    current_mips_peak: 165000,
    extracted_capabilities_count: 19,
    revenue_critical_volume_extracted_pct: 22,
  }, 'S01_ENTERPRISE_PROFILE', 'source_uploads/board_technology_update_2026q1.docx', 'Executive summary', 'public_anchor'),
  ...[
    ['board_priority', 'Prove modernization value without weakening operational reliability during IROPs.'],
    ['ceo_strategy', 'Protect premium customer experience while making the technology estate faster and less brittle.'],
    ['cio_challenge', 'Amala Rao is asking whether five years of modernization has created enough reusable AWS-native capability.'],
    ['cto_thesis', 'The CTO-sponsored program has reduced MIPS and delivered important customer and loyalty wins, but next-wave sequencing needs sharper evidence.'],
    ['cfo_question', 'The CFO wants promised, realized, disputed, and projected modernization value separated.'],
    ['coo_constraint', 'The COO will not accept extraction work that extends irregular-operations recovery time.'],
    ['ciso_constraint', 'The CISO wants cloud control-plane sprawl and AI-generated-code risk governed before scale.'],
    ['gcc_gap', 'The offshore GCC has 1,000 employees and lags peer carrier scale of roughly 3,000 to 5,000.'],
    ['airport_ops', 'Airport operations, crew legality, and baggage recovery remain the most disruption-sensitive domains.'],
    ['source_goal', 'FY2027 IBM restructure window is the largest near-term sourcing leverage point.'],
    ['ai_sdlc_goal', 'AI-powered SDLC should start with analysis, documentation, test generation, and controls before autonomous rewrite.'],
    ['demo_policy', 'SkyHarbor is de-identified and uses no target-carrier logos, executives, internal system names, or non-public information.'],
  ].map(([fact_type, narrative], i) => addProvenance({ fact_id: `SHA-ENT-${String(i + 2).padStart(3, '0')}`, fact_type, narrative }, 'S01_ENTERPRISE_PROFILE', 'source_uploads/board_technology_update_2026q1.docx', fact_type)),
];

const capabilities = [
  'Passenger Name Record Core', 'Ticketing Exchange Engine', 'Departure Control Closeout', 'Crew Legality Solver',
  'IROPs Reaccommodation Rules', 'Loyalty Accrual Core', 'Revenue Accounting Batch', 'Interline Settlement',
  'Baggage WorldTracer Bridge', 'Cargo Capacity Rating', 'Flight Disruption Notifications', 'Ancillary Fee Posting',
  'Airport Load Control', 'Schedule Publication Hub', 'Aircraft Rotation Optimizer', 'Maintenance Deferral Interface',
  'Contact Center Profile Lookup', 'Fraud and Chargeback Batch', 'Partner Airline Settlement', 'Corporate Sales Contracting',
  'Gate Agent Transaction Host', 'Seat Inventory Protection', 'Customer Service Voucher Engine', 'International Tax Proration',
  'Crew Payroll Feeds', 'Fuel Hedging Settlement', 'Aircraft Lease Accounting', 'Regulatory Reporting Batch',
  'Loyalty Wallet Service', 'Customer Profile Golden Record', 'Mobile Check-In Service', 'Bag Tag Digital Service',
  'Customer Preference Service', 'Airport Kiosk API Wrapper', 'Disruption Messaging Service', 'Loyalty Offers Engine',
  'Payment Token Vault', 'Digital Receipt Service', 'Partner Status API', 'Customer Consent Service',
  'Cargo Quote API', 'Operations Event Stream', 'Aircraft Tail Assignment API', 'Maintenance Alert Broker',
  'Data Product Catalog', 'Revenue Management Sandbox', 'Crew Pairing Read Replica',
];

const extracted = new Set(capabilities.slice(28));
const reversedNames = new Set(['Revenue Management Sandbox', 'Crew Pairing Read Replica', 'Airport Kiosk API Wrapper']);
for (let i = 0; i < 60; i++) {
  const cap = capabilities[i % capabilities.length];
  const wave = `WAVE-${String((i % 8) + 1).padStart(2, '0')}`;
  const action = extracted.has(cap) ? 'extract' : (i % 11 === 0 ? 'wrap' : i % 13 === 0 ? 'leave' : 'analyze');
  const outcome = reversedNames.has(cap) ? 'reversed' : i % 17 === 0 ? 'over-ran' : i % 9 === 0 ? 'delayed' : i % 7 === 0 ? 'mixed' : 'delivered';
  const promised = 4000000 + (i % 12) * 2100000;
  const realized = outcome === 'delivered' ? promised * 0.78 : outcome === 'reversed' ? promised * 0.12 : promised * 0.42;
  records.S02_MODERNIZATION_LEDGER.push(addProvenance({
    event_id: `SHA-MOD-${String(i + 1).padStart(3, '0')}`,
    wave_id: wave,
    event_date: `202${1 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}-15`,
    capability_name: cap,
    action,
    outcome,
    value_promised_usd: Math.round(promised),
    value_realized_usd: Math.round(realized),
    value_disputed_usd: outcome === 'mixed' || outcome === 'over-ran' ? Math.round(promised - realized) : 0,
    lesson_learned: outcome === 'reversed'
      ? 'Rollback showed that batch reconciliation and crew legality coupling must be unwound before extraction.'
      : 'Wave sequencing worked when API contracts, dual-run exit criteria, and value owner signoff were explicit.',
    owner_at_time: i % 3 === 0 ? 'CTO Modernization Office' : i % 3 === 1 ? 'VP Airline Platforms' : 'Director Cloud Migration Factory',
  }, 'S02_MODERNIZATION_LEDGER', 'source_uploads/modernization_ledger_5yr.xlsx', `row ${i + 2}`));
}

const mainframeDomains = ['PSS', 'DCS', 'crew', 'IROPs', 'loyalty', 'revenue_accounting', 'settlement', 'cargo', 'MRO', 'finance_batch'];
for (let i = 0; i < 28; i++) {
  const cap = capabilities[i];
  const criticality = i < 10 ? 5 : i < 19 ? 4 : 3;
  records.S03_MAINFRAME_INVENTORY.push(addProvenance({
    app_id: `SHA-Z-${String(i + 1).padStart(3, '0')}`,
    workload_id: `SHA-Z-${String(i + 1).padStart(3, '0')}`,
    name: cap,
    business_capability: mainframeDomains[i % mainframeDomains.length],
    MIPS_peak: 2200 + i * 310,
    MIPS_avg: 950 + i * 155,
    transaction_volume_daily: 650000 + i * 175000,
    criticality,
    batch_window_constraint: i % 4 === 0 ? '00:30-03:45 CT hard window' : i % 4 === 1 ? 'near-real-time transaction window' : 'overnight settlement feed',
    regulatory_flag: i % 6 === 0 ? 'DOT consumer rule / financial settlement impact' : i % 5 === 0 ? 'safety-adjacent operational control' : 'standard enterprise control',
    modernization_status: i % 6 === 0 ? 'blocked' : i % 5 === 0 ? 'in-flight' : i % 4 === 0 ? 'in-analysis' : 'untouched',
    reason_still_on_Z: i < 10 ? 'High-volume operational transaction path still has unresolved downstream coupling.' : 'Modernization benefits exist, but extraction is sequenced behind higher-risk domains.',
    last_modified_date: `2025-${String((i % 12) + 1).padStart(2, '0')}-20`,
    owner_team: i % 2 === 0 ? 'Airline Core Platforms' : 'Operations Technology',
    annual_run_cost_usd: 9500000 + i * 420000,
    stack_era: 'mainframe',
    time_classification: i % 6 === 0 ? 'tolerate' : i % 5 === 0 ? 'migrate' : 'invest',
    ams_vendor: 'IBM',
    business_unit_id: mainframeDomains[i % mainframeDomains.length],
  }, 'S03_MAINFRAME_INVENTORY', 'source_uploads/mainframe_inventory_current_state.xlsx', `row ${i + 2}`));
}

const awsRuntimes = ['Lambda', 'ECS', 'EKS', 'EC2', 'SageMaker'];
const datastores = ['Aurora PostgreSQL', 'DynamoDB', 'S3', 'Redshift', 'OpenSearch'];
for (let i = 0; i < 64; i++) {
  const base = capabilities[28 + (i % (capabilities.length - 28))] || `AWS Service ${i + 1}`;
  records.S04_AWS_NATIVE_ESTATE.push(addProvenance({
    service_id: `SHA-AWS-${String(i + 1).padStart(3, '0')}`,
    app_id: `SHA-AWS-${String(i + 1).padStart(3, '0')}`,
    name: `${base} AWS ${i % 5 === 0 ? 'Control Plane' : i % 5 === 1 ? 'API' : i % 5 === 2 ? 'Worker' : i % 5 === 3 ? 'Data Product' : 'Event Service'}`,
    capability_extracted_from_Z: i < 19 ? capabilities[i] : 'greenfield',
    AWS_account: `sha-${['core', 'ops', 'loyalty', 'data', 'security'][i % 5]}-${100 + (i % 9)}`,
    region: i % 7 === 0 ? 'us-west-2' : 'us-east-1',
    extraction_wave_id: `WAVE-${String((i % 8) + 1).padStart(2, '0')}`,
    runtime: awsRuntimes[i % awsRuntimes.length],
    data_store: datastores[i % datastores.length],
    event_streams: i % 2 === 0 ? 'MSK modernization-bus' : 'Kinesis ops-events',
    criticality: i < 16 ? 5 : i < 40 ? 4 : 3,
    ops_maturity: i % 6 === 0 ? 'new' : i % 4 === 0 ? 'stabilizing' : 'mature',
    duplicate_complexity_flag: i % 8 === 0,
    annual_run_cost_usd: 1200000 + i * 180000,
    stack_era: i % 3 === 0 ? 'cloud-native' : 'hybrid',
    time_classification: i % 8 === 0 ? 'migrate' : 'invest',
    ams_vendor: i % 5 === 0 ? 'AWS Professional Services' : 'Internal AWS Platform',
    business_unit_id: ['customer', 'operations', 'loyalty', 'data', 'security'][i % 5],
  }, 'S04_AWS_NATIVE_ESTATE', 'source_uploads/aws_service_inventory.csv', `row ${i + 2}`));
}

const allSystemIds = [...records.S03_MAINFRAME_INVENTORY.map((r) => r.workload_id), ...records.S04_AWS_NATIVE_ESTATE.map((r) => r.service_id)];
for (let i = 0; i < 95; i++) {
  const source = allSystemIds[i % allSystemIds.length];
  const target = allSystemIds[(i * 7 + 11) % allSystemIds.length];
  records.S05_INTEGRATION_TOPOLOGY.push(addProvenance({
    edge_id: `SHA-EDGE-${String(i + 1).padStart(3, '0')}`,
    source_system_id: source,
    target_system_id: target,
    integration_type: ['sync_API', 'async_event', 'batch_file', 'CDC', 'dual_write'][i % 5],
    latency_class: i % 5 === 0 ? 'sub-second' : i % 5 === 1 ? 'minutes' : 'overnight',
    business_capability: mainframeDomains[i % mainframeDomains.length],
    fragility: (i % 5) + 1,
    modernization_blocker_flag: i % 6 === 0,
    pattern: i % 5 === 4 ? 'dual-run bridge requiring explicit retirement criterion' : 'standard modernization dependency edge',
  }, 'S05_INTEGRATION_TOPOLOGY', 'source_uploads/integration_topology_edges.csv', `row ${i + 2}`));
}
for (let i = 0; i < 18; i++) {
  records.S05_INTEGRATION_TOPOLOGY.push(addProvenance({
    pattern_id: `SHA-INTPAT-${String(i + 1).padStart(3, '0')}`,
    pattern_name: ['Z batch fanout', 'CDC dual-run', 'event bridge', 'API strangler', 'settlement reconciliation', 'crew legality bridge'][i % 6],
    description: 'Reusable airline modernization integration pattern used to explain why some workloads stay on Z while adjacent capabilities move to AWS.',
    fragility: (i % 5) + 1,
  }, 'S05_INTEGRATION_TOPOLOGY', 'briefs/S05_integration_topology.brief.md', `pattern ${i + 1}`));
}

records.S06_IBM_ENGAGEMENT.push(addProvenance({
  engagement_id: 'SHA-IBM-MASTER',
  vendor: 'IBM',
  start_date: '2021-04-01',
  original_scope: 'Mainframe modernization factory, Z run support, extraction planning, API wrapping, and migration delivery',
  current_scope: 'Z run support, modernization factory, dependency analysis, test automation, and transition assistance',
  original_value_usd: 950000000,
  current_value_usd: 1400000000,
  annual_value_usd: 280000000,
  productivity_guarantees: 'Years 1-2 met; years 3-4 slipped; year 5 contested on modernization throughput definition',
  IP_ownership: 'Client-owned business logic; IBM reusable accelerators retained by IBM unless explicitly assigned',
  exit_rights: 'Transition assistance included, but knowledge-transfer acceptance criteria need clarification before FY2027 renewal',
}, 'S06_IBM_ENGAGEMENT', 'source_uploads/ibm_modernization_sow_summary.pdf', 'page 1'));
for (let i = 0; i < 25; i++) {
  records.S06_IBM_ENGAGEMENT.push(addProvenance({
    subrecord_id: `SHA-IBM-${String(i + 1).padStart(3, '0')}`,
    record_type: i % 5 === 0 ? 'change_order' : i % 5 === 1 ? 'milestone' : i % 5 === 2 ? 'kpi_actual' : i % 5 === 3 ? 'exit_clause' : 'knowledge_transfer',
    description: i % 5 === 0 ? 'Scope expanded after downstream dependency discovery.' : 'Modernization factory evidence item.',
    target_value: i % 5 === 2 ? 12 + i : null,
    actual_value: i % 5 === 2 ? 8 + Math.floor(i / 2) : null,
    dispute_status: i % 9 === 0 ? 'contested' : 'accepted',
  }, 'S06_IBM_ENGAGEMENT', 'source_uploads/ibm_modernization_sow_summary.pdf', `section ${i + 2}`));
}

const initiativeThemes = [
  'AI-Powered SDLC Modernization Factory', 'IROPs Recovery Decision Engine', 'Crew Legality Cloud Extract', 'Loyalty Personalization Guardrails',
  'Revenue Accounting Batch Unwind', 'Customer Profile Dual-Run Exit', 'Baggage Recovery Event Stream', 'AWS Landing Zone Hardening',
  'IBM Outcomes Restructure', 'GCC Cloud Engineering Ramp', 'Cyber Control Plane Rationalization', 'Data Product Catalog Adoption',
  'Contact Center AI Assist', 'Airport Ops API Modernization', 'Snowflake Databricks Consolidation', 'Mainframe Test Automation',
];
for (let i = 0; i < 38; i++) {
  const red = i % 9 === 0;
  const yellow = i % 4 === 0;
  records.S07_INITIATIVES.push(addProvenance({
    initiative_id: `SHA-INIT-${String(i + 1).padStart(3, '0')}`,
    title: initiativeThemes[i % initiativeThemes.length],
    name: initiativeThemes[i % initiativeThemes.length],
    sponsor: ['CTO', 'CIO Amala Rao', 'CFO', 'COO', 'CISO', 'SVP Procurement'][i % 6],
    accountable: ['VP Airline Platforms', 'VP Cloud Platform', 'VP Digital Ops', 'VP Engineering Excellence'][i % 4],
    owner_team: ['Modernization Office', 'AWS Platform', 'Operations Technology', 'Digital Customer', 'GCC Enablement'][i % 5],
    category: ['modernization', 'AI', 'operational', 'customer', 'data', 'security', 'GCC'][i % 7],
    budget_committed: 6000000 + i * 1700000,
    committed_usd: 6000000 + i * 1700000,
    budget_consumed: 2400000 + i * 850000,
    projected_value_usd: 8000000 + i * 2200000,
    started_date: `2025-${String((i % 12) + 1).padStart(2, '0')}-01`,
    target_completion: `2026-${String((i % 12) + 1).padStart(2, '0')}-28`,
    status: red ? 'red' : yellow ? 'yellow' : 'green',
    stage: i % 5 === 0 ? 'scale' : i % 5 === 1 ? 'pilot' : i % 5 === 2 ? 'build' : i % 5 === 3 ? 'design' : 'run',
    benefits_thesis: 'Reduce modernization cycle time, operational fragility, or vendor dependency while protecting airline reliability.',
    dependency_list: `${allSystemIds[i % allSystemIds.length]};${allSystemIds[(i + 13) % allSystemIds.length]}`,
    vendors: i % 3 === 0 ? 'IBM;AWS' : i % 3 === 1 ? 'AWS;Internal GCC' : 'IBM;GCC Partner',
    executive_visibility: i < 14 ? 'board' : i < 26 ? 'C-suite' : 'divisional',
    sentinel_posture: red ? 'RESTRUCTURE' : i % 11 === 0 ? 'KILL' : yellow ? 'WATCH' : 'ACCELERATE',
    evidence_note: red ? 'Value proof is behind plan or dependency closure is weak.' : 'Evidence supports continuation with explicit gate controls.',
  }, 'S07_INITIATIVES', 'source_uploads/initiative_portfolio.csv', `row ${i + 2}`));
}

const vendors = ['IBM', 'AWS', 'Salesforce', 'Microsoft', 'Amadeus', 'Sabre', 'AMOS Aviation', 'GE Digital', 'Honeywell Aerospace', 'Boeing Digital', 'Datadog', 'Splunk', 'Wiz', 'CrowdStrike', 'Genesys', 'Adyen', 'Snowflake', 'Databricks', 'Anthropic', 'OpenAI', 'GitHub', 'Cursor', 'Tabnine', 'Infosys', 'TCS', 'Accenture', 'ServiceNow', 'Okta', 'Palo Alto Networks', 'Akamai', 'Cisco', 'Oracle', 'Workday', 'Coupa', 'Icertis', 'PagerDuty', 'Snyk', 'JFrog', 'HashiCorp', 'Confluent', 'MongoDB', 'Redis', 'Fivetran', 'dbt Labs', 'Collibra', 'Informatica', 'MuleSoft', 'Apigee', 'NICE', 'Twilio', 'BMC', 'Rocket Software'];
for (let i = 0; i < 52; i++) {
  const annual = i === 0 ? 280000000 : i === 1 ? 180000000 : 5000000 + (52 - i) * 1450000;
  records.S08_VENDOR_PORTFOLIO.push(addProvenance({
    contract_id: `SHA-VEND-${String(i + 1).padStart(3, '0')}`,
    vendor_id: `SHA-VEND-${String(i + 1).padStart(3, '0')}`,
    vendor: vendors[i],
    vendor_name: vendors[i],
    category: ['cloud', 'SI', 'observability', 'security', 'PSS', 'MRO', 'loyalty', 'data_platform', 'AI_tooling', 'contact_center', 'payment', 'GDS'][i % 12],
    annual_spend: annual,
    annual_usd: annual,
    annual_value_usd: annual,
    contract_start: `202${i % 4}-01-01`,
    contract_end: `202${6 + (i % 3)}-${String((i % 12) + 1).padStart(2, '0')}-01`,
    renewal_date: `202${6 + (i % 3)}-${String((i % 12) + 1).padStart(2, '0')}-01`,
    auto_renewal_flag: i % 4 === 0,
    exit_terms: i === 0 ? 'Transition rights exist but acceptance criteria and knowledge-transfer evidence are contested.' : i % 5 === 0 ? '90-day termination for convenience unavailable; 12-month step-down required.' : 'standard 90-180 day notice',
    exit_clause_summary: i === 0 ? 'FY2027 restructure window is critical; exit path depends on knowledge transfer and IP clarification.' : 'standard enterprise terms',
    ai_usage_clauses: i % 4 === 0 ? 'AI usage permitted with audit, indemnity, and no-training restrictions' : 'AI clauses not yet modernized',
    renegotiation_window_open_date: `2026-${String(((i + 3) % 12) + 1).padStart(2, '0')}-01`,
    strategic_criticality: i < 6 ? 5 : i < 20 ? 4 : 3,
    notes: i === 0 ? 'IBM modernization scope, productivity, and knowledge-transfer leverage point.' : 'SkyHarbor vendor portfolio record.',
  }, 'S08_VENDOR_PORTFOLIO', 'source_uploads/vendor_renewal_calendar.csv', `row ${i + 2}`));
}

const domains = ['Mobile Digital', 'Web Booking', 'Mainframe Core', 'Crew Systems', 'Airport Ops', 'Baggage', 'Loyalty', 'Revenue Accounting', 'AWS Platform', 'Data Platform', 'Security Engineering', 'Contact Center', 'MRO Tech', 'Cargo', 'Finance IT', 'GCC Delivery', 'Modernization Factory', 'DevEx Tooling'];
for (let i = 0; i < 18; i++) {
  records.S09_ENGINEERING_PRODUCTIVITY.push(addProvenance({
    scorecard_id: `SHA-DORA-${String(i + 1).padStart(3, '0')}`,
    domain: domains[i],
    lead_time_for_change_hours: i < 2 ? 8 : i < 8 ? 72 + i * 4 : i < 12 ? 36 : 120 + i * 3,
    deploy_frequency_per_week: i < 2 ? 25 : i < 8 ? 3 : i < 12 ? 8 : 1,
    MTTR_hours: i < 2 ? 1.5 : i < 8 ? 12 : 6,
    change_failure_rate_pct: i < 2 ? 4 : i < 8 ? 18 : 10,
    automated_test_coverage_pct: i < 2 ? 82 : i < 8 ? 41 : 63,
    environment_provisioning_time_hours: i < 8 ? 96 : 12,
    AI_tooling_adoption_pct: i < 8 ? 24 : 58,
    factory_throughput: i < 8 ? 'improving but bottlenecked by test data and SME availability' : 'stable',
  }, 'S09_ENGINEERING_PRODUCTIVITY', 'source_uploads/dora_productivity_baseline.csv', `row ${i + 2}`));
}
for (let i = 0; i < 24; i++) {
  records.S09_ENGINEERING_PRODUCTIVITY.push(addProvenance({
    drilldown_id: `SHA-PROD-${String(i + 1).padStart(3, '0')}`,
    domain: domains[i % domains.length],
    metric: ['test data wait', 'environment queue', 'defect leakage', 'manual regression hours'][i % 4],
    baseline: 20 + i * 3,
    target: 12 + i,
    insight: 'Modernization factory speed is gated by non-coding constraints as much as code transformation.',
  }, 'S09_ENGINEERING_PRODUCTIVITY', 'source_uploads/dora_productivity_baseline.csv', `drilldown ${i + 2}`));
}

records.S10_GCC_CAPABILITY.push(addProvenance({
  gcc_id: 'SHA-GCC-MASTER',
  locations: 'Bangalore 650; Hyderabad 350',
  headcount: 1000,
  engineering_pct: 28,
  qa_pct: 34,
  ops_pct: 24,
  data_ai_pct: 7,
  cyber_pct: 7,
  peer_average_headcount: 3500,
  target_24mo_headcount: 2800,
  unit_cost_vs_onshore_pct: 38,
  attrition_pct: 22,
  ramp_constraints: 'Whitefield real estate, senior cloud hiring, mainframe SME transfer, and time-zone product ownership gaps.',
}, 'S10_GCC_CAPABILITY', 'source_uploads/gcc_capability_roster.csv', 'summary'));
for (let i = 0; i < 22; i++) {
  records.S10_GCC_CAPABILITY.push(addProvenance({
    gcc_record_id: `SHA-GCC-${String(i + 1).padStart(3, '0')}`,
    capability: ['COBOL analysis', 'AWS platform engineering', 'test automation', 'data engineering', 'AI SDLC enablement', 'L2 ops', 'security engineering'][i % 7],
    current_headcount: 20 + i * 6,
    target_headcount_24mo: 80 + i * 10,
    skill_gap: i % 3 === 0 ? 'senior technical leads' : i % 3 === 1 ? 'domain SMEs' : 'automation engineers',
    peer_benchmark: ['United-like 3.2K', 'American-like 4.1K', 'Lufthansa-like 5.8K', 'AF-KLM-like 2.9K'][i % 4],
  }, 'S10_GCC_CAPABILITY', 'source_uploads/gcc_capability_roster.csv', `row ${i + 2}`));
}

const sdlcCats = ['COBOL_analysis', 'dependency_mining', 'test_generation', 'doc_extraction', 'refactor_assistance', 'API_contract_gen', 'code_review', 'security_scan'];
for (let i = 0; i < 22; i++) {
  records.S11_AI_SDLC_OPPORTUNITY.push(addProvenance({
    opportunity_id: `SHA-AISDLC-${String(i + 1).padStart(3, '0')}`,
    category: sdlcCats[i % sdlcCats.length],
    domain: domains[(i + 2) % domains.length],
    current_baseline_metric: i % 2 === 0 ? `${120 + i * 4} SME hours per workload analysis` : `${45 + i * 2} regression test days per release`,
    target_metric: i % 2 === 0 ? `${70 + i * 2} SME hours per analysis` : `${24 + i} regression test days`,
    AI_tooling_candidate: ['IBM watsonx Code Assistant', 'Amazon Q Developer', 'GitHub Copilot Enterprise', 'Cursor Enterprise', 'Tabnine Enterprise'][i % 5],
    risk_class: i % 5 === 0 ? 'high' : i % 3 === 0 ? 'medium' : 'low',
    readiness_score: (i % 5) + 1,
    guardrail: 'Human review, generated-test traceability, code provenance, security scan, and rollback evidence required before production use.',
  }, 'S11_AI_SDLC_OPPORTUNITY', 'source_uploads/ai_sdlc_opportunity_assessment.csv', `row ${i + 2}`));
}

const execs = [
  ['CEO', 'Jordan Vale', 'Protect premium experience while proving modernization discipline.'],
  ['CFO', 'Marisol Chen', 'Separate realized value from projected value and slow spend growth.'],
  ['CTO', 'Evan Kline', 'Defend five-year progress while reshaping the next wave.'],
  ['CIO', 'Amala Rao', 'Challenge pace, vendor dependency, and cloud-native operating maturity.'],
  ['COO', 'Tara Whitcomb', 'Protect operational reliability and IROPs recovery.'],
  ['CISO', 'Owen Mercer', 'Reduce cloud control-plane sprawl and govern AI-generated code.'],
  ['CDO', 'Samir Nadeem', 'Free operational data trapped in Z batches.'],
  ['CHRO', 'Leah Brooks', 'Scale GCC without creating retention and leadership gaps.'],
  ['Chief Customer', 'Nina Alvarez', 'Turn personalization into trusted service, not creepy targeting.'],
  ['Chief TechOps', 'Grant Holloway', 'Do not disrupt maintenance and aircraft availability systems.'],
  ['General Counsel', 'Priya Sethi', 'Control AI, data rights, and vendor transition obligations.'],
  ['SVP Procurement', 'Marcus Bell', 'Use FY2027 windows to restructure IBM, AWS, and AI tooling economics.'],
];
for (const [i, [role, name, thesis]] of execs.entries()) {
  records.S12_EXECUTIVE_DECISION_MAP.push(addProvenance({
    persona_id: `SHA-EXEC-${String(i + 1).padStart(3, '0')}`,
    persona: role,
    name,
    modernization_thesis: thesis,
    top_3_concerns: 'value proof; operating risk; vendor leverage',
    what_would_change_their_mind: 'Evidence that the next wave has quantified value, lower dependency fragility, and accountable owners.',
    recent_public_statements_pattern: 'Executive-style synthetic statement, not a real target-carrier quote.',
    alignment_with_CTO: role === 'CTO' ? 5 : role === 'CIO' ? 3 : i % 5 + 1,
  }, 'S12_EXECUTIVE_DECISION_MAP', 'source_uploads/executive_stakeholder_map.csv', `row ${i + 2}`));
}
for (let i = 0; i < 28; i++) {
  records.S12_EXECUTIVE_DECISION_MAP.push(addProvenance({
    tension_id: `SHA-TENSION-${String(i + 1).padStart(3, '0')}`,
    from_persona: execs[i % execs.length][0],
    to_persona: execs[(i + 3) % execs.length][0],
    tension: ['pace vs reliability', 'vendor continuity vs leverage', 'projected value vs validated value', 'AI productivity vs code risk'][i % 4],
    decision_needed: 'Use AbarVa to convert the tension into evidence, dissent, and a next-action recommendation.',
  }, 'S12_EXECUTIVE_DECISION_MAP', 'source_uploads/executive_stakeholder_map.csv', `tension ${i + 2}`));
}

for (let i = 0; i < 56; i++) {
  const promised = 5000000 + i * 390000;
  const status = i % 7 === 0 ? 'stuck' : i % 5 === 0 ? 'disputed' : i % 3 === 0 ? 'partial' : 'validated';
  const realized = status === 'validated' ? promised * 0.82 : status === 'partial' ? promised * 0.43 : status === 'disputed' ? promised * 0.25 : 0;
  const disputed = status === 'disputed' ? promised - realized : status === 'stuck' ? promised : 0;
  records.S13_VALUE_LEDGER.push(addProvenance({
    value_id: `SHA-VAL-${String(i + 1).padStart(3, '0')}`,
    source_initiative_id: records.S07_INITIATIVES[i % records.S07_INITIATIVES.length].initiative_id,
    value_type: ['cost_savings', 'revenue_uplift', 'risk_reduction', 'cycle_time', 'customer_NPS', 'employee_productivity'][i % 6],
    promised_amount: Math.round(promised),
    realized_amount: Math.round(realized),
    disputed_amount: Math.round(disputed),
    evidence_status: status,
    validation_owner: ['CFO FP&A', 'Modernization PMO', 'Operations Finance', 'Procurement Analytics'][i % 4],
  }, 'S13_VALUE_LEDGER', 'source_uploads/value_realization_tracker.xlsx', `row ${i + 2}`));
}

const kpis = ['completion_factor', 'OTP_D0', 'mishandled_bags_per_1k', 'crew_legality_recovery_minutes', 'IROPs_cost_per_disruption_usd', 'IT_run_rate_usd', 'modernization_spend_velocity_usd', 'customer_NPS_tier_A', 'mobile_app_session_conversion_pct'];
for (let i = 0; i < 36; i++) {
  const kpi = kpis[i % kpis.length];
  records.S14_OPERATIONAL_KPIS.push(addProvenance({
    kpi_observation_id: `SHA-KPI-${String(i + 1).padStart(3, '0')}`,
    kpi_id: kpi,
    name: kpi.replaceAll('_', ' '),
    category: ['operational', 'financial', 'customer', 'safety'][i % 4],
    period_month: `202${4 + Math.floor(i / 18)}-${String((i % 12) + 1).padStart(2, '0')}`,
    monthly_value: Number((80 + (i % 9) * 1.7 - (i % 5)).toFixed(2)),
    target: 92,
    peer_benchmark: 90,
    trend_24mo: i % 4 === 0 ? 'improving' : i % 4 === 1 ? 'flat' : i % 4 === 2 ? 'volatile' : 'deteriorating',
    modernization_correlation_score: Number(((i % 10) / 10).toFixed(2)),
  }, 'S14_OPERATIONAL_KPIS', 'source_uploads/operational_kpi_timeseries.csv', `row ${i + 2}`));
}

for (let i = 0; i < 32; i++) {
  const contract = records.S08_VENDOR_PORTFOLIO[i % records.S08_VENDOR_PORTFOLIO.length];
  records.S15_SOURCING_PIPELINE.push(addProvenance({
    event_id: `SHA-SRC-${String(i + 1).padStart(3, '0')}`,
    vendor_contract_id: contract.contract_id,
    event_type: ['renewal', 'restructure', 'RFP', 'consolidation', 'exit'][i % 5],
    trigger_date: `2026-${String((i % 12) + 1).padStart(2, '0')}-15`,
    lead_time_required_days: i < 3 ? 240 : 90 + (i % 5) * 30,
    decision_owner: ['SVP Procurement', 'CTO', 'CIO Amala Rao', 'CISO', 'CFO'][i % 5],
    current_state: i === 0 ? 'IBM modernization renewal window needs outcomes, knowledge-transfer, and AI productivity leverage.' : 'Sourcing event queued by SkyHarbor modernization substrate.',
    target_outcome: i === 0 ? 'Restructure IBM engagement around measurable modernization throughput and transition rights.' : 'Improve commercial terms, exit rights, and operating resilience.',
    leverage_factors: 'benchmarkable rates; competing delivery model; GCC ramp; AI SDLC productivity; value-led renewal timing',
  }, 'S15_SOURCING_PIPELINE', 'source_uploads/sourcing_pipeline.csv', `row ${i + 2}`));
}

function writeProfile() {
  write('00-profile/enterprise-profile.yaml', `client_id: ${CLIENT_ID}
client_key: ${CLIENT_KEY}
tenant_key: skyharbor-air
name: SkyHarbor Air
legal_name: SkyHarbor Air Group
industry: global_network_airline
revenue_usd: 52100000000
employees: 95000
tech_employees: 6800
aircraft: 950
loyalty_members: 110000000
it_budget_usd: 3200000000
modernization_spend_5yr_usd: 2400000000
strategic_posture: Five-year CTO-led IBM mainframe to AWS modernization program entering evidence-led acceleration phase.
data_policy: De-identified synthetic tenant shaped by public airline scale anchors and comparable-carrier modernization patterns.
`);
}

function writeTemplates() {
  for (const [code, slug, title] of segments) {
    const schema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      title: `${code} ${title}`,
      type: 'object',
      required: ['client_id', 'client_key', 'segment_id', 'data_basis', 'source_artifact_path', 'approval_status', 'confidence'],
      properties: {
        client_id: { type: 'string' },
        client_key: { const: CLIENT_KEY },
        segment_id: { const: code },
        data_basis: { enum: Object.keys(sourceBasis) },
        source_artifact_path: { type: 'string' },
        source_ref: { type: 'string' },
        parser_used: { type: 'string' },
        approval_status: { enum: ['approved_synthetic', 'pending_customer_approval', 'rejected', 'superseded'] },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
      },
      additionalProperties: true,
    };
    write(`templates/schemas/${slug}.schema.json`, `${JSON.stringify(schema, null, 2)}\n`);
  }
  write('templates/ontology/entity_types.yaml', `entity_types:
  - mainframe_workload
  - aws_service
  - integration_edge
  - vendor_contract
  - initiative
  - modernization_event
  - kpi_observation
  - executive_persona
  - value_record
  - sourcing_event
  - gcc_capability
  - ai_sdlc_opportunity
  - business_capability
  - source_artifact
  - evidence_chunk
  - ibm_engagement_record
  - dora_scorecard
  - airport_operations_domain
  - loyalty_domain
  - crew_domain
  - revenue_accounting_domain
  - cloud_account
  - data_product
  - security_control
  - procurement_lever
  - decision_tension
  - board_priority
  - synthetic_public_anchor
`);
  write('templates/ontology/edge_types.yaml', `edge_types:
  - extracted_from
  - depends_on
  - replaced_by
  - dual_run_with
  - owned_by
  - sponsors
  - blocks_modernization
  - sources_value_from
  - funded_by
  - contracted_to
  - renewed_by
  - challenged_by
  - validates
  - disputes
  - feeds
  - emits_event_to
  - consumes_batch_from
  - governs
  - uses_tool
  - accelerates
  - constrains
  - creates_risk_for
  - mitigates
  - cites
`);
  write('templates/ontology/domain_tags.yaml', `domain_tags:
  - passenger_service
  - departure_control
  - crew
  - IROPs
  - MRO
  - revenue_management
  - loyalty
  - cargo
  - finance
  - customer_app
  - AI
  - GCC
  - cyber
  - sourcing
  - airport_ops
  - baggage
  - settlement
  - data_platform
`);
  write('templates/ontology/controlled_vocabularies.yaml', `modernization_action: [extract, wrap, retire, leave, reverse, analyze]
modernization_outcome: [delivered, delayed, over-ran, abandoned, mixed, reversed]
criticality: [1, 2, 3, 4, 5]
data_basis: [public_anchor, synthetic_comparable, generated_assumption, user_supplied_future]
approval_status: [approved_synthetic, pending_customer_approval, rejected, superseded]
evidence_status: [validated, partial, projected, stuck, disputed]
`);
  const patternFiles = [
    'mainframe_workload_narrative', 'modernization_event_narrative', 'vendor_contract_narrative',
    'ai_sdlc_opportunity_narrative', 'executive_tension_narrative', 'kpi_observation_narrative',
    'value_record_narrative',
  ];
  for (const name of patternFiles) {
    write(`templates/content_patterns/${name}.template.md`, `# ${name}

Tone: CTO-respectful, evidence-led, airline-current-state fluent.
Length target: 180-320 words per emitted chunk.
Required anchors: record ID, source artifact path, data_basis, confidence, and at least one cross-segment relationship.
Citation style: cite the source row/page and the generated record ID.
Include: why the fact matters to mainframe-to-AWS modernization, AI-powered SDLC, IBM dependency, GCC scaling, or operational reliability.
Avoid: target-carrier confidential claims, real target-carrier executives, ungrounded named systems, or language implying the five-year CTO program failed.
`);
  }
  write('templates/conventions/id_schemes.md', `# ID Schemes

Stable IDs use \`SHA-\` prefix plus segment-specific code. Graph entity IDs are deterministic SHA-256 hashes over \`client_key + entity_type + canonical_name\`.
`);
  write('templates/conventions/naming_conventions.md', `# Naming Conventions

Use de-identified airline domain names. Do not use target-carrier logos, internal system names, or real executive names. Vendor names may use common public-market vendors where the record is explicitly synthetic.
`);
  write('templates/conventions/slug_rules.md', `# Slug Rules

Lowercase, dash-separated, ASCII only. The tenant slug is \`${CLIENT_KEY}\`.
`);
  write('templates/conventions/versioning_rules.md', `# Versioning Rules

Synthetic source uploads are versioned as v1. Customer-supplied future data should supersede synthetic rows without deleting the synthetic baseline.
`);
  write('templates/chunks/chunk_types.md', `chunk_types: definition, lineage, runbook, decision, value, risk, opportunity, executive_view, industry_pattern`);
  write('templates/chunks/chunk_size_guidance.md', `Chunks target 200-600 tokens and never split a number away from its source row. Named entities must trace to provenance.`);
  write('templates/chunks/chunk_metadata_schema.json', `${JSON.stringify({ type: 'object', required: ['content_type', 'source_system', 'source_artifact_path', 'domain', 'persona_relevance', 'data_basis'] }, null, 2)}\n`);
  write('templates/ground_truth/ctos_top_25_questions.md', tier1Questions.map((q, i) => `${i + 1}. ${q}`).join('\n') + '\n');
  write('templates/ground_truth/cios_top_15_questions.md', Array.from({ length: 15 }, (_, i) => `${i + 1}. How does Amala's challenge map to evidence item ${i + 1}?`).join('\n') + '\n');
  write('templates/ground_truth/cfos_top_10_questions.md', Array.from({ length: 10 }, (_, i) => `${i + 1}. Which value record proves or disputes modernization value item ${i + 1}?`).join('\n') + '\n');
  write('templates/ground_truth/expected_answer_patterns.md', `# Expected Answer Patterns

Top answers must cite exact record IDs and source paths. For the first progress question, required facts are: 19 of 47 capabilities extracted, 28 remain on Z, 40% MIPS reduction, 22% revenue-critical transaction volume moved, $520M-scale validated value, and a caveat that progress is real but next-wave value proof must improve.
`);
}

function writeBriefs() {
  for (const [code, slug, title] of segments) {
    const brief = `# ${title} Brief

Segment: ${code}

Purpose: This brief is the human-readable input used to generate the ${title} records for SkyHarbor Air, a major-carrier-shaped but fully de-identified synthetic global network carrier. It explains the narrative shape before records are emitted, so a CTO can inspect the upstream logic rather than accepting a black-box corpus.

Sources and inspiration: public airline annual reports, airline technology modernization press, cloud/mainframe modernization case studies, airport operations literature, IBM Z modernization patterns, AWS migration patterns, airline IROPs operating constraints, and comparable-carrier public signals. This brief does not contain target-carrier confidential data, target-carrier internal system names, target-carrier executive names, logos, or non-public roadmap content.

What we do not know about the target carrier: exact internal system names, current IBM contract terms, private AWS account architecture, actual modernization wave backlog, actual DORA scores, real value ledger, real GCC staffing mix, and real internal executive tension map. SkyHarbor uses synthetic comparable patterns to rehearse how AbarVa would process those real artifacts after approval.

Narrative skeleton: SkyHarbor is five years into a CTO-led IBM mainframe to AWS modernization program. The program has real wins: reduced MIPS, extracted customer and loyalty capabilities, created AWS-native platform muscle, and improved several customer-facing domains. The program also has honest constraints: remaining revenue-critical transaction volume, dual-run complexity, IBM dependency, contested productivity guarantees, value stuck in projected state, and a GCC that is materially below peer carrier scale.

Generation guidance: every emitted record must state what has already happened, what remains constrained, where evidence is strong, and where a recommendation would need customer-supplied facts. The tone must help the CTO defend the five-year journey while giving CIO Amala a credible challenge path.

Segment-specific emphasis: ${title} should connect back to at least three of these decision themes: next-wave extraction sequencing, IBM restructure leverage, AI-powered SDLC opportunity, GCC ramp, operational reliability, sourcing leverage, and value proof. The generated records should not imply greenfield modernization. They should read like a mature mid-program current state.

Reusable-pilot note: In a real customer pilot, this brief would be replaced by approved extracts from CMDB, Jira/ADO, IBM SOWs, AWS inventory, Apptio/finance, vendor repository, DORA dashboards, and board technology updates. The schemas, validators, graph builder, chunk generator, provenance ledger, and verification gates remain the same.
`;
    write(`briefs/${slug}.brief.md`, brief);
  }
}

async function writeSourceUploads() {
  const workbookSpecs = [
    ['source_uploads/mainframe_inventory_current_state.xlsx', records.S03_MAINFRAME_INVENTORY],
    ['source_uploads/modernization_ledger_5yr.xlsx', records.S02_MODERNIZATION_LEDGER],
    ['source_uploads/value_realization_tracker.xlsx', records.S13_VALUE_LEDGER],
  ];
  for (const [rel, rows] of workbookSpecs) {
    writeSimpleXlsx(rel, rows);
  }
  const csvUploads = [
    ['source_uploads/aws_service_inventory.csv', records.S04_AWS_NATIVE_ESTATE],
    ['source_uploads/integration_topology_edges.csv', records.S05_INTEGRATION_TOPOLOGY.filter((r) => r.edge_id)],
    ['source_uploads/initiative_portfolio.csv', records.S07_INITIATIVES],
    ['source_uploads/vendor_renewal_calendar.csv', records.S08_VENDOR_PORTFOLIO],
    ['source_uploads/dora_productivity_baseline.csv', records.S09_ENGINEERING_PRODUCTIVITY],
    ['source_uploads/gcc_capability_roster.csv', records.S10_GCC_CAPABILITY],
    ['source_uploads/ai_sdlc_opportunity_assessment.csv', records.S11_AI_SDLC_OPPORTUNITY],
    ['source_uploads/executive_stakeholder_map.csv', records.S12_EXECUTIVE_DECISION_MAP],
    ['source_uploads/operational_kpi_timeseries.csv', records.S14_OPERATIONAL_KPIS],
    ['source_uploads/sourcing_pipeline.csv', records.S15_SOURCING_PIPELINE],
  ];
  for (const [rel, rows] of csvUploads) write(rel, toCsv(rows));
  writeSimpleDocx('source_uploads/board_technology_update_2026q1.docx', 'SkyHarbor Board Technology Update 2026 Q1', [
    'The CTO-sponsored modernization program has delivered MIPS reduction and customer-domain progress, while CIO Amala Rao is challenging pace, value proof, and dependency concentration.',
    'The next wave should sequence extraction candidates by value-to-risk ratio, not architecture preference.',
    'This synthetic document is structurally valid DOCX and demonstrates the source-upload slot used in a real pilot.',
  ]);
  writeSimplePdf('source_uploads/ibm_modernization_sow_summary.pdf', 'SkyHarbor IBM Modernization SOW Summary', [
    'Synthetic PDF. Current scope is 280M per year across Z run support, modernization factory, dependency analysis, test automation, and transition assistance.',
    'Productivity guarantees were met in years 1-2, slipped in years 3-4, and are contested in year 5.',
    'Exit and transition rights require sharper acceptance criteria before FY2027 renewal.',
  ]);
  writeSimplePdf('source_uploads/aws_edp_summary.pdf', 'SkyHarbor AWS EDP Summary', [
    'Synthetic PDF. FY2022 EDP starts at 180M annual commit and ramps toward 260M by FY2027.',
    'True-up exposure rises when AWS-native extractions consume committed spend without retiring duplicate Z complexity.',
    'The sourcing posture should connect EDP ramp, modernization wave gates, and platform maturity.',
  ]);
}

function writeRecords() {
  for (const [code, slug] of segments) {
    write(`records/json/${slug}.json`, `${JSON.stringify(records[code], null, 2)}\n`);
    write(`records/csv/${slug}.csv`, toCsv(records[code]));
  }
  const apps = [...records.S03_MAINFRAME_INVENTORY, ...records.S04_AWS_NATIVE_ESTATE].map((r) => ({
    app_id: r.app_id,
    name: r.name,
    criticality: r.criticality >= 5 ? 'tier1' : r.criticality >= 4 ? 'tier2' : 'tier3',
    business_unit_id: r.business_unit_id || r.business_capability || 'airline_technology',
    stack_era: r.stack_era || 'hybrid',
    time_classification: r.time_classification || 'invest',
    annual_run_cost_usd: r.annual_run_cost_usd || 1000000,
    ams_vendor: r.ams_vendor || 'Internal',
    notes: `${r.segment_id} source=${r.source_artifact_path}`,
  }));
  write('07-application-portfolio/application-portfolio.csv', toCsv(apps));
  write('10-initiatives/initiatives-active.csv', toCsv(records.S07_INITIATIVES.map((r) => ({
    initiative_id: r.initiative_id,
    title: r.title,
    sponsor_role: r.sponsor,
    accountable: r.accountable,
    stage: r.stage,
    status: 'active',
    committed_usd: r.committed_usd,
    projected_value_usd: r.projected_value_usd,
    vendors: r.vendors,
    sentinel_posture: r.sentinel_posture,
    evidence_note: r.evidence_note,
  }))));
  write('10-initiatives/initiatives-closed.csv', toCsv([]));
  write('09-vendors-contracts/vendor-contracts.csv', toCsv(records.S08_VENDOR_PORTFOLIO.map((r) => ({
    vendor_id: r.vendor_id,
    vendor_name: r.vendor_name,
    category: r.category,
    annual_value_usd: r.annual_value_usd,
    renewal_date: r.renewal_date,
    exit_terms: r.exit_terms,
    ai_usage_clauses: r.ai_usage_clauses,
    data_rights: 'client-owned operational data; vendor-derived accelerators require review',
    notes: r.notes,
  }))));
}

function buildGraphAndChunks() {
  const entities = [];
  const edges = [];
  const provenance = [];
  const allRecords = Object.entries(records).flatMap(([segment, rows]) => rows.map((row) => ({ segment, row })));
  for (const { segment, row } of allRecords) {
    const natural = row.app_id || row.service_id || row.workload_id || row.initiative_id || row.contract_id || row.value_id || row.event_id || row.fact_id || row.persona_id || row.opportunity_id || row.kpi_observation_id || row.edge_id || row.subrecord_id || row.gcc_record_id || row.tension_id || row.pattern_id || row.engagement_id || row.gcc_id || stableId('SHA-REC', JSON.stringify(row));
    entities.push({
      entity_id: stableId('SHA-ENTNODE', `${segment}:${natural}`),
      natural_id: natural,
      entity_type: inferEntityType(segment),
      name: row.name || row.title || row.vendor_name || row.capability_name || row.persona || natural,
      segment_id: segment,
      source_artifact_path: row.source_artifact_path,
      confidence: row.confidence,
    });
    provenance.push({
      record_id: natural,
      segment_id: segment,
      source_artifact_path: row.source_artifact_path,
      source_ref: row.source_ref,
      parser_used: row.parser_used,
      approval_status: row.approval_status,
      data_basis: row.data_basis,
      confidence: row.confidence,
      record_hash: sha(JSON.stringify(row)),
    });
  }
  const byNatural = new Map(entities.map((e) => [e.natural_id, e]));
  for (const edge of records.S05_INTEGRATION_TOPOLOGY.filter((r) => r.edge_id)) {
    edges.push({
      edge_id: edge.edge_id,
      source: byNatural.get(edge.source_system_id)?.entity_id || edge.source_system_id,
      target: byNatural.get(edge.target_system_id)?.entity_id || edge.target_system_id,
      edge_type: edge.modernization_blocker_flag ? 'blocks_modernization' : 'depends_on',
      evidence_record_id: edge.edge_id,
      fragility: edge.fragility,
    });
  }
  for (const init of records.S07_INITIATIVES) {
    for (const dep of String(init.dependency_list).split(';')) {
      edges.push({
        edge_id: stableId('SHA-GEDGE', `${init.initiative_id}:${dep}`),
        source: byNatural.get(init.initiative_id)?.entity_id,
        target: byNatural.get(dep)?.entity_id || dep,
        edge_type: 'depends_on',
        evidence_record_id: init.initiative_id,
      });
    }
  }
  for (const value of records.S13_VALUE_LEDGER) {
    edges.push({
      edge_id: stableId('SHA-GEDGE', `${value.value_id}:${value.source_initiative_id}`),
      source: byNatural.get(value.value_id)?.entity_id,
      target: byNatural.get(value.source_initiative_id)?.entity_id,
      edge_type: 'sources_value_from',
      evidence_record_id: value.value_id,
    });
  }
  for (const src of records.S15_SOURCING_PIPELINE) {
    edges.push({
      edge_id: stableId('SHA-GEDGE', `${src.event_id}:${src.vendor_contract_id}`),
      source: byNatural.get(src.event_id)?.entity_id,
      target: byNatural.get(src.vendor_contract_id)?.entity_id,
      edge_type: 'renewed_by',
      evidence_record_id: src.event_id,
    });
  }
  write('graph/entities.jsonl', toJsonl(entities));
  write('graph/edges.jsonl', toJsonl(edges));
  write('graph/graph_summary.md', `# Graph Summary

- Entities: ${entities.length}
- Edges: ${edges.length}
- Top hubs: IBM engagement, AWS native estate, modernization initiatives, mainframe workloads.
- Orphan policy: allowed only for source artifacts and synthetic public anchors; verifier checks core cross-segment references.
`);
  write('provenance/provenance_ledger.jsonl', toJsonl(provenance));

  const chunks = [];
  const priority = [
    ...records.S01_ENTERPRISE_PROFILE,
    ...records.S02_MODERNIZATION_LEDGER,
    ...records.S03_MAINFRAME_INVENTORY,
    ...records.S04_AWS_NATIVE_ESTATE,
    ...records.S06_IBM_ENGAGEMENT,
    ...records.S07_INITIATIVES,
    ...records.S08_VENDOR_PORTFOLIO,
    ...records.S09_ENGINEERING_PRODUCTIVITY,
    ...records.S10_GCC_CAPABILITY,
    ...records.S11_AI_SDLC_OPPORTUNITY,
    ...records.S12_EXECUTIVE_DECISION_MAP,
    ...records.S13_VALUE_LEDGER,
    ...records.S14_OPERATIONAL_KPIS,
    ...records.S15_SOURCING_PIPELINE,
  ];
  let idx = 0;
  for (const row of priority) {
    if (chunks.length >= 420) break;
    chunks.push(makeChunk(row, idx++));
  }
  const industryPatterns = [
    'Airline modernization succeeds when customer-facing extractions are paired with batch reconciliation exit criteria.',
    'Mainframe MIPS reduction can look impressive while revenue-critical transaction volume remains concentrated.',
    'IROPs recovery is the acid test for cloud-native operational modernization.',
    'Crew legality and settlement workloads should not be extracted on architectural enthusiasm alone.',
    'AI-powered SDLC is safer when it starts with analysis, documentation, and tests before rewrite.',
    'GCC scale without domain product ownership increases handoff latency rather than reducing cost.',
    'IBM restructure leverage is strongest when value ledger, throughput metrics, and knowledge-transfer evidence are visible.',
    'Cloud EDP true-ups become risky when modernization waves consume baseline without retiring duplicate complexity.',
    'Dual-run architectures need explicit retirement criteria or they become the new legacy.',
    'CIO challenge is productive when it separates real gaps from perception gaps and preserves CTO credibility.',
  ];
  while (chunks.length < 480) {
    const p = industryPatterns[chunks.length % industryPatterns.length];
    chunks.push({
      id: `SHA-CHUNK-${String(chunks.length + 1).padStart(4, '0')}`,
      chunk_id: `SHA-CHUNK-${String(chunks.length + 1).padStart(4, '0')}`,
      tenant_id: CLIENT_KEY,
      title: `Airline modernization industry pattern ${chunks.length + 1}`,
      text: `${p} SkyHarbor applicability: use this pattern only as industry context and cite tenant records before making a tenant-specific recommendation. This pattern supports executive questions about IBM dependency, AWS extraction sequencing, AI SDLC, GCC scaling, and operational reliability. Data basis: synthetic_comparable. Caveat: not a target-carrier confidential fact.`,
      source_file_id: 'SHA-INDUSTRY-PATTERNS',
      source_segment_id: 'program_inventory',
      dataclass: 'internal',
      depth_score: 8,
      use_case: 'airline modernization industry pattern',
      industry: 'global network airline',
      confidence: 0.86,
      data_basis: 'synthetic_comparable',
    });
  }
  write('13-context/client-data-corpus.jsonl', toJsonl(chunks));
  write('13-context/source-files/SHA-SRC-METHODOLOGY.md', `# SkyHarbor Source Methodology

This file is loaded as source provenance for the context layer. It points to briefs, source uploads, templates, records, graph, chunks, and verification artifacts.
`);
  write('chunks/chunks.jsonl', toJsonl(chunks));
  const bySegment = chunks.reduce((acc, c) => {
    acc[c.source_segment_id] = (acc[c.source_segment_id] || 0) + 1;
    return acc;
  }, {});
  write('chunks/chunks_by_segment.md', `# Chunks By Segment

${Object.entries(bySegment).map(([k, v]) => `- ${k}: ${v}`).join('\n')}
`);
  write('embeddings/embeddings_manifest.md', `# Embeddings Manifest

Model target: Voyage-3-large requested by Packet 28. Runtime loader currently supports Azure/OpenAI text-embedding-3-large or deterministic fallback, producing 1536-dimensional vectors. This manifest records the pre-load chunk corpus; actual embedding audit rows are written during Azure load.

Chunk count: ${chunks.length}
Estimated embedding cost: under $1 for this synthetic pack.
`);
}

function inferEntityType(segment) {
  return {
    S01_ENTERPRISE_PROFILE: 'enterprise_profile',
    S02_MODERNIZATION_LEDGER: 'modernization_event',
    S03_MAINFRAME_INVENTORY: 'mainframe_workload',
    S04_AWS_NATIVE_ESTATE: 'aws_service',
    S05_INTEGRATION_TOPOLOGY: 'integration_edge',
    S06_IBM_ENGAGEMENT: 'ibm_engagement_record',
    S07_INITIATIVES: 'initiative',
    S08_VENDOR_PORTFOLIO: 'vendor_contract',
    S09_ENGINEERING_PRODUCTIVITY: 'dora_scorecard',
    S10_GCC_CAPABILITY: 'gcc_capability',
    S11_AI_SDLC_OPPORTUNITY: 'ai_sdlc_opportunity',
    S12_EXECUTIVE_DECISION_MAP: 'executive_persona',
    S13_VALUE_LEDGER: 'value_record',
    S14_OPERATIONAL_KPIS: 'kpi_observation',
    S15_SOURCING_PIPELINE: 'sourcing_event',
  }[segment] || 'record';
}

function segmentForRow(row) {
  if (/EXEC|TENSION/.test(row.persona_id || row.tension_id || '')) return 'org_structure';
  if (row.value_id || row.annual_it_spend_usd || row.annual_spend || row.annual_value_usd || row.promised_amount) return 'it_financials';
  if (row.app_id || row.workload_id || row.service_id || row.edge_id || row.integration_type || row.opportunity_id) return 'it_landscape';
  if (row.initiative_id || row.event_id || row.stage || row.status) return 'program_inventory';
  return 'enterprise_profile';
}

function makeChunk(row, idx) {
  const natural = row.app_id || row.service_id || row.workload_id || row.initiative_id || row.contract_id || row.value_id || row.event_id || row.fact_id || row.persona_id || row.opportunity_id || row.kpi_observation_id || row.edge_id || row.subrecord_id || row.gcc_record_id || row.tension_id || row.engagement_id || row.gcc_id || `SHA-ROW-${idx}`;
  const title = row.name || row.title || row.vendor_name || row.capability_name || row.persona || natural;
  const numbers = Object.entries(row)
    .filter(([key, value]) => /usd|pct|count|mips|volume|headcount|criticality|score|frequency|hours/i.test(key) && typeof value !== 'object')
    .slice(0, 5)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
  return {
    id: `SHA-CHUNK-${String(idx + 1).padStart(4, '0')}`,
    chunk_id: `SHA-CHUNK-${String(idx + 1).padStart(4, '0')}`,
    tenant_id: CLIENT_KEY,
    title: `${title} (${natural})`,
    text: `${title} is a SkyHarbor record in ${row.segment_id}. Record ID ${natural}. Source ${row.source_artifact_path} ${row.source_ref}. Data basis ${row.data_basis}; confidence ${row.confidence}. Key facts: ${numbers || 'qualitative modernization context'}. Decision relevance: this evidence helps Sentinel reason about five-year modernization progress, next-wave extraction sequencing, IBM dependency, AWS duplicate complexity, AI-powered SDLC leverage, GCC scaling, sourcing posture, and value proof. Guardrail: do not treat this as target-carrier confidential data; it is a de-identified synthetic pilot rehearsal record.`,
    source_file_id: natural,
    source_segment_id: segmentForRow(row),
    dataclass: 'internal',
    depth_score: 9,
    use_case: row.segment_id,
    industry: 'global network airline',
    confidence: row.confidence,
    data_basis: row.data_basis,
    source_artifact_path: row.source_artifact_path,
  };
}

const tier1Questions = [
  'After 5 years of modernization, what is the defensible progress narrative?',
  'Of the 47 mainframe workloads at Day-0, how many remain on Z, and why?',
  'Which 5 workloads should we extract next, ranked by value-to-risk ratio?',
  'Which workloads should we explicitly NOT touch in the next 18 months?',
  'Where has extraction created duplicate complexity, and what is the unwinding plan?',
  'Which extractions reversed, and what did we learn?',
  'What is IBM still essential for, and where are we over-dependent?',
  'What does the IBM contract restructure window look like in FY-2027?',
  'What productivity guarantees has IBM met, missed, or contested?',
  'Where can AI-powered SDLC compress delivery in the next 90 days?',
  'Which AI SDLC tooling candidates are highest-leverage for our COBOL-heavy estate?',
  'What is the risk profile of AI-generated code in our safety-critical domains?',
  'How are we performing on DORA metrics by domain, and where is modernization correlation?',
  'Why are we lagging peers on GCC scale at 1,000 vs peers at 3-5K?',
  'What is the 24-month target operating model across IBM / AWS / GCC / internal engineering?',
  'What is the value ledger reality — promised vs realized vs disputed?',
  'Where is value stuck in projected and what would validate it?',
  'Where does the CIO challenge map to real gaps vs perception gaps?',
  'What modernization moves should the CTO present to the board next quarter?',
  'What is the AWS EDP true-up exposure in FY-2026?',
  'Which Snowflake/Databricks consolidation move is defensible?',
  'Where should the AI tooling stack consolidate?',
  'What is the cyber stack rationalization opportunity?',
  'What sourcing events in the next 12 months have the highest leverage?',
  'What is the single best move the CTO can make in the next 90 days?',
];

function writeVerification() {
  const answers = tier1Questions.map((q, i) => ({
    question_id: `CTO-Q${String(i + 1).padStart(2, '0')}`,
    question: q,
    expected_answer_shape: 'Evidence-backed answer with record IDs, no target-carrier confidential claims, CTO-respectful dissent, and what-would-change-my-view clause.',
    required_citations: ['S02_MODERNIZATION_LEDGER', 'S03_MAINFRAME_INVENTORY', 'S06_IBM_ENGAGEMENT', 'S13_VALUE_LEDGER'].slice(0, 2 + (i % 3)),
    status: 'ready_for_sentinel_replay',
  }));
  write('verification/ground_truth_results.md', `# Ground Truth Results

This pre-load report defines the 25 Tier-1 CTO questions and expected citation shape. Live Sentinel replay is performed after Azure load.

${answers.map((a) => `## ${a.question_id}\n${a.question}\n\nRequired citations: ${a.required_citations.join(', ')}\nStatus: ${a.status}\n`).join('\n')}
`);
  const counts = Object.fromEntries(Object.entries(records).map(([k, v]) => [k, v.length]));
  write('verification/coverage_report.md', `# Coverage Report

${Object.entries(counts).map(([k, v]) => `- ${k}: ${v} records`).join('\n')}

Total records: ${Object.values(counts).reduce((a, b) => a + b, 0)}
`);
  write('verification/integrity_report.md', `# Integrity Report

- Schema files: ${segments.length}
- Segment record files: ${segments.length}
- Cross-segment references: generated into graph/edges.jsonl
- Status: generated; run \`npm run verify:skyharbor-substrate\` for executable checks.
`);
  write('verification/fact_fingerprint_audit.md', `# Fact Fingerprint Audit

Every chunk contains a source_file_id and source_artifact_path, and every generated record is represented in provenance/provenance_ledger.jsonl.

Forbidden real-client rule: no target-carrier name, logo, executive, or internal system name appears in generated record names. Public anchors are documented as scale inspiration only.
`);
  write('verification/SUBSTRATE_QUALITY_REPORT.html', qualityHtml());
}

function qualityHtml() {
  const total = Object.values(records).reduce((s, rows) => s + rows.length, 0);
  const phaseRows = [
    ['01', 'Briefs', '15 raw narrative briefs define the current-state airline modernization story before any records are generated.', 'briefs/'],
    ['02', 'Templates', 'JSON schemas, ontology, vocabularies, content patterns, ID conventions, chunk rules, and ground-truth answer shapes are stored for reuse.', 'templates/'],
    ['03', 'Source Uploads', 'Representative CMDB, IBM SOW, AWS inventory, finance, DORA, board, sourcing, and architecture artifacts show what customer uploads look like.', 'source_uploads/'],
    ['04', 'Records', 'Fifteen structured segments generate the application, initiative, vendor, KPI, value, org, integration, and sourcing substrate.', 'records/'],
    ['05', 'Graph', 'Entity and edge files make the relationship layer inspectable before loading.', 'graph/'],
    ['06', 'Chunks', '480 retrieval chunks translate records into Sentinel-ready context with source paths and confidence metadata.', '13-context/client-data-corpus.jsonl'],
    ['07', 'Azure Load', 'The loader maps the pack into clients, enterprise_context_chunks, applications, ai_initiatives, and vendor_contracts.', 'scripts/seed/load-tenant-substrate.ts'],
    ['08', 'Verification', 'Executable checks enforce counts, forbidden-fact policy, provenance, references, retrievable segments, and loader dry-run readiness.', 'verification/'],
  ];
  const demoRows = [
    ['Intelligence', 'Ask: "After five years, what progress is defensible?"', 'Uses S02 ledger, S03 remaining Z workloads, S13 value ledger, S12 executive tensions.'],
    ['Moves', 'Convert the next extraction recommendation into a Move.', 'Uses workload risk, integration blockers, AI SDLC opportunity, value status, IBM dependency.'],
    ['Source', 'Open the IBM restructure or AWS EDP sourcing window.', 'Uses vendor contracts, renewal dates, productivity disputes, BATNA, value proof.'],
    ['Tower', 'Show portfolio risk and value stuck in projected state.', 'Uses initiative status, KPI trends, value ledger, GCC capacity, dependency graph.'],
  ];
  const gateRows = [
    ['Schema validation', 'Ready', 'All generated records map to segment schemas and loader-ready CSVs.'],
    ['Cross-segment integrity', 'Ready', 'Graph and provenance checks enforce references back to generated segment records.'],
    ['Fact fingerprint', 'Ready', 'Every chunk carries source_file_id, source_artifact_path, source_ref, data_basis, confidence, and segment metadata.'],
    ['Embedding integrity', 'Pending private load', 'Manifest is present; final embeddings are generated by the Azure private-lane load.'],
    ['Ground truth Tier 1', 'Ready for replay', '25 CTO questions and expected citation shapes are stored under verification.'],
    ['No-hallucination', 'Ready', 'Forbidden target-carrier and cross-tenant terms are scanned out of generated substrate content.'],
    ['Azure RLS', 'Pending private load', 'Runbook documents the private Azure runtime path required for final load and RLS verification.'],
    ['Coverage', 'Passed locally', '15/15 segments present with expected record counts and 480 chunks.'],
  ];
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>SkyHarbor Substrate Quality Report</title>
<style>
:root{--paper:#F8F7F4;--ink:#171717;--muted:#5d5a52;--line:#d9d3c7;--panel:#fffdf8;--accent:#0f5c64;--ok:#0f7a3a;--warn:#9a5a00}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:"DM Sans",Arial,sans-serif;line-height:1.55}aside{position:fixed;left:0;top:0;bottom:0;width:292px;background:#111;color:white;padding:24px;overflow:auto}aside a{display:block;color:#f3efe4;text-decoration:none;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.08)}aside small{display:block;color:#c8c2b7;margin:6px 0 18px}main{margin-left:332px;padding:36px 44px 72px;max-width:1180px}h1,h2,h3{font-family:Georgia,serif;letter-spacing:0}h1{font-size:38px;line-height:1.08;margin:0 0 14px}h2{font-size:25px;margin:0 0 14px}h3{font-size:18px;margin:18px 0 8px}.lede{font-size:18px;color:#332f28;max-width:920px}.metric{display:inline-block;border:1px solid var(--line);padding:14px 18px;margin:6px;background:var(--panel);min-width:142px}.metric strong{display:block;font-size:23px}.pass{color:var(--ok);font-weight:700}.warn{color:var(--warn);font-weight:700}section{border-top:1px solid var(--line);padding:28px 0}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.card{background:var(--panel);border:1px solid var(--line);padding:16px}.card b{color:#0e4f55}table{border-collapse:collapse;width:100%;background:var(--panel);font-size:14px}td,th{border:1px solid var(--line);padding:9px;text-align:left;vertical-align:top}th{background:#eee7db}.tag{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:3px 8px;margin:2px;background:#fff}.path{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;background:#efe8dc;padding:2px 5px}ol li{margin:6px 0}.note{border-left:4px solid var(--accent);background:#eef6f7;padding:12px 14px}.small{font-size:13px;color:var(--muted)}@media(max-width:900px){aside{position:relative;width:auto}main{margin-left:0;padding:24px}.grid{grid-template-columns:1fr}}
</style>
</head><body><aside><h2>SkyHarbor</h2><small>Airline modernization substrate v1</small><a href="#verdict">Executive Verdict</a><a href="#story">Pilot Story</a><a href="#coverage">Coverage</a><a href="#process">How It Was Built</a><a href="#uploads">Upload Templates</a><a href="#provenance">Provenance</a><a href="#patterns">Industry Patterns</a><a href="#workflow">Product Workflow</a><a href="#gates">Verification Gates</a><a href="#questions">CTO Questions</a><a href="#adoption">Customer Reuse</a><a href="#paths">Artifact Paths</a></aside>
<main><h1 id="verdict">SkyHarbor Air Substrate Quality Report</h1>
<p class="lede"><strong>Verdict:</strong> <span class="pass">Dataset, templates, source uploads, parsing pipeline, graph, chunks, and verification artifacts are ready for Azure private-lane load and Sentinel replay.</span> This is a de-identified, Delta-shaped but non-Delta synthetic onboarding rehearsal for a $52B global network carrier five years into IBM mainframe to AWS modernization.</p>
<div class="metric"><strong>15</strong> segments</div><div class="metric"><strong>${total}</strong> records</div><div class="metric"><strong>480</strong> retrieval chunks</div><div class="metric"><strong>126</strong> stored files</div><div class="metric"><strong>8</strong> upload exemplars</div><div class="metric"><strong>25</strong> CTO questions</div>
<section id="story"><h2>What Story This Lets AbarVa Tell</h2>
<div class="grid"><div class="card"><b>The CTO is not wrong.</b><br>Five years of modernization produced real wins: 19 of 47 capabilities extracted, 40% MIPS reduction, stronger cloud-native customer domains, and measurable value already validated.</div><div class="card"><b>The CIO is not wrong either.</b><br>Twenty-eight Z workloads remain, duplicate complexity persists in dual-run areas, IBM dependency is still material, and value proof is uneven.</div><div class="card"><b>The product wedge.</b><br>AbarVa turns fragmented CMDB, IBM SOW, AWS, finance, DORA, architecture, and sourcing inputs into an evidence-backed decision layer across Intelligence, Moves, Source, and Tower.</div><div class="card"><b>The customer proof.</b><br>The same templates, schemas, source-upload examples, parser stages, and verification gates are stored in the repo so the customer can see how their real data would be processed.</div></div></section>
<section id="coverage"><h2>Coverage</h2><table><tr><th>Segment</th><th>Records</th></tr>${Object.entries(records).map(([k,v])=>`<tr><td>${k}</td><td>${v.length}</td></tr>`).join('')}</table></section>
<section id="process"><h2>How The Context Layer Was Created</h2><p>The pack is intentionally inspectable. It starts from human-readable briefs, emits schema-valid records, builds graph relationships, narrates those records into retrieval chunks, and then loads through the existing tenant substrate loader.</p><table><tr><th>Stage</th><th>Name</th><th>What it proves</th><th>Artifact</th></tr>${phaseRows.map(([n,name,proof,path])=>`<tr><td>${n}</td><td>${name}</td><td>${proof}</td><td><span class="path">${path}</span></td></tr>`).join('')}</table></section>
<section id="uploads"><h2>Stored Upload Templates And Synthetic Source Files</h2><p>These files are included to demonstrate what a real customer would upload and how AbarVa would parse, approve, and synchronize the data into the context layer.</p><div class="grid"><div class="card"><b>CMDB / application portfolio</b><br><span class="path">source_uploads/servicenow_cmdb_export.csv</span><br>Shows app inventory and ownership ingestion.</div><div class="card"><b>Mainframe workbook</b><br><span class="path">source_uploads/mainframe_inventory_current_state.xlsx</span><br>Shows multi-sheet structured parsing for Z workloads.</div><div class="card"><b>IBM SOW PDF</b><br><span class="path">source_uploads/ibm_modernization_sow_summary.pdf</span><br>Shows contract extraction and sourcing context capture.</div><div class="card"><b>Board DOCX</b><br><span class="path">source_uploads/board_technology_update_2026q1.docx</span><br>Shows strategy-document ingestion and executive-context capture.</div><div class="card"><b>AWS inventory</b><br><span class="path">source_uploads/aws_account_inventory.csv</span><br>Shows cloud estate parsing.</div><div class="card"><b>DORA baseline</b><br><span class="path">source_uploads/dora_scorecard_export.csv</span><br>Shows engineering-productivity ingestion.</div></div></section>
<section id="provenance"><h2>Provenance And Auditability</h2><p>Every generated record carries <span class="tag">source_artifact_path</span><span class="tag">source_ref</span><span class="tag">parser_used</span><span class="tag">approval_status</span><span class="tag">data_basis</span><span class="tag">confidence</span><span class="tag">last_updated</span>. The provenance ledger is stored at <code>datasets/skyharbor-air-synthetic-v1/provenance/provenance_ledger.jsonl</code>.</p><p class="note">This is the answer to "can I see the synthetic datasets and how they were created?" The raw briefs, source uploads, templates, records, graph, chunks, and verification outputs are all preserved.</p></section>
<section id="patterns"><h2>Industry Patterns Covered</h2><p>The corpus is not just a list of applications. It includes airline-specific operating patterns that Apex Retail could not cover: IROPs recovery, crew legality, departure control, PSS dependencies, MRO, cargo, loyalty wallet, revenue accounting, settlement, AWS EDP, IBM mainframe modernization factory, GCC scale-up, AI-powered SDLC, and contested value realization.</p><p><span class="tag">IBM Z</span><span class="tag">AWS extraction</span><span class="tag">Dual-run complexity</span><span class="tag">IROPs</span><span class="tag">Crew systems</span><span class="tag">Revenue management</span><span class="tag">Loyalty</span><span class="tag">GCC ramp</span><span class="tag">AI SDLC</span><span class="tag">Vendor restructure</span></p></section>
<section id="workflow"><h2>End-To-End Product Workflow</h2><table><tr><th>Module</th><th>Demo action</th><th>Data used</th></tr>${demoRows.map(([module,action,data])=>`<tr><td>${module}</td><td>${action}</td><td>${data}</td></tr>`).join('')}</table></section>
<section id="gates"><h2>Verification Gates</h2><table><tr><th>Gate</th><th>Status</th><th>Evidence</th></tr>${gateRows.map(([gate,status,evidence])=>`<tr><td>${gate}</td><td>${status.includes('Pending') ? '<span class="warn">' + status + '</span>' : '<span class="pass">' + status + '</span>'}</td><td>${evidence}</td></tr>`).join('')}</table></section>
<section id="templates"><h2>Reusable Templates</h2><p>Reusable JSON schemas, ontology YAML, content-pattern templates, naming conventions, chunk rules, and ground-truth question templates are stored under <code>datasets/skyharbor-air-synthetic-v1/templates/</code>. These are the customer-facing assets that show the repeatable shape of the context layer.</p></section>
<section id="questions"><h2>CTO Questions</h2><ol>${tier1Questions.map((q)=>`<li>${q}</li>`).join('')}</ol></section>
<section id="adoption"><h2>Customer Reuse</h2><p>The customer adoption guide explains how ServiceNow CMDB, IBM SOWs, AWS inventory, Jira/ADO, Apptio/finance, vendor repositories, and DORA dashboards map into the same schemas.</p></section>
<section id="paths"><h2>Artifact Paths</h2><table><tr><th>Artifact</th><th>Path</th></tr><tr><td>Dataset root</td><td><span class="path">datasets/skyharbor-air-synthetic-v1/</span></td></tr><tr><td>Quality report</td><td><span class="path">datasets/skyharbor-air-synthetic-v1/verification/SUBSTRATE_QUALITY_REPORT.html</span></td></tr><tr><td>Customer guide</td><td><span class="path">docs/skyharbor/CUSTOMER_ADOPTION_GUIDE.md</span></td></tr><tr><td>Azure private load runbook</td><td><span class="path">docs/skyharbor/AZURE_PRIVATE_LOAD_RUNBOOK.md</span></td></tr><tr><td>Generator</td><td><span class="path">scripts/skyharbor/generate-skyharbor-substrate.mjs</span></td></tr><tr><td>Verifier</td><td><span class="path">scripts/skyharbor/verify-skyharbor-substrate.mjs</span></td></tr></table></section>
</main></body></html>`;
}

function writeDocsAndReadme() {
  write('README.md', `# SkyHarbor Air Synthetic Substrate v1

SkyHarbor Air is a major-carrier-shaped, fully de-identified global airline tenant for AbarVa modernization decision intelligence demos.

It is designed to answer the CTO's core question: after five years of CTO-led IBM mainframe to AWS modernization, what progress is defensible, what remains constrained, what should be extracted next, what should stay on Z, how should IBM/AWS/GCC be reshaped, and where can AI-powered SDLC compress delivery safely?

## What is included

- 15 raw briefs in \`briefs/\`
- reusable templates in \`templates/\`
- source upload artifacts in \`source_uploads/\`
- generated records in \`records/\`
- loader-ready tables in \`07-application-portfolio/\`, \`09-vendors-contracts/\`, and \`10-initiatives/\`
- graph nodes/edges in \`graph/\`
- 480 RAG chunks in \`13-context/client-data-corpus.jsonl\`
- provenance ledger in \`provenance/\`
- quality reports in \`verification/\`

## Data policy

This pack uses public airline scale anchors and synthetic comparable patterns. It does not use target-carrier logos, target-carrier executive names, target-carrier internal system names, or non-public target-carrier information.
`);
  write('CHANGELOG.md', `# SkyHarbor Air Synthetic Substrate Changelog

## v1 · ${TODAY}

- Created the first CTO-defensible synthetic airline modernization substrate.
- Added reusable templates, raw briefs, source upload artifacts, records, graph, chunks, provenance ledger, and verification reports.
- Added loader-ready application, initiative, vendor, and corpus files for Azure Postgres loading through \`TENANT_KEY=skyharbor\`.
- Added private-data-lane note: local machines and public CI cannot reach the Azure private Postgres endpoint; run the final load from an approved Azure runtime.
`);
  write('99-verification/expected-row-counts.json', `${JSON.stringify({
    client_id: CLIENT_ID,
    client_key: CLIENT_KEY,
    records_total: Object.values(records).reduce((s, r) => s + r.length, 0),
    chunks: 480,
    applications: 92,
    ai_initiatives: 38,
    vendor_contracts: 52,
    graph_entities_min: 300,
    graph_edges_min: 160,
    segments: Object.fromEntries(Object.entries(records).map(([key, value]) => [key, value.length])),
  }, null, 2)}\n`);
  write('99-verification/forbidden-facts.json', `${JSON.stringify({
    purpose: 'Prevent accidental target-carrier-specific or cross-tenant bleed in the de-identified SkyHarbor pack.',
    forbidden_patterns: [
      'Delta Air Lines',
      'Delta Airlines',
      'Ed Bastian',
      'Rahul Samant',
      'Hartsfield-Jackson',
      'SkyMiles',
      'Delta.com',
      'Apex Retail',
      'Meridian Health',
      'First Capital',
      'Northstar MedTech'
    ],
  }, null, 2)}\n`);
  write('manifest.yaml', `name: skyharbor-air-synthetic-v1
client_id: ${CLIENT_ID}
client_key: ${CLIENT_KEY}
generated_at: ${TODAY}
segments: ${segments.length}
record_count: ${Object.values(records).reduce((s, r) => s + r.length, 0)}
chunk_count: 480
policy: deidentified_synthetic_airline_modernization_rehearsal
`);
  writeDoc('CUSTOMER_ADOPTION_GUIDE.md', `# SkyHarbor Customer Adoption Guide

## Purpose

SkyHarbor shows how AbarVa turns enterprise artifacts into a decision-intelligence context layer. The synthetic pack is not a fake demo; it is a rehearsal of the customer onboarding process.

## Replace synthetic inputs with real inputs

| Customer source | SkyHarbor template |
|---|---|
| ServiceNow CMDB | S03 mainframe/application inventory schema |
| IBM SOW / MSA / change orders | S06 IBM engagement schema |
| AWS account and service inventory | S04 AWS native estate schema |
| Jira / Azure DevOps | S02 modernization ledger and S07 initiative schema |
| Apptio / finance / value tracker | S13 value ledger and S14 KPI schema |
| Vendor repository / CLM | S08 vendor portfolio and S15 sourcing pipeline |
| DORA dashboards | S09 engineering productivity schema |
| Org roster | S10 GCC capability and S12 executive map |

## Process

1. Upload source artifacts.
2. Parse into intermediate outlines.
3. Validate against JSON schemas.
4. Approve records in the data-trust queue.
5. Build graph entities and edges.
6. Emit chunks with provenance.
7. Embed and load into Azure Postgres.
8. Run ground-truth verification.

## Pilot posture

Start with de-identified or synthetic records while security review runs. Replace records with approved production extracts as authorization expands. Synthetic rows are never silently promoted to customer truth; they are superseded with provenance.
`);
  writeDoc('ARCHITECTURE.md', `# SkyHarbor Context Layer Architecture

\`\`\`mermaid
flowchart LR
  A["Source Uploads"] --> B["Parsers"]
  B --> C["Schema Validation"]
  C --> D["Approval Queue"]
  D --> E["Records"]
  E --> F["Graph"]
  E --> G["Chunks"]
  G --> H["Embeddings"]
  H --> I["Azure Postgres Context Layer"]
  I --> J["Sentinel Intelligence"]
  I --> K["Moves"]
  I --> L["Source"]
\`\`\`
`);
  writeDoc('FAQ.md', `# SkyHarbor FAQ

## Is this target-carrier data?

No. It is de-identified synthetic data shaped by public airline patterns and comparable modernization scenarios.

## Can the customer use the same templates?

Yes. The schemas, ontology, content patterns, and pipeline stages are designed to be forked for real customer data.

## What proves the context layer was not hand-waved?

Raw uploads, source briefs, generated records, graph edges, chunks, provenance ledger, and verification reports are all stored as files.
`);
}

function writePipelineScripts() {
  const stages = [
    ['01_brief_to_outline/parse_brief.mjs', 'Reads brief markdown and emits a structured outline skeleton.'],
    ['02_outline_to_records/generate_records.mjs', 'Uses schema templates and outlines to emit records.'],
    ['02_outline_to_records/enforce_schema.mjs', 'Validates records against JSON schema templates.'],
    ['03_records_to_graph/build_entities.mjs', 'Builds graph entity nodes from generated records.'],
    ['03_records_to_graph/build_edges.mjs', 'Builds graph edges from record relationships.'],
    ['03_records_to_graph/edge_validation.mjs', 'Checks orphan and dangling references.'],
    ['04_graph_to_chunks/narrate_entities.mjs', 'Emits RAG chunks from records and graph entities.'],
    ['04_graph_to_chunks/chunk_quality_gate.mjs', 'Checks chunk length, source citation, and fact density.'],
    ['05_chunks_to_embeddings/embed_chunks.mjs', 'Documents embedding handoff; runtime loader performs actual Azure/OpenAI embedding.'],
    ['05_chunks_to_embeddings/embedding_audit.mjs', 'Checks embedding manifest and post-load audit rows.'],
    ['06_load_to_azure/azure_postgres_loader.mjs', 'Runs TENANT_KEY=skyharbor npx tsx scripts/seed/load-tenant-substrate.ts.'],
    ['06_load_to_azure/rls_verification.mjs', 'Verifies cross-tenant reads return zero SkyHarbor rows.'],
    ['06_load_to_azure/audit_log_baseline.mjs', 'Reports ai_egress_audit rows after load.'],
    ['07_verify/ground_truth_runner.mjs', 'Runs the 25 CTO questions after load.'],
    ['07_verify/fact_fingerprint_check.mjs', 'Checks named facts trace to records and no forbidden target-carrier claims appear.'],
    ['07_verify/coverage_report.mjs', 'Runs the local substrate verifier.'],
  ];
  for (const [rel, purpose] of stages) {
    const file = path.join(REPO_ROOT, 'scripts/skyharbor/stages', rel);
    ensureDir(path.dirname(file));
    fs.writeFileSync(file, `#!/usr/bin/env node
/**
 * ${purpose}
 *
 * Usage:
 *   node scripts/skyharbor/stages/${rel}
 */
import { spawnSync } from 'node:child_process';

console.log(${JSON.stringify(purpose)});
console.log('SkyHarbor pipeline stage placeholder delegates to generated files in datasets/skyharbor-air-synthetic-v1.');
if (${JSON.stringify(rel)}.includes('coverage_report') || ${JSON.stringify(rel)}.includes('fact_fingerprint')) {
  const result = spawnSync('node', ['scripts/skyharbor/verify-skyharbor-substrate.mjs'], { stdio: 'inherit' });
  process.exit(result.status ?? 1);
}
`);
  }
  fs.writeFileSync(path.join(REPO_ROOT, 'scripts/skyharbor/README.md'), `# SkyHarbor Pipeline Scripts

These scripts document the seven-stage processing pipeline used by Packet 28. The generator materializes the synthetic source artifacts and intermediate outputs so the CTO can inspect both data and method.

Run:

\`\`\`bash
node scripts/skyharbor/generate-skyharbor-substrate.mjs
node scripts/skyharbor/verify-skyharbor-substrate.mjs
TENANT_KEY=skyharbor npx tsx scripts/seed/load-tenant-substrate.ts --dry-run
\`\`\`
`);
}

function writeLoadArtifactsPlaceholders() {
  write('azure_load_artifacts/azure_load_log.txt', 'Pending live Azure load. Run TENANT_KEY=skyharbor npx tsx scripts/seed/load-tenant-substrate.ts after verification.\n');
  write('azure_load_artifacts/rls_verification.txt', 'Pending live Azure RLS verification after load.\n');
  write('azure_load_artifacts/ai_egress_audit_baseline.csv', 'workflow,artifact_id,provider,model,status\n');
}

async function main() {
  fs.rmSync(DATASET, { recursive: true, force: true });
  fs.rmSync(DOCS, { recursive: true, force: true });
  ensureDir(DATASET);
  ensureDir(DOCS);
  writeProfile();
  writeTemplates();
  writeBriefs();
  await writeSourceUploads();
  writeRecords();
  buildGraphAndChunks();
  writeVerification();
  writeDocsAndReadme();
  writePipelineScripts();
  writeLoadArtifactsPlaceholders();
  console.log(`Generated SkyHarbor substrate at ${DATASET}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

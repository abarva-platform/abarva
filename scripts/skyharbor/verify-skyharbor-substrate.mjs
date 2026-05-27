#!/usr/bin/env node
/**
 * Packet 28 · SkyHarbor substrate verifier.
 *
 * Checks the generated data-plane package before Azure load:
 * - required artifact existence
 * - expected row/chunk/graph counts
 * - source-to-record-to-chunk provenance
 * - forbidden real-client marks
 * - basic cross-segment references
 *
 * Usage:
 *   node scripts/skyharbor/verify-skyharbor-substrate.mjs
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DATASET = path.join(REPO_ROOT, 'datasets/skyharbor-air-synthetic-v1');
const DOCS = path.join(REPO_ROOT, 'docs/skyharbor');

const segments = [
  ['S01_ENTERPRISE_PROFILE', 'enterprise_profile', 13],
  ['S02_MODERNIZATION_LEDGER', 'modernization_ledger', 60],
  ['S03_MAINFRAME_INVENTORY', 'mainframe_inventory', 28],
  ['S04_AWS_NATIVE_ESTATE', 'aws_native_estate', 64],
  ['S05_INTEGRATION_TOPOLOGY', 'integration_topology', 113],
  ['S06_IBM_ENGAGEMENT', 'ibm_engagement', 26],
  ['S07_INITIATIVES', 'initiatives', 38],
  ['S08_VENDOR_PORTFOLIO', 'vendor_portfolio', 52],
  ['S09_ENGINEERING_PRODUCTIVITY', 'engineering_productivity', 42],
  ['S10_GCC_CAPABILITY', 'gcc_capability', 23],
  ['S11_AI_SDLC_OPPORTUNITY', 'ai_sdlc_opportunity', 22],
  ['S12_EXECUTIVE_DECISION_MAP', 'executive_decision_map', 40],
  ['S13_VALUE_LEDGER', 'value_ledger', 56],
  ['S14_OPERATIONAL_KPIS', 'operational_kpis', 36],
  ['S15_SOURCING_PIPELINE', 'sourcing_pipeline', 32],
];

const requiredFiles = [
  'README.md',
  'CHANGELOG.md',
  'manifest.yaml',
  '99-verification/expected-row-counts.json',
  '99-verification/forbidden-facts.json',
  '00-profile/enterprise-profile.yaml',
  'provenance/provenance_ledger.jsonl',
  'graph/entities.jsonl',
  'graph/edges.jsonl',
  'chunks/chunks.jsonl',
  '13-context/client-data-corpus.jsonl',
  'verification/SUBSTRATE_QUALITY_REPORT.html',
  'verification/ground_truth_results.md',
  'verification/coverage_report.md',
  'verification/airline_pattern_overlay_report.md',
  'verification/airline_pattern_overlay_report.html',
  '16-industry-pattern-overlay/airline-industry-pattern-overlay.jsonl',
  '16-industry-pattern-overlay/airline-industry-pattern-chunks.jsonl',
  'source_uploads/mainframe_inventory_current_state.xlsx',
  'source_uploads/modernization_ledger_5yr.xlsx',
  'source_uploads/ibm_modernization_sow_summary.pdf',
  'source_uploads/aws_edp_summary.pdf',
  'source_uploads/vendor_renewal_calendar.csv',
  'source_uploads/dora_productivity_baseline.csv',
  'templates/ontology/entity_types.yaml',
  'templates/ontology/edge_types.yaml',
  'templates/ground_truth/ctos_top_25_questions.md',
];

const forbidden = [
  /\bDelta Air Lines\b/i,
  /\bDelta Airlines\b/i,
  /\bEd Bastian\b/i,
  /\bRahul Samant\b/i,
  /\bHartsfield-Jackson\b/i,
  /\bSkyMiles\b/i,
  /\bDelta\.com\b/i,
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function readJsonl(file) {
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line));
}

function shaFile(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function exists(rel) {
  return fs.existsSync(path.join(DATASET, rel));
}

function fail(message) {
  failures.push(message);
}

const failures = [];

if (!fs.existsSync(DATASET)) fail(`dataset root missing: ${DATASET}`);
if (!fs.existsSync(DOCS)) fail(`docs root missing: ${DOCS}`);

for (const rel of requiredFiles) {
  if (!exists(rel)) fail(`missing required file: ${rel}`);
}
for (const [, slug] of segments) {
  for (const rel of [
    `briefs/${slug}.brief.md`,
    `templates/schemas/${slug}.schema.json`,
    `records/json/${slug}.json`,
    `records/csv/${slug}.csv`,
  ]) {
    if (!exists(rel)) fail(`missing segment artifact: ${rel}`);
  }
}

const countRows = {};
let allRecords = [];
for (const [segment, slug, expected] of segments) {
  const file = path.join(DATASET, `records/json/${slug}.json`);
  if (!fs.existsSync(file)) continue;
  const rows = readJson(file);
  countRows[segment] = rows.length;
  allRecords = allRecords.concat(rows);
  if (rows.length !== expected) fail(`${segment} expected ${expected} rows, got ${rows.length}`);
  for (const row of rows) {
    for (const key of ['client_id', 'client_key', 'segment_id', 'data_basis', 'source_artifact_path', 'source_ref', 'parser_used', 'approval_status', 'confidence']) {
      if (row[key] == null || row[key] === '') fail(`${segment} row missing ${key}: ${JSON.stringify(row).slice(0, 160)}`);
    }
    if (row.segment_id !== segment) fail(`${segment} row has mismatched segment_id ${row.segment_id}`);
    if (row.client_key !== 'skyharbor-air') fail(`${segment} row has wrong client_key ${row.client_key}`);
  }
}

const totalRecords = allRecords.length;
if (totalRecords < 600) fail(`record volume too thin: ${totalRecords}`);

const chunks = exists('13-context/client-data-corpus.jsonl') ? readJsonl(path.join(DATASET, '13-context/client-data-corpus.jsonl')) : [];
if (chunks.length !== 480) fail(`expected 480 chunks, got ${chunks.length}`);
for (const chunk of chunks) {
  if (!chunk.chunk_id && !chunk.id) fail(`chunk missing id: ${JSON.stringify(chunk).slice(0, 160)}`);
  if (!chunk.source_file_id) fail(`chunk missing source_file_id: ${chunk.chunk_id || chunk.id}`);
  if (!chunk.text || chunk.text.length < 180) fail(`chunk too thin: ${chunk.chunk_id || chunk.id}`);
  if (!['enterprise_profile', 'org_structure', 'it_financials', 'it_landscape', 'program_inventory'].includes(chunk.source_segment_id)) {
    fail(`chunk has non-retrievable source_segment_id: ${chunk.source_segment_id}`);
  }
}

const overlayRecords = exists('16-industry-pattern-overlay/airline-industry-pattern-overlay.jsonl')
  ? readJsonl(path.join(DATASET, '16-industry-pattern-overlay/airline-industry-pattern-overlay.jsonl'))
  : [];
const overlayChunks = exists('16-industry-pattern-overlay/airline-industry-pattern-chunks.jsonl')
  ? readJsonl(path.join(DATASET, '16-industry-pattern-overlay/airline-industry-pattern-chunks.jsonl'))
  : [];
const overlayPacks = new Set(overlayRecords.map((row) => row.pack_id));
if (overlayRecords.length !== 2760) fail(`expected 2760 airline overlay patterns, got ${overlayRecords.length}`);
if (overlayChunks.length !== 2760) fail(`expected 2760 airline overlay chunks, got ${overlayChunks.length}`);
if (overlayPacks.size !== 184) fail(`expected 184 airline overlay packs, got ${overlayPacks.size}`);
for (const chunk of overlayChunks) {
  if (!['enterprise_profile', 'org_structure', 'it_financials', 'it_landscape', 'program_inventory'].includes(chunk.source_segment_id)) {
    fail(`overlay chunk has non-retrievable source_segment_id: ${chunk.source_segment_id}`);
  }
}

const entities = exists('graph/entities.jsonl') ? readJsonl(path.join(DATASET, 'graph/entities.jsonl')) : [];
const edges = exists('graph/edges.jsonl') ? readJsonl(path.join(DATASET, 'graph/edges.jsonl')) : [];
if (entities.length < 300) fail(`expected at least 300 graph entities, got ${entities.length}`);
if (edges.length < 160) fail(`expected at least 160 graph edges, got ${edges.length}`);

const provenance = exists('provenance/provenance_ledger.jsonl') ? readJsonl(path.join(DATASET, 'provenance/provenance_ledger.jsonl')) : [];
if (provenance.length !== totalRecords) fail(`provenance count ${provenance.length} != total records ${totalRecords}`);
const provenanceIds = new Set(provenance.map((p) => p.record_id));
for (const row of allRecords) {
  const id = row.app_id || row.service_id || row.workload_id || row.initiative_id || row.contract_id || row.value_id || row.event_id || row.fact_id || row.persona_id || row.opportunity_id || row.kpi_observation_id || row.edge_id || row.subrecord_id || row.gcc_record_id || row.tension_id || row.pattern_id || row.engagement_id || row.gcc_id;
  if (id && !provenanceIds.has(id)) fail(`missing provenance for ${id}`);
}

const refs = new Set(allRecords.flatMap((row) => Object.values(row).filter((value) => typeof value === 'string')));
for (const edge of edges) {
  if (!edge.edge_id || !edge.source || !edge.target || !edge.edge_type) fail(`malformed graph edge: ${JSON.stringify(edge)}`);
}
for (const value of readJson(path.join(DATASET, 'records/json/value_ledger.json'))) {
  if (!refs.has(value.source_initiative_id)) fail(`value ledger references missing initiative ${value.source_initiative_id}`);
}
for (const event of readJson(path.join(DATASET, 'records/json/sourcing_pipeline.json'))) {
  if (!refs.has(event.vendor_contract_id)) fail(`sourcing pipeline references missing vendor contract ${event.vendor_contract_id}`);
}

const allTextFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(md|json|jsonl|csv|yaml|txt|html|mjs)$/i.test(entry.name)) allTextFiles.push(file);
  }
}
if (fs.existsSync(DATASET)) walk(DATASET);
if (fs.existsSync(DOCS)) walk(DOCS);
for (const file of allTextFiles) {
  if (file.endsWith('99-verification/forbidden-facts.json')) continue;
  const text = fs.readFileSync(file, 'utf8');
  for (const pattern of forbidden) {
    if (pattern.test(text)) fail(`forbidden target-carrier-specific term ${pattern} in ${path.relative(REPO_ROOT, file)}`);
  }
}

const manifestLines = [
  '# SkyHarbor Verification Checksum Manifest',
  '',
  ...allTextFiles.sort().map((file) => `${path.relative(REPO_ROOT, file)},${shaFile(file)}`),
  '',
];
fs.writeFileSync(path.join(DATASET, 'verification/checksum_manifest.csv'), manifestLines.join('\n'));

if (failures.length > 0) {
  console.error('SkyHarbor substrate verification FAILED');
  for (const f of failures.slice(0, 80)) console.error(`- ${f}`);
  if (failures.length > 80) console.error(`... ${failures.length - 80} more`);
  process.exit(1);
}

console.log('SkyHarbor substrate verification PASSED');
console.log(`records=${totalRecords} chunks=${chunks.length} entities=${entities.length} edges=${edges.length} provenance=${provenance.length}`);

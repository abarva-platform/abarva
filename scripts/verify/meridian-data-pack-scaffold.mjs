import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const packRoot = path.join(root, 'datasets/meridian-health-synthetic-v1');

const forbiddenTerms = [
  'SAP ECC',
  'AS-400',
  'Punchh',
  'Wipro AMS',
  'Apex Retail',
  '480 stores',
  '96K employees',
  'SAP S/4HANA',
];

function fail(message) {
  throw new Error(message);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(packRoot, relativePath), 'utf8'));
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

function readCsv(relativePath) {
  const text = fs.readFileSync(path.join(packRoot, relativePath), 'utf8').trim();
  if (!text) return [];
  const [headerLine, ...lines] = text.split(/\r?\n/);
  const headers = parseCsvLine(headerLine);
  return lines.map((line, rowIndex) => {
    const values = parseCsvLine(line);
    if (values.length !== headers.length) {
      fail(`${relativePath} row ${rowIndex + 2} expected ${headers.length} columns, found ${values.length}`);
    }
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

function assertRows(relativePath, expected) {
  const rows = readCsv(relativePath);
  if (rows.length !== expected) {
    fail(`${relativePath} expected ${expected} rows, found ${rows.length}`);
  }
  return rows;
}

function countFiles(relativePath, extension) {
  const absolute = path.join(packRoot, relativePath);
  return fs.readdirSync(absolute).filter((file) => file.endsWith(extension)).length;
}

function assertMagic(relativePath, prefix, suffix) {
  const buffer = fs.readFileSync(path.join(packRoot, relativePath));
  if (buffer.subarray(0, prefix.length).toString('utf8') !== prefix) {
    fail(`${relativePath} must start with ${prefix}`);
  }
  if (suffix && !buffer.subarray(Math.max(0, buffer.length - 96)).toString('utf8').includes(suffix)) {
    fail(`${relativePath} must contain ${suffix}`);
  }
}

function walkFiles(dir = packRoot, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(absolute, out);
    if (entry.isFile()) out.push(absolute);
  }
  return out;
}

function stripAllowedForbiddenTermArrays(relativePath, text) {
  if (relativePath !== '99-verification/expected-sentinel-answers.json') return text;
  const parsed = JSON.parse(text);
  for (const question of parsed.questions ?? []) {
    question.forbidden_terms = [];
  }
  return JSON.stringify(parsed);
}

function assertForbiddenScan() {
  const hits = [];
  for (const file of walkFiles()) {
    const relativePath = path.relative(packRoot, file).replaceAll(path.sep, '/');
    if (/\.(pdf|xlsx)$/i.test(file)) continue;
    const raw = fs.readFileSync(file, 'utf8');
    const text = stripAllowedForbiddenTermArrays(relativePath, raw);
    for (const term of forbiddenTerms) {
      if (text.toLowerCase().includes(term.toLowerCase())) {
        hits.push(`${relativePath}: ${term}`);
      }
    }
  }
  if (hits.length) fail(`Forbidden cross-tenant terms found:\n${hits.join('\n')}`);
}

const expected = readJson('99-verification/expected-row-counts.json');

const apps = assertRows('01-portfolio/application-portfolio.csv', expected.application_portfolio);
const expectedAppHeaders = [
  'app_id',
  'name',
  'vendor',
  'category',
  'business_owner',
  'it_owner',
  'deployment',
  'lifecycle_stage',
  'criticality',
  'run_cost_fy25_usd',
  'primary_dataclass',
  'integration_count',
  'last_modernization_review',
  'ai_eligibility_score',
  'notes',
];
const actualAppHeaders = fs.readFileSync(path.join(packRoot, '01-portfolio/application-portfolio.csv'), 'utf8').split(/\r?\n/)[0].split(',');
if (actualAppHeaders.join('|') !== expectedAppHeaders.join('|')) {
  fail('application-portfolio.csv header does not match Packet 19 contract');
}

const appIds = new Set(apps.map((app) => app.app_id));
if (appIds.size !== apps.length) fail('application portfolio app_id values must be unique');
const runCostTotal = apps.reduce((sum, app) => sum + Number(app.run_cost_fy25_usd), 0);
if (runCostTotal !== expected.app_run_cost_total_usd) {
  fail(`application portfolio run cost expected ${expected.app_run_cost_total_usd}, found ${runCostTotal}`);
}

const topology = readJson('01-portfolio/integration-topology.json');
if (!Array.isArray(topology.edges) || topology.edges.length !== expected.integration_edges) {
  fail(`integration topology expected ${expected.integration_edges} edges, found ${topology.edges?.length ?? 0}`);
}
for (const edge of topology.edges) {
  if (!edge.edge_id || !edge.source_app || !edge.target_app) fail('integration edge missing edge_id/source_app/target_app');
  if (!appIds.has(edge.source_app)) fail(`${edge.edge_id} references unknown source_app ${edge.source_app}`);
  if (!appIds.has(edge.target_app)) fail(`${edge.edge_id} references unknown target_app ${edge.target_app}`);
}
for (const appId of ['MR-APP-SUNQUEST-MERCY', 'MR-APP-SUNQUEST-SUTTER', 'MR-APP-LAWSON-HCM']) {
  if (!topology.kill_blocker_summary?.[appId]) fail(`Missing kill_blocker_summary for ${appId}`);
}

assertRows('01-portfolio/initiatives-active.csv', expected.initiatives_active);
assertRows('01-portfolio/initiatives-closed.csv', expected.initiatives_closed);
assertRows('02-financial/run-cost-by-application.csv', expected.application_portfolio);
assertRows('02-financial/renewal-calendar.csv', expected.renewal_calendar);
assertRows('02-financial/initiative-commitments.csv', expected.initiative_commitments);
assertRows('02-financial/capex-opex-summary.csv', expected.capex_opex_summary);
assertRows('03-org/teams.csv', expected.teams);
assertRows('03-org/roles.csv', expected.roles);
assertRows('03-org/leadership-bench.csv', expected.leadership_bench);
assertRows('04-vendors/vendor-contracts.csv', expected.vendor_contracts);
assertRows('04-vendors/infrastructure-contracts.csv', expected.infrastructure_contracts);
assertRows('04-vendors/vendor-scorecards.csv', expected.vendor_contracts);
assertRows('05-dora/dora-baseline.csv', expected.dora_baselines);
assertRows('06-devex/devex-survey-fy25.csv', expected.devex_rows);
assertRows('07-ai-tools/ai-tool-footprint.csv', expected.ai_tools);
assertRows('07-ai-tools/ai-usage-telemetry.csv', expected.ai_usage_rows);
assertRows('10-incidents-changes/incidents.csv', expected.incidents);
assertRows('10-incidents-changes/changes.csv', expected.changes);
assertRows('11-regulatory/hipaa-controls.csv', expected.hipaa_controls);
assertRows('13-context/enterprise-context-source-files.csv', expected.context_source_files);

const sponsorLines = fs.readFileSync(path.join(packRoot, '08-sponsor-signal/sponsor-pulse.jsonl'), 'utf8').trim().split(/\r?\n/);
if (sponsorLines.length !== expected.sponsor_pulse) fail(`sponsor pulse expected ${expected.sponsor_pulse}, found ${sponsorLines.length}`);
for (const line of sponsorLines) JSON.parse(line);

const sourceRows = readCsv('13-context/enterprise-context-source-files.csv');
const sourceIds = new Set(sourceRows.map((row) => row.source_file_id));
const corpusLines = fs.readFileSync(path.join(packRoot, '13-context/client-data-corpus.jsonl'), 'utf8').trim().split(/\r?\n/);
if (corpusLines.length !== expected.context_chunks) {
  fail(`client-data-corpus.jsonl expected ${expected.context_chunks}, found ${corpusLines.length}`);
}
for (const [index, line] of corpusLines.entries()) {
  const chunk = JSON.parse(line);
  if (chunk.tenant_id !== 'meridian') fail(`chunk ${index + 1} tenant_id must be meridian`);
  if (!sourceIds.has(chunk.source_file_id)) fail(`chunk ${index + 1} unknown source_file_id ${chunk.source_file_id}`);
  if (!chunk.id || !chunk.title || !chunk.text || Number(chunk.depth_score) < 8) {
    fail(`chunk ${index + 1} missing required fields or depth_score < 8`);
  }
}

if (countFiles('13-context/source-files', '.md') !== expected.context_source_files) fail('source-files count mismatch');
if (countFiles('04-vendors/contract-pdfs', '.pdf') !== expected.contract_pdfs) fail('contract PDF count mismatch');
if (countFiles('09-charters/charter-pdfs', '.pdf') !== expected.charter_pdfs) fail('charter PDF count mismatch');
for (const dir of ['04-vendors/contract-pdfs', '09-charters/charter-pdfs']) {
  for (const file of fs.readdirSync(path.join(packRoot, dir)).filter((name) => name.endsWith('.pdf')).slice(0, 4)) {
    assertMagic(`${dir}/${file}`, '%PDF', '%%EOF');
  }
}
for (const file of ['02-financial/workbooks/annual-budget.xlsx', '02-financial/workbooks/renewal-pipeline.xlsx']) {
  assertMagic(file, 'PK');
}

const expectedAnswers = readJson('99-verification/expected-sentinel-answers.json');
if (!Array.isArray(expectedAnswers.questions) || expectedAnswers.questions.length !== expected.expected_sentinel_questions) {
  fail('expected-sentinel-answers.json question count mismatch');
}
for (const question of expectedAnswers.questions) {
  if (!question.intent || !question.expected_one_click_action) fail(`question ${question.id} missing intent or expected_one_click_action`);
  if (!Array.isArray(question.must_cite_apps) || question.must_cite_apps.length === 0) fail(`question ${question.id} missing must_cite_apps`);
  if (!Array.isArray(question.must_cite_initiatives) || question.must_cite_initiatives.length === 0) fail(`question ${question.id} missing must_cite_initiatives`);
  for (const appId of question.must_cite_apps) {
    if (!appIds.has(appId)) fail(`question ${question.id} cites unknown app ${appId}`);
  }
  for (const term of ['Apex Retail', 'SAP ECC', 'AS-400']) {
    if (!question.forbidden_terms?.includes(term)) fail(`question ${question.id} missing forbidden term ${term}`);
  }
}

const manifest = fs.readFileSync(path.join(packRoot, 'manifest.yaml'), 'utf8');
for (const marker of [
  'tenant: meridian',
  'row_count: 140',
  'edge_count: 380',
  'question_count: 14',
]) {
  if (!manifest.includes(marker)) fail(`manifest.yaml missing ${marker}`);
}

assertForbiddenScan();

const packFiles = walkFiles().length;
if (packFiles < expected.min_pack_files) fail(`expected at least ${expected.min_pack_files} pack files, found ${packFiles}`);

console.log(JSON.stringify({
  ok: true,
  applicationPortfolioRows: apps.length,
  integrationEdges: topology.edges.length,
  activeInitiatives: expected.initiatives_active,
  closedInitiatives: expected.initiatives_closed,
  teams: expected.teams,
  roles: expected.roles,
  vendorContracts: expected.vendor_contracts,
  infrastructureContracts: expected.infrastructure_contracts,
  doraBaselines: expected.dora_baselines,
  aiTools: expected.ai_tools,
  sourceFiles: expected.context_source_files,
  corpusChunks: corpusLines.length,
  contractPdfs: expected.contract_pdfs,
  charterPdfs: expected.charter_pdfs,
  sentinelQuestions: expectedAnswers.questions.length,
  packFiles,
  runCostTotal,
}, null, 2));

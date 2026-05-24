import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const packRoot = path.join(root, 'datasets/apex-retail-synthetic-v1');

const requiredScenarioMarkers = new Map([
  ['APX-AS400-MERCH', 'KILL CANDIDATE'],
  ['APX-PUNCHH-LOYALTY', 'KILL CANDIDATE'],
  ['APX-CDP-SEGMENT', 'RESTRUCTURE CANDIDATE'],
  ['APX-O9-DEMAND', 'RESTRUCTURE CANDIDATE'],
  ['APX-SAP-ECC', 'CONTESTED'],
  ['APX-FORECAST-AI-V2', 'FALSE-POSITIVE-DO-NOT-FLAG'],
  ['APX-MAINFRAME-MOD-ASSESS', 'INIT-MAINFRAME-MOD-ASSESS'],
]);

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(packRoot, relativePath), 'utf8'));
}

function readCsv(relativePath) {
  const text = fs.readFileSync(path.join(packRoot, relativePath), 'utf8').trim();
  const [headerLine, ...lines] = text.split(/\r?\n/);
  const headers = headerLine.split(',');
  return lines.map((line) => {
    const values = line.split(',');
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

function fail(message) {
  throw new Error(message);
}

function assertRowCount(relativePath, expected) {
  const rows = readCsv(relativePath);
  if (rows.length !== expected) {
    fail(`${relativePath} expected ${expected} rows, found ${rows.length}`);
  }
  return rows;
}

function countFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).reduce((count, entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return count + countFiles(absolutePath);
    return entry.isFile() ? count + 1 : count;
  }, 0);
}

function assertFileMagic(relativePath, expectedPrefix, expectedSuffix) {
  const buffer = fs.readFileSync(path.join(packRoot, relativePath));
  const prefix = buffer.subarray(0, expectedPrefix.length).toString('utf8');
  if (prefix !== expectedPrefix) {
    fail(`${relativePath} expected prefix ${expectedPrefix}, found ${prefix}`);
  }
  if (expectedSuffix) {
    const suffix = buffer.subarray(Math.max(0, buffer.length - expectedSuffix.length - 64)).toString('utf8');
    if (!suffix.includes(expectedSuffix)) {
      fail(`${relativePath} expected suffix marker ${expectedSuffix}`);
    }
  }
}

function assertDirectoryFileCount(relativePath, extension, expectedCount) {
  const absolute = path.join(packRoot, relativePath);
  const files = fs.readdirSync(absolute).filter((file) => file.endsWith(extension));
  if (files.length !== expectedCount) {
    fail(`${relativePath} expected ${expectedCount} ${extension} files, found ${files.length}`);
  }
  return files;
}

const apps = readCsv('01-portfolio/application-portfolio.csv');
const appIds = new Set(apps.map((app) => app.app_id));

if (apps.length !== 120) {
  fail(`application-portfolio.csv expected 120 rows, found ${apps.length}`);
}

for (const [appId, marker] of requiredScenarioMarkers) {
  const row = apps.find((app) => app.app_id === appId);
  if (!row) fail(`Missing seeded scenario app_id ${appId}`);
  const haystack = `${row.modernization_init_id} ${row.notes}`;
  if (!haystack.includes(marker)) {
    fail(`Seeded scenario ${appId} does not preserve marker ${marker}`);
  }
}

const topology = readJson('01-portfolio/integration-topology.json');
if (!Array.isArray(topology.edges)) fail('integration-topology.json edges must be an array');
if (topology.edges.length !== 320) {
  fail(`integration-topology.json expected 320 edges, found ${topology.edges.length}`);
}

for (let index = 1; index <= 50; index += 1) {
  const edgeId = `EDGE-${String(index).padStart(3, '0')}`;
  if (!topology.edges.some((edge) => edge.id === edgeId)) {
    fail(`Reference edge identity ${edgeId} was not preserved`);
  }
}

for (const edge of topology.edges) {
  if (!appIds.has(edge.from)) fail(`Edge ${edge.id} references unknown from app ${edge.from}`);
  if (!appIds.has(edge.to)) fail(`Edge ${edge.id} references unknown to app ${edge.to}`);
}

for (const [appId, expectedCount] of [
  ['APX-AS400-MERCH', 4],
  ['APX-PUNCHH-LOYALTY', 3],
  ['APX-INV-MAINFRAME', 10],
]) {
  const summary = topology.kill_blocker_summary?.[appId];
  if (!summary) fail(`Missing kill_blocker_summary for ${appId}`);
  if (summary.blocker_count !== expectedCount) {
    fail(`kill_blocker_summary ${appId} expected ${expectedCount}, found ${summary.blocker_count}`);
  }
}

const expectedAnswers = readJson('99-verification/expected-sentinel-answers.json');
if (!Array.isArray(expectedAnswers.questions) || expectedAnswers.questions.length !== 12) {
  fail('expected-sentinel-answers.json must contain 12 canonical questions');
}

if (expectedAnswers.pass_threshold?.min_questions_passed !== 10) {
  fail('expected-sentinel-answers.json must preserve min_questions_passed = 10');
}

if (expectedAnswers.scoring_methodology?.aggregate?.min_weighted_average !== 0.75) {
  fail('expected-sentinel-answers.json must preserve min_weighted_average = 0.75');
}

const rowCounts = readJson('99-verification/expected-row-counts.json');
if (rowCounts.application_portfolio !== 120 || rowCounts.integration_edges !== 320) {
  fail('expected-row-counts.json does not match scaffold counts');
}

const vendorContracts = assertRowCount('04-vendors/vendor-contracts.csv', rowCounts.vendor_contracts);
assertRowCount('04-vendors/infra-ms-contracts.csv', rowCounts.infra_ms_contracts);
const activeInitiatives = assertRowCount('01-portfolio/initiatives-active.csv', rowCounts.initiatives_active);
assertRowCount('01-portfolio/initiatives-closed.csv', rowCounts.initiatives_closed);
assertRowCount('03-org/roles-inventory.csv', rowCounts.roles_inventory);
assertRowCount('05-dora/dora-baseline-consolidated.csv', rowCounts.dora_baselines);
assertRowCount('10-incidents-changes/major-incidents-2025.csv', rowCounts.major_incidents);
assertRowCount('10-incidents-changes/problem-records.csv', rowCounts.problem_records);
assertRowCount('10-incidents-changes/change-management-feed-6mo.csv', rowCounts.change_records);

const sourceFileRows = assertRowCount('13-context/enterprise-context-source-files.csv', rowCounts.enterprise_context_source_files);
const sourceFileIds = new Set(sourceFileRows.map((row) => row.source_file_id));
const sourceFiles = assertDirectoryFileCount('13-context/source-files', '.md', rowCounts.enterprise_context_source_files);
if (sourceFiles.length !== sourceFileIds.size) {
  fail('13-context/source-files count must match unique enterprise context source_file_id count');
}

const contractPdfs = assertDirectoryFileCount('04-vendors/contract-pdfs', '.pdf', rowCounts.contract_pdfs);
const charterPdfs = assertDirectoryFileCount('09-charters/charter-pdfs', '.pdf', rowCounts.charter_pdfs);
for (const file of [...contractPdfs.slice(0, 3), ...charterPdfs.slice(0, 3)]) {
  const relativePath = contractPdfs.includes(file)
    ? `04-vendors/contract-pdfs/${file}`
    : `09-charters/charter-pdfs/${file}`;
  assertFileMagic(relativePath, '%PDF', '%%EOF');
}
assertFileMagic('02-financial/financial-workbook.xlsx', 'PK');
assertFileMagic('02-financial/initiative-commitments.xlsx', 'PK');

const corpusLines = fs.readFileSync(path.join(packRoot, '13-context/client-data-corpus.jsonl'), 'utf8').trim().split(/\r?\n/);
if (corpusLines.length !== rowCounts.enterprise_context_chunks) {
  fail(`client-data-corpus.jsonl expected ${rowCounts.enterprise_context_chunks} chunks, found ${corpusLines.length}`);
}
for (const [index, line] of corpusLines.entries()) {
  const chunk = JSON.parse(line);
  if (!chunk.chunk_id || !chunk.source_file_id || !chunk.content || !chunk.evidence_pointer) {
    fail(`client-data-corpus.jsonl line ${index + 1} is missing required fields`);
  }
  if (!sourceFileIds.has(chunk.source_file_id)) {
    fail(`client-data-corpus.jsonl line ${index + 1} references unknown source_file_id ${chunk.source_file_id}`);
  }
}

const corpusLoad = readJson('99-verification/expected-corpus-load.json');
if (
  corpusLoad.enterprise_context_source_files !== rowCounts.enterprise_context_source_files ||
  corpusLoad.enterprise_context_chunks !== rowCounts.enterprise_context_chunks ||
  corpusLoad.contract_pdfs !== rowCounts.contract_pdfs ||
  corpusLoad.charter_pdfs !== rowCounts.charter_pdfs
) {
  fail('expected-corpus-load.json does not match expected-row-counts.json');
}

const packFileCount = countFiles(packRoot);
if (packFileCount < rowCounts.min_pack_files) {
  fail(`Expected at least ${rowCounts.min_pack_files} pack files, found ${packFileCount}`);
}

const vendorSpend = vendorContracts.reduce(
  (sum, row) => sum + Number(row.annual_usd || 0),
  0,
);
if (vendorSpend !== rowCounts.total_vendor_spend_usd) {
  fail(`vendor spend expected ${rowCounts.total_vendor_spend_usd}, found ${vendorSpend}`);
}

const activeCommitments = activeInitiatives.reduce(
  (sum, row) => sum + Number(row.committed_usd || 0),
  0,
);
if (activeCommitments !== rowCounts.active_commitments_usd) {
  fail(`active commitments expected ${rowCounts.active_commitments_usd}, found ${activeCommitments}`);
}

const expectedWatchlist = readJson('99-verification/expected-watchlist-entries.json');
if (expectedWatchlist.seeded_expectations?.length !== 7) {
  fail('expected-watchlist-entries.json must contain the 7 seeded watchlist expectations');
}

const regulatory = readJson('11-regulatory/regulatory-scope.json');
for (const [scope, expected] of Object.entries({
  pci: 22,
  sox: 14,
  ccpa: 28,
  ada: 6,
  employee: 4,
  customs: 3,
})) {
  const actual = regulatory.scopes?.[scope]?.length;
  if (actual !== expected) fail(`regulatory ${scope} expected ${expected}, found ${actual}`);
}

console.log(JSON.stringify({
  ok: true,
  applicationPortfolioRows: apps.length,
  integrationEdges: topology.edges.length,
  packFiles: packFileCount,
  vendorContracts: vendorContracts.length,
  vendorSpendUsd: vendorSpend,
  activeInitiatives: activeInitiatives.length,
  activeCommitmentsUsd: activeCommitments,
  sourceFiles: sourceFileRows.length,
  corpusChunks: corpusLines.length,
  contractPdfs: contractPdfs.length,
  charterPdfs: charterPdfs.length,
  sentinelQuestions: expectedAnswers.questions.length,
  seededScenarioIds: [...requiredScenarioMarkers.keys()],
}, null, 2));

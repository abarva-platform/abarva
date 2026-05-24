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

console.log(JSON.stringify({
  ok: true,
  applicationPortfolioRows: apps.length,
  integrationEdges: topology.edges.length,
  sentinelQuestions: expectedAnswers.questions.length,
  seededScenarioIds: [...requiredScenarioMarkers.keys()],
}, null, 2));

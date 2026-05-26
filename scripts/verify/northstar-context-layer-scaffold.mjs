import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'datasets/northstar-clinical-tech-synthetic-v1');
const CATALOG = path.resolve(process.cwd(), 'docs/build/northstar/NORTHSTAR_CONTEXT_LAYER_TEMPLATE_CATALOG.md');

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function csvRows(file) {
  return read(file).trim().split(/\r?\n/).length - 1;
}

function json(file) {
  return JSON.parse(read(file));
}

function countFiles(dir) {
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) count += countFiles(full);
    else count += 1;
  }
  return count;
}

assert(fs.existsSync(ROOT), `Missing ${ROOT}`);
assert(fs.existsSync(CATALOG), `Missing ${CATALOG}`);

const expected = json('99-verification/expected-row-counts.json');
const actual = {
  applicationPortfolioRows: csvRows('07-application-portfolio/application-portfolio.csv'),
  integrationEdges: json('08-integration-topology/integration-topology.json').edges.length,
  activeInitiatives: csvRows('10-initiatives/initiatives-active.csv'),
  closedInitiatives: csvRows('10-initiatives/initiatives-closed.csv'),
  vendorContracts: csvRows('09-vendors-contracts/vendor-contracts.csv'),
  erpObjects: csvRows('06-erp-landscape/erp-landscape-workbook.csv'),
  plants: csvRows('05-sites-manufacturing/site-and-plant-inventory.csv'),
  productFamilies: csvRows('04-product-portfolio/product-portfolio.csv'),
  skuGroups: csvRows('04-product-portfolio/sku-product-groups.csv'),
  qmsRecords: csvRows('13-regulatory-qms/qms-events.csv'),
  sourceFiles: fs.readdirSync(path.join(ROOT, '16-market-corpus/source-files')).length,
  corpusChunks: read('16-market-corpus/client-data-corpus.jsonl').trim().split(/\r?\n/).length,
  orgRoles: csvRows('11-org-roles/org-roles.csv'),
  doraBaselines: csvRows('12-delivery-devex/dora-baseline.csv'),
  canonicalQuestions: json('99-verification/expected-sentinel-answers.json').questions.length,
  templates: fs.readdirSync(path.join(ROOT, '17-upload-templates')).length,
};

for (const [key, value] of Object.entries(expected)) {
  assert(actual[key] === value, `${key} expected ${value}, got ${actual[key]}`);
}

for (const platform of ['SAP ECC 6.0', 'SAP S/4HANA pilot', 'Oracle EBS', 'JD Edwards', 'Infor LN', 'Dynamics AX', 'AS/400 RPG', 'Mainframe batch']) {
  assert(read('06-erp-landscape/erp-landscape-workbook.csv').includes(platform), `Missing ERP platform ${platform}`);
}

for (const required of ['CEO', 'CFO', 'CIO', 'Chief Quality Officer', 'EVP Health Information Systems', 'SVP', 'VP', 'Senior Director', 'Director']) {
  assert(read('11-org-roles/org-roles.csv').includes(required), `Missing org level/role ${required}`);
}

const personaRows = csvRows('11-org-roles/demo-personas.csv');
assert(personaRows === 5, `Expected 5 demo personas, got ${personaRows}`);
const orgChart = json('11-org-roles/executive-org-chart.json');
assert(orgChart.cxo?.direct_reports?.length >= 4, 'Executive org chart must include at least 4 CEO direct reports');
for (const requiredLevel of ['EVP', 'SVP', 'VP', 'Senior Director', 'Director']) {
  assert(JSON.stringify(orgChart).includes(requiredLevel), `Executive org chart missing ${requiredLevel} chain`);
}

const scenarioDir = path.join(ROOT, '18-upload-scenarios');
assert(fs.readdirSync(scenarioDir).filter((name) => name.endsWith('.md')).length >= 8, 'Missing upload scenarios');

const catalog = fs.readFileSync(CATALOG, 'utf8');
for (const dimension of ['Financial KPIs', 'ERP Landscape', 'CMDB / Application Portfolio', 'Regulatory / QMS / Risk', 'C-Suite Strategy']) {
  assert(catalog.includes(dimension), `Catalog missing ${dimension}`);
}

const allText = [
  catalog,
  read('README.md'),
  read('manifest.yaml'),
].join('\n');
assert(!/Solventum/i.test(allText), 'Northstar pack must not use real Solventum name');

const packFiles = countFiles(ROOT);
assert(packFiles >= 120, `Expected at least 120 pack files, got ${packFiles}`);

console.log(JSON.stringify({ ok: true, ...actual, packFiles }, null, 2));

import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const root = path.join(repoRoot, 'datasets/meridian-health-synthetic-v1');
const templateRoot = path.join(root, '17-upload-templates');
const scenarioRoot = path.join(root, '18-upload-scenarios');
const showcaseDoc = path.join(repoRoot, 'docs/build/meridian/MERIDIAN_CONTEXT_LAYER_SHOWCASE.md');
const runtimeTemplateRegistry = path.join(repoRoot, 'src/lib/context-ingestion/template-registry.ts');

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function assertExists(file) {
  if (!fs.existsSync(file)) fail(`Missing ${path.relative(repoRoot, file)}`);
}

assertExists(templateRoot);
assertExists(scenarioRoot);
assertExists(showcaseDoc);
assertExists(runtimeTemplateRegistry);

const catalogPath = path.join(templateRoot, 'template-catalog.json');
assertExists(catalogPath);
const catalog = readJson(catalogPath);
if (!Array.isArray(catalog.templates)) fail('template-catalog.json must include templates[]');
if (catalog.templates.length < 20) fail(`Expected at least 20 templates, found ${catalog.templates.length}`);

const ids = new Set();
const registryText = fs.readFileSync(runtimeTemplateRegistry, 'utf8');
for (const template of catalog.templates) {
  for (const key of ['id', 'file', 'dimension', 'owner_role', 'refresh_cadence']) {
    if (!template[key]) fail(`Template missing ${key}: ${JSON.stringify(template)}`);
  }
  if (ids.has(template.id)) fail(`Duplicate template id ${template.id}`);
  ids.add(template.id);
  assertExists(path.join(templateRoot, template.file));
  const idPattern = new RegExp(`id:\\s*["']${template.id}["']`);
  const dimensionPattern = new RegExp(
    `dimension:\\s*["']${template.dimension}["']`,
  );
  if (!idPattern.test(registryText)) {
    fail(`${template.id} is missing from runtime template registry`);
  }
  if (!dimensionPattern.test(registryText)) {
    fail(`${template.dimension} is missing from runtime template registry`);
  }
  if (!Array.isArray(template.required_fields) || template.required_fields.length < 4) {
    fail(`${template.id} must declare at least 4 required fields`);
  }
  if (!Array.isArray(template.agent_workflows) || template.agent_workflows.length < 2) {
    fail(`${template.id} must declare at least 2 agent workflows`);
  }
  if (!Array.isArray(template.evidence_checks) || template.evidence_checks.length < 2) {
    fail(`${template.id} must declare at least 2 evidence checks`);
  }
}

const enterpriseProfilePath = path.join(templateRoot, 'enterprise-profile.yaml');
const enterpriseProfileText = fs.readFileSync(enterpriseProfilePath, 'utf8');
for (const phrase of [
  'Sacramento, California',
  'metric: hospitals',
  'value: 30',
  'metric: ambulatory_sites',
  'value: 280',
  'metric: employees',
  'value: 58000',
  'metric: covered_lives',
  'value: 1400000',
  'Azure Databricks lakehouse',
]) {
  if (!enterpriseProfileText.includes(phrase)) fail(`enterprise-profile.yaml missing canonical profile phrase: ${phrase}`);
}
for (const stalePhrase of ['value: 23', 'value: 187000', 'Charlotte, NC']) {
  if (enterpriseProfileText.includes(stalePhrase)) fail(`enterprise-profile.yaml still contains stale profile phrase: ${stalePhrase}`);
}

const scenarioFiles = fs.readdirSync(scenarioRoot).filter((name) => name.endsWith('.md'));
if (scenarioFiles.length < 8) fail(`Expected at least 8 upload scenarios, found ${scenarioFiles.length}`);
for (const file of scenarioFiles) {
  const text = fs.readFileSync(path.join(scenarioRoot, file), 'utf8');
  for (const phrase of ['## Uploads', '## Agent Value', '## Evidence Checks']) {
    if (!text.includes(phrase)) fail(`${file} missing ${phrase}`);
  }
}

const expected = readJson(path.join(root, '99-verification/expected-row-counts.json'));
if (expected.upload_templates < 20) fail('expected-row-counts upload_templates must be >= 20');
if (expected.upload_scenarios < 8) fail('expected-row-counts upload_scenarios must be >= 8');

const docText = fs.readFileSync(showcaseDoc, 'utf8');
for (const phrase of ['Application portfolio rows', 'Healthcare upload templates', 'Remaining Gap']) {
  if (!docText.includes(phrase)) fail(`Showcase doc missing ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  templates: catalog.templates.length,
  scenarios: scenarioFiles.length,
  dimensions: new Set(catalog.templates.map((template) => template.dimension)).size,
}, null, 2));

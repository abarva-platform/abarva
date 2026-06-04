import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const manifest = JSON.parse(readFileSync(path.join(repoRoot, 'docs/build/lakeshore/loaded/manifest.json'), 'utf8'));
const packPath = path.join(repoRoot, 'docs/build/lakeshore/agent-grounding/lakeshore-agent-grounding-prompts.json');
const pack = JSON.parse(readFileSync(packPath, 'utf8'));

const errors = [];
const warnings = [];
const templateIds = new Set(manifest.dataFiles.map((file) => file.templateId));
const documentNames = new Set(manifest.documents.map((doc) => doc.fileName));
const opcoIds = new Set(manifest.opcos.map((opco) => opco.id));
const promptText = JSON.stringify(pack.prompts ?? []);

function assert(condition, message) {
  if (!condition) errors.push(message);
}

assert(pack.tenantKey === manifest.tenantKey, `tenantKey ${pack.tenantKey} must match manifest ${manifest.tenantKey}`);
assert(pack.brokerKey === manifest.brokerKey, `brokerKey ${pack.brokerKey} must match manifest ${manifest.brokerKey}`);
assert(pack.syntheticNoticeRequired === true, 'syntheticNoticeRequired must be true');
assert(Array.isArray(pack.prompts) && pack.prompts.length >= 10, 'prompt pack must include at least 10 prompts');

const surfaces = new Map();
for (const surface of pack.requiredSurfaceCoverage ?? []) surfaces.set(surface, 0);

for (const prompt of pack.prompts ?? []) {
  assert(prompt.id && /^lsh-[a-z]+-\d{3}$/.test(prompt.id), `prompt id ${prompt.id} must follow lsh-surface-001`);
  assert(prompt.prompt && prompt.prompt.length >= 40, `${prompt.id} must include a meaningful prompt`);
  assert(prompt.expectedBehavior && prompt.expectedBehavior.length >= 40, `${prompt.id} must define expected behavior`);
  assert(Array.isArray(prompt.requiredTemplates) && prompt.requiredTemplates.length >= 3, `${prompt.id} must require at least 3 templates`);
  assert(Array.isArray(prompt.requiredEvidenceKeywords) && prompt.requiredEvidenceKeywords.length >= 3, `${prompt.id} must require at least 3 evidence keywords`);
  assert(Array.isArray(prompt.requiredOpcoIds) && prompt.requiredOpcoIds.length >= 1, `${prompt.id} must require opco coverage`);

  if (surfaces.has(prompt.surface)) surfaces.set(prompt.surface, surfaces.get(prompt.surface) + 1);
  else errors.push(`${prompt.id} uses unknown surface ${prompt.surface}`);

  for (const templateId of prompt.requiredTemplates ?? []) {
    assert(templateIds.has(templateId), `${prompt.id} references missing template ${templateId}`);
  }
  for (const docName of prompt.requiredDocuments ?? []) {
    assert(documentNames.has(docName), `${prompt.id} references missing document ${docName}`);
  }
  for (const opcoId of prompt.requiredOpcoIds ?? []) {
    assert(opcoIds.has(opcoId), `${prompt.id} references missing opco ${opcoId}`);
  }
}

for (const [surface, count] of surfaces.entries()) {
  assert(count >= 2, `surface ${surface} must have at least 2 prompts; found ${count}`);
}

for (const token of pack.forbiddenTenantTokens ?? []) {
  assert(!promptText.includes(token), `prompt text must not include forbidden tenant token ${token}`);
}

for (const token of pack.forbiddenRealCompanyTokens ?? []) {
  assert(!promptText.includes(token), `prompt text must not include real-company analog token ${token}`);
}

const usedTemplates = new Set((pack.prompts ?? []).flatMap((prompt) => prompt.requiredTemplates ?? []));
for (const required of ['vendor-contracts', 'application-portfolio', 'initiative-portfolio', 'financial-kpi-workbook', 'org-roles', 'integration-topology']) {
  assert(usedTemplates.has(required), `prompt pack must exercise ${required}`);
}

for (const templateId of templateIds) {
  if (!usedTemplates.has(templateId)) warnings.push(`template ${templateId} is not directly required by any prompt`);
}

const output = {
  status: errors.length === 0 ? 'ok' : 'failed',
  tenantKey: pack.tenantKey,
  brokerKey: pack.brokerKey,
  promptCount: pack.prompts?.length ?? 0,
  surfaces: Object.fromEntries(surfaces),
  usedTemplates: [...usedTemplates].sort(),
  warnings,
  errors,
};

console.log(JSON.stringify(output, null, 2));

if (errors.length > 0) {
  process.exitCode = 1;
}

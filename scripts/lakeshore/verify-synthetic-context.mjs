import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';

const repoRoot = process.cwd();
const outRoot = path.join(repoRoot, 'docs/build/lakeshore/loaded');
const manifestPath = path.join(outRoot, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

const expectedOpcos = ['LSH-HOLDCO', 'NLS', 'BMS', 'FFF', 'GLP'];
const expectedTemplateCount = 18;
const minimumStructuredRecords = 1_250;
const minimumDocuments = 20;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readRelative(relPath, encoding = 'utf8') {
  return readFileSync(path.join(outRoot, relPath), encoding);
}

function assertSignature(relPath, signature) {
  const buffer = readRelative(relPath, null);
  assert(buffer.subarray(0, signature.length).equals(Buffer.from(signature)), `${relPath} does not have expected signature ${signature}`);
}

function assertContains(fileName, requiredTokens) {
  const content = readRelative(`data/${fileName}.csv`);
  for (const token of requiredTokens) {
    assert(content.includes(token), `${fileName}.csv is missing token ${token}`);
  }
}

assert(manifest.tenantKey === 'lakeshore', 'manifest tenantKey must be lakeshore');
assert(manifest.brokerKey === 'lakeshore-holdings', 'manifest brokerKey must be lakeshore-holdings');
assert(manifest.syntheticNotice.includes('SYNTHETIC'), 'manifest must carry synthetic notice');
assert(manifest.totals.structuredRecords >= minimumStructuredRecords, `structured records must be >= ${minimumStructuredRecords}`);
assert(manifest.totals.csvFiles === expectedTemplateCount, `csv count must be ${expectedTemplateCount}`);
assert(manifest.totals.generatedDocuments >= minimumDocuments, `document count must be >= ${minimumDocuments}`);
assert(manifest.dataFiles.length === expectedTemplateCount, `manifest dataFiles must be ${expectedTemplateCount}`);
assert(manifest.opcos.length === expectedOpcos.length, `manifest opcos must include ${expectedOpcos.length} companies`);

for (const opcoId of expectedOpcos) {
  const opco = manifest.opcos.find((item) => item.id === opcoId);
  assert(opco, `manifest missing opco ${opcoId}`);
  assert(opco.cio && opco.cfo, `opco ${opcoId} must include CIO and CFO`);
  assert(Array.isArray(opco.platforms) && opco.platforms.length >= 6, `opco ${opcoId} must include at least 6 platforms`);
}

for (const file of manifest.dataFiles) {
  assert(file.rows > 0, `${file.templateId} must include rows`);
  assert(file.acceptedFormats.length > 0, `${file.templateId} must include accepted formats`);
  const csv = readRelative(file.path);
  assert(csv.includes('SYNTHETIC / ILLUSTRATIVE'), `${file.path} must label rows synthetic`);
}

for (const templateId of ['enterprise-profile', 'application-portfolio', 'vendor-contracts', 'initiative-portfolio', 'org-roles', 'erp-landscape-workbook']) {
  assertContains(templateId, expectedOpcos);
}

assertContains('application-portfolio', ['SAP S/4HANA', 'Salesforce Marketing Cloud', 'Shopify Plus', 'Cantaloupe Seed']);
assertContains('vendor-contracts', ['KYRIBA', 'MANHATTAN', 'SALESFORCE', 'SHOPIFY', 'CANTALOUPE']);
assertContains('initiative-portfolio', ['PGM-KYRIBA', 'PGM-WMS-MOD', 'PGM-LOYALTY', 'PGM-DTC-OMS', 'PGM-MICROMARKET']);

assertSignature('workbooks/lakeshore-context-data-bundle.xlsx', 'PK');
assertSignature('review-bundle/lakeshore-offline-review-bundle.zip', 'PK');
for (const doc of manifest.documents) {
  if (doc.fileName.endsWith('.pdf')) assertSignature(doc.path, '%PDF');
  if (doc.fileName.endsWith('.docx') || doc.fileName.endsWith('.pptx')) assertSignature(doc.path, 'PK');
}

const zipBuffer = readRelative('review-bundle/lakeshore-offline-review-bundle.zip', null);
const zip = await JSZip.loadAsync(zipBuffer);
const zipEntries = Object.keys(zip.files);
for (const required of ['README.md', 'manifest.json', 'data/application-portfolio.csv', 'data/vendor-contracts.csv', 'workbooks/lakeshore-context-data-bundle.xlsx']) {
  assert(zipEntries.includes(required), `offline ZIP missing ${required}`);
}
assert(zipEntries.filter((entry) => entry.startsWith('data/') && entry.endsWith('.csv')).length === expectedTemplateCount, 'offline ZIP must contain every CSV');
assert(zipEntries.filter((entry) => entry.startsWith('how-to/') && entry.endsWith('.md')).length === expectedTemplateCount, 'offline ZIP must contain every how-to page');

const zipSizeMb = statSync(path.join(outRoot, 'review-bundle/lakeshore-offline-review-bundle.zip')).size / 1024 / 1024;
assert(zipSizeMb > 0.05, 'offline ZIP should not be trivially empty');

console.log(JSON.stringify({
  status: 'ok',
  tenantKey: manifest.tenantKey,
  opcos: manifest.opcos.length,
  structuredRecords: manifest.totals.structuredRecords,
  csvFiles: manifest.totals.csvFiles,
  documents: manifest.totals.generatedDocuments,
  zipEntries: zipEntries.length,
  zipSizeMb: Number(zipSizeMb.toFixed(2)),
}, null, 2));

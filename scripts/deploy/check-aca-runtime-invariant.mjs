#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const DEFAULTS = {
  acrName: 'acrabarvalab001',
  imageRepository: 'abarva/web',
  containerAppName: 'ca-abarva-web-lab-eastus',
  resourceGroup: 'rg-abarva-controlplane-lab-eastus',
  productionBaseUrl: 'https://app.abarva.ai',
};

const FORBIDDEN_TAG_PREFIXES = [
  'source-',
  'codex-',
  'worktree-',
  'preview-',
  'branch-',
  'local-',
  'html',
  'promptfix-',
  'tower-',
  'lab-',
];

function argValue(name, fallback = '') {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
}

function boolArg(name) {
  return process.argv.includes(name);
}

function runAz(args) {
  return execFileSync('az', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function runCurl(url) {
  return execFileSync('curl', ['-fsS', url], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function parseJson(label, text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${label}: failed to parse JSON: ${error.message}`);
  }
}

function fail(errors, message) {
  errors.push(message);
}

function imageDigest(image) {
  const match = String(image || '').match(/@(?<digest>sha256:[a-f0-9]{64})$/i);
  return match?.groups?.digest ?? '';
}

function isMainRevisionName(name) {
  return /^ca-abarva-web-[^-]+-[^-]+--(?:m|main-)[a-f0-9]{7,12}$/i.test(String(name || ''));
}

function hasForbiddenTag(tags) {
  return (tags || []).some((tag) =>
    FORBIDDEN_TAG_PREFIXES.some((prefix) => String(tag).toLowerCase().startsWith(prefix)),
  );
}

const acrName = argValue('--acr-name', process.env.ACR_NAME || DEFAULTS.acrName);
const imageRepository = argValue(
  '--image-repository',
  process.env.IMAGE_REPOSITORY || DEFAULTS.imageRepository,
);
const containerAppName = argValue(
  '--container-app-name',
  process.env.CONTAINER_APP_NAME || DEFAULTS.containerAppName,
);
const resourceGroup = argValue('--resource-group', process.env.RESOURCE_GROUP || DEFAULTS.resourceGroup);
const expectedImage = argValue('--expected-image', process.env.EXPECTED_ACA_IMAGE || '');
const productionBaseUrl = argValue(
  '--production-base-url',
  process.env.PRODUCTION_BASE_URL || DEFAULTS.productionBaseUrl,
).replace(/\/$/, '');
const outDir = argValue('--out-dir', process.env.ACA_DRIFT_OUT_DIR || 'audit-artifacts/aca-runtime-drift');
const skipHealth = boolArg('--skip-health') || process.env.SKIP_HEALTH_CHECK === 'true';

const errors = [];
mkdirSync(outDir, { recursive: true });

const app = parseJson(
  'containerapp show',
  runAz([
    'containerapp',
    'show',
    '--name',
    containerAppName,
    '--resource-group',
    resourceGroup,
    '--output',
    'json',
  ]),
);
writeFileSync(path.join(outDir, 'containerapp.json'), `${JSON.stringify(app, null, 2)}\n`);

const traffic = app.properties?.configuration?.ingress?.traffic ?? [];
const fullTraffic = traffic.filter((entry) => Number(entry.weight ?? 0) === 100);
const nonZeroTraffic = traffic.filter((entry) => Number(entry.weight ?? 0) > 0);
const templateImage = app.properties?.template?.containers?.[0]?.image ?? '';

if (!templateImage.includes('@sha256:')) {
  fail(errors, `ACA template image must be digest-pinned; actual=${templateImage || '<empty>'}`);
}

if (expectedImage && templateImage !== expectedImage) {
  fail(errors, `ACA template image drift: expected=${expectedImage} actual=${templateImage}`);
}

if (fullTraffic.length !== 1 || nonZeroTraffic.length !== 1) {
  fail(
    errors,
    `ACA traffic must have exactly one 100% revision and no partial non-zero split; actual=${JSON.stringify(traffic)}`,
  );
}

const activeRevisionName = fullTraffic[0]?.revisionName ?? '';
if (!activeRevisionName) {
  fail(errors, 'No 100% traffic revision found.');
}

if (activeRevisionName && !isMainRevisionName(activeRevisionName)) {
  fail(
    errors,
    `100% traffic revision must be a main revision (m<sha> or main-<sha>); actual=${activeRevisionName}`,
  );
}

let activeRevision = null;
if (activeRevisionName) {
  activeRevision = parseJson(
    'active revision show',
    runAz([
      'containerapp',
      'revision',
      'show',
      '--name',
      containerAppName,
      '--resource-group',
      resourceGroup,
      '--revision',
      activeRevisionName,
      '--output',
      'json',
    ]),
  );
  writeFileSync(path.join(outDir, 'active-revision.json'), `${JSON.stringify(activeRevision, null, 2)}\n`);
}

const activeImage = activeRevision?.properties?.template?.containers?.[0]?.image ?? '';
if (!activeImage.includes('@sha256:')) {
  fail(errors, `100% traffic revision image must be digest-pinned; actual=${activeImage || '<empty>'}`);
}

if (activeImage && templateImage && activeImage !== templateImage) {
  fail(errors, `ACA active revision image drift: template=${templateImage} active=${activeImage}`);
}

if (expectedImage && activeImage !== expectedImage) {
  fail(errors, `ACA active revision image drift: expected=${expectedImage} actual=${activeImage}`);
}

const digest = imageDigest(activeImage || templateImage);
let manifest = null;
if (digest) {
  manifest = parseJson(
    'acr manifest show-metadata',
    runAz([
      'acr',
      'manifest',
      'show-metadata',
      '--registry',
      acrName,
      '--name',
      `${imageRepository}@${digest}`,
      '--output',
      'json',
    ]),
  );
  writeFileSync(path.join(outDir, 'acr-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  const tags = manifest.tags ?? [];
  if (!tags.some((tag) => /^main-[a-f0-9]{7,12}$/i.test(String(tag)))) {
    fail(errors, `Active digest must have a main-<sha> ACR tag; digest=${digest} tags=${JSON.stringify(tags)}`);
  }
  if (hasForbiddenTag(tags)) {
    fail(errors, `Active digest has forbidden ACR tag(s); digest=${digest} tags=${JSON.stringify(tags)}`);
  }
}

let health = null;
if (!skipHealth) {
  health = parseJson('health endpoint', runCurl(`${productionBaseUrl}/api/health`));
  writeFileSync(path.join(outDir, 'health.json'), `${JSON.stringify(health, null, 2)}\n`);
  if (health.ok !== true) {
    fail(errors, `Production health endpoint is not ok=true: ${JSON.stringify(health)}`);
  }
}

const proof = {
  checkedAt: new Date().toISOString(),
  containerAppName,
  resourceGroup,
  productionBaseUrl,
  expectedImage: expectedImage || null,
  templateImage,
  activeRevisionName,
  activeImage,
  activeDigest: digest || null,
  activeDigestTags: manifest?.tags ?? [],
  traffic,
  health,
  passed: errors.length === 0,
  errors,
};
writeFileSync(path.join(outDir, 'runtime-invariant-proof.json'), `${JSON.stringify(proof, null, 2)}\n`);

if (errors.length > 0) {
  console.error('ACA runtime invariant failed.');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('ACA runtime invariant passed.');
console.log(JSON.stringify(proof, null, 2));

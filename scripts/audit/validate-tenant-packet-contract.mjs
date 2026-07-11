#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const manifestPath = path.join(repoRoot, 'fixtures/tenant-packets/minimal/tenant-manifest.example.yaml');

const allowedDataStatuses = new Set(['real', 'synthetic', 'curated', 'benchmark']);
const allowedSensitivity = new Set(['public', 'internal', 'confidential', 'restricted']);
const allowedModules = new Set(['home', 'intelligence', 'moves', 'source', 'tower', 'export']);
const allowedSourceClasses = new Set([
  'enterprise_profile',
  'organization_functions',
  'applications_systems',
  'data_assets_integrations',
  'vendors_contracts',
  'spend_value',
  'programs_priorities',
  'risks_controls',
  'metric_definitions',
  'evidence_registry',
  'module_memory',
  'outcome_measurements',
  'benchmark_context',
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

async function loadManifest(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  try {
    const yaml = await import('js-yaml');
    return yaml.load(text);
  } catch {
    return parseSimpleManifestYaml(text);
  }
}

function parseScalar(value) {
  const trimmed = value.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed.replace(/^['"]|['"]$/g, '');
}

function parseSimpleManifestYaml(text) {
  const root = {};
  const stack = [{ indent: -1, value: root }];
  const lines = text.split(/\r?\n/).filter((line) => line.trim() && !line.trimStart().startsWith('#'));

  for (const line of lines) {
    const indent = line.match(/^ */)?.[0].length ?? 0;
    const trimmed = line.trim();
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
    const parent = stack[stack.length - 1].value;

    if (trimmed.startsWith('- ')) {
      if (!Array.isArray(parent)) throw new Error(`Unexpected list item: ${trimmed}`);
      const itemText = trimmed.slice(2);
      if (itemText.includes(':')) {
        const [rawKey, ...rest] = itemText.split(':');
        const obj = {};
        const value = rest.join(':').trim();
        obj[rawKey.trim()] = value ? parseScalar(value) : {};
        parent.push(obj);
        stack.push({ indent, value: obj });
      } else {
        parent.push(parseScalar(itemText));
      }
      continue;
    }

    const [rawKey, ...rest] = trimmed.split(':');
    const key = rawKey.trim();
    const value = rest.join(':').trim();
    if (!value) {
      const nextLine = lines[lines.indexOf(line) + 1]?.trim();
      const container = nextLine?.startsWith('- ') ? [] : {};
      parent[key] = container;
      stack.push({ indent, value: container });
    } else {
      parent[key] = parseScalar(value);
    }
  }

  return root;
}

const manifest = await loadManifest(manifestPath);

assert(manifest && typeof manifest === 'object' && !Array.isArray(manifest), 'manifest must be an object');
assert(manifest.contractVersion === 'tenant-packet/v1', 'contractVersion must be tenant-packet/v1');
assert(nonEmptyString(manifest.packetId), 'packetId is required');
assert(nonEmptyString(manifest.tenantKey), 'tenantKey is required');
assert(nonEmptyString(manifest.tenantDisplayName), 'tenantDisplayName is required');
assert(allowedDataStatuses.has(manifest.dataStatus), 'dataStatus is invalid');
assert(allowedSensitivity.has(manifest.sensitivity), 'sensitivity is invalid');
assert(nonEmptyString(manifest.sourceOwner), 'sourceOwner is required');
assert(nonEmptyString(manifest.effectiveDate), 'effectiveDate is required');
assert(Array.isArray(manifest.intendedDomains) && manifest.intendedDomains.length > 0, 'intendedDomains are required');
assert(Array.isArray(manifest.intendedModules) && manifest.intendedModules.length > 0, 'intendedModules are required');
assert(manifest.intendedModules.every((moduleKey) => allowedModules.has(moduleKey)), 'intendedModules contain an invalid module');
assert(Array.isArray(manifest.sourceProfiles) && manifest.sourceProfiles.length > 0, 'sourceProfiles are required');
assert(Array.isArray(manifest.files) && manifest.files.length > 0, 'files are required');

const sourceProfileKeys = new Set();
for (const profile of manifest.sourceProfiles) {
  assert(allowedSourceClasses.has(profile.sourceClass), `invalid sourceProfile sourceClass: ${profile.sourceClass}`);
  assert(nonEmptyString(profile.sourceProfile), 'sourceProfile.sourceProfile is required');
  assert(nonEmptyString(profile.mappingProfile), 'sourceProfile.mappingProfile is required');
  assert(nonEmptyString(profile.adapterKey), 'sourceProfile.adapterKey is required');
  assert(nonEmptyString(profile.parserVersion), 'sourceProfile.parserVersion is required');
  sourceProfileKeys.add(`${profile.sourceClass}:${profile.sourceProfile}:${profile.mappingProfile}:${profile.adapterKey}`);
}

for (const file of manifest.files) {
  assert(nonEmptyString(file.path), 'file.path is required');
  assert(allowedSourceClasses.has(file.sourceClass), `invalid file sourceClass: ${file.sourceClass}`);
  assert(nonEmptyString(file.sourceProfile), 'file.sourceProfile is required');
  assert(nonEmptyString(file.mappingProfile), 'file.mappingProfile is required');
  assert(nonEmptyString(file.adapterKey), 'file.adapterKey is required');
  assert(sourceProfileKeys.has(`${file.sourceClass}:${file.sourceProfile}:${file.mappingProfile}:${file.adapterKey}`), `file ${file.path} does not match a declared sourceProfile`);
  assert(file.dataStatus === undefined || allowedDataStatuses.has(file.dataStatus), `invalid file dataStatus: ${file.dataStatus}`);
  assert(file.sensitivity === undefined || allowedSensitivity.has(file.sensitivity), `invalid file sensitivity: ${file.sensitivity}`);
  assert(Array.isArray(file.expectedDomains) && file.expectedDomains.length > 0, `file ${file.path} must declare expectedDomains`);
}

assert(manifest.qualityGates && typeof manifest.qualityGates === 'object', 'qualityGates are required');
assert(Number.isFinite(manifest.qualityGates.minimumMappingCoveragePercent), 'minimumMappingCoveragePercent must be numeric');
assert(manifest.qualityGates.minimumMappingCoveragePercent >= 0 && manifest.qualityGates.minimumMappingCoveragePercent <= 100, 'minimumMappingCoveragePercent must be between 0 and 100');
assert(manifest.promotionPolicy?.createCandidateVersion === true, 'promotionPolicy.createCandidateVersion must be true');
assert(manifest.promotionPolicy?.promoteAutomatically === false, 'promotionPolicy.promoteAutomatically must be false');
assert(manifest.promotionPolicy?.preservePriorActiveVersion === true, 'promotionPolicy.preservePriorActiveVersion must be true');

console.log(`Tenant packet contract validation passed: ${path.relative(repoRoot, manifestPath)}`);

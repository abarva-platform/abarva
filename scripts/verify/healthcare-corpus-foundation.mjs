#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const manifestPath = path.join(
  root,
  'docs/build/healthcare-corpus/healthcare-corpus-manifest.json',
);
const blueprintPath = path.join(
  root,
  'docs/build/healthcare-corpus/healthcare-corpus-blueprint.md',
);

function fail(message) {
  throw new Error(message);
}

function assertArray(value, label, minimumLength) {
  if (!Array.isArray(value)) fail(`${label} must be an array.`);
  if (value.length < minimumLength) {
    fail(`${label} expected at least ${minimumLength} entries, found ${value.length}.`);
  }
}

if (!fs.existsSync(manifestPath)) {
  fail(`Missing manifest at ${path.relative(root, manifestPath)}.`);
}

if (!fs.existsSync(blueprintPath)) {
  fail(`Missing blueprint at ${path.relative(root, blueprintPath)}.`);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const blueprint = fs.readFileSync(blueprintPath, 'utf8');
const thresholds = manifest.acceptance_thresholds ?? {};
const minimumDimensions = Number(thresholds.minimum_dimensions ?? 20);
const minimumPatterns = Number(thresholds.minimum_target_patterns_per_dimension ?? 50);
const dimensions = manifest.dimensions ?? [];

assertArray(dimensions, 'manifest.dimensions', minimumDimensions);

const ids = new Set();
for (const [index, dimension] of dimensions.entries()) {
  const label = `dimension ${index + 1}${dimension?.id ? ` (${dimension.id})` : ''}`;
  for (const field of thresholds.required_dimension_fields ?? []) {
    if (dimension[field] === undefined || dimension[field] === null || dimension[field] === '') {
      fail(`${label} missing required field ${field}.`);
    }
  }

  if (ids.has(dimension.id)) fail(`${label} duplicates id ${dimension.id}.`);
  ids.add(dimension.id);

  const target = Number(dimension.target_pattern_count);
  if (!Number.isFinite(target)) fail(`${label} target_pattern_count must be numeric.`);
  if (target < minimumPatterns) {
    fail(`${label} target_pattern_count expected at least ${minimumPatterns}, found ${target}.`);
  }

  assertArray(
    dimension.example_pattern_families,
    `${label}.example_pattern_families`,
    Number(thresholds.minimum_example_pattern_families ?? 1),
  );
  assertArray(
    dimension.data_evidence_sources,
    `${label}.data_evidence_sources`,
    Number(thresholds.minimum_data_evidence_sources ?? 1),
  );
  assertArray(
    dimension.regulatory_overlays,
    `${label}.regulatory_overlays`,
    Number(thresholds.minimum_regulatory_overlays ?? 1),
  );
  assertArray(
    dimension.agent_workflows_unlocked,
    `${label}.agent_workflows_unlocked`,
    Number(thresholds.minimum_agent_workflows ?? 1),
  );

  if (!blueprint.includes(dimension.name)) {
    fail(`${label} name "${dimension.name}" is not represented in the blueprint.`);
  }
}

const totalTargetPatterns = dimensions.reduce(
  (sum, dimension) => sum + Number(dimension.target_pattern_count),
  0,
);

console.log('Healthcare corpus foundation verified.');
console.log(`Dimensions: ${dimensions.length}`);
console.log(`Minimum target patterns per dimension: ${minimumPatterns}`);
console.log(`Total target patterns declared: ${totalTargetPatterns}`);

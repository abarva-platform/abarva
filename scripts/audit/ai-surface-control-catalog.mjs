#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const CATALOG_PATH = path.join(
  process.cwd(),
  'docs/security/ai-surface-control-catalog.json',
);

const REQUIRED_CONTROL_KINDS = new Set([
  'ai-label',
  'citation',
  'confidence',
  'human-approval-gate',
  'responsibility-footer',
]);

function fail(message, details = []) {
  console.error(message);
  for (const detail of details) {
    console.error(`- ${detail}`);
  }
  process.exit(1);
}

function readCatalog() {
  if (!fs.existsSync(CATALOG_PATH)) {
    fail(`AI surface control catalog missing: ${path.relative(process.cwd(), CATALOG_PATH)}`);
  }

  try {
    return JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  } catch (error) {
    fail(`AI surface control catalog is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function normalizeEvidence(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item.trim()) : [];
}

function validateSurface(surface, index) {
  const label = surface?.id ?? `surface[${index}]`;
  const problems = [];

  if (!surface || typeof surface !== 'object') {
    return [`surface[${index}] must be an object`];
  }
  if (!surface.id || typeof surface.id !== 'string') {
    problems.push(`${label}: id is required`);
  }
  if (!surface.surface || typeof surface.surface !== 'string') {
    problems.push(`${label}: human-readable surface name is required`);
  }
  if (!surface.path || typeof surface.path !== 'string') {
    problems.push(`${label}: path is required`);
  }
  if (!Array.isArray(surface.requiredControls) || surface.requiredControls.length === 0) {
    problems.push(`${label}: requiredControls must include at least one control`);
  }

  const filePath = surface.path ? path.join(process.cwd(), surface.path) : null;
  const source = filePath && fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
  if (filePath && !source) {
    problems.push(`${label}: path does not exist (${surface.path})`);
  }

  const seenKinds = new Set();
  for (const control of surface.requiredControls ?? []) {
    const kind = control?.kind;
    const controlLabel = `${label}:${kind ?? 'unknown-control'}`;
    if (!REQUIRED_CONTROL_KINDS.has(kind)) {
      problems.push(`${controlLabel}: kind must be one of ${Array.from(REQUIRED_CONTROL_KINDS).join(', ')}`);
      continue;
    }
    if (seenKinds.has(kind)) {
      problems.push(`${controlLabel}: duplicate control kind`);
    }
    seenKinds.add(kind);

    const evidence = normalizeEvidence(control.evidence);
    if (evidence.length === 0) {
      problems.push(`${controlLabel}: evidence must include at least one code token`);
      continue;
    }
    if (source) {
      for (const token of evidence) {
        if (!source.includes(token)) {
          problems.push(`${controlLabel}: missing evidence token "${token}" in ${surface.path}`);
        }
      }
    }
  }

  return problems;
}

function main() {
  const catalog = readCatalog();
  const surfaces = catalog.controls;
  if (!Array.isArray(surfaces) || surfaces.length === 0) {
    fail('AI surface control catalog must include a non-empty controls array.');
  }

  const ids = new Set();
  const problems = [];
  surfaces.forEach((surface, index) => {
    if (surface?.id) {
      if (ids.has(surface.id)) {
        problems.push(`${surface.id}: duplicate surface id`);
      }
      ids.add(surface.id);
    }
    problems.push(...validateSurface(surface, index));
  });

  if (problems.length > 0) {
    fail('AI surface control catalog failed.', problems);
  }

  console.log(`AI surface control catalog passed (${surfaces.length} surfaces).`);
}

main();

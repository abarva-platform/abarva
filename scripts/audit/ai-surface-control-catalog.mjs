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
  'citation-gap',
  'confidence',
  'human-approval-gate',
  'edit-before-commit',
  'responsibility-footer',
  'risk-caveat',
]);

const LEGAL_CATALOGS = [
  {
    id: 'consequential',
    path: 'docs/legal/AI_CONSEQUENTIAL_ACTION_CATALOG.md',
    header: '| Module | Surface / action | Code path | Current control | Required / next control |',
    parseClaims(columns) {
      const [module, surface, , currentControl] = columns;
      if (!currentControl?.startsWith('Covered')) return [];
      return [
        {
          key: `consequential|${module}|${surface}|human-approval-gate`,
          catalog: 'consequential',
          module,
          surface,
          controlKind: 'human-approval-gate',
        },
      ];
    },
  },
  {
    id: 'generated-ui',
    path: 'docs/legal/AI_GENERATED_UI_CATALOG.md',
    header:
      '| Module | Surface / element | Code path | AI label present? | Citations / evidence present? | Confidence / assumption disclosure present? | Required / next control |',
    parseClaims(columns) {
      const [module, surface, , aiLabel, citations, confidence] = columns;
      return [
        aiLabel?.startsWith('Yes') && {
          key: `generated-ui|${module}|${surface}|ai-label`,
          catalog: 'generated-ui',
          module,
          surface,
          controlKind: 'ai-label',
        },
        citations?.startsWith('Yes') && {
          key: `generated-ui|${module}|${surface}|citation`,
          catalog: 'generated-ui',
          module,
          surface,
          controlKind: 'citation',
        },
        confidence?.startsWith('Yes') && {
          key: `generated-ui|${module}|${surface}|confidence`,
          catalog: 'generated-ui',
          module,
          surface,
          controlKind: 'confidence',
        },
      ].filter(Boolean);
    },
  },
];

function fail(message, details = []) {
  console.error(message);
  for (const detail of details) {
    console.error(`- ${detail}`);
  }
  process.exit(1);
}

function parseMarkdownTableClaims(catalog) {
  const catalogPath = path.join(process.cwd(), catalog.path);
  if (!fs.existsSync(catalogPath)) {
    fail(`Legal catalog missing: ${catalog.path}`);
  }

  const lines = fs.readFileSync(catalogPath, 'utf8').split(/\r?\n/);
  const claims = [];
  let inTable = false;

  for (const line of lines) {
    if (line.trim() === catalog.header) {
      inTable = true;
      continue;
    }
    if (!inTable) continue;
    if (line.startsWith('| ---')) continue;
    if (!line.startsWith('|')) break;

    const columns = line
      .slice(1, -1)
      .split('|')
      .map((column) => column.trim());
    claims.push(...catalog.parseClaims(columns));
  }

  return claims;
}

function collectLegalCatalogClaims() {
  return LEGAL_CATALOGS.flatMap(parseMarkdownTableClaims);
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

function normalizeCoverageEntries(catalog) {
  const entries = Array.isArray(catalog.catalogClaimCoverage)
    ? catalog.catalogClaimCoverage
    : [];
  return entries.filter((entry) => entry && typeof entry === 'object');
}

function normalizeEvidence(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item.trim()) : [];
}

function validateCatalogClaimCoverage(catalog, surfacesById) {
  const claims = collectLegalCatalogClaims();
  const claimKeys = new Set(claims.map((claim) => claim.key));
  const entries = normalizeCoverageEntries(catalog);
  const coverageByKey = new Map();
  const problems = [];

  for (const entry of entries) {
    const label = entry.key ?? 'unknown-catalog-claim';
    if (!entry.key || typeof entry.key !== 'string') {
      problems.push('catalogClaimCoverage entry missing key');
      continue;
    }
    if (coverageByKey.has(entry.key)) {
      problems.push(`${label}: duplicate catalog claim coverage entry`);
    }
    coverageByKey.set(entry.key, entry);

    if (!claimKeys.has(entry.key)) {
      problems.push(`${label}: does not match a current legal catalog claim`);
    }
    if (!['covered', 'deferred'].includes(entry.status)) {
      problems.push(`${label}: status must be covered or deferred`);
    }
    const claim = claims.find((item) => item.key === entry.key);
    if (claim && entry.controlKind !== claim.controlKind) {
      problems.push(`${label}: controlKind must be ${claim.controlKind}`);
    }
    if (entry.status === 'covered') {
      const surface = surfacesById.get(entry.surfaceId);
      if (!surface) {
        problems.push(`${label}: covered claim references unknown surfaceId ${entry.surfaceId ?? '(missing)'}`);
        continue;
      }
      const hasControl = (surface.requiredControls ?? []).some(
        (control) => control.kind === entry.controlKind,
      );
      if (!hasControl) {
        problems.push(`${label}: surface ${entry.surfaceId} does not include ${entry.controlKind}`);
      }
    }
    if (entry.status === 'deferred') {
      if (!entry.reason || typeof entry.reason !== 'string' || entry.reason.trim().length < 20) {
        problems.push(`${label}: deferred claims need a concrete reason`);
      }
    }
  }

  for (const claim of claims) {
    if (!coverageByKey.has(claim.key)) {
      problems.push(`${claim.key}: missing catalogClaimCoverage entry`);
    }
  }

  return problems;
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
  const surfacesById = new Map();
  const problems = [];
  surfaces.forEach((surface, index) => {
    if (surface?.id) {
      if (ids.has(surface.id)) {
        problems.push(`${surface.id}: duplicate surface id`);
      }
      ids.add(surface.id);
      surfacesById.set(surface.id, surface);
    }
    problems.push(...validateSurface(surface, index));
  });
  problems.push(...validateCatalogClaimCoverage(catalog, surfacesById));

  if (problems.length > 0) {
    fail('AI surface control catalog failed.', problems);
  }

  console.log(`AI surface control catalog passed (${surfaces.length} surfaces).`);
}

main();

#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  collectTenantNarrativeTermsFromRegistry,
  findTenantNarrativeViolations,
  loadTenantNarrativeTerms,
  validateTenantNarrativeGuard,
} from '../release-record-tenant-narrative-guard.mjs';

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

const registry = {
  activeTenants: [
    {
      tenantKey: 'sample-health',
      displayName: 'Sample Health',
    },
  ],
  retiredTenants: [
    {
      tenantKey: 'example-air',
      displayName: 'Example Air',
    },
  ],
};

const terms = collectTenantNarrativeTermsFromRegistry(registry);

test('registry terms include full keys, display names, and distinctive tokens', () => {
  assert.ok(terms.includes('sample-health'));
  assert.ok(terms.includes('sample health'));
  assert.ok(terms.includes('sample'));
  assert.ok(terms.includes('example-air'));
  assert.ok(terms.includes('example'));
});

test('plain prose naming a registry tenant is refused', () => {
  const markdown = 'The Sample Health record changed from one generation to another.';
  const violations = findTenantNarrativeViolations(markdown, terms);
  assert.deepEqual(violations, [{ lineNumber: 1 }]);
});

test('repo paths and command identifiers in code spans are allowed', () => {
  const markdown = [
    '- Changed `scripts/tower/generate-sample-health-source.mjs`.',
    '- Re-ran `node scripts/load.mjs --tenant sample-health`.',
  ].join('\n');
  assert.deepEqual(findTenantNarrativeViolations(markdown, terms), []);
});

test('fenced audit snippets are allowed so real command output can stay factual', () => {
  const markdown = [
    '```text',
    'datasets/tenant-inputs/active/sample-health/current/source.csv',
    '```',
  ].join('\n');
  assert.deepEqual(findTenantNarrativeViolations(markdown, terms), []);
});

test('markdown link URLs are allowed but link prose is still checked', () => {
  assert.deepEqual(
    findTenantNarrativeViolations(
      '[internal path](https://example.test/scripts/sample-health.md)',
      terms,
    ),
    [],
  );
  assert.deepEqual(
    findTenantNarrativeViolations(
      '[Sample Health audit](https://example.test/scripts/source.md)',
      terms,
    ),
    [{ lineNumber: 1 }],
  );
});

test('generic tenant wording remains available', () => {
  const markdown =
    'The active tenant and a second fixture tenant exercised the same path without naming either one.';
  assert.deepEqual(findTenantNarrativeViolations(markdown, terms), []);
});

test('release identifiers are prose unless they are real code/path evidence', () => {
  const markdown = [
    '## Release ID',
    '',
    '`2026-08-31-sample-health-refresh`',
  ].join('\n');
  assert.equal(validateTenantNarrativeGuard('docs/releases/records/example.md', markdown, terms).length, 1);
  assert.equal(
    validateTenantNarrativeGuard(
      'docs/releases/records/example.md',
      '`docs/releases/records/2026-08-31-sample-health-refresh.md`',
      terms,
    ).length,
    0,
  );
  assert.equal(
    validateTenantNarrativeGuard(
      'docs/releases/records/example.md',
      'Release id: 2026-08-31-sample-health-refresh',
      terms,
    ).length,
    1,
  );
});

// ---------------------------------------------------------------------------
// The cases above run against a synthetic registry, so none of them exercises
// the term list the gate actually applies on a pull request. The block below
// loads the real registry, because the defect these tests exist to prevent is a
// term the real registry derives and the synthetic one cannot.
//
// No tenant name is written as a literal here: the identifiers come from the
// registry at runtime, which is both the rule in AGENTS.md and the only way
// these assertions keep working when the registry changes.
// ---------------------------------------------------------------------------

const registryTerms = loadTenantNarrativeTerms();
const registryTenants = JSON.parse(
  readFileSync(
    path.resolve(process.cwd(), 'datasets/tenant-inputs/tenant-input-registry.json'),
    'utf8',
  ),
);
const allRegistryTenants = [
  ...(registryTenants.activeTenants ?? []),
  ...(registryTenants.retiredTenants ?? []),
];

// Ordinary English words that appear in release-record prose and carry no
// tenant identity on their own. Each is a word some registry key or display
// name happens to contain; blocking it costs an author a rewrite and protects
// nothing, because the full key and full display name stay on the term list.
const ORDINARY_PROSE_WORDS = [
  'airline',
  'capital',
  'clinical',
  'demo',
  'financial',
  'first',
  'health',
  'holdings',
  'industries',
  'new',
  'retail',
];

test('ordinary English words are not on the real registry term list', () => {
  const blocked = ORDINARY_PROSE_WORDS.filter((word) => registryTerms.includes(word));
  assert.deepEqual(
    blocked,
    [],
    `these ordinary words are derived as tenant terms and would be refused in prose: ${blocked.join(', ')}`,
  );
});

test('ordinary English words survive the guard in real release-record prose', () => {
  for (const word of ORDINARY_PROSE_WORDS) {
    const markdown = `The ${word} path was measured before and after the change.`;
    assert.deepEqual(
      findTenantNarrativeViolations(markdown, registryTerms),
      [],
      `"${word}" was refused in ordinary prose`,
    );
  }
});

test('every registry tenant is still refused when its identifier is written as prose', () => {
  assert.ok(allRegistryTenants.length > 0, 'registry lists no tenants; the guard would be inert');

  for (const tenant of allRegistryTenants) {
    const key = String(tenant.tenantKey ?? '').trim();
    if (!key) continue;

    const spaced = key.replace(/[-_]+/g, ' ');
    assert.equal(
      validateTenantNarrativeGuard('docs/releases/records/example.md', `The ${spaced} rollout completed.`, registryTerms)
        .length,
      1,
      `a registry tenant identifier passed the guard as prose`,
    );
    assert.equal(
      validateTenantNarrativeGuard('docs/releases/records/example.md', `Loaded for ${key} in this release.`, registryTerms)
        .length,
      1,
      `a registry tenant key passed the guard as prose`,
    );
  }
});

test('a generic word is exempted from both derivation paths, not just one', () => {
  // "capital" as a key part, "airline" as a display-name first word. If either
  // exemption is dropped, an ordinary word re-enters the term list.
  const derived = collectTenantNarrativeTermsFromRegistry({
    activeTenants: [{ tenantKey: 'fixture-capital', displayName: 'Airline Fixture' }],
    retiredTenants: [],
  });

  assert.ok(!derived.includes('capital'), 'a generic key part was derived as a tenant term');
  assert.ok(!derived.includes('airline'), 'a generic display-name first word was derived as a tenant term');
  assert.ok(derived.includes('fixture'), 'the distinctive token was dropped along with the generic ones');
});

let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`  ok  ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAIL  ${name}\n        ${err.message}`);
  }
}
console.log(`\n${tests.length - failed}/${tests.length} passed`);
process.exit(failed ? 1 : 0);

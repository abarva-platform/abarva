#!/usr/bin/env node

import assert from 'node:assert/strict';
import {
  collectTenantNarrativeTermsFromRegistry,
  findTenantNarrativeViolations,
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

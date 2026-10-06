#!/usr/bin/env node

/**
 * Proves the `Layer Impact` lane rule can fail, and fails for the right reason.
 *
 * The rule this replaces was `/lane\b/` over the section body, which is
 * satisfied by the substring inside `plane`. Measured over the 4,163 records in
 * docs/releases/records on 18 Sep, 228 of them satisfied it without the word
 * `lane` ever appearing as a word in their Layer Impact section.
 *
 * Half of these cases are unit tests over the guard; the rest drive the real
 * `check-release-record.mjs` in a scratch git repository, because a rule that is
 * only unit-tested is a rule nobody has proven is reached.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AGENTS_DOC_PATH,
  collectReleaseLanesFromAgentsDoc,
  findReleaseLanesNamed,
  loadReleaseLanes,
  namesReleaseLane,
  validateLayerImpactLane,
} from '../release-record-lane-guard.mjs';

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const lanes = loadReleaseLanes();

// ---------------------------------------------------------------------------
// The vocabulary comes from AGENTS.md, and nothing here restates it by hand
// except this one assertion, whose whole job is to notice if it changes.
// ---------------------------------------------------------------------------

test('the lane vocabulary is derived from AGENTS.md, and it is the five declared lanes', () => {
  assert.deepEqual(lanes, [
    'global-control-lane',
    'client-data-lane',
    'internal-admin',
    'public-demo',
    'experimental',
  ]);
  assert.ok(AGENTS_DOC_PATH.endsWith(path.join('nexus', 'AGENTS.md')) || AGENTS_DOC_PATH.endsWith('AGENTS.md'));
});

test('a doc with no lane list yields no lanes, and loading it fails closed', () => {
  assert.deepEqual(collectReleaseLanesFromAgentsDoc('# Nothing here\n\n- `not-a-lane` some prose\n'), []);
  const empty = path.join(mkdtempSync(path.join(tmpdir(), 'lane-guard-')), 'AGENTS.md');
  writeFileSync(empty, '# no lanes declared\n');
  assert.throws(() => loadReleaseLanes(empty), /derived no lanes/);
  assert.throws(() => loadReleaseLanes(path.join(empty, 'missing')), /does not exist/);
});

// ---------------------------------------------------------------------------
// The defect: `plane` is not a lane.
// ---------------------------------------------------------------------------

test('a Layer Impact section that only says "no data plane" is refused', () => {
  assert.equal(namesReleaseLane('no data plane', lanes), false);
  const errors = validateLayerImpactLane('record.md', 'no data plane', lanes);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /must name the release lane/);
});

test('real record prose that passed the old rule on a substring is refused', () => {
  // Verbatim shape from records in docs/releases/records that satisfied `/lane\b/`
  // without naming any lane at all.
  const body = [
    '- UI shell: `SomeTopNavBadge`',
    '- Runtime API: no API behavior changes in this slice',
    '- Data plane: no schema or data changes',
  ].join('\n');
  assert.equal(/lane\b/.test(body), true, 'precondition: the old rule passed this body');
  assert.equal(namesReleaseLane(body, lanes), false);
});

test('the bare word "lane" without naming one is refused', () => {
  for (const body of ['Lane: none', 'lane: n/a', 'No lane applies to this change.']) {
    assert.equal(namesReleaseLane(body, lanes), false, body);
  }
});

// ---------------------------------------------------------------------------
// The half the old rule got wrong in the other direction: three of the five
// declared lanes do not contain the word `lane`, so naming one correctly and
// alone was refused.
// ---------------------------------------------------------------------------

test('each declared lane, named alone, passes', () => {
  for (const lane of lanes) {
    assert.equal(namesReleaseLane(lane, lanes), true, lane);
  }
});

test('the three lanes that do not contain the word "lane" were refused by the old rule', () => {
  for (const lane of ['internal-admin', 'public-demo', 'experimental']) {
    assert.ok(lanes.includes(lane));
    assert.equal(/lane\b/.test(lane), false, `precondition: the old rule refused ${lane}`);
    assert.equal(namesReleaseLane(lane, lanes), true, lane);
  }
});

test('a lane is recognised in a code span, in prose with spaces, and in any case', () => {
  assert.equal(namesReleaseLane('- Lane: `global-control-lane` (shared behavior).', lanes), true);
  assert.equal(namesReleaseLane('This ships in the global control lane.', lanes), true);
  assert.equal(namesReleaseLane('Lane: Global-Control-Lane', lanes), true);
  assert.equal(namesReleaseLane('Lane: CLIENT-DATA-LANE', lanes), true);
});

test('a lane name embedded in a longer identifier is not a lane', () => {
  assert.equal(namesReleaseLane('the non-experimental default path', lanes), false);
  assert.equal(namesReleaseLane('see `global-control-lane-v2-notes`', lanes), false);
});

test('every lane named in a section is reported, not just the first', () => {
  const body = 'Lanes: `global-control-lane` and `internal-admin`.';
  assert.deepEqual(findReleaseLanesNamed(body, lanes), ['global-control-lane', 'internal-admin']);
});

test('the refusal message states the vocabulary the author has to choose from', () => {
  const [error] = validateLayerImpactLane('r.md', 'Data plane: none', lanes);
  for (const lane of lanes) assert.ok(error.includes(lane), `message omits ${lane}`);
});

// ---------------------------------------------------------------------------
// End to end through the real gate, in a scratch repository.
// ---------------------------------------------------------------------------

function record(layerImpact) {
  return [
    '# Release record',
    '',
    '## Release ID',
    '2026-09-18-scratch-record-for-the-lane-guard-suite',
    '',
    '## Status',
    'proposed',
    '',
    '## Plain-English Summary',
    'A scratch record used by the lane guard suite to drive the real gate end to end.',
    '',
    '## Layer Impact',
    layerImpact,
    '',
    '## Client Applicability',
    'Internal only. No client receives anything from this scratch record.',
    '',
    '## Changes Included',
    'One scratch source file, added so the gate treats this as release relevant.',
    '',
    '## QA / Validation',
    'The lane guard suite runs this record through the real gate and it passed.',
    '',
    '## Rollout Plan',
    'Not rolled out. This record exists only inside a temporary test repository.',
    '',
    '## Deployment Authority',
    'None. Nothing here is deployed by any workflow at any time.',
    '',
    '## Rollback Plan',
    'Delete the temporary directory. Nothing else is affected by this record.',
    '',
    '## Audit Evidence',
    'The assertion in this suite is the evidence; no external artifact exists.',
    '',
    '## Known Gaps',
    'None known. This record is a fixture and is never published anywhere.',
    '',
  ].join('\n');
}

function runGateOn(layerImpact) {
  const dir = mkdtempSync(path.join(tmpdir(), 'release-lane-gate-'));
  try {
    const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' });
    git('init', '-q', '-b', 'main');
    git('config', 'user.email', 'gate@example.invalid');
    git('config', 'user.name', 'Release Lane Gate Suite');

    mkdirSync(path.join(dir, 'scripts', 'release-control'), { recursive: true });
    mkdirSync(path.join(dir, 'docs', 'releases', 'records'), { recursive: true });
    mkdirSync(path.join(dir, 'docs', 'releases', 'templates'), { recursive: true });
    mkdirSync(path.join(dir, 'datasets', 'tenant-inputs'), { recursive: true });
    mkdirSync(path.join(dir, 'src'), { recursive: true });

    for (const file of [
      'check-release-record.mjs',
      'release-record-lane-guard.mjs',
      'release-record-tenant-narrative-guard.mjs',
    ]) {
      cpSync(
        path.join(repoRoot, 'scripts', 'release-control', file),
        path.join(dir, 'scripts', 'release-control', file),
      );
    }
    cpSync(path.join(repoRoot, 'AGENTS.md'), path.join(dir, 'AGENTS.md'));
    cpSync(
      path.join(repoRoot, 'docs', 'releases', 'templates', 'release-record-template.md'),
      path.join(dir, 'docs', 'releases', 'templates', 'release-record-template.md'),
    );
    cpSync(
      path.join(repoRoot, 'datasets', 'tenant-inputs', 'tenant-input-registry.json'),
      path.join(dir, 'datasets', 'tenant-inputs', 'tenant-input-registry.json'),
    );

    writeFileSync(path.join(dir, 'README.md'), '# scratch\n');
    git('add', '-A');
    git('commit', '-q', '-m', 'base');
    const base = git('rev-parse', 'HEAD').trim();

    writeFileSync(path.join(dir, 'src', 'scratch.ts'), 'export const scratch = true;\n');
    writeFileSync(
      path.join(dir, 'docs', 'releases', 'records', '2026-09-18-scratch.md'),
      record(layerImpact),
    );
    git('add', '-A');
    git('commit', '-q', '-m', 'change');

    try {
      const stdout = execFileSync(
        process.execPath,
        ['scripts/release-control/check-release-record.mjs', '--base', base, '--head', 'HEAD'],
        { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
      );
      return { status: 0, output: stdout };
    } catch (error) {
      return {
        status: error.status ?? 1,
        output: `${error.stdout ?? ''}${error.stderr ?? ''}`,
      };
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('the real gate refuses a record whose Layer Impact only says "no data plane"', () => {
  const result = runGateOn('- Data plane: no schema or data changes in this slice at all.');
  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /Layer Impact must name the release lane/);
});

test('the real gate passes a record whose Layer Impact names a declared lane', () => {
  const result = runGateOn('- Lane: `global-control-lane`. Shared control behavior for everyone.');
  assert.equal(result.status, 0, result.output);
  assert.match(result.output, /Release Control Gate passed/);
});

test('the real gate passes a lane that does not contain the word "lane"', () => {
  const result = runGateOn('- Lane: `internal-admin`. Operations capability, nothing client facing.');
  assert.equal(result.status, 0, result.output);
  assert.match(result.output, /Release Control Gate passed/);
});

let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${name}`);
    console.error(`     ${error.message.split('\n').join('\n     ')}`);
  }
}

console.log('');
console.log(`${tests.length - failed} passed, ${failed} failed, ${tests.length} total`);
process.exit(failed > 0 ? 1 : 0);

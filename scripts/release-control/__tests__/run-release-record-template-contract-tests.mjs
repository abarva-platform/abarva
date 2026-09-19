#!/usr/bin/env node

/**
 * Drives the real release-record gate in a scratch repository. The gate and the
 * standing template are one authoring contract: adding, removing, or reordering
 * a required section on either side must be a visible failure.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const templateSource = readFileSync(
  path.join(repoRoot, 'docs', 'releases', 'templates', 'release-record-template.md'),
  'utf8',
);

function runGateWithTemplate(template) {
  const dir = mkdtempSync(path.join(tmpdir(), 'release-template-contract-'));
  try {
    const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' });
    git('init', '-q', '-b', 'main');
    git('config', 'user.email', 'gate@example.invalid');
    git('config', 'user.name', 'Release Template Contract Suite');

    mkdirSync(path.join(dir, 'scripts', 'release-control'), { recursive: true });
    mkdirSync(path.join(dir, 'docs', 'releases', 'templates'), { recursive: true });
    mkdirSync(path.join(dir, 'datasets', 'tenant-inputs'), { recursive: true });

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
      path.join(repoRoot, 'datasets', 'tenant-inputs', 'tenant-input-registry.json'),
      path.join(dir, 'datasets', 'tenant-inputs', 'tenant-input-registry.json'),
    );
    writeFileSync(
      path.join(dir, 'docs', 'releases', 'templates', 'release-record-template.md'),
      template,
    );
    writeFileSync(path.join(dir, 'README.md'), '# scratch\n');
    git('add', '-A');
    git('commit', '-q', '-m', 'scratch');

    try {
      const output = execFileSync(
        process.execPath,
        ['scripts/release-control/check-release-record.mjs', '--base', 'HEAD', '--head', 'HEAD'],
        { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
      );
      return { status: 0, output };
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

const tests = [
  [
    'the standing template satisfies the real gate contract',
    () => {
      const result = runGateWithTemplate(templateSource);
      assert.equal(result.status, 0, result.output);
      assert.match(result.output, /Release record template contract passed/);
    },
  ],
  [
    'removing a required template section fails closed',
    () => {
      const result = runGateWithTemplate(
        templateSource.replace(/\n## Known Gaps\n[\s\S]*$/, '\n'),
      );
      assert.equal(result.status, 1, result.output);
      assert.match(result.output, /missing required section.*Known Gaps/i);
    },
  ],
  [
    'adding a template-only section fails closed',
    () => {
      const result = runGateWithTemplate(`${templateSource}\n## Undeclared Section\n\nText.\n`);
      assert.equal(result.status, 1, result.output);
      assert.match(result.output, /unexpected section.*Undeclared Section/i);
    },
  ],
  [
    'reordering required sections fails closed',
    () => {
      const changed = templateSource
        .replace('## Release ID', '## __STATUS__')
        .replace('## Status', '## Release ID')
        .replace('## __STATUS__', '## Status');
      const result = runGateWithTemplate(changed);
      assert.equal(result.status, 1, result.output);
      assert.match(result.output, /section order/i);
    },
  ],
];

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

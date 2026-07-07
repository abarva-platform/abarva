#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const repoRoot = process.cwd();
const tmp = mkdtempSync(path.join(os.tmpdir(), 'abarva-scaffold-'));

try {
  await mkdir(path.join(tmp, 'docs', 'architecture', 'adr'), { recursive: true });
  await mkdir(path.join(tmp, 'docs', 'releases', 'records'), { recursive: true });
  await mkdir(path.join(tmp, 'docs', 'releases', 'templates'), { recursive: true });

  execFileSync('node', [
    path.join(repoRoot, 'scripts/scaffold/release-record.mjs'),
    '--root',
    tmp,
    '--date',
    '2026-06-02',
    '--title',
    'Smoke Release',
    '--lane',
    'internal-admin',
  ], { cwd: repoRoot, stdio: 'pipe' });

  const releasePath = path.join(tmp, 'docs/releases/records/2026-06-02-smoke-release.md');
  const release = readFileSync(releasePath, 'utf8');
  assert.match(release, /## Release ID/);
  assert.match(release, /## QA \/ Validation/);
  assert.match(release, /`internal-admin`/);

  execFileSync('node', [
    path.join(repoRoot, 'scripts/scaffold/adr.mjs'),
    '--root',
    tmp,
    '--date',
    '2026-06-02',
    '--title',
    'Smoke Architecture Decision',
  ], { cwd: repoRoot, stdio: 'pipe' });

  const adrPath = path.join(tmp, 'docs/architecture/adr/ADR-0001-smoke-architecture-decision.md');
  const adr = readFileSync(adrPath, 'utf8');
  assert.match(adr, /# ADR-0001 - Smoke Architecture Decision/);
  assert.match(adr, /## Alternatives/);
  assert.match(adr, /## References/);

  console.log('Scaffold smoke passed.');
} finally {
  await rm(tmp, { recursive: true, force: true });
}

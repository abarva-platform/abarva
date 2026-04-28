// OPS6 - Duplicate Slice Preflight Script tests.
//
// Deterministic suite. The script is a Python 3 stdlib-only CLI; we exercise it
// via child_process.execFileSync against fixture build-slices.json files in a
// fresh tmp dir. No network, no manifest mutation, no real slice ids relied on.

import { execFileSync, spawnSync } from 'child_process';
import {
  createHash,
  randomBytes,
} from 'crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';

const SCRIPT_PATH = resolve(
  __dirname,
  '../../../../scripts/integration/check_duplicate_slices.py',
);

const PYTHON = process.env.PYTHON3 ?? 'python3';

type RunResult = {
  status: number | null;
  stdout: string;
  stderr: string;
};

function runScript(args: string[]): RunResult {
  const result = spawnSync(PYTHON, [SCRIPT_PATH, ...args], {
    encoding: 'utf8',
  });
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

function makeManifest(
  dir: string,
  slices: Array<{ id: string; status: string }>,
): string {
  const manifestPath = join(dir, 'build-slices.json');
  const payload = {
    schemaVersion: 1,
    lastUpdated: '2026-04-26',
    lifecycle: ['ready', 'in_progress', 'code_complete', 'verified', 'merged'],
    slices: slices.map((entry) => ({
      id: entry.id,
      name: `Test slice ${entry.id}`,
      category: 'TEST',
      status: entry.status,
      risk: 'low',
      ownerAgent: 'test',
      dependsOn: [],
      allowedFiles: [],
      forbiddenFiles: [],
      acceptanceCriteria: [],
      validationCommands: [],
      notes: 'fixture',
    })),
  };
  writeFileSync(manifestPath, JSON.stringify(payload, null, 2), 'utf8');
  return manifestPath;
}

function sha256OfFile(path: string): string {
  const buf = readFileSync(path);
  return createHash('sha256').update(buf).digest('hex');
}

describe('OPS6 · duplicate-slice-preflight script', () => {
  let workDir: string;

  beforeAll(() => {
    if (!existsSync(SCRIPT_PATH)) {
      throw new Error(`script not found at ${SCRIPT_PATH}`);
    }
    // Sanity: ensure python3 resolves on this machine before the suite runs.
    const probe = spawnSync(PYTHON, ['--version'], { encoding: 'utf8' });
    if (probe.status !== 0) {
      throw new Error(
        `python3 unavailable for OPS6 preflight tests: ${probe.stderr ?? ''}`,
      );
    }
  });

  beforeEach(() => {
    workDir = mkdtempSync(join(tmpdir(), 'ops6-preflight-'));
  });

  afterEach(() => {
    if (workDir && existsSync(workDir)) {
      rmSync(workDir, { recursive: true, force: true });
    }
  });

  it('--help exits 0 and prints usage', () => {
    const out = runScript(['--help']);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('check_duplicate_slices.py');
    expect(out.stdout.toLowerCase()).toContain('slice_id');
  });

  it('treats unknown slice ids as readyToRun and exits 0', () => {
    const manifest = makeManifest(workDir, [
      { id: 'EXISTING', status: 'code_complete' },
    ]);
    const out = runScript([`--manifest=${manifest}`, 'BRAND_NEW']);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain("readyToRun: ['BRAND_NEW']");
    expect(out.stdout).toContain('duplicates: []');
    expect(out.stdout).toContain('blocked: []');
  });

  it('detects code_complete duplicates and exits 2', () => {
    const manifest = makeManifest(workDir, [
      { id: 'DUP1', status: 'code_complete' },
      { id: 'OK1', status: 'ready' },
    ]);
    const out = runScript([`--manifest=${manifest}`, 'DUP1', 'NEW1']);
    expect(out.status).toBe(2);
    expect(out.stdout).toContain('DUP1@code_complete');
    expect(out.stdout).toContain("readyToRun: ['NEW1']");
    expect(out.stdout).toContain('BLOCK');
  });

  it('detects verified slices as duplicates and exits 2', () => {
    const manifest = makeManifest(workDir, [
      { id: 'VER1', status: 'verified' },
    ]);
    const out = runScript([`--manifest=${manifest}`, 'VER1']);
    expect(out.status).toBe(2);
    expect(out.stdout).toContain('VER1@verified');
  });

  it('flags blocked slices with exit 4 unless --allow-blocked', () => {
    const manifest = makeManifest(workDir, [
      { id: 'BLK1', status: 'blocked' },
      { id: 'INPRG', status: 'in_progress' },
    ]);

    const fail = runScript([`--manifest=${manifest}`, 'BLK1']);
    expect(fail.status).toBe(4);
    expect(fail.stdout).toContain('BLK1@blocked');
    expect(fail.stdout).toContain('CAUTION');

    const failInProgress = runScript([`--manifest=${manifest}`, 'INPRG']);
    expect(failInProgress.status).toBe(4);
    expect(failInProgress.stdout).toContain('INPRG@in_progress');

    const allowed = runScript([
      `--manifest=${manifest}`,
      '--allow-blocked',
      'BLK1',
    ]);
    expect(allowed.status).toBe(0);
    expect(allowed.stdout).toContain('PROCEED');
    expect(allowed.stdout).toContain('BLK1@blocked');
  });

  it('--json emits structured JSON with the expected keys and exit code', () => {
    const manifest = makeManifest(workDir, [
      { id: 'DUP_J', status: 'code_complete' },
      { id: 'BLK_J', status: 'blocked' },
    ]);
    const out = runScript([
      `--manifest=${manifest}`,
      '--json',
      'DUP_J',
      'BLK_J',
      'NEW_J',
    ]);
    expect(out.status).toBe(2);

    const parsed = JSON.parse(out.stdout) as Record<string, unknown>;
    expect(Object.keys(parsed).sort()).toEqual(
      [
        'blocked',
        'duplicates',
        'exitCode',
        'manifest',
        'missing',
        'readyToRun',
        'recommendedAction',
      ].sort(),
    );
    expect(parsed.exitCode).toBe(2);
    expect(parsed.readyToRun).toEqual(['NEW_J']);
    expect(parsed.missing).toEqual(['NEW_J']);
    expect(parsed.duplicates).toEqual([
      { id: 'DUP_J', status: 'code_complete' },
    ]);
    expect(parsed.blocked).toEqual([{ id: 'BLK_J', status: 'blocked' }]);
    expect(typeof parsed.recommendedAction).toBe('string');
  });

  it('exits 3 when manifest JSON is malformed', () => {
    const manifestPath = join(workDir, 'build-slices.json');
    writeFileSync(manifestPath, '{ this is not json', 'utf8');
    const out = runScript([`--manifest=${manifestPath}`, 'ANY']);
    expect(out.status).toBe(3);
    // text path writes to stderr; json path puts it on stdout
    expect(out.stderr.toLowerCase()).toContain('manifest');

    const jsonOut = runScript([`--manifest=${manifestPath}`, '--json', 'ANY']);
    expect(jsonOut.status).toBe(3);
    const parsed = JSON.parse(jsonOut.stdout) as Record<string, unknown>;
    expect(parsed.exitCode).toBe(3);
    expect(typeof parsed.error).toBe('string');
  });

  it('exits 3 when manifest path does not exist', () => {
    const missing = join(workDir, 'does-not-exist.json');
    const out = runScript([`--manifest=${missing}`, 'ANY']);
    expect(out.status).toBe(3);
  });

  it('does not mutate the manifest file (sha256 unchanged across runs)', () => {
    const manifest = makeManifest(workDir, [
      { id: 'DUP_M', status: 'code_complete' },
      { id: 'BLK_M', status: 'blocked' },
      { id: 'OK_M', status: 'ready' },
    ]);
    const before = sha256OfFile(manifest);

    runScript([`--manifest=${manifest}`, 'DUP_M']);
    runScript([`--manifest=${manifest}`, '--json', 'BLK_M']);
    runScript([
      `--manifest=${manifest}`,
      '--allow-blocked',
      'BLK_M',
      'NEW_M',
    ]);

    const after = sha256OfFile(manifest);
    expect(after).toBe(before);
  });

  it('sources only stdlib modules and never makes network calls (static check)', () => {
    const src = readFileSync(SCRIPT_PATH, 'utf8');
    expect(src.startsWith('#!/usr/bin/env python3')).toBe(true);

    // Allowed stdlib imports only.
    const importLines = src
      .split('\n')
      .filter(
        (line) => /^\s*(from|import)\s+/.test(line) && !line.includes('#'),
      );
    const stdlibAllowed = new Set([
      '__future__',
      'argparse',
      'json',
      'sys',
      'pathlib',
      'typing',
    ]);
    for (const line of importLines) {
      const match = line.match(/^\s*(?:from|import)\s+([A-Za-z_][A-Za-z0-9_]*)/);
      if (!match) continue;
      expect(stdlibAllowed.has(match[1])).toBe(true);
    }

    // No network, no shell, no file writes from the script.
    expect(src).not.toMatch(/urllib|requests\b|http\.client|socket\b/);
    expect(src).not.toMatch(/subprocess|os\.system|shutil\.move|\.unlink\(/);
    expect(src).not.toMatch(/\bopen\(.*['"][wax]['"]/);
    expect(src).not.toMatch(/write_text\(|write_bytes\(/);
  });

  it('exit code path for a clean ready set is 0 even with mixed manifest', () => {
    const manifest = makeManifest(workDir, [
      { id: 'OTHER_DONE', status: 'code_complete' },
      { id: 'OTHER_BLK', status: 'blocked' },
    ]);
    // We only pass ids that are absent from the manifest: should be exit 0.
    const out = runScript([
      `--manifest=${manifest}`,
      `FRESH_${randomBytes(2).toString('hex').toUpperCase()}`,
    ]);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('PROCEED');
  });
});

// Reference unused imports to keep linters happy in strict configs.
void execFileSync;
void mkdirSync;

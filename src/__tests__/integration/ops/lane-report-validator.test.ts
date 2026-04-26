// OPS7 — Lane SHA / Final Report Validator tests.
//
// Drives the Python validator at scripts/integration/validate_lane_report.py
// via child_process.execFileSync. Confirms exit codes, JSON output shape,
// docs-only Jest waiver, and that the validator does not mutate the report
// it reads (sha256 before / after).

import { execFileSync } from 'child_process';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as typeof import('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const os = require('os') as typeof import('os');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path') as typeof import('path');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const crypto = require('crypto') as typeof import('crypto');

const VALIDATOR = path.resolve(
  __dirname,
  '../../../../scripts/integration/validate_lane_report.py',
);

interface RunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

function runValidator(args: string[]): RunResult {
  try {
    const stdout = execFileSync('python3', [VALIDATOR, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { exitCode: 0, stdout, stderr: '' };
  } catch (err) {
    const e = err as {
      status?: number;
      stdout?: Buffer | string;
      stderr?: Buffer | string;
    };
    return {
      exitCode: typeof e.status === 'number' ? e.status : 1,
      stdout: e.stdout ? e.stdout.toString() : '',
      stderr: e.stderr ? e.stderr.toString() : '',
    };
  }
}

function sha256OfFile(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function makeTempReport(name: string, body: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ops7-lane-report-'));
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, body, 'utf8');
  return filePath;
}

const VALID_REPORT = [
  '# Lane Report',
  '',
  'Lane: Lane C',
  'Slice id: OPS7',
  'Branch: ops/ops7-lane-report-validator',
  'Worktree: /Users/anand/Projects/nexus-ops7',
  '',
  '## B. Files staged',
  '',
  '1. scripts/integration/validate_lane_report.py',
  '2. docs/build/AGENT_SLICE_REPORT_TEMPLATE.md',
  '3. src/__tests__/integration/ops/lane-report-validator.test.ts',
  '',
  '## D. Validation results',
  '',
  'Tests run: 7 (Jest, all passing)',
  'npm run build: passed',
  '',
  '## F. PRT update',
  '',
  'Tracker updated: yes',
  '',
  '## K. Run Metrics',
  '',
  'Wall time: 12s',
  'Tool calls: 18',
  '',
  'Guardrails: no push, no PR, local commit only.',
  '',
  'LANE-SHA: abc1234',
  '',
].join('\n');

describe('OPS7 · validate_lane_report.py', () => {
  it('valid report exits 0 and reports OK', () => {
    const reportPath = makeTempReport('valid.md', VALID_REPORT);
    const result = runValidator([reportPath]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/lane report validation: OK/);
    expect(result.stdout).toMatch(/slice id\s*:\s*OPS7/);
    expect(result.stdout).toMatch(/lane sha\s*:\s*abc1234/);
  });

  it('missing LANE-SHA exits 2 and lists lane_sha as missing', () => {
    const broken = VALID_REPORT.replace(/LANE-SHA:\s*abc1234\s*\n?/i, '');
    const reportPath = makeTempReport('no-sha.md', broken);
    const result = runValidator(['--json', reportPath]);
    expect(result.exitCode).toBe(2);
    const parsed = JSON.parse(result.stdout) as {
      ok: boolean;
      missing: string[];
      laneSha: string;
    };
    expect(parsed.ok).toBe(false);
    expect(parsed.missing).toContain('lane_sha');
    expect(parsed.laneSha).toBe('');
  });

  it('missing tracker update field exits 2', () => {
    const broken = VALID_REPORT.replace(/Tracker updated:\s*yes\s*\n?/i, '');
    const reportPath = makeTempReport('no-tracker.md', broken);
    const result = runValidator(['--json', reportPath]);
    expect(result.exitCode).toBe(2);
    const parsed = JSON.parse(result.stdout) as {
      ok: boolean;
      missing: string[];
    };
    expect(parsed.ok).toBe(false);
    expect(parsed.missing).toContain('tracker_updated');
  });

  it('docs-only lane is accepted without a Jest count when no .ts/.tsx files staged', () => {
    const docsOnly = [
      '# Lane Report',
      '',
      'Slice id: DOC4',
      'Branch: docs/foo',
      '',
      '## Files staged',
      '',
      '1. docs/build/whatever.md',
      '2. docs/build/build-slices.json',
      '3. docs/build/production-readiness.json',
      '',
      'Tests run: N/A docs only',
      'npm run build: skipped (docs only — no source touched)',
      '',
      'Tracker updated: yes',
      '',
      '## Run Metrics',
      '',
      'Wall time: 4s',
      '',
      'Guardrails: no push, no PR, local commit only.',
      '',
      'LANE-SHA: 0badf00d',
      '',
    ].join('\n');
    const reportPath = makeTempReport('docs-only.md', docsOnly);
    const result = runValidator(['--json', reportPath]);
    expect(result.exitCode).toBe(0);
    const parsed = JSON.parse(result.stdout) as {
      ok: boolean;
      missing: string[];
      sliceId: string;
    };
    expect(parsed.ok).toBe(true);
    expect(parsed.missing).toEqual([]);
    expect(parsed.sliceId).toBe('DOC4');
  });

  it('--json emits a single-line JSON object with the documented shape', () => {
    const reportPath = makeTempReport('json-shape.md', VALID_REPORT);
    const result = runValidator(['--json', reportPath]);
    expect(result.exitCode).toBe(0);
    expect(() => JSON.parse(result.stdout)).not.toThrow();
    const parsed = JSON.parse(result.stdout) as Record<string, unknown>;
    expect(typeof parsed.ok).toBe('boolean');
    expect(Array.isArray(parsed.missing)).toBe(true);
    expect(Array.isArray(parsed.present)).toBe(true);
    expect(typeof parsed.laneSha).toBe('string');
    expect(typeof parsed.sliceId).toBe('string');
    expect(parsed.ok).toBe(true);
    expect((parsed.present as string[]).length).toBeGreaterThanOrEqual(9);
  });

  it('does not mutate the report file (sha256 stable across invocations)', () => {
    const reportPath = makeTempReport('non-mutating.md', VALID_REPORT);
    const before = sha256OfFile(reportPath);
    runValidator([reportPath]);
    runValidator(['--json', reportPath]);
    const after = sha256OfFile(reportPath);
    expect(after).toBe(before);
  });

  it('--help exits 0', () => {
    const result = runValidator(['--help']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/usage:/i);
    expect(result.stdout).toMatch(/--json/);
  });

  it('unreadable report file exits 3', () => {
    const missingPath = path.join(
      os.tmpdir(),
      'ops7-does-not-exist-' + Date.now() + '.md',
    );
    const result = runValidator(['--json', missingPath]);
    expect(result.exitCode).toBe(3);
    expect(() => JSON.parse(result.stdout)).not.toThrow();
    const parsed = JSON.parse(result.stdout) as {
      ok: boolean;
      missing: string[];
    };
    expect(parsed.ok).toBe(false);
    expect(parsed.missing).toContain('report_unreadable');
  });
});

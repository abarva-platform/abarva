// OPS8 - Worktree Cleanup Assistant integration tests.
//
// Deterministic, file-pure suite. Drives the Python script in --fixture mode
// via child_process.execFileSync. The script must:
//   - parse porcelain output
//   - classify by branch pattern
//   - flag stale lanes (> 14 days since last commit)
//   - warn on dirty worktrees
//   - never execute destructive commands
//   - emit valid JSON in --json mode
//   - exit 0 for --help

import { execFileSync } from 'child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

const SCRIPT_PATH = path.resolve(
  __dirname,
  '../../../../scripts/integration/worktree_cleanup_report.py',
);

const ONE_DAY_SECONDS = 86_400;

function nowTs(): number {
  return Math.floor(Date.now() / 1000);
}

function runScript(args: ReadonlyArray<string>): { stdout: string; status: number } {
  try {
    const stdout = execFileSync('python3', [SCRIPT_PATH, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { stdout, status: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: Buffer | string; status?: number };
    const stdout =
      typeof e.stdout === 'string' ? e.stdout : e.stdout ? e.stdout.toString('utf8') : '';
    return { stdout, status: typeof e.status === 'number' ? e.status : 1 };
  }
}

function writeFixture(name: string, body: string): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'ops8-fixture-'));
  const fixturePath = path.join(dir, name);
  writeFileSync(fixturePath, body, 'utf8');
  return fixturePath;
}

// ---------------------------------------------------------------------
// File contract
// ---------------------------------------------------------------------

describe('worktree_cleanup_report.py · file contract', () => {
  const source = readFileSync(SCRIPT_PATH, 'utf8');

  it('script file exists at canonical path', () => {
    expect(source.length).toBeGreaterThan(0);
  });

  it('starts with the python3 shebang', () => {
    expect(source.startsWith('#!/usr/bin/env python3')).toBe(true);
  });

  it('does NOT execute git worktree remove or git branch -D anywhere', () => {
    // The script must only PRINT recommended commands, never invoke them.
    // We assert no subprocess.run / subprocess.call / os.system call carries
    // the destructive verbs as positional argv tokens.
    const lines = source.split('\n');
    const subprocessLines = lines.filter(
      (line) =>
        line.includes('subprocess.run') ||
        line.includes('subprocess.call') ||
        line.includes('subprocess.Popen') ||
        line.includes('subprocess.check_output') ||
        line.includes('os.system') ||
        line.includes('os.execvp'),
    );
    for (const line of subprocessLines) {
      expect(line).not.toMatch(/['"]worktree['"]\s*,\s*['"]remove['"]/);
      expect(line).not.toMatch(/['"]branch['"]\s*,\s*['"]-D['"]/);
    }
    // Script must only invoke whitelisted read-only git verbs.
    for (const line of subprocessLines) {
      const allowed =
        line.includes("'git'") || line.includes('"git"') ? line : '';
      if (allowed) {
        expect(allowed).not.toMatch(/['"]rm['"]|['"]reset['"]|['"]push['"]/);
      }
    }
  });

  it('imports only stdlib modules (no third-party runtime deps)', () => {
    // Match only real top-level imports:
    //   `import X` or `import X as Y`
    //   `from X import ...`
    // This avoids matching prose lines inside the module docstring.
    const importPattern =
      /^(?:import\s+([A-Za-z_][A-Za-z0-9_]*)|from\s+([A-Za-z_][A-Za-z0-9_.]*)\s+import\s)/;
    const allowed = new Set([
      'argparse',
      'json',
      'subprocess',
      'sys',
      'pathlib',
      'datetime',
      '__future__',
    ]);
    const lines = source.split('\n');
    for (const line of lines) {
      const match = importPattern.exec(line);
      if (!match) continue;
      const moduleName = match[1] || match[2] || '';
      const root = moduleName.split('.')[0];
      expect(allowed.has(root)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// --help
// ---------------------------------------------------------------------

describe('worktree_cleanup_report.py · --help', () => {
  it('exits 0 and prints usage', () => {
    const { stdout, status } = runScript(['--help']);
    expect(status).toBe(0);
    expect(stdout).toContain('usage:');
    expect(stdout).toContain('--json');
    expect(stdout).toContain('--fixture');
  });

  it('-h is accepted as a short alias', () => {
    const { stdout, status } = runScript(['-h']);
    expect(status).toBe(0);
    expect(stdout).toContain('usage:');
  });
});

// ---------------------------------------------------------------------
// Porcelain parsing + classification
// ---------------------------------------------------------------------

describe('worktree_cleanup_report.py · porcelain parsing + classification', () => {
  it('classifies main, codex/, lane prefixes, and unknown branches', () => {
    const fixture = [
      'worktree /tmp/nexus-main',
      'HEAD aaaa',
      'branch refs/heads/main',
      '',
      'worktree /tmp/nexus-codex',
      'HEAD bbbb',
      'branch refs/heads/codex/integration-batch-1',
      '',
      'worktree /tmp/nexus-pack',
      'HEAD cccc',
      'branch refs/heads/pack/foo-bar',
      `last_commit_ts ${nowTs() - ONE_DAY_SECONDS * 3}`,
      '',
      'worktree /tmp/nexus-night',
      'HEAD dddd',
      'branch refs/heads/night/baz',
      `last_commit_ts ${nowTs() - ONE_DAY_SECONDS * 2}`,
      '',
      'worktree /tmp/nexus-misc',
      'HEAD eeee',
      'branch refs/heads/misc/whatever',
      '',
      '',
    ].join('\n');
    const fixturePath = writeFixture('classify.porcelain', fixture);

    const { stdout, status } = runScript(['--json', `--fixture=${fixturePath}`]);
    expect(status).toBe(0);
    const parsed = JSON.parse(stdout) as {
      schemaVersion: number;
      destructive: boolean;
      rows: ReadonlyArray<{
        path: string;
        branch: string;
        classification: string;
        recommendedCommand: string;
      }>;
    };
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.destructive).toBe(false);
    expect(parsed.rows.length).toBe(5);

    const byBranch = new Map(parsed.rows.map((r) => [r.branch, r]));
    expect(byBranch.get('main')?.classification).toBe('active-main');
    expect(byBranch.get('codex/integration-batch-1')?.classification).toBe(
      'active-integration',
    );
    expect(byBranch.get('pack/foo-bar')?.classification).toBe('lane-worktree');
    expect(byBranch.get('night/baz')?.classification).toBe('lane-worktree');
    expect(byBranch.get('misc/whatever')?.classification).toBe('unknown');

    expect(byBranch.get('main')?.recommendedCommand).toContain('do not remove');
    expect(byBranch.get('codex/integration-batch-1')?.recommendedCommand).toContain(
      'do not remove',
    );
  });

  it('flags lane branches older than 14 days as stale-lane', () => {
    const fixture = [
      'worktree /tmp/nexus-stale',
      'HEAD aaaa',
      'branch refs/heads/loop/old-experiment',
      `last_commit_ts ${nowTs() - ONE_DAY_SECONDS * 30}`,
      'on_origin true',
      '',
      'worktree /tmp/nexus-fresh',
      'HEAD bbbb',
      'branch refs/heads/loop/fresh-experiment',
      `last_commit_ts ${nowTs() - ONE_DAY_SECONDS * 1}`,
      '',
      '',
    ].join('\n');
    const fixturePath = writeFixture('stale.porcelain', fixture);

    const { stdout, status } = runScript(['--json', `--fixture=${fixturePath}`]);
    expect(status).toBe(0);
    const parsed = JSON.parse(stdout) as {
      rows: ReadonlyArray<{
        branch: string;
        classification: string;
        lastCommitDays: number;
        recommendedCommand: string;
      }>;
    };
    const stale = parsed.rows.find((r) => r.branch === 'loop/old-experiment');
    const fresh = parsed.rows.find((r) => r.branch === 'loop/fresh-experiment');
    expect(stale?.classification).toBe('stale-lane');
    expect(stale?.lastCommitDays).toBeGreaterThan(14);
    expect(stale?.recommendedCommand).toContain('git worktree remove --force');
    expect(stale?.recommendedCommand).toContain('git branch -D');
    expect(fresh?.classification).toBe('lane-worktree');
    expect(fresh?.recommendedCommand).not.toContain('git worktree remove');
  });

  it('warns on dirty worktrees and refuses to emit a removal command', () => {
    const fixture = [
      'worktree /tmp/nexus-dirty',
      'HEAD aaaa',
      'branch refs/heads/pack/dirty-lane',
      `last_commit_ts ${nowTs() - ONE_DAY_SECONDS * 60}`,
      'dirty true',
      'on_origin true',
      '',
      '',
    ].join('\n');
    const fixturePath = writeFixture('dirty.porcelain', fixture);

    const { stdout, status } = runScript(['--json', `--fixture=${fixturePath}`]);
    expect(status).toBe(0);
    const parsed = JSON.parse(stdout) as {
      rows: ReadonlyArray<{
        isDirty: boolean;
        recommendedCommand: string;
      }>;
    };
    expect(parsed.rows[0].isDirty).toBe(true);
    expect(parsed.rows[0].recommendedCommand).toContain('warning');
    expect(parsed.rows[0].recommendedCommand).toContain('stash or commit');
    expect(parsed.rows[0].recommendedCommand).not.toContain('git worktree remove --force');
  });

  it('warns when a stale lane branch is missing on origin', () => {
    const fixture = [
      'worktree /tmp/nexus-orphan',
      'HEAD aaaa',
      'branch refs/heads/enterprise/orphan-lane',
      `last_commit_ts ${nowTs() - ONE_DAY_SECONDS * 60}`,
      'on_origin false',
      '',
      '',
    ].join('\n');
    const fixturePath = writeFixture('orphan.porcelain', fixture);

    const { stdout, status } = runScript(['--json', `--fixture=${fixturePath}`]);
    expect(status).toBe(0);
    const parsed = JSON.parse(stdout) as {
      rows: ReadonlyArray<{
        classification: string;
        recommendedCommand: string;
      }>;
    };
    expect(parsed.rows[0].classification).toBe('stale-lane');
    expect(parsed.rows[0].recommendedCommand).toContain('not on origin');
    expect(parsed.rows[0].recommendedCommand).toContain('would lose work');
  });
});

// ---------------------------------------------------------------------
// JSON output shape
// ---------------------------------------------------------------------

describe('worktree_cleanup_report.py · --json output', () => {
  it('emits a parseable JSON envelope with destructive=false and provenance tag', () => {
    const fixture = [
      'worktree /tmp/nexus-main',
      'HEAD aaaa',
      'branch refs/heads/main',
      '',
      '',
    ].join('\n');
    const fixturePath = writeFixture('json-envelope.porcelain', fixture);

    const { stdout, status } = runScript(['--json', `--fixture=${fixturePath}`]);
    expect(status).toBe(0);
    const parsed = JSON.parse(stdout) as {
      schemaVersion: number;
      createdFrom: string;
      destructive: boolean;
      rows: ReadonlyArray<{ createdFrom: string }>;
    };
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.createdFrom).toBe('ops8_worktree_cleanup_report');
    expect(parsed.destructive).toBe(false);
    expect(parsed.rows.length).toBe(1);
    expect(parsed.rows[0].createdFrom).toBe('ops8_worktree_cleanup_report');
  });

  it('text mode (no --json) produces human-readable output without executing commands', () => {
    const fixture = [
      'worktree /tmp/nexus-main',
      'HEAD aaaa',
      'branch refs/heads/main',
      '',
      '',
    ].join('\n');
    const fixturePath = writeFixture('text-mode.porcelain', fixture);

    const { stdout, status } = runScript([`--fixture=${fixturePath}`]);
    expect(status).toBe(0);
    expect(stdout).toContain('OPS8 Worktree Cleanup Report');
    expect(stdout).toContain('READ-ONLY');
    expect(stdout).toContain('classification: active-main');
  });
});

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
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

const SCRIPT_PATH = path.resolve(
  __dirname,
  '../../../../scripts/integration/worktree_cleanup_report.py',
);

const OBSERVER_PATH = path.resolve(
  __dirname,
  '../../../../scripts/integration/observe_python_run.py',
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

/**
 * Item T-774. This describe block asked four questions of the script's BYTES:
 * that the file is non-empty, that it starts with the shebang, that no line
 * containing `subprocess.run` also contains a destructive git verb, and that
 * every import line names an allowed module.
 *
 * The third was the one that mattered and the one least able to answer. It is
 * a per-LINE scan for a two-token literal, so an argv built in a variable,
 * split across lines, or assembled from parts reads as clean — and the whole
 * check is vacuous on the default code path, which no case in this file ever
 * ran. The destructive-command question is about what the script EXECUTES, so
 * it is answered by executing it with a recording `git` on PATH.
 *
 * The remaining three are answered the same way: the file's existence and its
 * shebang by invoking the script directly rather than through `python3`, and
 * its dependencies by `observe_python_run.py`, which reports the modules the
 * run actually added instead of the import lines it happens to spell out.
 */
describe('worktree_cleanup_report.py · what it executes', () => {
  /**
   * The read-only git verbs the script is allowed to invoke, as argv prefixes.
   * A verb not on this list fails the case by name rather than by pattern, so
   * a new call site has to be declared here rather than slipping past a
   * negative regular expression.
   */
  const ALLOWED_GIT_INVOCATIONS = [
    ['worktree', 'list', '--porcelain'],
    ['log', '-1'],
    ['status', '--short'],
    ['ls-remote', '--heads', 'origin'],
  ];

  function isAllowed(argv: string[]): boolean {
    // `-C <path>` is a global flag the script uses before `status`.
    const tokens = argv[0] === '-C' ? argv.slice(2) : argv;
    return ALLOWED_GIT_INVOCATIONS.some((prefix) =>
      prefix.every((token, index) => tokens[index] === token),
    );
  }

  /**
   * Put a recording stub named `git` first on PATH, run the script in its
   * DEFAULT mode — the code path `--fixture` exists to avoid, and the one no
   * other case in this file reaches — and return every argv it invoked.
   */
  function gitInvocationsFromDefaultMode(): { argv: string[][]; status: number } {
    const dir = mkdtempSync(path.join(tmpdir(), 'ops8-gitstub-'));
    const logPath = path.join(dir, 'git-argv.log');
    const stubPath = path.join(dir, 'git');
    writeFileSync(
      stubPath,
      [
        '#!/bin/sh',
        `printf '%s\\n' "$*" >> "${logPath}"`,
        'case "$1" in',
        '  worktree)',
        '    printf "worktree /repo/main\\nHEAD 1111111111111111111111111111111111111111\\nbranch refs/heads/main\\n\\nworktree /repo/wt-lane\\nHEAD 2222222222222222222222222222222222222222\\nbranch refs/heads/codex/lane-a\\n\\n" ;;',
        '  log) printf "%s\\n" "$(date +%s)" ;;',
        '  ls-remote) printf "2222222222222222222222222222222222222222\\trefs/heads/codex/lane-a\\n" ;;',
        '  *) : ;;',
        'esac',
        'exit 0',
      ].join('\n') + '\n',
      { encoding: 'utf8', mode: 0o755 },
    );

    let status = 0;
    try {
      execFileSync(SCRIPT_PATH, ['--json'], {
        encoding: 'utf8',
        cwd: dir,
        env: { ...process.env, PATH: `${dir}:${process.env.PATH ?? ''}` },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (err: unknown) {
      status = (err as { status?: number }).status ?? 1;
    }

    const logged = existsSync(logPath) ? readFileSync(logPath, 'utf8') : '';
    const argv = logged
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => line.trim().split(/\s+/));
    return { argv, status };
  }

  it('runs from its own shebang, without an interpreter named on the command line', () => {
    // Replaces two byte assertions: that the file is non-empty, and that it
    // starts with `#!/usr/bin/env python3`. A wrong shebang or a missing
    // execute bit fails here; a correct one that no longer resolves does too.
    const stdout = execFileSync(SCRIPT_PATH, ['--help'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    expect(stdout).toContain('worktree_cleanup_report.py');
  });

  it('invokes git in its default mode, so the next assertion is not vacuous', () => {
    // The guardrail for the case below. If the script stopped shelling out, or
    // the stub stopped being reached, "no destructive command was run" would
    // be true for the wrong reason and nothing would say so.
    const { argv } = gitInvocationsFromDefaultMode();
    expect(argv.length).toBeGreaterThan(0);
    expect(argv.some((call) => call[0] === 'worktree')).toBe(true);
  });

  it('executes only read-only git verbs — never worktree remove, branch -D, reset or push', () => {
    const { argv } = gitInvocationsFromDefaultMode();
    const disallowed = argv.filter((call) => !isAllowed(call));
    expect(disallowed.map((call) => call.join(' '))).toEqual([]);
  });

  it('adds no non-stdlib dependency and attempts no network call', () => {
    // Replaces the import-line allow-list. Observed at run time, so a
    // dependency loaded through `__import__` or on one branch only is named.
    const dir = mkdtempSync(path.join(tmpdir(), 'ops8-observe-'));
    const fixture = writeFixture(
      'porcelain.txt',
      'worktree /repo/main\nHEAD 1111111111111111111111111111111111111111\nbranch refs/heads/main\n\n',
    );

    for (const [index, args] of [['--help'], [`--fixture=${fixture}`], [`--fixture=${fixture}`, '--json']].entries()) {
      const observationPath = path.join(dir, `observation-${index}.json`);
      execFileSync(
        'python3',
        [OBSERVER_PATH, '--observation', observationPath, '--', SCRIPT_PATH, ...args],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
      );
      const observed = JSON.parse(readFileSync(observationPath, 'utf8')) as {
        nonStdlibModules: string[];
        networkAttempts: string[];
      };
      expect(observed.nonStdlibModules).toEqual([]);
      expect(observed.networkAttempts).toEqual([]);
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

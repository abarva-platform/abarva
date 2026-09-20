// T-071 — the mandatory PR hygiene gate must judge exit codes, not greps.
//
// `.github/workflows/hygiene-gate.yml` runs `scripts/integration/hygiene_gate.sh`
// on every pull request, so a check in it that cannot fail is a check nobody has.
// Four such checks were measured on `e4b17755a`:
//
//   * the typecheck grepped for `error TS` in output that a V8 out-of-memory
//     crash never produces, so a crashed run printed `[PASS] TypeScript clean`;
//   * the secret-hygiene check grepped for `Tests:.*passed`, which jest's
//     `8 failed, 53 passed` summary satisfies;
//   * a missing manifest and a missing secret-hygiene test each printed `pass`;
//   * the stash check's failure branch was also a `pass`.
//
// This suite drives the REAL script rather than reading its source. The existing
// `src/__tests__/integration/ops/hygiene-gate-contract.test.ts` asserts that the
// script *contains* certain strings; a string is not a behaviour, and every one
// of the four defects above was present while that suite was green.
//
// Mechanism: the script derives its repo root from its own location
// (`dirname $BASH_SOURCE/../..`), so copying it into a scratch git repository
// makes that scratch tree the subject. `npx` and `python3` are replaced by PATH
// shims that emit scripted output and exit codes, which is how a crashing
// typecheck and a failing jest run are reproduced deterministically without
// running either for real. `node` and `git` are left real.

import { execFileSync } from 'child_process';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  copyFileSync,
  rmSync,
  chmodSync,
} from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';

const GATE_SOURCE = join(process.cwd(), 'scripts/integration/hygiene_gate.sh');
const REPORT_SOURCE = join(process.cwd(), 'scripts/integration/hygiene_gate_report.sh');
const SECRET_HYGIENE_TEST = 'src/__tests__/integration/qa/secret-hygiene-patterns.test.ts';

interface ShimPlan {
  /** Exit code `npx tsc` should return. */
  tscExit: number;
  /** Text `npx tsc` should emit (stdout+stderr combined). */
  tscOutput: string;
  /** Exit code `npx jest` should return. */
  jestExit: number;
  /** Text `npx jest` should emit. */
  jestOutput: string;
  /** JSON `stash_safety_check.py --json` should emit. */
  stashJson: string;
  /** Exit code the stash script should return. */
  stashExit: number;
}

const CLEAN_PLAN: ShimPlan = {
  tscExit: 0,
  tscOutput: '',
  jestExit: 0,
  jestOutput: 'Tests:       12 passed, 12 total\n',
  stashJson: '{"isSafeToIntegrate":true,"stashesFromOtherBranches":0,"stashes":[]}',
  stashExit: 0,
};

/** A scratch repository the gate can run against, plus the shims it will see. */
interface ScratchOptions {
  /** Paths the scratch repo must NOT contain, to exercise the missing-subject branches. */
  omit?: ReadonlyArray<string>;
  /** Raw file bodies that replace a manifest's default, keyed by repo-relative path. */
  manifests?: Readonly<Record<string, string>>;
}

function makeScratchRepo(
  plan: Partial<ShimPlan> = {},
  options: ScratchOptions = {},
): string {
  const full: ShimPlan = { ...CLEAN_PLAN, ...plan };
  const omit = new Set(options.omit ?? []);
  const root = mkdtempSync(join(tmpdir(), 'hygiene-gate-'));

  const write = (rel: string, body: string) => {
    if (omit.has(rel)) return;
    const abs = join(root, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, body);
  };

  // The three manifests section 2 reads. Shapes are the minimum the gate parses.
  // A case may replace any of them outright, including with text that is not JSON.
  const manifests = options.manifests ?? {};
  const manifest = (rel: string, fallback: string) =>
    write(rel, Object.prototype.hasOwnProperty.call(manifests, rel) ? manifests[rel] : fallback);

  manifest('docs/build/build-slices.json', JSON.stringify({ slices: [{ id: 'A-1' }] }));
  manifest('docs/build/production-readiness.json', JSON.stringify({ components: [] }));
  manifest('docs/build/build-waves.json', JSON.stringify({ waves: [] }));
  write(SECRET_HYGIENE_TEST, '// scratch subject; the shimmed jest decides the result\n');

  // The real script, at the path it derives its repo root from.
  mkdirSync(join(root, 'scripts/integration'), { recursive: true });
  copyFileSync(GATE_SOURCE, join(root, 'scripts/integration/hygiene_gate.sh'));
  // The gate sources its reporting from a sibling file. The fixture copied
  // one file because the gate used to be one file; without this the gate
  // refuses to run, which is the behaviour it should have -- but it is not
  // the behaviour these cases are here to measure.
  copyFileSync(REPORT_SOURCE, join(root, 'scripts/integration/hygiene_gate_report.sh'));

  if (!omit.has('stash')) {
    const stash = join(root, 'scripts/integration/stash_safety_check.py');
    writeFileSync(stash, '#!/usr/bin/env python3\n');
    chmodSync(stash, 0o755);
  }

  // PATH shims. `npx` dispatches on its first argument so one file covers both
  // the typecheck and the jest run; `python3` stands in for the stash script.
  const bin = join(root, '.shim-bin');
  mkdirSync(bin, { recursive: true });
  const shim = (name: string, body: string) => {
    const abs = join(bin, name);
    writeFileSync(abs, `#!/usr/bin/env bash\n${body}\n`);
    chmodSync(abs, 0o755);
  };
  shim(
    'npx',
    [
      'tool="$1"; shift',
      'case "$tool" in',
      `  tsc) printf '%s' ${JSON.stringify(full.tscOutput)}; exit ${full.tscExit} ;;`,
      `  jest) printf '%s' ${JSON.stringify(full.jestOutput)}; exit ${full.jestExit} ;;`,
      '  *) exit 0 ;;',
      'esac',
    ].join('\n'),
  );
  shim('python3', `printf '%s' ${JSON.stringify(full.stashJson)}; exit ${full.stashExit}`);

  // Section 1 runs git; a clean committed tree keeps it out of the way.
  const git = (...args: string[]) =>
    execFileSync('git', args, { cwd: root, stdio: 'pipe', encoding: 'utf8' });
  git('init', '-q');
  git('config', 'user.email', 'gate@example.invalid');
  git('config', 'user.name', 'Gate Fixture');
  git('add', '-A');
  git('commit', '-q', '-m', 'scratch');

  return root;
}

interface GateRun {
  stdout: string;
  exitCode: number;
  /** Every `[PASS] …` / `[FAIL] …` / `[WARN] …` line, in order. */
  lines: ReadonlyArray<string>;
}

function runGate(root: string): GateRun {
  const bin = join(root, '.shim-bin');
  let stdout = '';
  let exitCode = 0;
  try {
    stdout = execFileSync('bash', ['scripts/integration/hygiene_gate.sh', '--skip-build'], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, PATH: `${bin}:${process.env.PATH ?? ''}` },
    });
  } catch (err) {
    const e = err as { stdout?: string; status?: number };
    stdout = e.stdout ?? '';
    exitCode = typeof e.status === 'number' ? e.status : 1;
  }
  const lines = stdout
    .split('\n')
    .filter((l) => /^\[(PASS|FAIL|WARN)\]/.test(l))
    .map((l) => l.trim());
  return { stdout, exitCode, lines };
}

/** The gate's verdict on the one check whose label contains `needle`. */
function verdictFor(run: GateRun, needle: string): string {
  const hit = run.lines.filter((l) => l.toLowerCase().includes(needle.toLowerCase()));
  if (hit.length === 0) {
    throw new Error(
      `no verdict line mentioning "${needle}". Lines were:\n${run.lines.join('\n')}`,
    );
  }
  if (hit.length > 1) {
    throw new Error(`"${needle}" matched more than one verdict line:\n${hit.join('\n')}`);
  }
  return hit[0].slice(1, hit[0].indexOf(']'));
}

const scratchRoots: string[] = [];
function scratch(plan?: Partial<ShimPlan>, options?: ScratchOptions): string {
  const root = makeScratchRepo(plan, options);
  scratchRoots.push(root);
  return root;
}

afterAll(() => {
  for (const root of scratchRoots) rmSync(root, { recursive: true, force: true });
});

describe('hygiene gate · the typecheck judges the exit code, not the word "error TS"', () => {
  // The defect, reproduced exactly: on this project `npx tsc --noEmit` exits 134
  // with a V8 out-of-memory stack trace and emits no `error TS` line at all.
  const OOM_TRACE = [
    '',
    '<--- Last few GCs --->',
    'FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory',
    '----- Native stack trace -----',
    ' 1: 0x10 node::Abort() [/opt/homebrew/lib/libnode.dylib]',
    '',
  ].join('\n');

  it('fails when the typecheck crashes without emitting a diagnostic', () => {
    const run = runGate(scratch({ tscExit: 134, tscOutput: OOM_TRACE }));
    expect(verdictFor(run, 'TypeScript')).toBe('FAIL');
  });

  it('fails when the typecheck reports real diagnostics', () => {
    const run = runGate(
      scratch({ tscExit: 2, tscOutput: "src/a.ts(1,1): error TS2304: Cannot find name 'x'.\n" }),
    );
    expect(verdictFor(run, 'TypeScript')).toBe('FAIL');
  });

  it('passes when the typecheck exits 0', () => {
    const run = runGate(scratch());
    expect(verdictFor(run, 'TypeScript')).toBe('PASS');
  });

  it('runs the typecheck at the documented heap so it is not crashing by default', () => {
    // The heap option is what makes the difference between a run that reports
    // diagnostics and a run that dies before producing any. Asserted on the
    // script rather than the shim because the shim cannot observe NODE_OPTIONS
    // meaningfully — but a missing option is the mutation that reproduces T-071.
    const source = readFileSync(GATE_SOURCE, 'utf8');
    const typescriptSection = source.slice(source.indexOf('4. TypeScript'));
    const untilNextSection = typescriptSection.slice(0, typescriptSection.indexOf('section "5'));
    expect(untilNextSection).toMatch(/--max-old-space-size=\d+/);
  });
});

describe('hygiene gate · the secret-hygiene check judges the run, not its summary text', () => {
  it('fails on a partially failing suite whose summary still says "passed"', () => {
    const run = runGate(
      scratch({ jestExit: 1, jestOutput: 'Tests:       8 failed, 53 passed, 61 total\n' }),
    );
    expect(verdictFor(run, 'Secret hygiene')).toBe('FAIL');
  });

  it('fails when the suite errors before reporting any summary', () => {
    const run = runGate(scratch({ jestExit: 1, jestOutput: 'Cannot find module\n' }));
    expect(verdictFor(run, 'Secret hygiene')).toBe('FAIL');
  });

  it('passes on a fully green suite', () => {
    const run = runGate(scratch());
    expect(verdictFor(run, 'Secret hygiene')).toBe('PASS');
  });
});

describe('hygiene gate · a declared subject that is missing fails rather than skips', () => {
  it('fails when the wave manifest is absent', () => {
    const run = runGate(scratch({}, { omit: ['docs/build/build-waves.json'] }));
    expect(verdictFor(run, 'build-waves.json')).toBe('FAIL');
  });

  it('fails when the secret-hygiene suite is absent', () => {
    const run = runGate(scratch({}, { omit: [SECRET_HYGIENE_TEST] }));
    expect(verdictFor(run, 'Secret hygiene')).toBe('FAIL');
  });

  it('fails when the stash safety script is absent', () => {
    const run = runGate(scratch({}, { omit: ['stash'] }));
    expect(verdictFor(run, 'stash')).toBe('FAIL');
  });
});

describe('hygiene gate · no check has two passing branches', () => {
  it('does not report "no risky stashes" when the stash script could not be read', () => {
    const run = runGate(scratch({ stashExit: 1, stashJson: 'not json at all' }));
    expect(verdictFor(run, 'stash')).toBe('FAIL');
  });

  it('warns rather than passes when risky stashes are found', () => {
    // A finding is reported as a finding. It does not FAIL because the stash
    // stack is machine-local and shared between worktrees — another agent's
    // entry must not block this repository's pull requests — and it is always
    // empty on a CI runner. What it must never do is print "No risky stashes".
    const run = runGate(
      scratch({
        stashJson:
          '{"isSafeToIntegrate":false,"stashesFromOtherBranches":92,"stashes":[{"index":0}]}',
      }),
    );
    expect(verdictFor(run, 'stash')).toBe('WARN');
  });

  it('passes only when the stash check actually looked and found nothing', () => {
    const run = runGate(scratch());
    expect(verdictFor(run, 'stash')).toBe('PASS');
  });
});

describe('hygiene gate · the stash contract names fields the real script emits', () => {
  // The original check read `riskyStashes`, which stash_safety_check.py has
  // never produced, so `d.riskyStashes && d.riskyStashes.length > 0` was always
  // false and the gate printed "No risky stashes" unconditionally. A fixture
  // alone could not catch that — it would simply have agreed with the code. So
  // this case runs the REAL script and holds the gate to its actual output.
  it('reads a field the real stash_safety_check.py actually reports', () => {
    const raw = execFileSync(
      'python3',
      [join(process.cwd(), 'scripts/integration/stash_safety_check.py'), '--json'],
      { cwd: process.cwd(), encoding: 'utf8' },
    );
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    expect(typeof parsed.isSafeToIntegrate).toBe('boolean');

    const gate = readFileSync(GATE_SOURCE, 'utf8');
    const stashSection = gate.slice(gate.indexOf('6. Stash hygiene'));
    expect(stashSection).toContain('isSafeToIntegrate');
    // Any field the gate reads off the report must be one the report has.
    const readFields = [...stashSection.matchAll(/\bd\.([A-Za-z_][A-Za-z0-9_]*)/g)].map(
      (m) => m[1],
    );
    expect(readFields.length).toBeGreaterThan(0);
    for (const field of new Set(readFields)) {
      expect(Object.keys(parsed)).toContain(field);
    }
  });
});

// T-072 — the four remaining checks built on `<command> | grep -q ok`.
//
// The item recorded them as unmeasured rather than as wrong, and the measurement
// splits them. The three JSON-validity checks send stderr to /dev/null, so the
// only thing that can reach the pipe is the literal `ok` the success path prints
// — a closed set of two outcomes, and the idiom is correct there by direction.
//
// The duplicate-slice check is not. It captures stderr with `2>&1`, discards the
// `process.exit(1)` its own node program uses to signal duplicates, and then
// searches the combined output for the substring `ok`. Any duplicated slice id
// that happens to CONTAIN those two letters is printed in the failure message
// and read back as the success token: measured on `1074721679`, a manifest with
// `booking-flow` twice makes the gate print `[PASS] No duplicate slice IDs`.
//
// Today every id in `docs/build/build-slices.json` is `S<n>`, so the defect is
// latent rather than live. A check that is correct only because no subject has
// yet been named with the wrong letters is the same vacuity class as T-071.
const SLICES = 'docs/build/build-slices.json';

describe('hygiene gate · the duplicate-slice check judges the result, not the letters in it', () => {
  it('reports a duplicate whose id contains the success token', () => {
    const run = runGate(
      scratch(undefined, {
        manifests: {
          [SLICES]: JSON.stringify({ slices: [{ id: 'booking-flow' }, { id: 'booking-flow' }] }),
        },
      }),
    );
    expect(verdictFor(run, 'duplicate slice')).toBe('FAIL');
  });

  it('reports a duplicate whose id does not contain it', () => {
    const run = runGate(
      scratch(undefined, {
        manifests: { [SLICES]: JSON.stringify({ slices: [{ id: 'A-1' }, { id: 'A-1' }] }) },
      }),
    );
    expect(verdictFor(run, 'duplicate slice')).toBe('FAIL');
  });

  // The negative control. Without it, "fail whenever the output mentions ok"
  // would pass both cases above, and the check would be vacuous in the other
  // direction — a gate that cannot pass is no more useful than one that cannot
  // fail. A unique id carrying the same two letters must still pass.
  it('passes a manifest whose ids contain the success token but do not repeat', () => {
    const run = runGate(
      scratch(undefined, {
        manifests: {
          [SLICES]: JSON.stringify({ slices: [{ id: 'booking-flow' }, { id: 'booking-search' }] }),
        },
      }),
    );
    expect(verdictFor(run, 'duplicate slice')).toBe('PASS');
  });

  it('fails rather than passes when the manifest has no slices to check', () => {
    const run = runGate(
      scratch(undefined, { manifests: { [SLICES]: JSON.stringify({ notSlices: [] }) } }),
    );
    expect(verdictFor(run, 'duplicate slice')).toBe('FAIL');
  });
});

// These three were measured correct before this change and are pinned so the
// conversion to exit status is provably behaviour-identical rather than assumed
// to be. Each manifest is its own check, so each gets its own invalid case.
describe('hygiene gate · the JSON-validity checks keep their verdicts', () => {
  it.each([
    ['build-slices.json', SLICES, 'build-slices'],
    ['production-readiness.json', 'docs/build/production-readiness.json', 'production-readiness'],
    ['build-waves.json', 'docs/build/build-waves.json', 'build-waves'],
  ])('fails on %s when it is not parseable', (_label, path, needle) => {
    const run = runGate(scratch(undefined, { manifests: { [path]: '{"slices":[' } }));
    expect(verdictFor(run, needle)).toBe('FAIL');
  });

  it('passes all three when every manifest parses', () => {
    const run = runGate(scratch());
    expect(verdictFor(run, 'build-slices')).toBe('PASS');
    expect(verdictFor(run, 'production-readiness')).toBe('PASS');
    expect(verdictFor(run, 'build-waves')).toBe('PASS');
  });
});

describe('hygiene gate · the exit status agrees with the verdicts it printed', () => {
  it('exits non-zero when any check failed', () => {
    const run = runGate(scratch({ tscExit: 134, tscOutput: 'heap out of memory' }));
    expect(run.lines.some((l) => l.startsWith('[FAIL]'))).toBe(true);
    expect(run.exitCode).not.toBe(0);
  });

  it('exits 0 when every check passed', () => {
    const run = runGate(scratch());
    expect(run.lines.some((l) => l.startsWith('[FAIL]'))).toBe(false);
    expect(run.exitCode).toBe(0);
  });

  it('is not vacuous — the fixture exercises every section the gate declares', () => {
    const run = runGate(scratch());
    for (const needle of ['TypeScript', 'Secret hygiene', 'build-waves.json', 'stash']) {
      expect(() => verdictFor(run, needle)).not.toThrow();
    }
    expect(run.lines.length).toBeGreaterThanOrEqual(8);
  });
});

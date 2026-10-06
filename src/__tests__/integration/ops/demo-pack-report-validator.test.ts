/**
 * OPS13 — `scripts/integration/validate_demo_pack_report.py`.
 *
 * Item T-774. This suite used to ask its questions of the script's BYTES. Eight
 * cases read the source and asserted a substring of it (`--help` appears,
 * `--json` appears, `PR number` appears, no `open(..., 'w')`, no `urllib`), and
 * four more tested a `mirrorValidate` function defined in this file — a
 * TypeScript re-implementation of the Python validator. Those four asserted
 * nothing whatever about the script: the mirror accepted a PR number as
 * `/[#]?\d+/`, which matches the `1234` inside a commit sha, while the script
 * requires `#\d+|PR\s*\d+|pull request\s*\d+`. A report the mirror called valid
 * is rejected by the thing that actually runs, and no case could see it.
 *
 * The subject is an executable script with a `--json` envelope and documented
 * exit codes, so every one of those questions is answerable by running it. The
 * byte assertions are DELETED rather than sharpened — a tighter pattern over
 * the same source text is the same defect with a longer fuse.
 *
 * The fixture builder carries its own guard: `withoutSection` asserts that the
 * substring the script looks for is genuinely absent from the report it
 * returns. Without it a "missing section" case can pass while the section is
 * still present under some other word, and the case would be asserting the
 * fixture rather than the validator.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const SCRIPT_PATH = resolve(
  __dirname,
  '../../../../scripts/integration/validate_demo_pack_report.py',
);

const PYTHON = process.env.PYTHON3 ?? 'python3';

/**
 * The sections the script requires, in its own order. This list is the
 * contract under test: every entry gets a case below that removes it and
 * requires the run to fail naming it, so an entry the script stopped checking
 * turns this suite red instead of silently widening what it accepts.
 */
const REQUIRED_SECTIONS = [
  'PR number',
  'merge commit',
  'lanes completed',
  'route',
  'readiness',
  'hygiene gate',
  'CI',
  'Vercel',
  'build',
  'Run Metrics',
  'next',
] as const;

/**
 * One line per required section, so a case can drop exactly one. Kept free of
 * incidental occurrences of the other section names — `withoutSection` fails
 * loudly if that ever stops being true.
 */
const REPORT_LINES: ReadonlyArray<readonly [(typeof REQUIRED_SECTIONS)[number], string]> = [
  ['PR number', 'PR number: #4212'],
  ['merge commit', 'merge commit: 70184306ed3f5800fbda74af30c17e5477573fa8'],
  ['lanes completed', 'lanes completed: LIVE1, LIVE2, LIVE3'],
  ['route', 'route coverage: all twelve verified'],
  ['readiness', 'readiness updated: yes'],
  ['hygiene gate', 'hygiene gate: PASS — git diff --check clean, conflict marker scan clean, JSON manifests valid, tsc exit 0, eslint 0 warnings'],
  ['CI', 'CI: green'],
  ['Vercel', 'Vercel: deployed'],
  ['build', 'build: success'],
  ['Run Metrics', 'Run Metrics: elapsed 45m, subagent count 8, test count 200'],
  ['next', 'next recommended pack: Wave 14'],
];

function assembleReport(lines: ReadonlyArray<readonly [string, string]>): string {
  return `# Final Report\n\n${lines.map(([, text]) => text).join('\n')}\n`;
}

const VALID_REPORT = assembleReport(REPORT_LINES);

/**
 * Drop one section and PROVE it is gone. A fixture that still contains the
 * substring would make the case pass for the wrong reason.
 */
function withoutSection(section: string): string {
  const report = assembleReport(REPORT_LINES.filter(([name]) => name !== section));
  if (report.toLowerCase().includes(section.toLowerCase())) {
    throw new Error(
      `fixture is lying: '${section}' still appears after removing its line. ` +
        'Another line now contains it; change that line, do not loosen this guard.',
    );
  }
  return report;
}

type Run = { status: number | null; stdout: string; stderr: string };

let workDir: string;

beforeAll(() => {
  const probe = spawnSync(PYTHON, ['--version'], { encoding: 'utf8' });
  if (probe.status !== 0) {
    throw new Error(`python3 unavailable: ${probe.stderr ?? ''}`);
  }
});

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'ops13-demo-pack-'));
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
});

function run(args: string[]): Run {
  const result = spawnSync(PYTHON, [SCRIPT_PATH, ...args], { encoding: 'utf8' });
  return { status: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

/** Write a report into the per-case tmp dir and validate it. */
function validate(content: string, extra: string[] = []): Run {
  const reportPath = join(workDir, 'final-report.md');
  writeFileSync(reportPath, content, 'utf8');
  return run([reportPath, ...extra]);
}

type Envelope = {
  valid: boolean;
  errorCount: number;
  warningCount: number;
  errors: string[];
  warnings: string[];
  wordCount: number;
  checkedSections: string[];
  file?: string;
  error?: string;
};

function validateJson(content: string): { run: Run; body: Envelope } {
  const result = validate(content, ['--json']);
  return { run: result, body: JSON.parse(result.stdout) as Envelope };
}

describe('validate_demo_pack_report.py · --help', () => {
  it('exits 0 and names every section it will require', () => {
    const result = run(['--help']);
    expect(result.status).toBe(0);
    for (const section of REQUIRED_SECTIONS) {
      expect(result.stdout).toContain(section);
    }
    expect(result.stdout).toContain('Usage');
  });
});

describe('validate_demo_pack_report.py · argument handling', () => {
  it('exits 1 with a usage message when given no report file', () => {
    const result = run([]);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('No report file provided');
  });

  it('exits 1 and reports the error in the envelope when --json is used with no file', () => {
    const result = run(['--json']);
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout).error).toContain('No report file provided');
  });

  it('exits 1 and names the path when the report file does not exist', () => {
    const missing = join(workDir, 'absent.md');
    const text = run([missing]);
    expect(text.status).toBe(1);
    expect(text.stdout).toContain(missing);

    const json = run([missing, '--json']);
    expect(json.status).toBe(1);
    const body = JSON.parse(json.stdout) as Envelope;
    expect(body.valid).toBe(false);
    expect(body.error).toContain(missing);
  });
});

describe('validate_demo_pack_report.py · accepting a complete report', () => {
  it('exits 0 and reports no errors', () => {
    const { run: result, body } = validateJson(VALID_REPORT);
    expect(result.status).toBe(0);
    expect(body.valid).toBe(true);
    expect(body.errorCount).toBe(0);
    expect(body.errors).toEqual([]);
  });

  it('echoes the file it validated and the sections it checked', () => {
    const { body } = validateJson(VALID_REPORT);
    expect(body.file).toBe(join(workDir, 'final-report.md'));
    expect(body.checkedSections).toEqual([...REQUIRED_SECTIONS]);
  });

  it('prints VALID on the text path without emitting an ERROR line', () => {
    const result = validate(VALID_REPORT);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Result: VALID');
    expect(result.stdout).not.toContain('[ERROR]');
  });
});

describe('validate_demo_pack_report.py · rejecting an incomplete report', () => {
  /**
   * Table-driven over the contract itself. A section the script quietly stopped
   * requiring turns exactly one of these red, which a substring scan of the
   * source could never do — the constant would still be in the file.
   */
  it.each([...REQUIRED_SECTIONS])('exits 1 and names %s when that section is missing', (section) => {
    const { run: result, body } = validateJson(withoutSection(section));
    expect(result.status).toBe(1);
    expect(body.valid).toBe(false);
    expect(body.errors).toContain(`Missing required section/field: '${section}'`);
  });

  it('reports every missing section at once rather than stopping at the first', () => {
    const { body } = validateJson('# Final Report\n\nnothing of substance here.\n');
    expect(body.errorCount).toBeGreaterThanOrEqual(REQUIRED_SECTIONS.length);
    for (const section of REQUIRED_SECTIONS) {
      expect(body.errors).toContain(`Missing required section/field: '${section}'`);
    }
  });

  it('prints INVALID and an ERROR line on the text path', () => {
    const result = validate(withoutSection('Run Metrics'));
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('Result: INVALID');
    expect(result.stdout).toContain('[ERROR]');
  });
});

describe('validate_demo_pack_report.py · the PR number pattern', () => {
  /**
   * The case the deleted TypeScript mirror got wrong. Its `/[#]?\d+/` matched
   * the digits inside a commit sha, so it called this report valid; the script
   * requires `#NNN`, `PR NNN` or `pull request NNN` and rejects it.
   */
  it('rejects a report whose only digits are inside a commit sha', () => {
    const lines = REPORT_LINES.map(([name, text]) =>
      name === 'PR number' ? ([name, 'PR number: recorded in the merge log'] as const) : ([name, text] as const),
    );
    const report = assembleReport(lines);
    expect(report).toMatch(/\d/); // digits are present — the sha supplies them
    const { run: result, body } = validateJson(report);
    expect(result.status).toBe(1);
    expect(body.errors).toContain("No PR number found (expected #NNN or 'PR NNN' pattern)");
  });

  it.each([
    ['#4212', 'PR number: #4212'],
    ['PR 4212', 'PR number: PR 4212'],
    ['pull request 4212', 'PR number: pull request 4212'],
  ])('accepts %s', (_label, line) => {
    const lines = REPORT_LINES.map(([name, text]) =>
      name === 'PR number' ? ([name, line] as const) : ([name, text] as const),
    );
    const { body } = validateJson(assembleReport(lines));
    expect(body.errors).not.toContain("No PR number found (expected #NNN or 'PR NNN' pattern)");
  });
});

describe('validate_demo_pack_report.py · warnings are advisory, not fatal', () => {
  it('warns about a short report without rejecting it', () => {
    const { run: result, body } = validateJson(VALID_REPORT);
    expect(body.wordCount).toBeLessThan(200);
    expect(body.warnings.some((w) => w.includes('seems short'))).toBe(true);
    expect(result.status).toBe(0);
    expect(body.valid).toBe(true);
  });

  it('warns about a missing hygiene-gate field without rejecting the report', () => {
    const lines = REPORT_LINES.map(([name, text]) =>
      name === 'hygiene gate' ? ([name, 'hygiene gate: PASS'] as const) : ([name, text] as const),
    );
    const { run: result, body } = validateJson(assembleReport(lines));
    expect(result.status).toBe(0);
    expect(body.valid).toBe(true);
    expect(body.warnings.some((w) => w.includes('eslint'))).toBe(true);
  });

  it('warns about a missing Run Metrics field without rejecting the report', () => {
    const lines = REPORT_LINES.map(([name, text]) =>
      name === 'Run Metrics' ? ([name, 'Run Metrics: recorded'] as const) : ([name, text] as const),
    );
    const { run: result, body } = validateJson(assembleReport(lines));
    expect(result.status).toBe(0);
    expect(body.warnings.some((w) => w.includes('subagent'))).toBe(true);
  });
});

describe('validate_demo_pack_report.py · it does not mutate its input', () => {
  /**
   * Replaces a regular expression over the source looking for `open(..., 'w')`.
   * That pattern could not see a `Path.write_text`, a `shutil` call or a write
   * through any alias; this hashes the file the script was pointed at.
   */
  it('leaves the report byte-identical across text, --json and failing runs', () => {
    const reportPath = join(workDir, 'final-report.md');
    writeFileSync(reportPath, VALID_REPORT, 'utf8');
    const before = createHash('sha256').update(readFileSync(reportPath)).digest('hex');

    run([reportPath]);
    run([reportPath, '--json']);
    const invalidPath = join(workDir, 'invalid.md');
    writeFileSync(invalidPath, withoutSection('CI'), 'utf8');
    run([invalidPath, '--json']);

    const after = createHash('sha256').update(readFileSync(reportPath)).digest('hex');
    expect(after).toBe(before);
  });
});

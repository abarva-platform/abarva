import { execFileSync } from 'node:child_process';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const repoRoot = path.resolve(__dirname, '../../../../');
const scriptPath = path.join(repoRoot, 'scripts/integration/hygiene_gate.sh');

describe('hygiene_gate.sh - contract', () => {
  it('script file exists', () => {
    expect(fs.existsSync(scriptPath)).toBe(true);
  });

  it('script is non-empty', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content.length).toBeGreaterThan(100);
  });

  it('script has shebang line', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content.startsWith('#!/')).toBe(true);
  });

  it('script contains --help flag handling', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('--help');
  });

  it('script contains --skip-build flag', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('--skip-build');
  });

  it('script checks for conflict markers', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('<<<<<<<');
  });

  it('script checks JSON manifests', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('build-slices.json');
    expect(content).toContain('production-readiness.json');
  });

  it('script checks for duplicate slices', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    const hasDupCheck = content.includes('duplicate') || content.includes('DUP');
    expect(hasDupCheck).toBe(true);
  });

  it('script produces a PASS/FAIL verdict', () => {
    // This used to grep the gate for the literal strings 'HYGIENE GATE: PASS'
    // and 'HYGIENE GATE: FAIL'. The verdict moved into a sourced reporting
    // unit so it could be tested by running it, and the grep went red while
    // the behaviour was intact -- which is the tell that it was measuring the
    // text rather than the gate.
    //
    // Run instead. Three arguments, three verdicts, and each one has to be
    // the verdict for that state rather than merely a non-empty string.
    const report = path.join(repoRoot, 'scripts/integration/hygiene_gate_report.sh');
    const verdict = (fails: number, warns: number): string =>
      execFileSync('bash', ['-c', `. "${report}"; hygiene_verdict_line ${fails} ${warns}`], {
        encoding: 'utf8',
      }).trim();

    expect(verdict(0, 0)).toBe('HYGIENE GATE: PASS');
    expect(verdict(1, 0)).toBe('HYGIENE GATE: FAIL');
    // And a run with findings must not be reported as a clean pass.
    expect(verdict(0, 2)).not.toBe('HYGIENE GATE: PASS');
    expect(verdict(0, 2)).toContain('WARNINGS');
  });

  it('script does NOT contain destructive commands', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).not.toContain('git stash pop');
    expect(content).not.toContain('git stash drop');
    expect(content).not.toContain('git push');
    expect(content).not.toContain('rm -rf');
    expect(content).not.toContain('git reset --hard');
  });

  it('script checks TypeScript', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('tsc');
  });
});

describe('hygiene_gate.sh - invocation: --help', () => {
  it('--help exits 0 and prints usage', () => {
    const result = execSync(`bash "${scriptPath}" --help`, { encoding: 'utf8' });
    expect(result).toContain('Usage');
    expect(result).toContain('--skip-build');
  });
});
